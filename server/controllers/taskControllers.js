import nodemailer from 'nodemailer';
import Task from "../models/task.js";
import User from "../models/user.js";

// Function to send email using nodemailer
const sendEmail = async (to, subject, text, htmlContent) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'taskmanager@mamce.org',
      pass: 'smuk ounq nczt ydsv',
    },
  });

  try {
    await transporter.sendMail({
      from: 'taskmanager@mamce.org',
      to,
      subject,
      text,
      html: htmlContent,
    });
    console.log(`Email sent successfully to: ${to}`);
  } catch (error) {
    console.error(`Failed to send email to ${to}:`, error);
  }
};

export const createTask = async (req, res) => {
  try {
    const { userId } = req.user;
    const { title, team, stage, date, priority, assets } = req.body;

    let text = "New task has been assigned to you";
    if (team?.length > 1) {
      text = text + ` and ${team?.length - 1} others.`;
    }

    text =
      text +
      ` The task priority is set at ${priority} priority, so check and act accordingly. The task date is ${new Date(date).toDateString()}. Thank you!!!`;

    const activity = {
      type: "assigned",
      activity: text,
      by: userId,
    };

    const task = await Task.create({
      title,
      team,
      stage: stage.toLowerCase(),
      date,
      priority: priority.toLowerCase(),
      assets,
      activities: activity,
    });

    // Fetch team members' emails and send email notifications
    for (const userId of team) {
      const user = await User.findById(userId);
      if (user && user.email) {
        const emailContent = `
          <h3>New Task Assigned: ${title}</h3>
          <p>${text}</p>
          <p>Task Due Date: ${new Date(date).toDateString()}</p>
        `;

        // Send email to the user
        await sendEmail(user.email, `Task Assigned: ${title}`, text, emailContent);
      }
    }

    res
      .status(200)
      .json({ status: true, task, message: "Task assigned successfully." });
  } catch (error) {
    console.error('Error in creating task or sending emails:', error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const duplicateTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    const newTask = await Task.create({
      ...task,
      title: task.title + " - Duplicate",
    });

    newTask.team = task.team;
    newTask.subTasks = task.subTasks;
    newTask.assets = task.assets;
    newTask.priority = task.priority;
    newTask.stage = task.stage;

    await newTask.save();

    //alert users of the task
    let text = "New task has been assigned to you";
    if (task.team.length > 1) {
      text = text + ` and ${task.team.length - 1} others.`;
    }

    text =
      text +
      ` The task priority is set a ${task.priority
      } priority, so check and act accordingly. The task date is ${task.date.toDateString()}. Thank you!!!`;

    res
      .status(200)
      .json({ status: true, message: "Task duplicated successfully." });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const postTaskActivity = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user; // This assumes user is authenticated and the userId is available
    const { type, activity } = req.body;

    // Find the task by ID and populate the 'team' field to get user details
    const task = await Task.findById(id).populate('team');
    if (!task) {
      return res.status(404).json({ status: false, message: "Task not found" });
    }

    // Prepare the activity data to push into the task
    const data = {
      type,
      activity,
      by: userId,
    };

    // Push the activity to the task's activities array
    task.activities.push(data);
    await task.save();

    // Ensure users are found (task.team should be populated)
    if (!task.team.length) {
      return res.status(404).json({ status: false, message: "No users found for this task" });
    }

    // Prepare the email content
    const subject = `New Task Activity: ${type}`;
    const text = `There is a new activity"${type}": ${activity}`;
    const htmlContent =  `<p>There is a new activity of type <strong>${type}</strong>: ${activity}</p>`;

    // Send email to all users assigned to the task
    for (const user of task.team) {
      if (user.email) { // Ensure the user has an email field
        console.log(`Sending email to: ${user.email}`);
        await sendEmail(user.email, subject, text, htmlContent); // Send email to each user
      }
    }

    // Respond with success message
    res.status(200).json({ status: true, message: "Activity posted successfully." });
  } catch (error) {
    console.log("Error posting task activity:", error);
    res.status(400).json({ status: false, message: error.message });
  }
};

export const dashboardStatistics = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;

    const allTasks = isAdmin
      ? await Task.find({
        isTrashed: false,
      })
        .populate({
          path: "team",
          select: "name role title email",
        })
        .sort({ _id: -1 })
      : await Task.find({
        isTrashed: false,
        team: { $all: [userId] },
      })
        .populate({
          path: "team",
          select: "name role title email",
        })
        .sort({ _id: -1 });

    const users = await User.find({ isActive: true })
      .select("name title role isAdmin createdAt")
      .limit(10)
      .sort({ _id: -1 });

    //   group task by stage and calculate counts
    const groupTaskks = allTasks.reduce((result, task) => {
      const stage = task.stage;

      if (!result[stage]) {
        result[stage] = 1;
      } else {
        result[stage] += 1;
      }

      return result;
    }, {});

    // Group tasks by priority
    const groupData = Object.entries(
      allTasks.reduce((result, task) => {
        const { priority } = task;

        result[priority] = (result[priority] || 0) + 1;
        return result;
      }, {})
    ).map(([name, total]) => ({ name, total }));

    // calculate total tasks
    const totalTasks = allTasks?.length;
    const last10Task = allTasks?.slice(0, 10);

    const data = {
      totalTasks,
      last10Task,
      users: isAdmin ? users : [],
      tasks: groupTaskks,
      graphData: groupData,
    };

    res.status(200).json({
      status: true,
      message: "Successfully",
      ...data,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const getTasks = async (req, res) => {
  try {
    const { stage, isTrashed } = req.query;
    const { userId, isAdmin } = req.user;

    // Define the base query
    let query = { isTrashed: isTrashed === "true" };

    // Admin sees all tasks; Users see only their tasks
    if (!isAdmin) {
      query.team = { $all: [userId] };
    }

    if (stage) {
      if (stage === "overdue") {
        query.date = { $lt: new Date() }; // Filter tasks with date earlier than now
        query.stage = { $in: ["todo", "in progress"] }; // Include only "todo" and "in progress"
      } else {
        query.stage = stage; // Filter tasks by their stage
      }
    }

    // Fetch tasks based on the query
    const tasks = await Task.find(query)
      .populate({
        path: "team",
        select: "name title email",
      })
      .sort({ _id: -1 });

    // Respond with the tasks
    res.status(200).json({
      status: true,
      tasks,
    });
  } catch (error) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

export const getTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id)
      .populate({
        path: "team",
        select: "name title role email",
      })
      .populate({
        path: "activities.by",
        select: "name",
      });

    res.status(200).json({
      status: true,
      task,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const createSubTask = async (req, res) => {
  try {
    const { title, tag, date } = req.body;
    const { id } = req.params;

    // Create new subtask
    const newSubTask = { title, date, tag };

    // Find the parent task
    const task = await Task.findById(id).populate('team', 'email name'); // Populate team field for email addresses

    if (!task) {
      return res
        .status(404)
        .json({ status: false, message: 'Task not found.' });
    }

    // Add the subtask to the task
    task.subTasks.push(newSubTask);
    await task.save();

    // Notify all users in the task's team via email
    const emailPromises = task.team.map((user) => {
      const emailSubject = `More Task Added: ${title}`;
      const emailText = `A new subtask titled "${title}" has been added to the task "${task.title}".`;
      const emailHtml = `
        <p>Hello ${user.name},</p>
        <p>A new subtask titled "<b>${title}</b>" has been added to the task "<b>${task.title}</b>".</p>
        <p>Due Date: ${new Date(date).toLocaleDateString()}</p>
        <p>Tag: ${tag}</p>
        <p>Best Regards,</p>
        <p>Your Task Manager</p>
      `;
      return sendEmail(user.email, emailSubject, emailText, emailHtml);
    });

    // Wait for all emails to be sent
    await Promise.all(emailPromises);

    res.status(200).json({ status: true, message: 'More Task added successfully.' });
  } catch (error) {
    console.error(error);
    res.status(400).json({ status: false, message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, team, stage, priority, assets } = req.body;

    const task = await Task.findById(id);

    task.title = title;
    task.date = date;
    task.priority = priority.toLowerCase();
    task.assets = assets;
    task.stage = stage.toLowerCase();
    task.team = team;

    await task.save();

    res
      .status(200)
      .json({ status: true, message: "Task duplicated successfully." });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const trashTask = async (req, res) => {
  try {
    const { id } = req.params;

    const task = await Task.findById(id);

    task.isTrashed = true;

    await task.save();

    res.status(200).json({
      status: true,
      message: `Task trashed successfully.`,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const deleteRestoreTask = async (req, res) => {
  try {
    const { id } = req.params;
    const { actionType } = req.query;

    if (actionType === "delete") {
      await Task.findByIdAndDelete(id);
    } else if (actionType === "deleteAll") {
      await Task.deleteMany({ isTrashed: true });
    } else if (actionType === "restore") {
      const resp = await Task.findById(id);

      resp.isTrashed = false;
      resp.save();
    } else if (actionType === "restoreAll") {
      await Task.updateMany(
        { isTrashed: true },
        { $set: { isTrashed: false } }
      );
    }

    res.status(200).json({
      status: true,
      message: `Operation performed successfully.`,
    });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};
