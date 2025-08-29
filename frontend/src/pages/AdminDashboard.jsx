import React, { useEffect, useState } from "react";
import { apiClient } from "../lib/api";
import { getToken } from "../App";
import Swal from "sweetalert2";

// Separate Invites Component
function InvitesPage({ api, onBack }) {
  const [invites, setInvites] = useState([]);
  const [email, setEmail] = useState("candidate" + Math.floor(Math.random() * 1000) + "@example.com");
  const [loading, setLoading] = useState(false); // New loading state for send invite
  const [resendLoading, setResendLoading] = useState({}); // State to track resend loading per invite

  useEffect(() => {
    loadInvites();
  }, []);

  async function loadInvites() {
    try {
      const response = await api.get("/admin/invites");
      setInvites(response.data);
    } catch (e) {
      console.error(e);
      Swal.fire({
        title: "Error!",
        text: "Failed to load invites. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      });
    }
  }

  async function sendInvite(e) {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/admin/invites", { email });
      setEmail("candidate" + Math.floor(Math.random() * 1000) + "@example.com");
      loadInvites();
      Swal.fire({
        title: "Success!",
        text: `Invite sent successfully to ${email}`,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981",
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        title: "Error!",
        text: "Failed to send invite. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  }

  async function resendInvite(inviteId, email) {
    setResendLoading((prev) => ({ ...prev, [inviteId]: true }));
    try {
      await api.post(`/admin/invites/${inviteId}/resend`, { email });
      loadInvites();
      Swal.fire({
        title: "Success!",
        text: `Invite resent successfully to ${email}`,
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981",
      });
    } catch (e) {
      console.error(e);
      Swal.fire({
        title: "Error!",
        text: "Failed to resend invite. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setResendLoading((prev) => ({ ...prev, [inviteId]: false }));
    }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold">Invites Management</h2>
        <button className="btn bg-gray-600" onClick={onBack}>
          ← Back to Dashboard
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg mb-3">Send New Invite</h3>
        <form onSubmit={sendInvite} className="flex gap-2">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="p-2 bg-slate-700 rounded flex-1"
            placeholder="Enter email address"
            type="email"
            required
            disabled={loading}
          />
          <button
            className="btn bg-blue-600"
            type="submit"
            disabled={loading}
          >
            {loading ? "Sending..." : "Send Invite"}
          </button>
        </form>
      </div>

      <div>
        <h3 className="text-lg mb-3">All Invites</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border border-gray-600 rounded">
            <thead className="bg-slate-700">
              <tr>
                <th className="text-center p-2 border-b border-gray-600">ID</th>
                <th className="text-center p-2 border-b border-gray-600">Email</th>
                <th className="text-center p-2 border-b border-gray-600">Status</th>
                <th className="text-center p-2 border-b border-gray-600">Created</th>
                <th className="text-center p-2 border-b border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {invites.map((invite) => (
                <tr key={invite.id} className="hover:bg-slate-700">
                  <td className="text-center p-2 border-b border-gray-600">{invite.id}</td>
                  <td className="text-center p-2 border-b border-gray-600">{invite.email}</td>
                  <td className="text-center p-2 border-b border-gray-600">
                    <span
                      className={`px-2 py-1 rounded text-xs ${invite.used ? "bg-green-600" : "bg-yellow-600"}`}
                    >
                      {invite.used ? "Used" : "Pending"}
                    </span>
                  </td>
                  <td className="text-center p-2 border-b border-gray-600">
                    {invite.created_at
                      ? new Date(invite.created_at).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="text-center p-2 border-b border-gray-600">
                    {!invite.used ? (
                      <button
                        className="btn bg-yellow-600 text-xs px-2 py-1"
                        onClick={() => resendInvite(invite.id, invite.email)}
                        disabled={resendLoading[invite.id]}
                      >
                        {resendLoading[invite.id] ? "Resending..." : "Resend Invite"}
                      </button>
                    ) : "N/A"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {invites.length === 0 && (
            <div className="text-center p-4 text-gray-400">
              No invites found. Send your first invite above.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Entitlements Modal Component
function EntitlementsModal({ api, users, isOpen, onClose }) {
  const [selectedUser, setSelectedUser] = useState(null);
  const [ent, setEnt] = useState({ cl: 6, sl: 6, el: 12, ml: 180 });
  const [loading, setLoading] = useState(false);

  async function loadEnt(userId) {
    if (!userId) return;
    setLoading(true);
    try {
      const r = await api.get(`/admin/entitlements/${userId}`);
      setSelectedUser(userId);
      setEnt(r.data);
    } catch (e) {
      console.error(e);
      Swal.fire({
        title: "Error!",
        text: "Failed to load entitlements. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  }

  async function saveEnt() {
    if (!selectedUser) return;
    setLoading(true);
    try {
      await api.put(`/admin/entitlements/${selectedUser}`, ent);
      await Swal.fire({
        title: "Success!",
        text: "Entitlements updated successfully!",
        icon: "success",
        confirmButtonText: "OK",
        confirmButtonColor: "#10b981",
      });
      handleClose();
    } catch (e) {
      console.error(e);
      Swal.fire({
        title: "Error!",
        text: "Failed to save entitlements. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    setSelectedUser(null);
    setEnt({ cl: 6, sl: 6, el: 12, ml: 180 });
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-800 rounded-lg p-6 w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Manage Entitlements</h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        <div className="mb-4">
          <label className="block text-sm text-gray-400 mb-2">Select Candidate</label>
          <select
            onChange={(e) => loadEnt(e.target.value)}
            value={selectedUser || ""}
            className="w-full p-2 bg-slate-700 rounded"
            disabled={loading}
          >
            <option value="">Choose a candidate...</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
            ))}
          </select>
        </div>

        {selectedUser && (
          <div>
            <div className="text-sm text-gray-400 mb-3">
              Set entitlement limits for the selected candidate:
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Casual Leave (CL)</label>
                <input
                  value={ent.cl}
                  onChange={(e) => setEnt({ ...ent, cl: Number(e.target.value) })}
                  className="p-2 bg-slate-700 rounded w-full"
                  type="number"
                  min="0"
                  max="365"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Sick Leave (SL)</label>
                <input
                  value={ent.sl}
                  onChange={(e) => setEnt({ ...ent, sl: Number(e.target.value) })}
                  className="p-2 bg-slate-700 rounded w-full"
                  type="number"
                  min="0"
                  max="365"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Earned Leave (EL)</label>
                <input
                  value={ent.el}
                  onChange={(e) => setEnt({ ...ent, el: Number(e.target.value) })}
                  className="p-2 bg-slate-700 rounded w-full"
                  type="number"
                  min="0"
                  max="365"
                  disabled={loading}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Maternity Leave (ML)</label>
                <input
                  value={ent.ml}
                  onChange={(e) => setEnt({ ...ent, ml: Number(e.target.value) })}
                  className="p-2 bg-slate-700 rounded w-full"
                  type="number"
                  min="0"
                  max="365"
                  disabled={loading}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="btn bg-green-600 flex-1"
                onClick={saveEnt}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save Entitlements"}
              </button>
              <button
                className="btn bg-gray-600"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center text-gray-400 mt-4">
            Loading...
          </div>
        )}
      </div>
    </div>
  );
}

// Actions Dropdown Component
// function ActionsDropdown({ request, onApprove, onReject }) {
//   const [isOpen, setIsOpen] = useState(false);
//   const isPending = request.status === "pending";

//   return (
//     <div className="relative">
//       <button
//         onClick={() => setIsOpen(!isOpen)}
//         className={`p-1 rounded hover:bg-slate-600 ${!isPending ? "opacity-50 cursor-not-allowed" : ""}`}
//         disabled={!isPending}
//       >
//         <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
//           <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
//         </svg>
//       </button>

//       {isOpen && isPending && (
//         <>
//           <div
//             className="fixed inset-0 z-10"
//             onClick={() => setIsOpen(false)}
//           />

//           <div className="absolute right-0 top-full mt-1 bg-slate-700 rounded shadow-lg border border-gray-600 z-20 min-w-[120px]">
//             <button
//               onClick={() => {
//                 onApprove(request.id);
//                 setIsOpen(false);
//               }}
//               className="w-full text-left px-3 py-2 hover:bg-green-600 text-sm flex items-center gap-2"
//             >
//               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
//                 <path
//                   fillRule="evenodd"
//                   d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
//                   clipRule="evenodd"
//                 />
//               </svg>
//               Approve
//             </button>
//             <button
//               onClick={() => {
//                 onReject(request.id);
//                 setIsOpen(false);
//               }}
//               className="w-full text-left px-3 py-2 hover:bg-red-600 text-sm flex items-center gap-2"
//             >
//               <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
//                 <path
//                   fillRule="evenodd"
//                   d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
//                   clipRule="evenodd"
//                 />
//               </svg>
//               Reject
//             </button>
//           </div>
//         </>
//       )}

//       {isOpen && !isPending && (
//         <>
//           <div
//             className="fixed inset-0 z-10"
//             onClick={() => setIsOpen(false)}
//           />
//           <div className="absolute right-0 top-full mt-1 bg-slate-700 rounded shadow-lg border border-gray-600 z-20 min-w-[120px]">
//             <div className="px-3 py-2 text-sm text-gray-400">
//               No actions available
//             </div>
//           </div>
//         </>
//       )}
//     </div>
//   );
// }


function ActionsDropdown({ request, onApprove, onReject }) {
  const [isOpen, setIsOpen] = useState(false);
  const isPending = request.status === "pending";
  const dropdownRef = React.useRef(null);

  // Close dropdown if clicked outside
  React.useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`p-1 rounded hover:bg-slate-600 ${!isPending ? "opacity-50 cursor-not-allowed" : ""}`}
        disabled={!isPending}
      >
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {isOpen && isPending && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute right-0 top-full mt-1 bg-slate-700 rounded shadow-lg border border-gray-600 z-50 min-w-[120px]"
            style={{ position: "absolute", zIndex: 50 }} // Ensure high z-index
          >
            <button
              onClick={() => {
                onApprove(request.id);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-green-600 text-sm flex items-center gap-2"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Approve
            </button>
            <button
              onClick={() => {
                onReject(request.id);
                setIsOpen(false);
              }}
              className="w-full text-left px-3 py-2 hover:bg-red-600 text-sm flex items-center gap-2"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
              Reject
            </button>
          </div>
        </>
      )}

      {isOpen && !isPending && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute right-0 top-full mt-1 bg-slate-700 rounded shadow-lg border border-gray-600 z-50 min-w-[120px]"
            style={{ position: "absolute", zIndex: 50 }}
          >
            <div className="px-3 py-2 text-sm text-gray-400">
              No actions available
            </div>
          </div>
        </>
      )}
    </div>
  );
}
export default function AdminDashboard({ user, onLogout }) {
  const token = getToken();
  const api = apiClient(token);
  const [currentPage, setCurrentPage] = useState("dashboard"); // 'dashboard' or 'invites'
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showEntitlementsModal, setShowEntitlementsModal] = useState(false);

  // State for filtering and sorting
  const [filters, setFilters] = useState({
    status: "",
    candidate: "",
    startDate: "",
    endDate: "",
  });
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: "ascending",
  });

  useEffect(() => {
    if (currentPage === "dashboard") {
      loadDashboardData();
    }
  }, [currentPage]);

  async function loadDashboardData() {
    try {
      const [us, rq] = await Promise.all([
        api.get("/admin/users?role=candidate"),
        api.get("/admin/requests"),
      ]);
      setUsers(us.data);
      setRequests(rq.data);
    } catch (e) {
      console.error(e);
      Swal.fire({
        title: "Error!",
        text: "Failed to load dashboard data. Please refresh the page.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      });
    }
  }

  async function approve(id) {
    const { value: comment } = await Swal.fire({
      title: "Approve Request",
      text: "Enter a comment (required)",
      input: "textarea",
      inputPlaceholder: "Type your comment here...",
      showCancelButton: true,
      confirmButtonText: "Submit",
      confirmButtonColor: "#3085d6",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "Comment is required";
        }
      },
    });

    if (comment) {
      await api.post(`/admin/requests/${id}/approve`, { comment });
      loadDashboardData();
    }
  }

  async function reject(id) {
    const { value: comment } = await Swal.fire({
      title: "Reject Request",
      text: "Enter a comment (required)",
      input: "textarea",
      inputPlaceholder: "Type your comment here...",
      showCancelButton: true,
      confirmButtonText: "Submit",
      confirmButtonColor: "#d33",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value || !value.trim()) {
          return "Comment is required";
        }
      },
    });

    if (comment) {
      await api.post(`/admin/requests/${id}/reject`, { comment });
      loadDashboardData();
    }
  }

  async function viewDocument(requestId) {
    try {
      const response = await api.get(`/admin/requests/${requestId}/document`, {
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
      Swal.fire({
        title: "Error!",
        text: "Failed to load document. Please try again.",
        icon: "error",
        confirmButtonText: "OK",
        confirmButtonColor: "#ef4444",
      });
    }
  }

  // Sorting logic
  const sortRequests = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      // Handle date sorting for start_date and end_date
      if (
        sortConfig.key === "start_date" ||
        sortConfig.key === "end_date" ||
        sortConfig.key === "created_at"
      ) {
        aValue = new Date(a[sortConfig.key]);
        bValue = new Date(b[sortConfig.key]);
      }

      if (aValue < bValue) {
        return sortConfig.direction === "ascending" ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === "ascending" ? 1 : -1;
      }
      return 0;
    });
  };

  // Filtering logic with date range
  const filterRequests = (data) => {
    return data.filter((request) => {
      const matchesStatus = !filters.status || request.status === filters.status;
      const matchesCandidate =
        !filters.candidate ||
        request.candidate_name
          .toLowerCase()
          .includes(filters.candidate.toLowerCase());
      const startDate = filters.startDate ? new Date(filters.startDate) : null;
      const endDate = filters.endDate ? new Date(filters.endDate) : null;

      const matchesDateRange =
        !startDate || !endDate
          ? true
          : [
            new Date(request.created_at),
            new Date(request.start_date),
            new Date(request.end_date),
          ].some((date) => {
            return date >= startDate && date <= endDate;
          });

      return matchesStatus && matchesCandidate && matchesDateRange;
    });
  };

  // Handle sort click
  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction:
        prev.key === key && prev.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Format date function
  const formatDate = (inputDate) => {
    const date = new Date(inputDate);
    if (isNaN(date)) return "-";
    return `${String(date.getDate()).padStart(2, "0")}-${String(
      date.getMonth() + 1
    ).padStart(2, "0")}-${date.getFullYear()}`;
  };

  const filteredAndSortedRequests = filterRequests(sortRequests(requests));

  if (currentPage === "invites") {
    return <InvitesPage api={api} onBack={() => setCurrentPage("dashboard")} />;
  }

  return (
    <div>
      <button
        className="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded text-sm fixed top-6 right-4 z-50"
        onClick={onLogout}
      >
        Logout
      </button>
      <div className="flex justify-between items-center mb-4">
        <div className="mt-10">
          <h2 className="text-xl font-bold">Admin Dashboard</h2>
          <div className="text-sm text-gray-400">
            Welcome, <strong>{user?.name || "Admin"}</strong>
          </div>
        </div>
      </div>

      <div className="flex gap-2 mb-6 mt-10">
        <button
          className="btn bg-blue-600"
          onClick={() => setCurrentPage("invites")}
        >
          Manage Invites
        </button>
        <button
          className="btn bg-purple-600"
          onClick={() => setShowEntitlementsModal(true)}
        >
          Manage Entitlements
        </button>
      </div>

      <div className="mb-6">
        <h3 className="text-lg mb-3">Leave Requests</h3>

        {/* Filter Inputs with Date Range */}
        <div className="mb-4 flex gap-4 flex-wrap">
          <select
            name="status"
            value={filters.status}
            onChange={handleFilterChange}
            className="p-2 bg-slate-700 rounded text-sm"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
          <input
            name="candidate"
            value={filters.candidate}
            onChange={handleFilterChange}
            placeholder="Filter by Candidate"
            className="p-2 bg-slate-700 rounded text-sm"
          />
          <input
            name="startDate"
            value={filters.startDate}
            onChange={handleFilterChange}
            type="date"
            className="p-2 bg-slate-700 rounded text-sm"
            max="2025-08-29"
          />
          <input
            name="endDate"
            value={filters.endDate}
            onChange={handleFilterChange}
            type="date"
            className="p-2 bg-slate-700 rounded text-sm"
            max="2025-08-29"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border border-gray-600 rounded">
            <thead className="bg-slate-700">
              <tr>
                <th
                  className="text-center p-2 border-b border-gray-600 cursor-pointer hover:bg-slate-600"
                  onClick={() => handleSort("id")}
                >
                  ID{" "}
                  {sortConfig.key === "id" &&
                    (sortConfig.direction === "ascending" ? "↑" : "↓")}
                </th>
                <th
                  className="text-center p-2 border-b border-gray-600 cursor-pointer hover:bg-slate-600"
                  onClick={() => handleSort("candidate_name")}
                >
                  Candidate{" "}
                  {sortConfig.key === "candidate_name" &&
                    (sortConfig.direction === "ascending" ? "↑" : "↓")}
                </th>
                <th
                  className="text-center p-2 border-b border-gray-600 cursor-pointer hover:bg-slate-600"
                  onClick={() => handleSort("category")}
                >
                  Category{" "}
                  {sortConfig.key === "category" &&
                    (sortConfig.direction === "ascending" ? "↑" : "↓")}
                </th>
                <th
                  className="text-center p-2 border-b border-gray-600 cursor-pointer hover:bg-slate-600"
                  onClick={() => handleSort("start_date")}
                >
                  Date(s){" "}
                  {sortConfig.key === "start_date" &&
                    (sortConfig.direction === "ascending" ? "↑" : "↓")}
                </th>
                <th className="text-center p-2 border-b border-gray-600 cursor-pointer hover:bg-slate-600">Reason</th>
                <th
                  className="text-center p-2 border-b border-gray-600 cursor-pointer hover:bg-slate-600"
                  onClick={() => handleSort("status")}
                >
                  Status{" "}
                  {sortConfig.key === "status" &&
                    (sortConfig.direction === "ascending" ? "↑" : "↓")}
                </th>
                <th className="text-center p-2 border-b border-gray-600">Document</th>
                <th className="text-center p-2 border-b border-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedRequests.map((r) => (
                <tr key={r.id} className="hover:bg-slate-700">
                  <td className="text-center p-2 border-b border-gray-600">{r.id}</td>
                  <td className="text-center p-2 border-b border-gray-600">{r.candidate_name}</td>
                  <td className="text-center p-2 border-b border-gray-600">{r.category}</td>
                  <td className="text-center p-2 border-b border-gray-600">
                    {`${formatDate(r.start_date)} → ${formatDate(r.end_date)}`}
                  </td>
                  <td className="text-center p-2 border-b border-gray-600">{r.reason ? r.reason : "-"}</td>
                  <td className="text-center p-2 border-b border-gray-600">
                    <span
                      className={`px-2 py-1 rounded ${r.status === "approved"
                        ? "bg-green-600"
                        : r.status === "rejected"
                          ? "bg-red-600"
                          : "bg-yellow-600"
                        }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="text-center p-2 border-b border-gray-600">
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
                  <td className="text-center p-2 border-b border-gray-600">
                    <ActionsDropdown
                      request={r}
                      onApprove={approve}
                      onReject={reject}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredAndSortedRequests.length === 0 && (
            <div className="text-center p-4 text-gray-400">
              No requests match the filter criteria.
            </div>
          )}
        </div>
      </div>

      <EntitlementsModal
        api={api}
        users={users}
        isOpen={showEntitlementsModal}
        onClose={() => setShowEntitlementsModal(false)}
      />
    </div>
  );
}