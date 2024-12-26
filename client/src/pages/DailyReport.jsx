import React, { useState, useEffect } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import { toast } from "sonner";

const DailyReport = () => {
  const [content, setContent] = useState("");
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [editingReport, setEditingReport] = useState(null);

  const { user } = useSelector((state) => state.auth);

  // Fetch reports from the database
  const fetchReports = async () => {
    try {
      const response = await axios.get(`https://tm-main-server.onrender.com/api/daily-reports/${user._id}`);
      setReports(response.data);
    } catch (error) {
      console.error("Error fetching reports:", error.response?.data || error.message);
      setError("Error fetching reports.");
    }
  };

  // Handle form submission (Create or Update)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); // Clear previous errors
    if (content.trim()) {
      if (editingReport) {
        // Update the existing report with content and remark
        try {
          const updatedReport = { content, remark: editingReport.remark };  // Keep the existing remark if updating
          await axios.put(`https://tm-main-server.onrender.com/api/daily-reports/${editingReport._id}`, updatedReport);

          setReports((prevReports) =>
            prevReports.map((report) =>
              report._id === editingReport._id ? { ...report, content } : report
            )
          );

          toast.success("Report successfully added", {
            style: {
              backgroundColor: "#4caf50",
              color: "#fff",
              fontSize: "16px",
              padding: "10px",
            },
          });

          setEditingReport(null); // Exit editing mode
          setContent(""); // Clear the textarea
        } catch (error) {
          console.error("Error updating report:", error.response?.data || error.message);
          setError("Error updating report.");
          toast.error("Failed to update report.");
        }
      } else {
        // Create a new report with content and no remark initially
        try {
          const newReport = {
            content,
            status: "Todo",
            dateTime: new Date().toISOString(),
            userId: user._id, // Associate the report with the user
            remark: "" // Empty remark for new report
          };

          await axios.post("https://tm-main-server.onrender.com/api/daily-reports", newReport);
          setContent(""); // Clear the textarea
          fetchReports(); // Fetch updated reports
          toast.success("Report submitted successfully!", {
            style: {
              backgroundColor: "#4caf50",
              color: "#fff",
              fontSize: "16px",
              padding: "10px",
            },
          });
        } catch (error) {
          console.error("Error submitting report:", error.response?.data || error.message);
          setError("Error submitting report.");
          toast.error("Failed to submit report.");
        }
      }
    }
  };



  // Handle edit button click
  const handleEdit = (report) => {
    setEditingReport(report); // Set the report to edit
    setContent(report.content); // Set the textarea content to the report content
     toast.info("Editing report...", {
      style: {
        backgroundColor: "#2196f3",
        color: "#fff",
        fontSize: "16px",
        padding: "10px",
      },
    });
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingReport(null); // Exit editing mode
    setContent(""); // Clear the textarea
     toast.dismiss();
  };

  // Handle status update
  const handleStatusChange = async (id, status) => {
    try {
      await axios.put(`https://tm-main-server.onrender.com/api/daily-reports/${id}`, { status });
      setReports((prevReports) =>
        prevReports.map((report) => (report._id === id ? { ...report, status } : report))
        );
        toast.success("Status updated successfully!",{
        style: {
          backgroundColor: "#4caf50",
          color: "#fff",
          fontSize: "16px",
          padding: "10px",
        },
      });
    } catch (error) {
      console.error("Error updating status:", error.response?.data || error.message);
      setError("Error updating status.");
      toast.error("Failed to update status.");
    }
  };

  // Handle delete report
  const handleDelete = async (id) => {
    try {
      await axios.delete(`https://tm-main-client.onrender.com/api/daily-reports/${id}`);
      setReports((prevReports) => prevReports.filter((report) => report._id !== id));
      toast.success("Report deleted successfully!", {
        style: {
          backgroundColor: "#f44336",
          color: "#fff",
          fontSize: "16px",
          padding: "10px"
        },
      });
    } catch (error) {
      console.error("Error deleting report:", error.response?.data || error.message);
      setError("Error deleting report.");
      toast.error("Failed to delete report.");
    }
  };

  useEffect(() => {
    if (user) {
      fetchReports(); // Fetch reports for the logged-in user
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
                  <th className="border px-4 py-3 text-left font-medium">Date & Time</th>
                  <th className="border px-4 py-3 text-left font-medium">Status</th>
                  <th className="border px-4 py-3 text-left font-medium">Actions</th>
                  <th className="border px-4 py-3 text-left font-medium">Remark (Form Admin)</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => (
                  <tr
                    key={report._id || index}
                    className={`hover:bg-gray-100 ${
                      index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
                    }`}
                  >
                    <td className="border px-4 py-3 text-gray-700">{index + 1}</td>
                    <td className="border px-4 py-3 text-gray-700 break-words">
                      {report.content}
                    </td>
                    <td className="border px-4 py-3 text-gray-700">
                      {new Date(report.createdAt || report.dateTime).toLocaleString()}
                    </td>
                    <td className="border px-4 py-3 text-gray-700">
                      <select
                        className="border rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={report.status || 'Todo'}
                        onChange={(e) => handleStatusChange(report._id, e.target.value)}
                      >
                        <option value="Completed">Completed</option>
                        <option value="In progress">In progress</option>
                        <option value="Todo">Todo</option>
                        <option value="Maintaining">Maintaining</option>
                      </select>
                    </td>
                    <td className="border px-4 py-3 text-gray-700">
                      <button
                        className="text-blue-600 hover:text-blue-500 font-semibold mr-4"
                        onClick={() => handleEdit(report)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-700 hover:text-red-500 font-semibold"
                        onClick={() => handleDelete(report._id)}
                      >
                        Delete
                      </button>
                    </td>
                    <td className="border px-4 py-3 text-gray-700 break-words">
                      {report.remark || 'No remark yet'}
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
