import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Link, useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Edit, X, Building2, Info, Camera, Settings, Star, Warehouse, ChevronDown, Plus, Copy } from "lucide-react";
import Head from "../components/Head";

// Warehouse name mapping: actual names from API -> display names for Stocks page
const WAREHOUSE_NAME_MAPPING = {
  // Actual API names -> Display names
  "G.Palakkad": "Palakkad Branch",
  "G.Palakkad ": "Palakkad Branch",
  "GPalakkad": "Palakkad Branch",
  "Palakkad Branch": "Palakkad Branch",
  "Warehouse": "Warehouse",
  "G.Calicut": "Calicut",
  "G.Calicut ": "Calicut",
  "GCalicut": "Calicut",
  "Calicut": "Calicut",
  "G.Manjeri": "Manjery Branch",
  "G.Manjery": "Manjery Branch",
  "GManjeri": "Manjery Branch",
  "GManjery": "Manjery Branch",
  "Manjery Branch": "Manjery Branch",
  "G.Kannur": "Kannur Branch",
  "GKannur": "Kannur Branch",
  "Kannur Branch": "Kannur Branch",
  "G.Edappal": "Edappal Branch",
  "GEdappal": "Edappal Branch",
  "Edappal Branch": "Edappal Branch",
  "G.Kalpetta": "Kalpetta Branch",
  "GKalpetta": "Kalpetta Branch",
  "Kalpetta Branch": "Kalpetta Branch",
  "G.Kottakkal": "Kottakkal Branch",
  "GKottakkal": "Kottakkal Branch",
  "Kottakkal Branch": "Kottakkal Branch",
  "G.Perinthalmanna": "Perinthalmanna Branch",
  "GPerinthalmanna": "Perinthalmanna Branch",
  "Perinthalmanna Branch": "Perinthalmanna Branch",
  "Grooms Trivandum": "Grooms Trivandum",
  "SG-Trivandrum": "Grooms Trivandum",
  "G.Chavakkad": "Chavakkad Branch",
  "GChavakkad": "Chavakkad Branch",
  "Chavakkad Branch": "Chavakkad Branch",
  "G.Thrissur": "Thrissur Branch",
  "GThrissur": "Thrissur Branch",
  "Thrissur Branch": "Thrissur Branch",
  "G.Perumbavoor": "Perumbavoor Branch",
  "GPerumbavoor": "Perumbavoor Branch",
  "Perumbavoor Branch": "Perumbavoor Branch",
  "G.Kottayam": "Kottayam Branch",
  "GKottayam": "Kottayam Branch",
  "Kottayam Branch": "Kottayam Branch",
  "G.Edappally": "Edapally Branch",
  "GEdappally": "Edapally Branch",
  "Edapally Branch": "Edapally Branch",
  "G.MG Road": "MG Road",
  "G.Mg Road": "MG Road",
  "GMG Road": "MG Road",
  "GMg Road": "MG Road",
  "MG Road": "MG Road"
};

// Display names for the Stocks page (what users see)
const ALLOWED_WAREHOUSES_DISPLAY = [
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

// Get all possible actual warehouse names that map to allowed warehouses
const getAllowedActualNames = () => {
  const actualNames = new Set();
  Object.keys(WAREHOUSE_NAME_MAPPING).forEach(actualName => {
    if (ALLOWED_WAREHOUSES_DISPLAY.includes(WAREHOUSE_NAME_MAPPING[actualName])) {
      actualNames.add(actualName);
    }
  });
  return Array.from(actualNames);
};

// Helper function to normalize warehouse name to display name
const normalizeWarehouseName = (warehouseName) => {
  if (!warehouseName) return null;
  // Check exact match first
  if (WAREHOUSE_NAME_MAPPING[warehouseName]) {
    return WAREHOUSE_NAME_MAPPING[warehouseName];
  }
  // Check case-insensitive match
  const lowerName = warehouseName.toLowerCase().trim();
  for (const [key, value] of Object.entries(WAREHOUSE_NAME_MAPPING)) {
    if (key.toLowerCase().trim() === lowerName) {
      return value;
    }
  }
  // If it's already a display name, return it
  if (ALLOWED_WAREHOUSES_DISPLAY.includes(warehouseName)) {
    return warehouseName;
  }
  return null;
};

const ShoeSalesItemDetailFromGroup = () => {
  const { id, itemId } = useParams();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [itemGroup, setItemGroup] = useState(null);
  const [item, setItem] = useState(null);
  const [activeTab, setActiveTab] = useState("Overview");
  const [stockType, setStockType] = useState("accounting"); // "accounting" or "physical"
  const [showInactiveWarehouses, setShowInactiveWarehouses] = useState(false);
  const [warehouseStocks, setWarehouseStocks] = useState([]);
  const [allWarehouses, setAllWarehouses] = useState([]);
  const [history, setHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showInactiveModal, setShowInactiveModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showRemoveModal, setShowRemoveModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allItemGroups, setAllItemGroups] = useState([]);
  const [selectedTargetGroupId, setSelectedTargetGroupId] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const moreMenuRef = useRef(null);

  // Fetch all warehouses from account settings and filter to only allowed ones
  const fetchAllWarehouses = useCallback(async () => {
    // Always use the display names for the Stocks page
    const sortedWarehouses = [...ALLOWED_WAREHOUSES_DISPLAY].sort((a, b) => {
      if (a === "Warehouse") return -1;
      if (b === "Warehouse") return 1;
      return a.localeCompare(b);
    });
    setAllWarehouses(sortedWarehouses);
  }, []);

  const fetchData = useCallback(async () => {
    if (!id || !itemId) return;
    
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
  }, [id, itemId]);

  // Fetch history
  const fetchHistory = useCallback(async () => {
    if (!id || !itemId) {
      console.log("Missing id or itemId for history fetch:", { id, itemId });
      return;
    }
    
    try {
      setLoadingHistory(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";
      const url = `${API_URL}/api/shoe-sales/item-groups/${id}/items/${itemId}/history`;
      console.log("Fetching history from:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch history:", response.status, errorText);
        throw new Error("Failed to fetch history");
      }
      
      let data = await response.json();
      console.log("History data received:", data);
      
      // Ensure we have an array
      const historyArray = Array.isArray(data) ? data : [];
      
      // Check if we have a CREATE entry, if not and item exists, add one
      const hasCreateEntry = historyArray.some(entry => entry.changeType === "CREATE");
      if (!hasCreateEntry && item && (item.createdAt || itemGroup?.createdAt)) {
        // Add creation entry from item's or group's createdAt
        const createdAt = item.createdAt ? new Date(item.createdAt) : (itemGroup?.createdAt ? new Date(itemGroup.createdAt) : new Date());
        // Try to get createdBy from item, itemGroup, or history entries, or get current user, or use "System"
        let createdBy = item.createdBy || itemGroup?.changedBy || itemGroup?.createdBy;
        if (!createdBy) {
          // Try to get from history entries if available
          const createHistoryEntry = historyArray.find(entry => entry.changeType === "CREATE");
          if (createHistoryEntry && createHistoryEntry.changedBy) {
            createdBy = createHistoryEntry.changedBy;
          } else {
            // Get current user as fallback
            const currentUser = JSON.parse(localStorage.getItem("rootfinuser")) || {};
            createdBy = currentUser.username || currentUser.locName || "System";
          }
        }
        const createEntry = {
          itemId: itemId.toString(),
          itemGroupId: id,
          changeType: "CREATE",
          details: "created",
          changedBy: createdBy,
          changedAt: createdAt,
          createdAt: createdAt,
          oldData: null,
          newData: item,
        };
        // Add at the end (will be sorted by changedAt)
        historyArray.push(createEntry);
      }
      
      // Sort by changedAt descending (most recent first)
      historyArray.sort((a, b) => {
        const dateA = new Date(a.changedAt || a.createdAt || 0);
        const dateB = new Date(b.changedAt || b.createdAt || 0);
        return dateB - dateA;
      });
      
      setHistory(historyArray);
    } catch (error) {
      console.error("Error fetching history:", error);
      setHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, [id, itemId, item, itemGroup]);

  // Fetch all item groups for the move modal
  const fetchAllItemGroups = useCallback(async () => {
    try {
      setLoadingGroups(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";
      const response = await fetch(`${API_URL}/api/shoe-sales/item-groups`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch item groups");
      }
      
      const data = await response.json();
      // Filter out the current group and only show active groups
      const filteredGroups = data.filter(group => {
        const groupIdStr = (group._id || group.id || "").toString();
        return groupIdStr !== id.toString() && (group.isActive !== false);
      });
      
      setAllItemGroups(filteredGroups);
    } catch (error) {
      console.error("Error fetching item groups:", error);
      alert("Failed to load item groups. Please try again.");
    } finally {
      setLoadingGroups(false);
    }
  }, [id]);

  useEffect(() => {
    fetchData();
    fetchAllWarehouses();
  }, [fetchData, fetchAllWarehouses]);

  useEffect(() => {
    if (activeTab === "History") {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

  // Fetch groups when move modal opens
  useEffect(() => {
    if (showMoveModal) {
      fetchAllItemGroups();
      setSelectedTargetGroupId("");
    }
  }, [showMoveModal, fetchAllItemGroups]);

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

  // Combine all warehouses with stock data
  useEffect(() => {
    if (allWarehouses.length > 0) {
      // Get item warehouse stocks if item exists
      const itemWarehouseStocks = item?.warehouseStocks || [];
      
      // Create a map of warehouse stocks by normalized display name
      const stockMap = new Map();
      itemWarehouseStocks.forEach(stock => {
        if (stock.warehouse) {
          // Normalize the warehouse name to display name
          const displayName = normalizeWarehouseName(stock.warehouse);
          if (displayName && ALLOWED_WAREHOUSES_DISPLAY.includes(displayName)) {
            // Store with display name as key, but keep original stock data
            stockMap.set(displayName, {
              ...stock,
              warehouse: displayName // Use display name
            });
          }
        }
      });
      
      // Always use the display names for the Stocks page
      // Sort warehouses: "Warehouse" first, then alphabetically
      const sortedWarehouses = [...ALLOWED_WAREHOUSES_DISPLAY].sort((a, b) => {
        if (a === "Warehouse") return -1;
        if (b === "Warehouse") return 1;
        return a.localeCompare(b);
      });
      
      // Create combined list: all allowed warehouses with their stock data (or default 0)
      const combinedStocks = sortedWarehouses.map(displayName => {
        const existingStock = stockMap.get(displayName);
        
        if (existingStock) {
          return existingStock;
        }
        
        // Return default stock structure for warehouses without stock data
        return {
          warehouse: displayName,
          openingStock: 0,
          openingStockValue: 0,
          stockOnHand: 0,
          committedStock: 0,
          availableForSale: 0
        };
      });
      
      setWarehouseStocks(combinedStocks);
    } else if (item && item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
      // If no warehouses from API but item has warehouse stocks, normalize and filter
      const stockMap = new Map();
      item.warehouseStocks.forEach(stock => {
        if (stock.warehouse) {
          const displayName = normalizeWarehouseName(stock.warehouse);
          if (displayName && ALLOWED_WAREHOUSES_DISPLAY.includes(displayName)) {
            stockMap.set(displayName, {
              ...stock,
              warehouse: displayName
            });
          }
        }
      });
      
      const sortedWarehouses = [...ALLOWED_WAREHOUSES_DISPLAY].sort((a, b) => {
        if (a === "Warehouse") return -1;
        if (b === "Warehouse") return 1;
        return a.localeCompare(b);
      });
      
      const combinedStocks = sortedWarehouses.map(displayName => {
        const existingStock = stockMap.get(displayName);
        if (existingStock) {
          return existingStock;
        }
        return {
          warehouse: displayName,
          openingStock: 0,
          openingStockValue: 0,
          stockOnHand: 0,
          committedStock: 0,
          availableForSale: 0
        };
      });
      
      setWarehouseStocks(combinedStocks);
    } else if (allWarehouses.length === 0 && !item) {
      // If no warehouses and no item, show empty array
      setWarehouseStocks([]);
    }
  }, [allWarehouses, item]);

  // Check if returning from stock management page and refresh data
  useEffect(() => {
    const stocksUpdated = searchParams.get('stocksUpdated');
    const message = searchParams.get('message');
    
    if (stocksUpdated === 'true') {
      // Show success message if provided
      if (message) {
        alert(decodeURIComponent(message));
      }
      
      // Switch to Stocks tab
      setActiveTab("Stocks");
      // Refresh data
      fetchData();
      // Remove the query parameters
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, fetchData]);

  // Calculate stock totals from warehouse stocks - MUST be before early return
  const stockTotals = useMemo(() => {
    const totals = {
      openingStock: 0,
      stockOnHand: 0,
      committedStock: 0,
      availableForSale: 0,
    };
    
    if (warehouseStocks && Array.isArray(warehouseStocks)) {
      warehouseStocks.forEach(stock => {
        const opening = parseFloat(stock.openingStock || 0);
        const onHand = parseFloat(stock.stockOnHand || stock.openingStock || 0);
        const committed = parseFloat(stock.committedStock || 0);
        const available = parseFloat(stock.availableForSale || (onHand - committed));
        
        totals.openingStock += opening;
        totals.stockOnHand += onHand;
        totals.committedStock += committed;
        totals.availableForSale += available;
      });
    }
    
    // Fallback to item.stock if no warehouse stocks
    if (totals.stockOnHand === 0 && typeof item?.stock === 'number') {
      totals.stockOnHand = item.stock;
      totals.openingStock = item.stock;
      totals.availableForSale = item.stock;
    }
    
    return totals;
  }, [warehouseStocks, item]);

  if (!itemGroup || !item) {
    return (
      <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
        <div className="rounded-2xl border border-[#e4e6f2] bg-white shadow-lg p-8 text-center">
          <p className="text-lg font-medium text-[#475569]">Item not found</p>
          <Link
            to={`/shoe-sales/item-groups/${id}`}
            className="mt-4 inline-block text-sm font-medium text-[#475569] hover:text-[#1f2937]"
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

  // Handler functions for More menu options
  const handleCloneItem = async () => {
    try {
      setLoading(true);
      setShowMoreMenu(false);
      
      if (!itemGroup || !item) {
        alert("Item data not available.");
        return;
      }

      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";
      
      // Create a copy of the item with a new name
      const clonedItem = {
        ...item,
        name: `${item.name} (Copy)`,
        sku: item.sku ? `${item.sku}-COPY` : "",
        _id: undefined, // Remove _id so it creates a new item
        id: undefined,
      };

      // Add the cloned item to the group
      const updatedItems = [...(itemGroup.items || []), clonedItem];
      
      const currentUser = JSON.parse(localStorage.getItem("rootfinuser")) || {};
      const changedBy = currentUser.username || currentUser.locName || "System";

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
        changedBy: changedBy,
      };

      const response = await fetch(`${API_URL}/api/shoe-sales/item-groups/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error("Failed to clone item");
      }

      alert("Item cloned successfully!");
      // Refresh the page to show the new item
      window.location.reload();
    } catch (error) {
      console.error("Error cloning item:", error);
      alert("Failed to clone item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsInactive = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";
      
      if (!itemGroup || !item) {
        alert("Item data not available.");
        return;
      }

      // Remove the item from the items array (marking as inactive by removing it)
      const updatedItems = itemGroup.items.filter(i => {
        const itemIdStr = (i._id?.toString() || i.id || "").toString();
        return itemIdStr !== itemId.toString();
      });

      const currentUser = JSON.parse(localStorage.getItem("rootfinuser")) || {};
      const changedBy = currentUser.username || currentUser.locName || "System";

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
        throw new Error("Failed to mark item as inactive");
      }

      setShowInactiveModal(false);
      alert("Item has been marked as inactive.");
      navigate(`/shoe-sales/item-groups/${id}`);
    } catch (error) {
      console.error("Error marking item as inactive:", error);
      alert("Failed to mark item as inactive. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";
      
      if (!itemGroup || !item) {
        alert("Item data not available.");
        return;
      }

      // Remove the item from the items array
      const updatedItems = itemGroup.items.filter(i => {
        const itemIdStr = (i._id?.toString() || i.id || "").toString();
        return itemIdStr !== itemId.toString();
      });

      const currentUser = JSON.parse(localStorage.getItem("rootfinuser")) || {};
      const changedBy = currentUser.username || currentUser.locName || "System";

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
        throw new Error("Failed to delete item");
      }

      setShowDeleteModal(false);
      alert("Item deleted successfully.");
      navigate(`/shoe-sales/item-groups/${id}`);
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item. Please try again.");
    } finally {
      setLoading(false);
    }
  };


  const handleMoveToGroup = async () => {
    if (!selectedTargetGroupId) {
      alert("Please select a target group.");
      return;
    }

    if (!itemGroup || !item) {
      alert("Item data not available.");
      return;
    }

    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";
      
      // Fetch the target group
      const targetGroupResponse = await fetch(`${API_URL}/api/shoe-sales/item-groups/${selectedTargetGroupId}`);
      if (!targetGroupResponse.ok) {
        throw new Error("Failed to fetch target group");
      }
      const targetGroup = await targetGroupResponse.json();

      // Prepare the item to move (preserve all properties)
      const itemToMove = {
        ...item,
        _id: undefined, // Remove _id so it gets a new one in the target group
        id: undefined,
      };

      const currentUser = JSON.parse(localStorage.getItem("rootfinuser")) || {};
      const changedBy = currentUser.username || currentUser.locName || "System";

      // Remove item from current group
      const updatedCurrentGroupItems = itemGroup.items.filter(i => {
        const itemIdStr = (i._id?.toString() || i.id || "").toString();
        return itemIdStr !== itemId.toString();
      });

      const currentGroupPayload = {
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
        items: updatedCurrentGroupItems,
        stock: itemGroup.stock || 0,
        reorder: itemGroup.reorder || "",
        isActive: itemGroup.isActive !== undefined ? itemGroup.isActive : true,
        itemId: itemId,
        changedBy: changedBy,
      };

      // Add item to target group
      const updatedTargetGroupItems = [...(targetGroup.items || []), itemToMove];

      const targetGroupPayload = {
        name: targetGroup.name,
        sku: targetGroup.sku || "",
        itemType: targetGroup.itemType || "goods",
        unit: targetGroup.unit || "",
        manufacturer: targetGroup.manufacturer || "",
        brand: targetGroup.brand || "",
        taxPreference: targetGroup.taxPreference || "taxable",
        intraStateTaxRate: targetGroup.intraStateTaxRate || "",
        interStateTaxRate: targetGroup.interStateTaxRate || "",
        inventoryValuationMethod: targetGroup.inventoryValuationMethod || "",
        createAttributes: targetGroup.createAttributes !== undefined ? targetGroup.createAttributes : true,
        attributeRows: targetGroup.attributeRows || [],
        sellable: targetGroup.sellable !== undefined ? targetGroup.sellable : true,
        purchasable: targetGroup.purchasable !== undefined ? targetGroup.purchasable : true,
        trackInventory: targetGroup.trackInventory !== undefined ? targetGroup.trackInventory : false,
        items: updatedTargetGroupItems,
        stock: targetGroup.stock || 0,
        reorder: targetGroup.reorder || "",
        isActive: targetGroup.isActive !== undefined ? targetGroup.isActive : true,
        changedBy: changedBy,
      };

      // Update both groups
      const [currentGroupResponse, targetGroupResponse2] = await Promise.all([
        fetch(`${API_URL}/api/shoe-sales/item-groups/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(currentGroupPayload),
        }),
        fetch(`${API_URL}/api/shoe-sales/item-groups/${selectedTargetGroupId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(targetGroupPayload),
        }),
      ]);

      if (!currentGroupResponse.ok || !targetGroupResponse2.ok) {
        throw new Error("Failed to move item");
      }

      setShowMoveModal(false);
      alert(`Item "${item.name}" has been moved successfully!`);
      navigate(`/shoe-sales/item-groups/${selectedTargetGroupId}`);
    } catch (error) {
      console.error("Error moving item:", error);
      alert("Failed to move item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen">
      <Head
        title={item.name || "Item Detail"}
        description={item.sku ? `SKU: ${item.sku}` : itemGroup.name}
        actions={
          <div className="flex items-center">
            <button className="no-blue-button inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d7dcf5] bg-white px-4 text-sm font-medium text-[#475569] shadow-sm transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5f5] hover:shadow-md">
              <span>Adj</span>
            </button>
            <Link
              to={`/shoe-sales/item-groups/${id}/items/${itemId}/edit`}
              className="no-blue-button inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#d7dcf5] bg-white px-4 text-sm font-medium text-[#475569] shadow-sm transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5f5] hover:shadow-md ml-3"
            >
              <Edit size={16} className="text-[#64748b]" />
              <span>Edit</span>
            </Link>
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
                    onClick={handleCloneItem}
                    className="w-full px-4 py-2.5 text-left text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 active:bg-blue-800 transition-colors duration-150 flex items-center gap-2"
                  >
                    <Copy size={14} />
                    Clone Item
                  </button>
                  <div className="h-px bg-[#e7ebf8]"></div>
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
                  <div className="h-px bg-[#e7ebf8]"></div>
                  <button
                    onClick={() => {
                      setShowMoveModal(true);
                      setShowMoreMenu(false);
                    }}
                    className="no-blue-button w-full px-4 py-2.5 text-left text-sm font-medium text-[#475569] bg-white hover:bg-[#f8fafc] active:bg-[#f1f5f9] transition-colors duration-150"
                  >
                    Move to another group
                  </button>
                  <div className="h-px bg-[#e7ebf8]"></div>
                  <button
                    onClick={() => {
                      setShowRemoveModal(true);
                      setShowMoreMenu(false);
                    }}
                    className="no-blue-button w-full px-4 py-2.5 text-left text-sm font-medium text-[#475569] bg-white hover:bg-[#f8fafc] active:bg-[#f1f5f9] transition-colors duration-150"
                  >
                    Remove from Item Group
                  </button>
                </div>
              )}
            </div>
            <div className="h-6 w-px bg-[#e7ebf8] mx-3"></div>
            <Link
              to={`/shoe-sales/item-groups/${id}`}
              className="no-blue-button inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[#d7dcf5] bg-white text-[#475569] shadow-sm transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5f5] hover:shadow-md"
            >
              <X size={18} className="text-[#64748b]" />
            </Link>
          </div>
        }
      />

      <div className="rounded-2xl border border-[#e4e6f2] bg-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.18)]">
        {/* Tabs */}
        <div className="flex items-center gap-6 border-b border-[#e4e6f2] px-6">
          {["Overview", "Stocks", "Transactions", "History"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`no-blue-button py-4 text-sm font-medium transition ${
                activeTab === tab
                  ? "border-b-2 border-[#475569] text-[#1f2937] font-semibold"
                  : "text-[#64748b] hover:text-[#1f2937]"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-8">
          {activeTab === "Overview" && (
            <div className="grid gap-8 lg:grid-cols-[1.8fr,1fr]">
              {/* Left Column - Primary Details */}
              <div className="space-y-8">
                {/* Primary Details Card */}
                <div className="rounded-xl border border-[#e4e6f2] bg-white p-6 shadow-sm">
                  <h3 className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                    Primary Details
                  </h3>
                  <div className="grid gap-5 md:grid-cols-2">
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Item Group Name
                      </label>
                      <p className="text-sm font-medium text-[#1f2937]">{itemGroup.name}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Item Type
                      </label>
                      <p className="text-sm text-[#1f2937]">
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
                            <div key={idx} className="space-y-1">
                              <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                                {attrRow.attribute.toUpperCase()}
                              </label>
                              <p className="text-sm text-[#1f2937]">{attrValue || "—"}</p>
                            </div>
                          ) : null;
                        })}
                      </>
                    )}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        SKU
                      </label>
                      <p className="text-sm font-medium text-[#1f2937]">{item.sku || "—"}</p>
                    </div>
                    {item.hsnCode && (
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                          HSN Code
                        </label>
                        <p className="text-sm text-[#1f2937]">{item.hsnCode}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Unit
                      </label>
                      <p className="text-sm text-[#1f2937]">{itemGroup.unit || "pcs"}</p>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Created Source
                      </label>
                      <p className="text-sm text-[#1f2937]">User</p>
                    </div>
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Tax Preference
                      </label>
                      <p className="text-sm text-[#1f2937]">
                        {itemGroup.taxPreference === "taxable" ? "Taxable" : "Non-Taxable"}
                      </p>
                    </div>
                    {itemGroup.intraStateTaxRate && (
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                          Intra State Tax Rate
                        </label>
                        <p className="text-sm text-[#1f2937]">{itemGroup.intraStateTaxRate}</p>
                      </div>
                    )}
                    {itemGroup.interStateTaxRate && (
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                          Inter State Tax Rate
                        </label>
                        <p className="text-sm text-[#1f2937]">{itemGroup.interStateTaxRate}</p>
                      </div>
                    )}
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Inventory Account
                      </label>
                      <p className="text-sm text-[#1f2937]">Inventory Asset</p>
                    </div>
                    {itemGroup.inventoryValuationMethod && (
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                          Inventory Valuation Method
                        </label>
                        <p className="text-sm text-[#1f2937]">{itemGroup.inventoryValuationMethod}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Purchase & Sales Information Cards */}
                <div className="grid gap-6 md:grid-cols-2">
                  {/* Purchase Information Card */}
                  <div className="rounded-xl border border-[#e4e6f2] bg-gradient-to-br from-[#f8fafc] to-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#e0e7ff]">
                        <span className="text-sm font-semibold text-[#3730a3]">₹</span>
                      </div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Purchase
                  </h3>
                    </div>
                    <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-[#64748b]">Cost Price</label>
                        <p className="mt-1 text-xl font-semibold text-[#1f2937]">
                        ₹{typeof item.costPrice === 'number' ? item.costPrice.toFixed(2) : (item.costPrice || "0.00")}
                      </p>
                    </div>
                      <div className="pt-3 border-t border-[#e4e6f2]">
                        <label className="text-xs font-medium text-[#64748b]">Purchase Account</label>
                        <p className="mt-1 text-sm text-[#475569]">Cost of Goods Sold</p>
                      </div>
                  </div>
                </div>

                  {/* Sales Information Card */}
                  <div className="rounded-xl border border-[#e4e6f2] bg-gradient-to-br from-[#f0fdf4] to-white p-6 shadow-sm">
                    <div className="mb-4 flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#dcfce7]">
                        <span className="text-sm font-semibold text-[#166534]">₹</span>
                      </div>
                      <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Sales
                  </h3>
                    </div>
                    <div className="space-y-4">
                    <div>
                        <label className="text-xs font-medium text-[#64748b]">Selling Price</label>
                        <p className="mt-1 text-xl font-semibold text-[#1f2937]">
                        ₹{typeof item.sellingPrice === 'number' ? item.sellingPrice.toFixed(2) : (item.sellingPrice || "0.00")}
                      </p>
                    </div>
                      <div className="pt-3 border-t border-[#e4e6f2]">
                        <label className="text-xs font-medium text-[#64748b]">Sales Account</label>
                        <p className="mt-1 text-sm text-[#475569]">Sales</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Reporting Tags Card */}
                <div className="rounded-xl border border-[#e4e6f2] bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                    Reporting Tags
                  </h3>
                  <p className="mb-3 text-sm text-[#64748b]">No reporting tag has been associated with this item.</p>
                  <Link
                    to="#"
                    className="inline-flex items-center gap-1 text-sm font-medium text-[#475569] hover:text-[#1f2937] transition-colors"
                  >
                    <span>Associated Price Lists</span>
                    <span className="text-[#94a3b8]">→</span>
                  </Link>
                </div>
              </div>

              {/* Right Column - Image Upload & Stock Info */}
              <div className="space-y-6">
                {/* Image Upload */}
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d7dcf5] bg-gradient-to-br from-[#f8f9ff] to-[#ffffff] p-5 py-8 text-center transition-all hover:border-[#cbd5f5] hover:bg-[#f8f9ff] cursor-pointer">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[#e0e7ff]">
                    <Camera size={20} className="text-[#6366f1]" />
                  </div>
                  <p className="text-sm font-medium text-[#475569]">Drag image(s) here or browse</p>
                  <p className="mt-2 text-xs leading-4 text-[#94a3b8]">
                    Up to 15 images • 5 MB max • 7000 x 7000 px
                  </p>
                </div>

                {/* Stock Summary Card - Stock Snapshot */}
                <div className="rounded-xl border border-[#e4e6f2] bg-white p-6 shadow-sm">
                  <h3 className="mb-6 text-sm font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                    Stock Snapshot
                  </h3>
                  
                  <div className="space-y-6">
                    {/* Opening Stock Section */}
                    <div>
                      <div className="mb-2 flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#1f2937]">Opening Stock</span>
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#e2e8f0]">
                          <Info size={10} className="text-[#64748b]" />
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-base font-medium text-[#1f2937]">
                          {stockTotals.openingStock.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Accounting Stock Section */}
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#1f2937]">Accounting Stock</span>
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#e2e8f0]">
                          <Info size={10} className="text-[#64748b]" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-dashed border-[#e2e8f0] pb-1.5">
                          <span className="text-sm text-[#475569]">Stock on Hand</span>
                          <span className="text-sm font-medium text-[#1f2937]">
                            {stockTotals.stockOnHand.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-dashed border-[#e2e8f0] pb-1.5">
                          <span className="text-sm text-[#475569]">Committed Stock</span>
                          <span className="text-sm font-medium text-[#1f2937]">
                            {stockTotals.committedStock.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-dashed border-[#e2e8f0] pb-1.5">
                          <span className="text-sm text-[#475569]">Available for Sale</span>
                          <span className="text-sm font-medium text-[#1f2937]">
                            {stockTotals.availableForSale.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Physical Stock Section */}
                    <div>
                      <div className="mb-3 flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#1f2937]">Physical Stock</span>
                        <div className="flex h-4 w-4 items-center justify-center rounded-full bg-[#e2e8f0]">
                          <Info size={10} className="text-[#64748b]" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between border-b border-dashed border-[#e2e8f0] pb-1.5">
                          <span className="text-sm text-[#475569]">Stock on Hand</span>
                          <span className="text-sm font-medium text-[#1f2937]">
                            {stockTotals.stockOnHand.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-dashed border-[#e2e8f0] pb-1.5">
                          <span className="text-sm text-[#475569]">Committed Stock</span>
                          <span className="text-sm font-medium text-[#1f2937]">
                            {stockTotals.committedStock.toFixed(2)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-b border-dashed border-[#e2e8f0] pb-1.5">
                          <span className="text-sm text-[#475569]">Available for Sale</span>
                          <span className="text-sm font-medium text-[#1f2937]">
                            {stockTotals.availableForSale.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quantity Status Cards */}
                <div className="rounded-xl border border-[#e4e6f2] bg-white p-6 shadow-sm">
                  <h3 className="mb-4 text-sm font-semibold text-[#1f2937]">Order Status</h3>
                <div className="grid grid-cols-2 gap-3">
                    {["To be Shipped", "To be Received", "To be Invoiced", "To be Billed"].map((status, idx) => (
                    <div
                      key={status}
                        className="rounded-lg border border-[#e4e6f2] bg-gradient-to-br from-[#fafafa] to-white p-3 text-center transition-all hover:shadow-sm"
                    >
                        <p className="text-xs font-medium text-[#64748b]">{status}</p>
                        <p className="mt-1.5 text-lg font-bold text-[#1f2937]">0</p>
                        <p className="text-xs text-[#94a3b8]">Qty</p>
                    </div>
                  ))}
                  </div>
                </div>

                {/* Reorder Point Card */}
                <div className="rounded-xl border border-[#e4e6f2] bg-white p-6 shadow-sm">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fef3c7]">
                        <Info size={16} className="text-[#d97706]" />
                      </div>
                      <h3 className="text-sm font-semibold text-[#1f2937]">Reorder Point</h3>
                    </div>
                    <button className="no-blue-button flex h-7 w-7 items-center justify-center rounded-md border border-[#e4e6f2] text-[#64748b] transition-colors hover:bg-[#f8fafc] hover:border-[#cbd5f5]">
                      <Edit size={14} />
                    </button>
                  </div>
                  <p className="text-3xl font-bold text-[#1f2937]">
                    {item.reorderPoint ? parseFloat(item.reorderPoint).toFixed(2) : "0.00"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "Stocks" && (
            <div className="space-y-6">
              {/* Stock Location Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#e4e6f2]">
                <button
                  onClick={() => {
                    navigate(`/shoe-sales/item-groups/${id}/items/${itemId}/stocks`);
                  }}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                >
                  <Settings size={16} className="text-[#64748b]" />
                  <span className="text-base font-semibold text-[#1f2937]">Stock Locations</span>
                  <ChevronDown size={16} className="text-[#64748b]" />
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStockType("accounting")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      stockType === "accounting"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-700"
                        : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                    }`}
                  >
                    Accounting Stock
                  </button>
                  <button
                    onClick={() => setStockType("physical")}
                    className={`px-4 py-2 text-sm font-medium rounded-lg border transition-all duration-200 ${
                      stockType === "physical"
                        ? "bg-blue-600 text-white border-blue-600 shadow-sm hover:bg-blue-700"
                        : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100"
                    }`}
                  >
                    Physical Stock
                  </button>
                </div>
              </div>

              {/* Warehouses Table - Matching Image Layout */}
              {allWarehouses.length > 0 || warehouseStocks.length > 0 ? (
                <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-700">
                          Warehouse Name
                        </th>
                        <th colSpan={3} className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-700 border-l border-gray-200">
                          {stockType === "accounting" ? "Accounting Stock" : "Physical Stock"}
                        </th>
                      </tr>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-2"></th>
                        <th className="px-6 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600 border-l border-gray-200">
                          Stock on Hand
                        </th>
                        <th className="px-6 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                          Committed Stock
                        </th>
                        <th className="px-6 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                          Available for Sale
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {warehouseStocks.map((stock, idx) => {
                        const stockOnHandValue = parseFloat(stock.stockOnHand || stock.openingStock || 0);
                        const committedStockValue = parseFloat(stock.committedStock || 0);
                        const availableForSaleValue = parseFloat(stock.availableForSale || (stockOnHandValue - committedStockValue));
                        const isMainWarehouse = stock.warehouse === "Warehouse";
                        
                        return (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-2">
                                {isMainWarehouse && (
                                  <Star size={16} className="text-yellow-500 fill-yellow-500 flex-shrink-0" />
                                )}
                                <span className="text-sm font-medium text-gray-900">
                                  {stock.warehouse}
                                </span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-l border-gray-100">
                              {stockOnHandValue.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {committedStockValue.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {availableForSaleValue.toFixed(2)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="rounded-lg border border-[#e4e6f2] bg-white p-12 text-center">
                  <Warehouse size={48} className="mx-auto mb-4 text-[#94a3b8]" />
                  <p className="text-sm font-medium text-[#475569] mb-2">No stock locations added yet</p>
                  <p className="text-xs text-[#64748b] mb-4">Click "Stock Locations" above to add stocks to warehouses</p>
                  <button
                    onClick={() => navigate(`/shoe-sales/item-groups/${id}/items/${itemId}/stocks`)}
                    className="no-blue-button inline-flex items-center gap-2 rounded-lg border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] shadow-sm transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5f5] hover:shadow-md"
                  >
                    <Plus size={16} className="text-[#64748b]" />
                    <span>Add Stock Locations</span>
                  </button>
                </div>
              )}

              {/* Show Inactive Warehouses Link - Only show if there are stocks */}
              {warehouseStocks.length > 0 && (
                <div className="flex items-center gap-2 pt-4">
                  <button
                    onClick={() => setShowInactiveWarehouses(!showInactiveWarehouses)}
                    className="inline-flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                  >
                    <span>Show Inactive Warehouses</span>
                    <ChevronDown 
                      size={16} 
                      className={`text-gray-500 transition-transform duration-200 ${
                        showInactiveWarehouses ? "rotate-180" : "rotate-0"
                      }`} 
                    />
                  </button>
                </div>
              )}

              {/* Inactive Warehouses (if shown) */}
              {showInactiveWarehouses && warehouseStocks.length > 0 && (
                <div className="mt-4 overflow-x-auto rounded-lg border border-gray-200 bg-white">
                  <table className="min-w-full">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                          Warehouse Name
                        </th>
                        <th colSpan={3} className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-gray-600 border-l border-gray-200">
                          {stockType === "accounting" ? "Accounting Stock" : "Physical Stock"}
                        </th>
                      </tr>
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-2"></th>
                        <th className="px-6 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 border-l border-gray-200">
                          Stock on Hand
                        </th>
                        <th className="px-6 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Committed Stock
                        </th>
                        <th className="px-6 py-2 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                          Available for Sale
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      <tr className="opacity-60 hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <Warehouse size={16} className="text-gray-400" />
                            <span className="text-sm font-medium text-gray-500">Inactive Warehouse</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border-l border-gray-100">0.00</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">0.00</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-500">0.00</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === "History" && (
            <div className="py-6">
              {loadingHistory ? (
                <div className="py-12 text-center text-sm text-[#64748b]">
                  Loading history...
                </div>
              ) : history.length === 0 ? (
                <div className="py-12 text-center text-sm text-[#64748b]">
                  No history available
                </div>
              ) : (
                <div className="rounded-lg border border-[#e4e6f2] bg-white overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                          DATE
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-600">
                          DETAILS
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {history.map((entry, idx) => {
                        // Use changedAt, createdAt, or current date as fallback
                        const dateValue = entry.changedAt || entry.createdAt || new Date();
                        const date = new Date(dateValue);
                        
                        // Check if date is valid
                        if (isNaN(date.getTime())) {
                          console.error("Invalid date for history entry:", entry);
                        }
                        
                        const formattedDate = date.toLocaleDateString('en-GB', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        });
                        const formattedTime = date.toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true
                        });
                        let detailsText = entry.details || "updated";
                        // Format details to match expected format: "updated by - [Entity]" or "created by - [Entity]"
                        if (entry.changedBy) {
                          if (entry.changeType === "CREATE") {
                            detailsText = `created by - ${entry.changedBy}`;
                          } else {
                            detailsText = entry.details && entry.details !== "updated" 
                              ? `${entry.details} - ${entry.changedBy}`
                              : `updated by - ${entry.changedBy}`;
                          }
                        }
                        
                        return (
                          <tr key={idx} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formattedDate} {formattedTime}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                              {detailsText}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab !== "Overview" && activeTab !== "Stocks" && activeTab !== "History" && (
            <div className="py-12 text-center text-sm text-[#64748b]">
              {activeTab} content coming soon...
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-[#d7dcf5] bg-white shadow-xl">
            <div className="px-6 py-4 border-b border-[#e7ebf8]">
              <h2 className="text-lg font-semibold text-[#1f2937]">Delete Item</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-[#64748b]">
                Are you sure you want to delete "{item?.name}"? This action cannot be undone.
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
                Are you sure you want to mark "{item?.name}" as inactive? This will remove the item from the group.
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

      {/* Move to Another Group Modal */}
      {showMoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-[#d7dcf5] bg-white shadow-xl">
            <div className="px-6 py-4 border-b border-[#e7ebf8]">
              <h2 className="text-lg font-semibold text-[#1f2937]">Move to Another Group</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-[#64748b] mb-4">
                Select a target group to move "{item?.name}" to:
              </p>
              {loadingGroups ? (
                <div className="text-center py-4 text-sm text-[#64748b]">Loading groups...</div>
              ) : allItemGroups.length === 0 ? (
                <div className="text-center py-4 text-sm text-[#64748b]">
                  No other item groups available.
                </div>
              ) : (
                <select
                  value={selectedTargetGroupId}
                  onChange={(e) => setSelectedTargetGroupId(e.target.value)}
                  className="w-full rounded-lg border border-[#d7dcf5] bg-white px-4 py-2.5 text-sm text-[#1f2937] focus:border-[#cbd5f5] focus:outline-none focus:ring-2 focus:ring-[#e7ebf8]"
                >
                  <option value="">Select a group...</option>
                  {allItemGroups.map((group) => (
                    <option key={group._id || group.id} value={group._id || group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
              )}
            </div>
            <div className="px-6 py-4 border-t border-[#e7ebf8] flex items-center justify-end gap-3">
              <button
                onClick={() => {
                  setShowMoveModal(false);
                  setSelectedTargetGroupId("");
                }}
                disabled={loading}
                className="no-blue-button rounded-md border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] transition hover:bg-[#f1f5f9] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleMoveToGroup}
                disabled={loading || !selectedTargetGroupId || loadingGroups || allItemGroups.length === 0}
                className="no-blue-button rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Moving..." : "Move"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove from Item Group Modal */}
      {showRemoveModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-[#d7dcf5] bg-white shadow-xl">
            <div className="px-6 py-4 border-b border-[#e7ebf8]">
              <h2 className="text-lg font-semibold text-[#1f2937]">Remove from Item Group</h2>
            </div>
            <div className="px-6 py-4">
              <p className="text-sm text-[#64748b]">
                Are you sure you want to remove "{item?.name}" from this item group? This action cannot be undone.
              </p>
            </div>
            <div className="px-6 py-4 border-t border-[#e7ebf8] flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRemoveModal(false)}
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
                {loading ? "Removing..." : "Remove"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ShoeSalesItemDetailFromGroup;

