import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Head from "../components/Head";
import baseUrl from "../api/api";

const SalesInvoices = () => {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

        const params = new URLSearchParams({
          userId: user.email,
        });

        // Add userPower and locCode if available
        if (user.power) params.append("userPower", user.power);
        if (user.locCode) params.append("locCode", user.locCode);

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
  }, [API_URL]);
  return (
    <div className="min-h-screen bg-[#f6f9ff]">
      <Head
        title="Sales Invoices"
        description="Generate and manage invoice documents for completed orders."
      />

      <div className="ml-64 px-10 pb-16 pt-8">
        <div className="flex flex-col gap-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl font-semibold text-[#111827]">All Invoices</h1>
              <p className="text-sm text-[#6b7280]">Review your invoicing activity and keep tabs on payments.</p>
            </div>
            <div className="flex items-center gap-2">
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
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="border-b border-[#eef1fb] bg-[#f9fbff] text-xs font-semibold uppercase tracking-[0.24em] text-[#8a94b0]">
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
                      <th className="px-4 py-4 text-left">DUE DATE</th>
                      <th className="px-4 py-4 text-right">INVOICE AMOUNT</th>
                      <th className="px-4 py-4 text-right">BALANCE</th>
                      <th className="px-4 py-4 text-left">BRANCH</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef1fb] text-sm text-[#1f2937]">
                    {invoices.map((invoice, index) => (
                      <tr
                        key={invoice._id || invoice.id}
                        className={`${index % 2 === 0 ? "bg-white" : "bg-[#f7f9ff]"} hover:bg-[#f2f5ff]`}
                      >
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
                            {(invoice.status || "draft").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-[#4b5563]">
                          {formatDate(invoice.dueDate)}
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
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};

export default SalesInvoices;

