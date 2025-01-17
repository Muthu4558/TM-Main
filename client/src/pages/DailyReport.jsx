import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { BsThreeDotsVertical } from "react-icons/bs";
import { BiEditAlt } from "react-icons/bi";
import { MdDelete } from "react-icons/md";
import { toast } from "sonner";

const DailyReport = () => {
  const [content, setContent] = useState("");
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [editingReport, setEditingReport] = useState(null);
  const [dropdownVisible, setDropdownVisible] = useState(null);

  const { user } = useSelector((state) => state.auth);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`https://tm-main-server.onrender.com/api/daily-reports/${user._id}`);
      const sortedReports = response.data.sort((a, b) =>
        new Date(b.createdAt || b.dateTime) - new Date(a.createdAt || a.dateTime)
      );
      setReports(sortedReports);
    } catch (error) {
      console.error("Error fetching reports:", error.response?.data || error.message);
      setError("Error fetching reports.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (content.trim()) {
      if (editingReport) {
        try {
          const updatedReport = { content, remark: editingReport.remark };
          await axios.put(`https://tm-main-server.onrender.com/api/daily-reports/${editingReport._id}`, updatedReport);

          setReports((prevReports) =>
            prevReports.map((report) =>
              report._id === editingReport._id ? { ...report, content } : report
            )
          );
          setEditingReport(null);
          setContent("");
          toast.success("Report updated successfully.", { position: "bottom-right" }, {
        style: {
          backgroundColor: "#4caf50",
          color: "#fff",
          fontSize: "16px",
          padding: "10px",
        },
      });
        } catch (error) {
          console.error("Error updating report:", error.response?.data || error.message);
          setError("Error updating report.");
        }
      } else {
        try {
          const newReport = {
            content,
            status: "Todo",
            dateTime: new Date().toISOString(),
            userId: user._id,
            remark: "",
          };

          await axios.post("https://tm-main-server.onrender.com/api/daily-reports", newReport);
          setContent("");
          fetchReports();
           toast.success("Report submitted successfully.", { position: "bottom-right" });
          } catch (error) {
          console.error("Error submitting report:", error.response?.data || error.message);
          setError("Error submitting report.");
        }
      }
    }
  };

  const handleEdit = (report) => {
    setEditingReport(report);
    setContent(report.content);
    setDropdownVisible(null); // Close dropdown
    toast.info("Editing report.", { position: "bottom-right" });
  };

  const handleCancelEdit = () => {
    setEditingReport(null);
    setContent("");
  };

  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`https://tm-main-server.onrender.com/api/daily-reports/${id}`, { status });
      setReports((prevReports) =>
        prevReports.map((report) => (report._id === id ? { ...report, status } : report))
      );
      toast.success(`Status updated to ${status}.`, { position: "bottom-right" });
      } catch (error) {
      console.error("Error updating status:", error.response?.data || error.message);
      setError("Error updating status.");
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://tm-main-server.onrender.com/api/daily-reports/${id}`);
      setReports((prevReports) => prevReports.filter((report) => report._id !== id));
       toast.success("Report deleted successfully.", { position: "bottom-right" });
    } catch (error) {
      console.error("Error deleting report:", error.response?.data || error.message);
      setError("Error deleting report.");
    }
  };

  const toggleDropdown = (id) => {
    setDropdownVisible((prev) => (prev === id ? null : id));
  };

  useEffect(() => {
    if (user) {
      fetchReports();
    }
  }, [user]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Daily Report</h1>

      <div className="bg-white p-5">
        {error && <p className="text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="mb-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter your daily report here..."
            className="border rounded w-full h-40 p-2 mb-4 bg-gray-100"
          />
          <div className="flex space-x-2">

            <button type="submit" className="bg-[#229ea6] text-white px-4 py-2 rounded">
              {editingReport ? "Update" : "Submit"}
            </button>
            {editingReport && (
              <button
                type="button"
                className="bg-gray-500 text-white px-4 py-2 rounded"
                onClick={handleCancelEdit}
              >
                Cancel
              </button>
            )}
            <label
              htmlFor="file-upload"
              className="bg-[#229ea6] text-white px-4 py-2 rounded cursor-pointer inline-block text-center"
            >
              Upload File
              <input
                id="file-upload"
                type="file"
                // onChange={handleFileChange}
                className="hidden"
                accept="image/*,application/pdf"
              />
            </label>

          </div>
        </form>
        <div>
          <h2 className="text-lg font-semibold mb-2">All Reports:</h2>
          {reports.length > 0 ? (
            <div className="overflow-x-auto shadow-md rounded-lg">
              <table className="min-w-full table-auto border-collapse text-sm bg-white">
                <thead>
                  <tr className="bg-[#f3f4f6] text-gray-700">
                    <th className="border px-4 py-3 text-left font-medium">S.no</th>
                    <th className="border px-4 py-3 text-left font-medium">Report</th>
                    <th className="border px-4 py-3 text-left font-medium">Attachment</th>
                    <th className="border px-4 py-3 text-left font-medium">Date & Time</th>
                    <th className="border px-4 py-3 text-left font-medium">Status</th>
                    <th className="border px-4 py-3 text-left font-medium">Action</th>
                    <th className="border px-4 py-3 text-left font-medium">Remark (From Admin)</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report, index) => (
                    <tr
                      key={report._id || index}
                      className={`hover:bg-gray-100 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
                    >
                      <td className="border px-4 py-3 text-gray-700">{index + 1}</td>
                      <td className="border px-4 py-3 text-gray-700 break-words">{report.content}</td>
                      <td className="border px-4 py-3">No Attachment</td>
                      <td className="border px-4 py-3 text-gray-700">
                        {new Date(report.createdAt || report.dateTime).toLocaleString()}
                      </td>
                      <td className="border px-4 py-3 text-gray-700">
                        <select
                          className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={report.status || "Todo"}
                          onChange={(e) => handleStatusChange(report._id, e.target.value)}
                        >
                          <option value="Completed">Completed</option>
                          <option value="In progress">In progress</option>
                          <option value="Todo">Todo</option>
                          <option value="Maintaining">Maintaining</option>
                        </select>
                      </td>

                      <td className="border px-4 py-3 text-gray-700 relative">
                        <div className="relative">
                          <button
                            onClick={() => toggleDropdown(report._id)}
                            className="text-gray-700 hover:text-gray-900 focus:outline-none"
                          >
                            <BsThreeDotsVertical size={20} />
                          </button>
                          {dropdownVisible === report._id && (
                            <div className="absolute right-0 mt-2 bg-white border shadow-lg rounded-md z-10">
                              <button
                                onClick={() => handleEdit(report)}
                                className="flex gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
                              >
                                <BiEditAlt size={20} /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(report._id)}
                                className="flex gap-2 items-center px-4 py-2 text-sm text-red-700 hover:bg-gray-200"
                              >
                                <MdDelete size={20} /> Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="border px-4 py-3 text-gray-700 break-words">
                        {report.remark || "No remark yet"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-sm mt-4">No task is updated.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default DailyReport;
