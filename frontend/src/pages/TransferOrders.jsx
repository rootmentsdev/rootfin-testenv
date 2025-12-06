import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import Head from "../components/Head";
import baseUrl from "../api/api";
import { mapLocNameToWarehouse } from "../utils/warehouseMapping";

const TransferOrders = () => {
  const navigate = useNavigate();
  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";
  
  // Get user info
  const userStr = localStorage.getItem("rootfinuser");
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.email || user?._id || user?.id || "";
  const userLocCode = user?.locCode || "";
  const isAdmin = user?.power === "admin";
  
  // Fallback locations mapping
  const fallbackLocations = [
    { "locName": "Z-Edapally1", "locCode": "144" },
    { "locName": "Warehouse", "locCode": "858" },
    { "locName": "G-Edappally", "locCode": "702" },
    { "locName": "HEAD OFFICE01", "locCode": "759" },
    { "locName": "SG-Trivandrum", "locCode": "700" },
    { "locName": "Z- Edappal", "locCode": "100" },
    { "locName": "Z.Perinthalmanna", "locCode": "133" },
    { "locName": "Z.Kottakkal", "locCode": "122" },
    { "locName": "G.Kottayam", "locCode": "701" },
    { "locName": "G.Perumbavoor", "locCode": "703" },
    { "locName": "G.Thrissur", "locCode": "704" },
    { "locName": "G.Chavakkad", "locCode": "706" },
    { "locName": "G.Calicut ", "locCode": "712" },
    { "locName": "G.Vadakara", "locCode": "708" },
    { "locName": "G.Edappal", "locCode": "707" },
    { "locName": "G.Perinthalmanna", "locCode": "709" },
    { "locName": "G.Kottakkal", "locCode": "711" },
    { "locName": "G.Manjeri", "locCode": "710" },
    { "locName": "G.Palakkad ", "locCode": "705" },
    { "locName": "G.Kalpetta", "locCode": "717" },
    { "locName": "G.Kannur", "locCode": "716" },
    { "locName": "G.Mg Road", "locCode": "718" },
    { "locName": "Production", "locCode": "101" },
    { "locName": "Office", "locCode": "102" },
    { "locName": "WAREHOUSE", "locCode": "103" }
  ];
  
  // Get location name - prioritize locCode lookup over username
  let userLocName = "";
  if (user?.locCode) {
    const location = fallbackLocations.find(loc => loc.locCode === user.locCode || loc.locCode === String(user.locCode));
    if (location) {
      userLocName = location.locName;
    }
  }
  if (!userLocName) {
    userLocName = user?.username || user?.locName || "";
  }
  
  const [transferOrders, setTransferOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  
  
  // Get user's warehouse name
  const userWarehouse = mapLocNameToWarehouse(userLocName);
  
  // Format date
  const formatDate = (date) => {
    if (!date) return "-";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "-";
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "-";
    }
  };
  
  // Format datetime
  const formatDateTime = (date) => {
    if (!date) return "-";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "-";
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, "0");
      const minutes = String(d.getMinutes()).padStart(2, "0");
      const ampm = d.getHours() >= 12 ? "PM" : "AM";
      const displayHours = d.getHours() % 12 || 12;
      return `${day}/${month}/${year} ${displayHours}:${minutes} ${ampm}`;
    } catch {
      return "-";
    }
  };
  
  // Fetch transfer orders
  useEffect(() => {
    const fetchTransferOrders = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (userId) params.append("userId", userId);
        if (statusFilter !== "all") params.append("status", statusFilter);
        
        // For non-admin users, filter to show orders where their warehouse is source OR destination
        // This allows stores to see:
        // - Orders where they receive items (destination)
        // - Orders where they send items (source)
        if (!isAdmin && userWarehouse) {
          // Filter by both source and destination - backend will show orders matching either
          params.append("destinationWarehouse", userWarehouse);
          params.append("sourceWarehouse", userWarehouse);
          console.log(`🔍 Transfer Orders: Filtering by warehouse (source OR destination): "${userWarehouse}"`);
        }
        
        const fullUrl = `${API_URL}/api/inventory/transfer-orders?${params}`;
        console.log(`📡 Transfer Orders: Fetching from: ${fullUrl}`);
        
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error("Failed to fetch transfer orders");
        const data = await response.json();
        let orders = Array.isArray(data) ? data : [];
        
        // Additional client-side filtering for non-admin users (in case backend doesn't filter)
        // This is a backup filter - backend should handle it, but this ensures it works
        // Show orders where user's warehouse is source OR destination
        if (!isAdmin && userWarehouse) {
          const userWarehouseLower = userWarehouse.toLowerCase().trim();
          const userBase = userWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
          
          const matchesWarehouse = (orderWarehouse) => {
            if (!orderWarehouse) return false;
            const orderWarehouseLower = orderWarehouse.toString().toLowerCase().trim();
            const orderBase = orderWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
            
            // Exact match
            if (orderWarehouseLower === userWarehouseLower) {
              return true;
            }
            
            // Base name match
            if (orderBase && userBase && orderBase === userBase) {
              return true;
            }
            
            // Partial match
            if (orderWarehouseLower.includes(userWarehouseLower) || userWarehouseLower.includes(orderWarehouseLower)) {
              return true;
            }
            
            return false;
          };
          
          orders = orders.filter(order => {
            const matchesDest = matchesWarehouse(order.destinationWarehouse);
            const matchesSource = matchesWarehouse(order.sourceWarehouse);
            
            // Show if user's warehouse is source OR destination
            return matchesDest || matchesSource;
          });
          
          console.log(`Transfer Orders: Client-side filtered to ${orders.length} orders for warehouse: "${userWarehouse}" (source OR destination)`);
        }
        
        setTransferOrders(orders);
      } catch (error) {
        console.error("Error fetching transfer orders:", error);
        setTransferOrders([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTransferOrders();
  }, [API_URL, userId, statusFilter, isAdmin, userWarehouse]);
  
  // Filter transfer orders by search term
  const filteredOrders = transferOrders.filter(order => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      (order.transferOrderNumber || "").toLowerCase().includes(searchLower) ||
      (order.reason || "").toLowerCase().includes(searchLower) ||
      (order.sourceWarehouse || "").toLowerCase().includes(searchLower) ||
      (order.destinationWarehouse || "").toLowerCase().includes(searchLower)
    );
  });
  
  const getStatusBadge = (status) => {
    const statusMap = {
      transferred: { label: "Transferred", className: "bg-[#ecfdf5] text-[#047857]" },
      in_transit: { label: "In Transit", className: "bg-[#fef3c7] text-[#92400e]" },
      draft: { label: "Draft", className: "bg-[#f3f4f6] text-[#6b7280]" },
    };
    const statusInfo = statusMap[status] || { label: status, className: "bg-[#f3f4f6] text-[#6b7280]" };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${statusInfo.className}`}>
        <span className="h-2 w-2 rounded-full bg-current" />
        {statusInfo.label}
      </span>
    );
  };
  
  const transferredCount = transferOrders.filter(o => o.status === "transferred").length;
  const inTransitCount = transferOrders.filter(o => o.status === "in_transit").length;
  const draftCount = transferOrders.filter(o => o.status === "draft").length;
  
  return (
    <div className="ml-64 min-h-screen bg-[#f8fafc] p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#1e293b]">
              Transfer Orders
            </h1>
            {!loading && (
              <span className="px-3 py-1 rounded-full bg-[#e2e8f0] text-sm font-medium text-[#475569]">
                {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'}
              </span>
            )}
          </div>
          <Link
            to="/inventory/transfer-orders/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1d4ed8] hover:shadow-md"
          >
            <span>+</span>
            <span>New</span>
          </Link>
        </div>
        
        {/* Search Bar */}
        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#94a3b8]" size={18} />
          <input
            type="text"
            placeholder="Search by order number, reason, or warehouse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
          />
        </div>
      </div>

      {/* Transfer Orders Table */}
      <div className="rounded-lg border border-[#e2e8f0] bg-white shadow-sm overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#e5e7eb] px-6 py-4">
          <div className="flex items-center gap-2 text-sm text-[#4b5563]">
            <span className="font-medium text-[#111827]">Transfer period:</span>
            Last 90 days
          </div>
          <div className="flex items-center gap-3 text-sm text-[#6b7280]">
            <button
              onClick={() => setStatusFilter("transferred")}
              className={`flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                statusFilter === "transferred"
                  ? "bg-[#eef2ff] text-[#4338ca]"
                  : "border border-transparent hover:bg-[#f3f4f6]"
              }`}
            >
              Transferred
              <span className={`rounded-full px-2 py-0.5 shadow-sm ${
                statusFilter === "transferred" ? "bg-white text-[#4338ca]" : "bg-[#e5e7eb] text-[#6b7280]"
              }`}>
                {transferredCount}
              </span>
            </button>
            <button
              onClick={() => setStatusFilter("in_transit")}
              className={`rounded-full border border-transparent px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === "in_transit" ? "bg-[#fef3c7] text-[#92400e]" : "hover:bg-[#f3f4f6]"
              }`}
            >
              In Transit ({inTransitCount})
            </button>
            <button
              onClick={() => setStatusFilter("draft")}
              className={`rounded-full border border-transparent px-3 py-1 text-xs font-medium transition-colors ${
                statusFilter === "draft" ? "bg-[#f3f4f6] text-[#6b7280]" : "hover:bg-[#f3f4f6]"
              }`}
            >
              Drafts ({draftCount})
            </button>
            {statusFilter !== "all" && (
              <button
                onClick={() => setStatusFilter("all")}
                className="rounded-full border border-transparent px-3 py-1 text-xs font-medium text-[#6b7280] hover:bg-[#f3f4f6]"
              >
                All
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2563eb] border-r-transparent"></div>
              <p className="mt-4 text-sm text-[#64748b]">Loading transfer orders...</p>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center mb-4">
                <Search className="text-[#94a3b8]" size={24} />
              </div>
              <p className="text-sm font-medium text-[#1e293b] mb-1">
                {searchTerm ? "No transfer orders found" : "No transfer orders yet"}
              </p>
              <p className="text-sm text-[#64748b] mb-4">
                {searchTerm ? "Try adjusting your search" : "Create your first transfer order to get started"}
              </p>
              {!searchTerm && (
                <Link
                  to="/inventory/transfer-orders/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition-colors"
                >
                  <span>+</span>
                  Create Transfer Order
                </Link>
              )}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-[#e2e8f0]">
              <thead className="bg-[#f8fafc]">
                <tr>
                  <th scope="col" className="px-6 py-4 text-center border-r border-[#e2e8f0] text-xs font-semibold uppercase tracking-wider text-[#64748b] w-12">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#d1d9f2] text-[#4f46e5] focus:ring-[#4338ca]" />
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                    Date
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                    Transfer Order #
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                    Reason
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                    Quantity
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                    Source Warehouse
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                    Destination Warehouse
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                    Created By
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                    Created Time
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                    Last Modified
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] bg-white">
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="hover:bg-[#f8fafc] transition-colors cursor-pointer group"
                    onClick={() => navigate(`/inventory/transfer-orders/${order.id}`)}
                  >
                    <td className="px-6 py-4 text-center border-r border-[#e2e8f0]" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" className="h-4 w-4 rounded border-[#d1d9f2] text-[#4f46e5] focus:ring-[#4338ca]" />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475569] border-r border-[#e2e8f0]">
                      {formatDate(order.date)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm border-r border-[#e2e8f0]">
                      <span
                        className="font-semibold text-[#2563eb] group-hover:text-[#1d4ed8] group-hover:underline cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/inventory/transfer-orders/${order.id}`);
                        }}
                      >
                        {order.transferOrderNumber || "-"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475569] border-r border-[#e2e8f0]">
                      {order.reason || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm border-r border-[#e2e8f0]">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold border-r border-[#e2e8f0]">
                      {parseFloat(order.totalQuantityTransferred || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475569] border-r border-[#e2e8f0]">
                      {order.sourceWarehouse || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475569] border-r border-[#e2e8f0]">
                      {order.destinationWarehouse || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475569] border-r border-[#e2e8f0]">
                      {order.createdBy || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#64748b] border-r border-[#e2e8f0]">
                      {formatDateTime(order.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#64748b]">
                      {formatDateTime(order.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default TransferOrders;
