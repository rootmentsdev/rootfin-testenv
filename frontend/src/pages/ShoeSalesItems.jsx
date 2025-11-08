import { useMemo, useState } from "react";
import { ChevronDown, LayoutGrid, List, MoreHorizontal, Plus, X, UploadCloud } from "lucide-react";
import Head from "../components/Head";

const columns = [
  { key: "select", label: "" },
  { key: "name", label: "NAME" },
  { key: "sku", label: "SKU" },
  { key: "reorder", label: "REORDER LEVEL" },
  { key: "status", label: "" }
];

const ShoeSalesItems = () => {
  const skeletonRows = useMemo(() => Array.from({ length: 6 }), []);
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title="All Items"
        description="Plan and manage your entire shoe catalog."
        actions={
          <div className="flex items-center gap-2">
            <ToggleGroup />
            <ActionButton onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              <span>New</span>
            </ActionButton>
            <MutedButton>
              <MoreHorizontal size={16} />
            </MutedButton>
          </div>
        }
      />

      <div className="bg-white rounded-2xl shadow-[0_20px_45px_-20px_rgba(15,23,42,0.15)] border border-[#e4e6f2]">
        {/* View filters */}
        <div className="flex items-center justify-between gap-3 border-b border-[#e4e6f2] bg-[#f1f4fb] px-6 py-3 text-sm text-[#475569]">
          <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-[#1a237e] shadow-sm">
            <span className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[#1a73e8]" />
            <span className="text-sm font-semibold tracking-wide">All Items</span>
          </div>
          <span>0 items · Showing newest first</span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e8ecfb]">
            <thead className="bg-[#eff4ff]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-6 py-4 text-left text-xs font-semibold tracking-[0.14em] text-[#4a5b8b] uppercase ${column.key === "select" ? "w-12" : ""}`}
                  >
                    {column.key === "select" ? (
                      <input
                        type="checkbox"
                        className="h-4 w-4 rounded border-[#d7dcf5] text-[#3762f9] focus:ring-[#3762f9]"
                      />
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[#eef2ff]">
              {skeletonRows.map((_, idx) => (
                <tr key={idx} className="transition-colors hover:bg-[#f5f7ff]">
                  <td className="px-6 py-5 text-sm text-[#475569]">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-[#cbd5f5]" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-10 rounded-md border border-dashed border-[#c7d2fe] bg-[#eef2ff]" />
                      <div className="space-y-2">
                        <div className="h-3.5 w-56 rounded-full bg-[#dee6ff] animate-pulse" />
                        <div className="h-3 w-36 rounded-full bg-[#e7edff] animate-pulse" />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-3.5 w-28 rounded-full bg-[#e7edff] animate-pulse" />
                  </td>
                  <td className="px-6 py-5">
                    <div className="h-3.5 w-24 rounded-full bg-[#e7edff] animate-pulse" />
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button className="inline-flex items-center rounded-lg border border-[#cbd5f5] px-4 py-2 text-xs font-medium uppercase tracking-[0.12em] text-[#3952a2] transition hover:bg-[#eef2ff] hover:text-[#1e3a8a]">
                      Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-[#e4e6f2] bg-[#f7f9ff] px-6 py-4 text-sm text-[#4b5563] md:flex-row md:items-center md:justify-between">
          <div className="font-medium text-[#1f2937]">Page 1 of 1</div>
          <div className="flex items-center gap-2">
            <span className="text-[#475569]">Rows per page:</span>
            <select className="rounded-lg border border-[#cbd5f5] px-3 py-1.5 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none">
              <option>10</option>
              <option>20</option>
              <option>50</option>
            </select>
          </div>
        </div>
      </div>
      {showCreateModal && (
        <ItemCreateModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
};

export default ShoeSalesItems;

const ItemCreateModal = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 px-4 py-10 backdrop-blur-sm">
      <div className="w-full max-w-5xl overflow-hidden rounded-3xl bg-white shadow-[0_40px_120px_-40px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between border-b border-[#e3e8f9] bg-[#f5f7ff] px-6 py-5">
          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-[#1f2937]">Create New Item</h2>
            <p className="text-sm text-[#4b5563]">Capture details for sales, purchase, and inventory workflows.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 text-[#94a3b8] transition hover:bg-[#f1f5f9] hover:text-[#1f2937]"
          >
            <X size={20} />
          </button>
        </div>
        <div className="space-y-10 px-6 py-8 text-[#1f2937]">
          <section>
            <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
              <div className="space-y-5">
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
                <div className="grid gap-6 sm:grid-cols-2">
                  <FloatingField label="Item Name" placeholder="Enter item name" />
                  <FloatingField label="SKU" placeholder="e.g. KSB-36" />
                  <FloatingField label="Unit" placeholder="Pairs" />
                  <FloatingField label="HSN Code" placeholder="Enter HSN" />
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <FloatingCheckbox label="Returnable item" defaultChecked />
                  <FloatingSelect
                    label="Tax Preference"
                    options={["Taxable", "Non-taxable"]}
                  />
                </div>
              </div>
              <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d7dcf5] bg-[#f8f9ff]/60 p-8 text-center text-[#64748b]">
                <UploadCloud size={36} className="mb-3 text-[#94a3b8]" />
                <p className="text-sm font-medium">Drag images here or browse</p>
                <p className="mt-2 text-xs leading-5">
                  You can add up to 15 images, each not exceeding 5MB in size (3000 x 3000 px).
                </p>
                <button className="mt-4 rounded-full border border-[#cbd5f5] px-4 py-2 text-sm font-medium text-[#3762f9] hover:bg-[#eef2ff]">
                  Upload
                </button>
              </div>
            </div>
          </section>

          <section className="grid gap-6 md:grid-cols-3">
            <FloatingField label="Dimensions" placeholder="Length × Width × Height" hint="cm" />
            <FloatingField label="Weight" placeholder="Add weight" hint="kg" />
            <FloatingField label="Brand" placeholder="Select or add brand" inputType="select" />
            <FloatingField label="Manufacturer" placeholder="Select or add manufacturer" inputType="select" />
            <FloatingField label="UPC" placeholder="Enter UPC" />
            <FloatingField label="MPN" placeholder="Enter MPN" />
            <FloatingField label="EAN" placeholder="Enter EAN" />
            <FloatingField label="ISBN" placeholder="Enter ISBN" />
            <FloatingField label="Size" placeholder="Select size" inputType="select" />
          </section>

          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#dbe4ff] bg-[#f7f9ff] p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[#1f2937]">Sales Information</h3>
              <div className="mt-4 space-y-4">
                <FloatingCheckbox label="Sellable" defaultChecked />
                <FloatingField label="Selling Price" placeholder="0.00" prefix="INR" />
                <FloatingField label="Sales Account" placeholder="Select account" inputType="select" />
                <FloatingField label="Description" placeholder="Optional description" inputType="textarea" />
              </div>
            </div>
            <div className="rounded-2xl border border-[#dbe4ff] bg-[#f7f9ff] p-6 shadow-sm">
              <h3 className="text-sm font-semibold text-[#1f2937]">Purchase Information</h3>
              <div className="mt-4 space-y-4">
                <FloatingCheckbox label="Purchasable" defaultChecked />
                <FloatingField label="Cost Price" placeholder="0.00" prefix="INR" />
                <FloatingField label="Cost Account" placeholder="Cost of Goods Sold" inputType="select" />
                <FloatingField label="Preferred Vendor" placeholder="Select vendor" inputType="select" />
                <FloatingField label="Description" placeholder="Optional description" inputType="textarea" />
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-[#1f2937]">Tax & Inventory</h3>
            <div className="grid gap-4 md:grid-cols-2">
              <FloatingField label="Default Tax Rate (Intra-state)" placeholder="CGST 9% + SGST 9%" inputType="select" />
              <FloatingField label="Default Tax Rate (Inter-state)" placeholder="IGST 18%" inputType="select" />
            </div>
            <div className="rounded-2xl border border-[#dbe4ff] bg-[#f7f9ff] p-6 shadow-sm">
              <div className="space-y-5">
                <FloatingCheckbox label="Track inventory for this item" defaultChecked />
                <FloatingCheckbox label="Track bin location for this item" />
                <div className="space-y-3">
                  <p className="text-sm font-semibold text-[#1f2937]">Advanced Inventory Tracking</p>
                  <div className="flex flex-wrap gap-4">
                    <FloatingRadio name="tracking" label="None" defaultChecked />
                    <FloatingRadio name="tracking" label="Track Serial Number" />
                    <FloatingRadio name="tracking" label="Track Batches" />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <FloatingField label="Inventory Account" placeholder="Select an account" inputType="select" />
                    <FloatingField label="Inventory Valuation Method" placeholder="Select valuation method" inputType="select" />
                  </div>
                  <FloatingField label="Reorder Point" placeholder="Enter quantity" />
                </div>
              </div>
            </div>
            <div className="rounded-xl border border-[#d7dcf5] bg-[#f5f7ff] px-4 py-3 text-sm text-[#475569]">
              <strong className="font-semibold text-[#1f2937]">Note:</strong> You can add opening stock on the item details page by clicking the gear icon under Warehouses.
            </div>
          </section>
        </div>
        <div className="flex items-center justify-end gap-3 border-t border-[#e8ecfb] bg-[#f9faff] px-6 py-4">
          <button
            onClick={onClose}
            className="rounded-md border border-[#d7dcf5] px-5 py-2 text-sm font-medium text-[#475569] transition hover:bg-white"
          >
            Cancel
          </button>
          <button className="rounded-md bg-[#3762f9] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#2748c9]">
            Save Item
          </button>
        </div>
      </div>
    </div>
  );
};

const FloatingField = ({ label, placeholder, inputType = "input", hint, prefix }) => (
  <label className="flex w-full flex-col gap-1 text-sm text-[#475569]">
    <span className="font-medium">{label}</span>
    {inputType === "textarea" ? (
      <textarea
        placeholder={placeholder}
        rows={3}
        className="rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] placeholder:text-[#94a3b8] focus:border-[#3762f9] focus:outline-none"
      />
    ) : inputType === "select" ? (
      <select className="rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#3762f9] focus:outline-none">
        <option>{placeholder}</option>
      </select>
    ) : (
      <div className="flex items-center rounded-lg border border-[#d7dcf5] focus-within:border-[#3762f9]">
        {prefix && <span className="pl-3 text-xs font-semibold uppercase text-[#64748b]">{prefix}</span>}
        <input
          type="text"
          placeholder={placeholder}
          className="w-full rounded-lg px-3 py-2 text-sm text-[#1f2937] placeholder:text-[#94a3b8] focus:outline-none"
        />
        {hint && <span className="pr-3 text-xs text-[#94a3b8]">{hint}</span>}
      </div>
    )}
  </label>
);

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

const FloatingSelect = ({ label, options = [] }) => (
  <label className="flex w-full flex-col gap-1 text-sm text-[#475569]">
    <span className="font-medium">{label}</span>
    <select className="rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none">
      {options.map((option) => (
        <option key={option}>{option}</option>
      ))}
    </select>
  </label>
);

const FloatingRadio = ({ name, label, defaultChecked = false }) => (
  <label className="inline-flex items-center gap-2 rounded-full border border-[#dbe4ff] bg-white px-4 py-2 text-sm font-medium text-[#1f2937] shadow-sm">
    <input
      type="radio"
      name={name}
      defaultChecked={defaultChecked}
      className="text-[#4285f4] focus:ring-[#4285f4]"
    />
    {label}
  </label>
);

const ActionButton = ({ children, onClick }) => (
  <button
    onClick={onClick}
    className="inline-flex h-9 items-center gap-2 rounded-md bg-[#4285f4] px-4 text-sm font-medium text-white transition hover:bg-[#3367d6] active:bg-[#2851a3]"
  >
    {children}
  </button>
);

const MutedButton = ({ children }) => (
  <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#d2d8e4] bg-white text-[#2f3445] transition hover:bg-[#eef1f7] active:bg-[#e2e6f0]">
    {children}
  </button>
);

const ToggleGroup = () => (
  <div className="inline-flex h-9 items-center overflow-hidden rounded-md border border-[#d2d8e4] bg-[#eef1f7] text-[#2f3445] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)]">
    <button className="flex h-full w-10 items-center justify-center transition-colors hover:bg-white active:bg-[#dfe4ef]">
      <LayoutGrid size={15} />
    </button>
    <div className="h-5 w-px bg-[#d2d8e4]" />
    <button className="flex h-full w-10 items-center justify-center transition-colors hover:bg-white active:bg-[#dfe4ef]">
      <List size={15} />
    </button>
  </div>
);
