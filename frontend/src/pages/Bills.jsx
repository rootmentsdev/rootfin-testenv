import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { Search, X, Plus, Pencil, Image as ImageIcon, ChevronDown, Mail, Printer, Download, Trash2, Link as LinkIcon, Package, PackageX, MoreVertical, Upload, Calendar } from "lucide-react";
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

// TaxDropdown Component (from PurchaseOrderCreate)
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

// VendorDropdown Component
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

  // Fetch vendors from API and localStorage (fallback)
  useEffect(() => {
    const loadVendors = async () => {
      setLoading(true);
      try {
        // Get user info
        const userStr = localStorage.getItem("rootfinuser");
        const user = userStr ? JSON.parse(userStr) : null;
        const userId = user?._id || user?.id || user?.email || user?.locCode || null;
        
        let vendorsFromAPI = [];
        
        // Try to fetch from MongoDB API first
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
        
        // Fallback to localStorage if API returns no vendors or fails
        let vendorsFromLocalStorage = [];
        try {
          const savedVendors = JSON.parse(localStorage.getItem("vendors") || "[]");
          vendorsFromLocalStorage = Array.isArray(savedVendors) ? savedVendors : [];
        } catch (localError) {
          console.warn("Error reading localStorage:", localError);
        }
        
        // Combine both sources, prioritizing API results
        // Use a Map to avoid duplicates (by displayName or id)
        const vendorMap = new Map();
        
        // Add API vendors first
        vendorsFromAPI.forEach(vendor => {
          const key = vendor.displayName || vendor.companyName || vendor._id || vendor.id;
          if (key) vendorMap.set(key, vendor);
        });
        
        // Add localStorage vendors if not already present
        vendorsFromLocalStorage.forEach(vendor => {
          const key = vendor.displayName || vendor.companyName || vendor.id;
          if (key && !vendorMap.has(key)) {
            vendorMap.set(key, vendor);
          }
        });
        
        setVendors(Array.from(vendorMap.values()));
      } catch (error) {
        console.error("Error loading vendors:", error);
        // Final fallback to localStorage only
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
    
    // Listen for custom event when vendor is saved
    const handleVendorSaved = () => {
      loadVendors();
    };
    
    // Also listen for localStorage changes
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

  // Set selected vendor from value
  useEffect(() => {
    if (value) {
      if (typeof value === 'object' && value !== null) {
        setSelectedVendor(value);
      } else if (vendors.length > 0) {
        // Support both MongoDB _id and old id format
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

  // Filter vendors based on search term
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
      <div className="rounded-xl shadow-xl bg-white border border-[#d7dcf5] overflow-hidden" style={{ width: '400px', maxWidth: '90vw' }}>
        <div className="flex items-center gap-2 border-b border-[#e2e8f0] px-3 py-2.5 bg-[#fafbff]">
          <Search size={14} className="text-[#94a3b8]" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search vendors..."
            className="h-8 w-full border-none bg-transparent text-sm text-[#1f2937] outline-none placeholder:text-[#94a3b8]"
            onClick={(e) => e.stopPropagation()}
            autoFocus
          />
        </div>
        <div className="py-2 max-h-[400px] overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d3d3d3 #f5f5f5' }}>
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-[#64748b]">Loading vendors...</div>
          ) : filteredVendors.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[#64748b]">
              {searchTerm ? "No vendors found" : "No vendors available"}
            </div>
          ) : (
            filteredVendors.map((vendor) => {
              const isSelected = (typeof value === 'object' && (value?._id === vendor._id || value?.id === vendor._id || value?.id === vendor.id)) || 
                                 (typeof value === 'string' && (value === vendor._id || value === vendor.id || value === (vendor.displayName || vendor.companyName)));
              
              return (
                <div
                  key={vendor._id || vendor.id}
                  onClick={() => handleSelectVendor(vendor)}
                  className={`px-4 py-3 cursor-pointer transition-colors border-b border-[#f1f5f9] ${
                    isSelected
                      ? "bg-[#2563eb] text-white"
                      : "text-[#1f2937] hover:bg-[#f8fafc]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium text-sm ${isSelected ? "text-white" : "text-[#1f2937]"}`}>
                        {vendor.displayName || vendor.companyName || "Unnamed Vendor"}
                      </div>
                      {vendor.email && (
                        <div className={`text-xs mt-1 ${isSelected ? "text-white/80" : "text-[#64748b]"}`}>
                          {vendor.email}
                        </div>
                      )}
                      {vendor.sourceOfSupply && (
                        <div className={`text-xs mt-0.5 ${isSelected ? "text-white/80" : "text-[#64748b]"}`}>
                          Source: {vendor.sourceOfSupply}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div
            onClick={() => {
              onNewVendor();
              setIsOpen(false);
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm text-[#2563eb] hover:bg-[#f8fafc] cursor-pointer transition-colors border-t border-[#e2e8f0] mt-2"
          >
            <Plus size={16} />
            <span>Add New Vendor</span>
          </div>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <>
      <div className="relative w-full overflow-visible m-0 p-0">
        <div className="relative">
          <input
            ref={buttonRef}
            onClick={toggleDropdown}
            type="text"
            readOnly
            value={selectedVendor ? (selectedVendor.displayName || selectedVendor.companyName || "") : ""}
            placeholder="Type or click to select a vendor"
            className="w-full h-[36px] rounded-md border border-[#d7dcf5] bg-white text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors cursor-pointer px-[10px] py-[6px] pr-8"
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
            {selectedVendor && (
              <button
                onClick={handleClearVendor}
                className="text-[#1f2937] hover:text-[#dc2626] transition-colors inline-flex items-center bg-transparent border-none p-0.5 rounded hover:bg-[#fee2e2] shrink-0 m-0"
                type="button"
                title="Clear selection"
                onMouseDown={(e) => e.stopPropagation()}
              >
                <X size={14} strokeWidth={2} />
              </button>
            )}
            <ChevronDown 
              size={14} 
              className={`text-[#1f2937] transition-transform shrink-0 ${isOpen ? "rotate-180" : ""}`}
              strokeWidth={2}
            />
          </div>
        </div>
      </div>
      {typeof document !== "undefined" && document.body && createPortal(dropdownPortal, document.body)}
    </>
  );
};

// ItemDropdown Component (from PurchaseOrderCreate)
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

  useEffect(() => {
    const fetchItems = async () => {
      setLoading(true);
      try {
        // Fetch items with a higher limit for dropdown (100 items should be enough for most cases)
        const response = await fetch(`${API_URL}/api/shoe-sales/items?page=1&limit=100`);
        if (!response.ok) throw new Error("Failed to fetch items");
        const data = await response.json();
        
        // Handle both old format (array) and new format (object with items and pagination)
        let itemsList = [];
        if (Array.isArray(data)) {
          // Old format - direct array
          itemsList = data;
        } else if (data.items && Array.isArray(data.items)) {
          // New format - paginated response
          itemsList = data.items;
        }
        
        // Filter active items
        const activeItems = itemsList.filter((i) => i?.isActive !== false && String(i?.isActive).toLowerCase() !== "false");
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

  const getStockOnHand = (item) => {
    if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks)) return 0;
    return item.warehouseStocks.reduce((sum, ws) => {
      const stock = typeof ws.stockOnHand === 'number' ? ws.stockOnHand : 0;
      return sum + stock;
    }, 0);
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
        <div className="relative w-full overflow-visible m-0 p-0">
          <div className="space-y-2">
            <div className="font-medium text-sm text-[#1f2937]">
              {selectedItem.itemName || "Unnamed Item"}
            </div>
            <div className="text-xs text-[#64748b]">
              SKU: {selectedItem.sku || "N/A"}
            </div>
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
                    }}
                    title="Edit HSN Code"
                  >
                    <Pencil size={12} />
                  </button>
                </div>
              )}
            </div>
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
      {typeof document !== "undefined" && document.body && createPortal(dropdownPortal, document.body)}
    </>
  );
};

const NewBillForm = ({ billId, isEditMode = false }) => {
  const navigate = useNavigate();
  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";
  const [vendorName, setVendorName] = useState("");
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [sourceOfSupply, setSourceOfSupply] = useState("");
  const [destinationOfSupply, setDestinationOfSupply] = useState("");
  const [branch, setBranch] = useState("Warehouse");
  const [saving, setSaving] = useState(false);
  const [loadingBill, setLoadingBill] = useState(false);
  const [billNumber, setBillNumber] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [billDate, setBillDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const billDateInputRef = useRef(null);
  const dueDateInputRef = useRef(null);
  const [paymentTerms, setPaymentTerms] = useState("Net 60");
  const [reverseCharge, setReverseCharge] = useState(false);
  const [subject, setSubject] = useState("");
  const [warehouse, setWarehouse] = useState("");
  const [taxExclusive, setTaxExclusive] = useState(true);
  const [atTransactionLevel, setAtTransactionLevel] = useState(true);
  const [notes, setNotes] = useState("");
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
  const [tableRows, setTableRows] = useState([
    {
      id: 1,
      item: "",
      itemData: null,
      itemDescription: "",
      account: "",
      size: "",
      quantity: "1.00",
      rate: "0.00",
      tax: "",
      customer: "",
      amount: "0.00",
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
    },
  ]);

  // Calculate GST for a single line item
  const calculateGSTLineItem = (row, discountConfig, allTaxOptions) => {
    const quantity = parseFloat(row.quantity) || 0;
    const rate = parseFloat(row.rate) || 0;
    // Zoho Books: Calculate base amount and round to 2 decimals immediately
    const rawBaseAmount = quantity * rate;
    const baseAmount = Math.round(rawBaseAmount * 100) / 100;
    // Ensure exactly 2 decimal places
    const roundedBaseAmount = parseFloat(baseAmount.toFixed(2));

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

    const selectedTax = allTaxOptions.find(t => t.id === row.tax);
    
    let taxPercent = 0;
    let cgstPercent = 0;
    let sgstPercent = 0;
    let igstPercent = 0;
    let isInterState = false;
    let taxCode = "";

    const itemData = row.itemData;
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
      taxCode = itemData.taxRateIntra || itemData.taxRateInter || row.tax || "";
    } else if (selectedTax && selectedTax.rate !== undefined && selectedTax.rate > 0) {
      taxPercent = selectedTax.rate;
      taxCode = selectedTax.id;
      isInterState = false;
    }

    if (taxPercent > 0) {
      if (isInterState) {
        igstPercent = taxPercent;
      } else {
        cgstPercent = taxPercent / 2;
        sgstPercent = taxPercent / 2;
      }
    }

    let discountedAmount = roundedBaseAmount;
    let amountForTaxCalculation = roundedBaseAmount;
    
    if (!discountConfig.applyAfterTax && discountConfig.value && parseFloat(discountConfig.value) > 0) {
      if (discountConfig.type === "%") {
        const discountPercent = parseFloat(discountConfig.value);
        discountedAmount = baseAmount - (baseAmount * discountPercent / 100);
      }
      discountedAmount = Math.max(0, discountedAmount);
      // Round to 2 decimal places
      discountedAmount = parseFloat(discountedAmount.toFixed(2));
      amountForTaxCalculation = discountedAmount;
    } else {
      // Ensure baseAmount is rounded to 2 decimals before tax calculation (Zoho Books behavior)
      amountForTaxCalculation = parseFloat(baseAmount.toFixed(2));
    }

    // Zoho Books: Round amountForTaxCalculation to 2 decimals before calculating tax
    amountForTaxCalculation = parseFloat(amountForTaxCalculation.toFixed(2));

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (isInterState && igstPercent > 0) {
      // Zoho Books: Calculate tax on rounded amount, round to 2 decimals using standard rounding
      // Formula: round(amount * rate / 100) to 2 decimals
      const taxValue = (amountForTaxCalculation * igstPercent) / 100;
      // Round to 2 decimal places (Zoho Books uses standard rounding)
      igstAmount = Math.round(taxValue * 100) / 100;
    } else if (!isInterState && (cgstPercent > 0 || sgstPercent > 0)) {
      // Zoho Books: Calculate tax on rounded amount, round to 2 decimals using standard rounding
      const cgstValue = (amountForTaxCalculation * cgstPercent) / 100;
      const sgstValue = (amountForTaxCalculation * sgstPercent) / 100;
      // Round to 2 decimal places (Zoho Books uses standard rounding)
      cgstAmount = Math.round(cgstValue * 100) / 100;
      sgstAmount = Math.round(sgstValue * 100) / 100;
    }

    // Round lineTaxTotal to avoid floating point precision issues
    const lineTaxTotal = parseFloat((cgstAmount + sgstAmount + igstAmount).toFixed(2));
    const lineTotal = discountedAmount + lineTaxTotal;

    return {
      baseAmount: roundedBaseAmount.toFixed(2),
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

  const handleUpdateRow = (rowId, field, value) => {
    setTableRows(
      tableRows.map((row) => {
        if (row.id === rowId) {
          const updated = { ...row, [field]: value };
          
          if (field === "item" && typeof value === 'object' && value !== null) {
            updated.itemData = value;
            updated.item = value.itemName || value._id || "";
            
            if (value.sellingPrice !== undefined && value.sellingPrice !== null && (!updated.rate || updated.rate === "0.00" || updated.rate === "0")) {
              updated.rate = value.sellingPrice.toString();
            }
            
            if (value.salesAccount && !updated.account) {
              updated.account = value.salesAccount;
            }
            
            if (value.size && !updated.size) {
              updated.size = value.size;
            }
            
            let matchedTaxId = null;
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
            
            const matchTaxByRate = (taxRateValue) => {
              const taxRate = extractTaxRate(taxRateValue);
              if (taxRate === null) return null;
              const exactMatch = taxOptions.find(tax => tax.rate === taxRate);
              if (exactMatch) return exactMatch.id;
              const roundedRate = Math.round(taxRate);
              const roundedMatch = taxOptions.find(tax => tax.rate === roundedRate);
              if (roundedMatch) return roundedMatch.id;
              return null;
            };
            
            if (value.taxRateIntra) {
              matchedTaxId = matchTaxByRate(value.taxRateIntra);
            }
            
            if (!matchedTaxId && value.taxRateInter) {
              matchedTaxId = matchTaxByRate(value.taxRateInter);
            }
            
            if (!matchedTaxId && value.taxPreference === "non-taxable") {
              matchedTaxId = nonTaxableOptions[0]?.id || "";
            }
            
            if (matchedTaxId) {
              updated.tax = matchedTaxId;
            } else if (value.taxRateIntra || value.taxRateInter) {
              const itemTaxRate = extractTaxRate(value.taxRateIntra || value.taxRateInter);
              if (itemTaxRate !== null) {
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
          
          // If tax is manually changed (not when item is selected), prioritize the manually selected tax
          // Clear itemData tax preference so that manually selected tax is used instead
          if (field === "tax" && updated.itemData) {
            // When user manually changes tax, ignore item's default tax and use the manually selected one
            // Create a copy of itemData without tax info to force using selected tax
            updated.itemData = {
              ...updated.itemData,
              taxRateIntra: null,
              taxRateInter: null,
              taxPreference: null
            };
          }
          
          const allTaxOptions = [...taxOptions, ...nonTaxableOptions];
          const discountConfig = {
            value: discount.value,
            type: discount.type,
            applyAfterTax: applyDiscountAfterTax,
          };
          
          const gstCalculation = calculateGSTLineItem(updated, discountConfig, allTaxOptions);
          
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
          updated.amount = gstCalculation.baseAmount;
          
          return updated;
        }
        return row;
      })
    );
  };

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
          amount: gstCalculation.baseAmount,
        };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [discount.value, discount.type, applyDiscountAfterTax]);


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
      customer: "",
      amount: "0.00",
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

  // Calculate totals
  const calculateTotals = () => {
    const allTaxOptions = [...taxOptions, ...nonTaxableOptions];
    const discountConfig = {
      value: discount.value,
      type: discount.type,
      applyAfterTax: applyDiscountAfterTax,
    };

    const recalculatedRows = tableRows.map(row => {
      const gstCalculation = calculateGSTLineItem(row, discountConfig, allTaxOptions);
      return {
        ...row,
        ...gstCalculation,
        amount: gstCalculation.baseAmount,
      };
    });

    // Calculate subtotal - Zoho Books rounds subtotal to 2 decimals
    let subTotal = 0;
    if (applyDiscountAfterTax) {
      subTotal = recalculatedRows.reduce((sum, row) => {
        return sum + (parseFloat(row.baseAmount) || 0);
      }, 0);
    } else {
      subTotal = recalculatedRows.reduce((sum, row) => {
        return sum + (parseFloat(row.discountedAmount) || 0);
      }, 0);
    }
    // Round subtotal to 2 decimals (Zoho Books behavior)
    subTotal = parseFloat(subTotal.toFixed(2));

    // Total Tax = sum of all lineTaxTotal values (each already rounded to 2 decimals)
    // Zoho Books: Sum the rounded line tax totals, then round the sum to 2 decimals
    const calculatedTotalTax = recalculatedRows.reduce((sum, row) => {
      return sum + (parseFloat(row.lineTaxTotal) || 0);
    }, 0);
    
    // Round to 2 decimal places (Zoho Books behavior)
    const roundedCalculatedTotalTax = parseFloat(calculatedTotalTax.toFixed(2));

    // Use editable tax amount if set, otherwise use calculated
    const totalTax = (totalTaxAmount && parseFloat(totalTaxAmount) > 0) 
      ? parseFloat(totalTaxAmount) 
      : roundedCalculatedTotalTax;

    let discountAmount = 0;
    if (discount.value && parseFloat(discount.value) > 0) {
      if (applyDiscountAfterTax) {
        if (discount.type === "%") {
          discountAmount = ((subTotal + totalTax) * parseFloat(discount.value)) / 100;
        } else {
          discountAmount = parseFloat(discount.value) || 0;
        }
      } else {
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

    // Aggregate tax breakdown by total rate (combine CGST+SGST, show IGST separately)
    const taxMap = new Map(); // rate -> { type: 'GST' or 'IGST', rate: number, amount: number }
    
    recalculatedRows.forEach((row) => {
      if (row.taxPercent > 0) {
        if (row.isInterState && row.igstPercent > 0 && parseFloat(row.igstAmount) > 0) {
          // Inter-state: IGST
          const igstRate = row.igstPercent;
          const key = `IGST${igstRate}`;
          if (taxMap.has(key)) {
            taxMap.get(key).amount += parseFloat(row.igstAmount) || 0;
          } else {
            taxMap.set(key, {
              type: 'IGST',
              rate: igstRate,
              amount: parseFloat(row.igstAmount) || 0,
            });
          }
        } else if (!row.isInterState && (row.cgstPercent > 0 || row.sgstPercent > 0)) {
          // Intra-state: Combine CGST + SGST into total GST
          const totalGstAmount = (parseFloat(row.cgstAmount) || 0) + (parseFloat(row.sgstAmount) || 0);
          if (totalGstAmount > 0) {
            const gstRate = row.taxPercent; // Total GST rate (CGST + SGST)
            const key = `GST${gstRate}`;
            if (taxMap.has(key)) {
              taxMap.get(key).amount += totalGstAmount;
            } else {
              taxMap.set(key, {
                type: 'GST',
                rate: gstRate,
                amount: totalGstAmount,
              });
            }
          }
        }
      }
    });

    // Convert to array and sort
    const taxBreakdown = Array.from(taxMap.values()).sort((a, b) => {
      const typeOrder = { 'GST': 0, 'IGST': 1 };
      if (typeOrder[a.type] !== typeOrder[b.type]) {
        return typeOrder[a.type] - typeOrder[b.type];
      }
      return a.rate - b.rate;
    });

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
      calculatedTotalTax: roundedCalculatedTotalTax, // For display in input field
      tdsTcsAmount: tdsTcsAmount.toFixed(2),
      adjustmentAmount: adjustmentAmount.toFixed(2),
      finalTotal: finalTotal.toFixed(2)
    };
  };

  const totals = calculateTotals();

  // Save bill to MongoDB
  // Load bill data when in edit mode
  useEffect(() => {
    if (isEditMode && billId) {
      const loadBill = async () => {
        setLoadingBill(true);
        try {
          const response = await fetch(`${API_URL}/api/purchase/bills/${billId}`);
          if (!response.ok) {
            throw new Error("Failed to fetch bill");
          }
          const billData = await response.json();
          
          // Populate form fields
          setBillNumber(billData.billNumber || "");
          setOrderNumber(billData.orderNumber || "");
          setBillDate(billData.billDate ? formatDateForInput(billData.billDate) : "");
          setDueDate(billData.dueDate ? formatDateForInput(billData.dueDate) : "");
          setPaymentTerms(billData.paymentTerms || "Net 60");
          setBranch(billData.branch || "Head Office");
          setSubject(billData.subject || "");
          setReverseCharge(billData.reverseCharge || false);
          setWarehouse(billData.warehouse || "");
          setTaxExclusive(billData.taxExclusive !== undefined ? billData.taxExclusive : true);
          setAtTransactionLevel(billData.atTransactionLevel !== undefined ? billData.atTransactionLevel : true);
          setNotes(billData.notes || "");
          setDiscount(billData.discount || { value: "0", type: "%" });
          setApplyDiscountAfterTax(billData.applyDiscountAfterTax || false);
          setTotalTaxAmount(billData.totalTaxAmount?.toString() || "");
          setTdsTcsType(billData.tdsTcsType || "TDS");
          setTdsTcsTax(billData.tdsTcsTax || "");
          setAdjustment(billData.adjustment?.toString() || "0.00");
          setSourceOfSupply(billData.sourceOfSupply || "");
          setDestinationOfSupply(billData.destinationOfSupply || "");
          
          // Set vendor
          if (billData.vendorName) {
            setVendorName(billData.vendorName);
            // Try to fetch vendor details if vendorId exists
            if (billData.vendorId) {
              try {
                const vendorResponse = await fetch(`${API_URL}/api/purchase/vendors/${billData.vendorId}`);
                if (vendorResponse.ok) {
                  const vendorData = await vendorResponse.json();
                  setSelectedVendor(vendorData);
                }
              } catch (error) {
                console.error("Error fetching vendor:", error);
              }
            }
          }
          
          // Set items
          if (billData.items && Array.isArray(billData.items)) {
            const rows = billData.items.map((item, index) => ({
              id: index + 1,
              item: item.itemName || "",
              itemData: item.itemId ? { _id: item.itemId, itemName: item.itemName } : null,
              itemDescription: item.itemDescription || "",
              account: item.account || "",
              size: item.size || "",
              quantity: (item.quantity || 0).toString(),
              rate: (item.rate || 0).toString(),
              tax: item.taxCode || "",
              customer: "",
              amount: (item.amount || 0).toString(),
              baseAmount: (item.baseAmount || 0).toString(),
              discountedAmount: (item.discountedAmount || 0).toString(),
              cgstAmount: (item.cgstAmount || 0).toString(),
              sgstAmount: (item.sgstAmount || 0).toString(),
              igstAmount: (item.igstAmount || 0).toString(),
              lineTaxTotal: (item.lineTaxTotal || 0).toString(),
              lineTotal: (item.lineTotal || 0).toString(),
              taxCode: item.taxCode || "",
              taxPercent: item.taxPercent || 0,
              cgstPercent: item.cgstPercent || 0,
              sgstPercent: item.sgstPercent || 0,
              igstPercent: item.igstPercent || 0,
              isInterState: item.isInterState || false,
            }));
            setTableRows(rows.length > 0 ? rows : [{ id: 1, item: "", itemData: null, itemDescription: "", account: "", size: "", quantity: "1.00", rate: "0.00", tax: "", customer: "", amount: "0.00", baseAmount: "0.00", discountedAmount: "0.00", cgstAmount: "0.00", sgstAmount: "0.00", igstAmount: "0.00", lineTaxTotal: "0.00", lineTotal: "0.00", taxCode: "", taxPercent: 0, cgstPercent: 0, sgstPercent: 0, igstPercent: 0, isInterState: false }]);
          }
        } catch (error) {
          console.error("Error loading bill:", error);
          alert("Failed to load bill for editing.");
          navigate("/purchase/bills");
        } finally {
          setLoadingBill(false);
        }
      };
      loadBill();
    }
  }, [isEditMode, billId, API_URL, navigate]);

  // Auto-fetch TDS from vendor when vendor is selected (only for new bills, not in edit mode)
  useEffect(() => {
    // Don't auto-fetch TDS in edit mode (it's already loaded from bill data)
    if (isEditMode) return;
    
    if (selectedVendor && selectedVendor.tds) {
      // Find matching TDS option by name or display string
      const vendorTds = selectedVendor.tds;
      const matchedTds = tdsOptions.find(option => {
        // Match by exact name, display string, or partial match
        return option.name === vendorTds || 
               option.display === vendorTds ||
               vendorTds.includes(option.name) ||
               option.name.includes(vendorTds);
      });
      
      if (matchedTds) {
        setTdsTcsType("TDS");
        setTdsTcsTax(matchedTds.id);
      }
    } else if (selectedVendor && !selectedVendor.tds) {
      // Clear TDS if vendor doesn't have one
      setTdsTcsTax("");
    }
  }, [selectedVendor, tdsOptions, isEditMode]);

  // Helper function to format date for input field (dd/MM/yyyy)
  const formatDateForInput = (date) => {
    if (!date) return "";
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, "0");
    const month = String(d.getMonth() + 1).padStart(2, "0");
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper function to get current date in dd/MM/yyyy format
  const getCurrentDate = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, "0");
    const month = String(today.getMonth() + 1).padStart(2, "0");
    const year = today.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Convert dd/MM/yyyy to YYYY-MM-DD (for date input)
  const convertToDateInputFormat = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("/");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month}-${day}`;
    }
    return "";
  };

  // Convert YYYY-MM-DD to dd/MM/yyyy (from date input)
  const convertFromDateInputFormat = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length === 3) {
      const [year, month, day] = parts;
      return `${day}/${month}/${year}`;
    }
    return "";
  };

  // Set current date for bill date and due date when creating a new bill
  // Also auto-generate unique bill number if not in edit mode
  useEffect(() => {
    if (!isEditMode) {
      const currentDate = getCurrentDate();
      setBillDate(currentDate);
      setDueDate(currentDate);
      
      // Auto-generate unique bill number
      if (!billNumber) {
        const timestamp = Date.now();
        const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        const generatedBillNum = `BILL-${timestamp}-${randomNum}`;
        setBillNumber(generatedBillNum);
      }
    }
  }, [isEditMode]);

  const handleSaveBill = async (status) => {
    // Validate required fields
    if (!billNumber || !billDate || !selectedVendor) {
      alert("Please fill in all required fields: Bill#, Bill Date, and Vendor Name");
      return;
    }

    setSaving(true);
    try {
      // Get user info
      const userStr = localStorage.getItem("rootfinuser");
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?._id || user?.id || user?.email || user?.locCode || null;
      const locCode = user?.locCode || "";

      if (!userId) {
        alert("User not logged in. Please log in to save bills.");
        setSaving(false);
        return;
      }

      // Convert billDate from dd/MM/yyyy to Date object
      const parseDate = (dateStr) => {
        if (!dateStr) return null;
        const parts = dateStr.split("/");
        if (parts.length === 3) {
          return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
        }
        return new Date(dateStr);
      };

      // Convert dueDate from dd/MM/yyyy to Date object
      const dueDateObj = dueDate ? parseDate(dueDate) : null;
      const billDateObj = parseDate(billDate);

      // Prepare items array
      const items = tableRows.map(row => ({
        itemId: row.itemData?._id || null,
        itemName: row.itemData?.itemName || row.item || "",
        itemDescription: row.itemDescription || "",
        account: row.account || "",
        size: row.size || "",
        quantity: parseFloat(row.quantity) || 0,
        rate: parseFloat(row.rate) || 0,
        tax: row.tax || "",
        amount: parseFloat(row.amount) || 0,
        baseAmount: parseFloat(row.baseAmount) || 0,
        discountedAmount: parseFloat(row.discountedAmount) || 0,
        cgstAmount: parseFloat(row.cgstAmount) || 0,
        sgstAmount: parseFloat(row.sgstAmount) || 0,
        igstAmount: parseFloat(row.igstAmount) || 0,
        lineTaxTotal: parseFloat(row.lineTaxTotal) || 0,
        lineTotal: parseFloat(row.lineTotal) || 0,
        taxCode: row.taxCode || "",
        taxPercent: row.taxPercent || 0,
        cgstPercent: row.cgstPercent || 0,
        sgstPercent: row.sgstPercent || 0,
        igstPercent: row.igstPercent || 0,
        isInterState: row.isInterState || false,
        itemGroupId: row.itemData?.itemGroupId || row.itemData?.groupId || null,
        itemSku: row.itemData?.sku || row.sku || "",
      }));

      // Prepare bill data
      const billData = {
        vendorId: selectedVendor._id || selectedVendor.id || null,
        vendorName: vendorName,
        branch: branch,
        billNumber: billNumber,
        orderNumber: orderNumber || "",
        billDate: billDateObj,
        dueDate: dueDateObj,
        paymentTerms: paymentTerms,
        subject: subject || "",
        reverseCharge: reverseCharge,
        taxExclusive: taxExclusive,
        atTransactionLevel: atTransactionLevel,
        sourceOfSupply: sourceOfSupply,
        destinationOfSupply: destinationOfSupply,
        warehouse: warehouse || "",
        items: items,
        discount: {
          value: discount.value,
          type: discount.type,
        },
        applyDiscountAfterTax: applyDiscountAfterTax,
        totalTaxAmount: parseFloat(totalTaxAmount) || parseFloat(totals.totalTax) || 0,
        tdsTcsType: tdsTcsType,
        tdsTcsTax: tdsTcsTax || "",
        tdsTcsAmount: parseFloat(totals.tdsTcsAmount) || 0,
        adjustment: parseFloat(adjustment) || 0,
        subTotal: parseFloat(totals.subTotal) || 0,
        discountAmount: parseFloat(totals.discountAmount) || 0,
        totalTax: parseFloat(totals.totalTax) || 0,
        finalTotal: parseFloat(totals.finalTotal) || 0,
        notes: notes || "",
        userId: userId,
        locCode: locCode,
        status: status, // "draft" or "open"
      };

      // Save to MongoDB
      const method = isEditMode ? "PUT" : "POST";
      const url = isEditMode ? `${API_URL}/api/purchase/bills/${billId}` : `${API_URL}/api/purchase/bills`;
      
      const response = await fetch(url, {
        method: method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(billData),
      });

      if (!response.ok) {
        let errorMessage = isEditMode ? "Failed to update bill" : "Failed to save bill";
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch (e) {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const savedBill = await response.json();
      alert(`Bill ${isEditMode ? "updated" : "saved"} successfully as ${status === "draft" ? "Draft" : "Open"}`);
      navigate(`/purchase/bills/${savedBill._id || savedBill.id}`);
    } catch (error) {
      console.error("Error saving bill:", error);
      alert(error.message || "Failed to save bill. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb]">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-white border-b border-[#e6eafb] px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[#1f2937]">{isEditMode ? "Edit Bill" : "New Bill"}</h1>
        <Link
          to="/purchase/bills"
          className="p-2 hover:bg-[#f1f5f9] rounded-md transition-colors"
        >
          <X size={20} className="text-[#64748b]" />
        </Link>
      </div>

      <div className="p-6">
        <div className="bg-white rounded-xl border border-[#e6eafb] shadow-sm">
          <div className="p-6 space-y-6">
            {/* Vendor and Bill Details */}
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <Label required>Vendor Name</Label>
                <VendorDropdown
                  value={selectedVendor}
                  onChange={(vendor) => {
                    setSelectedVendor(vendor);
                    setVendorName(vendor ? (vendor.displayName || vendor.companyName || "") : "");
                    // Auto-fill destination of supply from vendor's source of supply
                    if (vendor && vendor.sourceOfSupply) {
                      setDestinationOfSupply(vendor.sourceOfSupply);
                    }
                  }}
                  onNewVendor={() => navigate("/purchase/vendors/new")}
                />
              </div>
              
              {/* Vendor Details Section - Show when vendor is selected */}
              {selectedVendor && (
                <div className="col-span-2 space-y-4 border-t border-[#e6eafb] pt-6">
                  {/* Billing Address */}
                  {(selectedVendor.billingAddress || selectedVendor.billingCity || selectedVendor.billingState) && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Label>BILLING ADDRESS</Label>
                        <button
                          type="button"
                          className="text-[#64748b] hover:text-[#1f2937] transition-colors"
                          title="Edit billing address"
                        >
                          <Pencil size={14} />
                        </button>
                      </div>
                      <div className="rounded-lg border border-[#d7dcf5] bg-[#fafbff] p-4 text-sm leading-relaxed text-[#1f2937]">
                        {selectedVendor.billingAttention && (
                          <div className="font-semibold mb-1">{selectedVendor.billingAttention}</div>
                        )}
                        {selectedVendor.billingAddress && <div>{selectedVendor.billingAddress}</div>}
                        {selectedVendor.billingAddress2 && <div>{selectedVendor.billingAddress2}</div>}
                        {(selectedVendor.billingCity || selectedVendor.billingState || selectedVendor.billingPinCode) && (
                          <div>
                            {[selectedVendor.billingCity, selectedVendor.billingState, selectedVendor.billingPinCode]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        )}
                        {selectedVendor.billingCountry && <div>{selectedVendor.billingCountry}</div>}
                        {selectedVendor.billingPhone && <div>Phone: {selectedVendor.billingPhone}</div>}
                      </div>
                    </div>
                  )}
                  
                  {/* GST Details */}
                  <div className="grid gap-4 md:grid-cols-2">
                    {selectedVendor.gstTreatment && (
                      <div className="flex items-center justify-between">
                        <Label>GST Treatment:</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#1f2937]">{selectedVendor.gstTreatment}</span>
                          <button
                            type="button"
                            className="text-[#64748b] hover:text-[#1f2937] transition-colors"
                            title="Edit GST treatment"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                    {selectedVendor.gstin && (
                      <div className="flex items-center justify-between">
                        <Label>GSTIN:</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-[#1f2937]">{selectedVendor.gstin}</span>
                          <button
                            type="button"
                            className="text-[#64748b] hover:text-[#1f2937] transition-colors"
                            title="Edit GSTIN"
                          >
                            <Pencil size={14} />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="space-y-2">
                <Label>Branch</Label>
                <Select value={branch} onChange={(e) => setBranch(e.target.value)}>
                  <option>Head Office</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label required>Bill#</Label>
                <Input
                  value={billNumber}
                  onChange={(e) => setBillNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Order Number</Label>
                <Input
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label required>Bill Date</Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={billDate}
                    onChange={(e) => setBillDate(e.target.value)}
                    placeholder="dd/MM/yyyy"
                    className="pr-10"
                    onClick={() => {
                      if (billDateInputRef.current) {
                        if (billDateInputRef.current.showPicker) {
                          billDateInputRef.current.showPicker();
                        } else {
                          billDateInputRef.current.click();
                        }
                      }
                    }}
                  />
                  <input
                    ref={billDateInputRef}
                    type="date"
                    value={convertToDateInputFormat(billDate)}
                    onChange={(e) => {
                      if (e.target.value) {
                        setBillDate(convertFromDateInputFormat(e.target.value));
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 cursor-pointer z-10"
                    style={{ cursor: "pointer" }}
                    title="Select date"
                  />
                  <div
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (billDateInputRef.current) {
                        if (billDateInputRef.current.showPicker) {
                          billDateInputRef.current.showPicker();
                        } else {
                          billDateInputRef.current.click();
                        }
                      }
                    }}
                    title="Open calendar"
                  >
                    <Calendar className="w-4 h-4 text-[#64748b] hover:text-[#2563eb] transition-colors" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <div className="relative">
                  <Input
                    type="text"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    placeholder="dd/MM/yyyy"
                    className="pr-10"
                    onClick={() => {
                      if (dueDateInputRef.current) {
                        if (dueDateInputRef.current.showPicker) {
                          dueDateInputRef.current.showPicker();
                        } else {
                          dueDateInputRef.current.click();
                        }
                      }
                    }}
                  />
                  <input
                    ref={dueDateInputRef}
                    type="date"
                    value={convertToDateInputFormat(dueDate)}
                    onChange={(e) => {
                      if (e.target.value) {
                        setDueDate(convertFromDateInputFormat(e.target.value));
                      }
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 opacity-0 cursor-pointer z-10"
                    style={{ cursor: "pointer" }}
                    title="Select date"
                  />
                  <div
                    className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer z-10"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (dueDateInputRef.current) {
                        if (dueDateInputRef.current.showPicker) {
                          dueDateInputRef.current.showPicker();
                        } else {
                          dueDateInputRef.current.click();
                        }
                      }
                    }}
                    title="Open calendar"
                  >
                    <Calendar className="w-4 h-4 text-[#64748b] hover:text-[#2563eb] transition-colors" />
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Payment Terms</Label>
                <Select value={paymentTerms} onChange={(e) => setPaymentTerms(e.target.value)}>
                  <option>Net 60</option>
                  <option>Net 30</option>
                  <option>Net 15</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <div className="relative">
                  <Input
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter a subject within 250 characters"
                    maxLength={250}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Pencil size={14} className="text-[#9ca3af]" />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={reverseCharge}
                onChange={(e) => setReverseCharge(e.target.checked)}
                className="h-4 w-4 rounded border-[#d1d9f2] text-[#4f46e5] focus:ring-[#4338ca]"
              />
              <Label>This transaction is applicable for reverse charge</Label>
            </div>

            {/* Source and Destination of Supply */}
            <div className="grid gap-6 md:grid-cols-2 border-t border-[#e6eafb] pt-6">
              <div className="space-y-2">
                <Label required>Source of Supply</Label>
                <Select value={sourceOfSupply} onChange={(e) => setSourceOfSupply(e.target.value)}>
                  <option value="">Select Source of Supply</option>
                  <option value="[DL] - Delhi">[DL] - Delhi</option>
                  <option value="[KL] - Kerala">[KL] - Kerala</option>
                  <option value="[MH] - Maharashtra">[MH] - Maharashtra</option>
                  <option value="[TN] - Tamil Nadu">[TN] - Tamil Nadu</option>
                  <option value="[KA] - Karnataka">[KA] - Karnataka</option>
                  <option value="[GJ] - Gujarat">[GJ] - Gujarat</option>
                  <option value="[RJ] - Rajasthan">[RJ] - Rajasthan</option>
                  <option value="[UP] - Uttar Pradesh">[UP] - Uttar Pradesh</option>
                  <option value="[WB] - West Bengal">[WB] - West Bengal</option>
                  <option value="[AP] - Andhra Pradesh">[AP] - Andhra Pradesh</option>
                  <option value="[TS] - Telangana">[TS] - Telangana</option>
                  <option value="[MP] - Madhya Pradesh">[MP] - Madhya Pradesh</option>
                  <option value="[PB] - Punjab">[PB] - Punjab</option>
                  <option value="[HR] - Haryana">[HR] - Haryana</option>
                  <option value="[BR] - Bihar">[BR] - Bihar</option>
                  <option value="[OR] - Odisha">[OR] - Odisha</option>
                  <option value="[AS] - Assam">[AS] - Assam</option>
                  <option value="[JH] - Jharkhand">[JH] - Jharkhand</option>
                  <option value="[CT] - Chhattisgarh">[CT] - Chhattisgarh</option>
                  <option value="[UT] - Uttarakhand">[UT] - Uttarakhand</option>
                  <option value="[HP] - Himachal Pradesh">[HP] - Himachal Pradesh</option>
                  <option value="[TR] - Tripura">[TR] - Tripura</option>
                  <option value="[MN] - Manipur">[MN] - Manipur</option>
                  <option value="[ML] - Meghalaya">[ML] - Meghalaya</option>
                  <option value="[NL] - Nagaland">[NL] - Nagaland</option>
                  <option value="[GA] - Goa">[GA] - Goa</option>
                  <option value="[AR] - Arunachal Pradesh">[AR] - Arunachal Pradesh</option>
                  <option value="[MZ] - Mizoram">[MZ] - Mizoram</option>
                  <option value="[SK] - Sikkim">[SK] - Sikkim</option>
                  <option value="[AN] - Andaman and Nicobar Islands">[AN] - Andaman and Nicobar Islands</option>
                  <option value="[CH] - Chandigarh">[CH] - Chandigarh</option>
                  <option value="[DN] - Dadra and Nagar Haveli">[DN] - Dadra and Nagar Haveli</option>
                  <option value="[DD] - Daman and Diu">[DD] - Daman and Diu</option>
                  <option value="[LD] - Lakshadweep">[LD] - Lakshadweep</option>
                  <option value="[PY] - Puducherry">[PY] - Puducherry</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label required>Destination of Supply</Label>
                <Select value={destinationOfSupply} onChange={(e) => setDestinationOfSupply(e.target.value)}>
                  <option value="">Select Destination of Supply</option>
                  <option value="[DL] - Delhi">[DL] - Delhi</option>
                  <option value="[KL] - Kerala">[KL] - Kerala</option>
                  <option value="[MH] - Maharashtra">[MH] - Maharashtra</option>
                  <option value="[TN] - Tamil Nadu">[TN] - Tamil Nadu</option>
                  <option value="[KA] - Karnataka">[KA] - Karnataka</option>
                  <option value="[GJ] - Gujarat">[GJ] - Gujarat</option>
                  <option value="[RJ] - Rajasthan">[RJ] - Rajasthan</option>
                  <option value="[UP] - Uttar Pradesh">[UP] - Uttar Pradesh</option>
                  <option value="[WB] - West Bengal">[WB] - West Bengal</option>
                  <option value="[AP] - Andhra Pradesh">[AP] - Andhra Pradesh</option>
                  <option value="[TS] - Telangana">[TS] - Telangana</option>
                  <option value="[MP] - Madhya Pradesh">[MP] - Madhya Pradesh</option>
                  <option value="[PB] - Punjab">[PB] - Punjab</option>
                  <option value="[HR] - Haryana">[HR] - Haryana</option>
                  <option value="[BR] - Bihar">[BR] - Bihar</option>
                  <option value="[OR] - Odisha">[OR] - Odisha</option>
                  <option value="[AS] - Assam">[AS] - Assam</option>
                  <option value="[JH] - Jharkhand">[JH] - Jharkhand</option>
                  <option value="[CT] - Chhattisgarh">[CT] - Chhattisgarh</option>
                  <option value="[UT] - Uttarakhand">[UT] - Uttarakhand</option>
                  <option value="[HP] - Himachal Pradesh">[HP] - Himachal Pradesh</option>
                  <option value="[TR] - Tripura">[TR] - Tripura</option>
                  <option value="[MN] - Manipur">[MN] - Manipur</option>
                  <option value="[ML] - Meghalaya">[ML] - Meghalaya</option>
                  <option value="[NL] - Nagaland">[NL] - Nagaland</option>
                  <option value="[GA] - Goa">[GA] - Goa</option>
                  <option value="[AR] - Arunachal Pradesh">[AR] - Arunachal Pradesh</option>
                  <option value="[MZ] - Mizoram">[MZ] - Mizoram</option>
                  <option value="[SK] - Sikkim">[SK] - Sikkim</option>
                  <option value="[AN] - Andaman and Nicobar Islands">[AN] - Andaman and Nicobar Islands</option>
                  <option value="[CH] - Chandigarh">[CH] - Chandigarh</option>
                  <option value="[DN] - Dadra and Nagar Haveli">[DN] - Dadra and Nagar Haveli</option>
                  <option value="[DD] - Daman and Diu">[DD] - Daman and Diu</option>
                  <option value="[LD] - Lakshadweep">[LD] - Lakshadweep</option>
                  <option value="[PY] - Puducherry">[PY] - Puducherry</option>
                </Select>
              </div>
            </div>

            {/* Item Table Configuration */}
            <div className="grid gap-6 md:grid-cols-3 border-t border-[#e6eafb] pt-6">
              <div className="space-y-2">
                <Label>Warehouse</Label>
                <Select value={warehouse} onChange={(e) => setWarehouse(e.target.value)}>
                  <option value="">Select a warehouse</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Tax Exclusive</Label>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={taxExclusive}
                      onChange={() => setTaxExclusive(true)}
                      className="h-4 w-4 text-[#2563eb] focus:ring-[#2563eb]"
                    />
                    <span className="text-sm text-[#475569]">Tax Exclusive</span>
                  </label>
                </div>
              </div>
              <div className="space-y-2">
                <Label>At Transaction Level</Label>
                <div className="flex items-center gap-4">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={atTransactionLevel}
                      onChange={() => setAtTransactionLevel(true)}
                      className="h-4 w-4 text-[#2563eb] focus:ring-[#2563eb]"
                    />
                    <span className="text-sm text-[#475569]">At Transaction Level</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Item Table */}
            <div className="border-t border-[#e6eafb] pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-[#1f2937]">Item Details</h3>
                <button className="text-xs font-semibold text-[#2563eb] hover:underline">
                  Bulk Actions
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-[#e6eafb]">
                  <thead className="bg-[#f5f6ff]">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] w-[240px]">
                        ITEM DETAILS
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] w-[160px]">
                        ACCOUNT
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] w-[80px]">
                        SIZE
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] w-[90px]">
                        QUANTITY
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] w-[90px]">
                        RATE
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] w-[120px]">
                        TAX
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] w-[160px]">
                        CUSTOMER DETAILS
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-semibold uppercase tracking-wider text-[#64748b] w-[100px]">
                        AMOUNT
                      </th>
                      <th className="px-3 py-2 w-[40px]"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#eef2ff] bg-white overflow-visible">
                    {tableRows.map((row) => (
                      <tr key={row.id} className="overflow-visible">
                        <td className="px-3 py-3 relative overflow-visible align-top">
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
                        <td className="px-3 py-3 relative overflow-visible align-top">
                          <Select
                            value={row.account}
                            onChange={(e) => handleUpdateRow(row.id, "account", e.target.value)}
                            className="text-sm table-input"
                          >
                            <option value="">Select an account</option>
                          </Select>
                        </td>
                        <td className="px-3 py-3 relative overflow-visible align-top">
                          <Input
                            placeholder=""
                            value={row.size}
                            onChange={(e) => handleUpdateRow(row.id, "size", e.target.value)}
                            className="text-sm table-input"
                          />
                        </td>
                        <td className="px-3 py-3 relative overflow-visible align-top">
                          <Input
                            value={row.quantity}
                            onChange={(e) => handleUpdateRow(row.id, "quantity", e.target.value)}
                            className="text-sm table-input"
                          />
                        </td>
                        <td className="px-3 py-3 relative overflow-visible align-top">
                          <Input
                            value={row.rate}
                            onChange={(e) => handleUpdateRow(row.id, "rate", e.target.value)}
                            className="text-sm table-input"
                          />
                        </td>
                        <td className="px-3 py-3 relative overflow-visible align-top h-[48px] z-[500]">
                          <TaxDropdown
                            rowId={row.id}
                            value={row.tax}
                            onChange={(value) => handleUpdateRow(row.id, "tax", value)}
                            taxOptions={taxOptions}
                            nonTaxableOptions={nonTaxableOptions}
                            onNewTax={() => {}}
                          />
                          {row.tax && (
                            <p className="text-xs text-[#64748b] mt-1">Eligible For ITC</p>
                          )}
                        </td>
                        <td className="px-3 py-3 relative overflow-visible align-top">
                          <Select
                            value={row.customer}
                            onChange={(e) => handleUpdateRow(row.id, "customer", e.target.value)}
                            className="text-sm table-input"
                          >
                            <option value="">Select Customer</option>
                          </Select>
                        </td>
                        <td className="px-3 py-3 relative overflow-visible align-top text-right text-sm font-medium text-[#1f2937]">
                          {row.amount}
                        </td>
                        <td className="px-3 py-3 relative overflow-visible align-top text-right">
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
              <div className="mt-4 flex items-center gap-4">
                <button
                  onClick={handleAddNewRow}
                  className="inline-flex items-center gap-2 rounded-md border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
                >
                  <Plus size={16} />
                  Add New Row
                </button>
                <button className="inline-flex items-center gap-2 rounded-md border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors">
                  Add Landed Cost
                </button>
              </div>
            </div>

            {/* Summary and Notes Section */}
            <div className="grid gap-6 md:grid-cols-[1fr_400px] border-t border-[#e6eafb] pt-6">
              {/* Left: Notes and Attachments */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <div className="relative">
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="It will not be shown in PDF"
                      rows={4}
                      className="w-full rounded-md border border-[#d7dcf5] bg-white px-3 py-2.5 text-sm text-[#1f2937] placeholder:text-[#9ca3af] focus:border-[#2563eb] focus:outline-none focus:ring-1 focus:ring-[#2563eb] transition-colors resize-none"
                    />
                    <div className="absolute right-2 top-2">
                      <Pencil size={14} className="text-[#9ca3af]" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Attach File(s) to Bill</Label>
                  <Select>
                    <option>Upload File</option>
                  </Select>
                  <p className="text-xs text-[#64748b]">
                    You can upload a maximum of 5 files, 10MB each
                  </p>
                </div>
                <p className="text-xs text-[#64748b]">
                  Start adding custom fields for your payments made by going to Settings &gt; Purchases &gt; Bills.
                </p>
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
                {totals.taxBreakdown && totals.taxBreakdown.length > 0 && (
                  <div className="space-y-2 mb-4">
                    {totals.taxBreakdown.map((tax, idx) => {
                      const taxType = tax.type;
                      const taxRate = tax.rate;
                      const taxAmount = tax.amount;
                      
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
                      value={totalTaxAmount || (totals.calculatedTotalTax > 0 ? totals.calculatedTotalTax : "")}
                      onChange={(e) => setTotalTaxAmount(e.target.value)}
                    />
                    <span className="text-xs text-[#64748b]">INR</span>
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
                  <div className="flex flex-col gap-3">
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
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <TaxDropdown
                          rowId="tds-tcs"
                          value={tdsTcsTax}
                          onChange={setTdsTcsTax}
                          taxOptions={tdsTcsType === "TDS" ? tdsOptions : taxOptions}
                          nonTaxableOptions={tdsTcsType === "TDS" ? [] : nonTaxableOptions}
                          onNewTax={() => setShowNewTaxModal(true)}
                        />
                      </div>
                      <span className="text-sm text-[#64748b] whitespace-nowrap">- {totals.tdsTcsAmount}</span>
                    </div>
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
                    <span className="text-sm text-[#64748b] w-20 text-right">{totals.adjustmentAmount}</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-[#eef2ff] my-4"></div>

                {/* Total */}
                <div className="flex items-center justify-between text-base font-semibold text-[#111827]">
                  <span>Total (₹)</span>
                  <span>{totals.finalTotal}</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 border-t border-[#e6eafb] pt-6">
              <button
                onClick={() => handleSaveBill("draft")}
                disabled={saving}
                className="rounded-md border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save as Draft"}
              </button>
              <button
                onClick={() => handleSaveBill("open")}
                disabled={saving}
                className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1d4ed8] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Saving..." : "Save as Open"}
              </button>
              <Link
                to="/purchase/bills"
                className="rounded-md border border-[#d7dcf5] bg-white px-4 py-2 text-sm font-medium text-[#475569] hover:bg-[#f8fafc] transition-colors"
              >
                Cancel
              </Link>
            </div>
          </div>
        </div>
      </div>

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

const Bills = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const isNewBill = location.pathname === "/purchase/bills/new";
  const isEditBill = id && location.pathname.includes("/edit");
  const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";

  // Fetch bills from MongoDB
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBills, setSelectedBills] = useState(new Set());
  const [showBulkUpdateModal, setShowBulkUpdateModal] = useState(false);
  const [showBulkPaymentModal, setShowBulkPaymentModal] = useState(false);
  const [showLinkPOModal, setShowLinkPOModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (isNewBill || isEditBill) return; // Don't fetch if we're on the new or edit bill page

    const fetchBills = async () => {
      setLoading(true);
      try {
        // Get user info - use email as primary identifier
        const userStr = localStorage.getItem("rootfinuser");
        const user = userStr ? JSON.parse(userStr) : null;
        const userId = user?.email || null;
        const userPower = user?.power || "";

        if (!userId) {
          setBills([]);
          setLoading(false);
          return;
        }

        const params = new URLSearchParams({
          userId: userId,
        });
        if (userPower) params.append("userPower", userPower);
        if (user?.locCode) params.append("locCode", user.locCode);
        
        // Add warehouse parameter for filtering
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
        if (userWarehouse) {
          params.append("warehouse", userWarehouse);
        }
        
        const response = await fetch(`${API_URL}/api/purchase/bills?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch bills");
        const data = await response.json();
        setBills(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error loading bills:", error);
        setBills([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, [isNewBill, isEditBill, API_URL]);

  // Format date from Date object or string to dd/MM/yyyy
  const formatDate = (date) => {
    if (!date) return "-";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "-";
      const day = String(d.getDate()).padStart(2, "0");
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return "-";
    }
  };

  // Calculate days between two dates (returns positive number for overdue)
  const daysBetween = (date1, date2) => {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = d1 - d2; // Positive if date1 is after date2
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  // Process bills for display
  let processedBills = bills.map(bill => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const dueDate = bill.dueDate ? new Date(bill.dueDate) : null;
    if (dueDate) dueDate.setHours(0, 0, 0, 0);
    
    const billDate = bill.billDate ? new Date(bill.billDate) : null;
    
    // Use manual status from database if set, otherwise calculate based on due date
    let status = bill.status?.toLowerCase() || "open";
    let isOverdue = false;
    let overdueDays = 0;
    
    // Calculate if overdue based on due date
    // But preserve explicit draft status - don't override it
    const isExplicitDraft = bill.status === "draft";
    
    if (dueDate && !isExplicitDraft) {
      if (dueDate < today) {
        isOverdue = true;
        overdueDays = daysBetween(today, dueDate);
        // If no manual status set or status is open, use OVERDUE
        if (!bill.status || bill.status === "open") {
          status = "overdue";
        }
      } else if (dueDate.getTime() === today.getTime()) {
        if (!bill.status) {
          status = "open";
        }
      }
    } else if (dueDate && isExplicitDraft) {
      // Still calculate overdue days for display, but keep status as draft
      if (dueDate < today) {
        isOverdue = true;
        overdueDays = daysBetween(today, dueDate);
      }
    }

    // Normalize status values: map database values to display values
    // Map to uppercase for display
    if (status === "draft") status = "DRAFT";
    else if (status === "unpaid") status = "UNPAID";
    else if (status === "overdue") status = "OVERDUE";
    else if (status === "complete") status = "COMPLETE";
    else if (status === "paid") status = "OPEN"; // Treat paid as open for display
    else if (status === "sent") status = "OPEN";
    else if (status === "cancelled") status = "OPEN";
    else status = "OPEN"; // Default to OPEN

    // Calculate balance due (for now, it's the same as finalTotal if no payments made)
    const balanceDue = parseFloat(bill.finalTotal) || 0;

    return {
      _id: bill._id,
      date: formatDate(bill.billDate),
      branch: bill.branch || "Warehouse",
      billNumber: bill.billNumber || "",
      referenceNumber: bill.orderNumber || "",
      vendorName: bill.vendorName || "",
      status: status,
      originalStatus: bill.status || "open", // Store original status for API
      dueDate: formatDate(bill.dueDate),
      amount: `₹${(parseFloat(bill.finalTotal) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      balanceDue: `₹${balanceDue.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      isOverdue: isOverdue,
      overdueDays: overdueDays,
      finalTotal: parseFloat(bill.finalTotal) || 0,
      dueDateObj: dueDate,
      purchaseOrderId: bill.purchaseOrderId,
      purchaseReceiveId: bill.purchaseReceiveId,
      vendorId: bill.vendorId,
      items: bill.items,
      warehouse: bill.warehouse,
      locCode: bill.locCode,
      orderNumber: bill.orderNumber,
    };
  });

  // Filter bills based on search term
  if (searchTerm) {
    const searchLower = searchTerm.toLowerCase();
    processedBills = processedBills.filter(bill =>
      bill.billNumber.toLowerCase().includes(searchLower) ||
      bill.vendorName.toLowerCase().includes(searchLower) ||
      bill.referenceNumber.toLowerCase().includes(searchLower) ||
      bill.branch.toLowerCase().includes(searchLower)
    );
  }

  // Handle checkbox selection
  const handleSelectBill = (billId, event) => {
    event.stopPropagation();
    const newSelected = new Set(selectedBills);
    if (newSelected.has(billId)) {
      newSelected.delete(billId);
    } else {
      newSelected.add(billId);
    }
    setSelectedBills(newSelected);
  };

  // Handle select all
  const handleSelectAll = (event) => {
    event.stopPropagation();
    if (selectedBills.size === processedBills.length) {
      setSelectedBills(new Set());
    } else {
      setSelectedBills(new Set(processedBills.map(b => b._id)));
    }
  };

  // Clear selection
  const handleClearSelection = () => {
    setSelectedBills(new Set());
  };

  // Handle status update
  const handleStatusUpdate = async (billId, newStatus, event) => {
    event.stopPropagation();
    
    try {
      // Map display status to backend status
      const statusMap = {
        "DRAFT": "draft",
        "OVERDUE": "overdue",
        "UNPAID": "unpaid",
        "OPEN": "open",
        "DUE_TODAY": "open",
        "COMPLETE": "complete"
      };
      
      const backendStatus = statusMap[newStatus] || "open";
      
      // Get user info
      const userStr = localStorage.getItem("rootfinuser");
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.email || null;
      
      // Find the original bill data from bills array (not processedBills)
      // bills array contains the original MongoDB data with all fields
      const originalBill = bills.find(b => b._id === billId);
      if (!originalBill) {
        alert("Bill not found");
        return;
      }
      
      // Prepare update data - use original bill data to ensure all fields are present
      const updateData = {
        ...originalBill,
        status: backendStatus,
        userId: userId,
        // Ensure critical fields are present and properly formatted
        items: originalBill.items || [],
        warehouse: originalBill.warehouse || originalBill.branch || "Warehouse",
        sourceType: originalBill.sourceType || "direct",
        finalTotal: parseFloat(originalBill.finalTotal) || 0,
        vendorId: originalBill.vendorId || null,
        locCode: originalBill.locCode || user?.locCode || "",
      };
      
      console.log(`\n📋 Updating bill ${billId} status from "${originalBill.status || 'draft'}" to "${backendStatus}"`);
      console.log(`Items count: ${updateData.items?.length || 0}`);
      console.log(`Source type: ${updateData.sourceType}`);
      console.log(`Warehouse: ${updateData.warehouse}`);
      console.log(`Final Total: ${updateData.finalTotal}`);
      if (updateData.items && updateData.items.length > 0) {
        console.log(`Item details:`, updateData.items.map(item => ({
          name: item.itemName,
          qty: parseFloat(item.quantity) || 0,
          itemId: item.itemId,
          itemGroupId: item.itemGroupId
        })));
      }
      
      // Update bill status
      const response = await fetch(`${API_URL}/api/purchase/bills/${billId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });
      
      if (!response.ok) {
        throw new Error("Failed to update bill status");
      }
      
      // Refresh bills list
      const fetchBills = async () => {
        try {
          const userPower = user?.power || "";
          const billsResponse = await fetch(`${API_URL}/api/purchase/bills?userId=${encodeURIComponent(userId)}${userPower ? `&userPower=${encodeURIComponent(userPower)}` : ""}`);
          if (billsResponse.ok) {
            const data = await billsResponse.json();
            setBills(Array.isArray(data) ? data : []);
          }
        } catch (error) {
          console.error("Error refreshing bills:", error);
        }
      };
      
      await fetchBills();
    } catch (error) {
      console.error("Error updating bill status:", error);
      alert("Failed to update bill status. Please try again.");
    }
  };

  // Get selected bills data
  const getSelectedBillsData = () => {
    return bills.filter(bill => selectedBills.has(bill._id));
  };

  // Handle Email Bills
  const handleEmailBills = () => {
    const selected = getSelectedBillsData();
    if (selected.length === 0) {
      alert("Please select at least one bill");
      return;
    }
    // TODO: Implement email functionality
    alert(`Email functionality for ${selected.length} bill(s) - To be implemented`);
  };

  // Handle Print Bills
  const handlePrintBills = () => {
    const selected = getSelectedBillsData();
    if (selected.length === 0) {
      alert("Please select at least one bill");
      return;
    }
    // Open each bill in a new window for printing
    selected.forEach(bill => {
      window.open(`/purchase/bills/${bill._id}?print=true`, '_blank');
    });
  };

  // Handle Download Bills
  const handleDownloadBills = () => {
    const selected = getSelectedBillsData();
    if (selected.length === 0) {
      alert("Please select at least one bill");
      return;
    }
    // TODO: Implement download functionality (PDF/CSV)
    alert(`Download functionality for ${selected.length} bill(s) - To be implemented`);
  };

  // Handle Mark as Received
  const handleMarkAsReceived = async () => {
    const selected = getSelectedBillsData();
    if (selected.length === 0) {
      alert("Please select at least one bill");
      return;
    }

    // Check if bills have purchase orders
    const billsWithoutPO = selected.filter(bill => !bill.purchaseOrderId);
    if (billsWithoutPO.length > 0) {
      alert(`Cannot mark as received: ${billsWithoutPO.length} bill(s) do not have a linked Purchase Order. Please link a PO first.`);
      return;
    }

    if (!confirm(`Create Purchase Receive entries for ${selected.length} selected bill(s)? This will increase stock.`)) {
      return;
    }

    try {
      const userStr = localStorage.getItem("rootfinuser");
      const user = userStr ? JSON.parse(userStr) : null;
      const userId = user?.email || null;
      let successCount = 0;
      let failCount = 0;

      for (const bill of selected) {
        try {
          if (!bill.purchaseOrderId) {
            failCount++;
            continue;
          }

          // Get the purchase order to get receive number format
          const poResponse = await fetch(`${API_URL}/api/purchase/orders/${bill.purchaseOrderId}`);
          if (!poResponse.ok) {
            throw new Error("Failed to fetch purchase order");
          }
          const purchaseOrder = await poResponse.json();

          // Generate receive number
          const receiveNumber = `GRN-${bill.billNumber}-${Date.now()}`;

          // Create a purchase receive from the bill
          const response = await fetch(`${API_URL}/api/purchase/receives`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              purchaseOrderId: bill.purchaseOrderId,
              purchaseOrderNumber: purchaseOrder.orderNumber || bill.orderNumber,
              vendorId: bill.vendorId,
              vendorName: bill.vendorName,
              receiveNumber: receiveNumber,
              receivedDate: new Date().toISOString(),
              items: (bill.items || []).map(item => ({
                itemId: item.itemId,
                itemName: item.itemName,
                itemSku: item.itemSku,
                itemDescription: item.itemDescription,
                ordered: item.quantity || 0,
                received: item.quantity || 0,
                inTransit: 0,
                quantityToReceive: 0,
                itemGroupId: item.itemGroupId,
              })),
              warehouse: bill.warehouse || "Warehouse",
              userId: userId,
              locCode: bill.locCode || "",
              notes: `Created from Bill ${bill.billNumber}`,
              status: "received",
            }),
          });

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to create purchase receive");
          }

          const receiveData = await response.json();

          // Update bill to link the receive
          await fetch(`${API_URL}/api/purchase/bills/${bill._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...bill,
              purchaseReceiveId: receiveData._id,
            }),
          });

          successCount++;
        } catch (error) {
          console.error(`Error creating receive for bill ${bill.billNumber}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        alert(`Successfully created purchase receives for ${successCount} bill(s)${failCount > 0 ? `. ${failCount} failed.` : ''}`);
        setSelectedBills(new Set());
        // Refresh bills list
        window.location.reload();
      } else {
        alert(`Failed to create purchase receives. Please try again.`);
      }
    } catch (error) {
      console.error("Error marking bills as received:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Handle Undo Receive
  const handleUndoReceive = async () => {
    const selected = getSelectedBillsData();
    if (selected.length === 0) {
      alert("Please select at least one bill");
      return;
    }

    // Check if bills have purchase receives
    const billsWithoutReceive = selected.filter(bill => !bill.purchaseReceiveId);
    if (billsWithoutReceive.length > 0) {
      alert(`Cannot undo receive: ${billsWithoutReceive.length} bill(s) do not have a linked Purchase Receive.`);
      return;
    }

    if (!confirm(`Undo receive for ${selected.length} selected bill(s)? This will decrease stock.`)) {
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;

      for (const bill of selected) {
        try {
          if (!bill.purchaseReceiveId) {
            failCount++;
            continue;
          }

          // Delete the purchase receive linked to this bill
          const deleteResponse = await fetch(`${API_URL}/api/purchase/receives/${bill.purchaseReceiveId}`, {
            method: "DELETE",
          });

          if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json();
            throw new Error(errorData.message || "Failed to delete purchase receive");
          }

          // Update bill to remove the receive link
          await fetch(`${API_URL}/api/purchase/bills/${bill._id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...bill,
              purchaseReceiveId: null,
            }),
          });

          successCount++;
        } catch (error) {
          console.error(`Error undoing receive for bill ${bill.billNumber}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        alert(`Successfully undone receives for ${successCount} bill(s)${failCount > 0 ? `. ${failCount} failed.` : ''}`);
        setSelectedBills(new Set());
        // Refresh bills list
        window.location.reload();
      } else {
        alert(`Failed to undo receives. Please try again.`);
      }
    } catch (error) {
      console.error("Error undoing receives:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Handle Delete Bills
  const handleDeleteBills = async () => {
    const selected = getSelectedBillsData();
    if (selected.length === 0) {
      return;
    }

    if (!confirm(`Are you sure you want to delete ${selected.length} bill(s)? This action cannot be undone and will affect payments, stock, and purchase orders.`)) {
      return;
    }

    try {
      let successCount = 0;
      let failCount = 0;

      for (const bill of selected) {
        try {
          const response = await fetch(`${API_URL}/api/purchase/bills/${bill._id}`, {
            method: "DELETE",
          });

          if (response.ok) {
            successCount++;
          } else {
            const errorData = await response.json();
            throw new Error(errorData.message || "Failed to delete bill");
          }
        } catch (error) {
          console.error(`Error deleting bill ${bill.billNumber}:`, error);
          failCount++;
        }
      }

      if (successCount > 0) {
        alert(`Successfully deleted ${successCount} bill(s)${failCount > 0 ? `. ${failCount} failed.` : ''}`);
        setSelectedBills(new Set());
        setShowDeleteConfirm(false);
        // Refresh bills list
        window.location.reload();
      } else {
        alert(`Failed to delete bills. Please try again.`);
      }
    } catch (error) {
      console.error("Error deleting bills:", error);
      alert(`Error: ${error.message}`);
    }
  };

  if (isNewBill || isEditBill) {
    return <NewBillForm billId={id} isEditMode={isEditBill} />;
  }

  return (
    <div className="ml-64 min-h-screen bg-[#f8fafc] p-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#1e293b]">
              Bills
            </h1>
            {!loading && (
              <span className="px-3 py-1 rounded-full bg-[#e2e8f0] text-sm font-medium text-[#475569]">
                {processedBills.length} {processedBills.length === 1 ? 'bill' : 'bills'}
              </span>
            )}
          </div>
          <Link
            to="/purchase/bills/new"
            className="inline-flex items-center gap-2 rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#1d4ed8] hover:shadow-md"
          >
            <Plus size={18} />
            <span>New Bill</span>
          </Link>
        </div>
        
        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#94a3b8]" size={18} />
          <input
            type="text"
            placeholder="Search by bill number, vendor, or reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-[#e2e8f0] bg-white text-sm text-[#1e293b] placeholder:text-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-[#2563eb] focus:border-transparent transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-[#94a3b8] hover:text-[#64748b]"
            >
              <X size={18} />
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons Bar - Show when bills are selected */}
      {selectedBills.size > 0 && (
        <div className="mb-4 flex items-center justify-between bg-white rounded-lg border border-[#e2e8f0] shadow-sm p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-[#1e293b]">
              {selectedBills.size} {selectedBills.size === 1 ? 'Bill' : 'Bills'} Selected
            </span>
            <button
              onClick={handleClearSelection}
              className="text-xs text-[#64748b] hover:text-[#1e293b] flex items-center gap-1"
            >
              <X size={14} />
              Clear Selection
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkUpdateModal(true)}
              className="px-3 py-1.5 text-xs font-medium text-[#2563eb] bg-white border border-[#e2e8f0] rounded-md hover:bg-[#f8fafc] transition-colors"
            >
              Bulk Update
            </button>
            <button
              onClick={() => handleEmailBills()}
              className="px-3 py-1.5 text-xs font-medium text-[#2563eb] bg-white border border-[#e2e8f0] rounded-md hover:bg-[#f8fafc] transition-colors flex items-center gap-1.5"
            >
              <Mail size={14} className="text-[#2563eb]" />
              Email
            </button>
            <button
              onClick={() => handlePrintBills()}
              className="px-3 py-1.5 text-xs font-medium text-[#2563eb] bg-white border border-[#e2e8f0] rounded-md hover:bg-[#f8fafc] transition-colors flex items-center gap-1.5"
            >
              <Printer size={14} className="text-[#2563eb]" />
              Print
            </button>
            <button
              onClick={() => handleDownloadBills()}
              className="px-3 py-1.5 text-xs font-medium text-[#2563eb] bg-white border border-[#e2e8f0] rounded-md hover:bg-[#f8fafc] transition-colors flex items-center gap-1.5"
            >
              <Download size={14} className="text-[#2563eb]" />
              Download
            </button>
            <button
              onClick={() => setShowBulkPaymentModal(true)}
              className="px-3 py-1.5 text-xs font-medium text-[#2563eb] bg-white border border-[#e2e8f0] rounded-md hover:bg-[#f8fafc] transition-colors"
            >
              Record Bulk Payment
            </button>
            <button
              onClick={() => setShowLinkPOModal(true)}
              className="px-3 py-1.5 text-xs font-medium text-[#2563eb] bg-white border border-[#e2e8f0] rounded-md hover:bg-[#f8fafc] transition-colors flex items-center gap-1.5"
            >
              <LinkIcon size={14} className="text-[#2563eb]" />
              Link to existing Purchase Order
            </button>
            <button
              onClick={() => handleMarkAsReceived()}
              className="px-3 py-1.5 text-xs font-medium text-[#2563eb] bg-white border border-[#e2e8f0] rounded-md hover:bg-[#f8fafc] transition-colors flex items-center gap-1.5"
            >
              <Package size={14} className="text-[#2563eb]" />
              Mark as Received
            </button>
            <button
              onClick={() => handleUndoReceive()}
              className="px-3 py-1.5 text-xs font-medium text-[#2563eb] bg-white border border-[#e2e8f0] rounded-md hover:bg-[#f8fafc] transition-colors flex items-center gap-1.5"
            >
              <PackageX size={14} className="text-[#2563eb]" />
              Undo Receive
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-[#ef4444] rounded-md hover:bg-[#dc2626] transition-colors flex items-center gap-1.5"
            >
              <Trash2 size={14} />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Bills Table */}
      <div className="rounded-lg border border-[#e2e8f0] bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#e2e8f0]">
            <thead className="bg-[#f8fafc]">
              <tr>
                <th scope="col" className="px-6 py-4 text-center border-r border-[#e2e8f0] text-xs font-semibold uppercase tracking-wider text-[#64748b] w-12">
                  <input
                    type="checkbox"
                    checked={selectedBills.size === processedBills.length && processedBills.length > 0}
                    onChange={handleSelectAll}
                    className="h-4 w-4 rounded border-[#d1d9f2] text-[#4f46e5] focus:ring-[#4338ca]"
                  />
                </th>
                <th scope="col" className="px-6 py-4 text-center border-r border-[#e2e8f0] text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                  #
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                  Date
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                  Bill #
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                  Vendor
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                  Status
                </th>
                <th scope="col" className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                  Due Date
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#64748b] border-r border-[#e2e8f0]">
                  Amount
                </th>
                <th scope="col" className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                  Balance Due
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e2e8f0] bg-white">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#2563eb] mb-3"></div>
                      <p className="text-sm text-[#64748b]">Loading bills...</p>
                    </div>
                  </td>
                </tr>
              ) : processedBills.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-[#f1f5f9] flex items-center justify-center mb-4">
                        <Search className="text-[#94a3b8]" size={24} />
                      </div>
                      <p className="text-sm font-medium text-[#1e293b] mb-1">
                        {searchTerm ? "No bills found" : "No bills yet"}
                      </p>
                      <p className="text-sm text-[#64748b]">
                        {searchTerm ? "Try adjusting your search" : "Create your first bill to get started"}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                processedBills.map((bill, index) => (
                  <tr
                    key={bill._id || bill.id}
                    className={`hover:bg-[#f8fafc] transition-colors cursor-pointer group ${selectedBills.has(bill._id) ? 'bg-[#eff6ff]' : ''}`}
                    onClick={() => {
                      if (bill._id || bill.id) {
                        navigate(`/purchase/bills/${bill._id || bill.id}`);
                      } else {
                        console.error("Bill ID is missing:", bill);
                      }
                    }}
                  >
                    <td 
                      className="px-6 py-4 whitespace-nowrap border-r border-[#e2e8f0] text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="checkbox"
                        checked={selectedBills.has(bill._id)}
                        onChange={(e) => handleSelectBill(bill._id, e)}
                        className="h-4 w-4 rounded border-[#d1d9f2] text-[#4f46e5] focus:ring-[#4338ca]"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap border-r border-[#e2e8f0] text-center text-sm text-[#64748b]">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#475569] border-r border-[#e2e8f0]">
                      {bill.date}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm border-r border-[#e2e8f0]">
                      <span className="font-semibold text-[#2563eb] group-hover:text-[#1d4ed8] group-hover:underline">
                        {bill.billNumber}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#1e293b] font-medium border-r border-[#e2e8f0]">
                      {bill.vendorName}
                    </td>
                    <td 
                      className="px-6 py-4 whitespace-nowrap text-sm border-r border-[#e2e8f0]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <select
                        value={bill.status}
                        onChange={(e) => handleStatusUpdate(bill._id, e.target.value, e)}
                        className={`min-w-[140px] rounded-full border-0 px-3 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-offset-1 transition-colors cursor-pointer ${
                          bill.status === "DRAFT"
                            ? "bg-[#f3f4f6] text-[#6b7280]"
                            : bill.status === "OVERDUE"
                            ? "bg-[#fee2e2] text-[#991b1b]"
                            : bill.status === "UNPAID"
                            ? "bg-[#fef3c7] text-[#92400e]"
                            : bill.status === "COMPLETE"
                            ? "bg-[#dcfce7] text-[#166534]"
                            : "bg-[#dbeafe] text-[#1e40af]"
                        }`}
                        style={{
                          appearance: 'none',
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='${bill.status === "DRAFT" ? "%236b7280" : bill.status === "OVERDUE" ? "%23991b1b" : bill.status === "UNPAID" ? "%2392400e" : "%231e40af"}' d='M6 9L1 4h10z'/%3E%3C/svg%3E")`,
                          backgroundRepeat: 'no-repeat',
                          backgroundPosition: 'right 0.5rem center',
                          paddingRight: '2rem',
                        }}
                      >
                        <option value="DRAFT" className="bg-white text-[#6b7280]">Draft</option>
                        {bill.isOverdue ? (
                          <option value="OVERDUE" className="bg-white text-[#991b1b]">Overdue {bill.overdueDays > 0 ? `${bill.overdueDays}d` : ''}</option>
                        ) : (
                          <option value="OVERDUE" className="bg-white text-[#991b1b]">Overdue</option>
                        )}
                        <option value="UNPAID" className="bg-white text-[#92400e]">Unpaid</option>
                        <option value="OPEN" className="bg-white text-[#1e40af]">Open</option>
                        <option value="COMPLETE" className="bg-white text-[#166534]">Complete</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[#64748b] border-r border-[#e2e8f0]">
                      {bill.dueDate}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#1e293b] text-right border-r border-[#e2e8f0]">
                      {bill.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[#1e293b] text-right">
                      {bill.balanceDue}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Update Modal */}
      {showBulkUpdateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#1e293b]">Bulk Update Bills</h2>
                <button
                  onClick={() => setShowBulkUpdateModal(false)}
                  className="text-[#64748b] hover:text-[#1e293b]"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-[#64748b] mb-4">
                Update {selectedBills.size} selected bill(s)
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1e293b] mb-2">Status</label>
                  <select className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-sm">
                    <option value="">No change</option>
                    <option value="open">Open</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1e293b] mb-2">Due Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowBulkUpdateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-[#64748b] bg-[#f1f5f9] rounded-md hover:bg-[#e2e8f0]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement bulk update
                    alert("Bulk update functionality - To be implemented");
                    setShowBulkUpdateModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-md hover:bg-[#1d4ed8]"
                >
                  Update
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Payment Modal */}
      {showBulkPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#1e293b]">Record Bulk Payment</h2>
                <button
                  onClick={() => setShowBulkPaymentModal(false)}
                  className="text-[#64748b] hover:text-[#1e293b]"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-[#64748b] mb-4">
                Record payment for {selectedBills.size} selected bill(s)
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1e293b] mb-2">Payment Amount</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1e293b] mb-2">Payment Date</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#1e293b] mb-2">Payment Method</label>
                  <select className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-sm">
                    <option value="cash">Cash</option>
                    <option value="bank">Bank Transfer</option>
                    <option value="cheque">Cheque</option>
                    <option value="credit_card">Credit Card</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowBulkPaymentModal(false)}
                  className="px-4 py-2 text-sm font-medium text-[#64748b] bg-[#f1f5f9] rounded-md hover:bg-[#e2e8f0]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement bulk payment
                    alert("Bulk payment functionality - To be implemented");
                    setShowBulkPaymentModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-md hover:bg-[#1d4ed8]"
                >
                  Record Payment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Link to PO Modal */}
      {showLinkPOModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#1e293b]">Link to Purchase Order</h2>
                <button
                  onClick={() => setShowLinkPOModal(false)}
                  className="text-[#64748b] hover:text-[#1e293b]"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-[#64748b] mb-4">
                Link {selectedBills.size} selected bill(s) to a purchase order
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#1e293b] mb-2">Purchase Order Number</label>
                  <input
                    type="text"
                    placeholder="Enter PO number"
                    className="w-full px-3 py-2 border border-[#e2e8f0] rounded-md text-sm"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowLinkPOModal(false)}
                  className="px-4 py-2 text-sm font-medium text-[#64748b] bg-[#f1f5f9] rounded-md hover:bg-[#e2e8f0]"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    // TODO: Implement link to PO
                    alert("Link to PO functionality - To be implemented");
                    setShowLinkPOModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#2563eb] rounded-md hover:bg-[#1d4ed8]"
                >
                  Link
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#1e293b]">Delete Bills</h2>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="text-[#64748b] hover:text-[#1e293b]"
                >
                  <X size={20} />
                </button>
              </div>
              <p className="text-sm text-[#64748b] mb-4">
                Are you sure you want to delete {selectedBills.size} selected bill(s)? This action cannot be undone and will:
              </p>
              <ul className="text-sm text-[#64748b] mb-4 list-disc list-inside space-y-1">
                <li>Reverse any payments made</li>
                <li>Reverse accounting journal entries</li>
                <li>Reduce billed amounts in Purchase Orders</li>
                <li>Delete linked Purchase Receives (if created from bill)</li>
                <li>Reverse stock increases (if applicable)</li>
              </ul>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-sm font-medium text-[#64748b] bg-[#f1f5f9] rounded-md hover:bg-[#e2e8f0]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteBills}
                  className="px-4 py-2 text-sm font-medium text-white bg-[#ef4444] rounded-md hover:bg-[#dc2626]"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Bills;

