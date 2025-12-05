import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, X, Plus } from "lucide-react";
import Head from "../components/Head";
import baseUrl from "../api/api";

const InventoryAdjustments = () => {
  const navigate = useNavigate();
  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";
  
  // Get user info
  const userStr = localStorage.getItem("rootfinuser");
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.email || user?._id || user?.id || "";
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
  
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    type: "All",
    status: "All",
    period: "All",
  });
  
  // Helper function to map locName to warehouse name
  const mapLocNameToWarehouse = (locName) => {
    if (!locName) return "";
    // Remove prefixes like "G.", "Z.", "SG."
    let warehouse = locName.replace(/^[A-Z]\.?\s*/i, "").trim();
    // Add "Branch" if not already present and not "Warehouse"
    if (warehouse && warehouse.toLowerCase() !== "warehouse" && !warehouse.toLowerCase().includes("branch")) {
      warehouse = `${warehouse} Branch`;
    }
    return warehouse;
  };
  
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
  
  // Fetch adjustments
  useEffect(() => {
    const fetchAdjustments = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        if (userId) params.append("userId", userId);
        if (filters.type !== "All") params.append("adjustmentType", filters.type.toLowerCase());
        if (filters.status !== "All") params.append("status", filters.status.toLowerCase());
        
        // For non-admin users, filter by warehouse in the backend
        if (!isAdmin && userWarehouse) {
          params.append("warehouse", userWarehouse);
          console.log(`🔍 Inventory Adjustments: Filtering by warehouse: "${userWarehouse}"`);
        }
        
        const fullUrl = `${API_URL}/api/inventory/adjustments?${params}`;
        console.log(`📡 Inventory Adjustments: Fetching from: ${fullUrl}`);
        
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error("Failed to fetch adjustments");
        const data = await response.json();
        let adjustmentsList = Array.isArray(data) ? data : [];
        
        // Additional client-side filtering as backup (in case backend doesn't filter)
        if (!isAdmin && userWarehouse) {
          const beforeFilter = adjustmentsList.length;
          const userWarehouseLower = userWarehouse.toLowerCase();
          adjustmentsList = adjustmentsList.filter(adj => {
            const adjWarehouse = (adj.warehouse || "").toLowerCase();
            const adjBase = adjWarehouse.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
            const userBase = userWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
            
            return adjWarehouse === userWarehouseLower || 
                   adjBase === userBase ||
                   adjWarehouse.includes(userWarehouseLower) ||
                   userWarehouseLower.includes(adjWarehouse);
          });
          console.log(`✅ Inventory Adjustments: Filtered to ${adjustmentsList.length} adjustments (from ${beforeFilter}) for warehouse: "${userWarehouse}"`);
        }
        
        setAdjustments(adjustmentsList);
      } catch (error) {
        console.error("Error fetching adjustments:", error);
        setAdjustments([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAdjustments();
  }, [API_URL, userId, filters.type, filters.status, isAdmin, userWarehouse]);
  
  // Filter adjustments by search term
  const filteredAdjustments = adjustments.filter(adjustment => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const adjustmentId = adjustment.id || adjustment._id || "";
    return (
      (adjustment.referenceNumber || "").toLowerCase().includes(searchLower) ||
      (adjustment.reason || "").toLowerCase().includes(searchLower) ||
      (adjustment.description || "").toLowerCase().includes(searchLower) ||
      (adjustment.warehouse || "").toLowerCase().includes(searchLower) ||
      String(adjustmentId).toLowerCase().includes(searchLower)
    );
  });

  // Handle adjustment click - navigate to detail page
  const handleAdjustmentClick = (adjustment) => {
    const adjustmentId = adjustment.id || adjustment._id;
    if (adjustmentId) {
      navigate(`/inventory/adjustments/${adjustmentId}`);
    }
  };
  
  return (
    <div className="ml-64 min-h-screen bg-[#f8fafc] p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#1e293b]">
              Inventory Adjustments
            </h1>
            {!loading && (
              <span className="px-3 py-1 rounded-full bg-[#e2e8f0] text-sm font-medium text-[#475569]">
                {filteredAdjustments.length} {filteredAdjustments.length === 1 ? 'adjustment' : 'adjustments'}
              </span>
            )}
          </div>
          <Link
            to="/inventory/adjustments/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1d4ed8] hover:shadow-md"
          >
            <Plus size={18} />
            <span>New Adjustment</span>
          </Link>
        </div>
        
        {/* Search Bar */}
        <div className="relative max-w-md mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#94a3b8]" size={18} />
          <input
            type="text"
            placeholder="Search by reference number, reason, description, or warehouse..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b] transition-colors"
            >
              <X size={18} />
            </button>
          )}
        </div>
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">Filter By:</span>
          <select
            value={filters.type}
            onChange={(e) => setFilters({ ...filters, type: e.target.value })}
            className="rounded-lg border border-[#d7dcf5] bg-white px-3 py-2 text-sm text-[#1f2937] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors"
          >
            <option value="All">Type: All</option>
            <option value="Quantity">Type: Quantity</option>
            <option value="Value">Type: Value</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            className="rounded-lg border border-[#d7dcf5] bg-white px-3 py-2 text-sm text-[#1f2937] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors"
          >
            <option value="All">Status: All</option>
            <option value="Draft">Status: Draft</option>
            <option value="Adjusted">Status: Adjusted</option>
          </select>
          <select
            value={filters.period}
            onChange={(e) => setFilters({ ...filters, period: e.target.value })}
            className="rounded-lg border border-[#d7dcf5] bg-white px-3 py-2 text-sm text-[#1f2937] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors"
          >
            <option value="All">Period: All</option>
            <option value="This Month">Period: This Month</option>
            <option value="Last Month">Period: Last Month</option>
            <option value="This Year">Period: This Year</option>
          </select>
        </div>
      </div>

      {/* Adjustments Table */}
      <div className="rounded-lg border border-[#e2e8f0] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2563eb] border-r-transparent"></div>
              <p className="mt-4 text-sm text-[#64748b]">Loading adjustments...</p>
            </div>
          ) : filteredAdjustments.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="mx-auto w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center mb-4">
                <Search className="text-[#94a3b8]" size={24} />
              </div>
              <p className="text-sm font-medium text-[#1e293b] mb-1">
                {searchTerm ? "No adjustments found" : "No adjustments yet"}
              </p>
              <p className="text-sm text-[#64748b] mb-4">
                {searchTerm ? "Try adjusting your search or filters" : "Create your first inventory adjustment to get started"}
              </p>
              {!searchTerm && (
                <Link
                  to="/inventory/adjustments/new"
                  className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition-colors"
                >
                  <Plus size={16} />
                  Create Adjustment
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
                    Reference Number
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                    Reason
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                    Type
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                    Warehouse
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                    Created By
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                    Created Time
                  </th>
                  <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                    Description
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#e2e8f0] bg-white">
                {filteredAdjustments.map((adjustment, index) => {
                  const adjustmentId = adjustment.id || adjustment._id;
                  if (!adjustmentId) {
                    console.warn("Adjustment missing ID:", adjustment);
                    return null;
                  }
                  return (
                    <tr
                      key={adjustmentId}
                      className="hover:bg-[#f8fafc] transition-colors cursor-pointer group"
                      onClick={() => handleAdjustmentClick(adjustment)}
                    >
                      <td className="px-6 py-4 text-center border-r border-[#e2e8f0]" onClick={(e) => e.stopPropagation()}>
                        <input type="checkbox" className="h-4 w-4 rounded border-[#d1d9f2] text-[#4f46e5] focus:ring-[#4338ca]" />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475569] border-r border-[#e2e8f0]">
                        {formatDate(adjustment.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm border-r border-[#e2e8f0]">
                        <span
                          className="font-semibold text-[#2563eb] group-hover:text-[#1d4ed8] group-hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAdjustmentClick(adjustment);
                          }}
                        >
                          {adjustment.referenceNumber || (adjustmentId && String(adjustmentId).slice(-8)) || "-"}
                        </span>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1e293b] font-medium border-r border-[#e2e8f0]">
                      {adjustment.reason || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475569] border-r border-[#e2e8f0]">
                      <span className="inline-flex items-center rounded-full bg-[#f1f5f9] px-2.5 py-1 text-xs font-medium text-[#475569]">
                        {adjustment.adjustmentType === "quantity" ? "Quantity" : "Value"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm border-r border-[#e2e8f0]">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                        adjustment.status === "adjusted"
                          ? "bg-[#dbeafe] text-[#1e40af]"
                          : "bg-[#fef3c7] text-[#92400e]"
                      }`}>
                        {adjustment.status === "adjusted" ? "Adjusted" : "Draft"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475569] border-r border-[#e2e8f0]">
                      {adjustment.warehouse || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475569] border-r border-[#e2e8f0]">
                      {adjustment.createdBy || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#64748b] border-r border-[#e2e8f0]">
                      {formatDateTime(adjustment.createdAt)}
                    </td>
                    <td className="px-6 py-4 text-sm text-[#475569] max-w-xs truncate">
                      {adjustment.description || "-"}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default InventoryAdjustments;
