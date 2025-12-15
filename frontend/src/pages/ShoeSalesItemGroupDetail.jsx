import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, X, Building2, Package, ChevronDown } from "lucide-react";
import Head from "../components/Head";

const ShoeSalesItemGroupDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [itemGroup, setItemGroup] = useState(null);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const moreMenuRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(event.target)) {
        setShowMoreMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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

  const handleMarkAsInactive = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";
      
      // Prepare update payload with all fields preserved
      const updatePayload = {
        name: itemGroup.name,
        sku: itemGroup.sku || "",
        itemType: itemGroup.itemType || "goods",
        unit: itemGroup.unit || "",
        manufacturer: itemGroup.manufacturer || "",
        brand: itemGroup.brand || "",
        taxPreference: itemGroup.taxPreference || "taxable",
        intraStateTaxRate: itemGroup.intraStateTaxRate || "",
        interStateTaxRate: itemGroup.interStateTaxRate || "",
        inventoryValuationMethod: itemGroup.inventoryValuationMethod || "",
        createAttributes: itemGroup.createAttributes !== undefined ? itemGroup.createAttributes : true,
        attributeRows: itemGroup.attributeRows || [],
        sellable: itemGroup.sellable !== undefined ? itemGroup.sellable : true,
        purchasable: itemGroup.purchasable !== undefined ? itemGroup.purchasable : true,
        trackInventory: itemGroup.trackInventory !== undefined ? itemGroup.trackInventory : false,
        items: itemGroup.items || [],
        stock: itemGroup.stock || 0,
        reorder: itemGroup.reorder || "",
        isActive: false, // Set to inactive
      };
      
      const response = await fetch(`${API_URL}/api/shoe-sales/item-groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || payload?.errors?.join(", ") || "Failed to mark group as inactive");
      }

      const updatedGroup = await response.json();
      setItemGroup(updatedGroup);
      setShowInactiveModal(false);
      setShowMoreMenu(false);
      alert("Item group has been marked as inactive.");
    } catch (error) {
      console.error("Error marking group as inactive:", error);
      alert(error.message || "Failed to mark group as inactive. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";
      const response = await fetch(`${API_URL}/api/shoe-sales/item-groups/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete item group");
      }

      setShowDeleteModal(false);
      setShowMoreMenu(false);
      alert("Item group has been deleted successfully.");
      navigate("/shoe-sales/item-groups");
    } catch (error) {
      console.error("Error deleting item group:", error);
      alert("Failed to delete item group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!itemGroup) {
    return (
      <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
        <div className="rounded-2xl border border-[#e4e6f2] bg-white shadow-lg p-8 text-center">
          <p className="text-lg font-medium text-[#475569]">Item Group not found</p>
          <Link
            to="/shoe-sales/item-groups"
            className="mt-4 inline-block text-sm font-medium text-[#475569] hover:text-[#1f2937]"
          >
            Back to Item Groups
          </Link>
        </div>
      </div>
    );
  }

  // Get items from the item group (saved items from database) - filter out inactive items
  const allItems = itemGroup.items && Array.isArray(itemGroup.items) ? itemGroup.items : [];
  const items = allItems.filter(item => item.isActive !== false);

  // Calculate stock totals from items - sum of all item stocks
  // Example: If 9 items each have 10 stock, total = 90
  const calculateStock = () => {
    // Sum up all stock values from items in the group
    const totalStock = items.reduce((sum, item) => {
      // Handle both number and string stock values
      let itemStock = 0;
      
      // First try direct stock property
      if (typeof item.stock === 'number') {
        itemStock = item.stock;
      } else if (typeof item.stock === 'string') {
        itemStock = parseFloat(item.stock) || 0;
      } else if (item.stock !== null && item.stock !== undefined) {
        itemStock = Number(item.stock) || 0;
      }
      
      // If stock is 0 or not available, check warehouseStocks
      if (itemStock === 0 && item.warehouseStocks && Array.isArray(item.warehouseStocks) && item.warehouseStocks.length > 0) {
        // Sum up stock from all warehouses
        const warehouseTotal = item.warehouseStocks.reduce((warehouseSum, warehouse) => {
          const openingStock = typeof warehouse.openingStock === 'number' ? warehouse.openingStock : (parseFloat(warehouse.openingStock) || 0);
          const stockOnHand = typeof warehouse.stockOnHand === 'number' ? warehouse.stockOnHand : (parseFloat(warehouse.stockOnHand) || 0);
          // Use stockOnHand if available, otherwise openingStock
          return warehouseSum + (stockOnHand > 0 ? stockOnHand : openingStock);
        }, 0);
        if (warehouseTotal > 0) {
          itemStock = warehouseTotal;
        }
      }
      
      console.log(`Item: ${item.name}, Stock: ${itemStock}, Direct stock: ${item.stock}, Warehouse stocks:`, item.warehouseStocks);
      
      return sum + itemStock;
    }, 0);
    
    console.log(`Total stock calculated: ${totalStock} from ${items.length} items`);
    
    return {
      openingStock: totalStock, // Sum of all item stocks (e.g., 9 items × 10 stock = 90)
      stockOnHand: totalStock, // Sum of all item stocks
      committedStock: 0, // This would come from pending orders/transactions
      totalStock: totalStock
    };
  };

  const stockInfo = calculateStock();

  return (
    <div className="p-8 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title={
          <div className="flex items-center gap-3">
            <span className="text-xl font-semibold text-[#1f2937]">{itemGroup.name}</span>
            {itemGroup.isActive === false && (
              <span className="inline-flex items-center rounded-md bg-gray-100 border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Inactive
              </span>
            )}
          </div>
        }
        description={`${Array.isArray(itemGroup.items) ? itemGroup.items.length : 0} Item(s)`}
        actions={
          <div className="flex items-center gap-2">
            <Link
              to={`/shoe-sales/item-groups/${id}/edit`}
              className="no-blue-button inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d7dcf5] bg-white px-4 text-sm font-medium text-[#475569] shadow-sm transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5f5] hover:shadow-md"
            >
              <Edit size={16} className="text-[#64748b]" />
              <span>Edit</span>
            </Link>
            <div className="relative" ref={moreMenuRef}>
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className="no-blue-button inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d7dcf5] bg-white px-4 text-sm font-medium text-[#475569] shadow-sm transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5f5] hover:shadow-md"
              >
                <span>More</span>
               
              </button>
              {showMoreMenu && (
                <div className="absolute right-0 mt-2 w-56 rounded-lg border border-[#d7dcf5] bg-white shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1),0_4px_6px_-2px_rgba(0,0,0,0.05)] z-50 overflow-hidden">
                  <button
                    onClick={() => {
                      setShowInactiveModal(true);
                      setShowMoreMenu(false);
                    }}
                    className="no-blue-button w-full px-4 py-2.5 text-left text-sm font-medium text-[#475569] bg-white hover:bg-[#f8fafc] active:bg-[#f1f5f9] transition-colors duration-150"
                  >
                    Mark as Inactive
                  </button>
                  <div className="h-px bg-[#e7ebf8]"></div>
                  <button
                    onClick={() => {
                      setShowDeleteModal(true);
                      setShowMoreMenu(false);
                    }}
                    className="no-blue-button w-full px-4 py-2.5 text-left text-sm font-medium text-[#475569] bg-white hover:bg-[#f8fafc] active:bg-[#f1f5f9] transition-colors duration-150"
                  >
                    Delete
                  </button>
                </div>
              )}
            </div>
            <div className="h-6 w-px bg-[#e7ebf8] mx-2"></div>
            <Link
              to="/shoe-sales/item-groups"
              className="no-blue-button inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#d7dcf5] bg-white text-[#475569] shadow-sm transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5f5] hover:shadow-md"
            >
              <X size={16} className="text-[#64748b]" />
            </Link>
          </div>
        }
      />

      <div className="mt-6 rounded-2xl border border-[#e4e6f2] bg-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.18)] overflow-hidden">
        {/* Content */}
        <div className="p-8">
          {itemGroup.isActive === false && (
            <div className="mb-6 rounded-lg border border-gray-300 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-gray-400"></div>
                <p className="text-sm font-medium text-gray-700">
                  This item group is currently inactive and will not appear in active lists.
                </p>
              </div>
            </div>
          )}
          
          <div className="grid gap-8 lg:grid-cols-[2fr,1fr]">
            {/* Left Column - Primary Details */}
            <div className="space-y-8">
              {/* Primary Details Card */}
              <div className="rounded-xl border border-[#e4e6f2] bg-[#fafbff] p-6">
                <h3 className="mb-5 text-sm font-semibold uppercase tracking-[0.18em] text-[#64748b] border-b border-[#e7ebf8] pb-3">
                  Primary Details
                </h3>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                      Item Group Name
                    </label>
                    <p className="mt-1.5 text-base font-semibold text-[#1f2937]">{itemGroup.name}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                      Item Type
                    </label>
                    <p className="mt-1.5 text-sm font-medium text-[#1f2937]">
                      {itemGroup.itemType === "goods" ? "Inventory Items" : "Service Items"}
                    </p>
                  </div>
                  {Array.isArray(itemGroup.attributeRows) && itemGroup.attributeRows.length > 0 && (
                    <div className="md:col-span-2 space-y-4">
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Attributes
                      </label>
                      <div className="grid gap-4 sm:grid-cols-2">
                        {itemGroup.attributeRows
                          .filter((row) => row?.attribute)
                          .map((row, idx) => (
                            <div
                              key={`${row.attribute}-${idx}`}
                              className="rounded-lg border border-[#e4e6f2] bg-white px-4 py-3 shadow-sm"
                            >
                              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#94a3b8] mb-2">
                                {row.attribute}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(row.options || []).map((opt, optIdx) => (
                                  <span
                                    key={`${row.attribute}-${opt}-${optIdx}`}
                                    className="inline-flex items-center rounded-md border border-[#d7dcf5] bg-[#f8fafc] px-3 py-1 text-sm font-medium text-[#475569]"
                                  >
                                    {opt}
                                  </span>
                                ))}
                                {(!row.options || row.options.length === 0) && (
                                  <span className="text-xs text-[#94a3b8]">No options added</span>
                                )}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                      Unit
                    </label>
                    <p className="mt-1.5 text-sm font-medium text-[#1f2937]">{itemGroup.unit || "PCS"}</p>
                  </div>
                  <div className="space-y-1">
                    <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                      Tax Preference
                    </label>
                    <p className="mt-1.5 text-sm font-medium text-[#1f2937]">Taxable</p>
                  </div>
                  {itemGroup.inventoryValuation && (
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Inventory Valuation Method
                      </label>
                      <p className="mt-1.5 text-sm font-medium text-[#1f2937]">{itemGroup.inventoryValuation}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Items Table Card */}
              {items.length > 0 && (
                <div className="rounded-xl border border-[#e4e6f2] bg-white overflow-hidden">
                  <div className="px-6 py-4 bg-[#fafbff] border-b border-[#e7ebf8] flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                      Items in Group
                    </h3>
                    <Link
                      to="#"
                      className="inline-flex items-center gap-2 text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8] transition"
                    >
                      <Building2 size={16} className="text-[#2563eb]" />
                      Opening Stock
                    </Link>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-[#e6eafb]">
                      <thead className="bg-[#f8fafc]">
                        <tr>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                            Item Details
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                            Cost Price
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                            Selling Price
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                            Stock on Hand
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                            Reorder Point
                          </th>
                          <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#f1f5f9] bg-white">
                        {items.map((item, idx) => {
                          // Get stock from item, or default to 0
                          const itemStock = typeof item.stock === 'number' 
                            ? item.stock.toFixed(2) 
                            : (item.stock || "0.00");
                          
                          return (
                            <tr 
                              key={item._id || item.id || idx} 
                              className="hover:bg-[#f8fafc] cursor-pointer transition-colors duration-150"
                              onClick={() => navigate(`/shoe-sales/item-groups/${id}/items/${item._id || item.id}`)}
                            >
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#d7dcf5] bg-[#f8fafc]">
                                    <Package size={20} className="text-[#64748b]" />
                                  </div>
                                  <div>
                                    <p className="text-sm font-semibold text-[#1f2937]">{item.name || "Unnamed Item"}</p>
                                    <p className="text-xs text-[#64748b] mt-0.5">[{item.sku || "N/A"}]</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-[#1f2937]">
                                ₹{typeof item.costPrice === 'number' ? item.costPrice.toFixed(2) : (item.costPrice || "0.00")}
                              </td>
                              <td className="px-6 py-4 text-sm font-medium text-[#1f2937]">
                                ₹{typeof item.sellingPrice === 'number' ? item.sellingPrice.toFixed(2) : (item.sellingPrice || "0.00")}
                              </td>
                              <td className="px-6 py-4 text-sm font-bold text-[#1f2937]">{itemStock}</td>
                              <td className="px-6 py-4 text-sm text-[#64748b]">{item.reorderPoint || "—"}</td>
                              <td className="px-6 py-4">
                                <Link
                                  to={`/shoe-sales/item-groups/${id}/items/${item._id || item.id}/edit`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="no-blue-button inline-flex items-center gap-2 rounded-md border border-[#d7dcf5] bg-white px-3 py-1.5 text-sm font-medium text-[#475569] shadow-sm transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5f5] hover:shadow-md"
                                  title="Edit Variant"
                                >
                                  Edit Variant
                                </Link>
                              </td>
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
              {/* Image Upload Card */}
              <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d7dcf5] bg-[#f8f9ff] p-8 text-center text-[#64748b] min-h-[160px]">
                <div className="p-3 rounded-full bg-white border border-[#d7dcf5] mb-3">
                  <Package size={28} className="text-[#94a3b8]" />
                </div>
                <p className="text-sm font-medium mb-1">Drag image(s) here or browse images</p>
                <p className="text-xs leading-5 text-[#94a3b8] max-w-[240px]">
                  You can add up to 15 images, each not exceeding 5 MB in size and 7000 x 7000 pixels resolution.
                </p>
              </div>

              {/* Opening Stock Card */}
              <div className="rounded-xl border border-[#e4e6f2] bg-white shadow-sm overflow-hidden">
                {/* Opening Stock Section */}
                <div className="bg-gradient-to-br from-[#f0f4ff] to-[#f8fafc] px-6 py-6 border-b border-[#e7ebf8]">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 rounded-xl bg-white border border-[#d7dcf5] shadow-sm">
                      <Building2 size={20} className="text-[#2563eb]" />
                    </div>
                    <h3 className="text-sm font-semibold uppercase tracking-[0.05em] text-[#475569]">Opening Stock</h3>
                  </div>
                  <div className="flex items-baseline gap-2">
                    <p className="text-5xl font-bold text-[#1f2937] leading-none">
                      {stockInfo.openingStock.toFixed(2)}
                    </p>
                    <span className="text-xs font-medium text-[#64748b] uppercase tracking-wide ml-1">Units</span>
                  </div>
                </div>
                
                {/* Accounting Stock Section */}
                <div className="px-6 py-5 bg-white">
                  <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-[#64748b] mb-4">Accounting Stock</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[#f8fafc] border border-[#f1f5f9]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#10b981] shadow-sm"></div>
                        <span className="text-sm font-medium text-[#64748b]">Stock on Hand</span>
                      </div>
                      <span className="text-base font-bold text-[#1f2937]">
                        {stockInfo.stockOnHand.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg bg-[#f8fafc] border border-[#f1f5f9]">
                      <div className="flex items-center gap-2.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] shadow-sm"></div>
                        <span className="text-sm font-medium text-[#64748b]">Committed Stock</span>
                      </div>
                      <span className="text-base font-bold text-[#1f2937]">
                        {stockInfo.committedStock.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-[#d7dcf5] bg-white shadow-xl">
            <div className="px-6 py-4 border-b border-[#e7ebf8]">
              <h2 className="text-lg font-semibold text-[#1f2937]">Delete Item Group</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-[#64748b]">
                Are you sure you want to delete "{itemGroup?.name}"? This action cannot be undone and will delete all items in this group.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-[#e7ebf8] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
                className="no-blue-button rounded-md border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] transition hover:bg-[#f1f5f9] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="no-blue-button rounded-md bg-[#ef4444] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#dc2626] disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Inactive Confirmation Modal */}
      {showInactiveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-[#d7dcf5] bg-white shadow-xl">
            <div className="px-6 py-4 border-b border-[#e7ebf8]">
              <h2 className="text-lg font-semibold text-[#1f2937]">Mark as Inactive</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-[#64748b]">
                Are you sure you want to mark "{itemGroup?.name}" as inactive? This will hide the group from active lists.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-[#e7ebf8] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowInactiveModal(false)}
                disabled={loading}
                className="no-blue-button rounded-md border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] transition hover:bg-[#f1f5f9] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsInactive}
                disabled={loading}
                className="no-blue-button rounded-md border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] transition hover:bg-[#f8fafc] hover:border-[#cbd5f5] disabled:opacity-50"
              >
                {loading ? "Updating..." : "Mark as Inactive"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoeSalesItemGroupDetail;

