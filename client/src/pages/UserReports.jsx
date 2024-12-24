import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaArrowLeft } from "react-icons/fa";
import Title from "../components/Title";
import * as XLSX from 'xlsx';

const UserReports = () => {
  const { userId } = useParams();
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch reports for the specific user
    const fetchReports = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/daily-reports/${userId}`);
        setReports(response.data);
      } catch (error) {
        console.error('Error fetching reports:', error.response?.data || error.message);
        setError('Error fetching reports.');
      }
    };

    fetchReports();
  }, [userId]);

  // Handle remark submission
  const handleRemarkSubmit = async (reportId, remark) => {
    try {
      // Update the remark in the backend
      await axios.put(`http://localhost:5000/api/daily-reports/${reportId}`, { remark });

      // Optimistically update the report in the UI
      setReports((prevReports) =>
        prevReports.map((report) =>
          report._id === reportId ? { ...report, remark } : report
        )
      );
    } catch (error) {
      console.error('Error updating remark:', error.response?.data || error.message);
      setError('Error updating remark.');
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/user/${userId}`);
        const data = await response.json();

        if (response.ok) {
          setUserData(data);
        } else {
          setError(data.message);
        }
      } catch (err) {
        setError("An error occurred while fetching user data.");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  const handleDownload = () => {
    // Format the data for Excel
    const data = reports.map((report, index) => ({
      'S.no': index + 1,
      Report: report.content,
      'Date & Time': new Date(report.createdAt || report.dateTime).toLocaleString(),
      Status: report.status || 'Todo',
      Remark: report.remark || 'No remark yet',
    }));

    // Create a new worksheet
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Create a new workbook and append the worksheet
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Reports');

    // Generate Excel file and download
    XLSX.writeFile(workbook, `${userData?.name || 'User'}_Reports.xlsx`);
  };

  const { user } = userData || {};

  return (
    <div className="p-4">
      <div className="flex items-center gap-1 align-middle mb-4">
        <button
          onClick={() => navigate(-1)}
          className="text-xl text-gray-600 p-2 rounded-full hover:bg-gray-200"
        >
          <FaArrowLeft />
        </button>
        {/* <h1 className='text-2xl'>User report</h1> */}
        <Title title={`${user?.name}'s Tasks`} />

      </div>

      {error && <p className="text-red-500">{error}</p>}
      <div className="bg-white p-5">

      <div className="flex justify-end mb-4">
          <button
            onClick={handleDownload}
            className="bg-[#229ea6] text-white px-4 py-2 rounded hover:bg-[#197d7e]"
          >
            Download
          </button>
        </div>

        {reports.length > 0 ? (
          <div className="overflow-x-auto shadow-md rounded-lg">
            <table className="min-w-full table-auto border-collapse text-sm bg-white">
              <thead>
                <tr className="bg-[#f3f4f6] text-gray-700">
                  <th className="border px-4 py-3 text-left font-medium">S.no</th>
                  <th className="border px-4 py-3 text-left font-medium">Report</th>
                  <th className="border px-4 py-3 text-left font-medium">Date & Time</th>
                  <th className="border px-4 py-3 text-left font-medium">Status</th>
                  <th className="border px-4 py-3 text-left font-medium">Remark</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report, index) => (
                  <tr
                    key={report._id || index}
                    className={`hover:bg-gray-100 ${index % 2 === 0 ? 'bg-gray-50' : 'bg-white'
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
                      {report.status || 'Todo'}
                    </td>
                    <td className="border px-4 py-3 text-gray-700">
                      {report.remark || 'No remark yet'}
                      <div className="mt-2">
                        <textarea
                          rows="2"
                          className="w-full p-2 border rounded bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Add a remark"
                          onChange={(e) =>
                            setReports((prevReports) =>
                              prevReports.map((r) =>
                                r._id === report._id
                                  ? { ...r, newRemark: e.target.value }
                                  : r
                              )
                            )
                          }
                          value={report.newRemark || ''}
                        ></textarea>
                        <button
                          className="mt-2 bg-[#229ea6] text-white px-3 py-1 rounded hover:bg-[#197d7e]"
                          onClick={() =>
                            handleRemarkSubmit(report._id, report.newRemark || '')
                          }
                        >
                          Submit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-gray-500 text-sm mt-4">No reports found for this user.</p>
        )}
      </div>
    </div>
  );
};

export default UserReports;
