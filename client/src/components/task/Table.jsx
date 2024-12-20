import React, { useState } from "react";
import { toast } from "sonner";
import { BGS, TASK_TYPE, formatDate } from "../../utils";
import clsx from "clsx";
import UserInfo from "../UserInfo";
import ConfirmatioDialog from "../Dialogs";
import { useTrashTaskMutation, useUpdateTaskMutation } from "../../redux/slices/api/taskApiSlice"; // Assuming there's an API for updating the task
import TaskDialog from "./TaskDialog";
import { MdCheckBoxOutlineBlank, MdAccessTime, MdCheckCircle } from "react-icons/md";
import { useSelector } from "react-redux";

const ICONS1 = {
  todo: <MdCheckBoxOutlineBlank />,
  "in progress": <MdAccessTime />,
  completed: <MdCheckCircle />,
};

const Table = ({ tasks = [] }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selected, setSelected] = useState(null);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [taskStage, setTaskStage] = useState(""); // New state for task stage filter
  const [trashtask, { isLoading }] = useTrashTaskMutation();
  const [updateTask] = useUpdateTaskMutation(); // Mutation hook for updating task

  const { user } = useSelector((state) => state.auth);
  const [open, setOpen] = useState(false);

  const deleteClicks = (id) => {
    setSelected(id);
    setOpenDialog(true);
  };

  const deleteHandler = async () => {
    try {
      const result = await trashtask({ id: selected, isTrash: "trash" }).unwrap();

      toast.success(result?.message || "Task moved to trash successfully!", {
        style: {
          backgroundColor: "#4caf50",
          color: "#fff",
          fontSize: "16px",
          padding: "10px",
        },
      });

      setOpenDialog(false);
    } catch (error) {
      console.error(error);
      toast.error(error?.data?.message || "Error occurred while deleting the task.");
    }
  };

  const clearFilters = () => {
    setStartDate("");
    setEndDate("");
  };

  const clearFilters1 = () => {
    setTaskStage("");
  };

  const filteredTasks = tasks.filter((task) => {
    const taskDate = new Date(task?.createdAt);
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    if (start && taskDate < start) return false;
    if (end && taskDate > end) return false;
    if (taskStage && task.stage !== taskStage) return false; // Filter by task stage
    return true;
  });

  const TableHeader = () => (
    <thead className="w-full border-b border-gray-300">
      <tr className="text-black text-left">
        <th className="py-2">Task Title</th>
        <th className="py-2">Assigned Date</th>
        <th className="py-2">Due Date</th>
        <th className="py-2">Team</th>
        <th className="py-2">Status</th> {/* New column for Task Stage */}
        <th className="py-2 text-right">Actions</th>
      </tr>
    </thead>
  );

  const TableRow = ({ task }) => (
    <tr className="border-b border-gray-200 text-gray-600 hover:bg-gray-300/10">
      <td className="py-2">
        <div className="flex items-center gap-2">
          <div className={clsx("w-4 h-4 rounded-full", TASK_TYPE[task.stage] || "bg-gray-400")} />
          <p className="line-clamp-2 text-base text-black">{task?.title || "No title"}</p>
        </div>
      </td>
      <td className="py-2 text-sm text-gray-600">{formatDate(new Date(task?.createdAt))}</td>
      <td className="py-2 text-sm text-gray-600">
        {formatDate(new Date(task?.date))}
      </td>
      <td className="py-2">
        <div className="flex">
          {task?.team?.map((member, index) => (
            <div
              key={member._id || index}
              className={clsx(
                "w-7 h-7 rounded-full text-white flex items-center justify-center text-sm",
                BGS[index % BGS.length]
              )}
            >
              <UserInfo user={member} />
            </div>
          ))}
        </div>
      </td>
      <td className="py-2">
        {/* Task Stage Icon */}
        <div className="flex gap-2 items-center">
          <div
            className={clsx(
              "w-5 h-5 flex items-center justify-center rounded-full",
              // task.stage === "todo" ? "bg-blue-600" :
              //   task.stage === "in progress" ? "bg-yellow-600" :
              //     task.stage === "completed" ? "bg-green-600" : "bg-gray-400"
            )}
          >
            {ICONS1[task.stage] || ICONS1["todo"]}
          </div>
          {/* Displaying Task Stage Text */}
          <div>
            <span className="text-sm text-gray-600 capitalize">{task.stage}</span>
          </div>
        </div>
      </td>
      <td className="py-2 flex gap-2 justify-end">
        {/* TaskDialog Button */}
        {user && <TaskDialog task={task} />}

      </td>
    </tr>
  );

  return (
    <>
      <div className="bg-white px-2 md:px-4 pt-4 pb-9 shadow-md rounded">
        <div className="flex justify-between">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-4 items-center mb-4">
            <div>
              <label htmlFor="startDate" className="block text-sm text-gray-600">
                Start Date:
              </label>
              <input
                type="date"
                id="startDate"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-sm text-gray-600">
                End Date:
              </label>
              <input
                type="date"
                id="endDate"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1"
              />
            </div>

            <button
              onClick={clearFilters}
              className="bg-[#229ea6] text-white font-semibold px-4 py-1 mt-5 rounded"
            >
              Clear
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mt-1">
            <div>
              <label htmlFor="taskStage" className="block text-sm text-gray-600">
                Status Filter:
              </label>
              <select
                id="taskStage"
                value={taskStage}
                onChange={(e) => setTaskStage(e.target.value)}
                className="border border-gray-300 rounded px-2 py-1"
              >
                <option value="">All</option>
                <option value="todo">To-Do</option>
                <option value="in progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <button
                onClick={clearFilters1}
                className="bg-[#229ea6] text-white font-semibold px-4 py-1 mt-5 rounded"
              >
                Clear
              </button>
            </div>
          </div>
        </div>

        {/* Task Table */}
        <div className="overflow-x-auto">
          {filteredTasks.length > 0 ? (
            <table className="w-full">
              <TableHeader />
              <tbody>
                {filteredTasks.map((task) => (
                  <TableRow key={task._id || task.title} task={task} />
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-center text-gray-500 py-4">No tasks match the selected filters.</p>
          )}
        </div>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmatioDialog open={openDialog} setOpen={setOpenDialog} onClick={deleteHandler} />
    </>
  );
  
};

export default Table;
