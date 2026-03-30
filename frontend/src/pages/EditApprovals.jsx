import { useEffect, useState } from "react";
import Headers from "../components/Header.jsx";
import baseUrl from "../api/api.js";
import { Helmet } from "react-helmet";

const statusColors = {
  pending:  "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const EditApprovals = () => {
  const currentUser = JSON.parse(localStorage.getItem("rootfinuser"));
  const isSuperAdmin = ["super_admin", "superadmin"].includes((currentUser?.power || "").toLowerCase());

  const [requests, setRequests] = useState([]);
  const [statusFilter, setStatusFilter] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState(null);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `${baseUrl.baseUrl}api/tws/editRequests?status=${statusFilter}`
      );
      const json = await res.json();
      setRequests(json.data || []);
    } catch (err) {
      console.error("Failed to fetch edit requests:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter]);

  const handleApprove = async (id) => {
    if (!window.confirm("Approve this edit request?")) return;
    try {
      const res = await fetch(`${baseUrl.baseUrl}api/tws/editRequest/${id}/approve`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewedBy: currentUser.email || currentUser.username }),
      });
      const json = await res.json();
      if (!res.ok) { alert("❌ " + json.message); return; }
      alert("✅ Approved and transaction updated.");
      fetchRequests();
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  };

  const handleReject = async (id) => {
    const reason = window.prompt("Reason for rejection (optional):");
    if (reason === null) return; // cancelled
    try {
      const res = await fetch(`${baseUrl.baseUrl}api/tws/editRequest/${id}/reject`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewedBy: currentUser.email || currentUser.username,
          rejectReason: reason,
        }),
      });
      const json = await res.json();
      if (!res.ok) { alert("❌ " + json.message); return; }
      alert("✅ Request rejected.");
      fetchRequests();
    } catch (err) {
      alert("❌ Error: " + err.message);
    }
  };

  if (!isSuperAdmin) {
    return (
      <div>
        <Headers title="Edit Approvals" />
        <div className="ml-[240px] p-6">
          <p className="text-red-600 font-semibold">Access denied. Super admin only.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>Edit Approvals | RootFin</title></Helmet>
      <div>
        <Headers title="Edit Approvals" />
        <div className="ml-[240px] p-6 bg-gray-100 min-h-screen">
          <div className="flex gap-3 mb-4">
            {["pending", "approved", "rejected"].map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-4 py-2 rounded capitalize text-sm font-medium border transition ${
                  statusFilter === s
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                {s}
              </button>
            ))}
            <button
              onClick={fetchRequests}
              className="ml-auto px-4 py-2 rounded text-sm bg-white border border-gray-300 hover:bg-gray-50"
            >
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : requests.length === 0 ? (
            <div className="bg-white rounded-lg p-8 text-center text-gray-500 shadow">
              No {statusFilter} requests found.
            </div>
          ) : (
            <div className="space-y-3">
              {requests.map(req => (
                <div key={req._id} className="bg-white rounded-lg shadow p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-semibold text-gray-800">
                          Invoice: {req.invoiceNo || "—"}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[req.status]}`}>
                          {req.status}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                          {req.source || "—"}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        Store: <span className="font-medium">{req.locCode}</span>
                        {" · "}Requested by: <span className="font-medium">{req.requestedByName || req.requestedBy}</span>
                        {" · "}{new Date(req.createdAt).toLocaleString()}
                      </div>
                      {req.status !== "pending" && (
                        <div className="text-sm text-gray-500 mt-0.5">
                          {req.status === "rejected" ? "Rejected" : "Reviewed"} by {req.reviewedBy}
                          {req.rejectReason && <span> — "{req.rejectReason}"</span>}
                        </div>
                      )}
                    </div>

                    <div className="flex gap-2 shrink-0">
                      <button
                        onClick={() => setExpandedId(expandedId === req._id ? null : req._id)}
                        className="text-sm px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
                      >
                        {expandedId === req._id ? "Hide" : "Details"}
                      </button>
                      {req.status === "pending" && (
                        <>
                          <button
                            onClick={() => handleApprove(req._id)}
                            className="text-sm px-3 py-1.5 rounded bg-green-600 text-white hover:bg-green-700"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req._id)}
                            className="text-sm px-3 py-1.5 rounded bg-red-500 text-white hover:bg-red-600"
                          >
                            Reject
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {expandedId === req._id && (
                    <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="font-semibold text-gray-700 mb-1">Current Values</p>
                        <table className="w-full text-xs border-collapse">
                          <tbody>
                            {["cash","rbl","bank","upi","amount","invoiceNo","customerName"].map(k => (
                              <tr key={k} className="border-b">
                                <td className="py-1 pr-2 text-gray-500 capitalize">{k}</td>
                                <td className="py-1 font-medium">{String(req.oldData?.[k] ?? "—")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div>
                        <p className="font-semibold text-gray-700 mb-1">Requested Values</p>
                        <table className="w-full text-xs border-collapse">
                          <tbody>
                            {["cash","rbl","bank","upi","amount","invoiceNo","customerName"].map(k => {
                              const changed = String(req.oldData?.[k]) !== String(req.newData?.[k]);
                              return (
                                <tr key={k} className={`border-b ${changed ? "bg-yellow-50" : ""}`}>
                                  <td className="py-1 pr-2 text-gray-500 capitalize">{k}</td>
                                  <td className={`py-1 font-medium ${changed ? "text-orange-600" : ""}`}>
                                    {String(req.newData?.[k] ?? "—")}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default EditApprovals;
