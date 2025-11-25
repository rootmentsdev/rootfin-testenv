import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { X, Edit, FileText, Check, ChevronRight } from "lucide-react";
import baseUrl from "../api/api";

const formatDate = (date) => {
  if (!date) return "";
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

const PurchaseReceiveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";

  const [receive, setReceive] = useState(null);
  const [vendor, setVendor] = useState(null);
  const [receives, setReceives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPdfView, setShowPdfView] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Get user info
        const userStr = localStorage.getItem("rootfinuser");
        const user = userStr ? JSON.parse(userStr) : null;
        const userId = user?.email || user?._id || user?.id || user?.locCode || null;
        const locCode = user?.locCode || "";

        if (!userId) {
          navigate("/purchase/receives");
          return;
        }

        // Fetch the specific purchase receive
        const receiveResponse = await fetch(`${API_URL}/api/purchase/receives/${id}`);
        if (!receiveResponse.ok) {
          const errorText = await receiveResponse.text();
          console.error("Error fetching purchase receive:", receiveResponse.status, errorText);
          throw new Error(`Purchase receive not found: ${receiveResponse.status}`);
        }
        const receiveData = await receiveResponse.json();
        console.log("Purchase receive data loaded:", receiveData);
        setReceive(receiveData);

        // Fetch vendor if vendorId exists
        if (receiveData.vendorId) {
          try {
            const vendorId = receiveData.vendorId._id || receiveData.vendorId;
            const vendorResponse = await fetch(`${API_URL}/api/purchase/vendors/${vendorId}`);
            if (vendorResponse.ok) {
              const vendorData = await vendorResponse.json();
              setVendor(vendorData);
            }
          } catch (error) {
            console.error("Error fetching vendor:", error);
          }
        }

        // Fetch all receives for sidebar
        const receivesResponse = await fetch(`${API_URL}/api/purchase/receives?userId=${userId}${locCode ? `&locCode=${locCode}` : ""}`);
        if (receivesResponse.ok) {
          const receivesData = await receivesResponse.json();
          setReceives(Array.isArray(receivesData) ? receivesData : []);
        }
      } catch (error) {
        console.error("Error loading purchase receive:", error);
        navigate("/purchase/receives");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, navigate, API_URL]);

  if (loading) {
    return (
      <div className="ml-64 min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <div className="text-center">Loading...</div>
      </div>
    );
  }

  if (!receive) {
    return (
      <div className="ml-64 min-h-screen bg-[#f5f7fb] flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-[#64748b] mb-4">Purchase Receive not found</p>
          <Link to="/purchase/receives" className="text-[#2563eb] hover:underline">
            Back to Purchase Receives
          </Link>
        </div>
      </div>
    );
  }

  // Get status badge
  const getStatusBadge = (status) => {
    const statusMap = {
      draft: { label: "Draft", className: "bg-[#f3f4f6] text-[#6b7280]" },
      received: { label: "Received", className: "bg-[#dcfce7] text-[#166534]" },
    };
    const statusInfo = statusMap[status] || { label: status, className: "bg-[#f3f4f6] text-[#6b7280]" };
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  // Get vendor details
  const vendorName = vendor?.displayName || vendor?.companyName || receive.vendorName || "";
  const purchaseOrderNumber = receive.purchaseOrderNumber || (receive.purchaseOrderId?.orderNumber) || "";

  // Calculate total received quantity
  const getTotalReceived = (items) => {
    if (!items || !Array.isArray(items)) return 0;
    return items.reduce((sum, item) => sum + (parseFloat(item.received) || 0), 0);
  };

  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb] flex">
      {/* Left Sidebar - Receives List */}
      <div className="w-80 bg-white border-r border-[#e6eafb] flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-[#e6eafb]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-[#1f2937]">{vendorName}</h2>
          </div>
          <p className="text-sm text-[#64748b]">Total Quantity: {getTotalReceived(receive.items)}</p>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-b border-[#e6eafb] flex gap-2">
          <button 
            onClick={() => navigate(`/purchase/receives/${id}/edit`)}
            className="flex-1 rounded-md border border-[#d7dcf5] bg-white px-3 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
          >
            <Edit size={16} className="inline mr-1" />
            Edit
          </button>
          <button className="flex-1 rounded-md border border-[#d7dcf5] bg-white px-3 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
            <FileText size={16} className="inline mr-1" />
            PDF/Print
          </button>
        </div>

        {/* Receives List */}
        <div className="flex-1 overflow-y-auto">
          {receives.map((r) => {
            const isActive = (r._id || r.id) === id;
            return (
              <Link
                key={r._id || r.id}
                to={`/purchase/receives/${r._id || r.id}`}
                className={`block p-4 border-b border-[#e6eafb] hover:bg-[#f9fafb] transition-colors ${
                  isActive ? "bg-[#f0f4ff] border-l-4 border-l-[#2563eb]" : ""
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isActive ? "text-[#2563eb]" : "text-[#1f2937]"}`}>
                    {r.receiveNumber}
                  </span>
                  {isActive && <ChevronRight size={16} className="text-[#2563eb]" />}
                </div>
                <div className="text-xs text-[#64748b]">
                  {r.purchaseOrderNumber || (r.purchaseOrderId?.orderNumber) || ""}
                </div>
                <div className="mt-1">
                  {getStatusBadge(r.status || "received")}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b border-[#e6eafb] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-semibold text-[#1f2937]">{receive.receiveNumber}</h1>
              {getStatusBadge(receive.status || "received")}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate(`/purchase/receives/${id}/edit`)}
                className="rounded-md border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
              >
                <Edit size={16} className="inline mr-1" />
                Edit
              </button>
              <button className="rounded-md border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
                <FileText size={16} className="inline mr-1" />
                PDF/Print
              </button>
              <button className="rounded-md border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
                Convert to Bill
              </button>
              <button className="rounded-md border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
                Mark as In Transit
              </button>
              <button className="rounded-md border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#dc2626] hover:bg-[#f8fafc] transition-colors">
                Delete
              </button>
              <Link
                to="/purchase/receives"
                className="rounded-md p-2 text-[#64748b] hover:bg-[#f5f7fb] transition-colors"
              >
                <X size={20} />
              </Link>
            </div>
          </div>
          <div className="mt-2 text-sm text-[#64748b]">
            Purchase Orders {receives.length}
          </div>
        </div>

        {/* PDF View Toggle */}
        <div className="bg-white border-b border-[#e6eafb] px-6 py-2">
          <label className="flex items-center gap-2 text-sm text-[#64748b]">
            <input
              type="checkbox"
              checked={showPdfView}
              onChange={(e) => setShowPdfView(e.target.checked)}
              className="rounded border-[#d1d9f2] text-[#4f46e5] focus:ring-[#4338ca]"
            />
            Show PDF View
          </label>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto bg-white rounded-lg border border-[#e6eafb] p-8">
            {/* Purchase Receive Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-[#1f2937] mb-4">PURCHASE RECEIVE</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#64748b]">Receive#</span>
                  <span className="text-sm text-[#1f2937]">{receive.receiveNumber}</span>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(receive.status || "received")}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#64748b]">VENDOR NAME</span>
                  <Link
                    to={`/purchase/vendors/${receive.vendorId?._id || receive.vendorId}`}
                    className="text-sm text-[#2563eb] hover:underline"
                  >
                    {vendorName}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#64748b]">PURCHASE ORDER#</span>
                  <Link
                    to={`/purchase/orders/${receive.purchaseOrderId?._id || receive.purchaseOrderId}`}
                    className="text-sm text-[#2563eb] hover:underline"
                  >
                    {purchaseOrderNumber}
                  </Link>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#64748b]">DATE</span>
                  <span className="text-sm text-[#1f2937]">{formatDate(receive.receivedDate)}</span>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-[#1f2937] mb-4">Items Table</h3>
              <div className="rounded-xl border border-[#e6eafb] overflow-hidden">
                <table className="min-w-full divide-y divide-[#e6eafb]">
                  <thead className="bg-[#f9fafb]">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                        #
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                        ITEMS & DESCRIPTION
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                        QUANTITY
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e6eafb] bg-white">
                    {receive.items && receive.items.length > 0 ? (
                      receive.items.map((item, index) => (
                        <tr key={index} className="hover:bg-[#f9fafb]">
                          <td className="px-6 py-4 text-sm text-[#1f2937]">{index + 1}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded border border-[#e6eafb] bg-[#f9fafb] flex items-center justify-center">
                                <FileText size={20} className="text-[#9ca3af]" />
                              </div>
                              <div>
                                <div className="text-sm font-medium text-[#1f2937]">
                                  {item.itemName || "Unnamed Item"}
                                </div>
                                {item.itemDescription && (
                                  <div className="text-xs text-[#64748b] mt-1">
                                    {item.itemDescription}
                                  </div>
                                )}
                                {item.itemId?.sku && (
                                  <div className="text-xs text-[#64748b] mt-1">
                                    SKU: {item.itemId.sku}
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-[#1f2937]">
                            {parseFloat(item.received || 0).toFixed(2)} PCS
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-sm text-[#64748b]">
                          No items found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Notes */}
            {receive.notes && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-[#64748b] mb-2">
                  Notes
                </h3>
                <p className="text-sm text-[#1f2937] whitespace-pre-wrap">{receive.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseReceiveDetail;

