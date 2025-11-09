import { Link } from "react-router-dom";
import Head from "../components/Head";

const rows = [
  {
    date: "30/10/2025",
    reason: "Inventory Revaluation",
    description: "Inventory Revaluation",
    status: "Adjusted",
    reference: "TVM ADD ON",
    type: "Quantity",
    createdBy: "Warehouse Valayamkulam",
    createdTime: "30/10/2025 06:24 PM",
    modifiedBy: "Warehouse Valayamkulam",
    modifiedTime: "30/10/2025 06:24 PM",
    warehouse: "Grooms Trivandrum"
  }
];

const InventoryAdjustments = () => {
  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title="Inventory Adjustments"
        description="Monitor adjustment history, statuses, and audit details."
        actions={
          <div className="flex items-center gap-3 text-sm text-[#2563eb]">
            <button className="rounded-md border border-[#2563eb] px-3 py-2 text-sm font-semibold text-[#2563eb] transition hover:bg-[#eef2ff]">
              FIFO Cost Lot Tracking Report
            </button>
            <Link
              to="/inventory/adjustments/new"
              className="rounded-md border border-[#d7dcf5] px-3 py-2 text-sm font-medium text-[#475569] transition hover:bg-white"
            >
              + New
            </Link>
          </div>
        }
      />

      <div className="rounded-3xl border border-[#e1e5f5] bg-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.18)]">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e2e8f5] px-6 py-4 text-sm text-[#475569]">
          <div className="text-lg font-semibold text-[#1f2937]">Inventory Adjustments</div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7280]">Filter By :</span>
              <select className="rounded-lg border border-[#d7dcf5] bg-white px-3 py-1.5 text-sm text-[#1f2937] focus:border-[#94a3b8] focus:outline-none">
                <option>Type: All</option>
              </select>
              <select className="rounded-lg border border-[#d7dcf5] bg-white px-3 py-1.5 text-sm text-[#1f2937] focus:border-[#94a3b8] focus:outline-none">
                <option>Period: All</option>
              </select>
            </div>
            <div className="inline-flex overflow-hidden rounded-lg border border-[#d7dcf5]">
              <button className="flex h-9 w-9 items-center justify-center bg-[#eef2ff] text-[#1f2937]">☰</button>
              <button className="flex h-9 w-9 items-center justify-center text-[#1f2937]">☷</button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-collapse text-sm text-[#1f2937]">
            <thead className="bg-[#f8f9fc] text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
              <tr>
                <th className="w-10 px-4 py-3 text-left">
                  <input type="checkbox" className="h-4 w-4 rounded border-[#d7dcf5] text-[#3762f9]" />
                </th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Reason</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-left">Reference Number</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Created By</th>
                <th className="px-4 py-3 text-left">Created Time</th>
                <th className="px-4 py-3 text-left">Last Modified By</th>
                <th className="px-4 py-3 text-left">Last Modified Time</th>
                <th className="px-4 py-3 text-left">Warehouse Name</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.reference} className="border-b border-[#e7eaf3] hover:bg-[#f9fafc]">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="h-4 w-4 rounded border-[#d7dcf5] text-[#3762f9]" />
                  </td>
                  <td className="px-4 py-3 text-[#475569]">{row.date}</td>
                  <td className="px-4 py-3 text-[#475569]">{row.reason}</td>
                  <td className="px-4 py-3 text-[#475569]">{row.description}</td>
                  <td className="px-4 py-3 text-[#2563eb]">{row.status}</td>
                  <td className="px-4 py-3 text-[#2563eb] underline">{row.reference}</td>
                  <td className="px-4 py-3 text-[#475569]">{row.type}</td>
                  <td className="px-4 py-3 text-[#475569]">{row.createdBy}</td>
                  <td className="px-4 py-3 text-[#475569]">{row.createdTime}</td>
                  <td className="px-4 py-3 text-[#475569]">{row.modifiedBy}</td>
                  <td className="px-4 py-3 text-[#475569]">{row.modifiedTime}</td>
                  <td className="px-4 py-3 text-[#475569]">{row.warehouse}</td>
                </tr>
              ))}
              <tr className="hover:bg-[#f9fafc]">
                <td className="px-4 py-3">
                  <input type="checkbox" className="h-4 w-4 rounded border-[#d7dcf5] text-[#3762f9]" />
                </td>
                <td className="px-4 py-3 text-[#475569]">25/10/2025</td>
                <td className="px-4 py-3 text-[#475569]">Inventory Revaluation</td>
                <td className="px-4 py-3 text-[#475569]">Inventory Revaluation</td>
                <td className="px-4 py-3 text-[#2563eb]">Adjusted</td>
                <td className="px-4 py-3 text-[#2563eb] underline">Calicut Add On</td>
                <td className="px-4 py-3 text-[#475569]">Quantity</td>
                <td className="px-4 py-3 text-[#475569]">Warehouse Valayamkulam</td>
                <td className="px-4 py-3 text-[#475569]">25/10/2025 06:15 PM</td>
                <td className="px-4 py-3 text-[#475569]">Warehouse Valayamkulam</td>
                <td className="px-4 py-3 text-[#475569]">25/10/2025 06:08 PM</td>
                <td className="px-4 py-3 text-[#475569]">Calicut</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default InventoryAdjustments;

