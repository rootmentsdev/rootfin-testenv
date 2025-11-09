import { Link } from "react-router-dom";
import Head from "../components/Head";

const mockTransferOrders = [
  {
    date: "05/11/2025",
    order: "KANNUR OUTWARD",
    reason: "DAMAGE STOCK",
    status: "Transferred",
    quantity: 8,
    source: "Kannur Branch",
    destination: "Warehouse",
    createdBy: "Warehouse Valayamkulam",
    createdTime: "05/11/2025 12:35 PM",
    modifiedBy: "Warehouse Valayamkulam",
    modifiedTime: "08/11/2025 04:57 PM",
  },
  {
    date: "30/10/2025",
    order: "KANNUR 017",
    reason: "SHOES TRANSFER DATA",
    status: "Transferred",
    quantity: 38,
    source: "Warehouse",
    destination: "Kannur Branch",
    createdBy: "Warehouse Valayamkulam",
    createdTime: "30/10/2025 06:20 PM",
    modifiedBy: "Warehouse Valayamkulam",
    modifiedTime: "06/11/2025 05:42 PM",
  },
  {
    date: "30/10/2025",
    order: "KOTTAYAM 019",
    reason: "SHOES TRANSFER DATA",
    status: "Transferred",
    quantity: 71,
    source: "Warehouse",
    destination: "Kottayam Branch",
    createdBy: "Warehouse Valayamkulam",
    createdTime: "30/10/2025 05:57 PM",
    modifiedBy: "Warehouse Valayamkulam",
    modifiedTime: "06/11/2025 04:09 PM",
  },
  {
    date: "30/10/2025",
    order: "EDAPPALLY 031",
    reason: "SHOES TRANSFER DATA",
    status: "Transferred",
    quantity: 58,
    source: "Warehouse",
    destination: "Edapally Branch",
    createdBy: "Warehouse Valayamkulam",
    createdTime: "30/10/2025 03:37 PM",
    modifiedBy: "Warehouse Valayamkulam",
    modifiedTime: "30/10/2025 06:10 PM",
  },
  {
    date: "30/10/2025",
    order: "EDAPPALLY 030",
    reason: "SHOES TRANSFER DATA",
    status: "Transferred",
    quantity: 2,
    source: "Warehouse",
    destination: "Edapally Branch",
    createdBy: "Warehouse Valayamkulam",
    createdTime: "30/10/2025 11:14 AM",
    modifiedBy: "Warehouse Valayamkulam",
    modifiedTime: "30/10/2025 06:08 PM",
  },
  {
    date: "23/10/2025",
    order: "MG ROAD 00002",
    reason: "SHOES TRANSFER DATA",
    status: "Transferred",
    quantity: 111,
    source: "Warehouse",
    destination: "MG Road",
    createdBy: "Warehouse Valayamkulam",
    createdTime: "23/10/2025 02:51 PM",
    modifiedBy: "Warehouse Valayamkulam",
    modifiedTime: "24/10/2025 10:41 AM",
  },
  {
    date: "23/10/2025",
    order: "MG ROAD 00001",
    reason: "SHIRT TRANSFER DATA",
    status: "Transferred",
    quantity: 74,
    source: "Warehouse",
    destination: "MG Road",
    createdBy: "Warehouse Valayamkulam",
    createdTime: "23/10/2025 11:04 AM",
    modifiedBy: "Warehouse Valayamkulam",
    modifiedTime: "24/10/2025 10:11 AM",
  },
  {
    date: "16/10/2025",
    order: "CHAVAKKAD 028",
    reason: "SHIRT TRANSFER DATA",
    status: "Transferred",
    quantity: 70,
    source: "Warehouse",
    destination: "Chavakkad Branch",
    createdBy: "Warehouse Valayamkulam",
    createdTime: "16/10/2025 06:18 PM",
    modifiedBy: "Warehouse Valayamkulam",
    modifiedTime: "24/10/2025 10:33 AM",
  },
  {
    date: "16/10/2025",
    order: "PERUMBAVOOR 016",
    reason: "SHIRT TRANSFER DATA",
    status: "Transferred",
    quantity: 79,
    source: "Warehouse",
    destination: "Perumbavoor Branch",
    createdBy: "Warehouse Valayamkulam",
    createdTime: "16/10/2025 05:57 PM",
    modifiedBy: "Warehouse Valayamkulam",
    modifiedTime: "24/10/2025 11:14 AM",
  },
  {
    date: "16/10/2025",
    order: "THRISSUR 022",
    reason: "SHOES TRANSFER DATA",
    status: "Transferred",
    quantity: 2,
    source: "Warehouse",
    destination: "Thrissur Branch",
    createdBy: "Warehouse Valayamkulam",
    createdTime: "16/10/2025 03:28 PM",
    modifiedBy: "Warehouse Valayamkulam",
    modifiedTime: "18/10/2025 10:35 AM",
  },
];

const TransferOrders = () => {
  return (
    <div className="min-h-screen bg-[#f5f7fb]">
      <Head
        title="Transfer Orders"
        description="Coordinate stock transfers between warehouses or stores."
      />

      <div className="px-8 pt-8 pb-12 ml-64">
        <div className="flex flex-col gap-6">
          <header className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button className="flex items-center gap-2 rounded-md border border-[#d4dcf4] bg-white px-4 py-2 text-sm font-medium text-[#111827] shadow-sm">
                All Transfer Orders
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4 text-[#4b5563]"
                >
                  <path
                    fillRule="evenodd"
                    d="M5.23 7.21a.75.75 0 011.06.02L10 10.939l3.71-3.708a.75.75 0 111.06 1.062l-4.24 4.24a.75.75 0 01-1.06 0L5.25 8.29a.75.75 0 01-.02-1.08z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
              <span className="text-sm text-[#6b7280]">Overview of recent transfers</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden items-center gap-2 rounded-md border border-[#d4dcf4] bg-white px-3 py-2 text-sm text-[#6b7280] shadow-sm lg:flex">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="h-4 w-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M21 21l-4.35-4.35M18 10.5a7.5 7.5 0 11-15 0 7.5 7.5 0 0115 0z"
                  />
                </svg>
                <input
                  type="text"
                  placeholder="Search transfer orders"
                  className="w-56 border-0 p-0 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:ring-0"
                />
              </div>
              <Link
                to="/inventory/transfer-orders/new"
                className="flex items-center gap-2 rounded-md border border-transparent bg-[#4f46e5] px-4 py-2 text-sm font-semibold text-white shadow hover:bg-[#4338ca] focus:outline-none focus:ring-2 focus:ring-[#4338ca]/50"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-4 w-4"
                >
                  <path d="M10.75 4a.75.75 0 10-1.5 0v4.25H5a.75.75 0 000 1.5h4.25V14a.75.75 0 001.5 0V9.75H15a.75.75 0 000-1.5h-4.25V4z" />
                </svg>
                New
              </Link>
              <button className="rounded-md border border-[#d4dcf4] bg-white p-2 text-[#4b5563] shadow-sm hover:bg-[#eef2ff]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path d="M5 3.75A.75.75 0 015.75 3H10a.75.75 0 010 1.5H6.5V14h7V9.75a.75.75 0 011.5 0v4.5A1.75 1.75 0 0113.25 16H5.75A1.75 1.75 0 014 14.25v-9.5A1.75 1.75 0 015.75 3h.5A.75.75 0 015 3.75z" />
                  <path d="M12.78 3.22a.75.75 0 011.06 0l2.5 2.5a.75.75 0 01-.53 1.28H13.5V11a.75.75 0 01-1.5 0V7H10.19a.75.75 0 01-.53-1.28l2.5-2.5z" />
                </svg>
              </button>
              <button className="rounded-md border border-[#d4dcf4] bg-white p-2 text-[#4b5563] shadow-sm hover:bg-[#eef2ff]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="h-5 w-5"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 2a4 4 0 00-4 4v2.268A2 2 0 004 10v3.586l-.707.707A1 1 0 004 16h12a1 1 0 00.707-1.707L16 13.586V10a2 2 0 00-2-1.732V6a4 4 0 00-4-4zM7 6a3 3 0 116 0v2H7V6zm1 5h4a1 1 0 011 1v2H7v-2a1 1 0 011-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            </div>
          </header>

          <section className="rounded-xl border border-[#dbe4ff] bg-white shadow-sm">
            <div className="flex flex-wrap items-center gap-3 border-b border-[#e5e7eb] px-6 py-4">
              <div className="flex items-center gap-2 text-sm text-[#4b5563]">
                <span className="font-medium text-[#111827]">Transfer period:</span>
                Last 90 days
              </div>
              <div className="flex items-center gap-3 text-sm text-[#6b7280]">
                <button className="flex items-center gap-2 rounded-full bg-[#eef2ff] px-3 py-1 text-xs font-semibold text-[#4338ca]">
                  Transferred
                  <span className="rounded-full bg-white px-2 py-0.5 text-[#4338ca] shadow-sm">
                    {mockTransferOrders.length}
                  </span>
                </button>
                <button className="rounded-full border border-transparent px-3 py-1 text-xs font-medium text-[#6b7280] hover:bg-[#f3f4f6]">
                  Pending
                </button>
                <button className="rounded-full border border-transparent px-3 py-1 text-xs font-medium text-[#6b7280] hover:bg-[#f3f4f6]">
                  Drafts
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-[#f9fafb] text-left text-xs font-semibold uppercase tracking-wide text-[#6b7280]">
                    <th className="w-12 px-6 py-4">
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[#cbd5f5] text-[#4f46e5] focus:ring-[#4338ca]"
                      />
                    </th>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Transfer Order #</th>
                    <th className="px-6 py-4">Reason</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Quantity Transferred</th>
                    <th className="px-6 py-4">Source Warehouse</th>
                    <th className="px-6 py-4">Destination Warehouse</th>
                    <th className="px-6 py-4">Created By</th>
                    <th className="px-6 py-4">Created Time</th>
                    <th className="px-6 py-4">Last Modified By</th>
                    <th className="px-6 py-4">Last Modified Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef2ff]">
                  {mockTransferOrders.map((order) => (
                    <tr
                      key={`${order.order}-${order.date}`}
                      className="bg-white text-sm text-[#1f2937] hover:bg-[#f5f7ff]"
                    >
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[#cbd5f5] text-[#4f46e5] focus:ring-[#4338ca]"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{order.date}</td>
                      <td className="px-6 py-4 font-semibold text-[#4338ca] underline decoration-[#c7d2fe] decoration-2 underline-offset-2">
                        {order.order}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-[#4b5563]">
                        {order.reason}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-3 py-1 text-xs font-semibold text-[#047857]">
                          <span className="h-2 w-2 rounded-full bg-[#047857]" />
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-semibold">
                        {order.quantity.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-[#4b5563]">{order.source}</td>
                      <td className="px-6 py-4 text-[#4b5563]">{order.destination}</td>
                      <td className="px-6 py-4 text-[#4b5563]">{order.createdBy}</td>
                      <td className="px-6 py-4 text-[#4b5563]">{order.createdTime}</td>
                      <td className="px-6 py-4 text-[#4b5563]">{order.modifiedBy}</td>
                      <td className="px-6 py-4 text-[#4b5563]">{order.modifiedTime}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-[#e5e7eb] px-6 py-4 text-sm text-[#6b7280]">
              <div>Showing {mockTransferOrders.length} transfers</div>
              <div className="flex items-center gap-2">
                <button className="rounded-md border border-[#d4dcf4] bg-white px-3 py-1 text-sm font-medium text-[#4338ca] shadow-sm hover:bg-[#eef2ff]">
                  1
                </button>
                <button className="rounded-md border border-[#d4dcf4] bg-white px-3 py-1 text-sm font-medium text-[#6b7280] shadow-sm hover:bg-[#f3f4f6]">
                  2
                </button>
                <button className="rounded-md border border-[#d4dcf4] bg-white px-3 py-1 text-sm font-medium text-[#6b7280] shadow-sm hover:bg-[#f3f4f6]">
                  Next
                </button>
              </div>
            </footer>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TransferOrders;

