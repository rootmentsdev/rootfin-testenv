import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useNavigate } from "react-router-dom";
import Head from "../components/Head";
import { X, Pencil, Trash2, Plus, Settings, Search, Check, ChevronDown, Image as ImageIcon, HelpCircle } from "lucide-react";
import baseUrl from "../api/api";

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

const Select = ({ className = "", ...props }) => {
  const baseClasses = "w-full rounded-md border border-[#d7dcf5] bg-white text-sm text-[#1f2937] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors cursor-pointer";
  const tableInputClasses = "h-[36px] px-[10px] py-[6px]";
  const defaultClasses = "px-3 py-2.5";
  
  const isTableInput = className.includes("table-input");
  const finalClasses = `${baseClasses} ${isTableInput ? tableInputClasses : defaultClasses} ${className}`;
  
  return (
    <select
      {...props}
      className={finalClasses}
    />
  );
};

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

  useEffect(() => {
    if (value) {
      const tax = [...taxOptions, ...nonTaxableOptions].find((t) => t.id === value);
      setSelectedTax(tax);
    } else {
      setSelectedTax(null);
    }
  }, [value, taxOptions, nonTaxableOptions]);

  /** ⭐ Position Calculator */
  const updatePos = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: rect.width,
    });
  };

  /** ⭐ Handle Open */
  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!isOpen) updatePos();
    setIsOpen((p) => !p);
  };

  /** Close on outside click */
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

  /** Re-align dropdown on render */
  useEffect(() => {
    if (isOpen) {
      updatePos();
      setTimeout(updatePos, 0);
    }
  }, [isOpen]);

  /** Follow scroll + resize */
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

  /** ⭐ Final Dropdown UI */
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
      <div className="rounded-xl shadow-xl bg-white border border-[#d7dcf5] w-[280px] overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#e2e8f0] px-3 py-2.5 bg-[#fafbff]">
          <Search size={14} className="text-[#94a3b8]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search"
            className="h-8 w-full border-none bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#94a3b8]"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
        <div className="py-2 max-h-[400px] overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d3d3d3 #f5f5f5' }}>
          <div className="px-4 pb-2 pt-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
            NON-TAXABLE
          </div>
          {nonTaxableOptions.map((option) => (
            <div
              key={option.id}
              onClick={() => handleSelectTax(option.id)}
              className={`px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                value === option.id
                  ? "bg-[#eff6ff] text-[#2563eb] font-medium border-l-2 border-l-[#2563eb]"
                  : "text-[#475569] hover:bg-[#f8fafc] hover:text-[#1f2937]"
              }`}
            >
              <div className="font-medium">{option.name}</div>
              <div className="text-xs text-[#94a3b8] mt-0.5">{option.description}</div>
            </div>
          ))}
          <div className="px-4 pb-2 pt-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">
            TAX GROUP
          </div>
          {filteredTaxOptions.map((tax) => (
            <div
              key={tax.id}
              onClick={() => handleSelectTax(tax.id)}
              className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-colors ${
                value === tax.id
                  ? "bg-[#f1f5f9] text-[#1f2937] font-medium border-l-2 border-l-[#64748b]"
                  : "text-[#475569] hover:bg-[#f8fafc] hover:text-[#1f2937]"
              }`}
            >
              <span>{tax.display}</span>
              {value === tax.id && <Check size={16} className="text-[#64748b]" />}
            </div>
          ))}
          <div
            onClick={() => {
              onNewTax();
              setIsOpen(false);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#2563eb] hover:bg-[#f8fafc] cursor-pointer transition-colors border-t border-[#e2e8f0] mt-2"
          >
            <Plus size={16} />
            <span>New Tax</span>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {/* ⭐ Tax Button - Styled like Rate input */}
      <div className="relative w-full overflow-visible m-0 p-0">
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          type="button"
          className="tax-dropdown-button w-full h-[36px] rounded-md border border-[#d7dcf5] bg-white text-sm text-[#1f2937] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors cursor-pointer flex items-center justify-between px-[10px] py-[6px] m-0"
        >
          {/* Text and X icon */}
          <div className="flex items-center gap-2 flex-1 ms-8 min-w-0">
            <span className="truncate text-left">
              {selectedTax ? selectedTax.display || selectedTax.name : "Select a Tax"}
            </span>
            {selectedTax && (
              <span
                onClick={handleClearTax}
                className="no-blue-button text-[#1f2937] hover:text-[#dc2626] transition-colors inline-flex items-center  bg-transparent border-none p-0.5 rounded hover:bg-[#fee2e2] shrink-0 m-0 cursor-pointer"
                title="Clear selection"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <X className="ms-8" size={14} strokeWidth={2} />
              </span>
            )}
          </div>
          {/* Chevron icon */}
          <ChevronDown 
            size={14} 
            className={`text-[#1f2937] me-3Wh transition-transform shrink-0 ml-1.5 ${isOpen ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Portal */}
      {typeof document !== "undefined" && document.body && createPortal(dropdownPortal, document.body)}
    </>
  );
};

const ItemDropdown = ({ rowId, value, description, onDescriptionChange, onChange, onNewItem }) => {
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

  // Fetch items from API
  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/shoe-sales/items`);
        if (!response.ok) throw new Error("Failed to fetch items");
        const data = await response.json();
        const activeItems = Array.isArray(data) 
          ? data.filter((i) => i?.isActive !== false && String(i?.isActive).toLowerCase() !== "false")
          : [];
        setItems(activeItems);
      } catch (error) {
        console.error("Error fetching items:", error);
        setItems([]);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // Set selected item from value
  useEffect(() => {
    if (value) {
      // If value is an object (full item), use it directly
      if (typeof value === 'object' && value !== null) {
        setSelectedItem(value);
      } else if (items.length > 0) {
        // If value is a string (itemName or _id), find the item
        const item = items.find((i) => i._id === value || i.itemName === value);
        setSelectedItem(item || null);
      }
    } else {
      setSelectedItem(null);
    }
  }, [value, items]);

  /** ⭐ Position Calculator */
  const updatePos = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 500), // Minimum width for item details
    });
  };

  /** ⭐ Handle Open */
  const toggleDropdown = (e) => {
    e.stopPropagation();
    if (!isOpen) updatePos();
    setIsOpen((p) => !p);
  };

  /** Close on outside click */
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

  /** Re-align dropdown on render */
  useEffect(() => {
    if (isOpen) {
      updatePos();
      setTimeout(updatePos, 0);
    }
  }, [isOpen]);

  /** Follow scroll + resize */
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

  // Filter items based on search term
  const filteredItems = items.filter((item) => {
    const searchLower = searchTerm.toLowerCase();
    const itemName = (item.itemName || "").toLowerCase();
    const sku = (item.sku || "").toLowerCase();
    return itemName.includes(searchLower) || sku.includes(searchLower);
  });

  const handleSelectItem = (item) => {
    // Pass the full item object
    onChange(item);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClearItem = (e) => {
    e.stopPropagation();
    onChange("");
    setSelectedItem(null);
  };

  // Calculate stock on hand (sum of all warehouse stocks)
  const getStockOnHand = (item) => {
    if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks)) return 0;
    return item.warehouseStocks.reduce((sum, ws) => {
      const stock = typeof ws.stockOnHand === 'number' ? ws.stockOnHand : 0;
      return sum + stock;
    }, 0);
  };

  /** ⭐ Final Dropdown UI */
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
              const stockOnHand = getStockOnHand(item);
              const purchaseRate = typeof item.sellingPrice === 'number' ? item.sellingPrice : (typeof item.costPrice === 'number' ? item.costPrice : 0);
              const isSelected = (typeof value === 'object' && value?._id === item._id) || 
                                 (typeof value === 'string' && value === (item.itemName || item._id));
              
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
                        SKU: {item.sku || "N/A"} • Purchase Rate: ₹{purchaseRate.toFixed(2)}
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
          <div
            onClick={() => {
              onNewItem();
              setIsOpen(false);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#2563eb] hover:bg-[#f8fafc] cursor-pointer transition-colors border-t border-[#e2e8f0] mt-2"
          >
            <Plus size={16} />
            <span>Add New Item</span>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      {selectedItem ? (
        /* ⭐ Detailed Item View */
        <div className="relative w-full overflow-visible m-0 p-0">
          <div className="space-y-2">
            {/* Item Name */}
            <div className="font-medium text-sm text-[#1f2937]">
              {selectedItem.itemName || "Unnamed Item"}
            </div>
            
            {/* SKU */}
            <div className="text-xs text-[#64748b]">
              SKU: {selectedItem.sku || "N/A"}
            </div>
            
            {/* Description */}
            <textarea
              placeholder="Add a description to your item"
              value={description || ""}
              onChange={(e) => {
                if (onDescriptionChange) {
                  onDescriptionChange(e.target.value);
                }
              }}
              className="w-full min-h-[60px] rounded-md border border-[#d7dcf5] bg-white text-xs text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors px-2 py-1.5 resize-none"
              onClick={(e) => e.stopPropagation()}
            />
            
            {/* Item Type Tag and HSN Code */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#2563eb] text-white">
                {(selectedItem.type || "goods").toUpperCase()}
              </span>
              {selectedItem.hsnCode && (
                <div className="flex items-center gap-1 text-xs text-[#64748b]">
                  <span>HSN Code: {selectedItem.hsnCode}</span>
                  <button
                    type="button"
                    className="text-[#64748b] hover:text-[#1f2937] transition-colors p-0.5"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle HSN code edit - can be implemented later
                    }}
                    title="Edit HSN Code"
                  >
                    <Pencil size={12} />
                  </button>
                </div>
              )}
            </div>
            
            {/* Click to change item */}
            <button
              ref={buttonRef}
              onClick={toggleDropdown}
              type="button"
              className="text-xs text-[#2563eb] hover:text-[#1d4ed8] hover:underline transition-colors mt-1"
            >
              Change item
            </button>
          </div>
        </div>
      ) : (
        /* ⭐ Item Input - Styled like Rate input */
        <div className="relative w-full overflow-visible m-0 p-0">
          <input
            ref={buttonRef}
            onClick={toggleDropdown}
            type="text"
            readOnly
            placeholder="Type or click to select an item."
            className="w-full h-[36px] rounded-md border border-[#d7dcf5] bg-white text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors cursor-pointer px-[10px] py-[6px]"
          />
        </div>
      )}

      {/* Portal */}
      {typeof document !== "undefined" && document.body && createPortal(dropdownPortal, document.body)}
    </>
  );
};

const PurchaseOrderCreate = () => {
  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";
  const navigate = useNavigate();
  
  // Safely get user from localStorage
  let currentuser = null;
  try {
    const userStr = localStorage.getItem("rootfinuser");
    if (userStr) {
      currentuser = JSON.parse(userStr);
    }
  } catch (e) {
    console.error("Error parsing user from localStorage:", e);
  }
  
  // Try to get userId - check for _id, id, email, or locCode
  const userId = currentuser?._id || currentuser?.id || currentuser?.email || currentuser?.locCode || null;

  const [addresses, setAddresses] = useState([]);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showNewAddressModal, setShowNewAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [discountType, setDiscountType] = useState("At Transaction Level");
  const [discount, setDiscount] = useState({ value: "0", type: "%" }); // { value: "0", type: "%" or "₹" }
  const [applyDiscountAfterTax, setApplyDiscountAfterTax] = useState(false);
  const [totalTaxAmount, setTotalTaxAmount] = useState("");
  const [tdsTcsType, setTdsTcsType] = useState("TDS"); // "TDS" or "TCS"
  const [tdsTcsTax, setTdsTcsTax] = useState("");
  const [adjustment, setAdjustment] = useState("0.00");
  const [tableRows, setTableRows] = useState([
    {
      id: 1,
      item: "",
      itemData: null, // Store full item object
      itemDescription: "", // Store item description
      account: "",
      size: "",
      quantity: "1.00",
      rate: "0.00",
      tax: "",
      amount: "0.00",
      // GST calculation fields
      baseAmount: "0.00",
      discountedAmount: "0.00",
      cgstAmount: "0.00",
      sgstAmount: "0.00",
      igstAmount: "0.00",
      lineTaxTotal: "0.00",
      lineTotal: "0.00",
      taxCode: "",
      taxPercent: 0,
      cgstPercent: 0,
      sgstPercent: 0,
      igstPercent: 0,
      isInterState: false, // true for IGST, false for CGST+SGST
    },
  ]);
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
  const [newAddress, setNewAddress] = useState({
    attention: "",
    street1: "",
    street2: "",
    city: "",
    state: "",
    zip: "",
    country: "",
    phone: "",
  });

  const selectedAddress = addresses.find((addr) => addr && (addr._id || addr.id) === selectedAddressId) || (addresses.length > 0 ? addresses[0] : null);

  // Fetch addresses from backend on mount
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch(`${API_URL}/api/purchase/addresses?userId=${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch addresses");
        }
        const data = await response.json();
        
        // Transform backend data to match frontend format
        const transformedAddresses = Array.isArray(data) ? data.map(addr => ({
          ...addr,
          id: addr._id || addr.id,
        })) : [];
        
        setAddresses(transformedAddresses);
        
        // Set default selected address
        if (transformedAddresses.length > 0 && !selectedAddressId) {
          setSelectedAddressId(transformedAddresses[0]._id || transformedAddresses[0].id);
        }
      } catch (error) {
        console.error("Error fetching addresses:", error);
        // If no addresses exist, create a default one
        const defaultAddress = {
          id: "default",
          attention: "Head Office",
          street1: "",
          street2: "",
          city: "Kerala",
          state: "",
          zip: "",
          country: "India",
          phone: "7593838720",
        };
        setAddresses([defaultAddress]);
        setSelectedAddressId("default");
      } finally {
        setLoading(false);
      }
    };

    fetchAddresses();
  }, [userId]);

  const formatAddress = (address) => {
    // More robust check for undefined, null, or non-object values
    if (!address || typeof address !== 'object') return [];
    
    const lines = [];
    // Don't include attention in the address box - it goes in the input field above
    if (address.street1) lines.push(address.street1);
    if (address.street2) lines.push(address.street2);
    if (address.city) lines.push(address.city);
    if (address.state) lines.push(address.state);
    if (address.country) {
      lines.push(`${address.country} ,`);
    }
    if (address.zip && !address.country) lines.push(address.zip);
    if (address.phone) lines.push(address.phone);
    
    // Default fallback
    if (lines.length === 0) {
      if (address.city) lines.push(address.city);
      if (address.country) lines.push(`${address.country} ,`);
    }
    
    return lines;
  };

  const handleSelectAddress = (addressId) => {
    setSelectedAddressId(addressId);
    setShowAddressModal(false);
  };

  const handleAddAddress = async () => {
    if (!newAddress.city || !newAddress.country) {
      alert("Please fill in at least City and Country");
      return;
    }

    if (!userId) {
      alert("User not logged in. Please log in to save addresses.");
      console.error("UserId not found. Current user:", currentuser);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/purchase/addresses`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...newAddress,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save address");
      }

      const savedAddress = await response.json();
      const transformedAddress = {
        ...savedAddress,
        id: savedAddress._id || savedAddress.id,
      };

      setAddresses([...addresses, transformedAddress]);
      setSelectedAddressId(transformedAddress.id);
      setNewAddress({
        attention: "",
        street1: "",
        street2: "",
        city: "",
        state: "",
        zip: "",
        country: "",
        phone: "",
      });
      setShowNewAddressModal(false);
    } catch (error) {
      console.error("Error saving address:", error);
      alert("Failed to save address. Please try again.");
    }
  };

  const handleEditAddress = (address) => {
    setEditingAddress({ ...address });
    setShowAddressModal(false);
    setShowNewAddressModal(true);
  };

  const handleUpdateAddress = async () => {
    if (!editingAddress.city || !editingAddress.country) {
      alert("Please fill in at least City and Country");
      return;
    }

    if (!userId) {
      alert("User not logged in. Please log in to update addresses.");
      return;
    }

    const addressId = editingAddress._id || editingAddress.id;
    if (!addressId) {
      alert("Invalid address ID");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/purchase/addresses/${addressId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editingAddress,
          userId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update address");
      }

      const updatedAddress = await response.json();
      const transformedAddress = {
        ...updatedAddress,
        id: updatedAddress._id || updatedAddress.id,
      };

      setAddresses(addresses.map((addr) => 
        (addr._id || addr.id) === addressId ? transformedAddress : addr
      ));
      setEditingAddress(null);
      setShowNewAddressModal(false);
    } catch (error) {
      console.error("Error updating address:", error);
      alert("Failed to update address. Please try again.");
    }
  };

  const handleDeleteAddress = async (addressId) => {
    if (addresses.length === 1) {
      alert("You must have at least one address");
      return;
    }

    if (!userId) {
      alert("User not logged in. Please log in to delete addresses.");
      return;
    }

    // Skip deletion for default address (not saved in backend)
    if (addressId === "default") {
      alert("Cannot delete default address");
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/purchase/addresses/${addressId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to delete address");
      }

      setAddresses(addresses.filter((addr) => (addr._id || addr.id) !== addressId));
      if (selectedAddressId === addressId) {
        const remainingAddresses = addresses.filter((addr) => (addr._id || addr.id) !== addressId);
        setSelectedAddressId(remainingAddresses[0]?._id || remainingAddresses[0]?.id || null);
      }
    } catch (error) {
      console.error("Error deleting address:", error);
      alert(error.message || "Failed to delete address. Please try again.");
    }
  };

  const handleNewAddressClick = () => {
    setEditingAddress(null);
    setNewAddress({
      attention: "",
      street1: "",
      street2: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      phone: "",
    });
    setShowAddressModal(false);
    setShowNewAddressModal(true);
  };

  const handleAddNewRow = () => {
    const newRow = {
      id: Date.now(),
      item: "",
      itemData: null,
      itemDescription: "",
      account: "",
      size: "",
      quantity: "1.00",
      rate: "0.00",
      tax: "",
      amount: "0.00",
      // GST calculation fields
      baseAmount: "0.00",
      discountedAmount: "0.00",
      cgstAmount: "0.00",
      sgstAmount: "0.00",
      igstAmount: "0.00",
      lineTaxTotal: "0.00",
      lineTotal: "0.00",
      taxCode: "",
      taxPercent: 0,
      cgstPercent: 0,
      sgstPercent: 0,
      igstPercent: 0,
      isInterState: false,
    };
    setTableRows([...tableRows, newRow]);
  };

  const handleDeleteRow = (rowId) => {
    if (tableRows.length > 1) {
      setTableRows(tableRows.filter((row) => row.id !== rowId));
    }
  };

  const handleUpdateRow = (rowId, field, value) => {
    setTableRows(
      tableRows.map((row) => {
        if (row.id === rowId) {
          const updated = { ...row, [field]: value };
          
          // If updating item, also store the full item object and auto-fill all related fields
          if (field === "item" && typeof value === 'object' && value !== null) {
            updated.itemData = value;
            updated.item = value.itemName || value._id || "";
            
            // Auto-fill rate from item's sellingPrice (only if rate is empty or 0)
            if (value.sellingPrice !== undefined && value.sellingPrice !== null && (!updated.rate || updated.rate === "0.00" || updated.rate === "0")) {
              updated.rate = value.sellingPrice.toString();
            }
            
            // Auto-fill account from item's salesAccount (only if account is empty)
            if (value.salesAccount && !updated.account) {
              updated.account = value.salesAccount;
            }
            
            // Auto-fill size from item's size (only if size is empty)
            if (value.size && !updated.size) {
              updated.size = value.size;
            }
            
            // Auto-fill tax/GST based on item's tax settings (exact tax selected during item creation)
            // Always use the item's tax when an item is selected
            // Priority: taxRateIntra > taxRateInter > taxPreference
            let matchedTaxId = null;
            
            // Helper function to extract tax rate from various formats
            const extractTaxRate = (taxRateValue) => {
              if (!taxRateValue) return null;
              
              // Handle different formats: "5", "5%", "5.0", "5.0%", "GST5 [5%]", etc.
              const taxRateStr = String(taxRateValue);
              
              // Try to extract from bracket format first: "GST5 [5%]" -> 5
              const bracketMatch = taxRateStr.match(/\[(\d+(?:\.\d+)?)%?\]/);
              if (bracketMatch) {
                return parseFloat(bracketMatch[1]);
              }
              
              // Otherwise, extract number directly
              const numberMatch = taxRateStr.replace(/[^\d.]/g, '');
              const taxRate = parseFloat(numberMatch);
              
              return isNaN(taxRate) ? null : taxRate;
            };
            
            // Helper function to match tax rate to dropdown options
            const matchTaxByRate = (taxRateValue) => {
              const taxRate = extractTaxRate(taxRateValue);
              if (taxRate === null) return null;
              
              // Find closest match by rate (handle both integer and decimal rates)
              // First try exact match
              const exactMatch = taxOptions.find(tax => tax.rate === taxRate);
              if (exactMatch) return exactMatch.id;
              
              // Then try rounded match (for decimal rates like 2.5 matching 5% GST)
              const roundedRate = Math.round(taxRate);
              const roundedMatch = taxOptions.find(tax => tax.rate === roundedRate);
              if (roundedMatch) return roundedMatch.id;
              
              // If no match found, return null (we'll use the item's tax data directly)
              return null;
            };
            
            // Check intra-state tax rate first (this is the primary tax rate selected during item creation)
            if (value.taxRateIntra) {
              matchedTaxId = matchTaxByRate(value.taxRateIntra);
            }
            
            // If no match from intra, check inter-state tax rate
            if (!matchedTaxId && value.taxRateInter) {
              matchedTaxId = matchTaxByRate(value.taxRateInter);
            }
            
            // If still no match and item is non-taxable, set to non-taxable option
            if (!matchedTaxId && value.taxPreference === "non-taxable") {
              matchedTaxId = nonTaxableOptions[0]?.id || "";
            }
            
            // Set the tax if we found a match (always use item's tax)
            if (matchedTaxId) {
              updated.tax = matchedTaxId;
            } else if (value.taxRateIntra || value.taxRateInter) {
              // If no dropdown match but item has tax data, try to create a dynamic tax entry
              // or use the closest available tax option
              const itemTaxRate = extractTaxRate(value.taxRateIntra || value.taxRateInter);
              if (itemTaxRate !== null) {
                // Find the closest tax option
                const closestTax = taxOptions.reduce((closest, tax) => {
                  if (!closest) return tax;
                  const currentDiff = Math.abs(tax.rate - itemTaxRate);
                  const closestDiff = Math.abs(closest.rate - itemTaxRate);
                  return currentDiff < closestDiff ? tax : closest;
                }, null);
                
                if (closestTax) {
                  updated.tax = closestTax.id;
                }
              }
            }
          }
          
          // Recalculate GST for this row whenever quantity, rate, tax, or discount changes
          const allTaxOptions = [...taxOptions, ...nonTaxableOptions];
          const discountConfig = {
            value: discount.value,
            type: discount.type,
            applyAfterTax: applyDiscountAfterTax,
          };
          
          const gstCalculation = calculateGSTLineItem(updated, discountConfig, allTaxOptions);
          
          // Update all GST calculation fields
          updated.baseAmount = gstCalculation.baseAmount;
          updated.discountedAmount = gstCalculation.discountedAmount;
          updated.cgstAmount = gstCalculation.cgstAmount;
          updated.sgstAmount = gstCalculation.sgstAmount;
          updated.igstAmount = gstCalculation.igstAmount;
          updated.lineTaxTotal = gstCalculation.lineTaxTotal;
          updated.lineTotal = gstCalculation.lineTotal;
          updated.taxCode = gstCalculation.taxCode;
          updated.taxPercent = gstCalculation.taxPercent;
          updated.cgstPercent = gstCalculation.cgstPercent;
          updated.sgstPercent = gstCalculation.sgstPercent;
          updated.igstPercent = gstCalculation.igstPercent;
          updated.isInterState = gstCalculation.isInterState;
          
          // Amount column shows base amount (quantity × rate) - does NOT include tax or discount
          // Discount only affects totals section, not individual line item amounts
          updated.amount = gstCalculation.baseAmount;
          
          return updated;
        }
        return row;
      })
    );
  };

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

  const discountOptions = [
    "At Transaction Level",
    "At Line Item Level",
    "At Line Item Level and at Transaction Level",
  ];

  /**
   * ZOHO BOOKS GST CALCULATION HELPER
   * Calculates GST for a single line item following Zoho Books formula exactly
   * @param {Object} row - The table row object
   * @param {Object} discountConfig - { value: string, type: "%" | "₹", applyAfterTax: boolean }
   * @param {Array} allTaxOptions - Combined tax options and non-taxable options
   * @returns {Object} Calculated GST values
   */
  const calculateGSTLineItem = (row, discountConfig, allTaxOptions) => {
    // 1️⃣ Base Amount
    const quantity = parseFloat(row.quantity) || 0;
    const rate = parseFloat(row.rate) || 0;
    const baseAmount = quantity * rate;

    // Helper function to extract tax rate from various formats
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

    // Find selected tax from dropdown
    const selectedTax = allTaxOptions.find(t => t.id === row.tax);
    
    // Initialize tax values
    let taxPercent = 0;
    let cgstPercent = 0;
    let sgstPercent = 0;
    let igstPercent = 0;
    let isInterState = false;
    let taxCode = "";

    // Priority: Use item's tax data if available, otherwise use selected tax from dropdown
    const itemData = row.itemData;
    let itemTaxRate = null;
    let itemIsInterState = false;

    if (itemData) {
      // Check if item has tax rate data
      if (itemData.taxRateIntra) {
        itemTaxRate = extractTaxRate(itemData.taxRateIntra);
        itemIsInterState = false; // Intra-state uses CGST+SGST
      } else if (itemData.taxRateInter) {
        itemTaxRate = extractTaxRate(itemData.taxRateInter);
        itemIsInterState = true; // Inter-state uses IGST
      }
    }

    // Use item's tax rate if available, otherwise use selected tax from dropdown
    if (itemTaxRate !== null) {
      taxPercent = itemTaxRate;
      isInterState = itemIsInterState;
      taxCode = itemData.taxRateIntra || itemData.taxRateInter || row.tax || "";
    } else if (selectedTax && selectedTax.rate !== undefined && selectedTax.rate > 0) {
      taxPercent = selectedTax.rate;
      taxCode = selectedTax.id;
      // Determine if inter-state or intra-state
      // For now, assume intra-state (CGST+SGST). Can be enhanced with address-based logic
      isInterState = false; // TODO: Determine from vendor/supplier address
    }

    // Calculate CGST, SGST, or IGST based on state type
    if (taxPercent > 0) {
      if (isInterState) {
        // Inter-state: Full GST as IGST
        igstPercent = taxPercent;
      } else {
        // Intra-state: Split GST into CGST and SGST
        cgstPercent = taxPercent / 2;
        sgstPercent = taxPercent / 2;
      }
    }

    // 2️⃣ Apply Discount (if "Apply before tax")
    // If "Apply after tax": calculate tax on baseAmount, discount applied at invoice level
    // If "Apply before tax": calculate tax on discountedAmount
    let discountedAmount = baseAmount;
    let amountForTaxCalculation = baseAmount; // Amount to use for tax calculation
    
    if (!discountConfig.applyAfterTax && discountConfig.value && parseFloat(discountConfig.value) > 0) {
      if (discountConfig.type === "%") {
        const discountPercent = parseFloat(discountConfig.value);
        discountedAmount = baseAmount - (baseAmount * discountPercent / 100);
      } else {
        // Fixed amount discount (₹) - Note: For line-level, we'd need to distribute this
        // For now, we'll apply percentage-based discount at line level
        // Fixed discount is typically applied at transaction level
        discountedAmount = baseAmount;
      }
      // Ensure discounted amount is not negative
      discountedAmount = Math.max(0, discountedAmount);
      amountForTaxCalculation = discountedAmount; // Tax calculated on discounted amount
    } else {
      // Apply after tax: tax calculated on base amount
      amountForTaxCalculation = baseAmount;
    }

    // 3️⃣ Calculate Tax Components (round to 2 decimals per line item)
    // Tax is calculated on amountForTaxCalculation (baseAmount or discountedAmount)
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterState && igstPercent > 0) {
      // Inter-state: IGST
      igstAmount = Math.round((amountForTaxCalculation * igstPercent / 100) * 100) / 100;
    } else if (!isInterState && (cgstPercent > 0 || sgstPercent > 0)) {
      // Intra-state: CGST + SGST
      cgstAmount = Math.round((amountForTaxCalculation * cgstPercent / 100) * 100) / 100;
      sgstAmount = Math.round((amountForTaxCalculation * sgstPercent / 100) * 100) / 100;
    }

    // 5️⃣ Total Tax Amount (line level)
    const lineTaxTotal = cgstAmount + sgstAmount + igstAmount;

    // 6️⃣ Final Line Total
    const lineTotal = discountedAmount + lineTaxTotal;

    return {
      baseAmount: baseAmount.toFixed(2),
      discountedAmount: discountedAmount.toFixed(2),
      cgstAmount: cgstAmount.toFixed(2),
      sgstAmount: sgstAmount.toFixed(2),
      igstAmount: igstAmount.toFixed(2),
      lineTaxTotal: lineTaxTotal.toFixed(2),
      lineTotal: lineTotal.toFixed(2),
      taxCode,
      taxPercent,
      cgstPercent,
      sgstPercent,
      igstPercent,
      isInterState,
    };
  };

  // Calculate totals from table rows (Zoho Books formula)
  const calculateTotals = () => {
    const allTaxOptions = [...taxOptions, ...nonTaxableOptions];
    const discountConfig = {
      value: discount.value,
      type: discount.type,
      applyAfterTax: applyDiscountAfterTax,
    };

    // Recalculate all rows to ensure they're up to date
    const recalculatedRows = tableRows.map(row => {
      const gstCalculation = calculateGSTLineItem(row, discountConfig, allTaxOptions);
      return {
        ...row,
        ...gstCalculation,
        // Amount column shows base amount (quantity × rate) - does NOT change with discount
        amount: gstCalculation.baseAmount,
      };
    });

    // 7️⃣ Invoice Summary Totals (Zoho Books formula)
    
    // Subtotal = sum of all baseAmount or discountedAmount (depending on discount timing)
    let subTotal = 0;
    if (applyDiscountAfterTax) {
      // If discount applies after tax, subtotal is sum of baseAmount
      subTotal = recalculatedRows.reduce((sum, row) => {
        return sum + (parseFloat(row.baseAmount) || 0);
      }, 0);
    } else {
      // If discount applies before tax, subtotal is sum of discountedAmount
      subTotal = recalculatedRows.reduce((sum, row) => {
        return sum + (parseFloat(row.discountedAmount) || 0);
      }, 0);
    }

    // Aggregate tax breakdown by CGST/SGST rate separately (for display)
    // Group CGST by rate, SGST by rate, and IGST by rate separately
    const cgstMap = new Map(); // cgstRate -> { rate, amount }
    const sgstMap = new Map(); // sgstRate -> { rate, amount }
    const igstMap = new Map(); // igstRate -> { rate, amount }
    
    recalculatedRows.forEach((row) => {
      if (row.taxPercent > 0) {
        // Aggregate CGST by rate
        if (row.cgstPercent > 0 && parseFloat(row.cgstAmount) > 0) {
          const cgstRate = row.cgstPercent;
          if (cgstMap.has(cgstRate)) {
            cgstMap.get(cgstRate).amount += parseFloat(row.cgstAmount) || 0;
          } else {
            cgstMap.set(cgstRate, {
              rate: cgstRate,
              amount: parseFloat(row.cgstAmount) || 0,
            });
          }
        }
        
        // Aggregate SGST by rate
        if (row.sgstPercent > 0 && parseFloat(row.sgstAmount) > 0) {
          const sgstRate = row.sgstPercent;
          if (sgstMap.has(sgstRate)) {
            sgstMap.get(sgstRate).amount += parseFloat(row.sgstAmount) || 0;
          } else {
            sgstMap.set(sgstRate, {
              rate: sgstRate,
              amount: parseFloat(row.sgstAmount) || 0,
            });
          }
        }
        
        // Aggregate IGST by rate
        if (row.igstPercent > 0 && parseFloat(row.igstAmount) > 0) {
          const igstRate = row.igstPercent;
          if (igstMap.has(igstRate)) {
            igstMap.get(igstRate).amount += parseFloat(row.igstAmount) || 0;
          } else {
            igstMap.set(igstRate, {
              rate: igstRate,
              amount: parseFloat(row.igstAmount) || 0,
            });
          }
        }
      }
    });

    // Convert maps to arrays and combine for display
    const taxBreakdown = [
      ...Array.from(cgstMap.values()).map(item => ({ type: 'CGST', rate: item.rate, amount: item.amount })),
      ...Array.from(sgstMap.values()).map(item => ({ type: 'SGST', rate: item.rate, amount: item.amount })),
      ...Array.from(igstMap.values()).map(item => ({ type: 'IGST', rate: item.rate, amount: item.amount })),
    ].sort((a, b) => {
      // Sort by type (CGST first, then SGST, then IGST), then by rate
      const typeOrder = { 'CGST': 0, 'SGST': 1, 'IGST': 2 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.rate - b.rate;
    });
    
    // Total Tax = sum of all lineTaxTotal values
    const calculatedTotalTax = recalculatedRows.reduce((sum, row) => {
      return sum + (parseFloat(row.lineTaxTotal) || 0);
    }, 0);
    
    // Use manual override if set, otherwise use calculated value
    const totalTax = (totalTaxAmount && parseFloat(totalTaxAmount) > 0) 
      ? parseFloat(totalTaxAmount) 
      : calculatedTotalTax;

    // Calculate discount amount (at transaction level)
    let discountAmount = 0;
    if (discount.value && parseFloat(discount.value) > 0) {
      if (applyDiscountAfterTax) {
        // Discount applied after tax: calculate on (subtotal + tax)
        if (discount.type === "%") {
          discountAmount = ((subTotal + totalTax) * parseFloat(discount.value)) / 100;
        } else {
          discountAmount = parseFloat(discount.value) || 0;
        }
      } else {
        // Discount applied before tax: already included in subtotal (discountedAmount)
        // But we still need to show the discount amount for display
        // Calculate what the discount was
        const totalBaseAmount = recalculatedRows.reduce((sum, row) => {
          return sum + (parseFloat(row.baseAmount) || 0);
        }, 0);
        if (discount.type === "%") {
          discountAmount = (totalBaseAmount * parseFloat(discount.value)) / 100;
        } else {
          discountAmount = parseFloat(discount.value) || 0;
        }
      }
    }

    // Calculate TDS/TCS
    // Zoho Books TDS calculation: TDS is calculated on Subtotal (before tax)
    // If discount applies before tax, use discounted subtotal; if after tax, use original subtotal
    let tdsTcsAmount = 0;
    if (tdsTcsTax) {
      // Check both regular tax options and TDS options
      const allTdsTcsOptions = [...taxOptions, ...tdsOptions];
      const selectedTdsTcsTax = allTdsTcsOptions.find(t => t.id === tdsTcsTax);
      if (selectedTdsTcsTax && selectedTdsTcsTax.rate !== undefined) {
        // Calculate base amount for TDS calculation (Zoho calculates TDS on subtotal only)
        let baseAmountForTds = 0;
        
        if (applyDiscountAfterTax) {
          // Discount applied after tax: TDS base = subtotal (discount not applied to subtotal yet)
          baseAmountForTds = subTotal;
        } else {
          // Discount applied before tax: subtotal already includes discount
          // TDS base = discounted subtotal
          baseAmountForTds = subTotal;
        }
        
        // Calculate TDS amount: base amount × TDS rate / 100
        tdsTcsAmount = (baseAmountForTds * selectedTdsTcsTax.rate) / 100;
      }
    }

    // Calculate adjustment
    const adjustmentAmount = parseFloat(adjustment) || 0;

    // Calculate final total (Zoho Books formula)
    let finalTotal = 0;
    
    if (applyDiscountAfterTax) {
      // Discount applied after tax: subtotal + tax - discount - tds/tcs + adjustment
      finalTotal = subTotal + totalTax - discountAmount - tdsTcsAmount + adjustmentAmount;
    } else {
      // Discount applied before tax: subtotal already includes discount, so just add tax
      // subtotal = sum of discountedAmount, so: subtotal + tax - tds/tcs + adjustment
      finalTotal = subTotal + totalTax - tdsTcsAmount + adjustmentAmount;
    }

    return {
      subTotal: subTotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      taxBreakdown,
      totalTax: totalTax,
      calculatedTotalTax: calculatedTotalTax, // For display in input field
      tdsTcsAmount: tdsTcsAmount.toFixed(2),
      adjustmentAmount: adjustmentAmount.toFixed(2),
      finalTotal: finalTotal.toFixed(2)
    };
  };

  // Recalculate all rows when discount changes (using useCallback to avoid infinite loop)
  useEffect(() => {
    if (tableRows.length === 0) return;
    
    const allTaxOptions = [...taxOptions, ...nonTaxableOptions];
    const discountConfig = {
      value: discount.value,
      type: discount.type,
      applyAfterTax: applyDiscountAfterTax,
    };

    setTableRows(prevRows => 
      prevRows.map(row => {
        const gstCalculation = calculateGSTLineItem(row, discountConfig, allTaxOptions);
        return {
          ...row,
          ...gstCalculation,
          // Amount column shows base amount (quantity × rate) - does NOT change with discount
          amount: gstCalculation.baseAmount,
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discount.value, discount.type, applyDiscountAfterTax]);

  const totals = calculateTotals();

  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb] p-6 overflow-visible relative">
      <Head
        title="New Purchase Order"
        description=""
        actions={
          <Link
            to="/purchase/orders"
            className="rounded-md border border-[#d7dcf5] px-4 py-1.5 text-sm font-medium text-[#475569] hover:bg-white"
          >
            Close
          </Link>
        }
      />

      <div className="rounded-3xl border border-[#e1e5f5] bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.25)] overflow-visible relative">
        <div className="px-8 py-8 space-y-8">
          {/* Header form block - exact two column positioning */}
          <div className="grid gap-8 md:grid-cols-[1.2fr_0.8fr]">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
              {/* Vendor + Branch */}
              <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
                <div className="space-y-1">
                  <Label>Vendor Name</Label>
                  <div className="flex items-center gap-2">
                    <Select defaultValue="">
                      <option value="">Select a Vendor</option>
                    </Select>
                    <button className="rounded-md border border-[#d7dcf5] bg-white px-4 py-2.5 text-xs font-semibold text-[#475569] hover:bg-[#f8fafc] transition-colors shadow-sm">
                      Search
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label>Branch</Label>
                  <Select defaultValue="Head Office">
                    <option>Head Office</option>
                  </Select>
                </div>
              </div>

              {/* Delivery Address */}
              <div className="space-y-3">
                <Label required>Delivery Address</Label>
                <div className="flex items-center gap-6 text-sm font-medium text-[#475569]">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="deliveryTo" defaultChecked className="h-4 w-4 text-[#2563eb] focus:ring-[#2563eb] cursor-pointer" />
                    <span>Warehouses</span>
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="deliveryTo" className="h-4 w-4 text-[#2563eb] focus:ring-[#2563eb] cursor-pointer" />
                    <span>Customer</span>
                  </label>
                </div>
                <Select>
                  <option value="">Select a warehouse</option>
                </Select>
                <div className="rounded-md border-2 border-dashed border-[#d7dcf5] bg-white px-3 py-2.5 text-sm font-bold text-[#1f2937] min-h-[42px] flex items-center">
                  {selectedAddress && selectedAddress.attention ? selectedAddress.attention : ""}
                </div>
                <div className="rounded-lg border border-[#d7dcf5] bg-[#fafbff] p-3 text-sm leading-relaxed text-[#1f2937]">
                  {loading ? (
                    <div className="space-y-0.5 text-[#9ca3af]">Loading...</div>
                  ) : selectedAddress && typeof selectedAddress === 'object' && formatAddress(selectedAddress).length > 0 ? (
                    <div className="space-y-0.5">
                      {formatAddress(selectedAddress).map((line, index) => (
                        <div key={index}>{line}</div>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-0.5">
                      <div>Kerala</div>
                      <div>India ,</div>
                      <div>7593838720</div>
                    </div>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddressModal(true)}
                  className="text-xs font-semibold text-[#2563eb] hover:text-[#1d4ed8] hover:underline transition-colors"
                >
                  Change destination to deliver
                </button>
              </div>
            </div>

            {/* RIGHT COLUMN */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label required>Purchase Order#</Label>
                <div className="flex items-center gap-2 rounded-md border border-[#d7dcf5] bg-white focus-within:border-[#2563eb] focus-within:ring-1 focus-within:ring-[#2563eb]">
                  <input
                    type="text"
                    defaultValue="PO-00001"
                    className="flex-1 rounded-md px-3 py-2.5 text-sm text-[#1f2937] focus:outline-none"
                  />
                  <button
                    type="button"
                    className="p-2 text-[#64748b] hover:text-[#1f2937] hover:bg-[#f1f5f9] rounded-md transition-colors"
                    aria-label="Settings"
                  >
                    <Settings size={16} />
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reference#</Label>
                <Input placeholder="" />
              </div>
              <div className="space-y-2">
                <Label>Date</Label>
                <Input type="text" placeholder="dd/MM/yyyy" defaultValue="17/11/2025" />
              </div>
              <div className="space-y-2">
                <Label>Delivery Date</Label>
                <Input type="text" placeholder="dd/MM/yyyy" />
              </div>
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Select defaultValue="Due on Receipt">
                  <option>Due on Receipt</option>
                  <option>Net 7</option>
                  <option>Net 15</option>
                  <option>Net 30</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Shipment Preference</Label>
                <Select>
                  <option>Choose the shipment preference or type to add</option>
                  <option>Standard</option>
                  <option>Express</option>
                  <option>Overnight</option>
                </Select>
              </div>
            </div>
          </div>

          {/* Warehouse + Item table */}
          <div className="mt-8 overflow-visible">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <Select className="w-48">
                  <option>Warehouse</option>
                </Select>
                <Select className="w-56">
                  <option>Select a warehouse</option>
                </Select>
                <Select 
                  className="w-48" 
                  value={discountType}
                  onChange={(e) => setDiscountType(e.target.value)}
                >
                  {discountOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>
              </div>
              <button className="text-xs font-medium text-[#2563eb] hover:underline">Bulk Actions</button>
            </div>

            <div className="mb-4">
              <h3 className="text-base font-bold text-[#1f2937] mb-1">Item Table</h3>
              <h4 className="text-xs font-bold uppercase tracking-wide text-[#475569]">ITEM DETAILS</h4>
            </div>
            <div className="overflow-x-visible relative">
              <table className="min-w-full divide-y divide-[#e6eafb] overflow-visible">
                <thead className="bg-[#f5f6ff]">
                  <tr className="text-left">
                    <th className="table-header px-3 py-2 w-[240px]">Item Details</th>
                    <th className="table-header px-3 py-2 w-[160px]">Account</th>
                    <th className="table-header px-3 py-2 w-[80px]">Size</th>
                    <th className="table-header px-3 py-2 w-[90px]">Quantity</th>
                    <th className="table-header px-3 py-2 w-[90px]">Rate</th>
                    <th className="table-header px-3 py-2 w-[120px]">Tax</th>
                    <th className="table-header px-3 py-2 w-[100px] text-right">Amount</th>
                    <th className="table-header px-3 py-2 w-[40px]"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#eef2ff] bg-white text-sm overflow-visible">
                  {tableRows.map((row) => (
                    <tr key={row.id} className="overflow-visible">
                      <td className="px-4 py-3 relative overflow-visible align-top">
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f5f7ff]">
                            <ImageIcon size={16} className="text-[#aeb8d8]" />
                          </div>
                          <ItemDropdown
                            rowId={row.id}
                            value={row.itemData || row.item}
                            description={row.itemDescription || ""}
                            onDescriptionChange={(desc) => handleUpdateRow(row.id, "itemDescription", desc)}
                            onChange={(value) => handleUpdateRow(row.id, "item", value)}
                            onNewItem={() => navigate("/shoe-sales/items/new")}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-3 relative overflow-visible align-top">
                        <Select
                          value={row.account}
                          onChange={(e) => handleUpdateRow(row.id, "account", e.target.value)}
                          className="text-sm table-input"
                        >
                          <option value="">Select an account</option>
                        </Select>
                      </td>
                      <td className="px-4 py-3 relative overflow-visible align-top">
                        <Input
                          placeholder=""
                          value={row.size}
                          onChange={(e) => handleUpdateRow(row.id, "size", e.target.value)}
                          className="text-sm table-input"
                        />
                      </td>
                      <td className="px-4 py-3 relative overflow-visible align-top">
                        <Input
                          value={row.quantity}
                          onChange={(e) => handleUpdateRow(row.id, "quantity", e.target.value)}
                          className="text-sm table-input"
                        />
                      </td>
                      <td className="px-4 py-3 relative overflow-visible align-top">
                        <Input
                          value={row.rate}
                          onChange={(e) => handleUpdateRow(row.id, "rate", e.target.value)}
                          className="text-sm table-input"
                        />
                      </td>
                      <td className="px-4 py-3 relative overflow-visible align-top h-[48px] z-[500]">
                        <TaxDropdown
                          rowId={row.id}
                          value={row.tax}
                          onChange={(value) => handleUpdateRow(row.id, "tax", value)}
                          taxOptions={taxOptions}
                          nonTaxableOptions={nonTaxableOptions}
                          onNewTax={() => setShowNewTaxModal(true)}
                        />
                      </td>
                      <td className="px-4 py-3 relative overflow-visible align-top text-right text-sm font-medium text-[#1f2937]">{row.amount}</td>
                      <td className="px-4 py-3 relative overflow-visible align-top text-right">
                        <button
                          onClick={() => handleDeleteRow(row.id)}
                          className="text-sm text-[#ef4444] hover:text-[#dc2626] transition-colors"
                        >
                          ×
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={handleAddNewRow}
                  className="rounded-lg border border-[#d4dbf4] bg-white px-4 py-2.5 text-xs font-semibold text-[#475569] hover:bg-[#f8fafc] hover:border-[#d7dcf5] transition-all flex items-center gap-2 shadow-sm"
                >
                
                  <span>Add New Row</span>
                </button>
              </div>
              <button className="rounded-lg border border-[#d4dbf4] bg-white px-4 py-2.5 text-xs font-semibold text-[#475569] hover:bg-[#f8fafc] hover:border-[#d7dcf5] transition-all flex items-center gap-2 shadow-sm">
                
                <span>Add Items in Bulk</span>
              </button>
            </div>
          </div>

          {/* Totals section */}
          <div className="mt-8 overflow-visible">
            <div className="flex justify-end">
              <div className="w-full max-w-[400px]">
                <div className="rounded-2xl border border-[#edf1ff] bg-white p-6">
                {/* Sub Total */}
                <div className="flex items-center justify-between text-base font-semibold text-[#111827] mb-4">
                  <span>Sub Total</span>
                  <span>{totals.subTotal}</span>
                </div>

                {/* Discount Section */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-[#111827]">Discount</span>
                    <div className="flex items-center gap-2">
                      <Input 
                        className="w-20 text-sm text-right" 
                        value={discount.value}
                        onChange={(e) => setDiscount({ ...discount, value: e.target.value })}
                      />
                      <Select 
                        className="w-16 text-sm"
                        value={discount.type}
                        onChange={(e) => setDiscount({ ...discount, type: e.target.value })}
                      >
                        <option>%</option>
                        <option>₹</option>
                      </Select>
                    </div>
                    <span className="text-sm text-[#64748b] w-20 text-right">{totals.discountAmount}</span>
                  </div>
                  <div className="flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setApplyDiscountAfterTax(!applyDiscountAfterTax)}
                      className={`text-xs ${applyDiscountAfterTax ? 'text-[#2563eb] font-medium' : 'text-[#64748b]'} hover:text-[#2563eb] transition-colors`}
                    >
                      Apply after tax
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#eef2ff] my-4"></div>

                {/* Tax Details - CGST & SGST (Aggregated by rate) */}
                {totals.taxBreakdown.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {totals.taxBreakdown.map((tax, idx) => {
                      const taxType = tax.type; // 'CGST', 'SGST', or 'IGST'
                      const taxRate = tax.rate;
                      const taxAmount = tax.amount;
                      
                      // Format rate display (handle decimal rates like 2.5, 9, etc.)
                      const rateDisplay = taxRate % 1 === 0 ? taxRate.toFixed(0) : taxRate.toFixed(1);
                      
                      return (
                        <div key={idx} className="flex items-center justify-between">
                          <span className="text-sm text-[#64748b]">
                            {taxType}{rateDisplay} [{rateDisplay}%]
                          </span>
                          <span className="text-sm text-[#111827]">{taxAmount.toFixed(2)}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Total Tax Amount */}
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-[#111827]">Total Tax Amount</span>
                  <div className="flex items-center gap-2">
                    <Input 
                      className="w-24 text-sm text-right" 
                      value={totalTaxAmount || (totals.calculatedTotalTax > 0 ? totals.calculatedTotalTax.toFixed(2) : "")}
                      onChange={(e) => setTotalTaxAmount(e.target.value)}
                    />
                    <button
                      type="button"
                      className="text-[#2563eb] hover:text-[#1d4ed8] transition-colors"
                      title="Edit tax amount"
                    >
                      <Pencil size={14} />
                    </button>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#eef2ff] my-4"></div>

                {/* TDS/TCS Section */}
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tdsTcsType"
                          value="TDS"
                          checked={tdsTcsType === "TDS"}
                          onChange={(e) => {
                            setTdsTcsType(e.target.value);
                            setTdsTcsTax(""); // Reset tax selection when switching type
                          }}
                          className="text-[#2563eb] focus:ring-[#2563eb]"
                        />
                        <span className="text-sm text-[#111827]">TDS</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="tdsTcsType"
                          value="TCS"
                          checked={tdsTcsType === "TCS"}
                          onChange={(e) => {
                            setTdsTcsType(e.target.value);
                            setTdsTcsTax(""); // Reset tax selection when switching type
                          }}
                          className="text-[#2563eb] focus:ring-[#2563eb]"
                        />
                        <span className="text-sm text-[#111827]">TCS</span>
                      </label>
                    </div>
                    <div className="flex-1 max-w-[200px]">
                      <TaxDropdown
                        rowId="tds-tcs"
                        value={tdsTcsTax}
                        onChange={setTdsTcsTax}
                        taxOptions={tdsTcsType === "TDS" ? tdsOptions : taxOptions}
                        nonTaxableOptions={tdsTcsType === "TDS" ? [] : nonTaxableOptions}
                        onNewTax={() => setShowNewTaxModal(true)}
                      />
                    </div>
                    <span className="text-sm text-[#64748b] w-20 text-right">- {totals.tdsTcsAmount}</span>
                  </div>
                </div>

                {/* Adjustment */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-sm font-medium text-[#111827]">Adjustment</span>
                  <div className="flex items-center gap-2">
                    <Input 
                      className="w-24 text-sm text-right border-dashed" 
                      value={adjustment}
                      onChange={(e) => setAdjustment(e.target.value)}
                      placeholder="0.00"
                    />
                    <button
                      type="button"
                      className="text-[#64748b] hover:text-[#111827] transition-colors"
                      title="Help"
                    >
                      <HelpCircle size={14} />
                    </button>
                  </div>
                  <span className="text-sm text-[#64748b] w-20 text-right">{totals.adjustmentAmount}</span>
                </div>

                {/* Divider */}
                <div className="border-t border-[#eef2ff] my-4"></div>

                {/* Total */}
                <div className="flex items-center justify-between text-base font-semibold text-[#111827]">
                  <span>Total</span>
                  <span>{totals.finalTotal}</span>
                </div>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Notes and Terms & Conditions - Below Totals */}
          <div className="mt-8 grid gap-6 md:grid-cols-2 overflow-visible">
            <div className="space-y-2">
              <Label>CUSTOMER NOTES</Label>
              <textarea 
                className="h-28 w-full rounded-xl border border-[#d4dbf4] bg-[#fbfcff] px-4 py-3 text-sm text-[#1f2937] placeholder:text-[#9aa4c2] focus:border-[#3a6bff] focus:outline-none focus:ring-2 focus:ring-[#dbe6ff] resize-none transition-colors" 
                placeholder="Will be displayed on purchase order" 
              />
            </div>

            <div className="space-y-2">
              <Label>TERMS & CONDITIONS</Label>
              <textarea 
                className="h-28 w-full rounded-xl border border-[#d4dbf4] bg-[#fbfcff] px-4 py-3 text-sm text-[#1f2937] placeholder:text-[#9aa4c2] focus:border-[#3a6bff] focus:outline-none focus:ring-2 focus:ring-[#dbe6ff] resize-none transition-colors" 
                placeholder="Enter the terms and conditions..." 
              />
            </div>
          </div>

          {/* Attach Files Section */}
          <div className="mt-8">
            <div className="rounded-xl border border-[#e6eafb] p-4">
              <div className="text-sm font-medium text-[#475569]">Attach Files to Purchase Order</div>
              <div className="mt-2">
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-[#cbd5f5] bg-white px-3 py-1.5 text-sm font-medium text-[#1f2937] hover:bg-[#eef2ff]">
                  <input type="file" className="hidden" />
                  Upload File
                </label>
              </div>
              <p className="mt-2 text-[11px] text-[#94a3b8]">You can upload a maximum of 10 files, 10MB each</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 border-t border-[#e7ebf8] bg-[#fafbff] px-8 py-5">
          <button className="rounded-md border border-[#d7dcf5] bg-white px-5 py-2.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
            Save as Draft
          </button>
          <button className="rounded-md border border-[#d7dcf5] bg-white px-5 py-2.5 text-sm font-semibold text-[#475569] hover:bg-[#f8fafc] transition-colors shadow-sm">
            Save and Send
          </button>
          <Link
            to="/purchase/orders"
            className="rounded-md border border-[#d7dcf5] bg-white px-5 py-2.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
          >
            Cancel
          </Link>
        </div>
      </div>

      {/* Address Selection Modal */}
      {showAddressModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-lg rounded-2xl border border-[#e1e5f5] bg-white shadow-[0_25px_80px_-45px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between border-b border-[#e7ebf8] px-6 py-4">
              <h2 className="text-lg font-semibold text-[#1f2937]">Change destination to deliver</h2>
              <button
                onClick={() => setShowAddressModal(false)}
                className="rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f1f5f9] hover:text-[#475569] transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[450px] overflow-y-auto px-6 py-4">
              <div className="space-y-3">
                {addresses.filter(addr => addr).map((address) => {
                  const addressId = address._id || address.id;
                  if (!addressId) return null;
                  return (
                    <div
                      key={addressId}
                      onClick={() => handleSelectAddress(addressId)}
                      className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                        selectedAddressId === addressId
                          ? "border-[#d7dcf5] bg-[#f8fafc] shadow-sm"
                          : "border-[#d7dcf5] bg-white hover:border-[#d7dcf5] hover:bg-[#f8fafc] hover:shadow-sm"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium leading-relaxed text-[#1f2937]">
                            {address && formatAddress(address).length > 0 ? (
                              <div className="space-y-0.5">
                                {formatAddress(address).map((line, index) => (
                                  <div key={index} className={index === 0 && address.attention ? "font-bold" : ""}>
                                    {line}
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div>No address details</div>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEditAddress(address);
                            }}
                            className="rounded-md p-1.5 text-[#64748b] hover:bg-[#e2e8f0] hover:text-[#1f2937] transition-colors"
                            aria-label="Edit address"
                          >
                            <Pencil size={16} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteAddress(addressId);
                            }}
                            className="rounded-md p-1.5 text-[#64748b] hover:bg-[#fee2e2] hover:text-[#ef4444] transition-colors"
                            aria-label="Delete address"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <button
                onClick={handleNewAddressClick}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-[#d7dcf5] bg-[#fafbff] px-4 py-3 text-sm font-semibold text-[#475569] hover:border-[#d7dcf5] hover:bg-[#f8fafc] transition-all"
              >
                <Plus size={18} />
                New Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Address Modal */}
      {showNewAddressModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-2xl rounded-2xl border border-[#e1e5f5] bg-white shadow-[0_25px_80px_-45px_rgba(15,23,42,0.35)]">
            <div className="flex items-center justify-between border-b border-[#e7ebf8] px-6 py-4">
              <h2 className="text-lg font-semibold text-[#1f2937]">
                {editingAddress ? "Edit Address" : "New address"}
              </h2>
              <button
                onClick={() => {
                  setShowNewAddressModal(false);
                  setEditingAddress(null);
                }}
                className="rounded-lg p-1.5 text-[#9ca3af] hover:bg-[#f1f5f9] hover:text-[#475569] transition-colors"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="max-h-[65vh] overflow-y-auto px-6 py-5">
              <div className="space-y-5">
                <div>
                  <Label>Attention</Label>
                  <Input
                    placeholder=""
                    value={editingAddress ? editingAddress.attention : newAddress.attention}
                    onChange={(e) => {
                      if (editingAddress) {
                        setEditingAddress({ ...editingAddress, attention: e.target.value });
                      } else {
                        setNewAddress({ ...newAddress, attention: e.target.value });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>Street 1</Label>
                  <textarea
                    className="w-full rounded-md border border-[#d7dcf5] px-3 py-2.5 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] min-h-[70px] resize-none"
                    placeholder="Enter street address"
                    value={editingAddress ? editingAddress.street1 : newAddress.street1}
                    onChange={(e) => {
                      if (editingAddress) {
                        setEditingAddress({ ...editingAddress, street1: e.target.value });
                      } else {
                        setNewAddress({ ...newAddress, street1: e.target.value });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>Street 2</Label>
                  <textarea
                    className="w-full rounded-md border border-[#d7dcf5] px-3 py-2.5 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] min-h-[70px] resize-none"
                    placeholder="Enter additional address details"
                    value={editingAddress ? editingAddress.street2 : newAddress.street2}
                    onChange={(e) => {
                      if (editingAddress) {
                        setEditingAddress({ ...editingAddress, street2: e.target.value });
                      } else {
                        setNewAddress({ ...newAddress, street2: e.target.value });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>City</Label>
                  <Input
                    placeholder=""
                    value={editingAddress ? editingAddress.city : newAddress.city}
                    onChange={(e) => {
                      if (editingAddress) {
                        setEditingAddress({ ...editingAddress, city: e.target.value });
                      } else {
                        setNewAddress({ ...newAddress, city: e.target.value });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>State/Province</Label>
                  <Input
                    placeholder=""
                    value={editingAddress ? editingAddress.state : newAddress.state}
                    onChange={(e) => {
                      if (editingAddress) {
                        setEditingAddress({ ...editingAddress, state: e.target.value });
                      } else {
                        setNewAddress({ ...newAddress, state: e.target.value });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>ZIP/Postal Code</Label>
                  <Input
                    placeholder=""
                    value={editingAddress ? editingAddress.zip : newAddress.zip}
                    onChange={(e) => {
                      if (editingAddress) {
                        setEditingAddress({ ...editingAddress, zip: e.target.value });
                      } else {
                        setNewAddress({ ...newAddress, zip: e.target.value });
                      }
                    }}
                  />
                </div>
                <div>
                  <Label>Country/Region</Label>
                  <Select
                    value={editingAddress ? editingAddress.country : newAddress.country}
                    onChange={(e) => {
                      if (editingAddress) {
                        setEditingAddress({ ...editingAddress, country: e.target.value });
                      } else {
                        setNewAddress({ ...newAddress, country: e.target.value });
                      }
                    }}
                  >
                    <option value="">Select or type to add</option>
                    <option value="India">India</option>
                    <option value="United States">United States</option>
                    <option value="United Kingdom">United Kingdom</option>
                    <option value="Canada">Canada</option>
                    <option value="Australia">Australia</option>
                  </Select>
                </div>
                <div>
                  <Label>Phone</Label>
                  <div className="flex items-center gap-2">
                    <Select className="w-24">
                      <option>+91</option>
                      <option>+1</option>
                      <option>+44</option>
                    </Select>
                    <Input
                      placeholder=""
                      value={editingAddress ? editingAddress.phone : newAddress.phone}
                      onChange={(e) => {
                        if (editingAddress) {
                          setEditingAddress({ ...editingAddress, phone: e.target.value });
                        } else {
                          setNewAddress({ ...newAddress, phone: e.target.value });
                        }
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-[#e7ebf8] px-6 py-4 bg-[#fafbff]">
              <button
                onClick={() => {
                  setShowNewAddressModal(false);
                  setEditingAddress(null);
                }}
                className="rounded-md border border-[#d7dcf5] bg-white px-5 py-2.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={editingAddress ? handleUpdateAddress : handleAddAddress}
                className="rounded-md border border-[#d7dcf5] bg-white px-5 py-2.5 text-sm font-semibold text-[#475569] hover:bg-[#f8fafc] transition-colors shadow-sm"
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

export default PurchaseOrderCreate;



