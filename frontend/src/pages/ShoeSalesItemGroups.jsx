import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ChevronDown, Folder, Plus } from "lucide-react";
import Head from "../components/Head";

const columns = [
  { key: "select", label: "" },
  { key: "name", label: "NAME" },
  { key: "sku", label: "SKU" },
  { key: "stock", label: "STOCK ON HAND" },
  { key: "reorder", label: "REORDER POINT" }
];

const skeletonRows = [
  { name: "Shirt Premium", items: 6, sku: "", stock: "20.00", reorder: "" },
  { name: "Shoe Formal - Old", items: 15, sku: "", stock: "0.00", reorder: "" },
  { name: "Shoe Loafer - Old", items: 15, sku: "", stock: "0.00", reorder: "" },
  { name: "Shoe Loafer - 4020", items: 10, sku: "", stock: "308.00", reorder: "" },
  { name: "Shoe Loafer -1008", items: 10, sku: "", stock: "72.00", reorder: "" },
  { name: "Shoe Loafer-4018", items: 10, sku: "", stock: "292.00", reorder: "" },
  { name: "Shoes - Formal 1010", items: 10, sku: "", stock: "587.00", reorder: "" },
  { name: "Shoes Formal - 1002", items: 5, sku: "", stock: "104.00", reorder: "" },
  { name: "Shoes Formal - 872", items: 5, sku: "", stock: "6.00", reorder: "" },
  { name: "Shoes Formal -1003", items: 10, sku: "", stock: "680.00", reorder: "" }
];

const ShoeSalesItemGroups = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItemGroups = async () => {
      try {
        setLoading(true);
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";
        const response = await fetch(`${API_URL}/api/shoe-sales/item-groups`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch item groups");
        }
        
        const data = await response.json();
        // Hide inactive groups
        const activeGroups = (Array.isArray(data) ? data : []).filter(g => g?.isActive !== false && String(g?.isActive).toLowerCase() !== "false");
        
        // Transform data to match table format
        const formattedRows = activeGroups.map((group) => {
          // Backend returns items as a number (count), not an array
          const itemCount = typeof group.items === 'number' 
            ? group.items 
            : (Array.isArray(group.items) ? group.items.length : 0);
          
          return {
            id: group._id || group.id,
            name: group.name,
            items: itemCount,
            sku: group.sku || "",
            stock: typeof group.stock === "number" ? group.stock.toFixed(2) : (group.stock || "0.00"),
            reorder: group.reorder || "",
            // Don't spread the entire group object to avoid including nested objects/arrays
          };
        });
        
        setRows(formattedRows.length > 0 ? formattedRows : skeletonRows);
      } catch (error) {
        console.error("Error fetching item groups:", error);
        // Fallback to skeleton rows on error
        setRows(skeletonRows);
      } finally {
        setLoading(false);
      }
    };

    fetchItemGroups();
  }, []);

  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title="All Item Groups"
        description="Organize shoe products into logical collections for pricing and reporting."
        actions={
          <PrimaryButton to="/shoe-sales/item-groups/new">
            <Plus size={16} />
            <span>New</span>
          </PrimaryButton>
        }
      />

      {loading && (
        <div className="mb-4 text-center text-sm text-[#64748b]">Loading item groups...</div>
      )}

      <div className="rounded-2xl border border-[#e4e6f2] bg-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.18)]">
        {/* View title */}
        <div className="flex items-center justify-between gap-3 border-b border-[#e4e6f2] bg-[#f2f5fb] px-6 py-4">
          <button className="inline-flex items-center gap-2 text-[15px] font-semibold text-[#1f2533]">
            All Item Groups
            <ChevronDown size={14} className="text-[#336ad6]" />
          </button>
          <div className="text-sm text-[#475569]">{rows.length} groups · Showing newest first</div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e6eafb]">
            <thead className="bg-[#f1f4ff]">
              <tr>
                {columns.map((column) => (
                  <th
                    key={column.key}
                    scope="col"
                    className={`px-6 py-4 text-left text-xs font-semibold tracking-[0.14em] text-[#4a5b8b] uppercase ${column.key === "select" ? "w-14" : ""}`}
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
            <tbody className="bg-white divide-y divide-[#eef2ff] text-sm text-[#1f2937]">
              {rows.map((row) => (
                <tr key={row.id || row.name} className="transition-colors hover:bg-[#f7f9ff]">
                  <td className="px-6 py-5">
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded border border-[#cbd5f5]" />
                  </td>
                  <td className="px-6 py-5">
                    {row.id ? (
                      <Link
                        to={`/shoe-sales/item-groups/${row.id}`}
                        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition"
                      >
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#e7ebff] text-[#3a50a0]">
                          <Folder size={20} />
                        </span>
                        <div>
                          <p className="font-semibold text-[#1e293b]">{row.name}</p>
                          <p className="text-xs uppercase tracking-[0.18em] text-[#64748b]">
                            {row.items} Items
                          </p>
                        </div>
                      </Link>
                    ) : (
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-[#e7ebff] text-[#3a50a0]">
                          <Folder size={20} />
                        </span>
                        <div>
                          <p className="font-semibold text-[#1e293b]">{row.name}</p>
                          <p className="text-xs uppercase tracking-[0.18em] text-[#64748b]">
                            {row.items} Items
                          </p>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-[#3b4b7a] font-medium">{row.sku || "—"}</td>
                  <td className="px-6 py-5 text-[#1f2937] font-semibold">{row.stock}</td>
                  <td className="px-6 py-5 text-[#3b4b7a] font-medium">{row.reorder || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 border-t border-[#e4e6f2] bg-[#f7f9ff] px-6 py-4 text-sm text-[#4b5563] md:flex-row md:items-center md:justify-between">
          <div className="font-medium text-[#1f2937]">Page 1 of 1</div>
          <div className="flex items-center gap-2">
            <span>Rows per page:</span>
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

export default ShoeSalesItemGroups;

const PrimaryButton = ({ children, to, onClick }) => {
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