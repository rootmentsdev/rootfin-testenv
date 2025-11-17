import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, List, Grid, Camera, MoreHorizontal, ArrowUp, Search, Filter } from "lucide-react";

const Bills = () => {
  // Mock data for bills
  const [bills] = useState([
    {
      id: 1,
      date: "04/11/2025",
      branch: "Warehouse",
      billNumber: "869-2025-26",
      referenceNumber: "",
      vendorName: "Meenakshi Apparels",
      status: "OPEN",
      dueDate: "04/11/2025",
      amount: "₹11,812.50",
      balanceDue: "₹11,812.50",
      isOverdue: false,
      overdueDays: 0,
    },
    {
      id: 2,
      date: "29/10/2025",
      branch: "Warehouse",
      billNumber: "225",
      referenceNumber: "",
      vendorName: "Rewa footwear co.",
      status: "OVERDUE",
      dueDate: "28/10/2025",
      amount: "₹1,16,156.00",
      balanceDue: "₹1,16,156.00",
      isOverdue: true,
      overdueDays: 13,
    },
    {
      id: 3,
      date: "07/10/2025",
      branch: "Warehouse",
      billNumber: "617-2025-26",
      referenceNumber: "",
      vendorName: "Meenakshi Apparels",
      status: "OVERDUE",
      dueDate: "06/10/2025",
      amount: "₹1,22,493.00",
      balanceDue: "₹1,22,493.00",
      isOverdue: true,
      overdueDays: 41,
    },
    {
      id: 4,
      date: "15/09/2025",
      branch: "Warehouse",
      billNumber: "456-2025-26",
      referenceNumber: "",
      vendorName: "Rewa footwear co.",
      status: "OVERDUE",
      dueDate: "14/09/2025",
      amount: "₹2,50,000.00",
      balanceDue: "₹2,50,000.00",
      isOverdue: true,
      overdueDays: 110,
    },
    {
      id: 5,
      date: "20/11/2025",
      branch: "Warehouse",
      billNumber: "890-2025-26",
      referenceNumber: "",
      vendorName: "Meenakshi Apparels",
      status: "OPEN",
      dueDate: "20/12/2025",
      amount: "₹45,000.00",
      balanceDue: "₹45,000.00",
      isOverdue: false,
      overdueDays: 0,
    },
    {
      id: 6,
      date: "18/11/2025",
      branch: "Warehouse",
      billNumber: "891-2025-26",
      referenceNumber: "",
      vendorName: "Rewa footwear co.",
      status: "OVERDUE",
      dueDate: "17/11/2025",
      amount: "₹83,625.46",
      balanceDue: "₹83,625.46",
      isOverdue: true,
      overdueDays: 1,
    },
  ]);

  // Summary calculations
  const totalOutstanding = "₹19,33,490.46";
  const dueToday = "₹0.00";
  const dueWithin30Days = "₹1,99,857.00";
  const overdueBills = "₹16,17,477.46";

  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb] p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-[#1f2937] leading-tight">
            All Bills
          </h1>
          <button className="text-[#2563eb] hover:text-[#1d4ed8] transition-colors">
            <ChevronDown size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-md border border-[#d7dcf5] bg-white px-3 py-1.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
            <List size={16} />
          </button>
          <button className="rounded-md border border-[#d7dcf5] bg-white px-3 py-1.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
            <Grid size={16} />
          </button>
          <button className="rounded-md border border-[#d7dcf5] bg-white px-3 py-1.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
            <Camera size={16} />
          </button>
          <Link
            to="/purchase/bills/new"
            className="inline-flex items-center gap-2 rounded-md bg-[#3762f9] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#2748c9]"
          >
            <span>+</span>
            <span>New</span>
          </Link>
          <button className="rounded-md border border-[#d7dcf5] bg-white px-3 py-1.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Outstanding Payables */}
        <div className="rounded-xl border border-[#e6eafb] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">
                Total Outstanding Payables
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#1f2937]">
                {totalOutstanding}
              </p>
            </div>
            <div className="rounded-lg bg-[#fff7ed] p-2">
              <ArrowUp size={20} className="text-[#f97316]" />
            </div>
          </div>
        </div>

        {/* Due Today */}
        <div className="rounded-xl border border-[#e6eafb] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">
                Due Today
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#1f2937]">
                {dueToday}
              </p>
            </div>
          </div>
        </div>

        {/* Due Within 30 Days */}
        <div className="rounded-xl border border-[#e6eafb] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">
                Due Within 30 Days
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#1f2937]">
                {dueWithin30Days}
              </p>
            </div>
          </div>
        </div>

        {/* OverDue Bills */}
        <div className="rounded-xl border border-[#e6eafb] bg-white p-5 shadow-sm">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-[#64748b] uppercase tracking-wide">
                OverDue Bills
              </p>
              <p className="mt-2 text-2xl font-semibold text-[#1f2937]">
                {overdueBills}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bills Table */}
      <div className="rounded-xl border border-[#e6eafb] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e6eafb]">
            <thead className="bg-[#f9fafb]">
              <tr>
                <th scope="col" className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-[#d1d9f2] text-[#4f46e5] focus:ring-[#4338ca]"
                  />
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]"
                >
                  <div className="flex items-center gap-2">
                    <span>DATE</span>
                    <Filter size={14} className="text-[#9ca3af]" />
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]"
                >
                  BRANCH
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]"
                >
                  BILL#
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]"
                >
                  REFERENCE NUMBER
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]"
                >
                  VENDOR NAME
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]"
                >
                  STATUS
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]"
                >
                  DUE DATE
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]"
                >
                  AMOUNT
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]"
                >
                  <div className="flex items-center gap-2">
                    <span>BALANCE DUE</span>
                    <Search size={14} className="text-[#9ca3af]" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e6eafb] bg-white">
              {bills.map((bill) => (
                <tr
                  key={bill.id}
                  className="hover:bg-[#f9fafb] transition-colors"
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-[#d1d9f2] text-[#4f46e5] focus:ring-[#4338ca]"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475569]">
                    {bill.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475569]">
                    {bill.branch}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Link
                      to="#"
                      className="font-medium text-[#2563eb] hover:text-[#1d4ed8] hover:underline"
                    >
                      {bill.billNumber}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475569]">
                    {bill.referenceNumber || "-"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475569]">
                    {bill.vendorName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {bill.status === "OPEN" ? (
                      <span className="inline-flex items-center rounded-full bg-[#eff6ff] px-3 py-1 text-xs font-medium text-[#2563eb]">
                        {bill.status}
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-[#fef2f2] px-3 py-1 text-xs font-medium text-[#dc2626]">
                        OVERDUE BY {bill.overdueDays} {bill.overdueDays === 1 ? "DAY" : "DAYS"}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475569]">
                    {bill.dueDate}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#1f2937]">
                    {bill.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#1f2937]">
                    {bill.balanceDue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Bills;

