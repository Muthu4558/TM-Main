import { response } from "express";
import User from "../models/user.js"
import Task from "../models/task.js";
import { createJWT } from "../config/db.js";
import nodemailer from 'nodemailer';

// Function to send email using nodemailer
const sendEmail = async (to, subject, text, htmlContent) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'muthukdm45@gmail.com',
      pass: 'jyak xyuo bokg qrqf',
    },
  });

  try {
    await transporter.sendMail({
      from: 'muthukdm45@gmail.com',
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

export const registerUser = async (req, res) => {
  try {
    const { name, email, password, isAdmin, role, title } = req.body;

    const userExist = await User.findOne({ email });

    if (userExist) {
      return res.status(400).json({
        status: false,
        message: "User already exists",
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      isAdmin,
      role,
      title,
    });

    if (user) {
      isAdmin ? createJWT(res, user._id) : null;

      user.password = undefined;

      // Send registration email
      const emailContent = `
        <h3>Welcome ${name},</h3>
        <p>Your Nizcare Task Management account has been successfully created.</p>
        <p>We are excited to have you on board. You can now login using your credentials.</p>
      `;
      await sendEmail(user.email, "Welcome to Our Platform", "Your account has been created.", emailContent);

      res.status(201).json(user);
    } else {
      return res
        .status(400)
        .json({ status: false, message: "Invalid user data" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(401)
        .json({ status: false, message: "Invalid email or password." });
    }

    if (!user?.isActive) {
      return res.status(401).json({
        status: false,
        message: "User account has been deactivated, contact the administrator",
      });
    }

    const isMatch = await user.matchPassword(password);

    if (user && isMatch) {
      createJWT(res, user._id);

      user.password = undefined;

      // Send login notification email
      const emailContent = `
        <h3>Hello ${user.name},</h3>
        <p>You have successfully logged into Nizcare Task Management.</p>
        <p>If this was not you, please reset your password immediately.</p>
        <p>If this was not you
        <span>Contact : +91 9898989898</span>
        <span>Mail : demo@gmail.com </span>
        </p>
      `;
      await sendEmail(user.email, "Login Notification", "Successful Login", emailContent);

      res.status(200).json(user);
    } else {
      return res
        .status(401)
        .json({ status: false, message: "Invalid email or password" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const logoutUser = async (req, res) => {
  try {
    res.cookie("token", "", {
      htttpOnly: true,
      expires: new Date(0),
    });

    res.status(200).json({ message: "Logout successful" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

// Controller to get the user details with their assigned tasks
export const getUserTasks = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find the user to make sure they exist
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Fetch the tasks assigned to this user
    const tasks = await Task.find({ team: { $in: [userId] }, isTrashed: false })
      .populate({
        path: "team",
        select: "name title email",
      })
      .populate({
        path: "activities.by",
        select: "name",
      })
      .sort({ _id: -1 }); // Sort by latest tasks first

    if (!tasks.length) {
      return res.status(404).json({ status: false, message: "No tasks found for this user" });
    }

    // Return the user's tasks
    res.status(200).json({
      status: true,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching user tasks:", error);
    res.status(400).json({ status: false, message: error.message });
  }
};

// Controller to get user details along with assigned tasks
export const getUserDetails = async (req, res) => {
  try {
    const { userId } = req.params; // Extract userId from params

    // Fetch user details
    const user = await User.findById(userId).select("name title role email");

    if (!user) {
      return res.status(404).json({ status: false, message: "User not found" });
    }

    // Fetch tasks assigned to the user
    const tasks = await Task.find({ team: userId, isTrashed: false })
      .populate("team", "name role title email")
      .sort({ _id: -1 });

    // Send response with user details and tasks
    res.status(200).json({
      status: true,
      user,
      tasks,
    });
  } catch (error) {
    console.error("Error fetching user details:", error);
    res.status(400).json({ status: false, message: error.message });
  }
};

export const getTeamList = async (req, res) => {
  try {
    const users = await User.find().select("name title role email isActive");

    res.status(200).json(users);
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const { userId, isAdmin } = req.user;
    const { _id } = req.body;

    const id =
      isAdmin && userId === _id
        ? userId
        : isAdmin && userId !== _id
          ? _id
          : userId;

    const user = await User.findById(id);

    if (user) {
      user.name = req.body.name || user.name;
      user.title = req.body.title || user.title;
      user.role = req.body.role || user.role;

      const updatedUser = await user.save();

      user.password = undefined;

      res.status(201).json({
        status: true,
        message: "Profile Updated Successfully.",
        user: updatedUser,
      });
    } else {
      res.status(404).json({ status: false, message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const changeUserPassword = async (req, res) => {
  try {
    const { userId } = req.user;

    const user = await User.findById(userId);

    if (user) {
      user.password = req.body.password;

      await user.save();

      user.password = undefined;

      res.status(201).json({
        status: true,
        message: `Password chnaged successfully.`,
      });
    } else {
      res.status(404).json({ status: false, message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const activateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id);

    if (user) {
      const previousStatus = user.isActive;
      user.isActive = req.body.isActive;

      await user.save();

      // Send email notification to the user
      const subject = user.isActive ? "Account Activated" : "Account Disabled";
      const emailContent = `
        <h3>Hello ${user.name},</h3>
        <p>Your account has been ${user.isActive ? "activated" : "disabled"
        } by the administrator.</p>
        <p>${user.isActive ? "You can now log in and use the platform." : "If you think this was a mistake, please contact support."}</p>
        <p>Thank you!</p>
      `;
      await sendEmail(
        user.email,
        subject,
        `Your account has been ${user.isActive ? "activated" : "disabled"}`,
        emailContent
      );

      res.status(201).json({
        status: true,
        message: `User account has been ${user.isActive ? "activated" : "disabled"
          }`,
      });
    } else {
      res.status(404).json({ status: false, message: "User not found" });
    }
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};

export const deleteUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    await User.findByIdAndDelete(id);

    res
      .status(200)
      .json({ status: true, message: "User deleted successfully" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ status: false, message: error.message });
  }
};
