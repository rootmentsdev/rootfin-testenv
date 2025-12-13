import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Search, Image as ImageIcon, ChevronDown, X, Settings, Pencil, Check, Plus, HelpCircle, ChevronUp } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import Head from "../components/Head";
import baseUrl from "../api/api";
import { mapLocNameToWarehouse } from "../utils/warehouseMapping";

// Keyboard shortcut hook
const useKeyboardShortcut = (key, ctrlKey, callback) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key.toLowerCase() === key.toLowerCase() && e.ctrlKey === ctrlKey) {
        e.preventDefault();
        callback();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [key, ctrlKey, callback]);
};

// ItemDropdown Component - filters items by warehouse
const ItemDropdown = ({ rowId, value, onChange, warehouse, onNewItem, isStoreUser = false }) => {
  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  // Filter items by warehouse stock
  const filterItemsByWarehouse = (itemsList, targetWarehouse) => {
    if (!targetWarehouse) return itemsList;
    
    return itemsList.filter(item => {
      if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks) || item.warehouseStocks.length === 0) {
        return false;
      }
      
      const targetWarehouseLower = targetWarehouse.toLowerCase().trim();
      
      return item.warehouseStocks.some(ws => {
        if (!ws.warehouse) return false;
        const stockWarehouseRaw = (ws.warehouse || "").toString().trim();
        const stockWarehouse = stockWarehouseRaw.toLowerCase().trim();
        
        // Check stock quantity first
        const stockOnHand = parseFloat(ws.stockOnHand) || 0;
        const availableForSale = parseFloat(ws.availableForSale) || 0;
        const hasStock = stockOnHand > 0 || availableForSale > 0;
        
        if (!hasStock) return false; // Skip if no stock
        
        // For store users - NEVER show warehouse stock (confidential)
        // Check for various warehouse name formats
        if (isStoreUser && (stockWarehouse === "warehouse" || stockWarehouse.includes("warehouse"))) {
          return false;
        }
        
        // For store branches - exclude warehouse and match the specific store
        if (stockWarehouse === "warehouse" || stockWarehouse.includes("warehouse")) {
          return false;
        }
        
        // Check exact match
        if (stockWarehouse === targetWarehouseLower) {
          return true;
        }
        
        // Check base name match (e.g., "kannur" matches "kannur branch")
        const stockBase = stockWarehouse.replace(/\s*(branch|warehouse|sg|g|z)\s*$/i, "").trim();
        const targetBase = targetWarehouseLower.replace(/\s*(branch|warehouse|sg|g|z)\s*$/i, "").trim();
        
        if (stockBase && targetBase && stockBase === targetBase) {
          return true;
        }
        
        // Partial match - check if warehouse name contains target or vice versa
        if (stockWarehouse.includes(targetWarehouseLower) || targetWarehouseLower.includes(stockWarehouse)) {
          return true;
        }
        
        return false;
      });
    });
  };

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/shoe-sales/items?page=1&limit=100`);
        if (!response.ok) throw new Error("Failed to fetch items");
        const data = await response.json();
        
        let itemsList = [];
        if (Array.isArray(data)) {
          itemsList = data;
        } else if (data.items && Array.isArray(data.items)) {
          itemsList = data.items;
        }
        
        // Filter active items
        const activeItems = itemsList.filter((i) => i?.isActive !== false && String(i?.isActive).toLowerCase() !== "false");
        
        // Filter by warehouse if warehouse is selected
        const filteredItems = warehouse ? filterItemsByWarehouse(activeItems, warehouse) : activeItems;
        
        setItems(filteredItems);
      } catch (error) {
        console.error("Error fetching items:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, [warehouse, API_URL]);

  useEffect(() => {
    if (value) {
      if (typeof value === 'object' && value !== null) {
        setSelectedItem(value);
      } else if (items.length > 0) {
        const item = items.find((i) => i._id === value || i.itemName === value);
        setSelectedItem(item || null);
      }
    } else {
      setSelectedItem(null);
    }
  }, [value, items]);

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
    setSelectedItem(item);
    setIsOpen(false);
    setSearchTerm("");
  };

  const getStockInWarehouse = (item, targetWarehouse, isStoreUserParam = false) => {
    if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks) || !targetWarehouse) return 0;
    const targetWarehouseLower = targetWarehouse.toLowerCase().trim();
    
    const matchingStock = item.warehouseStocks.find(ws => {
      if (!ws.warehouse) return false;
      const stockWarehouse = ws.warehouse.toString().toLowerCase().trim();
      
      // Store users cannot see warehouse stock (confidential)
      if (isStoreUserParam && stockWarehouse === "warehouse") {
        return false;
      }
      
      return stockWarehouse === targetWarehouseLower || 
             stockWarehouse.includes(targetWarehouseLower) ||
             targetWarehouseLower.includes(stockWarehouse);
    });
    
    return matchingStock ? (parseFloat(matchingStock.stockOnHand) || 0) : 0;
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
              {searchTerm ? "No items found" : warehouse ? `No items available in ${warehouse}` : "No items available"}
            </div>
          ) : (
            filteredItems.map((item) => {
              // Get total stock on hand (all warehouses combined)
              const getTotalStockOnHand = (item) => {
                if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks)) return 0;
                return item.warehouseStocks.reduce((sum, ws) => {
                  const stock = typeof ws.stockOnHand === 'number' ? ws.stockOnHand : parseFloat(ws.stockOnHand) || 0;
                  return sum + stock;
                }, 0);
              };
              
              const stockInWarehouse = warehouse ? getStockInWarehouse(item, warehouse, isStoreUser) : getTotalStockOnHand(item);
              const purchaseRate = typeof item.sellingPrice === 'number' ? item.sellingPrice : (typeof item.costPrice === 'number' ? item.costPrice : 0);
              const isSelected = (typeof value === 'object' && value?._id === item._id) || 
                                 (typeof value === 'string' && value === (item.itemName || item._id));
              
              // Get group name if item is from a group
              const groupName = item.groupName || item.group?.name || (item.itemGroupId ? "Group: undefined" : null);
              
              return (
                <div
                  key={item._id}
                  onClick={() => handleSelectItem(item)}
                  className={`px-4 py-3 cursor-pointer transition-colors border-b border-[#f1f5f9] ${
                    isSelected
                      ? "bg-[#2563eb] text-white"
                      : "text-[#1f2937] hover:bg-[#f8fafc]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${isSelected ? "text-white" : "text-[#1f2937]"}`}>
                        {item.itemName || "Unnamed Item"}
                      </div>
                      <div className={`text-xs mt-1 ${isSelected ? "text-white/80" : "text-[#64748b]"}`}>
                        {groupName ? `${groupName} • ` : ""}SKU: {item.sku || "N/A"} • Rate: ₹{purchaseRate.toFixed(2)}
                      </div>
                    </div>
                    <div className="flex flex-col items-end shrink-0">
                      <div className={`text-xs ${isSelected ? "text-white/80" : "text-[#64748b]"}`}>
                        Stock on Hand
                      </div>
                      <div className={`text-sm font-medium mt-0.5 ${isSelected ? "text-white" : "text-[#10b981]"}`}>
                        {stockInWarehouse.toFixed(2)} pcs
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
        {onNewItem && (
          <div className="border-t border-[#e2e8f0] px-3 py-2 bg-[#fafbff]">
            <div
              onClick={() => {
                onNewItem();
                setIsOpen(false);
              }}
              className="flex items-center gap-2 px-3 py-2 cursor-pointer text-sm text-[#2563eb] hover:bg-[#eef2ff] rounded-md transition-colors"
            >
              <span>+</span>
              <span>New Item</span>
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="relative w-full overflow-visible m-0 p-0">
        <input
          ref={buttonRef}
          type="text"
          value={selectedItem ? (selectedItem.itemName || "") : searchTerm}
          onChange={(e) => {
            const inputValue = e.target.value;
            setSearchTerm(inputValue);
            // Clear selection if user starts typing something different
            if (selectedItem && inputValue !== selectedItem.itemName) {
              setSelectedItem(null);
              onChange(null);
            }
            // Show dropdown when typing
            if (!isOpen && inputValue.length > 0) {
              setIsOpen(true);
              updatePos();
            } else if (inputValue.length === 0) {
              setIsOpen(false);
            }
          }}
          onFocus={() => {
            if (!isOpen) {
              setIsOpen(true);
              updatePos();
            }
          }}
          placeholder="Type or click to select an item."
          className="w-full h-[36px] rounded-md border border-[#d7dcf5] bg-white px-[10px] py-[6px] text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors"
        />
      </div>
      {typeof document !== "undefined" && document.body && createPortal(dropdownPortal, document.body)}
    </>
  );
};

const blankLineItem = () => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  item: "",
  itemData: null,
  size: "",
  quantity: 1,
  rate: 0,
  tax: "",
  amount: 0,
  baseAmount: 0,
  discountedAmount: 0,
  cgstAmount: 0,
  sgstAmount: 0,
  igstAmount: 0,
  lineTaxTotal: 0,
  lineTotal: 0,
  taxPercent: 0,
  cgstPercent: 0,
  sgstPercent: 0,
  igstPercent: 0,
  isInterState: false,
});

// Improved TaxDropdown Component with better styling
const TaxDropdown = ({ rowId, value, onChange, taxOptions, nonTaxableOptions, onNewTax, ...props }) => {
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTax, setSelectedTax] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
  });
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  useEffect(() => {
    if (value) {
      const tax = [...taxOptions, ...nonTaxableOptions].find((t) => t.id === value);
      setSelectedTax(tax);
    } else {
      setSelectedTax(null);
    }
  }, [value, taxOptions, nonTaxableOptions]);

  const updatePos = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 6,
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

  const filteredTaxOptions = taxOptions.filter((tax) =>
    tax.display.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSelectTax = (taxId) => {
    onChange(taxId);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClearTax = (e) => {
    e.stopPropagation();
    onChange("");
    setSelectedTax(null);
  };

  const dropdownPortal = isOpen ? (
    <div
      ref={dropdownRef}
      style={{
        position: "fixed",
        top: dropdownPos.top,
        left: dropdownPos.left,
        width: Math.max(dropdownPos.width, 280),
        zIndex: 999999,
      }}
    >
      <div className="rounded-lg shadow-lg bg-white border border-[#e5e7eb] overflow-hidden">
        {/* Search Header */}
        <div className="flex items-center gap-3 border-b border-[#e5e7eb] px-4 py-3 bg-gradient-to-r from-[#f9fafb] to-white">
          <Search size={16} className="text-[#9ca3af] flex-shrink-0" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search taxes..."
            className="flex-1 border-none bg-transparent text-sm text-[#111827] outline-none placeholder:text-[#9ca3af]"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
        
        {/* Options List */}
        <div className="py-2 max-h-[400px] overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d3d3d3 #f5f5f5' }}>
          {/* Non-Taxable Section */}
          {nonTaxableOptions.length > 0 && (
            <>
              <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] bg-[#f9fafb]">
                Non-Taxable Options
              </div>
              {nonTaxableOptions.map((option) => (
                <div
                  key={option.id}
                  onClick={() => handleSelectTax(option.id)}
                  className={`px-4 py-3 text-sm cursor-pointer transition-all duration-150 border-l-4 ${
                    value === option.id
                      ? "bg-[#eff6ff] text-[#2563eb] font-semibold border-l-[#2563eb]"
                      : "text-[#374151] hover:bg-[#f9fafb] border-l-transparent hover:border-l-[#d1d5db]"
                  }`}
                >
                  <div className="font-medium">{option.name}</div>
                  <div className="text-xs text-[#9ca3af] mt-1">{option.description}</div>
                </div>
              ))}
            </>
          )}
          
          {/* Tax Groups Section */}
          {filteredTaxOptions.length > 0 && (
            <>
              <div className="px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-[#9ca3af] bg-[#f9fafb] mt-2">
                Tax Groups
              </div>
              {filteredTaxOptions.map((tax) => (
                <div
                  key={tax.id}
                  onClick={() => handleSelectTax(tax.id)}
                  className={`flex items-center justify-between px-4 py-3 text-sm cursor-pointer transition-all duration-150 border-l-4 ${
                    value === tax.id
                      ? "bg-[#eff6ff] text-[#2563eb] font-semibold border-l-[#2563eb]"
                      : "text-[#374151] hover:bg-[#f9fafb] border-l-transparent hover:border-l-[#d1d5db]"
                  }`}
                >
                  <span>{tax.display}</span>
                  {value === tax.id && <Check size={18} className="text-[#2563eb]" />}
                </div>
              ))}
            </>
          )}
          
          {/* No Results */}
          {filteredTaxOptions.length === 0 && nonTaxableOptions.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-[#9ca3af]">
              No taxes found
            </div>
          )}
        </div>
        
        {/* Add New Tax Button */}
        {onNewTax && (
          <div
            onClick={() => {
              onNewTax();
              setIsOpen(false);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#2563eb] hover:bg-[#f8fafc] cursor-pointer transition-colors border-t border-[#e2e8f0]"
          >
            <Plus size={16} />
            <span>New Tax</span>
          </div>
        )}
      </div>
    </div>
  ) : null;

  return (
    <select
      value={value}
      onChange={(e) => handleSelectTax(e.target.value)}
      className="w-full h-[36px] rounded-lg border border-[#e5e7eb] bg-white text-sm text-[#111827] hover:border-[#d1d5db] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all cursor-pointer px-3 py-2"
    >
      <option value="">Select Tax</option>
      {nonTaxableOptions.map((option) => (
        <option key={option.id} value={option.id}>
          {option.name}
        </option>
      ))}
      {taxOptions.map((tax) => (
        <option key={tax.id} value={tax.id}>
          {tax.display}
        </option>
      ))}
    </select>
  );
};

// Simple SubCategory Dropdown Component - Opens Downwards
const SubCategoryDropdown = ({ value, onChange, subtleControlBase }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const options = [
    { value: "", label: "Select sub category" },
    { value: "advance", label: "Advance" },
    { value: "Balance Payable", label: "Balance Payable" },
    { value: "security", label: "Security" },
    { value: "shoe sales", label: "Shoe Sales" },
    { value: "shirt sales", label: "Shirt Sales" },
    { value: "cancellation Refund", label: "Cancellation Refund" },
    { value: "security Refund", label: "Security Refund" },
    { value: "compensation", label: "Compensation" },
    { value: "petty expenses", label: "Petty Expenses" },
    { value: "bulk amount transfer", label: "Bulk Amount Transfer" },
    { value: "staff reimbursement", label: "Staff Reimbursement" },
    { value: "maintenance expenses", label: "Maintenance Expenses" },
    { value: "telephone internet", label: "Telephone & Internet" },
    { value: "utility bill", label: "Utility Bill" },
    { value: "salary", label: "Salary" },
    { value: "rent", label: "Rent" },
    { value: "courier charges", label: "Courier Charges" },
    { value: "asset purchase", label: "Asset Purchase" },
    { value: "promotion_services", label: "Promotion & Services" },
    { value: "spot incentive", label: "Spot Incentive" },
    { value: "other expenses", label: "Other Expenses" },
    { value: "shoe sales return", label: "Shoe Sales Return" },
    { value: "shirt sales return", label: "Shirt Sales Return" },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(opt => opt.value === value)?.label || "Select sub category";

  return (
    <div ref={dropdownRef} className="relative w-full">
      <input
        type="text"
        readOnly
        onClick={() => setIsOpen(!isOpen)}
        value={selectedLabel}
        className="w-full rounded-lg border border-[#e5e7eb] bg-white text-sm text-[#111827] hover:border-[#d1d5db] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all cursor-pointer px-3 py-2.5"
      />

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-[#e5e7eb] rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto">
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                value === option.value
                  ? "bg-[#f3f4f6] text-[#111827] font-medium border-l-4 border-l-[#9ca3af]"
                  : "text-[#111827] hover:bg-[#f9fafb]"
              }`}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const SalesInvoiceCreate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);
  
  // Keyboard shortcuts
  // Ctrl+O - Open new invoice
  const handleCtrlO = useCallback(() => {
    if (!isEditMode) {
      return;
    }
    navigate("/sales/invoices/new");
  }, [isEditMode, navigate]);

  useKeyboardShortcut("o", true, handleCtrlO);

  // Ctrl+I - Open invoice list
  const handleCtrlI = useCallback(() => {
    navigate("/sales/invoices");
  }, [navigate]);

  useKeyboardShortcut("i", true, handleCtrlI);

  // Ctrl+N - Create new invoice
  const handleCtrlN = useCallback(() => {
    if (!isEditMode) {
      return;
    }
    navigate("/sales/invoices/new");
  }, [isEditMode, navigate]);

  useKeyboardShortcut("n", true, handleCtrlN);
  
  const [customer, setCustomer] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [branch, setBranch] = useState("Head Office");
  const [orderNumber, setOrderNumber] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("INV-009193");
  const [invoiceDate, setInvoiceDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [terms, setTerms] = useState("Due on Receipt");
  const [salesperson, setSalesperson] = useState("");
  const [salesPersons, setSalesPersons] = useState([]);
  const [showSalesPersonModal, setShowSalesPersonModal] = useState(false);
  const [newSalesPerson, setNewSalesPerson] = useState({
    firstName: "",
    lastName: "",
    employeeId: "",
    phone: "",
    email: "",
  });
  const [loadingSalesPersons, setLoadingSalesPersons] = useState(false);
  const [userLocCode, setUserLocCode] = useState("");
  const [userStoreId, setUserStoreId] = useState("");
  const [subject, setSubject] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [remark, setRemark] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [lineItems, setLineItems] = useState([blankLineItem()]);
  const [tdsEnabled, setTdsEnabled] = useState(true);
  const [tax, setTax] = useState("");
  const [discount, setDiscount] = useState({ value: "0", type: "%" });
  const [applyDiscountAfterTax, setApplyDiscountAfterTax] = useState(false);
  const [totalTaxAmount, setTotalTaxAmount] = useState("");
  const [tdsTcsType, setTdsTcsType] = useState("TDS"); // "TDS" or "TCS"
  const [tdsTcsTax, setTdsTcsTax] = useState("");
  const [adjustment, setAdjustment] = useState("0.00");
  const [showNewTaxModal, setShowNewTaxModal] = useState(false);
  const [newTax, setNewTax] = useState({
    name: "",
    rate: "",
    type: "",
  });
  const [taxOptions, setTaxOptions] = useState([
    { id: "gst0", name: "GST0", rate: 0, display: "GST0 [0%]" },
    { id: "gst5", name: "GST5", rate: 5, display: "GST5 [5%]" },
    { id: "gst12", name: "GST12", rate: 12, display: "GST12 [12%]" },
    { id: "gst18", name: "GST18", rate: 18, display: "GST18 [18%]" },
    { id: "gst28", name: "GST28", rate: 28, display: "GST28 [28%]" },
  ]);
  const [nonTaxableOptions] = useState([
    {
      id: "out-of-scope",
      name: "Out of Scope",
      description: "Supplies on which you don't charge any GST or include them in the returns.",
    },
    {
      id: "non-gst-supply",
      name: "Non-GST Supply",
      description: "Supplies which do not come under GST such as petroleum products and liquor.",
    },
  ]);
  const [tdsOptions] = useState([
    { id: "tds-commission", name: "Commission or Brokerage", rate: 5, display: "Commission or Brokerage [5%]" },
    { id: "tds-commission-reduced", name: "Commission or Brokerage (Reduced)", rate: 3.75, display: "Commission or Brokerage (Reduced) [3.75%]" },
    { id: "tds-dividend", name: "Dividend", rate: 10, display: "Dividend [10%]" },
    { id: "tds-dividend-reduced", name: "Dividend (Reduced)", rate: 7.5, display: "Dividend (Reduced) [7.5%]" },
    { id: "tds-other-interest", name: "Other Interest than securities", rate: 10, display: "Other Interest than securities [10%]" },
    { id: "tds-other-interest-reduced", name: "Other Interest than securities (Reduced)", rate: 7.5, display: "Other Interest than securities (Reduced) [7.5%]" },
    { id: "tds-contractors-others", name: "Payment of contractors for Others", rate: 2, display: "Payment of contractors for Others [2%]" },
    { id: "tds-contractors-others-reduced", name: "Payment of contractors for Others (Reduced)", rate: 1.5, display: "Payment of contractors for Others (Reduced) [1.5%]" },
    { id: "tds-contractors-huf", name: "Payment of contractors HUF/Indiv", rate: 1, display: "Payment of contractors HUF/Indiv [1%]" },
    { id: "tds-contractors-huf-reduced", name: "Payment of contractors HUF/Indiv (Reduced)", rate: 0.75, display: "Payment of contractors HUF/Indiv (Reduced) [0.75%]" },
    { id: "tds-professional-fees", name: "Professional Fees", rate: 10, display: "Professional Fees [10%]" },
    { id: "tds-professional-fees-reduced", name: "Professional Fees (Reduced)", rate: 7.5, display: "Professional Fees (Reduced) [7.5%]" },
    { id: "tds-rent", name: "Rent on land or furniture etc", rate: 10, display: "Rent on land or furniture etc [10%]" },
    { id: "tds-rent-reduced", name: "Rent on land or furniture etc (Reduced)", rate: 7.5, display: "Rent on land or furniture etc (Reduced) [7.5%]" },
    { id: "tds-technical-fees", name: "Technical Fees (2%)", rate: 2, display: "Technical Fees (2%) [2%]" },
  ]);
  const [customerNotes, setCustomerNotes] = useState("Thanks for your business.");
  const [termsAndConditions, setTermsAndConditions] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [showInvoiceSettingsModal, setShowInvoiceSettingsModal] = useState(false);
  const [invoiceSettings, setInvoiceSettings] = useState({
    autoGenerate: true,
    prefix: "INV-",
    nextNumber: "009647",
    restartYearly: false,
  });
  const [isScanning, setIsScanning] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanResults, setScanResults] = useState([]);
  const [scanSearchTerm, setScanSearchTerm] = useState("");
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkSearchTerm, setBulkSearchTerm] = useState("");
  const [bulkResults, setBulkResults] = useState([]);
  const [selectedBulkItems, setSelectedBulkItems] = useState([]);

  const controlBase =
    "w-full rounded-lg border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#111827] hover:border-[#d1d5db] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all";
  const textareaBase = `${controlBase} resize-none`;
  const subtleControlBase =
    "rounded-xl border border-[#d4dbf4] bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[#3a6bff] focus:outline-none focus:ring-0";

  // Input component for consistent styling
  const Input = ({ placeholder = "", className = "", ...props }) => {
    const baseClasses = "w-full rounded-md border border-[#d7dcf5] bg-white text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors px-3 py-2";
    return (
      <input
        {...props}
        className={`${baseClasses} ${className}`}
        placeholder={placeholder}
      />
    );
  };

  // Calculate GST for a single line item (similar to Bills.jsx)
  const calculateGSTLineItem = (item, discountConfig, allTaxOptions) => {
    const quantity = parseFloat(item.quantity) || 0;
    const rate = parseFloat(item.rate) || 0;
    // Calculate total amount (inclusive of tax)
    const rawTotalAmount = quantity * rate;
    const totalAmount = Math.round(rawTotalAmount * 100) / 100;
    const roundedTotalAmount = parseFloat(totalAmount.toFixed(2));

    const extractTaxRate = (taxRateValue) => {
      if (!taxRateValue) return null;
      const taxRateStr = String(taxRateValue);
      const bracketMatch = taxRateStr.match(/\[(\d+(?:\.\d+)?)%?\]/);
      if (bracketMatch) {
        return parseFloat(bracketMatch[1]);
      }
      const numberMatch = taxRateStr.replace(/[^\d.]/g, '');
      const taxRate = parseFloat(numberMatch);
      return isNaN(taxRate) ? null : taxRate;
    };

    const selectedTax = allTaxOptions.find(t => t.id === item.tax);
    
    let taxPercent = 0;
    let cgstPercent = 0;
    let sgstPercent = 0;
    let igstPercent = 0;
    let isInterState = false;

    const itemData = item.itemData;
    let itemTaxRate = null;
    let itemIsInterState = false;

    if (itemData) {
      if (itemData.taxRateIntra) {
        itemTaxRate = extractTaxRate(itemData.taxRateIntra);
        itemIsInterState = false;
      } else if (itemData.taxRateInter) {
        itemTaxRate = extractTaxRate(itemData.taxRateInter);
        itemIsInterState = true;
      }
    }

    if (itemTaxRate !== null) {
      taxPercent = itemTaxRate;
      isInterState = itemIsInterState;
    } else if (selectedTax && selectedTax.rate !== undefined && selectedTax.rate > 0) {
      taxPercent = selectedTax.rate;
      isInterState = false;
    } else if (item.tax) {
      // Try to extract tax rate from tax string (e.g., "GST 5%" -> 5)
      const taxStr = String(item.tax);
      if (taxStr.includes("GST")) {
        const rateMatch = taxStr.match(/(\d+(?:\.\d+)?)/);
        if (rateMatch) {
          taxPercent = parseFloat(rateMatch[1]);
        }
      }
    }

    if (taxPercent > 0) {
      if (isInterState) {
        igstPercent = taxPercent;
      } else {
        cgstPercent = taxPercent / 2;
        sgstPercent = taxPercent / 2;
      }
    }

    // INCLUSIVE GST LOGIC (like Zoho Books)
    // The rate includes tax, so we need to extract the base amount
    let baseAmount = roundedTotalAmount;
    let discountedAmount = roundedTotalAmount;
    
    if (taxPercent > 0) {
      // Calculate base amount from inclusive total
      // Formula: baseAmount = totalAmount / (1 + taxPercent/100)
      baseAmount = roundedTotalAmount / (1 + taxPercent / 100);
      baseAmount = Math.round(baseAmount * 100) / 100;
    }

    // Apply discount if configured
    if (!discountConfig.applyAfterTax && discountConfig.value && parseFloat(discountConfig.value) > 0) {
      if (discountConfig.type === "%") {
        const discountPercent = parseFloat(discountConfig.value);
        discountedAmount = roundedTotalAmount - (roundedTotalAmount * discountPercent / 100);
      } else {
        discountedAmount = roundedTotalAmount;
      }
      discountedAmount = Math.max(0, discountedAmount);
      discountedAmount = parseFloat(discountedAmount.toFixed(2));
    }

    // Calculate tax amounts from the base amount
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterState && igstPercent > 0) {
      const taxValue = (baseAmount * igstPercent) / 100;
      igstAmount = Math.round(taxValue * 100) / 100;
    } else if (!isInterState && (cgstPercent > 0 || sgstPercent > 0)) {
      const cgstValue = (baseAmount * cgstPercent) / 100;
      const sgstValue = (baseAmount * sgstPercent) / 100;
      cgstAmount = Math.round(cgstValue * 100) / 100;
      sgstAmount = Math.round(sgstValue * 100) / 100;
    }

    const lineTaxTotal = parseFloat((cgstAmount + sgstAmount + igstAmount).toFixed(2));
    // For inclusive GST, the line total is the discounted amount (which already includes tax)
    const lineTotal = discountedAmount;

    return {
      baseAmount: baseAmount.toFixed(2),
      discountedAmount: discountedAmount.toFixed(2),
      cgstAmount: cgstAmount.toFixed(2),
      sgstAmount: sgstAmount.toFixed(2),
      igstAmount: igstAmount.toFixed(2),
      lineTaxTotal: lineTaxTotal.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
      taxPercent,
      cgstPercent,
      sgstPercent,
      igstPercent,
      isInterState,
    };
  };

  // Calculate totals with tax logic (similar to Bills.jsx)
  const calculateTotals = () => {
    const allTaxOptions = [...taxOptions, ...nonTaxableOptions];
    const discountConfig = {
      value: discount.value,
      type: discount.type,
      applyAfterTax: applyDiscountAfterTax,
    };

    // Recalculate all line items with current discount
    const recalculatedItems = lineItems.map(item => {
      const gstCalculation = calculateGSTLineItem(item, discountConfig, allTaxOptions);
      return {
        ...item,
        ...gstCalculation,
        baseAmount: parseFloat(gstCalculation.baseAmount),
        discountedAmount: parseFloat(gstCalculation.discountedAmount),
        cgstAmount: parseFloat(gstCalculation.cgstAmount),
        sgstAmount: parseFloat(gstCalculation.sgstAmount),
        igstAmount: parseFloat(gstCalculation.igstAmount),
        lineTaxTotal: parseFloat(gstCalculation.lineTaxTotal),
        lineTotal: parseFloat(gstCalculation.lineTotal),
        taxPercent: gstCalculation.taxPercent,
        cgstPercent: gstCalculation.cgstPercent,
        sgstPercent: gstCalculation.sgstPercent,
        igstPercent: gstCalculation.igstPercent,
        isInterState: gstCalculation.isInterState,
      };
    });

    // Calculate subtotal (for inclusive GST display, show the total amount including tax)
    let baseAmount = 0;
    let totalTaxAmount = 0;
    
    recalculatedItems.forEach(item => {
      baseAmount += parseFloat(item.baseAmount) || 0;
      totalTaxAmount += parseFloat(item.lineTaxTotal) || 0;
    });
    
    baseAmount = parseFloat(baseAmount.toFixed(2));
    totalTaxAmount = parseFloat(totalTaxAmount.toFixed(2));
    
    // For inclusive GST, subTotal shown to user is base + tax (the full amount)
    const subTotal = parseFloat((baseAmount + totalTaxAmount).toFixed(2));

    // Calculate tax breakdown from recalculated items
    const taxMap = new Map();
    let calculatedTotalTax = 0;

    recalculatedItems.forEach((item) => {
      if (item.taxPercent && parseFloat(item.taxPercent) > 0) {
        const taxRate = parseFloat(item.taxPercent);
        const taxAmount = parseFloat(item.lineTaxTotal || 0);
        calculatedTotalTax += taxAmount;

        if (item.isInterState && parseFloat(item.igstAmount) > 0) {
          const key = `IGST${taxRate}`;
          if (taxMap.has(key)) {
            taxMap.get(key).amount += parseFloat(item.igstAmount) || 0;
          } else {
            taxMap.set(key, {
              type: 'IGST',
              rate: taxRate,
              amount: parseFloat(item.igstAmount) || 0,
            });
          }
        } else {
          const cgstAmount = parseFloat(item.cgstAmount || 0);
          const sgstAmount = parseFloat(item.sgstAmount || 0);
          const totalGstAmount = cgstAmount + sgstAmount;
          if (totalGstAmount > 0) {
            const key = `GST${taxRate}`;
            if (taxMap.has(key)) {
              taxMap.get(key).amount += totalGstAmount;
            } else {
              taxMap.set(key, {
                type: 'GST',
                rate: taxRate,
                amount: totalGstAmount,
              });
            }
          }
        }
      }
    });

    const taxBreakdown = Array.from(taxMap.values()).sort((a, b) => {
      const typeOrder = { 'GST': 0, 'IGST': 1 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.rate - b.rate;
    });

    const roundedCalculatedTotalTax = parseFloat(calculatedTotalTax.toFixed(2));
    const totalTax = (totalTaxAmount && parseFloat(totalTaxAmount) > 0) 
      ? parseFloat(totalTaxAmount) 
      : roundedCalculatedTotalTax;

    // Calculate discount
    let discountAmount = 0;
    if (discount.value && parseFloat(discount.value) > 0) {
      if (applyDiscountAfterTax) {
        if (discount.type === "%") {
          discountAmount = ((subTotal + totalTax) * parseFloat(discount.value)) / 100;
        } else {
          discountAmount = parseFloat(discount.value) || 0;
        }
      } else {
        // When discount is before tax, it's already applied at line item level
        // Calculate the total discount amount from the difference between baseAmount and discountedAmount
        const totalBaseAmount = recalculatedItems.reduce((sum, item) => {
          return sum + (parseFloat(item.baseAmount) || 0);
        }, 0);
        if (discount.type === "%") {
          discountAmount = (totalBaseAmount * parseFloat(discount.value)) / 100;
        } else {
          // Fixed amount discount - distribute proportionally
          discountAmount = parseFloat(discount.value) || 0;
        }
      }
    }

    // Calculate TDS/TCS (Zoho calculates TDS on the base amount, not the inclusive total)
    let tdsTcsAmount = 0;
    if (tdsTcsTax) {
      // Check both regular tax options and TDS options
      const allTdsTcsOptions = [...taxOptions, ...tdsOptions];
      const selectedTdsTcsTax = allTdsTcsOptions.find(t => t.id === tdsTcsTax);
      if (selectedTdsTcsTax && selectedTdsTcsTax.rate !== undefined) {
        // For inclusive GST, TDS is calculated on the base amount (before tax)
        // baseAmount = subTotal - totalTaxAmount
        const tdsBaseAmount = baseAmount;
        
        // Calculate TDS amount: base amount × TDS rate / 100
        tdsTcsAmount = (tdsBaseAmount * selectedTdsTcsTax.rate) / 100;
        tdsTcsAmount = Math.round(tdsTcsAmount * 100) / 100;
      }
    }

    const adjustmentAmount = parseFloat(adjustment) || 0;

    // Calculate final total (for inclusive GST, tax is already in subTotal)
    // finalTotal = subTotal (which includes tax) - discount - TDS/TCS + adjustment
    let finalTotal = subTotal - discountAmount - tdsTcsAmount + adjustmentAmount;
    finalTotal = parseFloat(finalTotal.toFixed(2));

    return {
      subTotal: subTotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      taxBreakdown,
      totalTax: totalTax,
      calculatedTotalTax: roundedCalculatedTotalTax,
      tdsTcsAmount: tdsTcsAmount.toFixed(2),
      adjustmentAmount: adjustmentAmount.toFixed(2),
      finalTotal: finalTotal.toFixed(2)
    };
  };

  const totals = calculateTotals();

  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";

  // Get user info from localStorage
  const getUserInfo = () => {
    try {
      const userStr = localStorage.getItem("rootfinuser");
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
    }
    return null;
  };

  // Check if user is admin or store user
  const getStoreAccessControl = () => {
    const user = getUserInfo();
    if (!user) return { isAdmin: false, userStore: null, isStoreUser: false };

    // Check if user is admin (has admin role or no specific store assigned)
    const isAdmin = user.role === "admin" || user.role === "superadmin" || !user.storeName;
    
    // If user has a storeName, they are a store user
    const isStoreUser = !!user.storeName && user.role !== "admin" && user.role !== "superadmin";
    
    return {
      isAdmin,
      userStore: user.storeName || null,
      isStoreUser,
      user
    };
  };

  // Initialize store access control
  const storeAccess = getStoreAccessControl();

  // Set branch and warehouse automatically for store users
  useEffect(() => {
    if (storeAccess.isStoreUser && storeAccess.userStore) {
      setBranch(storeAccess.userStore);
      // Map the store name to the correct warehouse name
      const mappedWarehouse = mapLocNameToWarehouse(storeAccess.userStore);
      setWarehouse(mappedWarehouse);
      console.log(`🏪 Store user warehouse mapping: "${storeAccess.userStore}" → "${mappedWarehouse}"`);
    }
  }, [storeAccess.isStoreUser, storeAccess.userStore]);

  // Generate next invoice number
  const generateNextInvoiceNumber = async () => {
    try {
      const user = getUserInfo();
      if (!user || !user.email) return;

      const response = await fetch(`${API_URL}/api/sales/invoices/next-number`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.email,
          locCode: (() => {
            const branchLocCode = getLocCodeForBranch(branch);
            console.log(`🔢 Next Invoice Number - Branch: "${branch}" → LocCode: "${branchLocCode}"`);
            return branchLocCode || user.locCode || userLocCode || "";
          })(),
          prefix: invoiceSettings.prefix,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.nextInvoiceNumber) {
          setInvoiceNumber(data.nextInvoiceNumber);
          // Update next number in settings
          const numberPart = data.nextInvoiceNumber.replace(invoiceSettings.prefix, "");
          const nextNum = parseInt(numberPart, 10);
          if (!isNaN(nextNum)) {
            setInvoiceSettings(prev => ({
              ...prev,
              nextNumber: (nextNum + 1).toString().padStart(6, '0')
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error generating invoice number:", error);
    }
  };

  // Handle invoice settings save
  const handleSaveInvoiceSettings = () => {
    if (invoiceSettings.autoGenerate) {
      const newInvoiceNumber = `${invoiceSettings.prefix}${invoiceSettings.nextNumber}`;
      setInvoiceNumber(newInvoiceNumber);
    }
    setShowInvoiceSettingsModal(false);
  };

  // Handle opening scan modal
  const handleOpenScanModal = () => {
    setShowScanModal(true);
    setScanSearchTerm("");
    setScanResults([]);
  };

  // Search items in scan modal
  const handleScanSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      setScanResults([]);
      return;
    }
    
    setIsScanning(true);
    try {
      const response = await fetch(`${API_URL}/api/shoe-sales/items?search=${encodeURIComponent(searchTerm)}&page=1&limit=50`);
      if (!response.ok) throw new Error("Failed to fetch items");
      
      const data = await response.json();
      let items = Array.isArray(data) ? data : (data.items || []);
      
      // Filter active items and match search term
      const filteredItems = items.filter(item => {
        if (item.isActive === false) return false;
        const searchLower = searchTerm.toLowerCase();
        return (
          (item.sku && item.sku.toLowerCase().includes(searchLower)) ||
          (item.itemName && item.itemName.toLowerCase().includes(searchLower)) ||
          (item.barcode && item.barcode.toLowerCase().includes(searchLower))
        );
      });
      
      setScanResults(filteredItems);
    } catch (error) {
      console.error("Error searching items:", error);
      setScanResults([]);
    } finally {
      setIsScanning(false);
    }
  };

  // Add selected item from scan modal
  const handleAddScannedItem = (selectedItem) => {
    const newLineItem = {
      ...blankLineItem(),
      item: selectedItem.itemName || "",
      itemData: selectedItem,
      rate: typeof selectedItem.sellingPrice === 'number' ? selectedItem.sellingPrice : (typeof selectedItem.costPrice === 'number' ? selectedItem.costPrice : 0),
      quantity: 1,
    };
    
    // Calculate GST for the new item
    const allTaxOptions = [...taxOptions, ...nonTaxableOptions];
    const discountConfig = {
      value: discount.value,
      type: discount.type,
      applyAfterTax: applyDiscountAfterTax,
    };
    
    const gstCalculation = calculateGSTLineItem(newLineItem, discountConfig, allTaxOptions);
    const finalLineItem = {
      ...newLineItem,
      ...gstCalculation,
      baseAmount: parseFloat(gstCalculation.baseAmount),
      discountedAmount: parseFloat(gstCalculation.discountedAmount),
      cgstAmount: parseFloat(gstCalculation.cgstAmount),
      sgstAmount: parseFloat(gstCalculation.sgstAmount),
      igstAmount: parseFloat(gstCalculation.igstAmount),
      lineTaxTotal: parseFloat(gstCalculation.lineTaxTotal),
      lineTotal: parseFloat(gstCalculation.lineTotal),
      amount: parseFloat(gstCalculation.baseAmount),
      taxPercent: gstCalculation.taxPercent,
      cgstPercent: gstCalculation.cgstPercent,
      sgstPercent: gstCalculation.sgstPercent,
      igstPercent: gstCalculation.igstPercent,
      isInterState: gstCalculation.isInterState,
    };
    
    setLineItems(prev => [...prev, finalLineItem]);
    setShowScanModal(false);
    setScanSearchTerm("");
    setScanResults([]);
  };

  // Handle scan input (for manual entry or scanner input)
  const handleScanInputChange = (e) => {
    const value = e.target.value;
    setScanInput(value);
  };

  // Handle key press for scan input
  const handleScanKeyPress = (e) => {
    if (e.key === 'Enter' && scanInput.trim()) {
      e.preventDefault();
      handleScanItem(scanInput);
    }
  };

  // Auto-process when scanner completes (most scanners send Enter after the code)
  const handleScanInputBlur = () => {
    // Small delay to allow for scanner completion
    setTimeout(() => {
      if (scanInput.trim() && scanInput.length >= 4) { // Minimum barcode length
        handleScanItem(scanInput);
      }
    }, 100);
  };

  // Handle scanned item - search by barcode or SKU and add to invoice
  const handleScanItem = async (scannedCode) => {
    if (!scannedCode.trim()) return;

    try {
      setIsScanning(true);
      
      // Search for item by barcode or SKU
      const response = await fetch(
        `${API_URL}/api/shoe-sales/items?search=${encodeURIComponent(scannedCode)}&page=1&limit=50`
      );
      
      if (!response.ok) throw new Error("Failed to fetch items");
      
      const data = await response.json();
      let items = Array.isArray(data) ? data : (data.items || []);
      
      // Filter active items
      const activeItems = items.filter(item => item?.isActive !== false && String(item?.isActive).toLowerCase() !== "false");
      
      // Find exact match by barcode or SKU
      let foundItem = activeItems.find(item => 
        (item.barcode && item.barcode.toLowerCase() === scannedCode.toLowerCase()) ||
        (item.sku && item.sku.toLowerCase() === scannedCode.toLowerCase())
      );
      
      // If no exact match, try partial match
      if (!foundItem) {
        foundItem = activeItems.find(item =>
          (item.barcode && item.barcode.toLowerCase().includes(scannedCode.toLowerCase())) ||
          (item.sku && item.sku.toLowerCase().includes(scannedCode.toLowerCase())) ||
          (item.itemName && item.itemName.toLowerCase().includes(scannedCode.toLowerCase()))
        );
      }
      
      if (!foundItem) {
        alert(`Item not found for barcode/SKU: ${scannedCode}`);
        setScanInput("");
        return;
      }
      
      // Check if item has stock in the current warehouse
      if (!foundItem.warehouseStocks || !Array.isArray(foundItem.warehouseStocks)) {
        alert(`Item "${foundItem.itemName}" has no warehouse stock information`);
        setScanInput("");
        return;
      }
      
      // Find stock in the current warehouse
      const targetWarehouseLower = warehouse.toLowerCase().trim();
      const stockInWarehouse = foundItem.warehouseStocks.find(ws => {
        if (!ws.warehouse) return false;
        const stockWarehouse = (ws.warehouse || "").toString().toLowerCase().trim();
        
        // Check exact match
        if (stockWarehouse === targetWarehouseLower) return true;
        
        // Check base name match
        const stockBase = stockWarehouse.replace(/\s*(branch|warehouse|sg|g|z)\s*$/i, "").trim();
        const targetBase = targetWarehouseLower.replace(/\s*(branch|warehouse|sg|g|z)\s*$/i, "").trim();
        
        if (stockBase && targetBase && stockBase === targetBase) return true;
        
        // Partial match
        if (stockWarehouse.includes(targetWarehouseLower) || targetWarehouseLower.includes(stockWarehouse)) {
          return true;
        }
        
        return false;
      });
      
      if (!stockInWarehouse) {
        alert(`Item "${foundItem.itemName}" is not available in ${warehouse}`);
        setScanInput("");
        return;
      }
      
      const stockOnHand = parseFloat(stockInWarehouse.stockOnHand) || 0;
      if (stockOnHand <= 0) {
        alert(`Item "${foundItem.itemName}" has no stock in ${warehouse}`);
        setScanInput("");
        return;
      }
      
      // Add item to invoice
      const allTaxOptions = [...taxOptions, ...nonTaxableOptions];
      const discountConfig = {
        value: discount.value,
        type: discount.type,
        applyAfterTax: applyDiscountAfterTax,
      };
      
      const newLineItem = {
        ...blankLineItem(),
        item: foundItem.itemName || "",
        itemData: foundItem,
        rate: typeof foundItem.sellingPrice === 'number' ? foundItem.sellingPrice : (typeof foundItem.costPrice === 'number' ? foundItem.costPrice : 0),
        quantity: 1,
      };
      
      const gstCalculation = calculateGSTLineItem(newLineItem, discountConfig, allTaxOptions);
      const finalLineItem = {
        ...newLineItem,
        ...gstCalculation,
        baseAmount: parseFloat(gstCalculation.baseAmount),
        discountedAmount: parseFloat(gstCalculation.discountedAmount),
        cgstAmount: parseFloat(gstCalculation.cgstAmount),
        sgstAmount: parseFloat(gstCalculation.sgstAmount),
        igstAmount: parseFloat(gstCalculation.igstAmount),
        lineTaxTotal: parseFloat(gstCalculation.lineTaxTotal),
        lineTotal: parseFloat(gstCalculation.lineTotal),
        amount: parseFloat(gstCalculation.baseAmount),
        taxPercent: gstCalculation.taxPercent,
        cgstPercent: gstCalculation.cgstPercent,
        sgstPercent: gstCalculation.sgstPercent,
        igstPercent: gstCalculation.igstPercent,
        isInterState: gstCalculation.isInterState,
      };
      
      setLineItems(prev => [...prev, finalLineItem]);
      setScanInput("");
      
      console.log(`✅ Item scanned and added: ${foundItem.itemName} (Barcode: ${foundItem.barcode}, SKU: ${foundItem.sku})`);
      alert(`✅ Item added: ${foundItem.itemName}`);
      
    } catch (error) {
      console.error("Error scanning item:", error);
      alert("Error scanning item. Please try again.");
      setScanInput("");
    } finally {
      setIsScanning(false);
    }
  };

  // Refs for Html5Qrcode scanner
  const html5QrCodeRef = useRef(null);
  const externalScannerInputRef = useRef(null);
  const scannedCodeBufferRef = useRef("");
  const scanTimeoutRef = useRef(null);

  // Handle external scanner input (keyboard wedge devices)
  const handleExternalScannerInput = (e) => {
    // Clear any existing timeout
    if (scanTimeoutRef.current) {
      clearTimeout(scanTimeoutRef.current);
    }
    
    const char = e.key;
    
    // If Enter key is pressed, process the scanned code
    if (char === "Enter") {
      e.preventDefault();
      const scannedCode = scannedCodeBufferRef.current.trim();
      
      if (scannedCode.length > 0) {
        handleScanItem(scannedCode);
        scannedCodeBufferRef.current = "";
        // Clear the input field
        if (externalScannerInputRef.current) {
          externalScannerInputRef.current.value = "";
        }
      }
      return;
    }
    
    // Ignore special keys (Shift, Ctrl, Alt, etc.)
    if (char.length > 1) {
      return;
    }
    
    // Append character to buffer
    scannedCodeBufferRef.current += char;
    
    // Set a timeout to reset buffer if no activity (handles slow typing vs fast scanning)
    scanTimeoutRef.current = setTimeout(() => {
      scannedCodeBufferRef.current = "";
    }, 100); // 100ms timeout - scanners are typically faster than this
  };

  // Open camera for QR code scanning
  const handleOpenCamera = async () => {
    setShowCameraModal(true);
    setCameraError(null);
    scannedCodeBufferRef.current = "";
    
    // Wait for DOM to update so the modal is visible
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Focus on external scanner input field for keyboard wedge devices
    if (externalScannerInputRef.current) {
      externalScannerInputRef.current.focus();
    }
    
    try {
      // Check if camera permissions are available
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        // Stop the stream immediately - we just needed to check permissions
        stream.getTracks().forEach(track => track.stop());
      } catch (permErr) {
        // Camera failed, but external scanner will still work
        if (permErr.name === "NotAllowedError" || permErr.name === "PermissionDeniedError") {
          setCameraError("⚠️ Camera permission denied. You can still use an external barcode scanner - see the input field below.");
        } else if (permErr.name === "NotFoundError" || permErr.name === "DevicesNotFoundError") {
          setCameraError("⚠️ No camera found. You can still use an external barcode scanner - see the input field below.");
        } else {
          setCameraError(`⚠️ Camera access error: ${permErr.message}. You can still use an external barcode scanner - see the input field below.`);
        }
        // Don't return - allow external scanner to work even if camera fails
      }
      
      // Wait a bit more for the DOM element to be ready
      await new Promise(resolve => setTimeout(resolve, 200));
      
      // Check if the element exists
      const readerElement = document.getElementById("qr-reader");
      if (!readerElement) {
        setCameraError("Scanner element not found. Please try again.");
        return;
      }
      
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;
      
      // Try back camera first, then fallback to any available camera
      try {
        await html5QrCode.start(
          { facingMode: "environment" }, // Use back camera
          {
            fps: 10,
            qrbox: { width: 200, height: 200 },
          },
          (decodedText, decodedResult) => {
            handleScanItem(decodedText);
          },
          (errorMessage) => {
            // Ignore scanning errors (they happen frequently)
          }
        );
        // Clear any previous errors if scanner starts successfully
        setCameraError("");
      } catch (cameraErr) {
        console.log("Back camera not available, trying any camera...", cameraErr);
        // If back camera fails, try any available camera
        try {
          await html5QrCode.start(
            { facingMode: "user" }, // Use front camera as fallback
            {
              fps: 10,
              qrbox: { width: 200, height: 200 },
            },
            (decodedText, decodedResult) => {
              handleScanItem(decodedText);
            },
            (errorMessage) => {
              // Ignore scanning errors (they happen frequently)
            }
          );
          // Clear any previous errors if scanner starts successfully
          setCameraError("");
        } catch (fallbackErr) {
          console.error("Both cameras failed:", fallbackErr);
          let errorMessage = "⚠️ Camera scanner unavailable. ";
          
          if (fallbackErr.name === "NotAllowedError" || fallbackErr.name === "PermissionDeniedError") {
            errorMessage += "Camera permission denied. ";
          } else if (fallbackErr.name === "NotFoundError" || fallbackErr.name === "DevicesNotFoundError") {
            errorMessage += "No camera found. ";
          } else if (fallbackErr.message) {
            errorMessage += `Camera error: ${fallbackErr.message}. `;
          }
          
          errorMessage += "You can still use an external barcode scanner - see the input field below.";
          setCameraError(errorMessage);
          // Keep modal open so user can use external scanner
        }
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      setCameraError("An unexpected error occurred. You can still use an external barcode scanner.");
    }
  };

  // Close camera
  const handleCloseCamera = async () => {
    // Stop the scanner
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
    
    setShowCameraModal(false);
    setCameraError(null);
    scannedCodeBufferRef.current = "";
  };

  // Manual input from camera test
  const handleManualCameraInput = (code) => {
    setScanInput(code);
    handleScanItem(code);
  };

  // Load all available items for bulk modal
  const loadAllBulkItems = async () => {
    setIsScanning(true);
    try {
      const response = await fetch(`${API_URL}/api/shoe-sales/items?page=1&limit=500`);
      if (!response.ok) throw new Error("Failed to fetch items");
      
      const data = await response.json();
      let items = Array.isArray(data) ? data : (data.items || []);
      
      // Filter active items
      const activeItems = items.filter(item => item?.isActive !== false && String(item?.isActive).toLowerCase() !== "false");
      
      // Filter by warehouse if selected (same logic as ItemDropdown)
      const warehouseFilteredItems = warehouse ? 
        activeItems.filter(item => {
          if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks)) return false;
          const targetWarehouseLower = warehouse.toLowerCase().trim();
          
          return item.warehouseStocks.some(ws => {
            if (!ws.warehouse) return false;
            const stockWarehouse = (ws.warehouse || "").toString().toLowerCase().trim();
            
            // Check stock quantity first
            const stockOnHand = parseFloat(ws.stockOnHand) || 0;
            const availableForSale = parseFloat(ws.availableForSale) || 0;
            const hasStock = stockOnHand > 0 || availableForSale > 0;
            
            if (!hasStock) return false; // Skip if no stock
            
            // For store users - NEVER show warehouse stock (confidential)
            if (storeAccess.isStoreUser && (stockWarehouse === "warehouse" || stockWarehouse.includes("warehouse"))) {
              return false;
            }
            
            // For store branches - exclude warehouse and match the specific store
            if (stockWarehouse === "warehouse" || stockWarehouse.includes("warehouse")) {
              return false;
            }
            
            // Check exact match
            if (stockWarehouse === targetWarehouseLower) {
              return true;
            }
            
            // Check base name match
            const stockBase = stockWarehouse.replace(/\s*(branch|warehouse|sg|g|z)\s*$/i, "").trim();
            const targetBase = targetWarehouseLower.replace(/\s*(branch|warehouse|sg|g|z)\s*$/i, "").trim();
            
            if (stockBase && targetBase && stockBase === targetBase) {
              return true;
            }
            
            // Partial match
            if (stockWarehouse.includes(targetWarehouseLower) || targetWarehouseLower.includes(stockWarehouse)) {
              return true;
            }
            return false;
          });
        }) : activeItems;
      
      setBulkResults(warehouseFilteredItems);
    } catch (error) {
      console.error("Error loading bulk items:", error);
      setBulkResults([]);
    } finally {
      setIsScanning(false);
    }
  };

  // Handle bulk item search
  const handleBulkSearch = async (searchTerm) => {
    if (!searchTerm.trim()) {
      // If search is cleared, reload all items
      loadAllBulkItems();
      return;
    }
    
    setIsScanning(true);
    try {
      const response = await fetch(`${API_URL}/api/shoe-sales/items?page=1&limit=500`);
      if (!response.ok) throw new Error("Failed to fetch items");
      
      const data = await response.json();
      let items = Array.isArray(data) ? data : (data.items || []);
      
      // Filter active items and match search term
      const filteredItems = items.filter(item => {
        if (item?.isActive === false || String(item?.isActive).toLowerCase() === "false") return false;
        const searchLower = searchTerm.toLowerCase();
        return (
          (item.sku && item.sku.toLowerCase().includes(searchLower)) ||
          (item.itemName && item.itemName.toLowerCase().includes(searchLower)) ||
          (item.barcode && item.barcode.toLowerCase().includes(searchLower))
        );
      });
      
      // Filter by warehouse if selected (same logic as above)
      const warehouseFilteredItems = warehouse ? 
        filteredItems.filter(item => {
          if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks)) return false;
          const targetWarehouseLower = warehouse.toLowerCase().trim();
          
          return item.warehouseStocks.some(ws => {
            if (!ws.warehouse) return false;
            const stockWarehouse = (ws.warehouse || "").toString().toLowerCase().trim();
            
            // Check stock quantity first
            const stockOnHand = parseFloat(ws.stockOnHand) || 0;
            const availableForSale = parseFloat(ws.availableForSale) || 0;
            const hasStock = stockOnHand > 0 || availableForSale > 0;
            
            if (!hasStock) return false; // Skip if no stock
            
            // For store users - NEVER show warehouse stock (confidential)
            if (storeAccess.isStoreUser && (stockWarehouse === "warehouse" || stockWarehouse.includes("warehouse"))) {
              return false;
            }
            
            // For store branches - exclude warehouse and match the specific store
            if (stockWarehouse === "warehouse" || stockWarehouse.includes("warehouse")) {
              return false;
            }
            
            if (stockWarehouse === targetWarehouseLower) {
              return true;
            }
            
            const stockBase = stockWarehouse.replace(/\s*(branch|warehouse|sg|g|z)\s*$/i, "").trim();
            const targetBase = targetWarehouseLower.replace(/\s*(branch|warehouse|sg|g|z)\s*$/i, "").trim();
            
            if (stockBase && targetBase && stockBase === targetBase) {
              return true;
            }
            
            if (stockWarehouse.includes(targetWarehouseLower) || targetWarehouseLower.includes(stockWarehouse)) {
              return true;
            }
            return false;
          });
        }) : filteredItems;
      
      setBulkResults(warehouseFilteredItems);
    } catch (error) {
      console.error("Error searching bulk items:", error);
      setBulkResults([]);
    } finally {
      setIsScanning(false);
    }
  };

  // Toggle item selection in bulk modal
  const toggleBulkItemSelection = (item) => {
    setSelectedBulkItems(prev => {
      const existingIndex = prev.findIndex(selected => selected._id === item._id);
      if (existingIndex >= 0) {
        // Remove item
        return prev.filter(selected => selected._id !== item._id);
      } else {
        // Add item with default quantity 1
        return [...prev, { ...item, quantity: 1 }];
      }
    });
  };

  // Update quantity for selected bulk item
  const updateBulkItemQuantity = (itemId, quantity) => {
    setSelectedBulkItems(prev =>
      prev.map(item =>
        item._id === itemId ? { ...item, quantity: Math.max(1, parseInt(quantity) || 1) } : item
      )
    );
  };

  // Add all selected bulk items to invoice
  const handleAddBulkItems = () => {
    if (selectedBulkItems.length === 0) {
      alert("Please select at least one item");
      return;
    }

    const allTaxOptions = [...taxOptions, ...nonTaxableOptions];
    const discountConfig = {
      value: discount.value,
      type: discount.type,
      applyAfterTax: applyDiscountAfterTax,
    };

    const newLineItems = selectedBulkItems.map(selectedItem => {
      const newLineItem = {
        ...blankLineItem(),
        item: selectedItem.itemName || "",
        itemData: selectedItem,
        rate: typeof selectedItem.sellingPrice === 'number' ? selectedItem.sellingPrice : (typeof selectedItem.costPrice === 'number' ? selectedItem.costPrice : 0),
        quantity: selectedItem.quantity,
      };
      
      const gstCalculation = calculateGSTLineItem(newLineItem, discountConfig, allTaxOptions);
      return {
        ...newLineItem,
        ...gstCalculation,
        baseAmount: parseFloat(gstCalculation.baseAmount),
        discountedAmount: parseFloat(gstCalculation.discountedAmount),
        cgstAmount: parseFloat(gstCalculation.cgstAmount),
        sgstAmount: parseFloat(gstCalculation.sgstAmount),
        igstAmount: parseFloat(gstCalculation.igstAmount),
        lineTaxTotal: parseFloat(gstCalculation.lineTaxTotal),
        lineTotal: parseFloat(gstCalculation.lineTotal),
        amount: parseFloat(gstCalculation.baseAmount),
        taxPercent: gstCalculation.taxPercent,
        cgstPercent: gstCalculation.cgstPercent,
        sgstPercent: gstCalculation.sgstPercent,
        igstPercent: gstCalculation.igstPercent,
        isInterState: gstCalculation.isInterState,
      };
    });

    setLineItems(prev => [...prev, ...newLineItems]);
    setShowBulkModal(false);
    setBulkSearchTerm("");
    setBulkResults([]);
    setSelectedBulkItems([]);
  };

  // Handle saving invoice
  const handleSaveInvoice = async (status = "draft") => {
    // Validate required fields
    if (!customer.trim()) {
      alert("Please enter a customer name");
      return;
    }

    if (!invoiceNumber.trim()) {
      alert("Please enter an invoice number");
      return;
    }

    const user = getUserInfo();
    if (!user || !user.email) {
      alert("User information not found. Please log in again.");
      return;
    }

    setIsSaving(true);

    try {
      // Debug logging before sending
      console.log("=== FRONTEND FORM DEBUG ===");
      console.log("Category selected:", category);
      console.log("SubCategory selected:", subCategory);
      console.log("Remark entered:", remark);
      console.log("=== END FRONTEND DEBUG ===");

      const invoiceData = {
        invoiceNumber,
        invoiceDate: new Date(invoiceDate),
        dueDate: new Date(dueDate),
        customer: customer.trim(),
        customerPhone: customerPhone.trim() || "", // Ensure it's always sent
        branch,
        orderNumber: orderNumber.trim(),
        terms,
        salesperson: salesperson.trim(),
        subject: subject.trim(),
        warehouse,
        category,
        subCategory,
        remark,
        paymentMethod,
        lineItems: lineItems.map(item => ({
          item: item.item || "",
          itemData: item.itemData || null,
          size: item.size || "",
          quantity: parseFloat(item.quantity) || 0,
          rate: parseFloat(item.rate) || 0,
          tax: item.tax || "",
          amount: parseFloat(item.amount) || 0,
        })),
        customerNotes,
        termsAndConditions,
        discount,
        applyDiscountAfterTax,
        tdsTcsType,
        tdsTcsTax,
        adjustment,
        subTotal: parseFloat(totals.subTotal) || 0,
        discountAmount: parseFloat(totals.discountAmount) || 0,
        totalTax: parseFloat(totals.totalTax) || 0,
        tdsTcsAmount: parseFloat(totals.tdsTcsAmount) || 0,
        adjustmentAmount: parseFloat(totals.adjustmentAmount) || 0,
        finalTotal: parseFloat(totals.finalTotal) || 0,
        status,
        userId: user.email,
        locCode: (() => {
          const branchLocCode = getLocCodeForBranch(branch);
          console.log(`🏢 Invoice Creation - Branch: "${branch}" → LocCode: "${branchLocCode}"`);
          return branchLocCode || user.locCode || userLocCode || "";
        })(),
      };

      const url = isEditMode ? `${API_URL}/api/sales/invoices/${id}` : `${API_URL}/api/sales/invoices`;
      const method = isEditMode ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(invoiceData),
      });

      console.log("=== REQUEST SENT ===");
      console.log("Invoice data sent to backend:", JSON.stringify({
        category: invoiceData.category,
        subCategory: invoiceData.subCategory,
        remark: invoiceData.remark
      }, null, 2));
      console.log("=== END REQUEST ===");

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to save invoice");
      }

      // Success - navigate appropriately
      if (isEditMode) {
        navigate(`/sales/invoices/${id}`);
      } else {
        navigate("/sales/invoices");
      }
    } catch (error) {
      console.error("Error saving invoice:", error);
      alert(error.message || "Failed to save invoice. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Complete and corrected mapping from branch names to location codes
  const branchToLocCodeMap = {
    // Main office and special locations
    "Head Office": "759",
    "Warehouse": "858",
    "WAREHOUSE": "103",
    "Production": "101",
    "Office": "102",
    
    // G. prefix stores (main branches)
    "Calicut": "712",
    "Chavakkad Branch": "706",
    "Edapally Branch": "702",
    "Edappal Branch": "707",
    "Grooms Trivandrum": "700",
    "Kalpetta Branch": "717",
    "Kannur Branch": "716",
    "Kottakkal Branch": "711",  // ✅ FIXED: was 122, now 711 (G.Kottakkal)
    "Kottayam Branch": "701",
    "Manjery Branch": "710",
    "Palakkad Branch": "705",
    "Perinthalmanna Branch": "709",  // ✅ FIXED: was 133, now 709 (G.Perinthalmanna)
    "Perumbavoor Branch": "703",
    "SuitorGuy MG Road": "718",
    "Thrissur Branch": "704",
    "Vadakara Branch": "708",
    
    // Z. prefix stores (franchise/other branches)
    "Z-Edapally1 Branch": "144",
    "Z-Edappal Branch": "100",
    "Z-Perinthalmanna Branch": "133",  // This is the Z. version
    "Z-Kottakkal Branch": "122",       // This is the Z. version
  };

  // Get location code for selected branch
  const getLocCodeForBranch = (branchName) => {
    return branchToLocCodeMap[branchName] || null;
  };

  // Get user location code from localStorage (for default store creation)
  useEffect(() => {
    try {
      const userStr = localStorage.getItem("rootfinuser");
      if (userStr) {
        const user = JSON.parse(userStr);
        const locCode = user?.locCode || "";
        setUserLocCode(locCode);
      }
    } catch (error) {
      console.error("Error parsing user from localStorage:", error);
    }
  }, []);

  // Load invoice data when in edit mode
  useEffect(() => {
    if (isEditMode && id) {
      const loadInvoiceData = async () => {
        try {
          const response = await fetch(`${API_URL}/api/sales/invoices/${id}`);
          if (!response.ok) {
            throw new Error(`Failed to fetch invoice: ${response.statusText}`);
          }
          const invoiceData = await response.json();
          
          // Populate form fields with invoice data
          setCustomer(invoiceData.customer || "");
          setCustomerPhone(invoiceData.customerPhone || "");
          setBranch(invoiceData.branch || "Head Office");
          setOrderNumber(invoiceData.orderNumber || "");
          setInvoiceNumber(invoiceData.invoiceNumber || "");
          setInvoiceDate(invoiceData.invoiceDate ? new Date(invoiceData.invoiceDate).toISOString().slice(0, 10) : "");
          setDueDate(invoiceData.dueDate ? new Date(invoiceData.dueDate).toISOString().slice(0, 10) : "");
          setTerms(invoiceData.terms || "Due on Receipt");
          setSalesperson(invoiceData.salesperson || "");
          setSubject(invoiceData.subject || "");
          setWarehouse(invoiceData.warehouse || "");
          setCategory(invoiceData.category || "");
          setSubCategory(invoiceData.subCategory || "");
          setRemark(invoiceData.remark || "");
          setPaymentMethod(invoiceData.paymentMethod || "");
          
          // Set line items
          if (invoiceData.lineItems && invoiceData.lineItems.length > 0) {
            setLineItems(invoiceData.lineItems);
          }
          
          // Set discount
          if (invoiceData.discount) {
            setDiscount(invoiceData.discount);
          }
          
          // Set tax and adjustment
          setTax(invoiceData.tax || "");
          setAdjustment(invoiceData.adjustmentAmount || "0.00");
          
        } catch (error) {
          console.error("Error loading invoice data:", error);
          alert("Failed to load invoice data");
        }
      };
      
      loadInvoiceData();
    }
  }, [isEditMode, id, API_URL]);

  // Fetch sales persons for the selected branch
  useEffect(() => {
    const branchLocCode = getLocCodeForBranch(branch);
    
    if (branchLocCode) {
      setLoadingSalesPersons(true);
      // Clear selected salesperson when branch changes
      setSalesperson("");
      
      console.log(`Fetching sales persons for branch: ${branch}, locCode: ${branchLocCode}`);
      
      fetch(`${API_URL}/api/sales-persons/loc/${branchLocCode}`)
        .then(res => {
          if (res.status === 404) {
            // Store doesn't exist for this branch yet - that's okay
            console.log(`Store not found for branch: ${branch} (locCode: ${branchLocCode})`);
            setSalesPersons([]);
            return null;
          }
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then(data => {
          if (data && data.salesPersons && Array.isArray(data.salesPersons)) {
            console.log(`Found ${data.salesPersons.length} sales persons for ${branch}:`, data.salesPersons.map(sp => `${sp.firstName} ${sp.lastName}`));
            // Format sales persons for display: "FirstName LastName"
            const formatted = data.salesPersons.map(sp => ({
              id: sp.id,
              name: `${sp.firstName} ${sp.lastName}`,
              fullName: `${sp.firstName} ${sp.lastName}`,
              ...sp
            }));
            setSalesPersons(formatted);
          } else {
            console.log(`No sales persons found for branch: ${branch}`);
            setSalesPersons([]);
          }
        })
        .catch(err => {
          console.error(`Error fetching sales persons for branch ${branch} (locCode: ${branchLocCode}):`, err);
          setSalesPersons([]);
        })
        .finally(() => setLoadingSalesPersons(false));
    } else {
      // No location code for this branch
      console.warn(`No location code mapping found for branch: ${branch}`);
      setSalesPersons([]);
      setSalesperson("");
    }
  }, [branch, API_URL]);

  // Handle adding new sales person
  const handleAddSalesPerson = async () => {
    // Validate visible fields first
    if (!newSalesPerson.firstName.trim() || !newSalesPerson.lastName.trim() || 
        !newSalesPerson.employeeId.trim() || !newSalesPerson.phone.trim()) {
      alert("Please fill all required fields (First Name, Last Name, Employee ID, and Phone)");
      return;
    }

    // Get location code for the selected branch
    const branchLocCode = getLocCodeForBranch(branch);
    
    if (!branchLocCode) {
      alert(`Unable to determine location code for branch: ${branch}. Please contact administrator.`);
      return;
    }

    // Check if store exists, if not create it
    let storeIdToUse = null;
    
    try {
      // First, try to fetch the store
      const fetchStoreResponse = await fetch(`${API_URL}/api/stores/loc/${branchLocCode}`);
      
      if (fetchStoreResponse.ok) {
        const fetchStoreData = await fetchStoreResponse.json();
        if (fetchStoreData.store && fetchStoreData.store.id) {
          storeIdToUse = fetchStoreData.store.id;
          console.log(`Found existing store for ${branch}: ${fetchStoreData.store.name} (ID: ${storeIdToUse})`);
        }
      }
      
      // If store doesn't exist, create it
      if (!storeIdToUse) {
        console.log(`Creating new store for branch: ${branch} with locCode: ${branchLocCode}`);
        const storeResponse = await fetch(`${API_URL}/api/stores`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: branch, // Use branch name as store name
            locCode: branchLocCode,
            // Don't include email field - let it use default empty string
          }),
        });

        const storeData = await storeResponse.json();
        
        if (storeResponse.ok && storeData.store && storeData.store.id) {
          storeIdToUse = storeData.store.id;
          console.log(`Created new store for ${branch}: ${storeData.store.name} (ID: ${storeIdToUse})`);
        } else {
          console.error(`Failed to create store:`, storeData);
          alert(`Unable to create store for branch: ${branch}. ${storeData.message || storeData.errors || 'Please contact administrator.'}`);
          return;
        }
      }
    } catch (error) {
      console.error("Error creating/fetching store:", error);
      alert(`Unable to find or create store for branch: ${branch}. Please contact administrator.`);
      return;
    }

    if (!storeIdToUse) {
      alert("Store information is missing. Please refresh the page or contact administrator.");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/sales-persons`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstName: newSalesPerson.firstName.trim(),
          lastName: newSalesPerson.lastName.trim(),
          employeeId: newSalesPerson.employeeId.trim(),
          phone: newSalesPerson.phone.trim(),
          email: newSalesPerson.email.trim() || "",
          storeId: storeIdToUse,
        }),
      });

      const data = await response.json();

      if (response.ok && data.salesPerson) {
        const sp = data.salesPerson;
        const formattedName = `${sp.firstName} ${sp.lastName}`;
        
        console.log(`Sales person ${formattedName} created successfully for branch: ${branch} (locCode: ${branchLocCode})`);
        
        // Refresh the sales persons list by fetching again
        const refreshResponse = await fetch(`${API_URL}/api/sales-persons/loc/${branchLocCode}`);
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          if (refreshData && refreshData.salesPersons && Array.isArray(refreshData.salesPersons)) {
            const formatted = refreshData.salesPersons.map(sp => ({
              id: sp.id,
              name: `${sp.firstName} ${sp.lastName}`,
              fullName: `${sp.firstName} ${sp.lastName}`,
              ...sp
            }));
            setSalesPersons(formatted);
          }
        }
        
        setSalesperson(formattedName);
        setShowSalesPersonModal(false);
        setNewSalesPerson({
          firstName: "",
          lastName: "",
          employeeId: "",
          phone: "",
          email: "",
        });
      } else {
        alert(data.message || "Failed to create sales person");
      }
    } catch (error) {
      console.error("Error creating sales person:", error);
      alert("Error creating sales person: " + (error.message || "Unknown error"));
    }
  };

  const handleLineItemChange = (id, key, value) => {
    const allTaxOptions = [...taxOptions, ...nonTaxableOptions];
    const discountConfig = {
      value: discount.value,
      type: discount.type,
      applyAfterTax: applyDiscountAfterTax,
    };

    setLineItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          let updated = { ...item };

          if (key === "item" && typeof value === 'object' && value !== null) {
            // When item is selected from dropdown
            const itemData = value;
            const sellingPrice = typeof itemData.sellingPrice === 'number' ? itemData.sellingPrice : (typeof itemData.costPrice === 'number' ? itemData.costPrice : 0);
            updated = {
              ...updated,
              item: itemData.itemName || "",
              itemData: itemData,
              rate: sellingPrice,
            };
          } else {
            updated = {
              ...updated,
              [key]: value,
            };
          }

          // Recalculate GST for the updated item
          const gstCalculation = calculateGSTLineItem(updated, discountConfig, allTaxOptions);
          return {
            ...updated,
            ...gstCalculation,
            baseAmount: parseFloat(gstCalculation.baseAmount),
            discountedAmount: parseFloat(gstCalculation.discountedAmount),
            cgstAmount: parseFloat(gstCalculation.cgstAmount),
            sgstAmount: parseFloat(gstCalculation.sgstAmount),
            igstAmount: parseFloat(gstCalculation.igstAmount),
            lineTaxTotal: parseFloat(gstCalculation.lineTaxTotal),
            lineTotal: parseFloat(gstCalculation.lineTotal),
            amount: parseFloat(gstCalculation.baseAmount),
            taxPercent: gstCalculation.taxPercent,
            cgstPercent: gstCalculation.cgstPercent,
            sgstPercent: gstCalculation.sgstPercent,
            igstPercent: gstCalculation.igstPercent,
            isInterState: gstCalculation.isInterState,
          };
        }
        return item;
      })
    );
  };

  const handleQuantityChange = (id, value) => {
    handleLineItemChange(id, "quantity", Number(value) || 0);
  };

  const handleRateChange = (id, value) => {
    handleLineItemChange(id, "rate", Number(value) || 0);
  };

  // Recalculate line items when discount changes
  useEffect(() => {
    if (lineItems.length === 0) return;
    
    const allTaxOptions = [...taxOptions, ...nonTaxableOptions];
    const discountConfig = {
      value: discount.value,
      type: discount.type,
      applyAfterTax: applyDiscountAfterTax,
    };

    setLineItems(prevItems => 
      prevItems.map(item => {
        const gstCalculation = calculateGSTLineItem(item, discountConfig, allTaxOptions);
        return {
          ...item,
          ...gstCalculation,
          baseAmount: parseFloat(gstCalculation.baseAmount),
          discountedAmount: parseFloat(gstCalculation.discountedAmount),
          cgstAmount: parseFloat(gstCalculation.cgstAmount),
          sgstAmount: parseFloat(gstCalculation.sgstAmount),
          igstAmount: parseFloat(gstCalculation.igstAmount),
          lineTaxTotal: parseFloat(gstCalculation.lineTaxTotal),
          lineTotal: parseFloat(gstCalculation.lineTotal),
          amount: parseFloat(gstCalculation.baseAmount),
          taxPercent: gstCalculation.taxPercent,
          cgstPercent: gstCalculation.cgstPercent,
          sgstPercent: gstCalculation.sgstPercent,
          igstPercent: gstCalculation.igstPercent,
          isInterState: gstCalculation.isInterState,
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discount.value, discount.type, applyDiscountAfterTax]);

  const addLineItem = () => {
    setLineItems((prev) => [...prev, blankLineItem()]);
  };

  const removeLineItem = (id) => {
    setLineItems((prev) => (prev.length > 1 ? prev.filter((item) => item.id !== id) : prev));
  };

  // Removed toggleTds - now using tdsTcsType state with radio buttons

  // Handle saving new tax
  const handleSaveNewTax = () => {
    if (!newTax.name || !newTax.rate) {
      alert("Please fill in Tax Name and Rate");
      return;
    }
    const taxOption = {
      id: `gst${newTax.rate}`,
      name: newTax.name,
      rate: parseFloat(newTax.rate),
      display: `${newTax.name} [${newTax.rate}%]`,
    };
    setTaxOptions([...taxOptions, taxOption]);
    setNewTax({ name: "", rate: "", type: "" });
    setShowNewTaxModal(false);
  };

  // Label component
  const Label = ({ children, required = false }) => (
    <span className={`text-xs font-semibold uppercase tracking-[0.18em] ${required ? "text-[#ef4444]" : "text-[#64748b]"} mb-2 block`}>
      {children}
      {required && <span className="ml-0.5">*</span>}
    </span>
  );

  // Improved Select component with better styling
  const Select = ({ className = "", ...props }) => {
    const baseClasses = "w-full rounded-lg border border-[#e5e7eb] bg-white text-sm text-[#111827] hover:border-[#d1d5db] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all cursor-pointer px-3 py-2.5 appearance-none bg-no-repeat bg-right pr-10";
    return (
      <select
        {...props}
        className={`${baseClasses} ${className}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%239ca3af' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
          backgroundPosition: 'right 10px center',
          backgroundRepeat: 'no-repeat',
          paddingRight: '32px'
        }}
      />
    );
  };

  return (
    <div className="min-h-screen bg-[#f6f8ff]">
      <Head
        title={isEditMode ? "Edit Invoice" : "New Invoice"}
        description={isEditMode ? "Edit an existing customer invoice." : "Prepare a customer invoice with itemized billing."}
        actions={
          <Link
            to="/sales/invoices"
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#d7def4] px-4 text-sm font-medium text-[#1f2937] transition hover:bg-white"
          >
            Back to Invoices
          </Link>
        }
      />

      <div className="ml-64 px-6 pb-16 pt-6 bg-[#f8f9fc] min-h-screen">
        {/* Header Section */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-[#2563eb] to-[#1d4ed8] text-2xl shadow-lg">
              📄
            </div>
            <div>
              <h1 className="text-3xl font-bold text-[#111827]">{isEditMode ? "Edit Invoice" : "Create Invoice"}</h1>
              <p className="text-sm text-[#6b7280] mt-1">{isEditMode ? "Update invoice details" : "Create a new sales invoice"}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowInvoiceSettingsModal(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-[#4b5563] hover:bg-[#f9fafb] transition-colors"
            >
              <Settings size={18} />
              Settings
            </button>
            <button
              onClick={() => navigate("/sales/invoices")}
              className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-[#4b5563] hover:bg-[#f9fafb] transition-colors"
            >
              <X size={18} />
              Close
            </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="rounded-2xl border border-[#e5e7eb] bg-white shadow-sm">
          {/* Top Section - Customer & Invoice Info */}
          <div className="border-b border-[#e5e7eb] px-8 py-8">
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Customer Section */}
              <div className="lg:col-span-2">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#6b7280]">Bill To</h2>
                <div className="space-y-4">
                  <Field label="Customer Name" required>
                    <input
                      type="text"
                      value={customer}
                      onChange={(event) => setCustomer(event.target.value)}
                      placeholder="Enter customer name"
                      className={`${controlBase} text-base`}
                    />
                  </Field>
                  <Field label="Phone Number">
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(event) => setCustomerPhone(event.target.value)}
                      placeholder="Enter customer phone"
                      className={controlBase}
                    />
                  </Field>
                </div>
              </div>

              {/* Invoice Details Section */}
              <div>
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-[#6b7280]">Invoice Details</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#6b7280] mb-2">Invoice Number</label>
                    <div className="flex items-center gap-2 rounded-lg border border-[#d4dbf4] bg-[#f9faff] px-4 py-3">
                      <input
                        value={invoiceNumber}
                        onChange={(event) => setInvoiceNumber(event.target.value)}
                        className="flex-1 border-0 bg-transparent text-sm font-semibold text-[#111827] focus:outline-none focus:ring-0"
                      />
                      <button 
                        onClick={() => setShowInvoiceSettingsModal(true)}
                        className="text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
                        title="Auto-generate"
                      >
                        <Settings size={16} />
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6b7280] mb-2">Invoice Date</label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(event) => setInvoiceDate(event.target.value)}
                      className={controlBase}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#6b7280] mb-2">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                      className={controlBase}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Info Section */}
          <div className="border-b border-[#e5e7eb] px-8 py-8">
            <div className="grid gap-6 lg:grid-cols-3">
              <div>
                <label className="block text-xs font-semibold text-[#6b7280] mb-2">
                  Branch
                  {storeAccess.isStoreUser && <span className="text-[#ef4444] ml-1">(Store User)</span>}
                </label>
                {storeAccess.isStoreUser ? (
                  <input
                    type="text"
                    value={branch}
                    readOnly
                    className="w-full rounded-lg border border-[#e5e7eb] bg-[#f9fafb] px-3 py-2.5 text-sm text-[#111827] cursor-not-allowed opacity-75"
                    title="Your branch is automatically set based on your store account"
                  />
                ) : (
                  <Select
                    value={branch}
                    onChange={(event) => {
                      const selectedBranch = event.target.value;
                      setBranch(selectedBranch);
                      // Map the branch name to the correct warehouse name
                      const mappedWarehouse = mapLocNameToWarehouse(selectedBranch);
                      setWarehouse(mappedWarehouse);
                      console.log(`🏢 Admin branch selection: "${selectedBranch}" → warehouse: "${mappedWarehouse}"`);
                    }}
                  >
                  <option value="Head Office">Head Office</option>
                  <option value="Warehouse">Warehouse</option>
                  <option value="WAREHOUSE">WAREHOUSE</option>
                  <option value="Production">Production</option>
                  <option value="Office">Office</option>
                  <option value="Calicut">Calicut</option>
                  <option value="Chavakkad Branch">Chavakkad Branch</option>
                  <option value="Edapally Branch">Edapally Branch</option>
                  <option value="Edappal Branch">Edappal Branch</option>
                  <option value="Grooms Trivandrum">Grooms Trivandrum</option>
                  <option value="Kalpetta Branch">Kalpetta Branch</option>
                  <option value="Kannur Branch">Kannur Branch</option>
                  <option value="Kottakkal Branch">Kottakkal Branch</option>
                  <option value="Kottayam Branch">Kottayam Branch</option>
                  <option value="Manjery Branch">Manjery Branch</option>
                  <option value="Palakkad Branch">Palakkad Branch</option>
                  <option value="Perinthalmanna Branch">Perinthalmanna Branch</option>
                  <option value="Perumbavoor Branch">Perumbavoor Branch</option>
                  <option value="SuitorGuy MG Road">SuitorGuy MG Road</option>
                  <option value="Thrissur Branch">Thrissur Branch</option>
                  <option value="Vadakara Branch">Vadakara Branch</option>
                  <option value="Z-Edapally1 Branch">Z-Edapally1 Branch</option>
                  <option value="Z-Edappal Branch">Z-Edappal Branch</option>
                  <option value="Z-Perinthalmanna Branch">Z-Perinthalmanna Branch</option>
                  <option value="Z-Kottakkal Branch">Z-Kottakkal Branch</option>
                  </Select>
                )}
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b7280] mb-2">Order Number</label>
                <input
                  value={orderNumber}
                  onChange={(event) => setOrderNumber(event.target.value)}
                  placeholder="Optional"
                  className={controlBase}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b7280] mb-2">Terms</label>
                <Select
                  value={terms}
                  onChange={(event) => setTerms(event.target.value)}
                >
                  <option value="Due on Receipt">Due on Receipt</option>
                  <option value="Net 7">Net 7</option>
                  <option value="Net 15">Net 15</option>
                  <option value="Net 30">Net 30</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Transaction Details Section */}
          <div className="border-b border-[#e5e7eb] px-8 py-8 bg-[#f9fafb]">
            <h2 className="mb-6 text-sm font-semibold uppercase tracking-wide text-[#6b7280]">Transaction Details</h2>
            <div className="grid gap-6 lg:grid-cols-4">
              <div>
                <label className="block text-xs font-semibold text-[#6b7280] mb-2">Category</label>
                <Select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                >
                  <option value="">Select category</option>
                  <option value="booking">Booking</option>
                  <option value="RentOut">Rent Out</option>
                  <option value="shoe sales">Shoe Sales</option>
                  <option value="shirt sales">Shirt Sales</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="Refund">Refund</option>
                  <option value="Return">Return</option>
                  <option value="Cancel">Cancel</option>
                  <option value="money transfer">Cash to Bank</option>
                  <option value="Compensation">Compensation</option>
                </Select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b7280] mb-2">Sub Category</label>
                <SubCategoryDropdown 
                  value={subCategory}
                  onChange={setSubCategory}
                  subtleControlBase={subtleControlBase}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b7280] mb-2">Payment Method</label>
                <Select
                  value={paymentMethod}
                  onChange={(event) => setPaymentMethod(event.target.value)}
                >
                  <option value="">Select method</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                  <option value="UPI">UPI</option>
                  <option value="RBL">RBL</option>
                </Select>
              </div>
            </div>
            <div className="mt-6">
              <label className="block text-xs font-semibold text-[#6b7280] mb-2">Remark</label>
              <input
                type="text"
                value={remark}
                onChange={(event) => setRemark(event.target.value)}
                placeholder="Add any notes or remarks"
                className={controlBase}
              />
            </div>
          </div>

          {/* Items Section */}
          <div className="border-b border-[#e5e7eb] px-8 py-8">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[#6b7280]">Line Items</h2>
              <div className="flex items-center gap-2">
                <button 
                  onClick={handleOpenScanModal}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#4b5563] hover:bg-[#f9fafb] transition-colors"
                >
                  📱 Scan
                </button>
                <button 
                  onClick={() => {
                    setShowBulkModal(true);
                    loadAllBulkItems();
                  }}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#4b5563] hover:bg-[#f9fafb] transition-colors"
                >
                  📦 Bulk Add
                </button>
              </div>
            </div>

            <div className="overflow-x-auto rounded-lg border border-[#e5e7eb]">
              <table className="min-w-full divide-y divide-[#e5e7eb]">
                <thead className="bg-[#f3f4f6]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] w-[40px]">
                      <input type="checkbox" className="h-4 w-4 rounded border-[#d1d5db] text-[#2563eb]" />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280]">
                      Item
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] w-[80px]">
                      Size
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-[#6b7280] w-[100px]">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6b7280] w-[100px]">
                      Rate
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-[#6b7280] w-[120px]">
                      Tax
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wider text-[#6b7280] w-[100px]">
                      Amount
                    </th>
                    <th className="px-4 py-3 w-[40px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e5e7eb] bg-white">
                  {lineItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-[#f9fafb] transition-colors">
                      <td className="px-4 py-4 align-top">
                        <input
                          type="checkbox"
                          className="h-4 w-4 rounded border-[#d1d5db] text-[#2563eb]"
                        />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f3f4f6]">
                            <ImageIcon size={18} className="text-[#9ca3af]" />
                          </div>
                          <ItemDropdown
                            rowId={item.id}
                            value={item.itemData || item.item}
                            onChange={(value) => handleLineItemChange(item.id, "item", value)}
                            warehouse={warehouse}
                            onNewItem={() => navigate("/shoe-sales/items/new")}
                            isStoreUser={storeAccess.isStoreUser}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top">
                        <input
                          value={item.size}
                          onChange={(event) => handleLineItemChange(item.id, "size", event.target.value)}
                          placeholder="—"
                          className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827] placeholder:text-[#d1d5db] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors"
                        />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <input
                          type="number"
                          min={0}
                          value={item.quantity}
                          onChange={(event) => handleQuantityChange(item.id, event.target.value)}
                          className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827] text-center focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors"
                        />
                      </td>
                      <td className="px-4 py-4 align-top text-right">
                        <input
                          type="number"
                          min={0}
                          value={item.rate}
                          onChange={(event) => handleRateChange(item.id, event.target.value)}
                          className="w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#111827] text-right focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors"
                        />
                      </td>
                      <td className="px-4 py-4 align-top">
                        <TaxDropdown
                          rowId={item.id}
                          value={item.tax}
                          onChange={(value) => handleLineItemChange(item.id, "tax", value)}
                          taxOptions={taxOptions}
                          nonTaxableOptions={nonTaxableOptions}
                          onNewTax={() => setShowNewTaxModal(true)}
                        />
                      </td>
                      <td className="px-4 py-4 align-top text-right">
                        <div className="text-right">
                          <div className="text-sm font-semibold text-[#111827]">₹{item.lineTotal}</div>
                          {item.taxPercent > 0 && (
                            <div className="text-xs text-[#6b7280] mt-1">
                              {item.isInterState ? (
                                <div>IGST {item.igstPercent}%: ₹{item.igstAmount}</div>
                              ) : (
                                <>
                                  <div>CGST {item.cgstPercent}%: ₹{item.cgstAmount}</div>
                                  <div>SGST {item.sgstPercent}%: ₹{item.sgstAmount}</div>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4 align-top text-center">
                        <button
                          onClick={() => removeLineItem(item.id)}
                          className="inline-flex items-center justify-center h-8 w-8 rounded-md text-[#ef4444] hover:bg-[#fee2e2] transition-colors"
                        >
                          <X size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={addLineItem}
                className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2.5 text-sm font-medium text-[#4b5563] hover:bg-[#f9fafb] transition-colors"
              >
                <Plus size={18} />
                Add Row
              </button>
            </div>
          </div>

          {/* Notes & Summary Section */}
          <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.25fr)] px-8 py-8">
            {/* Left Column - Notes */}
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-[#6b7280] mb-2">Customer Notes</label>
                <textarea
                  value={customerNotes}
                  onChange={(event) => setCustomerNotes(event.target.value)}
                  className={`${textareaBase} h-24 bg-[#f9fafb]`}
                />
                <p className="text-xs text-[#9ca3af] mt-2">Displayed on the invoice</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b7280] mb-2">Terms & Conditions</label>
                <textarea
                  value={termsAndConditions}
                  onChange={(event) => setTermsAndConditions(event.target.value)}
                  placeholder="Enter terms and conditions"
                  className={`${textareaBase} h-24 bg-[#f9fafb]`}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#6b7280] mb-2">Attachments</label>
                <div className="flex flex-wrap items-center gap-3 rounded-lg border-2 border-dashed border-[#e5e7eb] bg-[#f9fafb] px-4 py-6">
                  <button className="inline-flex items-center gap-2 rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#2563eb] hover:bg-[#f3f4f6] transition-colors">
                    📎 Upload
                  </button>
                  <span className="text-xs text-[#9ca3af]">Max 10 files, 10MB each</span>
                </div>
              </div>
            </div>

            {/* Right Column - Summary */}
            <div className="space-y-6">
              {/* Sub Total - Tax Inclusive */}
              <div className="flex items-start justify-between pb-4 border-b border-[#e5e7eb]">
                <div>
                  <div className="text-sm font-medium text-[#111827]">Sub Total</div>
                  <div className="text-xs text-[#6b7280]">(Tax Inclusive)</div>
                </div>
                <span className="text-lg font-semibold text-[#111827]">₹{totals.subTotal}</span>
              </div>

              {/* Tax Breakdown - Show CGST/SGST or IGST */}
              {totals.taxBreakdown.length > 0 && (
                <div className="space-y-3">
                  {totals.taxBreakdown.map((tax, idx) => {
                    // For GST (intra-state), split into CGST and SGST
                    if (tax.type === 'GST') {
                      const cgstAmount = tax.amount / 2;
                      const sgstAmount = tax.amount / 2;
                      const cgstPercent = tax.rate / 2;
                      const sgstPercent = tax.rate / 2;
                      return (
                        <div key={idx} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#6b7280]">CGST{cgstPercent} [{cgstPercent}%]</span>
                            <span className="text-sm font-medium text-[#111827]">₹{cgstAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-[#6b7280]">SGST{sgstPercent} [{sgstPercent}%]</span>
                            <span className="text-sm font-medium text-[#111827]">₹{sgstAmount.toFixed(2)}</span>
                          </div>
                        </div>
                      );
                    }
                    // For IGST (inter-state), show as single line
                    return (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-sm text-[#6b7280]">IGST{tax.rate} [{tax.rate}%]</span>
                        <span className="text-sm font-medium text-[#111827]">₹{tax.amount.toFixed(2)}</span>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* TDS/TCS Section */}
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tdsTcsType"
                      value="TDS"
                      checked={tdsTcsType === "TDS"}
                      onChange={(e) => {
                        setTdsTcsType(e.target.value);
                        setTdsTcsTax("");
                      }}
                      className="w-4 h-4 text-[#2563eb]"
                    />
                    <span className="text-sm text-[#6b7280]">TDS</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="tdsTcsType"
                      value="TCS"
                      checked={tdsTcsType === "TCS"}
                      onChange={(e) => {
                        setTdsTcsType(e.target.value);
                        setTdsTcsTax("");
                      }}
                      className="w-4 h-4 text-[#2563eb]"
                    />
                    <span className="text-sm text-[#6b7280]">TCS</span>
                  </label>
                  <div className="flex-1">
                    <TaxDropdown
                      rowId="tds-tcs"
                      value={tdsTcsTax}
                      onChange={setTdsTcsTax}
                      taxOptions={tdsTcsType === "TDS" ? tdsOptions : taxOptions}
                      nonTaxableOptions={tdsTcsType === "TDS" ? [] : nonTaxableOptions}
                      onNewTax={() => setShowNewTaxModal(true)}
                    />
                  </div>
                  <span className="text-sm font-medium text-[#111827] whitespace-nowrap">- {totals.tdsTcsAmount}</span>
                </div>
              </div>

              {/* Discount Section */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-[#6b7280]">Discount</span>
                <input
                  type="text"
                  placeholder=""
                  className="flex-1 rounded-md border border-[#d1d5db] px-3 py-2 text-sm text-[#111827] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                />
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-10 w-10 rounded-md bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors"
                  title="Discount help"
                >
                  <HelpCircle size={18} />
                </button>
                <span className="text-sm font-medium text-[#111827] w-16 text-right">₹{totals.discountAmount}</span>
              </div>

              {/* Final Total */}
              <div className="flex items-center justify-between pt-4 border-t border-[#e5e7eb]">
                <span className="text-base font-bold text-[#111827]">Total ( ₹ )</span>
                <span className="text-3xl font-bold text-[#2563eb]">₹{totals.finalTotal}</span>
              </div>
            </div>
          </div>

          {/* Footer with Action Buttons */}
          <div className="border-t border-[#e5e7eb] px-8 py-6 bg-[#f9fafb] flex items-center justify-between">
            <div className="text-sm text-[#6b7280]">
              <span className="font-medium text-[#111827]">{lineItems.length}</span> item{lineItems.length !== 1 ? 's' : ''} • 
              <span className="font-medium text-[#111827] ml-2">₹{totals.finalTotal}</span>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => handleSaveInvoice("draft")}
                disabled={isSaving}
                className="rounded-lg border border-[#e5e7eb] bg-white px-6 py-2.5 text-sm font-medium text-[#4b5563] hover:bg-[#f9fafb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save as Draft"}
              </button>
              <button 
                onClick={() => handleSaveInvoice("sent")}
                disabled={isSaving}
                className="rounded-lg bg-gradient-to-r from-[#2563eb] to-[#1d4ed8] px-6 py-2.5 text-sm font-semibold text-white hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving..." : "Save & Send"}
              </button>
              <button
                onClick={() => navigate("/sales/invoices")}
                disabled={isSaving}
                className="rounded-lg border border-[#e5e7eb] bg-white px-6 py-2.5 text-sm font-medium text-[#4b5563] hover:bg-[#f9fafb] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Person Modal */}
      {showSalesPersonModal && (
        <SalesPersonModal
          onClose={() => {
            setShowSalesPersonModal(false);
            setNewSalesPerson({
              firstName: "",
              lastName: "",
              employeeId: "",
              phone: "",
              email: "",
            });
          }}
          onAdd={handleAddSalesPerson}
          newSalesPerson={newSalesPerson}
          setNewSalesPerson={setNewSalesPerson}
        />
      )}

      {/* Add Items in Bulk Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-7xl max-h-[90vh] rounded-2xl border border-[#e1e5f5] bg-white shadow-[0_25px_80px_-45px_rgba(15,23,42,0.35)] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-[#e7ebf8] px-6 py-4 bg-white">
              <h2 className="text-xl font-semibold text-[#1f2937]">Add Items in Bulk</h2>
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkSearchTerm("");
                  setBulkResults([]);
                  setSelectedBulkItems([]);
                }}
                className="rounded-lg p-2 text-[#9ca3af] hover:bg-[#f1f5f9] hover:text-[#475569] transition-colors"
                aria-label="Close"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="flex flex-1 min-h-0">
              {/* Left side - Search and Results */}
              <div className="flex-1 border-r border-[#e7ebf8] flex flex-col">
                <div className="p-6 border-b border-[#f1f5f9]">
                  <div className="relative">
                    <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#9ca3af]" />
                    <input
                      type="text"
                      value={bulkSearchTerm}
                      onChange={(e) => {
                        setBulkSearchTerm(e.target.value);
                        handleBulkSearch(e.target.value);
                      }}
                      placeholder="Type to search or scan the barcode of the item"
                      className="w-full pl-12 pr-4 py-4 text-sm border border-[#e5e7eb] rounded-xl focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20 transition-all"
                      autoFocus
                    />
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {isScanning && (
                    <div className="text-center py-12">
                      <div className="animate-spin w-8 h-8 border-2 border-[#2563eb] border-t-transparent rounded-full mx-auto mb-4"></div>
                      <div className="text-sm text-[#6b7280]">Loading items...</div>
                    </div>
                  )}
                  
                  {!isScanning && bulkResults.length === 0 && bulkSearchTerm && (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">🔍</div>
                      <div className="text-lg font-medium text-[#1f2937] mb-2">No items found</div>
                      <div className="text-sm text-[#6b7280]">No items match "{bulkSearchTerm}"</div>
                    </div>
                  )}
                  
                  {!isScanning && bulkResults.length > 0 && (
                    <div className="grid gap-3">
                      {bulkResults.map((item) => {
                        const isSelected = selectedBulkItems.some(selected => selected._id === item._id);
                        const stockOnHand = item.warehouseStocks?.reduce((sum, ws) => sum + (parseFloat(ws.stockOnHand) || 0), 0) || 0;
                        const rate = item.sellingPrice || item.costPrice || 0;
                        
                        return (
                          <div
                            key={item._id}
                            onClick={() => toggleBulkItemSelection(item)}
                            className={`group relative flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 ${
                              isSelected 
                                ? 'border-[#2563eb] bg-[#eff6ff] shadow-md' 
                                : 'border-[#e5e7eb] hover:border-[#d1d5db] hover:shadow-sm'
                            }`}
                          >
                            {/* Selection Checkbox */}
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                              isSelected 
                                ? 'border-[#2563eb] bg-[#2563eb] shadow-sm' 
                                : 'border-[#d1d5db] group-hover:border-[#9ca3af]'
                            }`}>
                              {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                            </div>
                            
                            {/* Item Image Placeholder */}
                            <div className="w-12 h-12 bg-[#f8fafc] border border-[#e5e7eb] rounded-lg flex items-center justify-center flex-shrink-0">
                              <ImageIcon size={20} className="text-[#9ca3af]" />
                            </div>
                            
                            {/* Item Details */}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-[#1f2937] text-base mb-1 truncate">
                                {item.itemName}
                              </div>
                              <div className="text-sm text-[#6b7280] mb-2">
                                <span className="font-medium">SKU:</span> {item.sku || 'N/A'} • 
                                <span className="font-medium ml-1">Rate:</span> ₹{rate.toFixed(2)}
                              </div>
                              {item.groupName && (
                                <div className="text-xs text-[#9ca3af] bg-[#f1f5f9] px-2 py-1 rounded-md inline-block">
                                  Group: {item.groupName}
                                </div>
                              )}
                            </div>
                            
                            {/* Stock Information */}
                            <div className="text-right flex-shrink-0">
                              <div className="text-xs font-medium text-[#6b7280] mb-1">Stock on Hand</div>
                              <div className={`text-lg font-bold ${stockOnHand > 0 ? 'text-[#10b981]' : 'text-[#ef4444]'}`}>
                                {stockOnHand.toFixed(1)} <span className="text-sm font-normal">pcs</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  
                  {!isScanning && bulkResults.length === 0 && !bulkSearchTerm && (
                    <div className="text-center py-12">
                      <div className="text-6xl mb-4">📦</div>
                      <div className="text-xl font-semibold text-[#1f2937] mb-2">Add Items in Bulk</div>
                      <div className="text-sm text-[#6b7280]">
                        Loading available items...
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right side - Selected Items */}
              <div className="w-96 bg-[#fafbff] flex flex-col">
                <div className="p-6 border-b border-[#e7ebf8] bg-white">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-[#1f2937]">Selected Items</h3>
                    <div className="bg-[#2563eb] text-white text-sm font-medium px-3 py-1 rounded-full">
                      {selectedBulkItems.length}
                    </div>
                  </div>
                  <div className="text-sm text-[#6b7280]">
                    Total Quantity: <span className="font-medium text-[#1f2937]">{selectedBulkItems.reduce((sum, item) => sum + item.quantity, 0)}</span>
                  </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-4">
                  {selectedBulkItems.length === 0 ? (
                    <div className="text-center py-12">
                      <div className="text-4xl mb-4">📋</div>
                      <div className="text-base font-medium text-[#1f2937] mb-2">No items selected</div>
                      <div className="text-sm text-[#6b7280]">
                        Select items from the left to add them here
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {selectedBulkItems.map((item) => (
                        <div key={item._id} className="bg-white border border-[#e5e7eb] rounded-xl p-4 shadow-sm">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-[#1f2937] text-sm mb-1 truncate">
                                {item.itemName}
                              </div>
                              <div className="text-xs text-[#6b7280] bg-[#f8fafc] px-2 py-1 rounded-md inline-block">
                                [{item.sku}] {item.itemName}
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleBulkItemSelection(item);
                              }}
                              className="text-[#ef4444] hover:text-[#dc2626] hover:bg-[#fef2f2] p-1 rounded-md transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateBulkItemQuantity(item._id, item.quantity - 1);
                                }}
                                className="w-8 h-8 rounded-lg border border-[#d1d5db] flex items-center justify-center text-[#6b7280] hover:bg-[#f3f4f6] hover:border-[#9ca3af] transition-colors"
                              >
                                -
                              </button>
                              <div className="w-12 text-center">
                                <input
                                  type="number"
                                  value={item.quantity}
                                  onChange={(e) => updateBulkItemQuantity(item._id, e.target.value)}
                                  className="w-full text-center text-sm border border-[#e5e7eb] rounded-md py-1 focus:border-[#2563eb] focus:outline-none"
                                  min="1"
                                />
                              </div>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateBulkItemQuantity(item._id, item.quantity + 1);
                                }}
                                className="w-8 h-8 rounded-lg border border-[#d1d5db] flex items-center justify-center text-[#6b7280] hover:bg-[#f3f4f6] hover:border-[#9ca3af] transition-colors"
                              >
                                +
                              </button>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-[#1f2937]">
                                ₹{((item.sellingPrice || item.costPrice || 0) * item.quantity).toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center justify-end gap-3 border-t border-[#e7ebf8] px-6 py-4 bg-[#fafbff]">
              <button
                onClick={() => {
                  setShowBulkModal(false);
                  setBulkSearchTerm("");
                  setBulkResults([]);
                  setSelectedBulkItems([]);
                }}
                className="rounded-md border border-[#d1d5db] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleAddBulkItems}
                disabled={selectedBulkItems.length === 0}
                className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Add Items ({selectedBulkItems.length})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scan Item Modal */}
      {showScanModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-[#e1e5f5] bg-white shadow-[0_25px_80px_-45px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between border-b border-[#e7ebf8] px-6 py-4">
              <h2 className="text-lg font-semibold text-[#1f2937]">📱 Scan Item</h2>
              <button
                onClick={() => setShowScanModal(false)}
                className="rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f1f5f9] hover:text-[#475569] transition-colors"
                aria-label="Close Scan"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5">
              {/* Barcode Scanner Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-[#374151] mb-2">Scan Barcode or Enter SKU</label>
                <input
                  type="text"
                  value={scanInput}
                  onChange={handleScanInputChange}
                  onKeyPress={handleScanKeyPress}
                  onBlur={handleScanInputBlur}
                  placeholder="Scan the barcode or enter SKU and press Enter"
                  className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  autoFocus
                />
                <p className="text-xs text-[#6b7280] mt-2">
                  💡 Tip: Most barcode scanners automatically send Enter after the code
                </p>
              </div>

              {/* Search/Manual Entry */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#374151] mb-2">Or Search for Item</label>
                <input
                  type="text"
                  value={scanSearchTerm}
                  onChange={(e) => {
                    setScanSearchTerm(e.target.value);
                    handleScanSearch(e.target.value);
                  }}
                  placeholder="Search by item name, SKU, or barcode"
                  className="w-full rounded-md border border-[#d1d5db] px-4 py-3 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                />
              </div>
              
              {isScanning && (
                <div className="text-center py-8">
                  <div className="text-sm text-[#6b7280]">Searching items...</div>
                </div>
              )}
              
              {!isScanning && scanResults.length === 0 && scanSearchTerm && (
                <div className="text-center py-8">
                  <div className="text-sm text-[#6b7280]">No items found for "{scanSearchTerm}"</div>
                </div>
              )}
              
              {!isScanning && scanResults.length > 0 && (
                <div className="max-h-96 overflow-y-auto">
                  <div className="space-y-2">
                    {scanResults.map((item) => (
                      <div
                        key={item._id}
                        onClick={() => handleAddScannedItem(item)}
                        className="flex items-center justify-between p-3 border border-[#e5e7eb] rounded-lg hover:bg-[#f9fafb] cursor-pointer transition-colors"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-[#1f2937]">{item.itemName}</div>
                          <div className="text-sm text-[#6b7280]">
                            SKU: {item.sku || 'N/A'} • Rate: ₹{(item.sellingPrice || item.costPrice || 0).toFixed(2)}
                          </div>
                          {item.groupName && (
                            <div className="text-xs text-[#9ca3af]">Group: {item.groupName}</div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-[#10b981]">
                            Stock: {item.warehouseStocks?.reduce((sum, ws) => sum + (parseFloat(ws.stockOnHand) || 0), 0) || 0}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {!scanSearchTerm && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">📱</div>
                  <div className="text-lg font-medium text-[#1f2937] mb-2">Scan Item</div>
                  <div className="text-sm text-[#6b7280]">
                    Use your device camera to scan barcodes or enter item SKU manually
                  </div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-[#e7ebf8] px-6 py-4 bg-[#fafbff]">
              <button
                onClick={handleOpenCamera}
                className="inline-flex items-center gap-2 rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
              >
                📷 Open Camera
              </button>
              <button
                onClick={() => setShowScanModal(false)}
                className="rounded-md border border-[#d1d5db] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Modal for QR Code Scanning */}
      {showCameraModal && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-[#e1e5f5] bg-white shadow-[0_25px_80px_-45px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between border-b border-[#e7ebf8] px-6 py-4">
              <h2 className="text-lg font-semibold text-[#1f2937]">📷 Scan QR Code / Barcode</h2>
              <button
                onClick={handleCloseCamera}
                className="rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f1f5f9] hover:text-[#475569] transition-colors"
                aria-label="Close Camera"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5">
              {cameraError && (
                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="text-sm text-yellow-800">{cameraError}</div>
                </div>
              )}
              
              {/* QR Code Scanner Container */}
              <div id="qr-reader" className="mb-4 rounded-lg overflow-hidden border border-[#e5e7eb]" style={{ minHeight: "300px" }}></div>
              
              {/* External Scanner Input (for keyboard wedge devices) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  🔌 External Barcode Scanner Input
                </label>
                <input
                  ref={externalScannerInputRef}
                  type="text"
                  placeholder="Focus here and scan with external barcode scanner"
                  className="w-full rounded-md border border-[#d1d5db] px-4 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                  onKeyDown={handleExternalScannerInput}
                />
                <p className="text-xs text-[#6b7280] mt-2">
                  💡 Tip: External barcode scanners work like keyboard input. Focus this field and scan.
                </p>
              </div>
              
              {/* Manual Test Input */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  📝 Manual Entry for Testing
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter barcode or SKU to test"
                    className="flex-1 rounded-md border border-[#d1d5db] px-4 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && e.target.value.trim()) {
                        handleManualCameraInput(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  />
                  <button
                    onClick={(e) => {
                      const input = e.target.previousElementSibling;
                      if (input.value.trim()) {
                        handleManualCameraInput(input.value);
                        input.value = "";
                      }
                    }}
                    className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
                  >
                    Test
                  </button>
                </div>
              </div>

              {/* Quick Test Items */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-[#374151] mb-2">
                  🧪 Quick Test Items
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleManualCameraInput("SKU-001")}
                    className="rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-xs font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
                  >
                    Test SKU-001
                  </button>
                  <button
                    onClick={() => handleManualCameraInput("123456")}
                    className="rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-xs font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
                  >
                    Test Barcode 123456
                  </button>
                  <button
                    onClick={() => handleManualCameraInput("mmm")}
                    className="rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-xs font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
                  >
                    Test Item "mmm"
                  </button>
                  <button
                    onClick={() => handleManualCameraInput("invalid-code")}
                    className="rounded-md border border-[#d1d5db] bg-white px-3 py-2 text-xs font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
                  >
                    Test Invalid Code
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#e7ebf8] px-6 py-4 bg-[#fafbff]">
              <button
                onClick={handleCloseCamera}
                className="rounded-md border border-[#d1d5db] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Settings Modal */}
      {showInvoiceSettingsModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#e1e5f5] bg-white shadow-[0_25px_80px_-45px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between border-b border-[#e7ebf8] px-6 py-4">
              <h2 className="text-lg font-semibold text-[#1f2937]">Configure Invoice Number Preferences</h2>
              <button
                onClick={() => setShowInvoiceSettingsModal(false)}
                className="rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f1f5f9] hover:text-[#475569] transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div className="bg-[#f8fafc] p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-[#374151]">Branch</span>
                  <span className="text-sm text-[#6b7280]">Associated Series</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-[#1f2937]">{branch}</span>
                  <span className="text-sm text-[#6b7280]">Default Transaction Series</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-sm text-[#6b7280]">
                  Your invoice numbers are set on auto-generate mode to save your time.
                  Are you sure about changing this setting?
                </p>
                
                <div className="space-y-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="invoiceMode"
                      checked={invoiceSettings.autoGenerate}
                      onChange={() => setInvoiceSettings({...invoiceSettings, autoGenerate: true})}
                      className="mt-0.5 text-[#2563eb] focus:ring-[#2563eb]"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-[#1f2937]">Continue auto-generating invoice numbers</span>
                        <button
                          type="button"
                          className="text-[#6b7280] hover:text-[#374151] transition-colors"
                          title="Auto-generate invoice numbers"
                        >
                          <HelpCircle size={16} />
                        </button>
                      </div>
                      
                      {invoiceSettings.autoGenerate && (
                        <div className="mt-3 space-y-3">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-sm font-medium text-[#374151] mb-2">Prefix</label>
                              <div className="flex items-center gap-2">
                                <input
                                  type="text"
                                  value={invoiceSettings.prefix}
                                  onChange={(e) => setInvoiceSettings({...invoiceSettings, prefix: e.target.value})}
                                  className="flex-1 rounded-lg border border-[#d1d5db] px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                                />
                                <button className="w-8 h-8 rounded-lg bg-[#2563eb] text-white flex items-center justify-center hover:bg-[#1d4ed8] transition-colors">
                                  <Plus size={16} />
                                </button>
                              </div>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-[#374151] mb-2">Next Number</label>
                              <input
                                type="text"
                                value={invoiceSettings.nextNumber}
                                onChange={(e) => setInvoiceSettings({...invoiceSettings, nextNumber: e.target.value})}
                                className="w-full rounded-lg border border-[#d1d5db] px-3 py-2 text-sm focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/20"
                              />
                            </div>
                          </div>
                          
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={invoiceSettings.restartYearly}
                              onChange={(e) => setInvoiceSettings({...invoiceSettings, restartYearly: e.target.checked})}
                              className="rounded border-[#d1d5db] text-[#2563eb] focus:ring-[#2563eb]"
                            />
                            <span className="text-sm text-[#374151]">Restart numbering for invoices at the start of each fiscal year.</span>
                          </label>
                        </div>
                      )}
                    </div>
                  </label>
                  
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="radio"
                      name="invoiceMode"
                      checked={!invoiceSettings.autoGenerate}
                      onChange={() => setInvoiceSettings({...invoiceSettings, autoGenerate: false})}
                      className="mt-0.5 text-[#2563eb] focus:ring-[#2563eb]"
                    />
                    <span className="text-sm font-medium text-[#1f2937]">Enter invoice numbers manually</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#e7ebf8] px-6 py-4 bg-[#fafbff]">
              <button
                onClick={() => setShowInvoiceSettingsModal(false)}
                className="rounded-md border border-[#d1d5db] bg-white px-4 py-2 text-sm font-medium text-[#374151] hover:bg-[#f9fafb] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveInvoiceSettings}
                className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] transition-colors"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Tax Modal */}
      {showNewTaxModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-[#e1e5f5] bg-white shadow-[0_25px_80px_-45px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between border-b border-[#e7ebf8] px-6 py-4">
              <h2 className="text-lg font-semibold text-[#1f2937]">New Tax</h2>
              <button
                onClick={() => {
                  setShowNewTaxModal(false);
                  setNewTax({ name: "", rate: "", type: "" });
                }}
                className="rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f1f5f9] hover:text-[#475569] transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="px-6 py-5 space-y-5">
              <div>
                <Label required>Tax Name</Label>
                <Input
                  placeholder=""
                  value={newTax.name}
                  onChange={(e) => setNewTax({ ...newTax, name: e.target.value })}
                />
              </div>
              <div>
                <Label required>Rate (%)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    placeholder=""
                    value={newTax.rate}
                    onChange={(e) => setNewTax({ ...newTax, rate: e.target.value })}
                    className="flex-1"
                  />
                  <div className="rounded-md border border-[#d7dcf5] bg-white px-3 py-2.5 text-sm text-[#64748b]">
                    %
                  </div>
                </div>
              </div>
              <div>
                <Label>Tax Type</Label>
                <Select
                  value={newTax.type}
                  onChange={(e) => setNewTax({ ...newTax, type: e.target.value })}
                >
                  <option value="">Select a Tax Type</option>
                  <option value="GST">GST</option>
                  <option value="VAT">VAT</option>
                  <option value="Sales Tax">Sales Tax</option>
                  <option value="Other">Other</option>
                </Select>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#e7ebf8] px-6 py-4 bg-[#fafbff]">
              <button
                onClick={() => {
                  setShowNewTaxModal(false);
                  setNewTax({ name: "", rate: "", type: "" });
                }}
                className="rounded-md border border-[#d7dcf5] bg-white px-5 py-2.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveNewTax}
                className="rounded-md border border-[#d7dcf5] bg-white px-5 py-2.5 text-sm font-semibold text-[#475569] hover:bg-[#f8fafc] transition-colors shadow-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

     
    </div>
  );
};

// SalesPersonSelect Component
const SalesPersonSelect = ({ label, placeholder, value, onChange, options = [], onManageClick, disabled = false }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setSearch("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return options;
    }
    return options.filter((option) => option.toLowerCase().includes(term));
  }, [options, search]);

  const displayValue = value || "";

  return (
    <div className="relative flex w-full flex-col gap-1 text-sm text-[#475569]" ref={containerRef}>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">{label}</span>
      <div
        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
          open ? "border-[#2563eb] shadow-[0_0_0_3px_rgba(37,99,235,0.08)]" : "border-[#d7dcf5]"
        } ${disabled ? "bg-[#f1f5f9] text-[#94a3b8] cursor-not-allowed" : "bg-white text-[#1f2937] cursor-pointer"}`}
        onClick={() => {
          if (!disabled) setOpen((prev) => !prev);
        }}
      >
        <span className={displayValue ? "text-[#1f2937]" : "text-[#9ca3af]"}>{displayValue || placeholder}</span>
        <ChevronDown
          size={16}
          className={`ml-3 text-[#9ca3af] transition-transform ${open ? "rotate-180" : "rotate-0"}`}
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-[#d7dcf5] bg-white shadow-[0_24px_48px_-28px_rgba(15,23,42,0.45)]">
          <div className="flex items-center gap-2 border-b border-[#edf1ff] px-3 py-2 text-[#475569]">
            <Search size={14} className="text-[#9ca3af]" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search salesperson"
              className="h-8 w-full border-none text-sm text-[#1f2937] outline-none placeholder:text-[#9ca3af]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-2">
            {filteredOptions.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-[#9ca3af]">No matching results</p>
            ) : (
              filteredOptions.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`flex w-full items-center rounded-md px-4 py-2 text-left text-sm transition ${
                    value === option
                      ? "bg-[#f6f8ff] font-semibold text-[#2563eb]"
                      : "bg-white text-[#475569] hover:bg-[#f6f8ff]"
                  }`}
                >
                  {option}
                </button>
              ))
            )}
          </div>
          {onManageClick && (
            <div className="border-t border-[#edf1ff] px-3 py-2">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onManageClick();
                  setOpen(false);
                  setSearch("");
                }}
                className="flex w-full items-center gap-2 text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8] transition"
              >
                <Settings size={14} />
                Add Sales Person
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// SalesPersonModal Component
const SalesPersonModal = ({ onClose, onAdd, newSalesPerson, setNewSalesPerson }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onAdd();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-[#d7dcf5] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e7ebf8] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#1f2937]">Add Sales Person</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#9ca3af] hover:bg-[#f1f5f9] hover:text-[#475569] transition"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                  First Name*
                </label>
                <input
                  type="text"
                  value={newSalesPerson.firstName}
                  onChange={(e) => setNewSalesPerson({ ...newSalesPerson, firstName: e.target.value })}
                  placeholder="Enter first name"
                  className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none"
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                  Last Name*
                </label>
                <input
                  type="text"
                  value={newSalesPerson.lastName}
                  onChange={(e) => setNewSalesPerson({ ...newSalesPerson, lastName: e.target.value })}
                  placeholder="Enter last name"
                  className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                Employee ID*
              </label>
              <input
                type="text"
                value={newSalesPerson.employeeId}
                onChange={(e) => setNewSalesPerson({ ...newSalesPerson, employeeId: e.target.value })}
                placeholder="Enter employee ID"
                className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                Phone*
              </label>
              <input
                type="tel"
                value={newSalesPerson.phone}
                onChange={(e) => setNewSalesPerson({ ...newSalesPerson, phone: e.target.value })}
                placeholder="Enter phone number"
                className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                Email
              </label>
              <input
                type="email"
                value={newSalesPerson.email}
                onChange={(e) => setNewSalesPerson({ ...newSalesPerson, email: e.target.value })}
                placeholder="Enter email (optional)"
                className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none"
              />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-[#d7dcf5] px-4 py-2 text-sm font-medium text-[#475569] transition hover:bg-[#f1f5f9]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!newSalesPerson.firstName.trim() || !newSalesPerson.lastName.trim() || 
                       !newSalesPerson.employeeId.trim() || !newSalesPerson.phone.trim()}
              className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#1d4ed8] disabled:bg-[#9ca3af] disabled:cursor-not-allowed"
              title={(!newSalesPerson.firstName.trim() || !newSalesPerson.lastName.trim() || 
                       !newSalesPerson.employeeId.trim() || !newSalesPerson.phone.trim()) 
                       ? "Please fill all required fields (First Name, Last Name, Employee ID, Phone)" : ""}
            >
              Add Sales Person
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Field = ({ label, required, children }) => (
  <label className="flex flex-col gap-2 text-sm text-[#475569]">
    <span className="flex items-center gap-1 text-xs font-semibold uppercase tracking-[0.24em] text-[#8a94b0]">
      {label}
      {required && <span className="font-normal text-[#ef4444]">*</span>}
    </span>
    {children}
  </label>
);

export default SalesInvoiceCreate;


