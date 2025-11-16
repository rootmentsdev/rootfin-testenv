import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { SlidersHorizontal, Plus } from "lucide-react";
import Head from "../components/Head";
import baseUrl from "../api/api";

const columns = [
  { key: "select", label: "" },
  { key: "name", label: "NAME" },
  { key: "sku", label: "SKU" },
  { key: "reorder", label: "REORDER LEVEL" }
];

const API_ROOT = (baseUrl?.baseUrl || "").replace(/\/$/, "");

const ShoeSalesItems = () => {
  const skeletonRows = useMemo(() => Array.from({ length: 6 }), []);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;

    const fetchItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_ROOT}/api/shoe-sales/items`);
        if (!response.ok) {
          throw new Error("Unable to load items.");
        }
        const data = await response.json();
        if (!ignore) {
          const list = Array.isArray(data) ? data : [];
          const activeOnly = list.filter((i) => i?.isActive !== false && String(i?.isActive).toLowerCase() !== "false");
          setItems(activeOnly);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to fetch items.");
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };

    fetchItems();

    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="p-6 ml-64 bg-[#f7f8fa] min-h-screen">
      <Head
        title="All Items"
        description="Plan and manage your entire shoe catalog."
        actions={
          <ActionButton to="/shoe-sales/items/new">
            <Plus size={16} />
            <span>New</span>
          </ActionButton>
        }
      />

      <div className="rounded-2xl border border-[#e4e6f2] bg-white shadow-[0_20px_45px_-20px_rgba(15,23,42,0.15)]">
        {/* View filters */}
        <div className="flex items-center justify-between gap-3 border-b border-[#e4e6f2] bg-[#f3f4f6] px-6 py-3 text-sm text-[#111827]">
          <div className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-1.5 text-[#111827] shadow-sm border border-[#e2e5ec]">
            <span className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full bg-[#111827]" />
            <span className="text-sm font-semibold tracking-wide">All Items</span>
          </div>
          <span>{items.length} item{items.length === 1 ? "" : "s"} · Showing newest first</span>
        </div>

        {error && (
          <div className="border-b border-[#ffebeb] bg-[#fff5f5] px-6 py-3 text-sm text-[#b91c1c]">
            {error}
          </div>
        )}

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e8ecfb]">
            <thead className="bg-[#eff1f5]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-6 py-4 text-left text-xs font-semibold tracking-[0.14em] text-[#1f2937] uppercase ${column.key === "select" ? "w-16" : ""}`}
                  >
                    {column.key === "select" ? (
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-[#d7dcf5] bg-white text-[#111827] transition hover:bg-[#f4f4f5]"
                          title="Filter items"
                        >
                          <SlidersHorizontal size={16} />
                        </button>
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[#d7dcf5] text-[#111827] focus:ring-[#111827]"
                        />
                      </div>
                    ) : (
                      column.label
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef2ff] bg-white">
              {loading
                ? skeletonRows.map((_, idx) => (
                    <tr key={idx} className="transition-colors hover:bg-[#f5f7ff]">
                      <td className="px-6 py-5 text-sm text-[#475569]">
                        <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-[#cbd5f5]" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="h-10 w-10 rounded-md border border-dashed border-[#d2d9fb] bg-[#f4f6ff]" />
                          <div className="space-y-2">
                            <div className="h-3.5 w-56 animate-pulse rounded-full bg-[#dee6ff]" />
                            <div className="h-3 w-36 animate-pulse rounded-full bg-[#e7edff]" />
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-3.5 w-28 animate-pulse rounded-full bg-[#e7edff]" />
                      </td>
                      <td className="px-6 py-5">
                        <div className="h-3.5 w-24 animate-pulse rounded-full bg-[#e7edff]" />
                      </td>
                    </tr>
                  ))
                : items.length === 0 ? (
                    <tr>
                      <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-[#6b7280]">
                        No items yet. Create a new item to get started.
                      </td>
                    </tr>
                  ) : (
                    items.map((item) => (
                      <tr key={item._id} className="transition-colors hover:bg-[#f5f6f9]">
                        <td className="px-6 py-5 text-sm text-[#475569]">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-[#cbd5f5] text-[#111827] focus:ring-[#111827]"
                          />
                        </td>
                        <td className="px-6 py-5">
                          <Link
                            to={`/shoe-sales/items/${item._id}`}
                            className="flex items-center gap-3 transition hover:text-[#0f172a]"
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-md border border-dashed border-[#d2d9fb] bg-[#f4f6ff] text-[#9aa4d6]">
                              <ImagePlaceholder />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-[#0f172a] hover:underline">
                                {item.itemName}
                              </p>
                              <p className="text-xs uppercase tracking-[0.14em] text-[#6b7280]">
                                {item.brand || "Unbranded"}
                              </p>
                            </div>
                          </Link>
                        </td>
                        <td className="px-6 py-5 text-sm text-[#0f172a]">{item.sku || "—"}</td>
                        <td className="px-6 py-5 text-sm text-[#0f172a]">{item.reorderPoint || "—"}</td>
                      </tr>
                    ))
                  )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-[#e4e6f2] bg-[#f7f8fb] px-6 py-4 text-sm text-[#111827] md:flex-row md:items-center md:justify-between">
          <div className="font-medium text-[#0f172a]">Page 1 of 1</div>
          <div className="flex items-center gap-2">
            <span className="text-[#111827]">Rows per page:</span>
            <select className="rounded-lg border border-[#cbd5f5] px-3 py-1.5 text-sm text-[#0f172a] focus:border-[#111827] focus:outline-none">
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

const ImagePlaceholder = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
    <path
      d="M7 15.5L10 12l3 3 4-4 3 3.5"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      opacity="0.7"
    />
    <circle cx="9" cy="8" r="1.3" fill="currentColor" opacity="0.5" />
  </svg>
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
      className="inline-flex h-9 items-center gap-2 rounded-md bg-[#2563eb] px-4 text-sm font-medium text-white transition hover:bg-[#1d4ed8] active:bg-[#1e40af]"
    >
      {children}
    </Component>
  );
};
