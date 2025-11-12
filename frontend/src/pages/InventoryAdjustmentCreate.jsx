import { useState } from "react";
import { Link } from "react-router-dom";
import Head from "../components/Head";

const InventoryAdjustmentCreate = () => {
  const [mode, setMode] = useState("quantity");

  const rows = [
    { id: 1, description: "", available: "", newQty: "", adjusted: "" },
  ];

  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title="New Adjustment"
        description=""
        actions={
          <Link
            to="/inventory/adjustments"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5f5] px-4 text-sm font-medium text-[#1f2937] transition hover:bg-white"
          >
            Back to list
          </Link>
        }
      />

      <div className="rounded-3xl border border-[#e1e5f5] bg-white shadow-[0_18px_60px_-28px_rgba(15,23,42,0.22)]">
        <div className="flex items-center justify-between border-b border-[#e6e9f4] px-8 py-5 text-sm text-[#475569]">
          <div className="font-semibold text-lg text-[#1f2937]">New Adjustment</div>
          <button className="text-[#9ca3af] text-xl">✕</button>
        </div>

        <div className="px-8 py-8 space-y-8">
          <section className="grid gap-3 md:grid-cols-[220px_1fr] items-center text-sm text-[#475569]">
            <label className="font-medium text-[#1f2937]">Mode of adjustment</label>
            <div className="flex items-center gap-6 text-sm text-[#1f2937]">
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="quantity"
                  checked={mode === "quantity"}
                  onChange={() => setMode("quantity")}
                  className="text-[#3762f9]"
                />
                Quantity Adjustment
              </label>
              <label className="inline-flex items-center gap-2">
                <input
                  type="radio"
                  name="mode"
                  value="value"
                  checked={mode === "value"}
                  onChange={() => setMode("value")}
                  className="text-[#3762f9]"
                />
                Value Adjustment
              </label>
            </div>
          </section>

          <section className="grid gap-5 md:grid-cols-2">
            <Field label="Reference Number">
              <input
                type="text"
                className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#94a3b8] focus:outline-none"
              />
            </Field>
            <Field label="Date" required>
              <input
                type="date"
                className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#94a3b8] focus:outline-none"
                defaultValue="2025-11-09"
              />
            </Field>
            <Field label="Account" required>
              <select className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#94a3b8] focus:outline-none">
                <option>Cost of Goods Sold</option>
              </select>
            </Field>
            <Field label="Reason" required>
              <select className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#94a3b8] focus:outline-none">
                <option>Select a reason</option>
              </select>
            </Field>
            <Field label="Branch" required>
              <select className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#94a3b8] focus:outline-none">
                <option>Head Office</option>
              </select>
            </Field>
            <Field label="Warehouse Name" required>
              <select className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#94a3b8] focus:outline-none">
                <option>Warehouse</option>
              </select>
            </Field>
          </section>

          <section className="space-y-3">
            <Field label="Description">
              <textarea
                rows={3}
                className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#94a3b8] focus:outline-none"
                placeholder="Max. 500 characters"
              />
            </Field>
          </section>

          <section className="rounded-2xl border border-[#fbe8c8] bg-[#fffaf2] px-4 py-3 text-sm text-[#6b7280]">
            You can also select or scan the items to be included from the sales order.
            <span className="ml-2 cursor-pointer font-medium text-[#2563eb] hover:text-[#1d4ed8]">
              Select or Scan items
            </span>
          </section>

          <section className="rounded-2xl border border-[#e4e7f1] bg-[#f9fafc]">
            <table className="w-full table-fixed border-collapse text-sm text-[#1f2937]">
              <thead className="border-b border-[#e2e8f0] text-xs font-semibold uppercase tracking-[0.18em] text-[#6b7280]">
                <tr>
                  <th className="px-4 py-3 text-left">Item Details</th>
                  <th className="px-4 py-3 text-left">Quantity Available</th>
                  <th className="px-4 py-3 text-left">New Quantity on Hand</th>
                  <th className="px-4 py-3 text-left">Quantity Adjusted</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} className="border-b border-[#eef0f8]">
                    <td className="px-4 py-4 text-[#9ca3af]">Type or click to select an item.</td>
                    <td className="px-4 py-4 text-[#9ca3af]">0.00</td>
                    <td className="px-4 py-4 text-[#9ca3af]">0.00</td>
                    <td className="px-4 py-4 text-[#9ca3af]">Eg. +10, -10</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="flex flex-wrap items-center gap-3 px-4 py-3 text-sm">
              <button className="rounded-md border border-[#d7dcf5] px-3 py-2 text-sm font-medium text-[#475569] transition hover:bg-white">
                Add New Row
              </button>
              <button className="rounded-md border border-[#d7dcf5] px-3 py-2 text-sm font-medium text-[#475569] transition hover:bg-white">
                Add Items in Bulk
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-dashed border-[#d7dcf5] bg-[#f9fafc] px-4 py-4 text-sm text-[#6b7280]">
            <div className="flex items-center gap-3">
              <span>📎</span>
              <div>
                <p className="font-medium text-[#1f2937]">Attach file(s) to inventory adjustment</p>
                <p className="text-xs text-[#94a3b8]">You can upload a maximum of 5 files, 10MB each</p>
              </div>
              <button className="ml-auto rounded-md border border-[#d7dcf5] px-3 py-2 text-sm font-medium text-[#475569] transition hover:bg-white">
                Upload File
              </button>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-[#e6e9f4] bg-[#f9fafc] px-8 py-4 text-sm">
          <button className="rounded-md border border-[#d7dcf5] px-4 py-2 text-sm font-medium text-[#475569] transition hover:bg-white">
            Save as Draft
          </button>
          <button className="rounded-md border border-[#d7dcf5] px-4 py-2 text-sm font-medium text-[#475569] transition hover:bg-white">
            Convert to Adjusted
          </button>
          <Link
            to="/inventory/adjustments"
            className="rounded-md border border-[#d7dcf5] px-4 py-2 text-sm font-medium text-[#475569] transition hover:bg-white"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
};

const Field = ({ label, required, children }) => (
  <label className="flex flex-col gap-2 text-sm text-[#475569]">
    <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${required ? "text-[#ef4444]" : "text-[#64748b]"}`}>
      {label}
      {required && <span> *</span>}
    </span>
    {children}
  </label>
);

export default InventoryAdjustmentCreate;

