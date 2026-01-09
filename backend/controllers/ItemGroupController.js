import ItemGroup from "../model/ItemGroup.js";
import ItemHistory from "../model/ItemHistory.js";
import ShoeItem from "../model/ShoeItem.js";
import { nextItemGroup } from "../utils/nextItemGroup.js";

// Warehouse name normalization mapping (same as TransferOrderController and ShoeItemController)
const WAREHOUSE_NAME_MAPPING = {
  // Trivandrum variations
  "Grooms Trivandum": "Grooms Trivandrum",
  "Grooms Trivandrum": "Grooms Trivandrum",
  "SG-Trivandrum": "Grooms Trivandrum",
  
  // Palakkad variations
  "G.Palakkad": "Palakkad Branch",
  "G.Palakkad ": "Palakkad Branch",
  "GPalakkad": "Palakkad Branch",
  "Palakkad Branch": "Palakkad Branch",
  
  // Warehouse variations
  "Warehouse": "Warehouse",
  "warehouse": "Warehouse",
  "WAREHOUSE": "Warehouse",
  
  // Calicut variations
  "G.Calicut": "Calicut",
  "G.Calicut ": "Calicut",
  "GCalicut": "Calicut",
  "Calicut": "Calicut",
  
  // Manjeri/Manjery variations
  "G.Manjeri": "Manjery Branch",
  "G.Manjery": "Manjery Branch",
  "GManjeri": "Manjery Branch",
  "GManjery": "Manjery Branch",
  "Manjery Branch": "Manjery Branch",
  
  // Kannur variations
  "G.Kannur": "Kannur Branch",
  "GKannur": "Kannur Branch",
  "Kannur Branch": "Kannur Branch",
  
  // Edappal variations
  "G.Edappal": "Edappal Branch",
  "GEdappal": "Edappal Branch",
  "Edappal Branch": "Edappal Branch",
  
  // Edapally variations
  "G.Edappally": "Edapally Branch",
  "G-Edappally": "Edapally Branch",
  "GEdappally": "Edapally Branch",
  "Edapally Branch": "Edapally Branch",
  
  // Kalpetta variations
  "G.Kalpetta": "Kalpetta Branch",
  "GKalpetta": "Kalpetta Branch",
  "Kalpetta Branch": "Kalpetta Branch",
  
  // Kottakkal variations
  "G.Kottakkal": "Kottakkal Branch",
  "GKottakkal": "Kottakkal Branch",
  "Kottakkal Branch": "Kottakkal Branch",
  "Z.Kottakkal": "Kottakkal Branch",
  
  // Perinthalmanna variations
  "G.Perinthalmanna": "Perinthalmanna Branch",
  "GPerinthalmanna": "Perinthalmanna Branch",
  "Perinthalmanna Branch": "Perinthalmanna Branch",
  "Z.Perinthalmanna": "Perinthalmanna Branch",
  
  // Chavakkad variations
  "G.Chavakkad": "Chavakkad Branch",
  "GChavakkad": "Chavakkad Branch",
  "Chavakkad Branch": "Chavakkad Branch",
  
  // Thrissur variations
  "G.Thrissur": "Thrissur Branch",
  "GThrissur": "Thrissur Branch",
  "Thrissur Branch": "Thrissur Branch",
  
  // Perumbavoor variations
  "G.Perumbavoor": "Perumbavoor Branch",
  "GPerumbavoor": "Perumbavoor Branch",
  "Perumbavoor Branch": "Perumbavoor Branch",
  
  // Kottayam variations
  "G.Kottayam": "Kottayam Branch",
  "GKottayam": "Kottayam Branch",
  "Kottayam Branch": "Kottayam Branch",
  
  // MG Road variations
  "G.MG Road": "SuitorGuy MG Road",
  "G.Mg Road": "SuitorGuy MG Road",
  "GMG Road": "SuitorGuy MG Road",
  "GMg Road": "SuitorGuy MG Road",
  "MG Road": "SuitorGuy MG Road",
  "SuitorGuy MG Road": "SuitorGuy MG Road",
  
  // Head Office variations
  "HEAD OFFICE01": "Head Office",
  "Head Office": "Head Office",
  
  // Other locations (default to Warehouse)
  "Z-Edapally1": "Warehouse",
  "Z- Edappal": "Warehouse",
  "Production": "Warehouse",
  "Office": "Warehouse",
  "G.Vadakara": "Warehouse",
};

// Normalize warehouse name to standard format
const normalizeWarehouseName = (warehouseName) => {
  if (!warehouseName) return null;
  
  const trimmed = warehouseName.toString().trim();
  
  // Check direct mapping
  if (WAREHOUSE_NAME_MAPPING[trimmed]) {
    return WAREHOUSE_NAME_MAPPING[trimmed];
  }
  
  // Check case-insensitive mapping
  const lowerName = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(WAREHOUSE_NAME_MAPPING)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  // If no mapping found, return original (trimmed)
  return trimmed;
};

// Helper function to generate change details
const generateChangeDetails = (oldItem, newItem, changeType) => {
  const changes = [];
  
  if (changeType === "STOCK_UPDATE") {
    // Check for warehouse stock changes
    const oldStocks = oldItem?.warehouseStocks || [];
    const newStocks = newItem?.warehouseStocks || [];
    
    // Compare warehouse stocks
    newStocks.forEach(newStock => {
      const oldStock = oldStocks.find(s => s.warehouse === newStock.warehouse);
      if (oldStock) {
        if (oldStock.openingStock !== newStock.openingStock) {
          changes.push(`Opening stock for ${newStock.warehouse} changed from ${oldStock.openingStock || 0} to ${newStock.openingStock || 0}`);
        }
        if (oldStock.stockOnHand !== newStock.stockOnHand) {
          changes.push(`Stock on hand for ${newStock.warehouse} changed from ${oldStock.stockOnHand || 0} to ${newStock.stockOnHand || 0}`);
        }
      } else {
        changes.push(`Added stock for ${newStock.warehouse}: ${newStock.openingStock || 0}`);
      }
    });
    
    // Check for removed stocks
    oldStocks.forEach(oldStock => {
      if (!newStocks.find(s => s.warehouse === oldStock.warehouse)) {
        changes.push(`Removed stock for ${oldStock.warehouse}`);
      }
    });
    
    // Check for general stock changes
    if (oldItem?.stock !== newItem?.stock) {
      changes.push(`Initial stock changed from ${oldItem?.stock || 0} to ${newItem?.stock || 0}`);
    }
  } else {
    // General field changes
    const fieldsToCheck = ['name', 'sku', 'costPrice', 'sellingPrice', 'stock', 'reorderPoint'];
    fieldsToCheck.forEach(field => {
      if (oldItem?.[field] !== newItem?.[field]) {
        const oldVal = oldItem?.[field] ?? '';
        const newVal = newItem?.[field] ?? '';
        if (field === 'stock') {
          changes.push(`Initial stock changed from ${oldVal} to ${newVal}`);
        } else {
          changes.push(`${field} changed from ${oldVal} to ${newVal}`);
        }
      }
    });
  }
  
  if (changes.length === 0) {
    return "updated";
  }
  
  return changes.join(", ");
};

// Helper function to map locName to warehouse name
const mapLocNameToWarehouse = (locName) => {
  if (!locName) return "Warehouse"; // Default to Warehouse
  // Remove prefixes like "G.", "Z.", "SG."
  let warehouse = locName.replace(/^[A-Z]\.?\s*/i, "").trim();
  // Add "Branch" if not already present and not "Warehouse"
  if (warehouse && warehouse.toLowerCase() !== "warehouse" && !warehouse.toLowerCase().includes("branch")) {
    warehouse = `${warehouse} Branch`;
  }
  return warehouse || "Warehouse";
};

export const createItemGroup = async (req, res) => {
  try {
    if (!req.body.name || req.body.name.trim() === "") {
      return res.status(400).json({ message: "Item group name is required." });
    }

    // Get user's warehouse from request
    const userWarehouse = req.body.userWarehouse || req.headers['x-user-warehouse'] || null;
    const userLocName = req.body.userLocName || req.headers['x-user-locname'] || null;
    
    // Determine warehouse - use provided warehouse or map from locName
    let targetWarehouse = userWarehouse;
    if (!targetWarehouse && userLocName) {
      targetWarehouse = mapLocNameToWarehouse(userLocName);
    }
    // Default to "Warehouse" if still not set
    if (!targetWarehouse) {
      targetWarehouse = "Warehouse";
    }

    // Ensure items array is properly formatted
    let items = Array.isArray(req.body.items) 
      ? req.body.items.filter(item => item && item.name && item.name.trim() !== "")
      : [];

    // Initialize warehouseStocks for each item if not provided
    items = items.map(item => {
      // If item already has warehouseStocks, use them; otherwise initialize
      if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks) || item.warehouseStocks.length === 0) {
        const initialStock = item.stock || item.openingStock || 0;
        item.warehouseStocks = [{
          warehouse: targetWarehouse,
          openingStock: initialStock,
          openingStockValue: 0,
          stockOnHand: initialStock,
          committedStock: 0,
          availableForSale: initialStock,
          physicalOpeningStock: initialStock,
          physicalStockOnHand: initialStock,
          physicalCommittedStock: 0,
          physicalAvailableForSale: initialStock,
        }];
      } else {
        // Ensure at least one entry has the user's warehouse
        const hasUserWarehouse = item.warehouseStocks.some(ws => {
          const wsWarehouse = (ws.warehouse || "").toString().toLowerCase().trim();
          const targetWarehouseLower = targetWarehouse.toLowerCase().trim();
          return wsWarehouse === targetWarehouseLower ||
                 wsWarehouse.includes(targetWarehouseLower) ||
                 targetWarehouseLower.includes(wsWarehouse);
        });
        
        if (!hasUserWarehouse) {
          // Add user's warehouse entry
          const initialStock = item.stock || item.openingStock || 0;
          item.warehouseStocks.push({
            warehouse: targetWarehouse,
            openingStock: initialStock,
            openingStockValue: 0,
            stockOnHand: initialStock,
            committedStock: 0,
            availableForSale: initialStock,
            physicalOpeningStock: initialStock,
            physicalStockOnHand: initialStock,
            physicalCommittedStock: 0,
            physicalAvailableForSale: initialStock,
          });
        }
      }
      return item;
    });

    console.log("Creating item group with items:", items.length, "for warehouse:", targetWarehouse);

    // Check for duplicate group SKU if provided
    if (req.body.sku && req.body.sku.trim()) {
      const groupSku = req.body.sku.toString().trim().toUpperCase();
      
      // Check in other ItemGroups
      const existingGroup = await ItemGroup.findOne({ sku: groupSku });
      if (existingGroup) {
        return res.status(409).json({ 
          message: `Item group SKU "${groupSku}" already exists. Please use a different SKU.` 
        });
      }
      
      // Check in ShoeItem collection
      const existingShoeItem = await ShoeItem.findOne({ sku: groupSku });
      if (existingShoeItem) {
        return res.status(409).json({ 
          message: `SKU "${groupSku}" already exists in standalone items. Please use a different SKU.` 
        });
      }
    }

    // Check for duplicate SKUs in items
    const skusToCheck = items
      .map(item => item.sku?.toString().trim().toUpperCase())
      .filter(sku => sku && sku !== "");

    if (skusToCheck.length > 0) {
      // Check for duplicates within the same group
      const uniqueSkus = new Set(skusToCheck);
      if (uniqueSkus.size !== skusToCheck.length) {
        const duplicates = skusToCheck.filter((sku, index) => skusToCheck.indexOf(sku) !== index);
        return res.status(409).json({ 
          message: `Duplicate SKUs found within the group: ${[...new Set(duplicates)].join(", ")}. Each item must have a unique SKU.` 
        });
      }

      // Check for duplicates in existing ItemGroup items
      const existingGroups = await ItemGroup.find({ 
        "items.sku": { $in: skusToCheck }
      });
      
      const existingSkusInGroups = [];
      existingGroups.forEach(group => {
        if (group.items && Array.isArray(group.items)) {
          group.items.forEach(item => {
            const itemSku = item.sku?.toString().trim().toUpperCase();
            if (itemSku && skusToCheck.includes(itemSku)) {
              existingSkusInGroups.push(itemSku);
            }
          });
        }
      });

      // Check for duplicates in ShoeItem collection
      const existingShoeItems = await ShoeItem.find({ 
        sku: { $in: skusToCheck }
      });
      const existingSkusInShoeItems = existingShoeItems
        .map(item => item.sku?.toString().trim().toUpperCase())
        .filter(sku => sku && sku !== "");

      // Combine all existing SKUs
      const allExistingSkus = [...new Set([...existingSkusInGroups, ...existingSkusInShoeItems])];
      
      if (allExistingSkus.length > 0) {
        return res.status(409).json({ 
          message: `The following SKUs already exist in the system: ${allExistingSkus.join(", ")}. Please use different SKUs.` 
        });
      }
    }

    // Auto-generate groupId if not provided
    let groupId = req.body.groupId;
    if (!groupId || groupId.trim() === "") {
      groupId = await nextItemGroup();
      console.log("Auto-generated groupId:", groupId);
    }

    const payload = {
      ...req.body,
      groupId: groupId,
      name: req.body.name.trim(),
      items: items,
      stock: req.body.stock || 0,
      attributeRows: req.body.attributeRows || [],
    };

    const itemGroup = await ItemGroup.create(payload);
    console.log("Item group created with items count:", itemGroup.items ? itemGroup.items.length : 0, "groupId:", itemGroup.groupId);
    return res.status(201).json(itemGroup);
  } catch (error) {
    console.error("Error creating item group:", error);
    
    // Return more detailed error message
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: errors 
      });
    }
    
    return res.status(500).json({ 
      message: "Failed to create item group.",
      error: error.message 
    });
  }
};

// Helper function to check if item group has stock in warehouse (strict check - must have stock > 0)
const hasStockInWarehouse = (items, targetWarehouse) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return false;
  }
  if (!targetWarehouse) {
    return true; // If no warehouse specified (admin), show all groups
  }
  
  // Normalize target warehouse name
  const normalizedTarget = normalizeWarehouseName(targetWarehouse);
  const targetWarehouseLower = (normalizedTarget || targetWarehouse).toLowerCase().trim();
  const isTargetWarehouse = targetWarehouseLower === "warehouse";
  
  // Check if ANY item in the group has stock in the target warehouse
  const hasMatchingItem = items.some(item => {
    const warehouseStocks = item.warehouseStocks || [];
    
    // If item has no warehouse stocks, exclude it
    if (!warehouseStocks || warehouseStocks.length === 0) {
      return false;
    }
    
    return warehouseStocks.some(stock => {
      const stockWarehouseRaw = (stock.warehouse || "").toString().trim();
      // Normalize stock warehouse name
      const normalizedStock = normalizeWarehouseName(stockWarehouseRaw);
      const stockWarehouse = (normalizedStock || stockWarehouseRaw).toLowerCase().trim();
      
      // For "Warehouse" - only match exactly "warehouse"
      if (isTargetWarehouse) {
        if (stockWarehouse !== "warehouse") {
          return false;
        }
      } else {
        // For store branches - exclude "warehouse" and match the specific store
        if (stockWarehouse === "warehouse") {
          return false; // Store users should NOT see items with stock only in "Warehouse"
        }
        
        // Check exact match first (most strict) - after normalization
        if (stockWarehouse === targetWarehouseLower) {
          // Exact match - check stock
          const stockOnHand = parseFloat(stock.stockOnHand) || 0;
          const availableForSale = parseFloat(stock.availableForSale) || 0;
          return stockOnHand > 0 || availableForSale > 0;
        }
        
        // Check if warehouse name contains the store name (e.g., "kannur branch" contains "kannur")
        // Extract the base name (remove "branch", "warehouse", etc.)
        const stockBase = stockWarehouse.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
        const targetBase = targetWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
        
        if (stockBase && targetBase && stockBase === targetBase) {
          // Base names match - check stock
          const stockOnHand = parseFloat(stock.stockOnHand) || 0;
          const availableForSale = parseFloat(stock.availableForSale) || 0;
          return stockOnHand > 0 || availableForSale > 0;
        }
        
        // Special handling for Trivandrum variations
        const trivandrumVariations = ["trivandrum", "grooms trivandrum", "sg-trivandrum"];
        const stockIsTrivandrum = trivandrumVariations.some(v => stockWarehouse.includes(v));
        const targetIsTrivandrum = trivandrumVariations.some(v => targetWarehouseLower.includes(v));
        if (stockIsTrivandrum && targetIsTrivandrum) {
          // Both are Trivandrum variations - check stock
          const stockOnHand = parseFloat(stock.stockOnHand) || 0;
          const availableForSale = parseFloat(stock.availableForSale) || 0;
          return stockOnHand > 0 || availableForSale > 0;
        }
        
        return false;
      }
      
      // Check if there's actual stock (stockOnHand > 0 or availableForSale > 0)
      const stockOnHand = parseFloat(stock.stockOnHand) || 0;
      const availableForSale = parseFloat(stock.availableForSale) || 0;
      return stockOnHand > 0 || availableForSale > 0;
    });
  });
  
  return hasMatchingItem;
};

export const getItemGroups = async (req, res) => {
  try {
    const { userId, userPower, page, limit, warehouse, isAdmin } = req.query;
    
    console.log(`\n=== GET ITEM GROUPS REQUEST ===`);
    console.log(`Query params:`, req.query);
    console.log(`User warehouse: "${warehouse}"`);
    console.log(`Is admin: ${isAdmin}`);
    console.log(`==============================\n`);
    
    // Pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;
    
    // Get user locCode from query
    const userLocCode = req.query.locCode || "";
    
    // User is admin if: power === 'admin' OR locCode === '858' (Warehouse) OR email === 'officerootments@gmail.com'
    const adminEmails = ['officerootments@gmail.com'];
    const isAdminEmail = userId && typeof userId === 'string' && adminEmails.some(email => userId.toLowerCase() === email.toLowerCase());
    const userIsAdmin = isAdmin === "true" || isAdmin === true || 
                        isAdminEmail ||
                        (userPower && (userPower.toLowerCase() === 'admin' || userPower.toLowerCase() === 'super_admin')) ||
                        (userLocCode && (userLocCode === '858' || userLocCode === '103')); // 858 = Warehouse, 103 = WAREHOUSE
    
    // If admin has switched to a specific store (not Warehouse), filter by that store
    const isAdminViewingSpecificStore = userIsAdmin && warehouse && warehouse !== "Warehouse";
    
    // OPTION A: Item Groups are only visible to admins/warehouse users
    // Store/branch users should only see individual items (not groups)
    // This prevents confusion when individual items are transferred from groups
    if (!userIsAdmin) {
      console.log(`⛔ Non-admin user "${userId}" - Item Groups are only visible to admin/warehouse users`);
      console.log(`   Store users should use the Items page to see individual items`);
      
      return res.status(200).json({
        groups: [],
        pagination: {
          currentPage: pageNum,
          totalPages: 0,
          totalItems: 0,
          itemsPerPage: limitNum,
        },
        message: "Item Groups are only available for admin/warehouse users. Please use the Items page to view individual items."
      });
    }
    
    // Admin users can see all item groups
    const query = {};
    
    // Fetch ALL groups for admin
    let groups = await ItemGroup.find(query)
      .sort({ createdAt: -1 });
    
    console.log(`Fetched ${groups.length} total groups from database (admin view)`);
    console.log(`Is admin viewing specific store: ${isAdminViewingSpecificStore} (warehouse: "${warehouse}")`);
    
    // If admin is viewing a specific store, filter groups to only show those with items in that warehouse
    if (isAdminViewingSpecificStore) {
      groups = groups.filter(group => {
        if (!group.items || !Array.isArray(group.items)) return false;
        // Check if group has at least one item with stock in the selected warehouse
        return group.items.some(item => {
          if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks)) return false;
          return item.warehouseStocks.some(ws => {
            const wsWarehouse = (ws.warehouse || "").toString().toLowerCase().trim();
            const targetWarehouse = warehouse.toLowerCase().trim();
            return (wsWarehouse === targetWarehouse || wsWarehouse.includes(targetWarehouse) || targetWarehouse.includes(wsWarehouse)) &&
                   (parseFloat(ws.stockOnHand || 0) > 0);
          });
        });
      });
      console.log(`Filtered to ${groups.length} groups with stock in warehouse: "${warehouse}"`);
    }
    
    // Apply search filter if search term is provided
    const searchTerm = req.query.search || req.query.searchTerm || "";
    if (searchTerm && searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      const beforeSearch = groups.length;
      groups = groups.filter(group => {
        const groupName = (group.name || "").toLowerCase();
        const groupSku = (group.sku || "").toLowerCase();
        return groupName.includes(searchLower) || groupSku.includes(searchLower);
      });
      console.log(`Search filter "${searchTerm}": ${beforeSearch} groups -> ${groups.length} groups`);
    }
    
    // Get total count
    const totalGroups = groups.length;
    
    // Apply pagination
    const paginatedGroups = groups.slice(skip, skip + limitNum);
    
    // Transform data to match frontend format (admin view only)
    const formattedGroups = paginatedGroups.map(group => {
      const groupObj = group.toObject();
      
      // Get items array - ensure it's an array
      const itemsArray = Array.isArray(groupObj.items) ? groupObj.items : [];
      
      // Calculate total stock from all items
      // If admin is viewing a specific store, only count stock from that warehouse
      const totalStock = itemsArray.reduce((sum, item) => {
        // First try to sum warehouse stocks
        if (item.warehouseStocks && Array.isArray(item.warehouseStocks) && item.warehouseStocks.length > 0) {
          const warehouseTotal = item.warehouseStocks.reduce((wsSum, ws) => {
            // If viewing specific store, only count that warehouse's stock
            if (isAdminViewingSpecificStore) {
              const wsWarehouse = (ws.warehouse || "").toString().toLowerCase().trim();
              const targetWarehouse = warehouse.toLowerCase().trim();
              if (wsWarehouse === targetWarehouse || wsWarehouse.includes(targetWarehouse) || targetWarehouse.includes(wsWarehouse)) {
                return wsSum + (parseFloat(ws.stockOnHand || 0));
              }
              return wsSum;
            }
            // Otherwise sum all warehouses
            return wsSum + (parseFloat(ws.stockOnHand || 0));
          }, 0);
          return sum + warehouseTotal;
        }
        // Fallback to item.stock if no warehouseStocks
        const itemStock = typeof item.stock === 'number' ? item.stock : 0;
        return sum + itemStock;
      }, 0);
      
      // Get item count - if viewing specific store, only count items with stock in that warehouse
      let itemCount = itemsArray.length;
      if (isAdminViewingSpecificStore) {
        itemCount = itemsArray.filter(item => {
          if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
            return item.warehouseStocks.some(ws => {
              const wsWarehouse = (ws.warehouse || "").toString().toLowerCase().trim();
              const targetWarehouse = warehouse.toLowerCase().trim();
              return (wsWarehouse === targetWarehouse || wsWarehouse.includes(targetWarehouse) || targetWarehouse.includes(wsWarehouse)) &&
                     (parseFloat(ws.stockOnHand || 0) > 0);
            });
          }
          return false;
        }).length;
      }
      
      return {
        id: groupObj._id,
        groupId: groupObj.groupId || "", // Include groupId
        name: groupObj.name,
        items: itemCount,
        sku: groupObj.sku || "",
        stock: totalStock.toFixed(2),
        reorder: groupObj.reorder || "",
        // Only include primitive fields, exclude nested objects/arrays
        itemType: groupObj.itemType,
        unit: groupObj.unit,
        manufacturer: groupObj.manufacturer,
        brand: groupObj.brand,
        isActive: groupObj.isActive !== undefined ? groupObj.isActive : true,
        createdAt: groupObj.createdAt,
        updatedAt: groupObj.updatedAt,
      };
    });
    
    const totalPages = Math.ceil(totalGroups / limitNum);
    
    // Return paginated response
    return res.json({
      groups: formattedGroups,
      pagination: {
        currentPage: pageNum,
        itemsPerPage: limitNum,
        totalItems: totalGroups,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      }
    });
  } catch (error) {
    console.error("Error fetching item groups:", error);
    return res.status(500).json({ message: "Failed to fetch item groups." });
  }
};

export const getItemGroupById = async (req, res) => {
  try {
    const { id } = req.params;
    const { warehouse, isAdmin, filterByWarehouse } = req.query;

    if (!id) {
      return res.status(400).json({ message: "Item group ID is required." });
    }

    const itemGroup = await ItemGroup.findById(id);
    if (!itemGroup) {
      return res.status(404).json({ message: "Item group not found." });
    }

    // Convert to plain object for modification
    const groupObj = itemGroup.toObject();
    
    console.log(`\n=== GET ITEM GROUP BY ID ===`);
    console.log(`Group ID: ${id}`);
    console.log(`Query params - warehouse: "${warehouse}", isAdmin: "${isAdmin}", filterByWarehouse: "${filterByWarehouse}"`);
    console.log(`Items count: ${groupObj.items?.length || 0}`);
    
    // Debug: Log first item's warehouseStocks
    if (groupObj.items && groupObj.items.length > 0) {
      const firstItem = groupObj.items[0];
      console.log(`First item: ${firstItem.name}`);
      console.log(`First item warehouseStocks:`, JSON.stringify(firstItem.warehouseStocks, null, 2));
    }
    
    // If warehouse is specified and filterByWarehouse is true, filter items to only show those with stock in that warehouse
    // This is used when a branch user views a group - they should only see items transferred to their branch
    // Don't filter for main admin warehouses: "Warehouse" or "Warehouse Branch"
    const isMainWarehouse = warehouse === "Warehouse" || warehouse === "Warehouse Branch" || warehouse === "WAREHOUSE";
    
    if (warehouse && filterByWarehouse === "true" && !isMainWarehouse) {
      console.log(`\n=== FILTERING ITEM GROUP BY WAREHOUSE ===`);
      console.log(`Group: ${groupObj.name}, Warehouse filter: "${warehouse}"`);
      
      const normalizedTarget = normalizeWarehouseName(warehouse);
      const targetWarehouseLower = (normalizedTarget || warehouse).toLowerCase().trim();
      console.log(`Normalized target warehouse: "${normalizedTarget}", lowercase: "${targetWarehouseLower}"`);
      
      // Filter items to only include those with stock in the target warehouse
      if (groupObj.items && Array.isArray(groupObj.items)) {
        const originalCount = groupObj.items.length;
        
        groupObj.items = groupObj.items.filter(item => {
          if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks)) {
            return false;
          }
          
          // Check if item has a warehouseStocks entry for the target warehouse
          // We check for ANY entry (even with 0 stock) because a transfer creates the entry
          const hasWarehouseEntry = item.warehouseStocks.some(ws => {
            const wsWarehouseRaw = (ws.warehouse || "").toString().trim();
            const normalizedWs = normalizeWarehouseName(wsWarehouseRaw);
            const wsWarehouse = (normalizedWs || wsWarehouseRaw).toLowerCase().trim();
            
            console.log(`    Checking warehouse: "${wsWarehouse}" vs target: "${targetWarehouseLower}"`);
            
            // Skip main warehouse entries for branch users (they shouldn't see main warehouse stock)
            if (wsWarehouse === "warehouse" || wsWarehouse === "warehouse branch") {
              return false;
            }
            
            // Check exact match first
            if (wsWarehouse === targetWarehouseLower) {
              console.log(`    ✅ Exact match found!`);
              return true;
            }
            
            // Check base name match (e.g., "kottayam branch" vs "kottayam")
            const wsBase = wsWarehouse.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
            const targetBase = targetWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
            
            if (wsBase && targetBase && wsBase === targetBase) {
              console.log(`    ✅ Base name match found! "${wsBase}" === "${targetBase}"`);
              return true;
            }
            
            return false;
          });
          
          console.log(`  Item "${item.name}": hasWarehouseEntry=${hasWarehouseEntry}`);
          
          return hasWarehouseEntry;
        });
        
        // Also filter warehouseStocks within each item to only show the target warehouse
        groupObj.items = groupObj.items.map(item => {
          if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
            const filteredStocks = item.warehouseStocks.filter(ws => {
              const wsWarehouseRaw = (ws.warehouse || "").toString().trim();
              const normalizedWs = normalizeWarehouseName(wsWarehouseRaw);
              const wsWarehouse = (normalizedWs || wsWarehouseRaw).toLowerCase().trim();
              
              // Skip main warehouse entries for branch users
              if (wsWarehouse === "warehouse" || wsWarehouse === "warehouse branch") return false;
              if (wsWarehouse === targetWarehouseLower) return true;
              
              const wsBase = wsWarehouse.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
              const targetBase = targetWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
              return wsBase && targetBase && wsBase === targetBase;
            });
            
            item.warehouseStocks = filteredStocks;
            
            // Update item stock to reflect only the filtered warehouse stock
            const totalStock = filteredStocks.reduce((sum, ws) => {
              return sum + (parseFloat(ws.stockOnHand) || 0);
            }, 0);
            item.stock = totalStock;
            
            console.log(`  Item "${item.name}" filtered stocks: ${filteredStocks.length}, total stock: ${totalStock}`);
          }
          return item;
        });
        
        console.log(`Filtered items: ${originalCount} -> ${groupObj.items.length}`);
        
        // Debug: Log remaining items
        groupObj.items.forEach((item, idx) => {
          console.log(`  Remaining item ${idx}: ${item.name}, stock: ${item.stock}`);
        });
      }
      
      console.log(`==========================================\n`);
    } else {
      console.log(`NOT filtering - warehouse: "${warehouse}", filterByWarehouse: "${filterByWarehouse}"`);
    }

    return res.json(groupObj);
  } catch (error) {
    console.error("Error fetching item group:", error);
    return res.status(500).json({ message: "Failed to fetch item group." });
  }
};

export const updateItemGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const changedBy = req.body.changedBy || req.headers['x-user-name'] || "System";

    if (!id) {
      return res.status(400).json({ message: "Item group ID is required." });
    }

    // Get old data before update
    const oldItemGroup = await ItemGroup.findById(id);
    if (!oldItemGroup) {
      return res.status(404).json({ message: "Item group not found." });
    }

    // Get user's warehouse from request
    const userWarehouse = req.body.userWarehouse || req.headers['x-user-warehouse'] || null;
    const userLocName = req.body.userLocName || req.headers['x-user-locname'] || null;
    
    // Determine warehouse - use provided warehouse or map from locName
    let targetWarehouse = userWarehouse;
    if (!targetWarehouse && userLocName) {
      targetWarehouse = mapLocNameToWarehouse(userLocName);
    }
    // Default to "Warehouse" if still not set
    if (!targetWarehouse) {
      targetWarehouse = "Warehouse";
    }

    // Check for duplicate group SKU if provided (excluding current group)
    if (req.body.sku && req.body.sku.trim()) {
      const groupSku = req.body.sku.toString().trim().toUpperCase();
      const oldGroupSku = oldItemGroup.sku?.toString().trim().toUpperCase();
      
      // Only check if SKU is being changed
      if (groupSku !== oldGroupSku) {
        // Check in other ItemGroups
        const existingGroup = await ItemGroup.findOne({ 
          sku: groupSku,
          _id: { $ne: id }
        });
        if (existingGroup) {
          return res.status(409).json({ 
            message: `Item group SKU "${groupSku}" already exists. Please use a different SKU.` 
          });
        }
        
        // Check in ShoeItem collection
        const existingShoeItem = await ShoeItem.findOne({ sku: groupSku });
        if (existingShoeItem) {
          return res.status(409).json({ 
            message: `SKU "${groupSku}" already exists in standalone items. Please use a different SKU.` 
          });
        }
      }
    }

    // Check for duplicate SKUs in items (excluding current group's existing items)
    if (req.body.items && Array.isArray(req.body.items)) {
      const skusToCheck = req.body.items
        .map(item => item.sku?.toString().trim().toUpperCase())
        .filter(sku => sku && sku !== "");

      if (skusToCheck.length > 0) {
        // Check for duplicates within the same group
        const uniqueSkus = new Set(skusToCheck);
        if (uniqueSkus.size !== skusToCheck.length) {
          const duplicates = skusToCheck.filter((sku, index) => skusToCheck.indexOf(sku) !== index);
          return res.status(409).json({ 
            message: `Duplicate SKUs found within the group: ${[...new Set(duplicates)].join(", ")}. Each item must have a unique SKU.` 
          });
        }

        // Get existing item SKUs from the current group (to exclude from check)
        const existingItemSkus = (oldItemGroup.items || [])
          .map(item => item.sku?.toString().trim().toUpperCase())
          .filter(sku => sku && sku !== "");

        // Check for duplicates in other ItemGroup items
        const existingGroups = await ItemGroup.find({ 
          _id: { $ne: id },
          "items.sku": { $in: skusToCheck }
        });
        
        const existingSkusInGroups = [];
        existingGroups.forEach(group => {
          if (group.items && Array.isArray(group.items)) {
            group.items.forEach(item => {
              const itemSku = item.sku?.toString().trim().toUpperCase();
              if (itemSku && skusToCheck.includes(itemSku) && !existingItemSkus.includes(itemSku)) {
                existingSkusInGroups.push(itemSku);
              }
            });
          }
        });

        // Check for duplicates in ShoeItem collection
        const existingShoeItems = await ShoeItem.find({ 
          sku: { $in: skusToCheck }
        });
        const existingSkusInShoeItems = existingShoeItems
          .map(item => item.sku?.toString().trim().toUpperCase())
          .filter(sku => sku && sku !== "" && !existingItemSkus.includes(sku));

        // Combine all existing SKUs
        const allExistingSkus = [...new Set([...existingSkusInGroups, ...existingSkusInShoeItems])];
        
        if (allExistingSkus.length > 0) {
          return res.status(409).json({ 
            message: `The following SKUs already exist in the system: ${allExistingSkus.join(", ")}. Please use different SKUs.` 
          });
        }
      }
    }

    // Initialize warehouseStocks for items that don't have them
    if (req.body.items && Array.isArray(req.body.items)) {
      req.body.items = req.body.items.map(item => {
        // If item already has warehouseStocks, use them; otherwise initialize
        if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks) || item.warehouseStocks.length === 0) {
          const initialStock = item.stock || item.openingStock || 0;
          item.warehouseStocks = [{
            warehouse: targetWarehouse,
            openingStock: initialStock,
            openingStockValue: 0,
            stockOnHand: initialStock,
            committedStock: 0,
            availableForSale: initialStock,
            physicalOpeningStock: initialStock,
            physicalStockOnHand: initialStock,
            physicalCommittedStock: 0,
            physicalAvailableForSale: initialStock,
          }];
        } else {
          // Ensure at least one entry has the user's warehouse
          const hasUserWarehouse = item.warehouseStocks.some(ws => {
            const wsWarehouse = (ws.warehouse || "").toString().toLowerCase().trim();
            const targetWarehouseLower = targetWarehouse.toLowerCase().trim();
            return wsWarehouse === targetWarehouseLower ||
                   wsWarehouse.includes(targetWarehouseLower) ||
                   targetWarehouseLower.includes(wsWarehouse);
          });
          
          if (!hasUserWarehouse) {
            // Add user's warehouse entry
            const initialStock = item.stock || item.openingStock || 0;
            item.warehouseStocks.push({
              warehouse: targetWarehouse,
              openingStock: initialStock,
              openingStockValue: 0,
              stockOnHand: initialStock,
              committedStock: 0,
              availableForSale: initialStock,
              physicalOpeningStock: initialStock,
              physicalStockOnHand: initialStock,
              physicalCommittedStock: 0,
              physicalAvailableForSale: initialStock,
            });
          }
        }
        return item;
      });
    }

    // Update the item group
    const itemGroup = await ItemGroup.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!itemGroup) {
      return res.status(404).json({ message: "Item group not found." });
    }

    // Track history for item changes
    const itemId = req.body.itemId;
    
    if (req.body.items && Array.isArray(req.body.items) && itemId) {
      const oldItems = oldItemGroup.items || [];
      const newItems = req.body.items;
      
      // Find which item was updated
      const oldItem = oldItems.find(i => {
        const itemIdStr = (i._id?.toString() || i.id || "").toString();
        return itemIdStr === itemId.toString();
      });
      
      const newItem = newItems.find(i => {
        const itemIdStr = (i._id?.toString() || i.id || "").toString();
        return itemIdStr === itemId.toString();
      });
      
      if (oldItem && newItem) {
        // Check if it's a stock update
        const oldStocks = (oldItem.warehouseStocks || []).sort((a, b) => (a.warehouse || "").localeCompare(b.warehouse || ""));
        const newStocks = (newItem.warehouseStocks || []).sort((a, b) => (a.warehouse || "").localeCompare(b.warehouse || ""));
        const oldStocksStr = JSON.stringify(oldStocks);
        const newStocksStr = JSON.stringify(newStocks);
        const isStockUpdate = oldStocksStr !== newStocksStr ||
                              oldItem.stock !== newItem.stock;
        
        const changeType = isStockUpdate ? "STOCK_UPDATE" : "UPDATE";
        const details = generateChangeDetails(oldItem, newItem, changeType);
        
        // Create history entry
        try {
          await ItemHistory.create({
            itemGroupId: id,
            itemId: itemId.toString(),
            changedBy: changedBy,
            changeType: changeType,
            details: details,
            oldData: oldItem,
            newData: newItem,
          });
          console.log(`History created for item ${itemId}: ${details}`);
        } catch (historyError) {
          console.error("Error creating history:", historyError);
        }
      } else if (newItem && !oldItem) {
        // New item added - check if it's from a standalone item (has originalStandaloneItemId)
        const isFromStandalone = req.body.originalStandaloneItemId;
        const details = isFromStandalone 
          ? `moved to group "${itemGroup.name}"` 
          : `Item "${newItem.name || 'New Item'}" created`;
        
        try {
          await ItemHistory.create({
            itemGroupId: id,
            itemId: itemId.toString(),
            changedBy: changedBy,
            changeType: "CREATE",
            details: details,
            oldData: null,
            newData: newItem,
          });
        } catch (historyError) {
          console.error("Error creating history:", historyError);
        }
      } else {
        // Item not found, create general update
        console.log(`Item ${itemId} not found in old or new items, creating general update`);
        try {
          await ItemHistory.create({
            itemGroupId: id,
            itemId: itemId.toString(),
            changedBy: changedBy,
            changeType: "UPDATE",
            details: "updated",
            oldData: oldItemGroup.toObject(),
            newData: itemGroup.toObject(),
          });
        } catch (historyError) {
          console.error("Error creating history:", historyError);
        }
      }
    } else {
      // General item group update (no itemId or no items array)
      try {
        await ItemHistory.create({
          itemGroupId: id,
          itemId: itemId ? itemId.toString() : "group",
          changedBy: changedBy,
          changeType: "UPDATE",
          details: "updated",
          oldData: oldItemGroup.toObject(),
          newData: itemGroup.toObject(),
        });
      } catch (historyError) {
        console.error("Error creating history:", historyError);
      }
    }

    return res.json(itemGroup);
  } catch (error) {
    console.error("Error updating item group:", error);
    return res.status(500).json({ message: "Failed to update item group." });
  }
};

// Get item history
export const getItemHistory = async (req, res) => {
  try {
    const { id, itemId } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Item group ID is required." });
    }

    const query = { itemGroupId: id };
    if (itemId && itemId !== "group") {
      // Try to match itemId as both string and ObjectId
      query.itemId = itemId.toString();
    }

    console.log(`Fetching history for itemGroupId: ${id}, itemId: ${itemId}, query:`, query);
    const history = await ItemHistory.find(query)
      .sort({ changedAt: -1 })
      .limit(100);

    console.log(`Found ${history.length} history entries`);
    return res.json(history);
  } catch (error) {
    console.error("Error fetching item history:", error);
    return res.status(500).json({ message: "Failed to fetch item history." });
  }
};

export const deleteItemGroup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Item group ID is required." });
    }

    const itemGroup = await ItemGroup.findByIdAndDelete(id);
    if (!itemGroup) {
      return res.status(404).json({ message: "Item group not found." });
    }

    return res.json({ message: "Item group deleted successfully." });
  } catch (error) {
    console.error("Error deleting item group:", error);
    return res.status(500).json({ message: "Failed to delete item group." });
  }
};

