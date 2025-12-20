import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { UploadCloud, ArrowLeft, ChevronDown, Search, Check, Settings, X } from "lucide-react";
import Head from "../components/Head";
import baseUrl from "../api/api";

const API_ROOT = (baseUrl?.baseUrl || "").replace(/\/$/, "");
const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";

const STORAGE_KEYS = {
  manufacturers: "shoeSalesManufacturers",
  brands: "shoeSalesBrands",
};

const loadStoredList = (key) => {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch (error) {
    console.error(`Failed to parse ${key} from localStorage`, error);
  }
  return [];
};

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

const inventoryAccountGroups = [
  {
    group: "Stock",
    options: [
      { label: "Finished Goods", value: "Finished Goods" },
      { label: "Inventory Asset", value: "Inventory Asset" },
      { label: "Work In Progress", value: "Work In Progress" },
    ],
  },
  {
    group: "Expenses",
    options: [
      { label: "Cost of Goods Sold", value: "Cost of Goods Sold" },
      { label: "Inventory Adjustments", value: "Inventory Adjustments" },
    ],
  },
];

const inventoryValuationGroups = [
  {
    group: "Standard Methods",
    options: [
      { label: "FIFO (First In First Out)", value: "FIFO (First In First Out)" },
      { label: "WAC (Weighted Average Costing)", value: "WAC (Weighted Average Costing)" },
      { label: "LIFO (Last In First Out)", value: "LIFO (Last In First Out)" },
    ],
  },
];

const taxPreferenceGroups = [
  {
    group: "Standard",
    options: [
      { label: "Taxable", value: "taxable" },
      { label: "Non-Taxable", value: "non-taxable" },
    ],
  },
  {
    group: "Special",
    options: [
      { label: "Out of Scope", value: "out-of-scope" },
      { label: "Non-GST Supply", value: "non-gst-supply" },
      { label: "Exempt", value: "exempt" },
    ],
  },
];

const initialFormData = {
  type: "goods",
  itemName: "",
  sku: "",
  unit: "",
  hsnCode: "",
  manufacturer: "",
  brand: "",
  returnable: true,
  sellable: true,
  purchasable: true,
  taxPreference: "taxable",
  dimensions: "",
  weight: "",
  upc: "",
  mpn: "",
  ean: "",
  isbn: "",
  size: "",
  inventoryValuationMethod: "",
  sellingPrice: "",
  salesAccount: "",
  salesDescription: "",
  costPrice: "",
  costAccount: "",
  preferredVendor: "",
  purchaseDescription: "",
  taxRateIntra: "",
  taxRateInter: "",
  inventoryAccount: "",
  reorderPoint: "",
  exemptionReason: "",
  sac: "",
};

const ShoeSalesItemCreate = () => {
  const navigate = useNavigate();
  const { id: groupId, itemId } = useParams(); // Get groupId and itemId from URL
  const isEditMode = !!itemId; // If itemId exists, we're in edit mode
  const isStandaloneItem = isEditMode && !groupId; // Editing standalone item (has itemId but no groupId)
  const [formData, setFormData] = useState(initialFormData);
  const [status, setStatus] = useState({ loading: false, error: null });
  const [skuManuallyEdited, setSkuManuallyEdited] = useState(false);
  const [trackInventory, setTrackInventory] = useState(true);
  const [trackBin, setTrackBin] = useState(false);
  const [trackingMethod, setTrackingMethod] = useState("none");
  const [itemGroup, setItemGroup] = useState(null);
  const [loadingGroup, setLoadingGroup] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [standaloneItem, setStandaloneItem] = useState(null);
  const [manufacturers, setManufacturers] = useState(() => loadStoredList(STORAGE_KEYS.manufacturers));
  const [selectedManufacturer, setSelectedManufacturer] = useState("");
  const [showManufacturerModal, setShowManufacturerModal] = useState(false);
  const [newManufacturer, setNewManufacturer] = useState("");
  const [brands, setBrands] = useState(() => loadStoredList(STORAGE_KEYS.brands));
  const [selectedBrand, setSelectedBrand] = useState("");
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [newBrand, setNewBrand] = useState("");
  const [attributeValues, setAttributeValues] = useState([]);
  const [priceIncludesGST, setPriceIncludesGST] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.manufacturers, JSON.stringify(manufacturers));
    }
  }, [manufacturers]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEYS.brands, JSON.stringify(brands));
    }
  }, [brands]);

  // Fetch standalone item data if editing a standalone item
  useEffect(() => {
    if (isStandaloneItem && itemId) {
      const fetchStandaloneItem = async () => {
        try {
          setLoadingGroup(true);
          const response = await fetch(`${API_ROOT}/api/shoe-sales/items/${itemId}`);
          
          if (!response.ok) {
            throw new Error("Failed to fetch item");
          }
          
          const data = await response.json();
          setStandaloneItem(data);
          
          // Prefill form with item data
          setFormData((prev) => ({
            ...prev,
            type: data.type || "goods",
            itemName: data.itemName || "",
            sku: data.sku || "",
            unit: data.unit || "",
            hsnCode: data.hsnCode || "",
            manufacturer: data.manufacturer || "",
            brand: data.brand || "",
            returnable: data.returnable !== undefined ? data.returnable : true,
            sellable: data.sellable !== undefined ? data.sellable : true,
            purchasable: data.purchasable !== undefined ? data.purchasable : true,
            taxPreference: data.taxPreference || "taxable",
            dimensions: data.dimensions || "",
            weight: data.weight || "",
            upc: data.upc || "",
            mpn: data.mpn || "",
            ean: data.ean || "",
            isbn: data.isbn || "",
            size: data.size || "",
            inventoryValuationMethod: data.inventoryValuationMethod || data.inventoryValuation || "",
            sellingPrice: data.sellingPrice?.toString() || "",
            salesAccount: data.salesAccount || "",
            salesDescription: data.salesDescription || "",
            costPrice: data.costPrice?.toString() || "",
            costAccount: data.costAccount || "",
            preferredVendor: data.preferredVendor || "",
            purchaseDescription: data.purchaseDescription || "",
            taxRateIntra: data.taxRateIntra || "",
            taxRateInter: data.taxRateInter || "",
            inventoryAccount: data.inventoryAccount || "",
            reorderPoint: data.reorderPoint || "",
            exemptionReason: data.exemptionReason || "",
            sac: data.sac || "",
          }));
          setAttributeValues(data.attributeCombination || []);
          setSelectedManufacturer(data.manufacturer || "");
          setSelectedBrand(data.brand || "");
          if (data.manufacturer) {
            setManufacturers((prev) =>
              prev.includes(data.manufacturer) ? prev : [...prev, data.manufacturer]
            );
          }
          if (data.brand) {
            setBrands((prev) =>
              prev.includes(data.brand) ? prev : [...prev, data.brand]
            );
          }
          
          setTrackInventory(data.trackInventory !== undefined ? data.trackInventory : true);
          setTrackBin(data.trackBin !== undefined ? data.trackBin : false);
          setTrackingMethod(data.trackingMethod || "none");
          setSkuManuallyEdited(!!data.sku);
        } catch (error) {
          console.error("Error fetching standalone item:", error);
          alert("Failed to load item data. Please try again.");
          navigate(`/shoe-sales/items/${itemId}`);
        } finally {
          setLoadingGroup(false);
        }
      };
      
      fetchStandaloneItem();
    }
  }, [isStandaloneItem, itemId, navigate]);

  // Fetch item group data if adding to a group or editing an item
  useEffect(() => {
    if (groupId) {
      const fetchItemGroup = async () => {
        try {
          setLoadingGroup(true);
          const response = await fetch(`${API_URL}/api/shoe-sales/item-groups/${groupId}`);
          
          if (!response.ok) {
            throw new Error("Failed to fetch item group");
          }
          
          const data = await response.json();
          setItemGroup(data);
          
          // Prefill form fields with group data
          setFormData((prev) => ({
            ...prev,
            type: data.itemType || "goods",
            unit: data.unit || "",
            manufacturer: data.manufacturer || "",
            brand: data.brand || "",
            taxPreference: data.taxPreference || "taxable",
            taxRateIntra: data.intraStateTaxRate || data.taxRateIntra || "",
            taxRateInter: data.interStateTaxRate || data.taxRateInter || "",
            inventoryValuationMethod: data.inventoryValuationMethod || "",
            returnable: data.returnable !== undefined ? data.returnable : true,
            sellable: data.sellable !== undefined ? data.sellable : true,
            purchasable: data.purchasable !== undefined ? data.purchasable : true,
            exemptionReason: data.exemptionReason || "",
            sac: data.sac || "",
          }));
          setSelectedManufacturer(data.manufacturer || "");
          setSelectedBrand(data.brand || "");
          if (data.manufacturer) {
            setManufacturers((prev) =>
              prev.includes(data.manufacturer) ? prev : [...prev, data.manufacturer]
            );
          }
          if (data.brand) {
            setBrands((prev) =>
              prev.includes(data.brand) ? prev : [...prev, data.brand]
            );
          }
          
          setTrackInventory(data.trackInventory !== undefined ? data.trackInventory : true);
          
          // If in edit mode, find and load the specific item
          if (isEditMode && itemId && data.items && Array.isArray(data.items)) {
            const foundItem = data.items.find(i => {
              const itemIdStr = (i._id?.toString() || i.id || "").toString();
              return itemIdStr === itemId.toString();
            });
            
            if (foundItem) {
              setCurrentItem(foundItem);
              
              // Check if "size" is one of the attributes and extract it
              let sizeValue = "";
              if (data.attributeRows && Array.isArray(data.attributeRows) && foundItem.attributeCombination) {
                const sizeIndex = data.attributeRows.findIndex(row => 
                  row?.attribute?.toLowerCase() === "size"
                );
                if (sizeIndex !== -1 && foundItem.attributeCombination[sizeIndex]) {
                  sizeValue = foundItem.attributeCombination[sizeIndex];
                }
              }
              
              // Prefill form with item data
              setFormData((prev) => ({
                ...prev,
                itemName: foundItem.name || "",
                sku: foundItem.sku || "",
                costPrice: foundItem.costPrice?.toString() || "",
                sellingPrice: foundItem.sellingPrice?.toString() || "",
                upc: foundItem.upc || "",
                hsnCode: foundItem.hsnCode || "",
                isbn: foundItem.isbn || "",
                reorderPoint: foundItem.reorderPoint || "",
                sac: foundItem.sac || "",
                size: sizeValue || "", // Set size from attributes
              }));
              setSkuManuallyEdited(!!foundItem.sku);
              setAttributeValues(foundItem.attributeCombination || []);
            } else {
              alert("Item not found. Redirecting to item group.");
              navigate(`/shoe-sales/item-groups/${groupId}/items/${itemId}`);
            }
          }
        } catch (error) {
          console.error("Error fetching item group:", error);
          alert("Failed to load item group data. Please try again.");
          if (isEditMode && itemId) {
            navigate(`/shoe-sales/item-groups/${groupId}/items/${itemId}`);
          } else {
            navigate(groupId ? `/shoe-sales/item-groups/${groupId}` : "/shoe-sales/item-groups");
          }
        } finally {
          setLoadingGroup(false);
        }
      };
      
      fetchItemGroup();
    }
  }, [groupId, itemId, isEditMode, navigate]);

  useEffect(() => {
    if (!trackInventory) {
      setTrackBin(false);
      setTrackingMethod("none");
      setFormData((prev) => ({
        ...prev,
        inventoryAccount: "",
        inventoryValuationMethod: "",
      }));
    }
  }, [trackInventory]);

  const extractGSTPercentage = useCallback((taxRate) => {
    if (!taxRate) return null;
    const match = taxRate.match(/\[(\d+(?:\.\d+)?)%\]/);
    if (match) {
      const parsed = parseFloat(match[1]);
      return Number.isNaN(parsed) ? null : parsed;
    }
    const fallback = parseFloat(taxRate);
    return Number.isNaN(fallback) ? null : fallback;
  }, []);

  const calculateGSTDetails = useCallback((amount, taxRate, isInclusive = false) => {
    if (!amount || !taxRate) return null;
    const price = parseFloat(amount);
    if (!Number.isFinite(price) || price === 0) return null;

    const percentage = extractGSTPercentage(taxRate);
    if (percentage === null) return null;

    let basePrice = 0;
    let gstAmount = 0;
    let finalPrice = 0;

    if (isInclusive) {
      basePrice = price / (1 + percentage / 100);
      gstAmount = price - basePrice;
      finalPrice = price;
    } else {
      basePrice = price;
      gstAmount = price * (percentage / 100);
      finalPrice = price + gstAmount;
    }

    return {
      basePrice: basePrice.toFixed(2),
      gstAmount: gstAmount.toFixed(2),
      finalPrice: finalPrice.toFixed(2),
      percentage,
    };
  }, [extractGSTPercentage]);

  const generateSkuPreview = useCallback((name = "") => {
    const words = name
      .replace(/[^a-zA-Z0-9\s-]/g, " ")
      .split(/[\s-_,]+/)
      .filter(Boolean);

    if (words.length === 0) {
      return "";
    }

    const alphaWords = words.filter((word) => /[A-Za-z]/.test(word));
    const numericWords = words.filter((word) => /^\d+$/.test(word));

    let letters = alphaWords.map((word) => word[0].toUpperCase()).join("");

    if (!letters && alphaWords.length > 0) {
      letters = alphaWords[0].slice(0, 3).toUpperCase();
    }

    if (!letters) {
      letters = words[0].slice(0, 3).toUpperCase();
    }

    let base = letters || "ITEM";
    const digits = numericWords.join("");
    if (digits) {
      base += `-${digits}`;
    }

    return base;
  }, []);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "itemName" && !skuManuallyEdited) {
        next.sku = generateSkuPreview(value);
      }
      if (field === "type") {
        if (value === "service") {
          next.hsnCode = "";
        } else {
          next.sac = "";
        }
      }
      return next;
    });
  };

  const handleSkuChange = (event) => {
    const value = event.target.value;
    setSkuManuallyEdited(true);
    setFormData((prev) => ({ ...prev, sku: value.toUpperCase() }));
  };

const handleCheckboxChange = (field) => (event) => {
  const checked = event.target.checked;
  setFormData((prev) => {
    const next = { ...prev, [field]: checked };

    if (field === "sellable" && !checked) {
      next.sellingPrice = "";
      next.salesAccount = "";
      next.salesDescription = "";
    }

    if (field === "purchasable" && !checked) {
      next.costPrice = "";
      next.costAccount = "";
      next.preferredVendor = "";
      next.purchaseDescription = "";
    }

    return next;
  });
};

  const handleSelectChange = (field) => (value) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "taxPreference" && value === "taxable") {
        next.exemptionReason = "";
      }
      return next;
    });
  };

  // Allow editing of per-attribute values (e.g., color, size) for a single group item
  const handleAttributeValueChange = (attrIndex, attrLabel) => (event) => {
    const value = event.target.value;
    setAttributeValues((prev) => {
      const next = Array.isArray(prev) ? [...prev] : [];
      next[attrIndex] = value;
      // Keep dedicated size field synchronized if this attribute is "size"
      if (typeof attrLabel === "string" && attrLabel.toLowerCase() === "size") {
        setFormData((p) => ({ ...p, size: value }));
      }
      return next;
    });
  };

  const handleManufacturerSelect = (value) => {
    setSelectedManufacturer(value);
    setFormData((prev) => ({ ...prev, manufacturer: value }));
  };

  const handleBrandSelect = (value) => {
    setSelectedBrand(value);
    setFormData((prev) => ({ ...prev, brand: value }));
  };

  const handleRadioChange = (field, value) => () => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatus({ loading: true, error: null });

    try {
      // If adding to a group or editing an item in a group
      if (groupId && itemGroup) {
        // Validate required fields
        if (!formData.itemName || formData.itemName.trim() === "") {
          setStatus({ loading: false, error: "Item name is required." });
          return;
        }

        // Create/update the item object matching the group's item schema
        const itemData = {
          name: formData.itemName.trim(),
          sku: formData.sku || "",
          costPrice: formData.costPrice ? Number(formData.costPrice) : 0,
          sellingPrice: formData.sellingPrice ? Number(formData.sellingPrice) : 0,
          upc: formData.upc || "",
          hsnCode: formData.hsnCode || "",
          isbn: formData.isbn || "",
          reorderPoint: formData.reorderPoint || "",
          sac: formData.type === "service" ? (formData.sac || "") : "",
        };

        let updatedItems;
        // Track per-attribute changes (e.g., size/color) to update group-level options conditionally
        const attrRows = Array.isArray(itemGroup.attributeRows) ? itemGroup.attributeRows : [];
        const changedPrevValues = new Map(); // index -> previous
        const changedNextValues = new Map(); // index -> next
        if (isEditMode && currentItem) {
          // Update existing item - preserve _id, id, stock, warehouseStocks, and attributeCombination
          updatedItems = itemGroup.items.map(i => {
            const itemIdStr = (i._id?.toString() || i.id || "").toString();
            if (itemIdStr === itemId.toString()) {
              // Update attributeCombination with size value if size attribute exists
              let updatedAttributeCombination = [...(i.attributeCombination || [])];
              // Prefer values from editable attributeValues; fallback to existing
              for (let ai = 0; ai < attrRows.length; ai++) {
                const label = (attrRows[ai]?.attribute || "").toLowerCase();
                const prevVal = updatedAttributeCombination[ai] || "";
                let newVal = (attributeValues && attributeValues[ai] !== undefined) ? attributeValues[ai] : prevVal;
                // Keep dedicated size field in sync
                if (label === "size") {
                  if (formData.size) newVal = formData.size;
                }
                if (newVal !== prevVal) {
                  changedPrevValues.set(ai, prevVal);
                  changedNextValues.set(ai, newVal);
                }
                updatedAttributeCombination[ai] = newVal;
              }
              
              // Regenerate item name from updated attributeCombination
              let updatedItemName = itemData.name.trim();
              if (updatedAttributeCombination.length > 0) {
                const optionsStr = updatedAttributeCombination.join("/");
                updatedItemName = `${itemGroup.name} - ${optionsStr}`;
                console.log(`Regenerated item name: "${updatedItemName}" from combination:`, updatedAttributeCombination);
              }
              
              return {
                ...i,
                _id: i._id || i.id, // Preserve _id
                id: i.id || i._id, // Preserve id
                ...itemData,
                name: updatedItemName, // Use regenerated name with updated attributes
                stock: i.stock !== undefined ? i.stock : 0, // Preserve stock
                warehouseStocks: i.warehouseStocks || [], // Preserve warehouse stocks
                attributeCombination: updatedAttributeCombination, // Update attribute combination with size
              };
            }
            return i;
          });
        } else {
          // Add new item - initialize with user's warehouse
          const currentUser = JSON.parse(localStorage.getItem("rootfinuser")) || {};
          const userLocName = currentUser.username || currentUser.locName || "";
          
          // Helper function to map locName to warehouse name
          const mapLocNameToWarehouse = (locName) => {
            if (!locName) return "Warehouse";
            // Remove prefixes like "G.", "Z.", "SG."
            let warehouse = locName.replace(/^[A-Z]\.?\s*/i, "").trim();
            // Add "Branch" if not already present and not "Warehouse"
            if (warehouse && warehouse.toLowerCase() !== "warehouse" && !warehouse.toLowerCase().includes("branch")) {
              warehouse = `${warehouse} Branch`;
            }
            return warehouse || "Warehouse";
          };
          
          const userWarehouse = mapLocNameToWarehouse(userLocName);
          
          const newItem = {
            ...itemData,
            stock: 0,
            attributeCombination: [],
            warehouseStocks: [{
              warehouse: userWarehouse,
              openingStock: 0,
              openingStockValue: 0,
              stockOnHand: 0,
              committedStock: 0,
              availableForSale: 0,
              physicalOpeningStock: 0,
              physicalStockOnHand: 0,
              physicalCommittedStock: 0,
              physicalAvailableForSale: 0,
            }],
          };
          updatedItems = [...(itemGroup.items || []), newItem];
        }
        
        // Get current user for history tracking
        const currentUser = JSON.parse(localStorage.getItem("rootfinuser")) || {};
        const changedBy = currentUser.username || currentUser.locName || "System";
        const userLocName = currentUser.username || currentUser.locName || "";
        
        // Helper function to map locName to warehouse name
        const mapLocNameToWarehouse = (locName) => {
          if (!locName) return "Warehouse";
          // Remove prefixes like "G.", "Z.", "SG."
          let warehouse = locName.replace(/^[A-Z]\.?\s*/i, "").trim();
          // Add "Branch" if not already present and not "Warehouse"
          if (warehouse && warehouse.toLowerCase() !== "warehouse" && !warehouse.toLowerCase().includes("branch")) {
            warehouse = `${warehouse} Branch`;
          }
          return warehouse || "Warehouse";
        };
        
        const userWarehouse = mapLocNameToWarehouse(userLocName);

        // Conditionally update group-level attribute options for the specific attribute changed:
        // - If a new size value was introduced, add it to the "size" options (if not already there)
        // - If the old size value is no longer used by any item in the group, remove it
        let updatedAttributeRows = Array.isArray(itemGroup.attributeRows)
          ? itemGroup.attributeRows.map((r) => ({ ...r, options: Array.isArray(r.options) ? [...r.options] : [] }))
          : [];
        if (isEditMode && currentItem && updatedAttributeRows.length > 0 && changedNextValues.size > 0) {
          // For each changed attribute, add new option if missing and remove old if unused
          changedNextValues.forEach((newVal, idx) => {
            const row = updatedAttributeRows[idx];
            if (!row) return;
            if (newVal && !row.options.includes(newVal)) {
              row.options.push(newVal);
              row.options.sort((a, b) => {
                const na = parseFloat(a), nb = parseFloat(b);
                if (!isNaN(na) && !isNaN(nb)) return na - nb;
                return a.toString().localeCompare(b.toString());
              });
            }
            const oldVal = changedPrevValues.get(idx);
            if (oldVal && oldVal !== newVal) {
              const usedElsewhere = updatedItems.some((it) => {
                const combo = it?.attributeCombination || [];
                return combo[idx] === oldVal;
              });
              if (!usedElsewhere) {
                row.options = row.options.filter((opt) => opt !== oldVal);
              }
            }
          });
        }

        // Prepare update payload with all group fields preserved
        const updatePayload = {
          name: itemGroup.name,
          sku: itemGroup.sku || "",
          itemType: itemGroup.itemType || "goods",
          unit: itemGroup.unit || "",
          manufacturer: itemGroup.manufacturer || "",
          brand: itemGroup.brand || "",
          taxPreference: formData.taxPreference || "taxable",
          exemptionReason: formData.taxPreference === "non-taxable" ? (formData.exemptionReason || "") : "",
          intraStateTaxRate: formData.taxPreference === "taxable" ? (formData.taxRateIntra || "") : "",
          interStateTaxRate: formData.taxPreference === "taxable" ? (formData.taxRateInter || "") : "",
          inventoryValuationMethod: itemGroup.inventoryValuationMethod || "",
          createAttributes: itemGroup.createAttributes !== undefined ? itemGroup.createAttributes : true,
          attributeRows: updatedAttributeRows,
          sellable: itemGroup.sellable !== undefined ? itemGroup.sellable : true,
          purchasable: itemGroup.purchasable !== undefined ? itemGroup.purchasable : true,
          trackInventory: itemGroup.trackInventory !== undefined ? itemGroup.trackInventory : false,
          items: updatedItems,
          stock: itemGroup.stock || 0,
          reorder: itemGroup.reorder || "",
          isActive: itemGroup.isActive !== undefined ? itemGroup.isActive : true,
          itemId: isEditMode ? itemId : undefined, // Include itemId for history tracking
          changedBy: changedBy,
          userWarehouse: userWarehouse,
          userLocName: userLocName,
        };
        
        console.log("Saving item group with updated items:", {
          updatedItems: updatedItems.map(i => ({ name: i.name, attributeCombination: i.attributeCombination })),
          updatedAttributeRows: updatedAttributeRows.map(r => ({ attribute: r.attribute, options: r.options }))
        });
        
        const response = await fetch(`${API_URL}/api/shoe-sales/item-groups/${groupId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message || payload?.errors?.join(", ") || (isEditMode ? "Failed to update item." : "Failed to add item to group."));
        }

        // Navigate back to the item detail page if editing, or group detail page if creating
        if (isEditMode && itemId) {
          navigate(`/shoe-sales/item-groups/${groupId}/items/${itemId}`);
        } else {
          navigate(`/shoe-sales/item-groups/${groupId}`);
        }
      } else if (isStandaloneItem) {
        // Update standalone item
        const updatePayload = {
          ...formData,
          trackInventory,
          trackBin,
          trackingMethod,
          sellingPrice: formData.sellingPrice ? Number(formData.sellingPrice) : 0,
          costPrice: formData.costPrice ? Number(formData.costPrice) : 0,
          warehouseStocks: standaloneItem?.warehouseStocks || [], // Preserve warehouse stocks
        };

        const response = await fetch(`${API_ROOT}/api/shoe-sales/items/${itemId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatePayload),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message || "Failed to update item.");
        }

        navigate(`/shoe-sales/items/${itemId}`);
      } else {
        // Create standalone item (original behavior)
        // Get current user for history tracking
        const currentUser = JSON.parse(localStorage.getItem("rootfinuser")) || {};
        const changedBy = currentUser.username || currentUser.locName || "System";
        const userLocName = currentUser.username || currentUser.locName || "";
        
        // Helper function to map locName to warehouse name
        const mapLocNameToWarehouse = (locName) => {
          if (!locName) return "Warehouse";
          // Remove prefixes like "G.", "Z.", "SG."
          let warehouse = locName.replace(/^[A-Z]\.?\s*/i, "").trim();
          // Add "Branch" if not already present and not "Warehouse"
          if (warehouse && warehouse.toLowerCase() !== "warehouse" && !warehouse.toLowerCase().includes("branch")) {
            warehouse = `${warehouse} Branch`;
          }
          return warehouse || "Warehouse";
        };
        
        const userWarehouse = mapLocNameToWarehouse(userLocName);
        
        const response = await fetch(`${API_ROOT}/api/shoe-sales/items`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            trackInventory,
            trackBin,
            trackingMethod,
            sellingPrice: formData.sellingPrice ? Number(formData.sellingPrice) : 0,
            costPrice: formData.costPrice ? Number(formData.costPrice) : 0,
            changedBy: changedBy,
            createdBy: changedBy,
            userWarehouse: userWarehouse,
            userLocName: userLocName,
          }),
        });

        if (!response.ok) {
          const payload = await response.json().catch(() => null);
          throw new Error(payload?.message || "Failed to save item.");
        }

        setFormData(initialFormData);
        setAttributeValues([]);
        setSkuManuallyEdited(false);
        setTrackInventory(true);
        setTrackBin(false);
        setTrackingMethod("none");
        navigate("/shoe-sales/items");
      }
    } catch (error) {
      setStatus({ loading: false, error: error.message || "Something went wrong." });
      return;
    }

    setStatus({ loading: false, error: null });
  };

  // Calculate attribute summary BEFORE any early returns (hooks must be called unconditionally)
  // Filter out "size" since it has its own dedicated field
  const attributeSummary = useMemo(() => {
    if (!itemGroup || !Array.isArray(itemGroup.attributeRows)) return [];
    return itemGroup.attributeRows
      .map((row, idx) => ({
        label: row.attribute,
        value: attributeValues[idx] || "",
        originalIndex: idx
      }))
      .filter((item) => item.label && item.label.toLowerCase() !== "size");
  }, [itemGroup, attributeValues]);

  // Early return for loading state - AFTER all hooks
  if (loadingGroup) {
    return (
      <div className="ml-64 min-h-screen bg-[#f5f7fb] p-6">
        <div className="rounded-2xl border border-[#e4e6f2] bg-white shadow-lg p-8 text-center">
          <p className="text-lg font-medium text-[#475569]">Loading item group...</p>
        </div>
      </div>
    );
  }

  const backUrl = isStandaloneItem && itemId
    ? `/shoe-sales/items/${itemId}`
    : (isEditMode && itemId
      ? `/shoe-sales/item-groups/${groupId}/items/${itemId}`
      : (groupId ? `/shoe-sales/item-groups/${groupId}` : "/shoe-sales/items"));
  const backText = isStandaloneItem
    ? "Back to Item"
    : (isEditMode 
      ? "Back to Item"
      : (groupId ? "Back to Group" : "Back to Items"));
  const pageTitle = isStandaloneItem
    ? "Edit Item"
    : (isEditMode
      ? `Edit Item - ${currentItem?.name || "Item"}` 
      : (groupId ? `Add Item to ${itemGroup?.name || "Group"}` : "New Item"));
  const pageDescription = isEditMode
    ? "Edit item details for sales, purchasing, and inventory tracking."
    : (groupId 
      ? "Add a new item to this item group." 
      : "Capture product details for sales, purchasing, and inventory tracking.");

  const selectedTaxRate = formData.taxRateIntra || formData.taxRateInter;
  const shouldShowGSTSummary = !!(formData.sellable && formData.sellingPrice && selectedTaxRate);
  const gstDetails = shouldShowGSTSummary
    ? calculateGSTDetails(formData.sellingPrice, selectedTaxRate, priceIncludesGST)
    : null;

  return (
    <div className="ml-64 min-h-screen bg-[#f5f7fb] p-6">
      <Head
        title={pageTitle}
        description={pageDescription}
        actions={
          <Link
            to={backUrl}
            className="inline-flex h-9 items-center gap-2 rounded-md border border-[#cbd5f5] px-4 text-sm font-medium text-[#1f2937] transition hover:bg-white"
          >
            <ArrowLeft size={16} />
            {backText}
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        {status.error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {status.error}
          </div>
        )}

        <div className="rounded-3xl border border-[#e1e5f5] bg-white shadow-[0_30px_90px_-40px_rgba(15,23,42,0.25)]">
          <div className="grid gap-8 border-b border-[#e7ebf8] px-8 py-8 md:grid-cols-[2fr,1fr]">
            <div className="space-y-6">
              <fieldset className="space-y-3">
                <legend className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">Type</legend>
                <div className="flex flex-wrap gap-4 text-sm font-medium text-[#1f2937]">
                  <label className="inline-flex items-center gap-2 rounded-full border border-[#cbd5f5] bg-white px-4 py-2 shadow-sm">
                    <input
                      type="radio"
                      name="type"
                      value="goods"
                      checked={formData.type === "goods"}
                      onChange={handleChange("type")}
                      className="text-[#4285f4]"
                    />
                    Goods
                  </label>
                  <label className="inline-flex items-center gap-2 rounded-full border border-[#cbd5f5] bg-white px-4 py-2 shadow-sm">
                    <input
                      type="radio"
                      name="type"
                      value="service"
                      checked={formData.type === "service"}
                      onChange={handleChange("type")}
                      className="text-[#4285f4]"
                    />
                    Service
                  </label>
                </div>
              </fieldset>

              <div className="grid gap-6 sm:grid-cols-2">
                <FloatingField
                  label="Item Name*"
                  placeholder="Enter item name"
                  required
                  name="itemName"
                  value={formData.itemName}
                  onChange={handleChange("itemName")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="SKU"
                  placeholder="e.g. KSB-36"
                  name="sku"
                  value={formData.sku}
                  onChange={handleSkuChange}
                  disabled={status.loading}
                />
                <UnitSelect
                  label="Unit*"
                  placeholder="Select or type to add"
                  value={formData.unit}
                  onChange={(value) => setFormData((prev) => ({ ...prev, unit: value }))}
                  options={unitOptions}
                />
                {formData.type === "service" ? (
                  <FloatingField
                    label="SAC"
                    placeholder="Enter SAC"
                    name="sac"
                    value={formData.sac}
                    onChange={handleChange("sac")}
                    disabled={status.loading}
                  />
                ) : (
                  <FloatingField
                    label="HSN Code"
                    placeholder="Enter HSN"
                    name="hsnCode"
                    value={formData.hsnCode}
                    onChange={handleChange("hsnCode")}
                    disabled={status.loading}
                  />
                )}
              </div>

              <div className="grid gap-6 sm:grid-cols-2">
                <ManufacturerSelect
                  label="Manufacturer"
                  placeholder="Select or add manufacturer"
                  value={selectedManufacturer}
                  onChange={handleManufacturerSelect}
                  options={manufacturers}
                  onManageClick={() => setShowManufacturerModal(true)}
                  disabled={status.loading}
                />
                <BrandSelect
                  label="Brand"
                  placeholder="Select or add brand"
                  value={selectedBrand}
                  onChange={handleBrandSelect}
                  options={brands}
                  onManageClick={() => setShowBrandModal(true)}
                  disabled={status.loading}
                />
                {itemGroup && Array.isArray(itemGroup.attributeRows) && itemGroup.attributeRows.length > 0 && (
                  <div className="sm:col-span-2 rounded-2xl border border-[#e4e6f2] bg-[#f8f9ff] p-4">
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b] mb-3">
                      Variant Attributes
                    </p>
                    <div className="grid gap-4 md:grid-cols-2">
                      {itemGroup.attributeRows.map((row, idx) => {
                        const label = row?.attribute || `Attribute ${idx + 1}`;
                        const currentVal = (attributeValues && attributeValues[idx]) || "";
                        const options = Array.isArray(row?.options) ? row.options : [];
                        const optionsHint = options.length > 0 ? `Options: ${options.join(" | ")}` : "No predefined options";
                        return (
                          <div key={`${label}-${idx}`} className="space-y-1">
                            <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[#94a3b8]">
                              {label}
                            </label>
                            <input
                              type="text"
                              value={currentVal}
                              onChange={handleAttributeValueChange(idx, label)}
                              placeholder={options.length ? `e.g. ${options[0]}` : "Enter value"}
                              className="w-full rounded-md border border-[#dbe4ff] bg-white px-3 py-2 text-sm text-[#1f2937] shadow-sm"
                              disabled={status.loading}
                            />
                            <p className="text-[11px] text-[#94a3b8]">{optionsHint}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                <FloatingCheckbox
                  label="Returnable Item"
                  name="returnable"
                  checked={formData.returnable}
                  onChange={handleCheckboxChange("returnable")}
                  disabled={status.loading}
                />
                <SearchableSelect
                  label="Tax Preference*"
                  placeholder="Select tax preference"
                  value={formData.taxPreference}
                  onChange={handleSelectChange("taxPreference")}
                  groups={taxPreferenceGroups}
                  required
                  disabled={status.loading}
                />
                {formData.taxPreference === "non-taxable" && (
                  <div className="sm:col-span-2">
                    <FloatingField
                      label="Exemption Reason*"
                      placeholder="Select or type to add"
                      name="exemptionReason"
                      value={formData.exemptionReason}
                      onChange={handleChange("exemptionReason")}
                      disabled={status.loading}
                      required
                    />
                  </div>
                )}
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <FloatingField
                  label="Dimensions"
                  placeholder="Length × Width × Height"
                  hint="cm"
                  name="dimensions"
                  value={formData.dimensions}
                  onChange={handleChange("dimensions")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="Weight"
                  placeholder="Add weight"
                  hint="kg"
                  name="weight"
                  value={formData.weight}
                  onChange={handleChange("weight")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="UPC"
                  placeholder="Enter UPC"
                  name="upc"
                  value={formData.upc}
                  onChange={handleChange("upc")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="MPN"
                  placeholder="Enter MPN"
                  name="mpn"
                  value={formData.mpn}
                  onChange={handleChange("mpn")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="EAN"
                  placeholder="Enter EAN"
                  name="ean"
                  value={formData.ean}
                  onChange={handleChange("ean")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="ISBN"
                  placeholder="Enter ISBN"
                  name="isbn"
                  value={formData.isbn}
                  onChange={handleChange("isbn")}
                  disabled={status.loading}
                />
                <FloatingField
                  label="Size"
                  placeholder="Select size"
                  name="size"
                  value={formData.size}
                  onChange={handleChange("size")}
                  disabled={status.loading}
                />
              </div>
            </div>

            <div className="flex h-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#d7dcf5] bg-[#f8f9ff] p-8 text-center text-[#64748b]">
              <UploadCloud size={36} className="mb-3 text-[#94a3b8]" />
              <p className="text-sm font-medium">Drag image(s) here or browse images</p>
              <p className="mt-2 text-xs leading-5">
                You can add up to 15 images, each not exceeding 5 MB in size and 7000 x 7000 pixels resolution.
              </p>
              <button
                type="button"
                className="mt-4 rounded-full border border-[#cbd5f5] px-4 py-2 text-sm font-medium text-[#3762f9] hover:bg-[#eef2ff]"
              >
                Upload
              </button>
            </div>
          </div>

          <div className="space-y-8 px-8 py-8">
            <section className="grid gap-6 md:grid-cols-2">
              <InfoCard
                title="Sales Information"
                actions={
                  <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#475569]">
                    <input
                      type="checkbox"
                      name="sellable"
                      checked={formData.sellable}
                      onChange={handleCheckboxChange("sellable")}
                      disabled={status.loading}
                      className="h-4 w-4 rounded border-[#cbd5f5] text-[#4285f4] focus:ring-[#4285f4] disabled:cursor-not-allowed"
                    />
                    Sellable
                  </label>
                }
              >
                {formData.taxPreference === "taxable" && (
                  <div className="space-y-4 mb-2">
                    <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">Default Tax Rates</h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <TaxRateSelect
                        label="Intra State Tax Rate"
                        value={formData.taxRateIntra}
                        onChange={(value) => setFormData((prev) => ({ ...prev, taxRateIntra: value }))}
                        type="intra"
                      />
                      <TaxRateSelect
                        label="Inter State Tax Rate"
                        value={formData.taxRateInter}
                        onChange={(value) => setFormData((prev) => ({ ...prev, taxRateInter: value }))}
                        type="inter"
                      />
                    </div>
                    <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#475569]">
                      <input
                        type="checkbox"
                        name="priceIncludesGST"
                        checked={priceIncludesGST}
                        onChange={(event) => setPriceIncludesGST(event.target.checked)}
                        disabled={status.loading}
                        className="h-4 w-4 rounded border-[#cbd5f5] text-[#4285f4] focus:ring-[#4285f4]"
                      />
                      Price Includes GST
                    </label>
                  </div>
                )}
                <FloatingField
                  label="Selling Price"
                  placeholder="0.00"
                  prefix="INR"
                  name="sellingPrice"
                  value={formData.sellingPrice}
                  onChange={handleChange("sellingPrice")}
                  disabled={!formData.sellable || status.loading}
                />
                {/* Price with GST Display */}
                {shouldShowGSTSummary && gstDetails && (
                  priceIncludesGST ? (
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                          Base Price (Excl. GST)
                        </label>
                        <div className="flex items-center rounded-lg border border-[#d7dcf5] bg-[#f8fafc] px-3 py-2">
                          <span className="mr-2 text-xs font-semibold uppercase text-[#64748b]">INR</span>
                          <span className="text-sm font-medium text-[#1f2937]">{gstDetails.basePrice}</span>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                          GST Portion ({gstDetails.percentage}%)
                        </label>
                        <div className="flex items-center rounded-lg border border-[#d7dcf5] bg-[#f8fafc] px-3 py-2">
                          <span className="mr-2 text-xs font-semibold uppercase text-[#64748b]">INR</span>
                          <span className="text-sm font-medium text-[#1f2937]">{gstDetails.gstAmount}</span>
                        </div>
                      </div>
                      <div className="md:col-span-2">
                        <p className="text-xs text-[#64748b]">
                          Inclusive price remains <span className="font-semibold text-[#1f2937]">₹{gstDetails.finalPrice}</span>.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <label className="block text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
                        Price with GST
                      </label>
                      <div className="flex items-center rounded-lg border border-[#d7dcf5] bg-[#f8fafc] px-3 py-2">
                        <span className="mr-2 text-xs font-semibold uppercase text-[#64748b]">INR</span>
                        <span className="text-sm font-medium text-[#1f2937]">{gstDetails.finalPrice}</span>
                      </div>
                      <p className="text-xs text-[#64748b]">
                        GST ({gstDetails.percentage}%): ₹{gstDetails.gstAmount}
                      </p>
                    </div>
                  )
                )}
                <FloatingField
                  label="Sales Account"
                  placeholder="Select account"
                  name="salesAccount"
                  value={formData.salesAccount}
                  onChange={handleChange("salesAccount")}
                  disabled={!formData.sellable || status.loading}
                />
                <FloatingField
                  label="Description"
                  placeholder="Optional description"
                  inputType="textarea"
                  name="salesDescription"
                  value={formData.salesDescription}
                  onChange={handleChange("salesDescription")}
                  disabled={!formData.sellable || status.loading}
                />
              </InfoCard>
              <InfoCard
                title="Purchase Information"
                actions={
                  <label className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[#475569]">
                    <input
                      type="checkbox"
                      name="purchasable"
                      checked={formData.purchasable}
                      onChange={handleCheckboxChange("purchasable")}
                      disabled={status.loading}
                      className="h-4 w-4 rounded border-[#cbd5f5] text-[#4285f4] focus:ring-[#4285f4] disabled:cursor-not-allowed"
                    />
                    Purchasable
                  </label>
                }
              >
                <FloatingField
                  label="Cost Price"
                  placeholder="0.00"
                  prefix="INR"
                  name="costPrice"
                  value={formData.costPrice}
                  onChange={handleChange("costPrice")}
                  disabled={!formData.purchasable || status.loading}
                />
                <FloatingField
                  label="Cost Account"
                  placeholder="Cost of Goods Sold"
                  name="costAccount"
                  value={formData.costAccount}
                  onChange={handleChange("costAccount")}
                  disabled={!formData.purchasable || status.loading}
                />
                <FloatingField
                  label="Preferred Vendor"
                  placeholder="Select vendor"
                  name="preferredVendor"
                  value={formData.preferredVendor}
                  onChange={handleChange("preferredVendor")}
                  disabled={!formData.purchasable || status.loading}
                />
                <FloatingField
                  label="Description"
                  placeholder="Optional description"
                  inputType="textarea"
                  name="purchaseDescription"
                  value={formData.purchaseDescription}
                  onChange={handleChange("purchaseDescription")}
                  disabled={!formData.purchasable || status.loading}
                />
              </InfoCard>
            </section>

            <InfoCard title="Inventory & Tracking" fullWidth>
              <div className="mt-4 space-y-4 rounded-2xl border border-[#e3e8f9] bg-[#f7f9ff] p-6">
                <FloatingCheckbox
                  label="Track inventory for this item"
                  name="trackInventory"
                  checked={trackInventory}
                  onChange={(event) => setTrackInventory(event.target.checked)}
                  disabled={status.loading}
                />
                <FloatingCheckbox
                  label="Track bin location for this item"
                  name="trackBin"
                  checked={trackBin}
                  onChange={(event) => setTrackBin(event.target.checked)}
                  disabled={status.loading || !trackInventory}
                />
                {trackInventory && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-[#1f2937]">Advanced Inventory Tracking</p>
                    <div className="flex flex-wrap gap-4">
                      <FloatingRadio
                        name="trackingMethod"
                        label="None"
                        value="none"
                        checked={trackingMethod === "none"}
                        onChange={() => setTrackingMethod("none")}
                        disabled={status.loading}
                      />
                      <FloatingRadio
                        name="trackingMethod"
                        label="Track Serial Number"
                        value="serial"
                        checked={trackingMethod === "serial"}
                        onChange={() => setTrackingMethod("serial")}
                        disabled={status.loading}
                      />
                      <FloatingRadio
                        name="trackingMethod"
                        label="Track Batches"
                        value="batch"
                        checked={trackingMethod === "batch"}
                        onChange={() => setTrackingMethod("batch")}
                        disabled={status.loading}
                      />
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                    <div className="grid gap-4 md:grid-cols-2">
                      <SearchableSelect
                        label="Inventory Account*"
                        placeholder="Select an account"
                        value={formData.inventoryAccount}
                        onChange={handleSelectChange("inventoryAccount")}
                        groups={inventoryAccountGroups}
                        required
                        disabled={status.loading}
                      />
                      <SearchableSelect
                        label="Inventory Valuation Method*"
                        placeholder="Select the valuation method"
                        value={formData.inventoryValuationMethod}
                        onChange={handleSelectChange("inventoryValuationMethod")}
                        groups={inventoryValuationGroups}
                        required
                        disabled={status.loading}
                      />
                    </div>
                    </div>
                    <FloatingField
                      label="Reorder Point"
                      placeholder="Enter quantity"
                      name="reorderPoint"
                      value={formData.reorderPoint}
                      onChange={handleChange("reorderPoint")}
                      disabled={status.loading}
                    />
                  </div>
                )}
              </div>
              <div className="mt-3 rounded-xl border border-[#d7dcf5] bg-[#f5f7ff] px-4 py-3 text-sm text-[#475569]">
                <strong className="font-semibold text-[#1f2937]">Note:</strong> You can add opening stock on the item
                details page by clicking the gear icon under Warehouses.
              </div>
            </InfoCard>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                className="text-sm font-medium text-[#2563eb] hover:text-[#1d4ed8]"
              >
                + Configure Accounts
              </button>
              <div className="flex items-center gap-3">
                <Link
                  to={backUrl}
                  className="rounded-md border border-[#d7dcf5] px-5 py-2 text-sm font-medium text-[#475569] transition hover:bg-white"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={status.loading}
                  className="rounded-md bg-[#3762f9] px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#2748c9] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {status.loading ? (groupId ? "Adding to Group..." : "Saving...") : (groupId ? "Add to Group" : "Save Item")}
                </button>
              </div>
            </div>
          </div>
        </div>
      </form>
      {showManufacturerModal && (
        <ManufacturerModal
          onClose={() => {
            setShowManufacturerModal(false);
            setNewManufacturer("");
          }}
          onAdd={(name) => {
            if (name.trim()) {
              setManufacturers((prev) =>
                prev.includes(name.trim()) ? prev : [...prev, name.trim()]
              );
              handleManufacturerSelect(name.trim());
              setShowManufacturerModal(false);
              setNewManufacturer("");
            }
          }}
          newManufacturer={newManufacturer}
          setNewManufacturer={setNewManufacturer}
        />
      )}
      {showBrandModal && (
        <BrandModal
          onClose={() => {
            setShowBrandModal(false);
            setNewBrand("");
          }}
          onAdd={(name) => {
            if (name.trim()) {
              setBrands((prev) =>
                prev.includes(name.trim()) ? prev : [...prev, name.trim()]
              );
              handleBrandSelect(name.trim());
              setShowBrandModal(false);
              setNewBrand("");
            }
          }}
          newBrand={newBrand}
          setNewBrand={setNewBrand}
        />
      )}
    </div>
  );
};

export default ShoeSalesItemCreate;

const FloatingField = ({
  label,
  placeholder,
  required = false,
  inputType = "input",
  hint,
  prefix,
  name,
  value,
  onChange,
  disabled = false,
}) => (
  <label className="flex w-full flex-col gap-1 text-sm text-[#475569]">
    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
      {label}
      {required && <span className="text-[#ef4444]"> *</span>}
    </span>
    {inputType === "textarea" ? (
      <textarea
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        disabled={disabled}
        className="rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] placeholder:text-[#94a3b8] focus:border-[#4285f4] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f1f5f9]"
      />
    ) : inputType === "select" ? (
      <select
        name={name}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f1f5f9]"
      >
        <option value="">{placeholder}</option>
      </select>
    ) : (
      <div className="flex items-center rounded-lg border border-[#d7dcf5] focus-within:border-[#4285f4]">
        {prefix && <span className="pl-3 text-xs font-semibold uppercase text-[#64748b]">{prefix}</span>}
        <input
          type="text"
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full rounded-lg px-3 py-2 text-sm text-[#1f2937] placeholder:text-[#94a3b8] focus:outline-none disabled:cursor-not-allowed disabled:bg-[#f1f5f9]"
        />
        {hint && <span className="pr-3 text-xs text-[#94a3b8]">{hint}</span>}
      </div>
    )}
  </label>
);

const FloatingCheckbox = ({ label, name, checked, onChange, disabled = false }) => (
  <label className="inline-flex items-center gap-3 rounded-lg border border-[#dbe4ff] bg-white px-4 py-2 text-sm font-medium text-[#1f2937] shadow-sm">
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="h-4 w-4 rounded border-[#cbd5f5] text-[#4285f4] focus:ring-[#4285f4] disabled:cursor-not-allowed"
    />
    {label}
  </label>
);

const FloatingRadio = ({ name, label, value, checked, onChange, disabled = false }) => (
  <label className="inline-flex items-center gap-2 rounded-full border border-[#dbe4ff] bg-white px-4 py-2 text-sm font-medium text-[#1f2937] shadow-sm">
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      disabled={disabled}
      className="text-[#4285f4] focus:ring-[#4285f4] disabled:cursor-not-allowed"
    />
    {label}
  </label>
);

const SearchableSelect = ({ label, placeholder, value, onChange, groups, disabled = false, required = false }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const containerRef = useRef(null);

  const normalizedGroups = useMemo(
    () =>
      groups.map((group) => ({
        group: group.group,
        options: group.options.map((option) =>
          typeof option === "string" ? { label: option, value: option } : option
        ),
      })),
    [groups]
  );

  const optionMap = useMemo(() => {
    const map = new Map();
    normalizedGroups.forEach((group) => {
      group.options.forEach((option) => {
        map.set(option.value, option.label);
      });
    });
    return map;
  }, [normalizedGroups]);

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

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return groups;
    }
    return normalizedGroups
      .map((group) => ({
        group: group.group,
        options: group.options.filter((option) => option.label.toLowerCase().includes(term)),
      }))
      .filter((group) => group.options.length > 0);
  }, [normalizedGroups, search]);

  const displayValue = value ? optionMap.get(value) || value : "";

  return (
    <div className="relative flex w-full flex-col gap-1 text-sm text-[#475569]" ref={containerRef}>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
        {label}
        {required && <span className="text-[#ef4444]"> *</span>}
      </span>
      <div
        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition ${
          open ? "border-[#2563eb] shadow-[0_0_0_3px_rgba(37,99,235,0.08)]" : "border-[#d7dcf5]"
        } ${disabled ? "bg-[#f1f5f9] text-[#9ca3af]" : "bg-white text-[#1f2937]"} ${disabled ? "" : "cursor-pointer"}`}
        onClick={() => !disabled && setOpen((prev) => !prev)}
      >
        <span className={value ? "text-[#1f2937]" : "text-[#9ca3af]"}>{displayValue || placeholder}</span>
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
              placeholder="Search"
              className="h-8 w-full border-none text-sm text-[#1f2937] outline-none placeholder:text-[#9ca3af]"
            />
          </div>
          <div className="max-h-60 overflow-y-scroll py-2 searchable-select-scroll" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
            <style>{`
              .searchable-select-scroll::-webkit-scrollbar {
                width: 8px;
              }
              .searchable-select-scroll::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
              }
              .searchable-select-scroll::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 4px;
              }
              .searchable-select-scroll::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}</style>
            {filteredGroups.length === 0 && (
              <p className="px-4 py-6 text-center text-xs text-[#9ca3af]">No matching results</p>
            )}
            {filteredGroups.map((group) => (
              <div key={group.group}>
                <p className="px-4 pb-1 pt-3 text-xs font-semibold uppercase tracking-wide text-[#9ca3af]">
                  {group.group}
                </p>
                {group.options.map((option) => {
                  const isSelected = value === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        onChange(option.value);
                        setOpen(false);
                        setSearch("");
                      }}
                      className={`select-option flex w-full items-center rounded-md px-4 py-2 text-left text-sm transition ${
                        isSelected
                          ? "bg-[#e9f0ff] font-semibold text-[#1f2937]"
                          : "bg-white text-[#475569] hover:bg-[#f6f8ff]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const InfoCard = ({ title, children, fullWidth, actions }) => (
  <div
    className={`rounded-2xl border border-[#dbe4ff] bg-[#f7f9ff] p-6 shadow-sm ${
      fullWidth ? "space-y-4" : "space-y-4"
    }`}
  >
    <div className="flex flex-wrap items-center justify-between gap-3">
      <h3 className="text-sm font-semibold text-[#1f2937]">{title}</h3>
      {actions}
    </div>
    <div className="space-y-4">{children}</div>
  </div>
);

const UnitSelect = ({ label, placeholder, value, onChange, options = [] }) => {
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
    return options.filter((o) => o.toLowerCase().includes(term));
  }, [options, search]);

  const displayValue = value || "";

  return (
    <div className="relative flex w-full flex-col gap-1 text-sm text-[#475569]" ref={containerRef}>
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">{label}</span>
      <div
        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-200 ease-in-out ${
          open ? "border-[#2563eb] shadow-[0_0_0_3px_rgba(37,99,235,0.08)]" : "border-[#d7dcf5] hover:border-[#94a3b8]"
        } bg-white text-[#1f2937] cursor-pointer`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={`transition-colors duration-150 ${value ? "text-[#1f2937]" : "text-[#9ca3af]"}`}>{displayValue || placeholder}</span>
        <ChevronDown
          size={16}
          className={`ml-3 text-[#9ca3af] transition-transform duration-200 ease-in-out ${open ? "rotate-180" : "rotate-0"}`}
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-[#d7dcf5] bg-white shadow-[0_24px_48px_-28px_rgba(15,23,42,0.45)] dropdown-animate">
          <style>{`
            @keyframes dropdownFadeIn {
              from {
                opacity: 0;
                transform: translateY(-8px);
              }
              to {
                opacity: 1;
                transform: translateY(0);
              }
            }
            .dropdown-animate {
              animation: dropdownFadeIn 0.2s ease-out;
            }
          `}</style>
          <div className="flex items-center gap-2 bg-[#2563eb] px-3 py-2 text-white rounded-t-xl">
            <Search size={14} className="text-white" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Select or type to add"
              className="h-8 w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-white/80"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-60 overflow-y-scroll py-2 unit-select-scroll bg-white rounded-b-xl" style={{ scrollbarWidth: 'thin', scrollbarColor: '#cbd5e1 #f1f5f9' }}>
            <style>{`
              .unit-select-scroll::-webkit-scrollbar {
                width: 8px;
              }
              .unit-select-scroll::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
              }
              .unit-select-scroll::-webkit-scrollbar-thumb {
                background: #cbd5e1;
                border-radius: 4px;
              }
              .unit-select-scroll::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}</style>
            {filteredOptions.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-[#9ca3af]">No matching results</p>
            ) : (
              filteredOptions.map((option) => {
                const isSelected = value === option;
                return (
                  <div
                    key={option}
                    onClick={() => {
                      onChange(option);
                      setOpen(false);
                      setSearch("");
                    }}
                    className={`flex w-full items-center px-4 py-2 text-left text-sm cursor-pointer transition-all duration-150 ease-in-out ${
                      isSelected
                        ? "text-[#2563eb] font-semibold"
                        : "text-[#475569] hover:text-[#2563eb]"
                    }`}
                  >
                    {option}
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const TaxRateSelect = ({ label, value, onChange, type }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [hoveredIndex, setHoveredIndex] = useState(-1);
  const containerRef = useRef(null);

  // Tax rate options based on type
  const taxRateOptions = type === "intra" 
    ? [
        "GST0 [0%]",
        "GST5 [5%]",
        "GST12 [12%]",
        "GST18 [18%]",
        "GST28 [28%]",
      ]
    : [
        "IGST0 [0%]",
        "IGST5 [5%]",
        "IGST12 [12%]",
        "IGST18 [18%]",
        "IGST28 [28%]",
      ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false);
        setSearch("");
        setHoveredIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return taxRateOptions;
    }
    return taxRateOptions.filter((o) => o.toLowerCase().includes(term));
  }, [search, taxRateOptions]);

  const displayValue = value || "";

  return (
    <div className="relative flex w-full flex-col gap-1 text-sm text-[#475569]" ref={containerRef}>
      <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b] cursor-pointer border-b border-dotted border-[#64748b] pb-0.5 inline-block w-fit">
        {label}
      </label>
      <div
        className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm transition-all duration-200 ease-in-out ${
          open ? "border-[#2563eb] shadow-[0_0_0_3px_rgba(37,99,235,0.08)]" : "border-[#d7dcf5] hover:border-[#94a3b8]"
        } bg-white text-[#1f2937] cursor-pointer`}
        onClick={() => setOpen((prev) => !prev)}
      >
        <span className={`transition-colors duration-150 ${value ? "text-[#1f2937]" : "text-[#9ca3af]"}`}>
          {displayValue || "Select tax rate"}
        </span>
        <ChevronDown
          size={16}
          className={`ml-3 text-[#9ca3af] transition-transform duration-200 ease-in-out ${open ? "rotate-180" : "rotate-0"}`}
        />
      </div>
      {open && (
        <div className="absolute z-50 mt-2 w-full rounded-xl border border-[#d7dcf5] bg-white shadow-[0_24px_48px_-28px_rgba(15,23,42,0.45)]">
          <div className="flex items-center gap-2 border-b border-[#edf1ff] px-3 py-2 bg-[#2563eb] rounded-t-xl">
            <Search size={14} className="text-white" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search"
              className="h-8 w-full border-none bg-transparent text-sm text-white outline-none placeholder:text-white/80"
              onClick={(e) => e.stopPropagation()}
              autoFocus
            />
          </div>
          <div className="py-2">
            <div className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.1em] text-[#64748b]">
              Tax
            </div>
            <div className="max-h-60 overflow-y-scroll tax-rate-select-scroll">
              <style>{`
                .tax-rate-select-scroll::-webkit-scrollbar {
                  width: 8px;
                }
                .tax-rate-select-scroll::-webkit-scrollbar-track {
                  background: #f1f5f9;
                  border-radius: 4px;
                }
                .tax-rate-select-scroll::-webkit-scrollbar-thumb {
                  background: #cbd5e1;
                  border-radius: 4px;
                }
                .tax-rate-select-scroll::-webkit-scrollbar-thumb:hover {
                  background: #94a3b8;
                }
              `}</style>
              {filteredOptions.length === 0 ? (
                <p className="px-4 py-6 text-center text-xs text-[#9ca3af]">No matching results</p>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = value === option;
                  const isHovered = hoveredIndex === index;
                  return (
                    <div
                      key={option}
                      onClick={() => {
                        onChange(option);
                        setOpen(false);
                        setSearch("");
                        setHoveredIndex(-1);
                      }}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(-1)}
                      className={`flex items-center justify-between px-4 py-2.5 text-sm cursor-pointer transition-all duration-150 ease-in-out ${
                        isSelected
                          ? "bg-[#2563eb] text-white"
                          : isHovered
                          ? "bg-[#2563eb] text-white"
                          : "bg-white text-[#475569] hover:bg-[#f8fafc]"
                      }`}
                    >
                      <span>{option}</span>
                      {isSelected && (
                        <Check size={16} className="text-white" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const ManufacturerSelect = ({ label, placeholder, value, onChange, options = [], onManageClick, disabled = false }) => {
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
              placeholder="Search manufacturer"
              className="h-8 w-full border-none text-sm text-[#1f2937] outline-none placeholder:text-[#9ca3af]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-2 manufacturer-select-scroll">
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
                  className={`select-option flex w-full items-center rounded-md px-4 py-2 text-left text-sm transition ${
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
                Manage Manufacturers
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const BrandSelect = ({ label, placeholder, value, onChange, options = [], onManageClick, disabled = false }) => {
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
              placeholder="Search brand"
              className="h-8 w-full border-none text-sm text-[#1f2937] outline-none placeholder:text-[#9ca3af]"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-56 overflow-y-auto py-2 brand-select-scroll">
            {filteredOptions.length === 0 ? (
              <p className="px-4 py-6 text-center text-xs text-[#9ca3af]">No matching results</p>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option}
                  onClick={() => {
                    onChange(option);
                    setOpen(false);
                    setSearch("");
                  }}
                  className={`flex w-full items-center px-4 py-2 text-left text-sm cursor-pointer transition ${
                    value === option
                      ? "text-[#2563eb] font-semibold"
                      : "text-[#475569] hover:text-[#2563eb]"
                  }`}
                >
                  {option}
                </div>
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
                Manage Brands
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const ManufacturerModal = ({ onClose, onAdd, newManufacturer, setNewManufacturer }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newManufacturer.trim()) {
      onAdd(newManufacturer.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-[#d7dcf5] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e7ebf8] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#1f2937]">Add Manufacturer</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#9ca3af] hover:bg-[#f1f5f9] hover:text-[#475569] transition"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
              Manufacturer Name*
            </label>
            <input
              type="text"
              value={newManufacturer}
              onChange={(e) => setNewManufacturer(e.target.value)}
              placeholder="Enter manufacturer name"
              className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none"
              autoFocus
            />
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
              disabled={!newManufacturer.trim()}
              className="rounded-md border border-[#d7dcf5] px-4 py-2 text-sm font-medium text-[#475569] transition hover:bg-white disabled:bg-[#f1f5f9] disabled:text-[#9ca3af] disabled:cursor-not-allowed"
            >
              Add Manufacturer
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const BrandModal = ({ onClose, onAdd, newBrand, setNewBrand }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newBrand.trim()) {
      onAdd(newBrand.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-[#d7dcf5] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e7ebf8] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#1f2937]">Add Brand</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-[#9ca3af] hover:bg-[#f1f5f9] hover:text-[#475569] transition"
          >
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">
              Brand Name*
            </label>
            <input
              type="text"
              value={newBrand}
              onChange={(e) => setNewBrand(e.target.value)}
              placeholder="Enter brand name"
              className="w-full rounded-lg border border-[#d7dcf5] px-3 py-2 text-sm text-[#1f2937] focus:border-[#4285f4] focus:outline-none"
              autoFocus
            />
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
              disabled={!newBrand.trim()}
              className="rounded-md border border-[#d7dcf5] px-4 py-2 text-sm font-medium text-[#475569] transition hover:bg-white disabled:bg-[#f1f5f9] disabled:text-[#9ca3af] disabled:cursor-not-allowed"
            >
              Add Brand
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};