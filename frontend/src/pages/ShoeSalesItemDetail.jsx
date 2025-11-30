import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  MoreHorizontal,
  ClipboardList,
  ShoppingCart,
  PackageSearch,
  Activity,
  Calendar,
  Warehouse,
  Settings,
  ChevronDown,
  Plus,
  Star,
  Info,
  Copy,
  X,
} from "lucide-react";
import baseUrl from "../api/api";

const API_ROOT = (baseUrl?.baseUrl || "").replace(/\/$/, "");

const unitOptions = [
  "box",
  "cm",
  "dz",
  "ft",
  "g",
  "in",
  "kg",
  "km",
  "lb",
  "mg",
  "ml",
  "m",
  "pcs",
  "PCS",
];

// Warehouse name mapping: actual names from API -> display names for Stocks page
const WAREHOUSE_NAME_MAPPING = {
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
  const [searchParams, setSearchParams] = useSearchParams();

  const [item, setItem] = useState(null);
  const [itemsList, setItemsList] = useState([]);
  const [loadingItem, setLoadingItem] = useState(true);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState(null);
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
  const [showAddToGroupModal, setShowAddToGroupModal] = useState(false);
  const [showReturnableModal, setShowReturnableModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [allItemGroups, setAllItemGroups] = useState([]);
  const [selectedTargetGroupId, setSelectedTargetGroupId] = useState("");
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [groupOption, setGroupOption] = useState("create"); // "create" or "existing"
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupUnit, setNewGroupUnit] = useState("");
  const [createAttributes, setCreateAttributes] = useState(true);
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

  // Lock body scroll when any modal is open
  useEffect(() => {
    const isModalOpen = showDeleteModal || showInactiveModal || showAddToGroupModal || showReturnableModal;
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [showDeleteModal, showInactiveModal, showAddToGroupModal, showReturnableModal]);

  // Fetch all item groups for "Add to group" functionality
  const fetchAllItemGroups = useCallback(async () => {
    try {
      setLoadingGroups(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";
      const response = await fetch(`${API_URL}/api/shoe-sales/item-groups`);
      
      if (!response.ok) {
        throw new Error("Failed to fetch item groups");
      }
      
      const data = await response.json();
      // Filter to only active groups
      const activeGroups = data.filter(group => group.isActive !== false);
      setAllItemGroups(activeGroups);
    } catch (error) {
      console.error("Error fetching item groups:", error);
      setAllItemGroups([]);
    } finally {
      setLoadingGroups(false);
    }
  }, []);

  // Handler functions for More menu options
  const handleCloneItem = async () => {
    try {
      setLoading(true);
      setShowMoreMenu(false);
      
      if (!item) {
        alert("Item data not available.");
        return;
      }

      // Create a copy of the item with a new name
      const clonedItem = {
        ...item,
        itemName: `${item.itemName} (Copy)`,
        sku: item.sku ? `${item.sku}-COPY` : "",
        _id: undefined, // Remove _id so it creates a new item
      };

      const currentUser = JSON.parse(localStorage.getItem("rootfinuser")) || {};
      const changedBy = currentUser.username || currentUser.locName || "System";

      const response = await fetch(`${API_ROOT}/api/shoe-sales/items`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...clonedItem,
          changedBy: changedBy,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to clone item");
      }

      const newItem = await response.json();
      alert("Item cloned successfully!");
      navigate(`/shoe-sales/items/${newItem._id || newItem.id}`);
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
      
      if (!item) {
        alert("Item data not available.");
        return;
      }

      const currentUser = JSON.parse(localStorage.getItem("rootfinuser")) || {};
      const changedBy = currentUser.username || currentUser.locName || "System";

      // Update item with isActive: false
      const updatePayload = {
        ...item,
        isActive: false,
        changedBy: changedBy,
        // This will trigger history logging in the backend
      };

      const response = await fetch(`${API_ROOT}/api/shoe-sales/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error("Failed to mark item as inactive");
      }

      setShowInactiveModal(false);
      alert("Item has been marked as inactive.");
      navigate("/shoe-sales/items");
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
      
      if (!item) {
        alert("Item data not available.");
        return;
      }

      const response = await fetch(`${API_ROOT}/api/shoe-sales/items/${itemId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        throw new Error("Failed to delete item");
      }

      setShowDeleteModal(false);
      alert("Item deleted successfully.");
      navigate("/shoe-sales/items");
    } catch (error) {
      console.error("Error deleting item:", error);
      alert("Failed to delete item. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddToGroup = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:7000";
      
      if (!item) {
        alert("Item data not available.");
        return;
      }

      // Convert standalone item to group item format
      const itemToAdd = {
        name: item.itemName,
        sku: item.sku || "",
        costPrice: item.costPrice || 0,
        sellingPrice: item.sellingPrice || 0,
        upc: item.upc || "",
        hsnCode: item.hsnCode || "",
        isbn: item.isbn || "",
        reorderPoint: item.reorderPoint || "",
        stock: 0,
        warehouseStocks: item.warehouseStocks || [],
        attributeCombination: [],
      };

      const currentUser = JSON.parse(localStorage.getItem("rootfinuser")) || {};
      const changedBy = currentUser.username || currentUser.locName || "System";

      if (groupOption === "create") {
        // Create a new item group
        if (!newGroupName.trim()) {
          alert("Item Group Name is required.");
          return;
        }
        if (!newGroupUnit.trim()) {
          alert("Unit is required.");
          return;
        }

        const newGroupPayload = {
          name: newGroupName.trim(),
          itemType: "goods",
          unit: newGroupUnit.trim(),
          createAttributes: createAttributes,
          attributeRows: createAttributes ? [{ id: 1, attribute: "", options: [], optionInput: "" }] : [],
          sellable: true,
          purchasable: true,
          trackInventory: false,
          items: [itemToAdd],
          stock: 0,
          reorder: "",
          isActive: true,
          changedBy: changedBy,
        };

        const createResponse = await fetch(`${API_URL}/api/shoe-sales/item-groups`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newGroupPayload),
        });

        if (!createResponse.ok) {
          throw new Error("Failed to create item group");
        }

        const newGroup = await createResponse.json();
        const newGroupId = newGroup._id || newGroup.id;

        // Log history before deleting standalone item - item moved to new group
        try {
          const historyLogResponse = await fetch(`${API_ROOT}/api/shoe-sales/items/${itemId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              movedToGroupId: newGroupId,
              targetGroupName: newGroupName.trim(),
              changedBy: changedBy,
            }),
          });
          // History is logged in the backend, we can ignore response
        } catch (historyError) {
          console.error("Error logging history before move:", historyError);
        }

        // Delete the standalone item
        const deleteResponse = await fetch(`${API_ROOT}/api/shoe-sales/items/${itemId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });

        if (!deleteResponse.ok) {
          console.warn("Item added to group but failed to delete standalone item");
        }

        setShowAddToGroupModal(false);
        setNewGroupName("");
        setNewGroupUnit("");
        setCreateAttributes(true);
        setGroupOption("create");
        alert(`Item "${item.itemName}" has been added to the new group successfully!`);
        navigate(`/shoe-sales/item-groups/${newGroupId}`);
      } else {
        // Add to existing group
        if (!selectedTargetGroupId) {
          alert("Please select a group.");
          return;
        }

        // Fetch the target group
        const groupResponse = await fetch(`${API_URL}/api/shoe-sales/item-groups/${selectedTargetGroupId}`);
        if (!groupResponse.ok) {
          throw new Error("Failed to fetch target group");
        }
        const targetGroup = await groupResponse.json();

        // Add item to target group
        const updatedTargetGroupItems = [...(targetGroup.items || []), itemToAdd];

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

        // Update target group
        const updateResponse = await fetch(`${API_URL}/api/shoe-sales/item-groups/${selectedTargetGroupId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(targetGroupPayload),
        });

        if (!updateResponse.ok) {
          throw new Error("Failed to add item to group");
        }

        // Log history before deleting standalone item - item moved to existing group
        const targetGroupName = targetGroup.name || "Unknown Group";
        try {
          const historyLogResponse = await fetch(`${API_ROOT}/api/shoe-sales/items/${itemId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              movedToGroupId: selectedTargetGroupId,
              targetGroupName: targetGroupName,
              changedBy: changedBy,
            }),
          });
          // History is logged in the backend, we can ignore response
        } catch (historyError) {
          console.error("Error logging history before move:", historyError);
        }

        // Delete the standalone item
        const deleteResponse = await fetch(`${API_ROOT}/api/shoe-sales/items/${itemId}`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        });

        if (!deleteResponse.ok) {
          console.warn("Item added to group but failed to delete standalone item");
        }

        setShowAddToGroupModal(false);
        setSelectedTargetGroupId("");
        setGroupOption("create");
        alert(`Item "${item.itemName}" has been added to the group successfully!`);
        navigate(`/shoe-sales/item-groups/${selectedTargetGroupId}`);
      }
    } catch (error) {
      console.error("Error adding item to group:", error);
      alert("Failed to add item to group. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsReturnable = async () => {
    try {
      setLoading(true);
      
      if (!item) {
        alert("Item data not available.");
        return;
      }

      const currentUser = JSON.parse(localStorage.getItem("rootfinuser")) || {};
      const changedBy = currentUser.username || currentUser.locName || "System";

      // Toggle returnable status
      const updatePayload = {
        ...item,
        returnable: !item.returnable,
        changedBy: changedBy,
      };

      const response = await fetch(`${API_ROOT}/api/shoe-sales/items/${itemId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });

      if (!response.ok) {
        throw new Error("Failed to update returnable status");
      }

      setShowReturnableModal(false);
      const updatedItem = await response.json();
      setItem(updatedItem);
      alert(`Item has been marked as ${updatedItem.returnable ? "returnable" : "non-returnable"}.`);
    } catch (error) {
      console.error("Error updating returnable status:", error);
      alert("Failed to update returnable status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

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
          // If item is from a group, redirect to the group item detail page
          if (data.isFromGroup && data.itemGroupId) {
            navigate(`/shoe-sales/item-groups/${data.itemGroupId}/items/${itemId}`, { replace: true });
            return;
          }
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
  }, [itemId, navigate]);

  // Listen for stock update events (when purchase receive is saved)
  useEffect(() => {
    const handleStockUpdate = (event) => {
      // Refresh item data if this item's stock was updated
      const updatedItems = event.detail?.items || [];
      const currentItemId = item?._id || item?.id;
      
      // Convert both IDs to strings for comparison
      const currentItemIdStr = currentItemId?.toString();
      
      // Check if any updated item matches this item
      const itemMatches = updatedItems.some(i => {
        const updatedItemId = (i.itemId?._id || i.itemId)?.toString();
        return updatedItemId === currentItemIdStr;
      });
      
      // Also refresh if event detail has itemIds array
      const eventItemIds = event.detail?.itemIds || [];
      const idMatches = eventItemIds.some(id => id?.toString() === currentItemIdStr);
      
      if (currentItemId && (itemMatches || idMatches)) {
        console.log("Stock updated for this item, refreshing...", {
          currentItemId: currentItemIdStr,
          updatedItems: updatedItems,
          eventItemIds: eventItemIds
        });
        // Refresh item data
        fetch(`${API_ROOT}/api/shoe-sales/items/${itemId}`)
          .then(res => res.json())
          .then(data => {
            setItem(data);
            console.log("Item data refreshed after stock update", data.warehouseStocks);
          })
          .catch(err => console.error("Error refreshing item:", err));
      }
    };

    window.addEventListener("stockUpdated", handleStockUpdate);
    return () => {
      window.removeEventListener("stockUpdated", handleStockUpdate);
    };
  }, [itemId, item]);

  useEffect(() => {
    let ignore = false;

    const fetchList = async () => {
      setLoadingList(true);
      try {
        // Fetch limited items for sidebar (first 50 items)
        const response = await fetch(`${API_ROOT}/api/shoe-sales/items?page=1&limit=50`);
        if (!response.ok) {
          throw new Error("Unable to load items.");
        }
        const data = await response.json();
        if (!ignore) {
          // Handle both old format (array) and new format (object with items and pagination)
          const list = Array.isArray(data) ? data : (data.items || []);
          const activeOnly = list.filter((i) => i?.isActive !== false && String(i?.isActive).toLowerCase() !== "false");
          setItemsList(activeOnly);
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

  // Fetch history
  const fetchHistory = useCallback(async () => {
    if (!itemId) {
      console.log("Missing itemId for history fetch:", { itemId });
      return;
    }
    
    try {
      setLoadingHistory(true);
      const url = `${API_ROOT}/api/shoe-sales/items/${itemId}/history`;
      console.log("Fetching history from:", url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to fetch history:", response.status, errorText);
        // If endpoint doesn't exist, just set empty array
        setHistory([]);
        return;
      }
      
      let data = await response.json();
      console.log("History data received:", data);
      
      // Ensure we have an array
      const historyArray = Array.isArray(data) ? data : [];
      
      // Check if we have a CREATE entry, if not and item exists, add one
      const hasCreateEntry = historyArray.some(entry => entry.changeType === "CREATE");
      if (!hasCreateEntry && item && item.createdAt) {
        // Add creation entry from item's createdAt
        const createdAt = new Date(item.createdAt);
        // Try to get createdBy from item, or get current user as fallback, or use "System"
        let createdBy = item.createdBy;
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
          itemId: itemId,
          itemGroupId: null,
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
  }, [itemId, item]);

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

  useEffect(() => {
    fetchAllWarehouses();
  }, [fetchAllWarehouses]);

  useEffect(() => {
    fetchAllItemGroups();
  }, [fetchAllItemGroups]);

  useEffect(() => {
    if (activeTab === "History") {
      fetchHistory();
    }
  }, [activeTab, fetchHistory]);

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
      // Refresh item data
      if (itemId) {
        fetch(`${API_ROOT}/api/shoe-sales/items/${itemId}`)
          .then(res => res.json())
          .then(data => setItem(data))
          .catch(err => console.error("Error refreshing item:", err));
      }
      // Remove the query parameters
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams, itemId]);

  // Calculate stock totals from warehouse stocks
  const stockTotals = useMemo(() => {
    const totals = {
      accounting: {
        stockOnHand: 0,
        committedStock: 0,
        availableForSale: 0
      },
      physical: {
        stockOnHand: 0,
        committedStock: 0,
        availableForSale: 0
      }
    };

    warehouseStocks.forEach(stock => {
      const stockOnHand = parseFloat(stock.stockOnHand || stock.openingStock || 0);
      const committedStock = parseFloat(stock.committedStock || 0);
      const availableForSale = parseFloat(stock.availableForSale || (stockOnHand - committedStock));

      // Accounting stock reflects the maintained warehouse stocks
      totals.accounting.stockOnHand += stockOnHand;
      totals.accounting.committedStock += committedStock;
      totals.accounting.availableForSale += availableForSale;

      // Physical stock reads from dedicated fields when present
      const pOnHand = parseFloat(stock.physicalStockOnHand || stock.physicalOpeningStock || 0);
      const pCommitted = parseFloat(stock.physicalCommittedStock || 0);
      const pAvailable = parseFloat(
        stock.physicalAvailableForSale || (pOnHand - pCommitted) || 0
      );
      totals.physical.stockOnHand += isNaN(pOnHand) ? 0 : pOnHand;
      totals.physical.committedStock += isNaN(pCommitted) ? 0 : pCommitted;
      totals.physical.availableForSale += isNaN(pAvailable) ? 0 : pAvailable;
    });

    return totals;
  }, [warehouseStocks]);

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
              <Link
                to={`/shoe-sales/items/${itemId}/edit`}
                className="inline-flex h-9 items-center gap-2 rounded-md bg-[#2563eb] px-4 text-sm font-medium text-white transition hover:bg-[#1d4ed8] active:bg-[#1e40af]"
              >
                Edit
              </Link>
              <button className="inline-flex h-9 items-center gap-2 rounded-md bg-[#2563eb] px-4 text-sm font-medium text-white transition hover:bg-[#1d4ed8] active:bg-[#1e40af]">
                Adjust Stock
              </button>
              <div className="relative" ref={moreMenuRef}>
                <button 
                  onClick={() => setShowMoreMenu(!showMoreMenu)}
                  className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-4 text-sm font-medium text-white shadow-sm transition-all duration-200 hover:bg-[#1d4ed8] active:bg-[#1e40af] ${
                    showMoreMenu ? "ring-2 ring-offset-2 ring-[#93c5fd]" : ""
                  }`}
                >
                  <span>More</span>
                  
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
                        setShowAddToGroupModal(true);
                        setShowMoreMenu(false);
                      }}
                      className="no-blue-button w-full px-4 py-2.5 text-left text-sm font-medium text-[#475569] bg-white hover:bg-[#f8fafc] active:bg-[#f1f5f9] transition-colors duration-150"
                    >
                      Add to group
                    </button>
                    <div className="h-px bg-[#e7ebf8]"></div>
                    <button
                      onClick={() => {
                        setShowReturnableModal(true);
                        setShowMoreMenu(false);
                      }}
                      className="no-blue-button w-full px-4 py-2.5 text-left text-sm font-medium text-[#475569] bg-white hover:bg-[#f8fafc] active:bg-[#f1f5f9] transition-colors duration-150"
                    >
                      Mark as Returnable
              </button>
                  </div>
                )}
              </div>
            </div>
          </header>

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
                <>
                  <section className="grid gap-6 lg:grid-cols-[2fr,1fr] mb-6">
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
                          {/* Opening Stock */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-[#475569]">Opening Stock</span>
                              <Info size={14} className="text-[#94a3b8]" />
                  </div>
                            <span className="text-sm font-semibold text-[#1f2937]">
                              {stockTotals.accounting.stockOnHand.toFixed(2)}
                            </span>
                </div>

                          {/* Accounting Stock Section */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-[#1f2937]">Accounting Stock</h3>
                              <Info size={14} className="text-[#94a3b8]" />
                </div>
                            <div className="space-y-1.5 pl-0">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-[#475569]">Stock on Hand :</span>
                                <span className="font-semibold text-[#1f2937]">
                                  {stockTotals.accounting.stockOnHand.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-[#475569]">Committed Stock :</span>
                                <span className="font-semibold text-[#1f2937]">
                                  {stockTotals.accounting.committedStock.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-[#475569]">Available for Sale :</span>
                                <span className="font-semibold text-[#1f2937]">
                                  {stockTotals.accounting.availableForSale.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Physical Stock Section */}
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <h3 className="text-sm font-semibold text-[#1f2937]">Physical Stock</h3>
                              <Info size={14} className="text-[#94a3b8]" />
                            </div>
                            <div className="space-y-1.5 pl-0">
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-[#475569]">Stock on Hand :</span>
                                <span className="font-semibold text-[#1f2937]">
                                  {stockTotals.physical.stockOnHand.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-[#475569]">Committed Stock :</span>
                                <span className="font-semibold text-[#1f2937]">
                                  {stockTotals.physical.committedStock.toFixed(2)}
                                </span>
                              </div>
                              <div className="flex items-center justify-between text-sm">
                                <span className="text-[#475569]">Available for Sale :</span>
                                <span className="font-semibold text-[#1f2937]">
                                  {stockTotals.physical.availableForSale.toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Quantities to be Processed */}
                          <div className="space-y-2 pt-2">
                            <h3 className="text-sm font-semibold text-[#1f2937]">Quantities to be Processed</h3>
                            <div className="grid grid-cols-2 gap-2">
                              <div className="rounded-lg border border-[#e4e6f2] bg-[#f8f9ff] p-3 text-center">
                                <div className="text-sm font-semibold text-[#1f2937]">0</div>
                                <div className="text-xs text-[#64748b] mt-1">Qty To be shipped</div>
                              </div>
                              <div className="rounded-lg border border-[#e4e6f2] bg-[#f8f9ff] p-3 text-center">
                                <div className="text-sm font-semibold text-[#1f2937]">0</div>
                                <div className="text-xs text-[#64748b] mt-1">Qty To be Received</div>
                              </div>
                              <div className="rounded-lg border border-[#e4e6f2] bg-[#f8f9ff] p-3 text-center">
                                <div className="text-sm font-semibold text-[#1f2937]">0</div>
                                <div className="text-xs text-[#64748b] mt-1">Qty To be invoiced</div>
                              </div>
                              <div className="rounded-lg border border-[#e4e6f2] bg-[#f8f9ff] p-3 text-center">
                                <div className="text-sm font-semibold text-[#1f2937]">0</div>
                                <div className="text-xs text-[#64748b] mt-1">Qty To be billed</div>
                              </div>
                            </div>
                          </div>

                          {/* Reorder Point */}
                          <div className="space-y-2 pt-2">
                            <div className="flex items-center justify-between">
                              <h3 className="text-sm font-semibold text-[#1f2937]">Reorder Point</h3>
                              <button className="text-xs font-medium text-[#3762f9] hover:text-[#2748c9]">
                                + Add
                              </button>
                            </div>
                          </div>
                </div>
              </DetailCard>
            </div>
          </section>
                </>
              )}

              {activeTab === "Stocks" && (
                <div className="space-y-6">
                  {/* Stock Location Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#e4e6f2]">
                    <button
                      onClick={() => {
                        navigate(`/shoe-sales/items/${itemId}/stocks?type=${stockType}`);
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

                  {/* Warehouses Table */}
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
                          {warehouseStocks
                            .filter((stock) => {
                              if (stockType === "accounting") {
                                const onHand = parseFloat(stock.stockOnHand || stock.openingStock || 0);
                                const committed = parseFloat(stock.committedStock || 0);
                                const available = parseFloat(stock.availableForSale || (onHand - committed));
                                return (onHand || committed || available);
                              } else {
                                const pOnHand = parseFloat(stock.physicalStockOnHand || stock.physicalOpeningStock || 0);
                                const pCommitted = parseFloat(stock.physicalCommittedStock || 0);
                                const pAvailable = parseFloat(stock.physicalAvailableForSale || (pOnHand - pCommitted) || 0);
                                return (pOnHand || pCommitted || pAvailable);
                              }
                            })
                            .map((stock, idx) => {
                            // For accounting stock, show actual values from item warehouses
                            // For physical stock, keep values independent (default to 0 for now)
                            const accountingStockOnHand = parseFloat(stock.stockOnHand || stock.openingStock || 0);
                            const accountingCommitted = parseFloat(stock.committedStock || 0);
                            const accountingAvailable = parseFloat(
                              stock.availableForSale || (accountingStockOnHand - accountingCommitted)
                            );

                            const physicalOnHand = parseFloat(stock.physicalStockOnHand || stock.physicalOpeningStock || 0);
                            const physicalCommitted = parseFloat(stock.physicalCommittedStock || 0);
                            const physicalAvailable = parseFloat(
                              stock.physicalAvailableForSale || (physicalOnHand - physicalCommitted) || 0
                            );

                            const stockOnHandValue = stockType === "accounting" ? accountingStockOnHand : (isNaN(physicalOnHand) ? 0 : physicalOnHand);
                            const committedStockValue = stockType === "accounting" ? accountingCommitted : (isNaN(physicalCommitted) ? 0 : physicalCommitted);
                            const availableForSaleValue = stockType === "accounting" ? accountingAvailable : (isNaN(physicalAvailable) ? 0 : physicalAvailable);
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
                        onClick={() => navigate(`/shoe-sales/items/${itemId}/stocks`)}
                        className="no-blue-button inline-flex items-center gap-2 rounded-lg border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] shadow-sm transition-all duration-200 hover:bg-[#f8fafc] hover:border-[#cbd5f5] hover:shadow-md"
                      >
                        <Plus size={16} className="text-[#64748b]" />
                        <span>Add Stock Locations</span>
                      </button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "Transactions" && (
                <div className="py-12 text-center text-sm text-[#64748b]">
                  Transactions content coming soon...
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
            </div>
          </div>
        </main>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-2xl border border-[#e4e6f2] bg-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.18)] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1f2937]">Delete Item</h2>
              <button
                onClick={() => setShowDeleteModal(false)}
                className="text-[#64748b] hover:text-[#1f2937]"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-[#475569] mb-6">
              Are you sure you want to delete "{item?.itemName}"? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="no-blue-button px-4 py-2 text-sm font-medium text-[#475569] bg-white border border-[#d7dcf5] rounded-lg hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Inactive Confirmation Modal */}
      {showInactiveModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-2xl border border-[#e4e6f2] bg-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.18)] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1f2937]">Mark as Inactive</h2>
              <button
                onClick={() => setShowInactiveModal(false)}
                className="text-[#64748b] hover:text-[#1f2937]"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-[#475569] mb-6">
              Are you sure you want to mark "{item?.itemName}" as inactive? This item will no longer be available for selection.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowInactiveModal(false)}
                className="no-blue-button px-4 py-2 text-sm font-medium text-[#475569] bg-white border border-[#d7dcf5] rounded-lg hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsInactive}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Updating..." : "Mark as Inactive"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to Group Modal */}
      {showAddToGroupModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-2xl border border-[#e4e6f2] bg-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.18)] p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#1f2937]">Grouping of Items</h2>
              <button
                onClick={() => {
                  setShowAddToGroupModal(false);
                  setSelectedTargetGroupId("");
                  setNewGroupName("");
                  setNewGroupUnit("");
                  setCreateAttributes(true);
                  setGroupOption("create");
                }}
                className="inline-flex h-8 w-8 items-center justify-center rounded-md bg-blue-600 text-white hover:bg-blue-700 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Would you like to section */}
            <div className="mb-6">
              <p className="text-sm font-medium text-[#475569] mb-3">Would you like to</p>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="groupOption"
                    value="create"
                    checked={groupOption === "create"}
                    onChange={(e) => setGroupOption(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-[#1f2937]">Create a new Item Group</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="groupOption"
                    value="existing"
                    checked={groupOption === "existing"}
                    onChange={(e) => setGroupOption(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-[#1f2937]">Add them to an existing Item Group</span>
                </label>
              </div>
            </div>

            {/* Create new group fields */}
            {groupOption === "create" && (
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-2">
                    Item Group Name<span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    placeholder="Enter item group name"
                    className="w-full px-4 py-2 border border-[#d7dcf5] rounded-lg text-sm text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#475569] mb-2">
                    <span>Unit</span>
                    <span className="text-red-500">*</span>
                    <Info size={14} className="inline ml-1 text-[#94a3b8]" />
                  </label>
                  <select
                    value={newGroupUnit}
                    onChange={(e) => setNewGroupUnit(e.target.value)}
                    className="w-full px-4 py-2 border border-[#d7dcf5] rounded-lg text-sm text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    disabled={loading}
                  >
                    <option value="">Select or type to add</option>
                    {unitOptions.map((unit) => (
                      <option key={unit} value={unit}>
                        {unit}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createAttributes}
                      onChange={(e) => setCreateAttributes(e.target.checked)}
                      className="h-4 w-4 text-blue-600 rounded border-[#d7dcf5] focus:ring-blue-500"
                      disabled={loading}
                    />
                    <span className="text-sm text-[#1f2937]">
                      Create Attributes and Options<span className="text-red-500">*</span>
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Add to existing group field */}
            {groupOption === "existing" && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#475569] mb-2">
                  Select Group
                </label>
                <select
                  value={selectedTargetGroupId}
                  onChange={(e) => setSelectedTargetGroupId(e.target.value)}
                  className="w-full px-4 py-2 border border-[#d7dcf5] rounded-lg text-sm text-[#1f2937] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={loadingGroups || loading}
                >
                  <option value="">-- Select a group --</option>
                  {allItemGroups.map((group) => (
                    <option key={group._id || group.id} value={group._id || group.id}>
                      {group.name}
                    </option>
                  ))}
                </select>
                {loadingGroups && (
                  <p className="text-xs text-[#64748b] mt-2">Loading groups...</p>
                )}
              </div>
            )}

            {/* Items to be grouped section */}
            <div className="mb-6 border-t border-[#e4e6f2] pt-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-blue-600">ITEMS TO BE GROUPED</h3>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-semibold text-blue-600">SKU</span>
                  <Info size={14} className="text-[#94a3b8]" />
                </div>
              </div>
              {item && (
                <div className="bg-[#f8f9ff] rounded-lg p-3 border border-[#e4e6f2]">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1f2937]">{item.itemName}</span>
                    <span className="text-sm text-[#64748b]">{item.sku || "—"}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#e4e6f2]">
              <button
                onClick={() => {
                  setShowAddToGroupModal(false);
                  setSelectedTargetGroupId("");
                  setNewGroupName("");
                  setNewGroupUnit("");
                  setCreateAttributes(true);
                  setGroupOption("create");
                }}
                className="no-blue-button px-5 py-2 text-sm font-medium text-[#475569] bg-white border border-[#d7dcf5] rounded-lg hover:bg-[#f8fafc] transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleAddToGroup}
                className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  loading ||
                  loadingGroups ||
                  (groupOption === "create" && (!newGroupName.trim() || !newGroupUnit.trim())) ||
                  (groupOption === "existing" && !selectedTargetGroupId)
                }
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mark as Returnable Modal */}
      {showReturnableModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-2xl border border-[#e4e6f2] bg-white shadow-[0_18px_50px_-24px_rgba(15,23,42,0.18)] p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#1f2937]">Mark as Returnable</h2>
              <button
                onClick={() => setShowReturnableModal(false)}
                className="text-[#64748b] hover:text-[#1f2937]"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-sm text-[#475569] mb-6">
              {item?.returnable 
                ? `Are you sure you want to mark "${item?.itemName}" as non-returnable?`
                : `Are you sure you want to mark "${item?.itemName}" as returnable?`
              }
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReturnableModal(false)}
                className="no-blue-button px-4 py-2 text-sm font-medium text-[#475569] bg-white border border-[#d7dcf5] rounded-lg hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
              <button
                onClick={handleMarkAsReturnable}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                disabled={loading}
              >
                {loading ? "Updating..." : item?.returnable ? "Mark as Non-Returnable" : "Mark as Returnable"}
              </button>
            </div>
          </div>
        </div>
      )}
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

