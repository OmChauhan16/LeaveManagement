import React, { useEffect, useState } from "react";
import { apiClient } from "../lib/api";
import { getToken } from "../App";
import Swal from "sweetalert2";

export default function CandidateDashboard({ user, onLogout }) {
  const token = getToken();
  const api = apiClient(token);
  const [errors, setErrors] = useState({});
  const [balances, setBalances] = useState(null);
  const [requests, setRequests] = useState([]);
  const [form, setForm] = useState({
    category: "CL",
    startDate: "",
    endDate: "",
    reason: "",
  });
  const [file, setFile] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    load();
  }, []);

  // Calculate days between startDate and endDate
  const calculateDays = (start, end) => {
    if (!start || !end) return 0;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const diffTime = Math.abs(endDate - startDate);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // Include both days
    return diffDays;
  };

  // Validate form with SL > 2 days rule
  // const validate = () => {
  //   const errs = {};
  //   const days = calculateDays(form.startDate, form.endDate);

  //   if (!form.startDate.trim()) errs.startDate = "Start Date is required*";
  //   if (!form.endDate.trim()) errs.endDate = "End Date is required*";
  //   if (!form.reason.trim()) errs.reason = "Reason is required*";

  //   // Enforce SL > 2 days rule
  //   if (form.category === "SL" && days > 2) {
  //     setForm((prev) => ({ ...prev, category: "ML" })); // Change to ML
  //     if (!file) errs.file = "Document is required for SL exceeding 2 days and it will be marked as ML";
  //   } else if (form.category === "ML" && !file) {
  //     errs.file = "Document is required for SL exceeding 2 days and it will be marked as ML";
  //   }

  //   setErrors(errs);
  //   return Object.keys(errs).length === 0;
  // };
  const validate = () => {
    const errs = {};
    const days = calculateDays(form.startDate, form.endDate);

    if (!form.startDate.trim()) errs.startDate = "Start Date is required*";
    if (!form.endDate.trim()) errs.endDate = "End Date is required*";
    if (!form.reason.trim()) errs.reason = "Reason is required*";

    // Enforce SL > 2 days rule and file validation
    if (form.category === "SL" && days > 2) {
      setForm((prev) => ({ ...prev, category: "ML" })); // Change to ML
      if (!file) {
        errs.file = "Document is required for SL exceeding 2 days and it will be marked as ML";
      } else {
        const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
        const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
        const fileType = file.type;
        const fileSize = file.size;

        if (fileSize > maxSizeInBytes) {
          errs.file = "File size must not exceed 5 MB";
        } else if (!allowedTypes.includes(fileType)) {
          errs.file = "File type must be PDF, JPG, JPEG, or PNG";
        }
        // If file is required due to SL > 2 rule but validation fails, keep the requirement message
        if (errs.file && !file) errs.file = "Document is required for SL exceeding 2 days and it will be marked as ML";
      }
    } else if (form.category === "ML" && !file) {
      errs.file = "Document is required for SL exceeding 2 days and it will be marked as ML";
    } else if (file) {
      const maxSizeInBytes = 5 * 1024 * 1024; // 5 MB
      const allowedTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      const fileType = file.type;
      const fileSize = file.size;

      if (fileSize > maxSizeInBytes) {
        errs.file = "File size must not exceed 5 MB";
      } else if (!allowedTypes.includes(fileType)) {
        errs.file = "File type must be PDF, JPG, JPEG, or PNG";
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Load balances and requests
  async function load() {
    try {
      const [balanceRes, requestRes] = await Promise.all([
        api.get("/me/balances", { headers: { "Cache-Control": "no-cache" } }),
        api.get("/me/requests", { headers: { "Cache-Control": "no-cache" } }),
        // api.get("/me/requests", { headers: { "Cache-Control": "no-cache" } })
      ]);
      setBalances(balanceRes.data);
      setRequests(requestRes.data);
    } catch (e) {
      console.error("Error loading dashboard data:", e);
      setErrors({ general: "Failed to load dashboard data. Please try again." }); // For display below balances if needed
    }
  }

  // Handle document view
  async function viewDocument(requestId) {
    try {
      const response = await api.get(`/me/requests/${requestId}/document`, {
        responseType: "blob",
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `document_${requestId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setErrors({ document: "Failed to load document. Please try again." }); // For display below table
    }
  }

  // Handle form submission
  async function submit(e) {
    e.preventDefault();
    if (!validate()) return; // Validation errors will be shown below fields

    const fd = new FormData();
    fd.append("category", form.category);
    fd.append("startDate", form.startDate);
    fd.append("endDate", form.endDate);
    fd.append("reason", form.reason);
    if (file) fd.append("document", file);

    try {
      await api.post("/me/requests", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      Swal.fire({
        title: "Success",
        text: "Request submitted successfully",
        icon: "success",
        confirmButtonText: "OK",
      });
      setErrors({}); // Clear any existing errors
      setForm({ category: "CL", startDate: "", endDate: "", reason: "" });
      setFile(null);
      setShowModal(false);
      load(); // Refresh data
    } catch (e) {
      console.error("Error submitting request:", e);
      Swal.fire({
        title: "Error",
        text: e.response?.data?.error || e.message || "Failed to submit request. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
      });
    }
  }

  function formatDate(inputDate) {
    const date = new Date(inputDate);
    if (isNaN(date)) return "";
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  }

  return (
    <div className="bg-slate-900 min-h-screen p-4 text-white">
      <div className="max-w-4xl mx-auto">
        <button
          className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded text-sm fixed top-6 right-4 z-50"
          onClick={onLogout}
        >
          Logout
        </button>
  
        <div className="mb-4 -ml-24">
          <div className="text-lg font-semibold">Candidate Dashboard</div>
          <div className="text-sm text-gray-400 mt-2">Welcome, <strong>{user?.name || 'Admin'}</strong></div>
        </div>
      </div>

      <div className="bg-slate-800 p-4 rounded-lg shadow-lg">
        <div className="mb-4">
          <button
            className="bg-indigo-600 hover:bg-indigo-700 text-white py-1 px-2 rounded text-sm"
            onClick={() => setShowModal(true)}
          >
            + Create Leave Request
          </button>
        </div>

        <h3 className="text-base font-medium mb-2">Balances</h3>
        <div className="grid grid-cols-4 gap-2 mb-4">
          {["CL", "SL", "EL", "ML"].map((c) => (
            <div key={c} className="p-2 bg-slate-700 rounded shadow">
              <div className="text-xs text-gray-400">{c}</div>
              <div className="font-bold text-base">
                {balances ? balances.remaining?.[c] || "0" : "0"}
              </div>
            </div>
          ))}
          {errors.general && (
            <div className="text-start ml-20 mt-2">
              <p className="text-red-400 text-xs">{errors.general}</p>
            </div>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
            <div className="bg-slate-800 rounded p-6 w-full max-w-md shadow-lg relative">
              <button
                className="absolute top-1 right-1 text-gray-400 hover:text-white text-lg"
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
              <h3 className="text-base font-medium mb-4">Create Leave Request</h3>

              <form onSubmit={submit} className="space-y-3">
                <div className="flex items-center gap-2">
                  <label className="w-20 text-xs font-medium">Category</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    className="p-1 bg-slate-700 rounded text-xs w-full h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="CL">CL</option>
                    <option value="SL">SL</option>
                    <option value="EL">EL</option>
                    <option value="ML">ML</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-20 text-xs font-medium">Start Date</label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    className="p-1 bg-slate-700 rounded text-xs w-full h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-start ml-20">
                  {errors.startDate && (
                    <p className="text-red-400 text-xs">{errors.startDate}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-20 text-xs font-medium">End Date</label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    className="p-1 bg-slate-700 rounded text-xs w-full h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-start ml-20">
                  {errors.endDate && (
                    <p className="text-red-400 text-xs">{errors.endDate}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-20 text-xs font-medium">Reason</label>
                  <input
                    value={form.reason}
                    onChange={(e) =>
                      setForm({ ...form, reason: e.target.value })
                    }
                    placeholder="Reason"
                    className="p-1 bg-slate-700 rounded text-xs w-full h-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="text-start ml-20">
                  {errors.reason && (
                    <p className="text-red-400 text-xs">{errors.reason}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <label className="w-20 text-xs font-medium">File</label>
                  <input
                    type="file"
                    onChange={(e) => setFile(e.target.files[0])}
                    className="text-xs w-full h-8 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                </div>
                <div className="text-start ml-20">
                  {errors.file && (
                    <p className="text-red-400 text-xs">{errors.file}</p>
                  )}
                </div>

                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    className="bg-gray-600 hover:bg-gray-700 text-white py-1 px-2 rounded text-sm"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="bg-blue-600 hover:bg-blue-700 text-white py-1 px-2 rounded text-sm"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <h3 className="text-base font-medium mt-4 mb-2">My Requests</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm bg-slate-700">
            <thead>
              <tr>
                <th className="p-2 text-center">ID</th>
                <th className="p-2 text-center">Category</th>
                <th className="p-2 text-center">Dates</th>
                <th className="p-2 text-center">Days</th>
                <th className="p-2 text-center">Reason</th>
                <th className="p-2 text-center">Status</th>
                <th className="p-2 text-center">Document</th>
              </tr>
            </thead>
            <tbody>
              {requests.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-2 text-center text-gray-400">
                    No requests found.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="border-t border-slate-600">
                    <td className="p-2 text-center">{r.id}</td>
                    <td className="p-2 text-center">{r.category}</td>
                    <td className="p-2 text-center">
                      {formatDate(r.start_date)} → {formatDate(r.end_date)}
                    </td>
                    <td className="p-2 text-center">{r.working_days}</td>
                    <td className="p-2 text-center">{r.reason}</td>

                    <td className="p-2 text-center">
                      <span
                        className={`px-2 py-1 rounded text-xs ${r.status === "approved"
                          ? "bg-green-600"
                          : r.status === "rejected"
                            ? "bg-red-600"
                            : "bg-yellow-600"
                          }`}
                      >
                        {r.status}
                      </span>
                    </td>
                    <td className="p-2 text-center">
                      {r.document && (
                        <button
                          className="btn bg-blue-600 text-xs px-2 py-1"
                          onClick={() => viewDocument(r.id)}
                        >
                          Download
                        </button>
                      )}
                      {!r.document && "N/A"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          {errors.document && (
            <div className="text-start ml-20 mt-2">
              <p className="text-red-400 text-xs">{errors.document}</p>
            </div>
          )}
        </div>
      </div>
    </div>
    // </div >
  );
}