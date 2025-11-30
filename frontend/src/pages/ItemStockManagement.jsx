import { useState, useEffect } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { X, Trash2, Plus } from "lucide-react";

// Warehouse names for the dropdown
const WAREHOUSES = [
  "Palakkad Branch",
  "Warehouse",
  "Calicut",
  "Manjery Branch",
  "Kannur Branch",
  "Edappal Branch",
  "Kalpetta Branch",
  "Kottakkal Branch",
  "Perinthalmanna Branch",
  "Grooms Trivandum",
  "Chavakkad Branch",
  "Thrissur Branch",
  "Perumbavoor Branch",
  "Kottayam Branch",
  "Edapally Branch",
  "MG Road"
];

const ItemStockManagement = () => {
  const { id, itemId } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stockType = (searchParams.get("type") || "accounting").toLowerCase();
  const [itemGroup, setItemGroup] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stockRows, setStockRows] = useState([
    { warehouse: "", openingStock: "0", openingStockValue: "0", physicalOpeningStock: "0" }
  ]);
  const [warehouses, setWarehouses] = useState([]);
  
  // Set warehouses to the specified list
  useEffect(() => {
    // Sort warehouses: "Warehouse" first, then alphabetically
    const sortedWarehouses = [...WAREHOUSES].sort((a, b) => {
      if (a === "Warehouse") return -1;
      if (b === "Warehouse") return 1;
      return a.localeCompare(b);
    });
    setWarehouses(sortedWarehouses);
  }, []);

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
            // Load existing warehouse stocks if available
            if (foundItem.warehouseStocks && Array.isArray(foundItem.warehouseStocks) && foundItem.warehouseStocks.length > 0) {
              const existingRows = foundItem.warehouseStocks
                .filter(stock => stock.warehouse && WAREHOUSES.includes(stock.warehouse))
                .map(stock => ({
                  warehouse: stock.warehouse || "",
                  openingStock: stock.openingStock?.toString() || stock.stockOnHand?.toString() || "0",
                  openingStockValue: stock.openingStockValue?.toString() || "0",
                  physicalOpeningStock: (stock.physicalOpeningStock ?? stock.physicalStockOnHand ?? 0).toString()
                }));
              
              if (existingRows.length > 0) {
                setStockRows(existingRows);
              }
            }
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

  const handleAddRow = () => {
    setStockRows([...stockRows, { warehouse: "", openingStock: "0", openingStockValue: "0", physicalOpeningStock: "0" }]);
  };

  const handleDeleteRow = (index) => {
    if (stockRows.length > 1) {
      const newRows = stockRows.filter((_, i) => i !== index);
      setStockRows(newRows);
    }
  };

  const handleInputChange = (index, field, value) => {
    const newRows = [...stockRows];
    newRows[index][field] = value;
    setStockRows(newRows);
  };

  const handleCopyToAll = (field) => {
    if (stockRows.length > 0) {
      const value = stockRows[0][field];
      const newRows = stockRows.map(row => ({ ...row, [field]: value }));
      setStockRows(newRows);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";
      
      // Calculate total available stock from all warehouses (especially from "Warehouse" where purchase receives add stock)
      const existingItem = item || {};
      const existingStocks = Array.isArray(existingItem.warehouseStocks) ? existingItem.warehouseStocks : [];
      const totalAvailableStock = existingStocks.reduce((sum, stock) => {
        const stockOnHand = parseFloat(stock.stockOnHand) || parseFloat(stock.openingStock) || 0;
        return sum + stockOnHand;
      }, 0);
      
      console.log(`Total available stock to redistribute: ${totalAvailableStock}`);
      
      // Calculate total stock being assigned in the form
      const totalAssignedStock = stockRows
        .filter(row => row.warehouse && row.warehouse.trim() !== "")
        .reduce((sum, row) => {
          const opening = parseFloat(row.openingStock) || 0;
          return sum + opening;
        }, 0);
      
      console.log(`Total stock being assigned: ${totalAssignedStock}`);
      
      // Merge into existing stocks, redistributing the stock
      const byWarehouse = new Map(existingStocks.map(s => [s.warehouse, { ...s }]));

      // First, clear or reduce the "Warehouse" stock (where purchase receives add stock)
      const warehouseStock = byWarehouse.get("Warehouse");
      if (warehouseStock) {
        // Keep committed stock, but reset available stock to be redistributed
        warehouseStock.stockOnHand = 0;
        warehouseStock.availableForSale = warehouseStock.committedStock || 0;
        warehouseStock.physicalStockOnHand = 0;
        warehouseStock.physicalAvailableForSale = warehouseStock.physicalCommittedStock || 0;
      }

      // Now assign stock to the warehouses specified in the form
      stockRows
        .filter(row => row.warehouse && row.warehouse.trim() !== "")
        .forEach(row => {
          const opening = parseFloat(row.openingStock) || 0;
          const openingValue = parseFloat(row.openingStockValue) || 0;
          const pOpening = parseFloat(row.physicalOpeningStock) || 0;
          const current = byWarehouse.get(row.warehouse) || { warehouse: row.warehouse };

          // Set the stock values (redistributing, not adding)
          if (!Number.isNaN(opening)) {
            current.openingStock = opening;
            current.openingStockValue = openingValue;
            current.stockOnHand = opening;
            current.committedStock = current.committedStock || 0;
            current.availableForSale = Math.max(0, opening - (current.committedStock || 0));
          }
          if (!Number.isNaN(pOpening)) {
            current.physicalOpeningStock = pOpening;
            current.physicalStockOnHand = pOpening;
            current.physicalCommittedStock = current.physicalCommittedStock || 0;
            current.physicalAvailableForSale = Math.max(0, pOpening - (current.physicalCommittedStock || 0));
          }

          byWarehouse.set(row.warehouse, current);
        });

      // Calculate remaining stock (if total assigned is less than available)
      const remainingStock = totalAvailableStock - totalAssignedStock;
      if (remainingStock > 0) {
        // Put remaining stock back in "Warehouse"
        const warehouseStock = byWarehouse.get("Warehouse") || { warehouse: "Warehouse" };
        const currentWarehouseStock = parseFloat(warehouseStock.stockOnHand) || 0;
        warehouseStock.stockOnHand = currentWarehouseStock + remainingStock;
        warehouseStock.availableForSale = (warehouseStock.availableForSale || 0) + remainingStock;
        warehouseStock.physicalStockOnHand = (warehouseStock.physicalStockOnHand || 0) + remainingStock;
        warehouseStock.physicalAvailableForSale = (warehouseStock.physicalAvailableForSale || 0) + remainingStock;
        byWarehouse.set("Warehouse", warehouseStock);
        console.log(`Remaining stock (${remainingStock}) kept in Warehouse`);
      }

      const stockData = Array.from(byWarehouse.values());
      
      // Verify total (should equal original total)
      const newTotal = stockData.reduce((sum, stock) => {
        return sum + (parseFloat(stock.stockOnHand) || 0);
      }, 0);
      console.log(`New total stock after redistribution: ${newTotal} (should equal ${totalAvailableStock})`);

      // Update item with stock data in the itemGroup
      const updatedItems = itemGroup.items.map(i => {
        const currentItemId = (i._id || i.id || "").toString();
        const targetItemId = itemId.toString();
        if (currentItemId === targetItemId) {
          return {
            ...i,
            _id: i._id || i.id, // Preserve _id
            id: i.id || i._id, // Preserve id
            warehouseStocks: stockData
          };
        }
        return i;
      });

      // Get current user for history tracking
      const currentUser = JSON.parse(localStorage.getItem("rootfinuser")) || {};
      const changedBy = currentUser.username || currentUser.locName || "System";

      // Update the item group with the modified items
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
        items: updatedItems,
        stock: itemGroup.stock || 0,
        reorder: itemGroup.reorder || "",
        isActive: itemGroup.isActive !== undefined ? itemGroup.isActive : true,
        itemId: itemId,
        changedBy: changedBy,
      };

      const response = await fetch(`${API_URL}/api/shoe-sales/item-groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.message || payload?.errors?.join(", ") || "Failed to save stock data");
      }
      
      // Show success message
      const successMsg = "Stock data saved successfully!";
      
      // Navigate back with a flag to indicate data was saved
      navigate(`/shoe-sales/item-groups/${id}/items/${itemId}?stocksUpdated=true&message=${encodeURIComponent(successMsg)}`, { replace: true });
    } catch (error) {
      console.error("Error saving stock:", error);
      alert(error.message || "Failed to save stock data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!itemGroup || !item) {
    return (
      <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
        <div className="rounded-2xl border border-[#e4e6f2] bg-white shadow-lg p-8 text-center">
          <p className="text-lg font-medium text-[#475569]">Item not found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <div className="rounded-2xl border border-[#e4e6f2] bg-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.18)]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e4e6f2] px-8 py-6">
          <h1 className="text-2xl font-bold text-[#1f2937]">{item.name || "Item Stock Management"}</h1>
          <button
            onClick={() => navigate(`/shoe-sales/item-groups/${id}/items/${itemId}`)}
            className="no-blue-button inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#d7dcf5] bg-white text-[#475569] shadow-sm transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5f5] hover:shadow-md"
          >
            <X size={18} className="text-[#64748b]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="overflow-x-auto rounded-lg border border-[#e4e6f2]">
            <table className="min-w-full">
              <thead className="bg-[#f1f4ff]">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#4a5b8b]">
                    Warehouse
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#4a5b8b]">
                    <div className="flex items-center justify-between">
                      <span>Opening Stock (Accounting)</span>
                      <button
                        onClick={() => handleCopyToAll("openingStock")}
                        className="ml-4 text-xs font-medium text-[#475569] hover:text-[#1f2937] transition-colors"
                      >
                        COPY TO ALL
                      </button>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#4a5b8b]">
                    <div className="flex items-center justify-between">
                      <span>Physical Stock</span>
                      <button
                        onClick={() => handleCopyToAll("physicalOpeningStock")}
                        className="ml-4 text-xs font-medium text-[#475569] hover:text-[#1f2937] transition-colors"
                      >
                        COPY TO ALL
                      </button>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-[0.14em] text-[#4a5b8b]">
                    <div className="flex items-center justify-between">
                      <span>Opening Stock Value Per Unit</span>
                      <button
                        onClick={() => handleCopyToAll("openingStockValue")}
                        className="ml-4 text-xs font-medium text-[#475569] hover:text-[#1f2937] transition-colors"
                      >
                        COPY TO ALL
                      </button>
                    </div>
                  </th>
                  <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-[0.14em] text-[#4a5b8b] w-20">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef2ff] bg-white">
                {stockRows.map((row, index) => (
                  <tr key={index} className="hover:bg-[#f7f9ff]">
                    <td className="px-6 py-4">
                      <select
                        value={row.warehouse}
                        onChange={(e) => handleInputChange(index, "warehouse", e.target.value)}
                        className="w-full rounded-lg border border-[#d7dcf5] bg-white px-3 py-2.5 text-sm text-[#1f2937] focus:border-[#cbd5f5] focus:outline-none focus:ring-2 focus:ring-[#e0e7ff] transition-all"
                      >
                        <option value="">{index === 0 ? "Warehouse" : "Select Warehouse"}</option>
                        {warehouses.map((wh, idx) => (
                          <option key={idx} value={wh}>{wh}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={row.openingStock}
                        onChange={(e) => handleInputChange(index, "openingStock", e.target.value)}
                        className="w-full rounded-lg border border-[#d7dcf5] bg-white px-3 py-2.5 text-sm text-[#1f2937] focus:border-[#cbd5f5] focus:outline-none focus:ring-2 focus:ring-[#e0e7ff] transition-all"
                        placeholder="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={row.physicalOpeningStock}
                        onChange={(e) => handleInputChange(index, "physicalOpeningStock", e.target.value)}
                        className="w-full rounded-lg border border-[#d7dcf5] bg-white px-3 py-2.5 text-sm text-[#1f2937] focus:border-[#cbd5f5] focus:outline-none focus:ring-2 focus:ring-[#e0e7ff] transition-all"
                        placeholder="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="number"
                        value={row.openingStockValue}
                        onChange={(e) => handleInputChange(index, "openingStockValue", e.target.value)}
                        className="w-full rounded-lg border border-[#d7dcf5] bg-white px-3 py-2.5 text-sm text-[#1f2937] focus:border-[#cbd5f5] focus:outline-none focus:ring-2 focus:ring-[#e0e7ff] transition-all"
                        placeholder="0"
                        step="0.01"
                      />
                    </td>
                    <td className="px-6 py-4 text-center">
                      {stockRows.length > 1 && (
                        <button
                          onClick={() => handleDeleteRow(index)}
                          className="no-blue-button flex h-9 w-9 items-center justify-center rounded-lg text-[#ef4444] transition-colors hover:bg-[#fef2f2] mx-auto"
                        >
                          <Trash2 size={18} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Add New Row Button */}
          <div className="mt-6">
            <button
              onClick={handleAddRow}
              className="no-blue-button inline-flex items-center gap-2 rounded-lg border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] shadow-sm transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5f5] hover:shadow-md"
            >
              <Plus size={16} className="text-[#64748b]" />
              <span>+ New Row</span>
            </button>
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex items-center justify-start gap-3 border-t border-[#e4e6f2] pt-6">
            <button
              onClick={handleSave}
              disabled={loading}
              className="no-blue-button rounded-lg bg-[#475569] px-6 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-[#334155] disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => navigate(`/shoe-sales/item-groups/${id}/items/${itemId}`)}
              disabled={loading}
              className="no-blue-button rounded-lg border border-[#d7dcf5] bg-white px-6 py-2.5 text-sm font-medium text-[#475569] transition hover:bg-[#f1f5f9] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemStockManagement;

