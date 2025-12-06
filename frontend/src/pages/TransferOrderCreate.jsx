import { useState, useEffect, useRef, useMemo } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Search, X, Plus, Trash2 } from "lucide-react";
import Head from "../components/Head";
import baseUrl from "../api/api";
import { mapLocNameToWarehouse as mapWarehouse } from "../utils/warehouseMapping";

const Label = ({ children, required = false }) => (
  <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${required ? "text-[#ef4444]" : "text-[#64748b]"}`}>
    {children}
    {required && <span className="ml-0.5">*</span>}
  </span>
);

const Input = ({ placeholder = "", className = "", ...props }) => {
  const baseClasses = "w-full rounded-md border border-[#d7dcf5] bg-white text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors";
  const tableInputClasses = "h-[36px] px-[10px] py-[6px]";
  const defaultClasses = "px-3 py-2.5";
  
  const isTableInput = className.includes("table-input");
  const finalClasses = `${baseClasses} ${isTableInput ? tableInputClasses : defaultClasses} ${className}`;
  
  return (
    <input
      {...props}
      className={finalClasses}
      placeholder={placeholder}
    />
  );
};

// Warehouse Dropdown Component
const WarehouseDropdown = ({ value, onChange, options, placeholder = "Select warehouse...", required = false }) => {
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, width: 0 });

  const updatePos = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 4,
      left: rect.left,
      width: rect.width,
    });
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!isOpen) updatePos();
    setIsOpen((p) => !p);
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePos();
      setTimeout(updatePos, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const follow = () => updatePos();
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }, [isOpen]);

  const filteredOptions = options.filter((opt) =>
    opt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedLabel = value || placeholder;

  const dropdownPortal = isOpen ? (
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 999999,
      }}
    >
      <div className="rounded-lg shadow-lg bg-white border border-[#d7dcf5] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#e2e8f0] px-2 py-1.5 bg-[#fafbff]">
          <Search size={12} className="text-[#94a3b8]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search..."
            className="h-7 w-full border-none bg-transparent text-xs text-[#1f2937] outline-none placeholder:text-[#94a3b8]"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
        <div className="py-1 max-h-[200px] overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d3d3d3 #f5f5f5' }}>
          {filteredOptions.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[#64748b] text-center">No options found</div>
          ) : (
            filteredOptions.map((option) => {
              const isSelected = option === value;
              return (
                <div
                  key={option}
                  onClick={() => {
                    onChange({ target: { value: option } });
                    setIsOpen(false);
                    setSearchTerm("");
                  }}
                  className={`px-3 py-1.5 text-sm cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#2563eb] text-white"
                      : "text-[#1f2937] hover:bg-[#f1f5f9]"
                  }`}
                >
                  {option}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="relative w-full">
        <input
          ref={buttonRef}
          onClick={toggleDropdown}
          type="text"
          readOnly
          value={selectedLabel}
          placeholder={placeholder}
          required={required}
          className="w-full h-10 rounded-md border border-[#d7dcf5] bg-white text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors cursor-pointer px-3 py-2.5 pr-8 appearance-none bg-[url('data:image/svg+xml;charset=UTF-8,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23666%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22%3E%3Cpolyline points=%226 9 12 15 18 9%22%3E%3C/polyline%3E%3C/svg%3E')] bg-[length:16px_16px] bg-[right_0.5rem_center] bg-no-repeat"
        />
      </div>
      {typeof document !== "undefined" && document.body && createPortal(dropdownPortal, document.body)}
    </>
  );
};

// ItemDropdown Component (reused from InventoryAdjustmentCreate)
const ItemDropdown = ({ rowId, value, onChange, sourceWarehouse, destinationWarehouse, onSourceStockFetched, onDestStockFetched }) => {
  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([]);
  const [itemGroups, setItemGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Get user info inside ItemDropdown component using useMemo for stable values
  const { isAdmin, userWarehouse, userLocCode, user } = useMemo(() => {
    const userStr = localStorage.getItem("rootfinuser");
    const userData = userStr ? JSON.parse(userStr) : null;
    const adminStatus = userData?.power === "admin";
    const locCode = userData?.locCode || "";
    
    // Fallback locations mapping
    const fallbackLocations = [
      { "locName": "Z-Edapally1", "locCode": "144" },
      { "locName": "Warehouse", "locCode": "858" },
      { "locName": "G-Edappally", "locCode": "702" },
      { "locName": "HEAD OFFICE01", "locCode": "759" },
      { "locName": "SG-Trivandrum", "locCode": "700" },
      { "locName": "Z- Edappal", "locCode": "100" },
      { "locName": "Z.Perinthalmanna", "locCode": "133" },
      { "locName": "Z.Kottakkal", "locCode": "122" },
      { "locName": "G.Kottayam", "locCode": "701" },
      { "locName": "G.Perumbavoor", "locCode": "703" },
      { "locName": "G.Thrissur", "locCode": "704" },
      { "locName": "G.Chavakkad", "locCode": "706" },
      { "locName": "G.Calicut ", "locCode": "712" },
      { "locName": "G.Vadakara", "locCode": "708" },
      { "locName": "G.Edappal", "locCode": "707" },
      { "locName": "G.Perinthalmanna", "locCode": "709" },
      { "locName": "G.Kottakkal", "locCode": "711" },
      { "locName": "G.Manjeri", "locCode": "710" },
      { "locName": "G.Palakkad ", "locCode": "705" },
      { "locName": "G.Kalpetta", "locCode": "717" },
      { "locName": "G.Kannur", "locCode": "716" },
      { "locName": "G.Mg Road", "locCode": "718" },
      { "locName": "Production", "locCode": "101" },
      { "locName": "Office", "locCode": "102" },
      { "locName": "WAREHOUSE", "locCode": "103" }
    ];
    
    // Get user's location name and warehouse
    let userLocName = "";
    if (userData?.locCode) {
      const location = fallbackLocations.find(loc => loc.locCode === userData.locCode || loc.locCode === String(userData.locCode));
      if (location) {
        userLocName = location.locName;
      }
    }
    if (!userLocName) {
      userLocName = userData?.username || userData?.locName || "";
    }
    const warehouse = mapWarehouse(userLocName);
    
    return {
      isAdmin: adminStatus,
      userWarehouse: warehouse,
      userLocCode: locCode,
      user: userData
    };
  }, []);

  // Fetch items and item groups
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        // Build query params - filter by warehouse for non-admin users
        const itemsParams = new URLSearchParams();
        itemsParams.append('page', '1');
        itemsParams.append('limit', '100');
        if (!isAdmin && userWarehouse) {
          itemsParams.append('warehouse', userWarehouse);
          itemsParams.append('isAdmin', 'false');
          itemsParams.append('userPower', user?.power || 'normal');
          if (userLocCode) itemsParams.append('locCode', userLocCode);
        } else {
          itemsParams.append('isAdmin', 'true');
        }
        
        const itemsResponse = await fetch(`${API_URL}/api/shoe-sales/items?${itemsParams}`);
        let itemsList = [];
        if (itemsResponse.ok) {
          const itemsData = await itemsResponse.json();
          itemsList = Array.isArray(itemsData) ? itemsData : (itemsData.items || []);
        }
        
        // Build query params for item groups - filter by warehouse for non-admin users
        const groupsParams = new URLSearchParams();
        groupsParams.append('page', '1');
        groupsParams.append('limit', '100');
        if (!isAdmin && userWarehouse) {
          groupsParams.append('warehouse', userWarehouse);
          groupsParams.append('isAdmin', 'false');
          groupsParams.append('userPower', user?.power || 'normal');
        } else {
          groupsParams.append('isAdmin', 'true');
        }
        
        const groupsResponse = await fetch(`${API_URL}/api/shoe-sales/item-groups?${groupsParams}`);
        let groupsList = [];
        if (groupsResponse.ok) {
          const groupsData = await groupsResponse.json();
          groupsList = Array.isArray(groupsData) ? groupsData : (groupsData.groups || []);
        }
        
        const groupItems = [];
        groupsList.forEach(group => {
          if (group.items && Array.isArray(group.items)) {
            group.items.forEach(item => {
              groupItems.push({
                ...item,
                _id: item._id || `${group._id}-${item.name}`,
                itemName: item.name,
                itemGroupId: group._id,
                groupName: group.name,
                isFromGroup: true,
              });
            });
          }
        });
        
        setItems([...itemsList, ...groupItems]);
        setItemGroups(groupsList);
      } catch (error) {
        console.error("Error fetching items:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [API_URL, isAdmin, userWarehouse, userLocCode, user?.power]);

  useEffect(() => {
    console.log(`🔄 ItemDropdown: value changed:`, value);
    if (value) {
      if (typeof value === 'object' && value !== null) {
        console.log(`   Setting selectedItem to object:`, value);
        setSelectedItem(value);
      } else if (items.length > 0) {
        const item = items.find((i) => i._id === value || i.itemName === value);
        console.log(`   Found item by ID/name:`, item);
        setSelectedItem(item || null);
      } else {
        console.log(`   Items not loaded yet, clearing selectedItem`);
        setSelectedItem(null);
      }
    } else {
      console.log(`   Value is empty, clearing selectedItem`);
      setSelectedItem(null);
    }
  }, [value, items]);

  // Store callbacks in refs to avoid infinite loops
  const onSourceStockFetchedRef = useRef(onSourceStockFetched);
  const onDestStockFetchedRef = useRef(onDestStockFetched);
  useEffect(() => {
    onSourceStockFetchedRef.current = onSourceStockFetched;
    onDestStockFetchedRef.current = onDestStockFetched;
  }, [onSourceStockFetched, onDestStockFetched]);

  // Track previous values to prevent duplicate fetches
  const prevItemRef = useRef(null);
  const prevSourceWarehouseRef = useRef(null);
  const prevDestWarehouseRef = useRef(null);

  // Fetch stock for both warehouses when item or warehouses change
  useEffect(() => {
    const itemKey = selectedItem 
      ? (selectedItem.isFromGroup 
          ? `${selectedItem.itemGroupId}-${selectedItem.itemName}-${selectedItem.sku || ''}`
          : selectedItem._id)
      : null;
    
    if (!selectedItem) {
      console.log(`⚠️ No item selected, skipping stock fetch`);
      prevItemRef.current = itemKey;
      prevSourceWarehouseRef.current = sourceWarehouse;
      prevDestWarehouseRef.current = destinationWarehouse;
      return;
    }
    
    if (!sourceWarehouse || !destinationWarehouse) {
      console.log(`⚠️ Warehouses not selected (source: "${sourceWarehouse}", dest: "${destinationWarehouse}"), skipping stock fetch`);
      prevItemRef.current = itemKey;
      prevSourceWarehouseRef.current = sourceWarehouse;
      prevDestWarehouseRef.current = destinationWarehouse;
      return;
    }
    
    console.log(`🔄 Triggering stock fetch for item "${selectedItem.itemName}" (source: "${sourceWarehouse}", dest: "${destinationWarehouse}")`);
    
    // Skip if nothing changed
    if (itemKey === prevItemRef.current && 
        sourceWarehouse === prevSourceWarehouseRef.current && 
        destinationWarehouse === prevDestWarehouseRef.current) {
      return;
    }
    
    prevItemRef.current = itemKey;
    prevSourceWarehouseRef.current = sourceWarehouse;
    prevDestWarehouseRef.current = destinationWarehouse;
    
    const fetchStock = async (warehouse, callback) => {
      if (!warehouse) {
        console.warn(`⚠️ No warehouse provided for stock fetch`);
        if (callback) callback(0);
        return;
      }
      
      try {
        const params = new URLSearchParams({ warehouse });
        
        if (selectedItem.isFromGroup) {
          params.append('itemGroupId', selectedItem.itemGroupId);
          params.append('itemName', selectedItem.itemName);
          if (selectedItem.sku) params.append('itemSku', selectedItem.sku);
        } else {
          params.append('itemId', selectedItem._id);
        }
        
        const fullUrl = `${API_URL}/api/inventory/transfer-orders/stock/item?${params}`;
        console.log(`\n📡 Fetching stock for "${selectedItem.itemName}" in warehouse "${warehouse}"`);
        console.log(`   URL: ${fullUrl}`);
        console.log(`   Item details:`, {
          isFromGroup: selectedItem.isFromGroup,
          itemId: selectedItem._id,
          itemGroupId: selectedItem.itemGroupId,
          itemName: selectedItem.itemName,
          itemSku: selectedItem.sku
        });
        
        const response = await fetch(fullUrl);
        console.log(`   Response status: ${response.status} ${response.statusText}`);
        
        if (response.ok) {
          const stockData = await response.json();
          console.log(`✅ Stock data received:`, stockData);
          console.log(`   Current Quantity: ${stockData.currentQuantity || 0}`);
          console.log(`   Stock On Hand: ${stockData.stockOnHand || 0}`);
          console.log(`   Success: ${stockData.success}`);
          
          // Try multiple possible field names
          const quantity = stockData.currentQuantity ?? stockData.stockOnHand ?? stockData.quantity ?? 0;
          console.log(`   📊 Extracted quantity: ${quantity} from fields:`, {
            currentQuantity: stockData.currentQuantity,
            stockOnHand: stockData.stockOnHand,
            quantity: stockData.quantity
          });
          
          if (callback) {
            console.log(`   ✅ Callback exists, calling it with quantity: ${quantity}`);
            callback(quantity);
            console.log(`   ✅ Callback called successfully`);
          } else {
            console.error(`   ❌ No callback provided! Callback is:`, callback);
          }
        } else {
          const errorText = await response.text();
          console.error(`❌ Failed to fetch stock (${response.status}):`, errorText);
          try {
            const errorData = JSON.parse(errorText);
            console.error(`   Error details:`, errorData);
          } catch (e) {
            console.error(`   Error is not JSON:`, errorText);
          }
          if (callback) {
            console.log(`   📊 Calling callback with 0 due to error`);
            callback(0);
          }
        }
      } catch (error) {
        console.error("❌ Error fetching stock:", error);
        if (callback) callback(0);
      }
    };
    
    // Fetch stock for both warehouses
    console.log(`🚀 About to fetch stock - callbacks:`, {
      onSourceStockFetched: !!onSourceStockFetchedRef.current,
      onDestStockFetched: !!onDestStockFetchedRef.current
    });
    
    fetchStock(sourceWarehouse, onSourceStockFetchedRef.current);
    fetchStock(destinationWarehouse, onDestStockFetchedRef.current);
  }, [selectedItem, sourceWarehouse, destinationWarehouse, API_URL]);

  const updatePos = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 500),
    });
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!isOpen) updatePos();
    setIsOpen((p) => !p);
  };

  useEffect(() => {
    const handleClick = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (isOpen) {
      updatePos();
      setTimeout(updatePos, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const follow = () => updatePos();
    window.addEventListener("scroll", follow, true);
    window.addEventListener("resize", follow);
    return () => {
      window.removeEventListener("scroll", follow, true);
      window.removeEventListener("resize", follow);
    };
  }, [isOpen]);

  const filteredItems = items.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const itemName = (item.itemName || "").toLowerCase();
    const sku = (item.sku || "").toLowerCase();
    return itemName.includes(searchLower) || sku.includes(searchLower);
  });

  const handleSelectItem = (item) => {
    onChange(item);
    setIsOpen(false);
    setSearchTerm("");
  };

  const getStockOnHand = (item, warehouse) => {
    if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks)) return 0;
    if (!warehouse) return 0;
    
    // Normalize warehouse names for matching
    const normalizedWarehouse = mapWarehouse(warehouse);
    const warehouseLower = (normalizedWarehouse || warehouse).toLowerCase().trim();
    const warehouseBase = warehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
    
    const warehouseStock = item.warehouseStocks.find(ws => {
      if (!ws.warehouse) return false;
      const wsWarehouseRaw = ws.warehouse.toString().trim();
      const normalizedWs = mapWarehouse(wsWarehouseRaw);
      const wsWarehouse = (normalizedWs || wsWarehouseRaw).toLowerCase().trim();
      const wsBase = wsWarehouse.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
      
      // Exact match after normalization
      if (wsWarehouse === warehouseLower) return true;
      
      // Base name match
      if (wsBase && warehouseBase && wsBase === warehouseBase) return true;
      
      // Special handling for Trivandrum variations
      const trivandrumVariations = ["trivandrum", "grooms trivandrum", "sg-trivandrum"];
      const wsIsTrivandrum = trivandrumVariations.some(v => wsWarehouse.includes(v));
      const targetIsTrivandrum = trivandrumVariations.some(v => warehouseLower.includes(v));
      if (wsIsTrivandrum && targetIsTrivandrum) return true;
      
      // Partial match
      if (wsWarehouse.includes(warehouseLower) || warehouseLower.includes(wsWarehouse)) return true;
      
      return false;
    });
    
    return warehouseStock?.stockOnHand || 0;
  };

  const dropdownPortal = isOpen ? (
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: dropdownPos.width,
        zIndex: 999999,
      }}
    >
      <div className="rounded-xl shadow-xl bg-white border border-[#d7dcf5] overflow-hidden" style={{ width: '500px', maxWidth: '90vw' }}>
        <div className="flex items-center gap-2 border-b border-[#e2e8f0] px-3 py-2.5 bg-[#fafbff]">
          <Search size={14} className="text-[#94a3b8]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items..."
            className="h-8 w-full border-none bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#94a3b8]"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
        <div className="py-2 max-h-[400px] overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d3d3d3 #f5f5f5' }}>
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-[#64748b]">Loading items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#64748b]">
              {searchTerm ? "No items found" : "No items available"}
            </div>
          ) : (
            filteredItems.map((item) => {
              const isSelected = selectedItem && (
                (selectedItem._id && selectedItem._id === item._id) ||
                (selectedItem.itemName && selectedItem.itemName === item.itemName)
              );
              // For store users, show stock from their warehouse (or source warehouse if selected)
              // For admin, show stock from source warehouse
              const displayWarehouse = (!isAdmin && userWarehouse) ? userWarehouse : (sourceWarehouse || "");
              const stockOnHand = getStockOnHand(item, displayWarehouse);
              
              return (
                <div
                  key={item._id || item.itemName}
                  onClick={() => handleSelectItem(item)}
                  className={`px-4 py-3 cursor-pointer transition-colors ${
                    isSelected
                      ? "bg-[#2563eb] text-white"
                      : "hover:bg-[#f1f5f9]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${isSelected ? "text-white" : "text-[#1f2937]"}`}>
                        {item.itemName || "Unnamed Item"}
                      </div>
                      <div className={`text-xs mt-1 ${isSelected ? "text-white/80" : "text-[#64748b]"}`}>
                        {item.isFromGroup && `Group: ${item.groupName} • `}
                        SKU: {item.sku || "N/A"}
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <div className={`text-xs ${isSelected ? "text-white/80" : "text-[#64748b]"}`}>
                        Stock on Hand
                      </div>
                      <div className={`text-sm font-medium mt-0.5 ${isSelected ? "text-white" : "text-[#10b981]"}`}>
                        {stockOnHand.toFixed(2)} pcs
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="relative w-full overflow-visible m-0 p-0">
        <input
          ref={buttonRef}
          onClick={toggleDropdown}
          type="text"
          readOnly
          placeholder="Type or click to select an item."
          value={selectedItem ? selectedItem.itemName : ""}
          className="w-full h-[36px] rounded-md border border-[#d7dcf5] bg-white text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors cursor-pointer px-[10px] py-[6px]"
        />
      </div>
      {typeof document !== "undefined" && document.body && createPortal(dropdownPortal, document.body)}
    </>
  );
};

const TransferOrderCreate = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";
  const isEditMode = !!id;
  
  // Get user info
  const userStr = localStorage.getItem("rootfinuser");
  const user = userStr ? JSON.parse(userStr) : null;
  const userId = user?.email || user?._id || user?.id || "";
  const isAdmin = user?.power === "admin";
  const userLocCode = user?.locCode || "";
  
  // Fallback locations mapping
  const fallbackLocations = [
    { "locName": "Z-Edapally1", "locCode": "144" },
    { "locName": "Warehouse", "locCode": "858" },
    { "locName": "G-Edappally", "locCode": "702" },
    { "locName": "HEAD OFFICE01", "locCode": "759" },
    { "locName": "SG-Trivandrum", "locCode": "700" },
    { "locName": "Z- Edappal", "locCode": "100" },
    { "locName": "Z.Perinthalmanna", "locCode": "133" },
    { "locName": "Z.Kottakkal", "locCode": "122" },
    { "locName": "G.Kottayam", "locCode": "701" },
    { "locName": "G.Perumbavoor", "locCode": "703" },
    { "locName": "G.Thrissur", "locCode": "704" },
    { "locName": "G.Chavakkad", "locCode": "706" },
    { "locName": "G.Calicut ", "locCode": "712" },
    { "locName": "G.Vadakara", "locCode": "708" },
    { "locName": "G.Edappal", "locCode": "707" },
    { "locName": "G.Perinthalmanna", "locCode": "709" },
    { "locName": "G.Kottakkal", "locCode": "711" },
    { "locName": "G.Manjeri", "locCode": "710" },
    { "locName": "G.Palakkad ", "locCode": "705" },
    { "locName": "G.Kalpetta", "locCode": "717" },
    { "locName": "G.Kannur", "locCode": "716" },
    { "locName": "G.Mg Road", "locCode": "718" },
    { "locName": "Production", "locCode": "101" },
    { "locName": "Office", "locCode": "102" },
    { "locName": "WAREHOUSE", "locCode": "103" }
  ];
  
  // Get user's location name and warehouse
  let userLocName = "";
  if (user?.locCode) {
    const location = fallbackLocations.find(loc => loc.locCode === user.locCode || loc.locCode === String(user.locCode));
    if (location) {
      userLocName = location.locName;
    }
  }
  if (!userLocName) {
    userLocName = user?.username || user?.locName || "";
  }
  const userWarehouse = mapWarehouse(userLocName);
  
  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [transferOrderNumber, setTransferOrderNumber] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [sourceWarehouse, setSourceWarehouse] = useState("");
  const [destinationWarehouse, setDestinationWarehouse] = useState("");
  const [tableRows, setTableRows] = useState([{ 
    id: 1, 
    item: null, 
    itemId: null, 
    itemGroupId: null, 
    itemName: "", 
    itemSku: "", 
    sourceQuantity: 0, 
    destQuantity: 0, 
    quantity: "" 
  }]);
  
  // Warehouse options (same as branch options)
  const warehouseOptions = [
    "Calicut",
    "Chavakkad Branch",
    "Edapally Branch",
    "Edappal Branch",
    "Grooms Trivandrum",
    "Head Office",
    "Kalpetta Branch",
    "Kannur Branch",
    "Kottakkal Branch",
    "Kottayam Branch",
    "Manjery Branch",
    "Palakkad Branch",
    "Perinthalmanna Branch",
    "Perumbavoor Branch",
    "SuitorGuy MG Road",
    "Thrissur Branch",
    "Warehouse",
  ];
  
  // Set default source warehouse for store users
  useEffect(() => {
    if (!isEditMode && !isAdmin && userWarehouse && !sourceWarehouse) {
      setSourceWarehouse(userWarehouse);
      console.log(`📍 Auto-setting source warehouse to user's warehouse: "${userWarehouse}"`);
    }
  }, [isEditMode, isAdmin, userWarehouse, sourceWarehouse]);
  
  // Load transfer order data if in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const loadTransferOrder = async () => {
        setLoading(true);
        try {
          const response = await fetch(`${API_URL}/api/inventory/transfer-orders/${id}`);
          if (!response.ok) throw new Error("Failed to load transfer order");
          const data = await response.json();
          
          setTransferOrderNumber(data.transferOrderNumber || "");
          setDate(data.date ? new Date(data.date).toISOString().split('T')[0] : date);
          setReason(data.reason || "");
          setSourceWarehouse(data.sourceWarehouse || "");
          setDestinationWarehouse(data.destinationWarehouse || "");
          
          if (data.items && Array.isArray(data.items)) {
            const rows = data.items.map((item, index) => ({
              id: index + 1,
              item: { _id: item.itemId, itemName: item.itemName },
              itemId: item.itemId,
              itemGroupId: item.itemGroupId,
              itemName: item.itemName,
              itemSku: item.itemSku || "",
              sourceQuantity: item.sourceQuantity || 0,
              destQuantity: item.destQuantity || 0,
              quantity: item.quantity?.toString() || "",
            }));
            setTableRows(rows.length > 0 ? rows : [{ id: 1, item: null, itemId: null, itemGroupId: null, itemName: "", itemSku: "", sourceQuantity: 0, destQuantity: 0, quantity: "" }]);
          }
        } catch (error) {
          console.error("Error loading transfer order:", error);
          alert("Failed to load transfer order");
          navigate("/inventory/transfer-orders");
        } finally {
          setLoading(false);
        }
      };
      loadTransferOrder();
    }
  }, [isEditMode, id, API_URL, navigate, date]);
  
  // Handle item selection
  const handleItemSelect = (rowId, item) => {
    console.log(`🎯 handleItemSelect called for row ${rowId} with item:`, item);
    setTableRows(rows => {
      const updated = rows.map(row => {
        if (row.id === rowId) {
          console.log(`   ✅ Updating row ${rowId} with item:`, item);
          return {
            ...row,
            item: item,
            itemId: item.isFromGroup ? null : item._id,
            itemGroupId: item.itemGroupId || null,
            itemName: item.itemName || "",
            itemSku: item.sku || "",
          };
        }
        return row;
      });
      console.log(`   📊 Updated rows after item select:`, updated.map(r => ({ id: r.id, itemName: r.itemName, item: r.item })));
      return updated;
    });
  };
  
  // Handle source stock fetched
  const handleSourceStockFetched = (rowId) => (currentQuantity) => {
    console.log(`📦 Source stock fetched for row ${rowId}: ${currentQuantity}`);
    setTableRows(rows => {
      const updated = rows.map(row => {
        if (row.id === rowId) {
          console.log(`   ✅ Updating row ${rowId} sourceQuantity from ${row.sourceQuantity} to ${currentQuantity}`);
          return {
            ...row,
            sourceQuantity: currentQuantity,
          };
        }
        return row;
      });
      console.log(`   📊 Updated table rows:`, updated.map(r => ({ id: r.id, itemName: r.itemName, sourceQty: r.sourceQuantity, destQty: r.destQuantity })));
      return updated;
    });
  };
  
  // Handle destination stock fetched
  const handleDestStockFetched = (rowId) => (currentQuantity) => {
    console.log(`📦 Destination stock fetched for row ${rowId}: ${currentQuantity}`);
    setTableRows(rows => {
      const updated = rows.map(row => {
        if (row.id === rowId) {
          console.log(`   ✅ Updating row ${rowId} destQuantity from ${row.destQuantity} to ${currentQuantity}`);
          return {
            ...row,
            destQuantity: currentQuantity,
          };
        }
        return row;
      });
      console.log(`   📊 Updated table rows:`, updated.map(r => ({ id: r.id, itemName: r.itemName, sourceQty: r.sourceQuantity, destQty: r.destQuantity })));
      return updated;
    });
  };
  
  // Handle quantity change
  const handleQuantityChange = (rowId, value) => {
    const numValue = parseFloat(value) || 0;
    setTableRows(rows =>
      rows.map(row => {
        if (row.id === rowId) {
          return {
            ...row,
            quantity: value,
          };
        }
        return row;
      })
    );
  };
  
  // Handle add row
  const handleAddRow = () => {
    const newId = Math.max(...tableRows.map(r => r.id), 0) + 1;
    setTableRows([...tableRows, { 
      id: newId, 
      item: null, 
      itemId: null, 
      itemGroupId: null, 
      itemName: "", 
      itemSku: "", 
      sourceQuantity: 0, 
      destQuantity: 0, 
      quantity: "" 
    }]);
  };
  
  // Handle remove row
  const handleRemoveRow = (rowId) => {
    if (tableRows.length > 1) {
      setTableRows(tableRows.filter(row => row.id !== rowId));
    }
  };
  
  // Handle save
  const handleSave = async (status = "draft") => {
    if (!transferOrderNumber || !date || !sourceWarehouse || !destinationWarehouse) {
      alert("Please fill in all required fields");
      return;
    }
    
    if (sourceWarehouse === destinationWarehouse) {
      alert("Source and destination warehouses cannot be the same");
      return;
    }
    
    if (tableRows.length === 0 || !tableRows.some(row => row.itemName && parseFloat(row.quantity) > 0)) {
      alert("Please add at least one item with quantity");
      return;
    }
    
    setSaving(true);
    try {
      const items = tableRows
        .filter(row => row.itemName && parseFloat(row.quantity) > 0)
        .map(row => ({
          itemId: row.itemId,
          itemGroupId: row.itemGroupId,
          itemName: row.itemName,
          itemSku: row.itemSku,
          quantity: parseFloat(row.quantity) || 0,
          sourceQuantity: row.sourceQuantity || 0,
          destQuantity: row.destQuantity || 0,
        }));
      
      const transferData = {
        transferOrderNumber,
        date: date ? new Date(date).toISOString() : new Date().toISOString(),
        reason,
        sourceWarehouse,
        destinationWarehouse,
        items,
        status,
        userId,
      };
      
      const url = isEditMode 
        ? `${API_URL}/api/inventory/transfer-orders/${id}`
        : `${API_URL}/api/inventory/transfer-orders`;
      const method = isEditMode ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transferData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to save transfer order");
      }
      
      const statusLabel = status === "draft" ? "Draft" : status === "in_transit" ? "In Transit" : "Transferred";
      alert(`Transfer order ${isEditMode ? "updated" : "saved"} successfully as ${statusLabel}`);
      navigate("/inventory/transfer-orders");
    } catch (error) {
      console.error("Error saving transfer order:", error);
      alert(error.message || "Failed to save transfer order. Please try again.");
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <div className="p-6 ml-64 bg-[#f5f7fb] min-h-screen flex items-center justify-center">
        <div className="text-[#64748b]">Loading transfer order...</div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-[#f7f9ff]">
      <Head
        title={isEditMode ? "Edit Transfer Order" : "New Transfer Order"}
        description="Register a stock transfer between warehouses."
        actions={
          <Link
            to="/inventory/transfer-orders"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5f5] px-4 text-sm font-medium text-[#1f2937] transition hover:bg-white"
          >
            Back to Transfer Orders
          </Link>
        }
      />

      <div className="ml-64 px-10 pb-16 pt-8">
        <div className="rounded-3xl border border-[#e6ebfa] bg-white">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#edf1ff] px-10 py-6">
            <div className="space-y-1">
              <h1 className="text-[20px] font-semibold text-[#101828]">
                {isEditMode ? "Edit Transfer Order" : "New Transfer Order"}
              </h1>
              <p className="text-sm text-[#6c728a]">
                Populate the required fields to initiate a warehouse transfer.
              </p>
            </div>
          </div>

          <div className="space-y-12 px-10 py-12">
            <section className="grid gap-8 lg:grid-cols-2">
              <div className="space-y-2">
                <Label required>Transfer Order #</Label>
                <div className="flex items-center gap-3 rounded-lg border border-[#d9def1] bg-[#fcfdff] px-4 py-2.5">
                  <input
                    value={transferOrderNumber}
                    onChange={(e) => setTransferOrderNumber(e.target.value)}
                    placeholder="Enter order reference"
                    className="w-full border-0 bg-transparent text-sm text-[#101828] placeholder:text-[#b0b8d9] focus:ring-0"
                  />
                  <button
                    type="button"
                    className="text-xs font-semibold uppercase tracking-[0.18em] text-[#4f46e5]"
                    onClick={() => setTransferOrderNumber(`TO-${Math.floor(Math.random() * 9000 + 1000)}`)}
                  >
                    Auto
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label required>Date</Label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-[#d9def1] bg-[#fcfdff] px-4 py-2.5 text-sm text-[#101828] focus:border-[#94a3b8] focus:outline-none"
                />
              </div>
              <div className="space-y-2 lg:col-span-2">
                <Label>Reason</Label>
                <textarea
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe the transfer reason"
                  className="w-full rounded-lg border border-[#d9def1] bg-[#fcfdff] px-4 py-3 text-sm text-[#101828] focus:border-[#94a3b8] focus:outline-none"
                />
              </div>
            </section>

            <section className="grid gap-8 lg:grid-cols-[1fr_auto_1fr]">
              <div className="space-y-2">
                <Label required>Source Warehouse</Label>
                <WarehouseDropdown
                  value={sourceWarehouse}
                  onChange={(e) => setSourceWarehouse(e.target.value)}
                  options={warehouseOptions}
                  placeholder="Select source warehouse"
                  required
                />
              </div>
              <div className="flex items-end justify-center pb-1">
                <button
                  type="button"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[#d5dcf4] text-[#4b5563] hover:bg-[#eef2ff] transition-colors"
                  onClick={() => {
                    setSourceWarehouse(destinationWarehouse);
                    setDestinationWarehouse(sourceWarehouse);
                  }}
                  title="Swap warehouses"
                >
                  ⇄
                </button>
              </div>
              <div className="space-y-2">
                <Label required>Destination Warehouse</Label>
                <WarehouseDropdown
                  value={destinationWarehouse}
                  onChange={(e) => setDestinationWarehouse(e.target.value)}
                  options={warehouseOptions}
                  placeholder="Select destination warehouse"
                  required
                />
              </div>
            </section>

            <section className="rounded-2xl border border-[#edf1ff] bg-[#fcfdff]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#edf1ff] px-8 py-4">
                <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#8a94b0]">Item Table</span>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed border-collapse text-sm text-[#111827]">
                  <thead className="bg-white text-[11px] uppercase tracking-[0.28em] text-[#9aa2bd]">
                    <tr>
                      <th className="w-12 px-6 py-3 text-left font-semibold">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[#d0d6ee] text-[#4f46e5] focus:ring-[#4338ca]"
                        />
                      </th>
                      <th className="px-6 py-3 text-left font-semibold text-[#6b7280]">Item Details</th>
                      <th className="px-6 py-3 text-left font-semibold text-[#6b7280]">Current Availability</th>
                      <th className="px-6 py-3 text-left font-semibold text-[#6b7280]">Transfer Quantity</th>
                      <th className="w-12 px-6 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableRows.map((row) => (
                      <tr key={row.id} className="border-t border-[#f0f3ff]">
                        <td className="px-6 py-4 align-top">
                          <input
                            type="checkbox"
                            className="h-4 w-4 rounded border-[#d0d6ee] text-[#4f46e5] focus:ring-[#4338ca]"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <ItemDropdown
                            rowId={row.id}
                            value={row.item}
                            onChange={(item) => handleItemSelect(row.id, item)}
                            sourceWarehouse={sourceWarehouse}
                            destinationWarehouse={destinationWarehouse}
                            onSourceStockFetched={handleSourceStockFetched(row.id)}
                            onDestStockFetched={handleDestStockFetched(row.id)}
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="grid gap-3 text-xs text-[#6b7280] sm:grid-cols-2">
                            <div className="rounded-lg border border-[#edf1ff] bg-[#f9faff] px-4 py-3">
                              <span className="block text-[10px] uppercase tracking-[0.28em] text-[#9ca3af]">
                                Source Stock
                              </span>
                              <span className="mt-1 block text-sm font-semibold text-[#101828]">
                                {row.sourceQuantity.toFixed(2)} Units
                              </span>
                            </div>
                            <div className="rounded-lg border border-[#edf1ff] bg-[#f9faff] px-4 py-3">
                              <span className="block text-[10px] uppercase tracking-[0.28em] text-[#9ca3af]">
                                Destination Stock
                              </span>
                              <span className="mt-1 block text-sm font-semibold text-[#101828]">
                                {row.destQuantity.toFixed(2)} Units
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 rounded-lg border border-[#d9def1] bg-white px-4 py-2.5">
                            <input
                              type="number"
                              value={row.quantity}
                              onChange={(e) => handleQuantityChange(row.id, e.target.value)}
                              placeholder="0.00"
                              min="0"
                              step="0.01"
                              className="w-full border-0 text-right text-sm text-[#101828] focus:ring-0"
                            />
                            <span className="text-xs text-[#98a2b3]">Units</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button
                            type="button"
                            className="text-[#ef4444] transition hover:text-[#dc2626]"
                            onClick={() => handleRemoveRow(row.id)}
                          >
                            <Trash2 size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center gap-4 border-t border-[#edf1ff] px-8 py-4 text-sm">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-2 rounded-lg border border-dashed border-[#cbd5f5] px-4 py-2 text-[#4662ff] hover:bg-[#eef2ff] transition-colors"
                >
                  <Plus size={16} />
                  Add Row
                </button>
              </div>
            </section>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[#edf1ff] bg-[#fbfcff] px-10 py-6">
            <button
              onClick={() => handleSave("draft")}
              disabled={saving}
              className="rounded-lg border border-[#d4dcf4] px-4 py-2 text-sm font-medium text-[#6b7280] transition hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save as Draft
            </button>
            <button
              onClick={() => handleSave("in_transit")}
              disabled={saving || !transferOrderNumber || !date || !sourceWarehouse || !destinationWarehouse}
              className="rounded-lg bg-[#2f6bff] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#2757d6] disabled:cursor-not-allowed disabled:bg-[#b8ccff]"
            >
              Initiate Transfer
            </button>
            <button
              onClick={() => handleSave("transferred")}
              disabled={saving || !transferOrderNumber || !date || !sourceWarehouse || !destinationWarehouse}
              className="rounded-lg bg-[#10b981] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#059669] disabled:cursor-not-allowed disabled:bg-[#86efac]"
            >
              Complete Transfer
            </button>
            <button
              onClick={() => navigate("/inventory/transfer-orders")}
              disabled={saving}
              className="rounded-lg border border-[#d4dcf4] px-4 py-2 text-sm font-medium text-[#6b7280] transition hover:bg-white disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransferOrderCreate;
