import { useState } from "react";
import { Link } from "react-router-dom";
import { UploadCloud, Trash2, ArrowLeft } from "lucide-react";
import Head from "../components/Head";

const ShoeSalesItemGroupCreate = () => {
  const [showAccounts, setShowAccounts] = useState(false);

  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title="New Item Group"
        description="Define a reusable item group template with shared pricing and attributes."
        actions={
          <Link
            to="/shoe-sales/item-groups"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5f5] px-4 text-sm font-medium text-[#1f2937] transition hover:bg-white"
          >
            <ArrowLeft size={16} />
            Back to Groups
          </Link>
        }
      />

      <div className="space-y-6">
        <div className="rounded-3xl border border-[#e1e5f5] bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.25)]">
          <div className="grid gap-8 border-b border-[#e7ebf8] px-8 py-8 md:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <fieldset className="space-y-2">
                  <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                    Type
                  </legend>
                  <div className="flex flex-wrap gap-4 text-sm font-medium text-[#1f2937]">
                    <label className="inline-flex items-center gap-2 rounded-full border border-[#cbd5f5] bg-white px-4 py-2 shadow-sm">
                      <input type="radio" name="type" defaultChecked className="text-[#4285f4]" />
                      Goods
                    </label>
                    <label className="inline-flex items-center gap-2 rounded-full border border-[#cbd5f5] bg-white px-4 py-2 shadow-sm">
                      <input type="radio" name="type" className="text-[#4285f4]" />
                      Service
                    </label>
                  </div>
                </fieldset>
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ef4444]">
                    Item Group Name*
                  </label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none"
                    placeholder="Enter group name"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Summarize this item group..."
                  className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <FloatingCheckbox label="Returnable Item" defaultChecked />
                <FloatingSelect label="Unit" placeholder="Select or type to add" />
                <FloatingSelect label="Manufacturer" placeholder="Select or add manufacturer" />
                <FloatingSelect label="Brand" placeholder="Select or add brand" />
                <fieldset className="space-y-2">
                  <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ef4444]">
                    Tax Preference*
                  </legend>
                  <div className="flex flex-wrap gap-4 text-sm font-medium text-[#1f2937]">
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="tax" defaultChecked className="text-[#4285f4]" />
                      Taxable
                    </label>
                    <label className="inline-flex items-center gap-2">
                      <input type="radio" name="tax" className="text-[#4285f4]" />
                      Non-Taxable
                    </label>
                  </div>
                </fieldset>
                <FloatingSelect label="Inventory Valuation Method" placeholder="FIFO (First In First Out)" />
              </div>

              <div className="space-y-6 rounded-2xl border border-[#e3e8f9] bg-[#f8f9ff] p-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <FloatingCheckbox label="Create Attributes and Options" defaultChecked />
                  <button className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]">
                    + Add more attributes
                  </button>
                </div>
                <div className="grid gap-4 md:grid-cols-[240px,1fr]">
                  <FloatingSelect label="Attribute*" placeholder="Eg: color" />
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#ef4444]">
                      Options*
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="Enter options separated by commas"
                        className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none"
                      />
                      <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#f1b5b5] bg-[#fff5f5] text-[#c2410c] hover:bg-[#fee2e2]">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d7dcf5] bg-[#f8f9ff] p-8 text-center text-[#64748b]">
              <UploadCloud size={36} className="mb-3 text-[#94a3b8]" />
              <p className="text-sm font-medium">Drag image(s) here or browse images</p>
              <p className="mt-2 text-xs leading-5">
                You can add up to 15 images, each not exceeding 5 MB in size and 7000 x 7000 pixels resolution.
              </p>
              <button className="mt-4 rounded-full border border-[#cbd5f5] px-4 py-2 text-sm font-medium text-[#3762f9] hover:bg-[#eef2ff]">
                Upload
              </button>
            </div>
          </div>

          <div className="space-y-6 px-8 py-8">
            <fieldset className="flex flex-wrap gap-6 rounded-2xl border border-[#e3e8f9] bg-[#f8f9ff] px-4 py-4 text-sm font-medium text-[#1f2937]">
              <legend className="px-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                Select your item type
              </legend>
              <FloatingCheckbox label="Sellable" defaultChecked />
              <FloatingCheckbox label="Purchasable" defaultChecked />
              <FloatingCheckbox label="Track Inventory" defaultChecked />
            </fieldset>

            <div className="overflow-x-auto rounded-2xl border border-[#e3e8f9]">
              <table className="min-w-full divide-y divide-[#e6eafb] text-xs uppercase tracking-[0.12em] text-[#64748b]">
                <thead className="bg-[#f5f6ff]">
                  <tr>
                    {[
                      "Item Name*",
                      "SKU",
                      "Cost Price (*)",
                      "Selling Price (*)",
                      "UPC",
                      "HSN Code",
                      "ISBN",
                      "Reorder Point (*)"
                    ].map((label) => (
                      <th key={label} className="px-4 py-3 text-left font-semibold text-[#495580]">
                        {label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-sm font-medium text-[#94a3b8]">
                      Please enter attributes.
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-3">
                <button
                  onClick={() => setShowAccounts((prev) => !prev)}
                  className="inline-flex items-center gap-2 text-sm font-medium text-[#2563eb] transition hover:text-[#1d4ed8]"
                >
                  <span className={`transition-transform ${showAccounts ? "rotate-180" : ""}`}>▾</span>
                  Configure Accounts
                </button>
                {showAccounts && (
                  <div className="grid gap-4 rounded-2xl border border-[#e3e8f9] bg-[#f7f9ff] px-6 py-4 md:grid-cols-3">
                    <FloatingSelect label="Sales Account" placeholder="Sales" />
                    <FloatingSelect label="Purchase Account" placeholder="Cost of Goods Sold" />
                    <FloatingSelect label="Inventory Account" placeholder="Inventory Asset" />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-3">
                <Link
                  to="/shoe-sales/item-groups"
                  className="rounded-md border border-[#d7dcf5] px-5 py-2 text-sm font-medium text-[#475569] transition hover:bg-white"
                >
                  Cancel
                </Link>
                <button className="rounded-md bg-[#3762f9] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#2748c9]">
                  Save Item Group
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShoeSalesItemGroupCreate;
const FloatingCheckbox = ({ label, defaultChecked = false }) => (
  <label className="inline-flex items-center gap-3 rounded-lg border border-[#dbe4ff] bg-white px-4 py-2 text-sm font-medium text-[#1f2937] shadow-sm">
    <input
      type="checkbox"
      defaultChecked={defaultChecked}
      className="h-4 w-4 rounded border-[#cbd5f5] text-[#4285f4] focus:ring-[#4285f4]"
    />
    {label}
  </label>
);

const FloatingSelect = ({ label, placeholder }) => (
  <label className="flex w-full flex-col gap-1 text-sm text-[#475569]">
    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">{label}</span>
    <select className="rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none">
      <option>{placeholder}</option>
    </select>
  </label>
);

