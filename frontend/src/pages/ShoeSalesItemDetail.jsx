import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  MoreHorizontal,
  Pencil,
  Boxes,
  ClipboardList,
  ShoppingCart,
  PackageSearch,
  Activity,
  Calendar,
  Warehouse,
} from "lucide-react";
import baseUrl from "../api/api";

const API_ROOT = (baseUrl?.baseUrl || "").replace(/\/$/, "");

const formatCurrency = (value) => {
  if (!value && value !== 0) return "—";
  const numberValue = Number(value);
  if (Number.isNaN(numberValue)) return value;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(numberValue);
};

const ShoeSalesItemDetail = () => {
  const { itemId } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState(null);
  const [itemsList, setItemsList] = useState([]);
  const [loadingItem, setLoadingItem] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let ignore = false;
    const fetchItem = async () => {
      setLoadingItem(true);
      setError(null);
      try {
        const response = await fetch(`${API_ROOT}/api/shoe-sales/items/${itemId}`);
        if (!response.ok) {
          if (response.status === 404) {
            throw new Error("Item not found.");
          }
          throw new Error("Unable to load item.");
        }
        const data = await response.json();
        if (!ignore) {
          setItem(data);
        }
      } catch (err) {
        if (!ignore) {
          setError(err.message || "Failed to fetch item.");
        }
      } finally {
        if (!ignore) {
          setLoadingItem(false);
        }
      }
    };

    if (itemId) {
      fetchItem();
    }

    return () => {
      ignore = true;
    };
  }, [itemId]);

  useEffect(() => {
    let ignore = false;

    const fetchList = async () => {
      setLoadingList(true);
      try {
        const response = await fetch(`${API_ROOT}/api/shoe-sales/items`);
        if (!response.ok) {
          throw new Error("Unable to load items.");
        }
        const data = await response.json();
        if (!ignore) {
          setItemsList(Array.isArray(data) ? data : []);
        }
      } catch {
        if (!ignore) {
          setItemsList([]);
        }
      } finally {
        if (!ignore) {
          setLoadingList(false);
        }
      }
    };

    fetchList();
    return () => {
      ignore = true;
    };
  }, []);

  const warehouses = useMemo(
    () => [
      { name: "Stock on Hand", accounting: 0, committed: 0, available: 0 },
      { name: "Stock on Hand", accounting: 0, committed: 0, available: 0, physical: true },
    ],
    []
  );

  if (loadingItem) {
    return (
      <div className="ml-64 flex min-h-screen items-center justify-center bg-[#f5f7fb] p-6">
        <div className="space-y-3 text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-[#cbd5f5] border-t-[#3762f9]" />
          <p className="text-sm font-medium text-[#475569]">Loading item details…</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="ml-64 flex min-h-screen items-center justify-center bg-[#f5f7fb] p-6">
        <div className="max-w-md rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-[#1f2937]">We couldn&apos;t find the item.</h2>
          <p className="mt-2 text-sm text-[#6b7280]">{error || "Please try again or pick a different item."}</p>
          <button
            onClick={() => navigate("/shoe-sales/items")}
            className="mt-4 inline-flex items-center gap-2 rounded-md bg-[#3762f9] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2748c9]"
          >
            <ArrowLeft size={16} />
            Back to Items
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb] p-6">
      <div className="flex gap-6">
        <aside className="w-72 shrink-0 rounded-3xl border border-[#e1e5f5] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#edf1ff] px-4 py-3">
            <h2 className="text-sm font-semibold text-[#1f2937]">All Items</h2>
            <Link
              to="/shoe-sales/items/new"
              className="inline-flex h-8 items-center justify-center rounded-md bg-[#3762f9] px-2 text-xs font-semibold text-white transition hover:bg-[#2748c9]"
            >
              + New
            </Link>
          </div>
          <div className="max-h-[calc(100vh-12rem)] overflow-y-auto">
            {loadingList ? (
              <div className="space-y-3 px-4 py-4">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <div key={idx} className="space-y-2 rounded-xl border border-[#eef2ff] p-3">
                    <div className="h-3.5 w-32 animate-pulse rounded-full bg-[#e6ebff]" />
                    <div className="h-3 w-20 animate-pulse rounded-full bg-[#f0f2ff]" />
                  </div>
                ))}
              </div>
            ) : itemsList.length === 0 ? (
              <div className="px-4 py-5 text-sm text-[#6b7280]">No items available.</div>
            ) : (
              <ul className="divide-y divide-[#edf1ff]">
                {itemsList.map((entry) => {
                  const isActive = entry._id === itemId;
                  return (
                    <li key={entry._id}>
                      <Link
                        to={`/shoe-sales/items/${entry._id}`}
                        className={`flex items-center justify-between px-4 py-3 text-sm transition ${
                          isActive ? "bg-[#eef2ff] font-semibold text-[#1f2937]" : "text-[#475569] hover:bg-[#f6f8ff]"
                        }`}
                      >
                        <div className="flex flex-col">
                          <span>{entry.itemName || "Untitled Item"}</span>
                          <span className="text-xs text-[#94a3b8]">{entry.sku || "No SKU"}</span>
                        </div>
                        <span className="text-xs font-semibold text-[#1f2937]">
                          {formatCurrency(entry.sellingPrice || 0)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </aside>

        <main className="flex-1 space-y-6">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div className="space-y-1">
              <Link
                to="/shoe-sales/items"
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]"
              >
                <ArrowLeft size={14} /> Back to Items
              </Link>
              <h1 className="text-2xl font-semibold text-[#111827]">{item.itemName}</h1>
              <p className="text-sm text-[#6b7280]">{item.brand || "No brand associated"}</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d7dcf5] px-4 text-sm font-medium text-[#475569] transition hover:bg-white">
                <Pencil size={16} />
                Edit
              </button>
              <button className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d7dcf5] px-4 text-sm font-medium text-[#475569] transition hover:bg-white">
                <Boxes size={16} />
                Adjust Stock
              </button>
              <button className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#d7dcf5] text-[#475569] transition hover:bg-white">
                <MoreHorizontal size={18} />
              </button>
            </div>
          </header>

          <section className="grid gap-6 lg:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <DetailCard title="Overview">
                <dl className="grid gap-4 md:grid-cols-2">
                  <DetailItem label="Item Type" value={item.type === "service" ? "Service" : "Inventory Item"} />
                  <DetailItem label="SKU" value={item.sku || "—"} />
                  <DetailItem label="Unit" value={item.unit || "—"} />
                  <DetailItem label="HSN Code" value={item.hsnCode || "—"} />
                  <DetailItem label="Brand" value={item.brand || "—"} />
                  <DetailItem label="Manufacturer" value={item.manufacturer || "—"} />
                  <DetailItem label="Tax Preference" value={item.taxPreference === "non-taxable" ? "Tax Exempt" : "Taxable"} />
                  <DetailItem label="Interstate Tax Rate" value={item.taxRateInter || "—"} />
                  <DetailItem label="Intrastate Tax Rate" value={item.taxRateIntra || "—"} />
                  <DetailItem label="Inventory Account" value={item.inventoryAccount || "Inventory Asset"} />
                  <DetailItem label="Inventory Valuation Method" value={item.inventoryValuation || item.inventoryValuationMethod || "FIFO (First In First Out)"} />
                  <DetailItem
                    label="Created On"
                    value={
                      item.createdAt
                        ? new Date(item.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"
                    }
                  />
                </dl>
                <div className="mt-6">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">Attachments</h3>
                  <div className="mt-3 flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d7dcf5] bg-[#f8f9ff] p-8 text-center text-[#64748b]">
                    <UploadPlaceholder />
                  </div>
                </div>
              </DetailCard>

              <DetailCard
                title="Purchase Information"
                actions={<StatusIndicator label="Purchasable" active={item.purchasable !== false} />}
              >
                <dl className="grid gap-4 md:grid-cols-2">
                  <DetailItem label="Cost Price" value={formatCurrency(item.costPrice)} />
                  <DetailItem label="Purchase Account" value={item.costAccount || "Cost of Goods Sold"} />
                  <DetailItem label="Preferred Vendor" value={item.preferredVendor || "—"} />
                  <DetailItem label="Description" value={item.purchaseDescription || "—"} />
                </dl>
              </DetailCard>

              <DetailCard
                title="Sales Information"
                actions={<StatusIndicator label="Sellable" active={item.sellable !== false} />}
              >
                <dl className="grid gap-4 md:grid-cols-2">
                  <DetailItem label="Selling Price" value={formatCurrency(item.sellingPrice)} />
                  <DetailItem label="Sales Account" value={item.salesAccount || "Sales"} />
                  <DetailItem label="Description" value={item.salesDescription || "—"} />
                </dl>
              </DetailCard>

              <DetailCard title="Dimensions & Tracking">
                <dl className="grid gap-4 md:grid-cols-2">
                  <DetailItem label="Dimensions" value={item.dimensions || "—"} />
                  <DetailItem label="Weight" value={item.weight || "—"} />
                  <DetailItem label="Reorder Point" value={item.reorderPoint || "—"} />
                  <DetailItem label="Tracking Method" value={mapTrackingMethod(item.trackingMethod)} />
                  <DetailItem label="Track Inventory" value={item.trackInventory ? "Enabled" : "Disabled"} />
                  <DetailItem label="Track Bin Location" value={item.trackBin ? "Enabled" : "Disabled"} />
                </dl>
              </DetailCard>
            </div>

            <div className="space-y-6">
              <DetailCard title="Stock Snapshot">
                <div className="space-y-4">
                  <SummaryRow icon={Boxes} label="Opening Stock" value="0.00" />
                  <div className="space-y-3 rounded-2xl border border-[#edf1ff] bg-[#f9fbff] p-4">
                    <SummaryRow icon={Warehouse} label="Stock on Hand" value="0.00" />
                    <SummaryRow icon={PackageSearch} label="Committed Stock" value="0.00" />
                    <SummaryRow icon={ShoppingCart} label="Available for Sale" value="0.00" />
                  </div>
                </div>
              </DetailCard>

              <DetailCard title="Reporting">
                <div className="space-y-3 text-sm text-[#475569]">
                  <p>This item does not have reporting tags yet.</p>
                  <Link to="#" className="text-sm font-semibold text-[#3762f9] hover:text-[#2748c9]">
                    + Add Reporting Tag
                  </Link>
                </div>
              </DetailCard>

              <DetailCard title="Activity">
                <div className="space-y-4">
                  <ActivityRow icon={Activity} label="Transactions" value="No transactions yet" />
                  <ActivityRow
                    icon={Calendar}
                    label="Last Modified"
                    value={
                      item.updatedAt
                        ? new Date(item.updatedAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "—"
                    }
                  />
                </div>
              </DetailCard>
            </div>
          </section>

          <section className="rounded-3xl border border-[#e1e5f5] bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-sm font-semibold text-[#1f2937]">Sales Order Summary (INR)</h3>
              <button className="inline-flex items-center gap-2 rounded-md border border-[#d7dcf5] px-3 py-1.5 text-xs font-semibold text-[#475569]">
                This Month
                <ChevronIcon />
              </button>
            </div>
            <div className="mt-6 flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#dbe4ff] bg-[#f9fbff] p-12 text-sm text-[#6b7280]">
              <ClipboardList size={24} className="mb-3 text-[#a5b4fc]" />
              No sales data found for this item yet.
            </div>
          </section>
        </main>
      </div>
    </div>
  );
};

export default ShoeSalesItemDetail;

const DetailCard = ({ title, children, actions }) => (
  <div className="rounded-3xl border border-[#e1e5f5] bg-white p-6 shadow-sm">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-sm font-semibold text-[#1f2937]">{title}</h2>
      {actions}
    </div>
    <div className="mt-5 space-y-4 text-sm text-[#475569]">{children}</div>
  </div>
);

const DetailItem = ({ label, value }) => (
  <div>
    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">{label}</span>
    <p className="mt-1 text-sm font-medium text-[#1f2937]">{value || "—"}</p>
  </div>
);

const SummaryRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center justify-between rounded-2xl border border-[#eef2ff] bg-[#f8f9ff] px-4 py-3 text-sm">
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5]">
        <Icon size={18} />
      </span>
      <span className="font-semibold text-[#475569]">{label}</span>
    </div>
    <span className="font-semibold text-[#1f2937]">{value}</span>
  </div>
);

const ActivityRow = ({ icon: Icon, label, value }) => (
  <div className="flex items-center gap-3 rounded-2xl border border-[#eef2ff] bg-[#f8f9ff] px-4 py-3 text-sm">
    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4f46e5]">
      <Icon size={18} />
    </span>
    <div>
      <p className="text-sm font-semibold text-[#1f2937]">{label}</p>
      <p className="text-xs text-[#6b7280]">{value}</p>
    </div>
  </div>
);

const StatusIndicator = ({ label, active }) => (
  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em]">
    <span
      className={`flex h-4 w-4 items-center justify-center rounded border ${
        active ? "border-[#2563eb] bg-[#2563eb]" : "border-[#cbd5f5] bg-white"
      }`}
    >
      {active && <span className="h-2 w-2 rounded-full bg-white" />}
    </span>
    <span className={active ? "text-[#1f2937]" : "text-[#94a3b8]"}>{label}</span>
  </span>
);

const mapTrackingMethod = (value) => {
  switch (value) {
    case "serial":
      return "Track Serial Number";
    case "batch":
      return "Track Batches";
    default:
      return "None";
  }
};

const ChevronIcon = () => (
  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M3 4.5L6 7.5L9 4.5" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const UploadPlaceholder = () => (
  <>
    <p className="text-sm font-medium">Drag image(s) here or browse images</p>
    <p className="mt-2 text-xs leading-5">
      You can add up to 15 images, each not exceeding 5 MB in size and 7000 x 7000 pixels resolution.
    </p>
    <button className="mt-4 rounded-full border border-[#cbd5f5] px-4 py-2 text-sm font-medium text-[#3762f9] hover:bg-[#eef2ff]">
      Upload
    </button>
  </>
);

