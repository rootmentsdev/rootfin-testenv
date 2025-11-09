import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, LayoutGrid, List, MoreHorizontal, Plus } from "lucide-react";
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

  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title="All Items"
        description="Plan and manage your entire shoe catalog."
        actions={
          <div className="flex items-center gap-2">
            <ToggleGroup />
            <ActionButton to="/shoe-sales/items/new">
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
    </div>
  );
};

export default ShoeSalesItems;

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

const FloatingSelect = ({ label, options = [], placeholder }) => (
  <label className="flex w-full flex-col gap-1 text-sm text-[#475569]">
    <span className="font-medium">{label}</span>
    <select className="rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none">
      {placeholder && <option>{placeholder}</option>}
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

const ActionButton = ({ children, to, onClick }) => {
  const Component = to ? Link : "button";
  return (
    <Component
      to={to}
      onClick={onClick}
      className="inline-flex h-9 items-center gap-2 rounded-md bg-[#4285f4] px-4 text-sm font-medium text-white transition hover:bg-[#3367d6] active:bg-[#2851a3]"
    >
      {children}
    </Component>
  );
};

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
