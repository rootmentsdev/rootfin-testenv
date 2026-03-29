import { useState, useEffect } from "react";
import { CheckCircle, XCircle, Clock, Filter } from "lucide-react";
import Header from "../components/Head";
import baseUrl from "../api/api";

const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";

const typeLabels = {
  transfer_order: "Transfer Order",
  store_order: "Store Order",
  delete_product: "Delete Product",
  delete_item_group: "Delete Item Group",
  create_branch: "Create Branch",
  edit_branch: "Edit Branch",
  delete_branch: "Delete Branch",
};

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

export default function Approvals() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("pending");
  const [reviewing, setReviewing] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("rootfinuser") || "{}");
  const isSuperAdmin = currentUser.power === "superadmin";

  const fetchApprovals = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/approvals?status=${filter}`);
      const data = await res.json();
      setApprovals(data.approvals || []);
    } catch (err) {
      console.error("Error fetching approvals:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchApprovals(); }, [filter]);

  const handleReview = async (id, action) => {
    if (action === "reject" && !rejectionReason.trim()) {
      alert("Please provide a rejection reason.");
      return;
    }
    setReviewing(id);
    try {
      const res = await fetch(`${API_URL}/api/approvals/${id}/review`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          reviewedBy: currentUser.email,
          rejectionReason: action === "reject" ? rejectionReason : "",
        }),
      });
      if (!res.ok) throw new Error("Failed to review");
      setRejectionReason("");
      fetchApprovals();
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setReviewing(null);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div className="ml-64 p-8">
        <Header title="Approvals" description="Super Admin access required." />
        <div className="mt-8 text-center text-gray-500">You don't have permission to view this page.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <Header
        title="Approvals"
        description="Review and approve pending requests from admins."
      />
      <div className="ml-64 px-8 py-8">
        {/* Filter tabs */}
        <div className="flex gap-2 mb-6">
          {["pending", "approved", "rejected"].map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize transition ${
                filter === s
                  ? "bg-[#4f46e5] text-white"
                  : "bg-white border border-[#e5e7eb] text-[#6b7280] hover:bg-[#f3f4f6]"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="text-center py-16 text-[#6b7280]">Loading...</div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-16 text-[#6b7280]">
            <Clock size={40} className="mx-auto mb-3 opacity-40" />
            No {filter} approvals
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((a) => (
              <div key={a._id} className="bg-white rounded-2xl border border-[#e6ebfa] p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-xs font-semibold uppercase tracking-widest text-[#8a94b0]">
                        {typeLabels[a.type] || a.type}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[a.status]}`}>
                        {a.status}
                      </span>
                    </div>
                    <p className="text-[#101828] font-medium mb-1">{a.summary || "No summary provided"}</p>
                    {a.entityRef && (
                      <p className="text-sm text-[#6b7280]">Ref: {a.entityRef}</p>
                    )}
                    <p className="text-xs text-[#9ca3af] mt-2">
                      Requested by {a.requestedByName || a.requestedBy} · {new Date(a.createdAt).toLocaleString()}
                    </p>
                    {a.status !== "pending" && a.reviewedBy && (
                      <p className="text-xs text-[#9ca3af]">
                        {a.status === "approved" ? "Approved" : "Rejected"} by {a.reviewedBy} · {new Date(a.reviewedAt).toLocaleString()}
                      </p>
                    )}
                    {a.rejectionReason && (
                      <p className="text-xs text-red-500 mt-1">Reason: {a.rejectionReason}</p>
                    )}

                    {/* Payload preview */}
                    {a.payload && Object.keys(a.payload).length > 0 && (
                      <details className="mt-3">
                        <summary className="text-xs text-[#4f46e5] cursor-pointer">View details</summary>
                        <pre className="mt-2 text-xs bg-[#f9fafb] rounded-lg p-3 overflow-auto max-h-40 text-[#374151]">
                          {JSON.stringify(a.payload, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>

                  {/* Actions */}
                  {a.status === "pending" && (
                    <div className="flex flex-col gap-2 min-w-[140px]">
                      <button
                        onClick={() => handleReview(a._id, "approve")}
                        disabled={reviewing === a._id}
                        className="flex items-center gap-2 justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle size={16} /> Approve
                      </button>
                      <div className="flex flex-col gap-1">
                        <input
                          type="text"
                          placeholder="Rejection reason..."
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="text-xs border border-[#e5e7eb] rounded px-2 py-1 focus:outline-none focus:border-red-400"
                        />
                        <button
                          onClick={() => handleReview(a._id, "reject")}
                          disabled={reviewing === a._id}
                          className="flex items-center gap-2 justify-center rounded-lg bg-red-500 px-4 py-2 text-sm font-medium text-white hover:bg-red-600 disabled:opacity-50"
                        >
                          <XCircle size={16} /> Reject
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
