import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Head from "../components/Head";
import Header from "../components/Header";
import baseUrl from "../api/api";
import { mapLocNameToWarehouse as mapWarehouse } from "../utils/warehouseMapping";
import dataCache from "../utils/cache";

const SalesInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [invoiceToDelete, setInvoiceToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Date range filtering states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [showDateFilter, setShowDateFilter] = useState(false);

  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";

  // Get user info from localStorage
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem("rootfinuser");
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
    }
    return null;
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  // Format currency for display
  const formatCurrency = (amount) => {
    return `₹${parseFloat(amount || 0).toLocaleString("en-IN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "paid":
        return "bg-[#d1fae5] text-[#065f46]";
      case "sent":
        return "bg-[#dbeafe] text-[#1e40af]";
      case "draft":
        return "bg-[#f3f4f6] text-[#374151]";
      case "overdue":
        return "bg-[#fee2e2] text-[#991b1b]";
      default:
        return "bg-[#f3f4f6] text-[#374151]";
    }
  };

  // Get return status badge
  const getReturnStatusBadge = (returnStatus) => {
    switch (returnStatus) {
      case "full":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-[#fee2e2] text-[#991b1b]">
            FULLY RETURNED
          </span>
        );
      case "partial":
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-[#fed7aa] text-[#9a3412]">
            PARTIALLY RETURNED
          </span>
        );
      case "none":
      default:
        return (
          <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-md bg-[#f3f4f6] text-[#6b7280]">
            NOT RETURNED
          </span>
        );
    }
  };

  // Delete invoice
  const handleDeleteInvoice = async () => {
    if (!invoiceToDelete) return;
    
    setDeleting(true);
    try {
      const user = getUserInfo();
      const invoiceId = invoiceToDelete._id || invoiceToDelete.id;
      
      console.log(`Deleting invoice: ${invoiceId}`);
      
      const response = await fetch(
        `${API_URL}/api/sales/invoices/${invoiceId}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user?.email }),
        }
      );

      const responseData = await response.json();
      
      if (!response.ok) {
        console.error("Delete response error:", responseData);
        // Close modal and reset state before showing error
        setShowDeleteModal(false);
        setInvoiceToDelete(null);
        setDeleting(false);
        
        // Show error message to user
        alert(`Cannot delete invoice: ${responseData.message || "Failed to delete invoice"}`);
        return; // Exit early, don't remove from list
      }

      // Only remove from list if deletion was successful
      setInvoices(invoices.filter(inv => (inv._id || inv.id) !== invoiceId));
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
      
      // Clear cache so Financial Summary Report fetches fresh data
      dataCache.clear();
      
      // Set flag to trigger refresh in Financial Summary Report
      sessionStorage.setItem('invoiceDeleted', 'true');
      
      alert("Invoice deleted successfully");
    } catch (error) {
      console.error("Error deleting invoice:", error);
      // Close modal and reset state on error
      setShowDeleteModal(false);
      setInvoiceToDelete(null);
      alert(`Failed to delete invoice: ${error.message}`);
    } finally {
      setDeleting(false);
    }
  };

  // Fetch invoices from API
  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);

      try {
        const user = getUserInfo();
        if (!user || !user.email) {
          setError("User information not found. Please log in again.");
          setLoading(false);
          return;
        }

        // Check if user is admin
        const adminEmails = ['officerootments@gmail.com'];
        const isAdminEmail = user.email && adminEmails.some(email => user.email.toLowerCase() === email.toLowerCase());
        const userIsAdmin = isAdminEmail || user.power === "admin" || (user.locCode && (user.locCode === '858' || user.locCode === '103'));
        setIsAdmin(userIsAdmin);

        const params = new URLSearchParams({
          userId: user.email,
        });

        // Add userPower and locCode if available
        if (user.power) params.append("userPower", user.power);
        if (user.locCode) params.append("locCode", user.locCode);
        
        // Add warehouse parameter for filtering
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
        
        const userWarehouse = mapWarehouse(userLocName);
        if (userWarehouse) {
          params.append("warehouse", userWarehouse);
        }
        // Also pass the locCode for filtering by location code
        if (user?.locCode) {
          params.append("filterLocCode", user.locCode);
        }

        // Add date range filtering if specified
        if (fromDate) params.append("fromDate", fromDate);
        if (toDate) params.append("toDate", toDate);

        const response = await fetch(`${API_URL}/api/sales/invoices?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`Failed to fetch invoices: ${response.statusText}`);
        }

        const data = await response.json();
        setInvoices(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching invoices:", err);
        setError(err.message || "Failed to load invoices");
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [API_URL, fromDate, toDate]);

  // Filter invoices based on search term AND exclude Return/Refund/Cancel categories
  const filteredInvoices = invoices.filter(invoice => {
    // Exclude Return/Refund/Cancel invoices from this page
    const categoryLower = (invoice.category || "").toLowerCase().trim();
    const isReturnRefundCancel = ["return", "refund", "cancel"].includes(categoryLower);
    
    // Also check invoice number pattern (RTN-, RET-, REFUND-INV, etc.)
    const invoiceNumber = (invoice.invoiceNumber || "").toUpperCase();
    const hasReturnPrefix = invoiceNumber.startsWith("RTN-") || 
                           invoiceNumber.startsWith("RET-") || 
                           invoiceNumber.startsWith("REFUND-") || 
                           invoiceNumber.startsWith("CANCEL-");
    
    if (isReturnRefundCancel || hasReturnPrefix) {
      console.log(`🚫 Filtering out return invoice: ${invoice.invoiceNumber} (category: ${invoice.category})`);
      return false; // Don't show return/refund/cancel invoices on this page
    }
    
    // Apply search filter
    const searchLower = searchTerm.toLowerCase();
    return (
      invoice.invoiceNumber?.toLowerCase().includes(searchLower) ||
      invoice.customer?.toLowerCase().includes(searchLower) ||
      invoice.orderNumber?.toLowerCase().includes(searchLower) ||
      invoice.branch?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <Header title="Sales Invoices" />
      <div className="min-h-screen bg-[#f6f9ff]">
        <Head
          title="Sales Invoices"
          description=""
        />

        <div className="ml-64 px-10 pb-16 pt-8">
          <div className="flex flex-col gap-6">
            <header className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-[#111827]">All Invoices</h1>
                <p className="text-sm text-[#6b7280]">Review your invoicing activity and keep tabs on payments.</p>
                <div className="flex items-center gap-4 mt-2">
                  <span className="inline-flex items-center gap-2 rounded-full bg-[#e0f2fe] px-3 py-1 text-sm font-medium text-[#0369a1]">
                    📊 Total: {filteredInvoices.length} invoices
                  </span>
                  {(fromDate || toDate) && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#f0f9ff] px-3 py-1 text-sm font-medium text-[#1e40af]">
                      📅 Filtered by date
                    </span>
                  )}
                  {searchTerm && (
                    <span className="inline-flex items-center gap-2 rounded-full bg-[#fef3c7] px-3 py-1 text-sm font-medium text-[#92400e]">
                      🔍 Search: "{searchTerm}"
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
              <Link
                to="/sales/invoices/returns"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-[#d7def4] bg-white px-4 text-sm font-semibold text-[#4b5563] shadow-sm transition hover:bg-[#f1f3fd]"
              >
                View Returns
              </Link>
              <Link
                to="/sales/invoices/new"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-transparent bg-[#3366ff] px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-[#244fd6] focus:outline-none focus:ring-2 focus:ring-[#244fd6]/40"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
                </svg>
                New
              </Link>
              <button className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#d7def4] bg-white text-[#4b5563] shadow-sm transition hover:bg-[#f1f3fd]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6.75 5.25h10.5m-10.5 13.5h10.5M5.25 7.5h13.5v9H5.25v-9z"
                  />
                </svg>
              </button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Search by invoice #, customer name, or order #..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 rounded-lg border border-[#d7def4] bg-white px-4 py-2.5 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#3366ff] focus:outline-none focus:ring-2 focus:ring-[#3366ff]/20"
              />
              
              {/* Date Filter Toggle Button */}
              <button
                onClick={() => setShowDateFilter(!showDateFilter)}
                className={`rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                  showDateFilter || fromDate || toDate
                    ? 'border-[#3366ff] bg-[#3366ff] text-white'
                    : 'border-[#d7def4] bg-white text-[#6b7280] hover:bg-[#f9fafb]'
                }`}
                title="Filter by date range"
              >
                📅 Date Filter
              </button>
            </div>
            
            {/* Date Range Filter */}
            {showDateFilter && (
              <div className="mt-4 flex items-center gap-4 rounded-lg border border-[#e5e7eb] bg-[#f9fafb] p-4">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-[#374151]">From:</label>
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-[#3366ff] focus:outline-none focus:ring-1 focus:ring-[#3366ff]"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-[#374151]">To:</label>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="rounded-md border border-[#d1d5db] px-3 py-2 text-sm focus:border-[#3366ff] focus:outline-none focus:ring-1 focus:ring-[#3366ff]"
                  />
                </div>
                <button
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                  className="rounded-md bg-[#6b7280] px-3 py-2 text-sm font-medium text-white hover:bg-[#4b5563] transition-colors"
                >
                  Clear
                </button>
              </div>
            )}
          </header>

          <section className="rounded-3xl border border-[#dfe5f5] bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-4 border-b border-[#e7ecf8] px-8 py-5">
              <div className="flex flex-wrap items-center gap-3">
                <div className="inline-flex items-center gap-3 rounded-xl bg-[#f0f4ff] px-4 py-3 text-sm font-medium text-[#415079]">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#415079] shadow-sm">
                    📊
                  </span>
                  Insights on Invoicing
                </div>
                <button className="text-sm font-medium text-[#4f46e5] hover:text-[#4338ca]">
                  Show Details
                </button>
              </div>
            </div>

            {loading ? (
              <div className="px-8 py-12 text-center">
                <p className="text-sm text-[#6b7280]">Loading invoices...</p>
              </div>
            ) : error ? (
              <div className="px-8 py-12 text-center">
                <p className="text-sm text-[#ef4444]">{error}</p>
              </div>
            ) : invoices.length === 0 ? (
              <div className="px-8 py-12 text-center">
                <p className="text-sm text-[#6b7280]">No invoices found. Create your first invoice!</p>
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="px-8 py-12 text-center">
                <p className="text-sm text-[#6b7280]">No invoices match your search. Try a different search term.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#eef1fb] bg-[#f9fbff] text-xs font-semibold uppercase tracking-[0.24em] text-[#8a94b0]">
                      <th className="w-12 px-4 py-4 text-center">#</th>
                      <th className="w-12 px-4 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[#d1d9f2] text-[#4f46e5] focus:ring-[#4338ca]"
                        />
                      </th>
                      <th className="px-4 py-4 text-left">DATE</th>
                      <th className="px-4 py-4 text-left">INVOICE#</th>
                      <th className="px-4 py-4 text-left">ORDER NUMBER</th>
                      <th className="px-4 py-4 text-left">CUSTOMER NAME</th>
                      <th className="px-4 py-4 text-left">INVOICE STATUS</th>
                      <th className="px-4 py-4 text-left">RETURN STATUS</th>
                      <th className="px-4 py-4 text-right">INVOICE AMOUNT</th>
                      <th className="px-4 py-4 text-right">BALANCE</th>
                      <th className="px-4 py-4 text-left">BRANCH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef1fb] text-sm text-[#1f2937]">
                    {filteredInvoices.map((invoice, index) => (
                      <tr
                        key={invoice._id || invoice.id}
                        className={`${index % 2 === 0 ? "bg-white" : "bg-[#f7f9ff]"} hover:bg-[#f2f5ff]`}
                      >
                        <td className="px-4 py-4 text-center text-sm font-medium text-[#6b7280]">
                          {index + 1}
                        </td>
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-[#d1d9f2] text-[#4f46e5] focus:ring-[#4338ca]"
                          />
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-[#4b5563]">
                          {formatDate(invoice.invoiceDate)}
                        </td>
                        <td className="px-4 py-4">
                          <Link
                            to={`/sales/invoices/${invoice._id || invoice.id}`}
                            className="font-semibold text-[#2563eb] hover:text-[#1d4ed8] hover:underline"
                          >
                            {invoice.invoiceNumber}
                          </Link>
                        </td>
                        <td className="px-4 py-4 text-[#4b5563]">{invoice.orderNumber || ""}</td>
                        <td className="px-4 py-4 text-[#1f2937]">{invoice.customer}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md ${getStatusColor(invoice.status)}`}>
                            {(invoice.status || "sent").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          {getReturnStatusBadge(invoice.returnStatus)}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-[#1f2937]">
                          {formatCurrency(invoice.finalTotal)}
                        </td>
                        <td className="px-4 py-4 text-right font-semibold text-[#1f2937]">
                          ₹0.00
                        </td>
                        <td className="px-4 py-4 text-[#4b5563]">{invoice.branch}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {/* Table Footer Summary */}
                <div className="border-t border-[#eef1fb] bg-[#f9fbff] px-6 py-4">
                  <div className="flex items-center justify-between text-sm text-[#6b7280]">
                    <div className="flex items-center gap-4">
                      <span>Showing {filteredInvoices.length} invoice{filteredInvoices.length !== 1 ? 's' : ''}</span>
                      {(fromDate || toDate || searchTerm) && (
                        <span className="text-[#4b5563]">
                          • Filtered from {invoices.length} total
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <span>
                        Total Amount: ₹{filteredInvoices.reduce((sum, inv) => sum + (parseFloat(inv.finalTotal) || 0), 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
    </>
  );
};

export default SalesInvoices;

