import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, List, Grid, Camera, MoreHorizontal, ArrowUp, Search, Filter, X, Plus, Pencil, Image as ImageIcon, Check, Info, Upload, FileText } from "lucide-react";
import baseUrl from "../api/api";

// Reuse components from Bills.jsx
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

// VendorDropdown Component (reused from Bills.jsx)
const VendorDropdown = ({ value, onChange, onNewVendor }) => {
  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [dropdownPos, setDropdownPos] = useState({
    top: 0,
    left: 0,
    width: 0,
  });

  useEffect(() => {
    const loadVendors = async () => {
      setLoading(true);
      try {
        const userStr = localStorage.getItem("rootfinuser");
        const user = userStr ? JSON.parse(userStr) : null;
        const userId = user?._id || user?.id || user?.email || user?.locCode || null;
        
        let vendorsFromAPI = [];
        
        if (userId) {
          try {
            const response = await fetch(`${API_URL}/api/purchase/vendors?userId=${userId}`);
            if (response.ok) {
              const data = await response.json();
              vendorsFromAPI = Array.isArray(data) ? data : [];
            }
          } catch (apiError) {
            console.warn("API fetch failed, trying localStorage:", apiError);
          }
        }
        
        let vendorsFromLocalStorage = [];
        try {
          const savedVendors = JSON.parse(localStorage.getItem("vendors") || "[]");
          vendorsFromLocalStorage = Array.isArray(savedVendors) ? savedVendors : [];
        } catch (localError) {
          console.warn("Error reading localStorage:", localError);
        }
        
        const vendorMap = new Map();
        
        vendorsFromAPI.forEach(vendor => {
          const key = vendor.displayName || vendor.companyName || vendor._id || vendor.id;
          if (key) vendorMap.set(key, vendor);
        });
        
        vendorsFromLocalStorage.forEach(vendor => {
          const key = vendor.displayName || vendor.companyName || vendor.id;
          if (key && !vendorMap.has(key)) {
            vendorMap.set(key, vendor);
          }
        });
        
        setVendors(Array.from(vendorMap.values()));
      } catch (error) {
        console.error("Error loading vendors:", error);
        try {
          const savedVendors = JSON.parse(localStorage.getItem("vendors") || "[]");
          setVendors(Array.isArray(savedVendors) ? savedVendors : []);
        } catch {
          setVendors([]);
        }
      } finally {
        setLoading(false);
      }
    };

    loadVendors();
    
    const handleVendorSaved = () => {
      loadVendors();
    };
    
    const handleStorageChange = (e) => {
      if (e.key === "vendors") {
        loadVendors();
      }
    };
    
    window.addEventListener("vendorSaved", handleVendorSaved);
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      window.removeEventListener("vendorSaved", handleVendorSaved);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, [API_URL]);

  useEffect(() => {
    if (value) {
      if (typeof value === 'object' && value !== null) {
        setSelectedVendor(value);
      } else if (vendors.length > 0) {
        const vendor = vendors.find((v) => 
          v._id === value || 
          v.id === value || 
          v.displayName === value || 
          v.companyName === value
        );
        setSelectedVendor(vendor || null);
      }
    } else {
      setSelectedVendor(null);
    }
  }, [value, vendors]);

  const updatePos = () => {
    if (!buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setDropdownPos({
      top: rect.bottom + 6,
      left: rect.left,
      width: Math.max(rect.width, 400),
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

  const filteredVendors = vendors.filter((vendor) => {
    const searchLower = searchTerm.toLowerCase();
    const displayName = (vendor.displayName || "").toLowerCase();
    const companyName = (vendor.companyName || "").toLowerCase();
    const email = (vendor.email || "").toLowerCase();
    return displayName.includes(searchLower) || companyName.includes(searchLower) || email.includes(searchLower);
  });

  const handleSelectVendor = (vendor) => {
    onChange(vendor);
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClearVendor = (e) => {
    e.stopPropagation();
    onChange("");
    setSelectedVendor(null);
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
      <div className="rounded-xl shadow-xl bg-white border border-[#d7dcf5] w-full overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#e2e8f0] px-3 py-2.5 bg-[#fafbff]">
          <Search size={14} className="text-[#94a3b8]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vendors"
            className="h-8 w-full border-none bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#94a3b8]"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
        <div className="py-2 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-[#64748b]">Loading vendors...</div>
          ) : filteredVendors.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#64748b]">
              {searchTerm ? "No vendors found" : "No vendors available"}
            </div>
          ) : (
            <>
              {filteredVendors.map((vendor) => (
                <div
                  key={vendor._id || vendor.id || vendor.displayName}
                  onClick={() => handleSelectVendor(vendor)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8fafc] cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1f2937] truncate">
                      {vendor.displayName || vendor.companyName || "Unnamed Vendor"}
                    </p>
                    {vendor.email && (
                      <p className="text-xs text-[#64748b] truncate mt-0.5">{vendor.email}</p>
                    )}
                  </div>
                  {selectedVendor && (selectedVendor._id === vendor._id || selectedVendor.id === vendor.id) && (
                    <Check size={16} className="text-[#2563eb] shrink-0" />
                  )}
                </div>
              ))}
              <div
                onClick={() => {
                  onNewVendor();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#2563eb] hover:bg-[#f8fafc] cursor-pointer transition-colors border-t border-[#e2e8f0] mt-2"
              >
                <Plus size={16} />
                <span>New Vendor</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="relative w-full">
        <div className="flex items-center gap-2">
          <input
            ref={buttonRef}
            onClick={toggleDropdown}
            type="text"
            readOnly
            value={selectedVendor ? (selectedVendor.displayName || selectedVendor.companyName) : ""}
            placeholder="Select a Vendor"
            className="flex-1 h-[36px] rounded-md border border-[#d7dcf5] bg-white text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors cursor-pointer px-[10px] py-[6px]"
          />
          <button
            type="button"
            className="h-[36px] w-[36px] rounded-md border border-[#d7dcf5] bg-[#2563eb] text-white hover:bg-[#1d4ed8] transition-colors flex items-center justify-center"
            title="Quick Add"
          >
            <Search size={16} />
          </button>
        </div>
      </div>
      {typeof document !== "undefined" && document.body && createPortal(dropdownPortal, document.body)}
    </>
  );
};

// TaxDropdown Component (simplified version)
const TaxDropdown = ({ rowId, value, onChange, taxOptions, onNewTax, ...props }) => {
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
      const tax = taxOptions.find((t) => t.id === value);
      setSelectedTax(tax);
    } else {
      setSelectedTax(null);
    }
  }, [value, taxOptions]);

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
    (tax.display || tax.name || "").toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="py-2 max-h-[400px] overflow-y-auto">
          {filteredTaxOptions.map((tax) => (
            <div
              key={tax.id}
              onClick={() => handleSelectTax(tax.id)}
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-[#f8fafc] cursor-pointer transition-colors"
            >
              <span className="text-sm text-[#1f2937]">{tax.display || tax.name}</span>
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
      <div className="relative w-full overflow-visible m-0 p-0">
        <button
          ref={buttonRef}
          onClick={toggleDropdown}
          type="button"
          className="tax-dropdown-button w-full h-[36px] rounded-md border border-[#d7dcf5] bg-white text-sm text-[#1f2937] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors cursor-pointer flex items-center justify-between px-[10px] py-[6px] m-0"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="truncate text-left">
              {selectedTax ? selectedTax.display || selectedTax.name : "Select a Tax"}
            </span>
            {selectedTax && (
              <span
                onClick={handleClearTax}
                className="no-blue-button text-[#1f2937] hover:text-[#dc2626] transition-colors inline-flex items-center bg-transparent border-none p-0.5 rounded hover:bg-[#fee2e2] shrink-0 m-0 cursor-pointer"
                title="Clear selection"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <X size={14} strokeWidth={2} />
              </span>
            )}
          </div>
          <ChevronDown 
            size={14} 
            className={`text-[#1f2937] transition-transform shrink-0 ml-1.5 ${isOpen ? "rotate-180" : ""}`}
            strokeWidth={2}
          />
        </button>
      </div>
      {typeof document !== "undefined" && document.body && createPortal(dropdownPortal, document.body)}
    </>
  );
};

// ItemDropdown Component (simplified)
const ItemDropdown = ({ rowId, value, onChange, onNewItem }) => {
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
    setIsOpen(false);
    setSearchTerm("");
  };

  const handleClearItem = (e) => {
    e.stopPropagation();
    onChange("");
    setSelectedItem(null);
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
      <div className="rounded-xl shadow-xl bg-white border border-[#d7dcf5] w-full overflow-hidden">
        <div className="flex items-center gap-2 border-b border-[#e2e8f0] px-3 py-2.5 bg-[#fafbff]">
          <Search size={14} className="text-[#94a3b8]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search items"
            className="h-8 w-full border-none bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#94a3b8]"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
        <div className="py-2 max-h-[400px] overflow-y-auto">
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-[#64748b]">Loading items...</div>
          ) : filteredItems.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#64748b]">
              {searchTerm ? "No items found" : "No items available"}
            </div>
          ) : (
            <>
              {filteredItems.map((item) => (
                <div
                  key={item._id}
                  onClick={() => handleSelectItem(item)}
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-[#f8fafc] cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#1f2937] truncate">
                      {item.itemName || "Unnamed Item"}
                    </p>
                    {item.sku && (
                      <p className="text-xs text-[#64748b] truncate mt-0.5">SKU: {item.sku}</p>
                    )}
                  </div>
                  {selectedItem && selectedItem._id === item._id && (
                    <Check size={16} className="text-[#2563eb] shrink-0" />
                  )}
                </div>
              ))}
              <div
                onClick={() => {
                  onNewItem();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#2563eb] hover:bg-[#f8fafc] cursor-pointer transition-colors border-t border-[#e2e8f0] mt-2"
              >
                <Plus size={16} />
                <span>New Item</span>
              </div>
            </>
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

// New Vendor Credit Form Component
const NewVendorCreditForm = () => {
  const navigate = useNavigate();
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [branch, setBranch] = useState("Head Office");
  const [creditNoteNumber, setCreditNoteNumber] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [creditDate, setCreditDate] = useState(() => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  });
  const [subject, setSubject] = useState("");
  const [reverseCharge, setReverseCharge] = useState(false);
  const [warehouse, setWarehouse] = useState("");
  const [atTransactionLevel, setAtTransactionLevel] = useState("At Transaction Level");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState({ value: "0", type: "%" });
  const [tdsTcsType, setTdsTcsType] = useState("TDS");
  const [tdsTcsTax, setTdsTcsTax] = useState("");
  const [adjustment, setAdjustment] = useState("0.00");
  const [saving, setSaving] = useState(false);

  const [taxOptions] = useState([
    { id: "gst0", name: "GST0", rate: 0, display: "GST0 [0%]" },
    { id: "gst5", name: "GST5", rate: 5, display: "GST5 [5%]" },
    { id: "gst12", name: "GST12", rate: 12, display: "GST12 [12%]" },
    { id: "gst18", name: "GST18", rate: 18, display: "GST18 [18%]" },
    { id: "gst28", name: "GST28", rate: 28, display: "GST28 [28%]" },
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

  const [tableRows, setTableRows] = useState([
    {
      id: 1,
      item: "",
      itemData: null,
      account: "",
      size: "",
      quantity: "1.00",
      rate: "0.00",
      tax: "",
      amount: "0.00",
    },
  ]);

  const handleUpdateRow = (rowId, field, value) => {
    setTableRows(rows =>
      rows.map(row => {
        if (row.id === rowId) {
          const updated = { ...row, [field]: value };
          // Calculate amount when quantity or rate changes
          if (field === "quantity" || field === "rate") {
            const qty = parseFloat(updated.quantity) || 0;
            const rate = parseFloat(updated.rate) || 0;
            updated.amount = (qty * rate).toFixed(2);
          }
          return updated;
        }
        return row;
      })
    );
  };

  const handleAddRow = () => {
    setTableRows(rows => [
      ...rows,
      {
        id: Math.max(...rows.map(r => r.id), 0) + 1,
        item: "",
        itemData: null,
        account: "",
        size: "",
        quantity: "1.00",
        rate: "0.00",
        tax: "",
        amount: "0.00",
      },
    ]);
  };

  const handleDeleteRow = (rowId) => {
    setTableRows(rows => rows.filter(row => row.id !== rowId));
  };

  const calculateTotals = () => {
    const subTotal = tableRows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);
    const discountValue = parseFloat(discount.value) || 0;
    const discountAmount = discount.type === "%" 
      ? (subTotal * discountValue / 100)
      : discountValue;
    const tdsTcsAmount = 0; // Will be calculated based on TDS/TCS selection
    const adjustmentValue = parseFloat(adjustment) || 0;
    const total = subTotal - discountAmount - tdsTcsAmount + adjustmentValue;
    
    return {
      subTotal: subTotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      tdsTcsAmount: tdsTcsAmount.toFixed(2),
      adjustment: adjustmentValue.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const totals = calculateTotals();

  const handleSaveCredit = async (status) => {
    if (!selectedVendor || !creditNoteNumber || !creditDate) {
      alert("Please fill in Vendor Name, Credit Note#, and Credit Date.");
      return;
    }

    setSaving(true);
    try {
      // Save logic will be implemented later
      alert(`Vendor Credit saved successfully as ${status === "draft" ? "Draft" : "Open"}`);
      navigate("/purchase/vendor-credits");
    } catch (error) {
      console.error("Error saving vendor credit:", error);
      alert(error.message || "Failed to save vendor credit. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#e6eafb] px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#1f2937]">New Vendor Credits</h1>
        <Link
          to="/purchase/vendor-credits"
          className="p-2 hover:bg-[#f1f5f9] rounded-md transition-colors"
        >
          <X size={20} className="text-[#64748b]" />
        </Link>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-xl border border-[#e6eafb] shadow-sm">
          <div className="p-6 space-y-6">
            {/* Vendor and Credit Details */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label required>Vendor Name</Label>
                  <VendorDropdown
                    value={selectedVendor}
                    onChange={(vendor) => setSelectedVendor(vendor)}
                    onNewVendor={() => navigate("/purchase/vendors/new")}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Branch</Label>
                  <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
                    <option>Head Office</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label required>Credit Note#</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={creditNoteNumber}
                      onChange={(e) => setCreditNoteNumber(e.target.value)}
                      placeholder=""
                    />
                    <button
                      type="button"
                      className="h-[36px] w-[36px] rounded-full border border-[#d7dcf5] bg-[#f0f4ff] text-[#2563eb] hover:bg-[#e0e7ff] transition-colors flex items-center justify-center"
                      title="Information"
                    >
                      <Info size={16} />
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Order Number</Label>
                  <Input
                    value={orderNumber}
                    onChange={(e) => setOrderNumber(e.target.value)}
                    placeholder=""
                  />
                </div>

                <div className="space-y-2">
                  <Label>Vendor Credit Date</Label>
                  <Input
                    type="text"
                    value={creditDate}
                    onChange={(e) => setCreditDate(e.target.value)}
                    placeholder="dd/mm/yyyy"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <div className="relative">
                    <textarea
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Enter a subject within 250 characters"
                      maxLength={250}
                      className="w-full rounded-md border border-[#d7dcf5] bg-white text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors px-3 py-2.5 min-h-[80px] resize-none"
                    />
                    <div className="absolute top-2 right-2 flex items-center gap-2">
                      <button
                        type="button"
                        className="p-1 text-[#64748b] hover:text-[#1f2937] transition-colors"
                        title="Edit"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        type="button"
                        className="h-5 w-5 rounded-full border border-[#d7dcf5] bg-[#f0f4ff] text-[#2563eb] hover:bg-[#e0e7ff] transition-colors flex items-center justify-center"
                        title="Information"
                      >
                        <Info size={12} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="reverseCharge"
                    checked={reverseCharge}
                    onChange={(e) => setReverseCharge(e.target.checked)}
                    className="h-4 w-4 rounded border-[#d1d9f2] text-[#4f46e5] focus:ring-[#4338ca]"
                  />
                  <label htmlFor="reverseCharge" className="text-sm text-[#1f2937] cursor-pointer">
                    This transaction is applicable for reverse charge
                  </label>
                </div>

                <div className="space-y-2">
                  <Label>Warehouse</Label>
                  <Select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
                    <option value="">Select a warehouse</option>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>At Transaction Level</Label>
                  <Select value={atTransactionLevel} onChange={(e) => setAtTransactionLevel(e.target.value)}>
                    <option>At Transaction Level</option>
                  </Select>
                </div>
              </div>
            </div>

            {/* Items Table */}
            <div className="border-t border-[#e6eafb] pt-6">
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-[#e6eafb]">
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">ITEM DETAILS</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">ACCOUNT</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">SIZE</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">QUANTITY</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">RATE</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">TAX</th>
                      <th className="text-left py-3 px-4 text-xs font-semibold text-[#64748b] uppercase tracking-wide">AMOUNT</th>
                      <th className="w-12"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef2ff]">
                    {tableRows.map((row) => (
                      <tr key={row.id}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#f5f7ff]">
                              <ImageIcon size={16} className="text-[#aeb8d8]" />
                            </div>
                            <ItemDropdown
                              rowId={row.id}
                              value={row.itemData || row.item}
                              onChange={(value) => handleUpdateRow(row.id, "item", value)}
                              onNewItem={() => navigate("/shoe-sales/items/new")}
                            />
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Select
                            value={row.account}
                            onChange={(e) => handleUpdateRow(row.id, "account", e.target.value)}
                            className="text-sm table-input"
                          >
                            <option value="">Select an account</option>
                          </Select>
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={row.size}
                            onChange={(e) => handleUpdateRow(row.id, "size", e.target.value)}
                            className="table-input"
                            placeholder=""
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            type="number"
                            value={row.quantity}
                            onChange={(e) => handleUpdateRow(row.id, "quantity", e.target.value)}
                            className="table-input"
                            step="0.01"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="space-y-1">
                            <Input
                              type="number"
                              value={row.rate}
                              onChange={(e) => handleUpdateRow(row.id, "rate", e.target.value)}
                              className="table-input"
                              step="0.01"
                            />
                            <div className="flex items-center gap-1">
                              <Label className="text-[10px]">RATE</Label>
                              <Info size={10} className="text-[#64748b]" />
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <TaxDropdown
                            rowId={row.id}
                            value={row.tax}
                            onChange={(value) => handleUpdateRow(row.id, "tax", value)}
                            taxOptions={taxOptions}
                            onNewTax={() => {}}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <Input
                            value={row.amount}
                            readOnly
                            className="table-input"
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              className="p-1 text-[#64748b] hover:text-[#1f2937] transition-colors"
                            >
                              <MoreHorizontal size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRow(row.id)}
                              className="p-1 text-[#64748b] hover:text-[#dc2626] transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleAddRow}
                  className="inline-flex items-center gap-2 rounded-md bg-[#3762f9] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#2748c9]"
                >
                  <Plus size={16} />
                  Add New Row
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-2 rounded-md border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-semibold text-[#475569] transition hover:bg-[#f8fafc]"
                >
                  <FileText size={16} />
                  Add Items in Bulk
                </button>
              </div>
            </div>

            {/* Notes, Attachments, and Summary Section */}
            <div className="grid gap-6 md:grid-cols-2 border-t border-[#e6eafb] pt-6">
              {/* Left: Notes and Attachments */}
              <div className="space-y-6">
                {/* Notes */}
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder=""
                    className="w-full rounded-md border border-[#d7dcf5] bg-white text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors px-3 py-2.5 min-h-[200px] resize-none"
                  />
                </div>

                {/* Attachments */}
                <div className="space-y-2">
                  <Label>Attach File(s) to Vendor Credits</Label>
                  <div className="border-2 border-dashed border-[#d7dcf5] rounded-md p-6 text-center">
                    <button
                      type="button"
                      className="inline-flex items-center gap-2 rounded-md border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] transition hover:bg-[#f8fafc]"
                    >
                      <Upload size={16} />
                      Upload File
                    </button>
                    <p className="mt-2 text-xs text-[#64748b]">
                      You can upload a maximum of 5 files, 10MB each
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Summary */}
              <div className="space-y-4 bg-[#fafbff] rounded-lg border border-[#e6eafb] p-4">
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
                        type="number"
                        step="0.01"
                      />
                      <Select 
                        className="w-16 text-sm"
                        value={discount.type}
                        onChange={(e) => setDiscount({ ...discount, type: e.target.value })}
                      >
                        <option value="%">%</option>
                        <option value="₹">₹</option>
                      </Select>
                    </div>
                    <span className="text-sm text-[#64748b] w-20 text-right">{totals.discountAmount}</span>
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
                      <Select
                        value={tdsTcsTax}
                        onChange={(e) => setTdsTcsTax(e.target.value)}
                        className="text-sm"
                      >
                        <option value="">Select a Tax</option>
                        {tdsOptions.map(option => (
                          <option key={option.id} value={option.id}>{option.display}</option>
                        ))}
                      </Select>
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
                      type="number"
                      step="0.01"
                    />
                    <button
                      type="button"
                      className="h-5 w-5 rounded-full border border-[#d7dcf5] bg-[#f0f4ff] text-[#2563eb] hover:bg-[#e0e7ff] transition-colors flex items-center justify-center"
                      title="Information"
                    >
                      <Info size={12} />
                    </button>
                    <span className="text-sm text-[#64748b] w-20 text-right">{totals.adjustment}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#eef2ff] my-4"></div>

                {/* Total */}
                <div className="flex items-center justify-between text-base font-semibold text-[#111827]">
                  <span>Total (₹)</span>
                  <span>{totals.total}</span>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-3 border-t border-[#e6eafb] pt-6">
              <button
                type="button"
                onClick={() => navigate("/purchase/vendor-credits")}
                className="rounded-md border border-[#d7dcf5] bg-white px-5 py-2.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleSaveCredit("draft")}
                disabled={saving}
                className="rounded-md border border-[#d7dcf5] bg-white px-5 py-2.5 text-sm font-semibold text-[#475569] hover:bg-[#f8fafc] transition-colors shadow-sm"
              >
                Save as Draft
              </button>
              <button
                type="button"
                onClick={() => handleSaveCredit("open")}
                disabled={saving}
                className="rounded-md bg-[#3762f9] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2748c9] shadow-sm"
              >
                Save as Open
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main VendorCredits Component
const VendorCredits = () => {
  const location = useLocation();
  const isNewCredit = location.pathname === "/purchase/vendor-credits/new";

  if (isNewCredit) {
    return <NewVendorCreditForm />;
  }

  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb] p-6">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold text-[#1f2937] leading-tight">
            All Vendor Credits
          </h1>
          <button className="text-[#2563eb] hover:text-[#1d4ed8] transition-colors">
            <ChevronDown size={16} />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button className="rounded-md border border-[#d7dcf5] bg-white px-3 py-1.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
            <List size={16} />
          </button>
          <button className="rounded-md border border-[#d7dcf5] bg-white px-3 py-1.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
            <Grid size={16} />
          </button>
          <Link
            to="/purchase/vendor-credits/new"
            className="inline-flex items-center gap-2 rounded-md bg-[#3762f9] px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-[#2748c9]"
          >
            <span>+</span>
            <span>New</span>
          </Link>
          <button className="rounded-md border border-[#d7dcf5] bg-white px-3 py-1.5 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      {/* Empty State */}
      <div className="bg-white rounded-xl border border-[#e6eafb] shadow-sm p-12">
        <div className="text-center">
          <p className="text-lg text-[#64748b]">No vendor credits found</p>
        </div>
      </div>
    </div>
  );
};

export default VendorCredits;

