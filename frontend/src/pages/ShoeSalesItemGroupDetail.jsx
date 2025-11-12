import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, MoreHorizontal, X, Plus, Building2, RotateCcw, Package } from "lucide-react";
import Head from "../components/Head";

const ShoeSalesItemGroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [itemGroup, setItemGroup] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    const fetchItemGroup = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";
        const response = await fetch(`${API_URL}/api/shoe-sales/item-groups/${id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch item group");
        }
        
        const data = await response.json();
        setItemGroup(data);
      } catch (error) {
        console.error("Error fetching item group:", error);
        setItemGroup(null);
      }
    };

    if (id) {
      fetchItemGroup();
    }
  }, [id]);

  if (!itemGroup) {
    return (
      <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
        <div className="rounded-2xl border border-[#e4e6f2] bg-white shadow-lg p-8 text-center">
          <p className="text-lg font-medium text-[#475569]">Item Group not found</p>
          <Link
            to="/shoe-sales/item-groups"
            className="mt-4 inline-block text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
          >
            Back to Item Groups
          </Link>
        </div>
      </div>
    );
  }

  // Get items from the item group (saved items from database)
  const items = itemGroup.items && Array.isArray(itemGroup.items) ? itemGroup.items : [];

  // Calculate stock totals from items - show item count instead of quantity
  const calculateStock = () => {
    const itemsCount = items.length;
    
    return {
      openingStock: itemsCount, // Show number of items
      stockOnHand: itemsCount, // Show number of items
      committedStock: 0, // This would come from pending orders/transactions
      totalStock: itemsCount
    };
  };

  const stockInfo = calculateStock();

  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title={itemGroup.name}
        description={`${Array.isArray(itemGroup.items) ? itemGroup.items.length : 0} Item(s)`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to={`/shoe-sales/item-groups/${id}/edit`}
              className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d7dcf5] px-4 text-sm font-medium text-[#475569] transition hover:bg-white"
            >
              <Edit size={16} />
              Edit
            </Link>
            <button className="inline-flex h-9 items-center gap-2 rounded-md bg-[#2563eb] px-4 text-sm font-medium text-white transition hover:bg-[#1d4ed8]">
              <Plus size={16} />
              Add Item
            </button>
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d7dcf5] px-4 text-sm font-medium text-[#475569] transition hover:bg-white">
              More
              <MoreHorizontal size={16} />
            </button>
            <Link
              to="/shoe-sales/item-groups"
              className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#d7dcf5] text-[#475569] transition hover:bg-white"
            >
              <X size={16} />
            </Link>
          </div>
        }
      />

      <div className="rounded-2xl border border-[#e4e6f2] bg-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.18)]">
        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-[#e4e6f2] px-6">
          {["Overview", "Warehouses", "Transactions", "History"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-4 text-sm font-medium transition ${
                activeTab === tab
                  ? "border-b-2 border-[#2563eb] text-[#2563eb]"
                  : "text-[#64748b] hover:text-[#1f2937]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6">
          {activeTab === "Overview" && (
            <div className="grid gap-6 md:grid-cols-[2fr,1fr]">
              {/* Left Column - Primary Details */}
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                    Primary Details
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Item Group Name
                      </label>
                      <p className="mt-1 text-sm font-medium text-[#2563eb]">{itemGroup.name}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Item Type
                      </label>
                      <p className="mt-1 text-sm text-[#1f2937]">
                        {itemGroup.itemType === "goods" ? "Inventory Items" : "Service Items"}
                      </p>
                    </div>
                    {itemGroup.attributeRows && itemGroup.attributeRows.length > 0 && (
                      <>
                        {itemGroup.attributeRows[0].attribute && (
                          <div>
                            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                              {itemGroup.attributeRows[0].attribute.toUpperCase()}
                            </label>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {itemGroup.attributeRows[0].options.map((opt, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center rounded-md bg-[#2563eb] px-3 py-1 text-sm font-medium text-white"
                                >
                                  {opt}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Unit
                      </label>
                      <p className="mt-1 text-sm text-[#1f2937]">{itemGroup.unit || "PCS"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Tax Preference
                      </label>
                      <p className="mt-1 text-sm text-[#1f2937]">Taxable</p>
                    </div>
                    {itemGroup.inventoryValuation && (
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                          Inventory Valuation Method
                        </label>
                        <p className="mt-1 text-sm text-[#1f2937]">{itemGroup.inventoryValuation}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                {items.length > 0 && (
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Items in Group
                      </h3>
                      <Link
                        to="#"
                        className="inline-flex items-center gap-2 text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                      >
                        <Building2 size={16} />
                        Opening Stock
                      </Link>
                    </div>
                    <div className="overflow-x-auto rounded-lg border border-[#e4e6f2]">
                      <table className="min-w-full divide-y divide-[#e6eafb]">
                        <thead className="bg-[#f1f4ff]">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#4a5b8b]">
                              Item Details
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#4a5b8b]">
                              Cost Price
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#4a5b8b]">
                              Selling Price
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#4a5b8b]">
                              Stock on Hand
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#4a5b8b]">
                              Reorder Point
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#eef2ff] bg-white">
                          {items.map((item, idx) => {
                            // Get stock from item, or default to 0
                            const itemStock = typeof item.stock === 'number' 
                              ? item.stock.toFixed(2) 
                              : (item.stock || "0.00");
                            
                            return (
                              <tr 
                                key={item._id || item.id || idx} 
                                className="hover:bg-[#f7f9ff] cursor-pointer"
                                onClick={() => navigate(`/shoe-sales/item-groups/${id}/items/${item._id || item.id}`)}
                              >
                                <td className="px-4 py-3">
                                  <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded border border-[#d7dcf5] bg-[#f9fafc]">
                                      <Package size={20} className="text-[#94a3b8]" />
                                    </div>
                                    <div>
                                      <p className="text-sm font-medium text-[#1f2937]">{item.name || "Unnamed Item"}</p>
                                      <p className="text-xs text-[#64748b]">[{item.sku || "N/A"}]</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-[#1f2937]">
                                  ₹{typeof item.costPrice === 'number' ? item.costPrice.toFixed(2) : (item.costPrice || "0.00")}
                                </td>
                                <td className="px-4 py-3 text-sm text-[#1f2937]">
                                  ₹{typeof item.sellingPrice === 'number' ? item.sellingPrice.toFixed(2) : (item.sellingPrice || "0.00")}
                                </td>
                                <td className="px-4 py-3 text-sm font-semibold text-[#1f2937]">{itemStock}</td>
                                <td className="px-4 py-3 text-sm text-[#64748b]">{item.reorderPoint || "—"}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              {/* Right Column - Image Upload & Stock Info */}
              <div className="space-y-6">
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d7dcf5] bg-[#f8f9ff] p-8 text-center text-[#64748b]">
                  <Package size={36} className="mb-3 text-[#94a3b8]" />
                  <p className="text-sm font-medium">Drag image(s) here or browse images</p>
                  <p className="mt-2 text-xs leading-5">
                    You can add up to 15 images, each not exceeding 5 MB in size and 7000 x 7000 pixels resolution.
                  </p>
                </div>

                <div className="rounded-2xl border border-[#e4e6f2] bg-white p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Building2 size={16} className="text-[#64748b]" />
                    <h3 className="text-sm font-semibold text-[#1f2937]">Opening Stock</h3>
                  </div>
                  <p className="text-2xl font-semibold text-[#1f2937]">
                    {stockInfo.openingStock}
                  </p>
                  
                  <div className="mt-6">
                    <div className="mb-2 flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-[#1f2937]">Accounting Stock</h4>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Stock on Hand:</span>
                        <span className="font-semibold text-[#1f2937]">
                          {stockInfo.stockOnHand}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-[#64748b]">Committed Stock:</span>
                        <span className="font-semibold text-[#1f2937]">
                          {stockInfo.committedStock}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab !== "Overview" && (
            <div className="py-12 text-center text-sm text-[#64748b]">
              {activeTab} content coming soon...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShoeSalesItemGroupDetail;

