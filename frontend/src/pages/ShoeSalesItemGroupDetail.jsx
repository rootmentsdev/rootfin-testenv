import { useState, useEffect, useRef } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, X, Plus, Building2, Package, ChevronDown } from "lucide-react";
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
        title={
          <div className="flex items-center gap-3">
            <span>{itemGroup.name}</span>
            {itemGroup.isActive === false && (
              <span className="inline-flex items-center rounded-md bg-gray-100 border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 uppercase tracking-wide">
                Inactive
              </span>
            )}
          </div>
        }
        description={`${Array.isArray(itemGroup.items) ? itemGroup.items.length : 0} Item(s)`}
        actions={
          <div className="flex items-center">
            <Link
              to={`/shoe-sales/item-groups/${id}/edit`}
              className="no-blue-button inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d7dcf5] bg-white px-4 text-sm font-medium text-[#475569] shadow-sm transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5f5] hover:shadow-md"
            >
              <Edit size={16} className="text-[#64748b]" />
              <span>Edit</span>
            </Link>
            <button 
              onClick={() => navigate(`/shoe-sales/item-groups/${id}/items/new`)}
              className="no-blue-button inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d7dcf5] bg-white px-4 text-sm font-medium text-[#475569] shadow-sm transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5f5] hover:shadow-md ml-3"
            >
              <Plus size={16} className="text-[#64748b]" />
              <span>Add Item</span>
            </button>
            <div className="relative ml-3" ref={moreMenuRef}>
              <button 
                onClick={() => setShowMoreMenu(!showMoreMenu)}
                className={`no-blue-button inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d7dcf5] bg-white px-4 text-sm font-medium text-[#475569] shadow-sm transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5f5] hover:shadow-md ${
                  showMoreMenu ? "bg-[#f8fafc] border-[#cbd5f5]" : ""
                }`}
              >
                <span>More</span>
                <ChevronDown 
                  size={16} 
                  className={`text-[#64748b] transition-transform duration-200 ${
                    showMoreMenu ? "rotate-180" : "rotate-0"
                  }`} 
                />
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
            <div className="h-6 w-px bg-[#e7ebf8] mx-3"></div>
            <Link
              to="/shoe-sales/item-groups"
              className="no-blue-button inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#d7dcf5] bg-white text-[#475569] shadow-sm transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5f5] hover:shadow-md"
            >
              <X size={18} className="text-[#64748b]" />
            </Link>
          </div>
        }
      />

      <div className="rounded-2xl border border-[#e4e6f2] bg-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.18)]">
        {/* Content */}
        <div className="p-6">
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
          <div>
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
                      <p className="mt-1 text-sm font-medium text-[#1f2937]">{itemGroup.name}</p>
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
                                  className="inline-flex items-center rounded-md bg-[#f1f5f9] border border-[#e2e8f0] px-3 py-1 text-sm font-medium text-[#475569]"
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
                        className="inline-flex items-center gap-2 text-sm font-medium text-[#475569] hover:text-[#1f2937] transition"
                      >
                        <Building2 size={16} className="text-[#64748b]" />
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
                <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d7dcf5] bg-[#f8f9ff] p-4 py-6 text-center text-[#64748b] min-h-[120px]">
                  <Package size={24} className="mb-2 text-[#94a3b8]" />
                  <p className="text-xs font-medium">Drag image(s) here or browse images</p>
                  <p className="mt-1 text-xs leading-4 text-[#94a3b8]">
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

