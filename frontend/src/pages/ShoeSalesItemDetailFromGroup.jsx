import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Edit, MoreHorizontal, X, Plus, Building2, Info, Camera, Package } from "lucide-react";
import Head from "../components/Head";

const ShoeSalesItemDetailFromGroup = () => {
  const { id, itemId } = useParams();
  const navigate = useNavigate();
  const [itemGroup, setItemGroup] = useState(null);
  const [item, setItem] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";
        const response = await fetch(`${API_URL}/api/shoe-sales/item-groups/${id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch item group");
        }
        
        const data = await response.json();
        setItemGroup(data);
        
        // Find the specific item
        if (data.items && Array.isArray(data.items)) {
          const foundItem = data.items.find(i => (i._id || i.id) === itemId);
          if (foundItem) {
            setItem(foundItem);
          }
        }
      } catch (error) {
        console.error("Error fetching item:", error);
        setItemGroup(null);
        setItem(null);
      }
    };

    if (id && itemId) {
      fetchData();
    }
  }, [id, itemId]);

  if (!itemGroup || !item) {
    return (
      <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
        <div className="rounded-2xl border border-[#e4e6f2] bg-white shadow-lg p-8 text-center">
          <p className="text-lg font-medium text-[#475569]">Item not found</p>
          <Link
            to={`/shoe-sales/item-groups/${id}`}
            className="mt-4 inline-block text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
          >
            Back to Item Group
          </Link>
        </div>
      </div>
    );
  }

  // Extract attribute values from item name or attributeCombination
  const getAttributeValue = (attributeName) => {
    if (item.attributeCombination && Array.isArray(item.attributeCombination)) {
      // Try to match attribute name with the combination
      if (itemGroup.attributeRows && Array.isArray(itemGroup.attributeRows)) {
        const attrRow = itemGroup.attributeRows.find(row => 
          row.attribute && row.attribute.toLowerCase() === attributeName.toLowerCase()
        );
        if (attrRow) {
          const index = itemGroup.attributeRows.indexOf(attrRow);
          return item.attributeCombination[index] || "";
        }
      }
    }
    return "";
  };

  // Get stock values
  const stockOnHand = typeof item.stock === 'number' ? item.stock : 0;
  const openingStock = stockOnHand; // Can be adjusted based on business logic
  const committedStock = 0; // Would come from pending orders
  const availableForSale = stockOnHand - committedStock;

  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title={item.name || "Item Detail"}
        description=""
        actions={
          <div className="flex items-center gap-2">
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d7dcf5] px-4 text-sm font-medium text-[#475569] transition hover:bg-white">
              Adj
            </button>
            <button className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d7dcf5] px-4 text-sm font-medium text-[#475569] transition hover:bg-white">
              <Edit size={16} />
            </button>
            <Link
              to={`/shoe-sales/item-groups/${id}`}
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
                        {itemGroup.attributeRows.map((attrRow, idx) => {
                          const attrValue = item.attributeCombination && item.attributeCombination[idx] 
                            ? item.attributeCombination[idx] 
                            : getAttributeValue(attrRow.attribute);
                          return attrRow.attribute ? (
                            <div key={idx}>
                              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                                {attrRow.attribute.toUpperCase()}
                              </label>
                              <p className="mt-1 text-sm text-[#1f2937]">{attrValue || "—"}</p>
                            </div>
                          ) : null;
                        })}
                      </>
                    )}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        SKU
                      </label>
                      <p className="mt-1 text-sm text-[#1f2937]">{item.sku || "—"}</p>
                    </div>
                    {item.hsnCode && (
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                          HSN Code
                        </label>
                        <p className="mt-1 text-sm text-[#1f2937]">{item.hsnCode}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Unit
                      </label>
                      <p className="mt-1 text-sm text-[#1f2937]">{itemGroup.unit || "pcs"}</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Created Source
                      </label>
                      <p className="mt-1 text-sm text-[#1f2937]">User</p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Tax Preference
                      </label>
                      <p className="mt-1 text-sm text-[#1f2937]">
                        {itemGroup.taxPreference === "taxable" ? "Taxable" : "Non-Taxable"}
                      </p>
                    </div>
                    {itemGroup.intraStateTaxRate && (
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                          Intra State Tax Rate
                        </label>
                        <p className="mt-1 text-sm text-[#1f2937]">{itemGroup.intraStateTaxRate}</p>
                      </div>
                    )}
                    {itemGroup.interStateTaxRate && (
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                          Inter State Tax Rate
                        </label>
                        <p className="mt-1 text-sm text-[#1f2937]">{itemGroup.interStateTaxRate}</p>
                      </div>
                    )}
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Inventory Account
                      </label>
                      <p className="mt-1 text-sm text-[#1f2937]">Inventory Asset</p>
                    </div>
                    {itemGroup.inventoryValuationMethod && (
                      <div>
                        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                          Inventory Valuation Method
                        </label>
                        <p className="mt-1 text-sm text-[#1f2937]">{itemGroup.inventoryValuationMethod}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Purchase Information */}
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                    Purchase Information
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Cost Price
                      </label>
                      <p className="mt-1 text-sm text-[#1f2937]">
                        ₹{typeof item.costPrice === 'number' ? item.costPrice.toFixed(2) : (item.costPrice || "0.00")}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Purchase Account
                      </label>
                      <p className="mt-1 text-sm text-[#1f2937]">Cost of Goods Sold</p>
                    </div>
                  </div>
                </div>

                {/* Sales Information */}
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                    Sales Information
                  </h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Selling Price
                      </label>
                      <p className="mt-1 text-sm text-[#1f2937]">
                        ₹{typeof item.sellingPrice === 'number' ? item.sellingPrice.toFixed(2) : (item.sellingPrice || "0.00")}
                      </p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Sales Account
                      </label>
                      <p className="mt-1 text-sm text-[#1f2937]">Sales</p>
                    </div>
                  </div>
                </div>

                {/* Reporting Tags */}
                <div>
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                    Reporting Tags
                  </h3>
                  <p className="text-sm text-[#64748b]">No reporting tag has been associated with this item.</p>
                  <Link
                    to="#"
                    className="mt-2 inline-block text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
                  >
                    Associated Price Lists ►
                  </Link>
                </div>
              </div>

              {/* Right Column - Image Upload & Stock Info */}
              <div className="space-y-6">
                <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d7dcf5] bg-[#f8f9ff] p-8 text-center text-[#64748b]">
                  <Camera size={36} className="mb-3 text-[#94a3b8]" />
                  <p className="text-sm font-medium">
                    Drag image(s) here or <span className="text-[#2563eb] cursor-pointer">Browse images</span>
                  </p>
                  <p className="mt-2 text-xs leading-5">
                    You can add up to 15 images, each not exceeding 5 MB in size and 7000 x 7000 pixels resolution.
                  </p>
                </div>

                {/* Opening Stock */}
                <div className="rounded-2xl border border-[#e4e6f2] bg-white p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Info size={16} className="text-[#64748b]" />
                    <h3 className="text-sm font-semibold text-[#1f2937]">Opening Stock</h3>
                  </div>
                  <p className="text-2xl font-semibold text-[#1f2937]">
                    {openingStock.toFixed(2)}
                  </p>
                </div>

                {/* Accounting Stock */}
                <div className="rounded-2xl border border-[#e4e6f2] bg-white p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Info size={16} className="text-[#64748b]" />
                    <h3 className="text-sm font-semibold text-[#1f2937]">Accounting Stock</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Stock on Hand:</span>
                      <span className="font-semibold text-[#1f2937]">{stockOnHand.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Committed Stock:</span>
                      <span className="font-semibold text-[#1f2937]">{committedStock.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Available for Sale:</span>
                      <span className="font-semibold text-[#1f2937]">{availableForSale.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Physical Stock */}
                <div className="rounded-2xl border border-[#e4e6f2] bg-white p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Info size={16} className="text-[#64748b]" />
                    <h3 className="text-sm font-semibold text-[#1f2937]">Physical Stock</h3>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Stock on Hand:</span>
                      <span className="font-semibold text-[#1f2937]">{stockOnHand.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Committed Stock:</span>
                      <span className="font-semibold text-[#1f2937]">{committedStock.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#64748b]">Available for Sale:</span>
                      <span className="font-semibold text-[#1f2937]">{availableForSale.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Quantity Status Boxes */}
                <div className="grid grid-cols-2 gap-3">
                  {["To be Shipped", "To be Received", "To be Invoiced", "To be Billed"].map((status) => (
                    <div
                      key={status}
                      className="rounded-lg border border-[#e4e6f2] bg-white p-4 text-center"
                    >
                      <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#64748b]">{status}</p>
                      <p className="mt-2 text-lg font-semibold text-[#1f2937]">0 Qty</p>
                    </div>
                  ))}
                </div>

                {/* Reorder Point */}
                <div className="rounded-2xl border border-[#e4e6f2] bg-white p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Info size={16} className="text-[#64748b]" />
                      <h3 className="text-sm font-semibold text-[#1f2937]">Reorder Point</h3>
                    </div>
                    <button className="text-[#2563eb] hover:text-[#1d4ed8]">
                      <Edit size={16} />
                    </button>
                  </div>
                  <p className="text-2xl font-semibold text-[#1f2937]">
                    {item.reorderPoint ? parseFloat(item.reorderPoint).toFixed(2) : "0.00"}
                  </p>
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

export default ShoeSalesItemDetailFromGroup;

