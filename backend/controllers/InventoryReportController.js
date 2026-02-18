import ShoeItem from "../model/ShoeItem.js";
import ItemGroup from "../model/ItemGroup.js";

// Warehouse name normalization mapping (same as ShoeItemController)
const WAREHOUSE_NAME_MAPPING = {
  "Grooms Trivandum": "Grooms Trivandrum",
  "Grooms Trivandrum": "Grooms Trivandrum",
  "SG-Trivandrum": "Grooms Trivandrum",
  "G.Palakkad": "Palakkad Branch",
  "G.Palakkad ": "Palakkad Branch",
  "GPalakkad": "Palakkad Branch",
  "Palakkad Branch": "Palakkad Branch",
  "Warehouse": "Warehouse",
  "warehouse": "Warehouse",
  "WAREHOUSE": "Warehouse",
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
  "G.Edappally": "Edapally Branch",
  "G-Edappally": "Edapally Branch",
  "GEdappally": "Edapally Branch",
  "Edapally Branch": "Edapally Branch",
  "G.Kalpetta": "Kalpetta Branch",
  "GKalpetta": "Kalpetta Branch",
  "Kalpetta Branch": "Kalpetta Branch",
  "G.Kottakkal": "Kottakkal Branch",
  "GKottakkal": "Kottakkal Branch",
  "Kottakkal Branch": "Kottakkal Branch",
  "Z.Kottakkal": "Kottakkal Branch",
  "G.Perinthalmanna": "Perinthalmanna Branch",
  "GPerinthalmanna": "Perinthalmanna Branch",
  "Perinthalmanna Branch": "Perinthalmanna Branch",
  "Z.Perinthalmanna": "Perinthalmanna Branch",
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
  "G.Kottayam Branch": "Kottayam Branch", // Map the duplicate to the correct name
  "G.MG Road": "MG Road Branch",
  "G.Mg Road": "MG Road Branch",
  "GMG Road": "MG Road Branch",
  "GMg Road": "MG Road Branch",
  "MG Road": "MG Road Branch",
  "SuitorGuy MG Road": "MG Road Branch", // Normalize the old name to the correct one
  // Also include "SuitorGuy MG Road" as a valid variation since items might be stored with this name
  "MG Road Branch": "MG Road Branch",
  "HEAD OFFICE01": "Head Office",
  "Head Office": "Head Office",
  "Z-Edapally1": "Warehouse",
  "Z- Edappal": "Warehouse",
  "Production": "Warehouse",
  "Office": "Warehouse",
  "G.Vadakara": "Vadakara Branch", // Fixed: was incorrectly mapped to Warehouse
  "GVadakara": "Vadakara Branch",
  "Vadakara Branch": "Vadakara Branch",
};

const normalizeWarehouseName = (warehouseName) => {
  if (!warehouseName) return null;
  const trimmed = warehouseName.toString().trim();
  if (WAREHOUSE_NAME_MAPPING[trimmed]) {
    return WAREHOUSE_NAME_MAPPING[trimmed];
  }
  const lowerName = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(WAREHOUSE_NAME_MAPPING)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  return trimmed;
};

// Get all possible warehouse name variations for a given warehouse
const getWarehouseNameVariations = (warehouseName) => {
  if (!warehouseName) return [];
  const normalized = normalizeWarehouseName(warehouseName);
  const variations = [normalized, warehouseName];
  
  // Add all keys from mapping that map to the normalized name
  for (const [key, value] of Object.entries(WAREHOUSE_NAME_MAPPING)) {
    if (value === normalized && !variations.includes(key)) {
      variations.push(key);
    }
  }
  
  // Also add case-insensitive variations
  const lowerNormalized = normalized.toLowerCase();
  for (const [key, value] of Object.entries(WAREHOUSE_NAME_MAPPING)) {
    if (value.toLowerCase() === lowerNormalized && !variations.includes(key)) {
      variations.push(key);
    }
  }
  
  // Special handling for MG Road - include "SuitorGuy MG Road" as it's used in other controllers
  if (normalized === "MG Road Branch" || warehouseName.toLowerCase().includes("mg road")) {
    if (!variations.includes("SuitorGuy MG Road")) {
      variations.push("SuitorGuy MG Road");
    }
    if (!variations.includes("MG Road")) {
      variations.push("MG Road");
    }
    if (!variations.includes("G.MG Road")) {
      variations.push("G.MG Road");
    }
    if (!variations.includes("G.Mg Road")) {
      variations.push("G.Mg Road");
    }
  }
  
  return [...new Set(variations)]; // Remove duplicates
};

// Get Inventory Summary Report
export const getInventorySummary = async (req, res) => {
  try {
    const { locCode, warehouse } = req.query;
    const userId = req.query.userId || req.body.userId;

    // Check if user is admin
    const adminEmails = ['officerootments@gmail.com'];
    const isAdminEmail = userId && adminEmails.some(email => userId.toLowerCase() === email.toLowerCase());
    const isAdmin = isAdminEmail || (locCode && (locCode === '858' || locCode === '103'));
    const isMainAdmin = isAdmin;

    let query = {};

    // For store users (non-admin), filter by their locCode
    if (!isAdmin && locCode && locCode !== '858' && locCode !== '103') {
      query.$or = [
        { warehouse: locCode },
        { branch: locCode },
        { locCode: locCode }
      ];
    }
    // For admin users, filter by selected warehouse if specified and not "All Stores"
    else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
      query.$or = [
        { warehouse: warehouse },
        { branch: warehouse },
        { locCode: warehouse }
      ];
    }

    // For store users, filter items that have stock in their warehouse
    // For admin users viewing all stores, get all items
    let items;
    
    // Normalize warehouse name
    const normalizedWarehouse = warehouse ? normalizeWarehouseName(warehouse) : null;
    const warehouseVariations = warehouse ? getWarehouseNameVariations(warehouse) : [];
    
    console.log("🔍 Original warehouse:", warehouse);
    console.log("🔍 Normalized warehouse:", normalizedWarehouse);
    console.log("🔍 Warehouse variations:", warehouseVariations);
    console.log("🔍 User locCode:", locCode);
    console.log("🔍 Is Admin:", isAdmin);
    console.log("🔍 Is Main Admin:", isMainAdmin);
    
    // Helper function to check if warehouse matches
    const warehouseMatches = (wsWarehouse) => {
      if (!wsWarehouse) return false;
      const wsWarehouseStr = wsWarehouse.toString().trim();
      const normalizedWs = normalizeWarehouseName(wsWarehouseStr);
      
      // Check if the warehouse matches any of the variations or the normalized name
      return warehouseVariations.includes(wsWarehouseStr) || 
             warehouseVariations.includes(normalizedWs) ||
             normalizedWs === normalizedWarehouse;
    };
    
    // Fetch standalone items - Use multiple strategies to find items
    let standaloneItems = [];
    if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
      // For store users, get ALL items first, then filter by warehouseStocks in memory
      // This ensures we only show items that have stock entries for their specific warehouse
      standaloneItems = await ShoeItem.find({});
      console.log(`📦 Fetched ALL ${standaloneItems.length} items for store user (will filter by warehouseStocks)`);
      
      // CRITICAL FIX: Filter to only include items that have warehouseStocks for this specific warehouse
      standaloneItems = standaloneItems.filter(item => {
        return (item.warehouseStocks || []).some(ws => {
          if (!ws || !ws.warehouse) return false;
          return warehouseMatches(ws.warehouse);
        });
      });
      console.log(`🔒 After filtering: ${standaloneItems.length} items have stock entries for this warehouse`);
    } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
      // For admin viewing specific warehouse, get ALL items first
      // We'll filter warehouseStocks in memory to show only selected warehouse stock
      standaloneItems = await ShoeItem.find({});
      console.log(`📦 Fetched ALL ${standaloneItems.length} items (will filter warehouseStocks in memory)`);
      
      // CRITICAL FIX: Filter to only include items that have warehouseStocks for the selected warehouse
      const beforeFilter = standaloneItems.length;
      standaloneItems = standaloneItems.filter(item => {
        const itemWarehouses = (item.warehouseStocks || []).map(ws => ws.warehouse).join(", ");
        const hasMatch = (item.warehouseStocks || []).some(ws => {
          if (!ws || !ws.warehouse) return false;
          const matches = warehouseMatches(ws.warehouse);
          return matches;
        });
        
        // Debug ALL items to see what's happening
        if (!hasMatch) {
          console.log(`      ❌ Filtering out "${item.itemName || item.name}" - warehouses: [${itemWarehouses}]`);
        } else {
          console.log(`      ✅ Keeping "${item.itemName || item.name}" - warehouses: [${itemWarehouses}]`);
        }
        
        return hasMatch;
      });
      console.log(`🔒 After filtering: ${standaloneItems.length} items have stock entries for ${warehouse} (was ${beforeFilter})`);
    } else {
      // For "All Stores" view, get all items
      standaloneItems = await ShoeItem.find({});
    }
    
    console.log(`📦 Found ${standaloneItems.length} standalone items`);
    
    // Debug: Log warehouse names found in the first 5 items
    if (standaloneItems.length > 0 && standaloneItems.length <= 10) {
      standaloneItems.forEach((item, idx) => {
        const warehouses = item.warehouseStocks?.map(ws => ws.warehouse).join(", ") || "none";
        console.log(`   Item ${idx + 1}: "${item.itemName || item.name}" - warehouses: [${warehouses}]`);
      });
    }
    
    // Fetch items from item groups
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    let groupItems = [];
    let groupItemsChecked = 0;
    let groupItemsIncluded = 0;
    
    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach((item, index) => {
          groupItemsChecked++;
          let shouldInclude = true;
          
          if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
            const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
              item.warehouseStocks.some(ws => {
                if (!ws || !ws.warehouse) return false;
                return warehouseMatches(ws.warehouse);
              });
            shouldInclude = hasStock;
            
            // Debug logging for store users
            if (groupItemsChecked <= 3) {
              console.log(`   🔍 Group item "${item.name}": hasStock=${hasStock}, warehouses=[${(item.warehouseStocks || []).map(ws => ws.warehouse).join(", ")}]`);
            }
          } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
            const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
              item.warehouseStocks.some(ws => {
                if (!ws || !ws.warehouse) return false;
                const matches = warehouseMatches(ws.warehouse);
                return matches;
              });
            shouldInclude = hasStock;
            
            // Debug logging for admin viewing specific warehouse
            if (groupItemsChecked <= 3) {
              const itemWarehouses = (item.warehouseStocks || []).map(ws => ws.warehouse).join(", ");
              console.log(`   🔍 Group item "${item.name}": hasStock=${hasStock}, warehouses=[${itemWarehouses}]`);
            }
          }
          
          if (shouldInclude) {
            groupItemsIncluded++;
            const standaloneItem = {
              _id: item._id || `${group._id}_${index}`,
              itemName: item.name || "",
              sku: item.sku || "",
              costPrice: item.costPrice || 0,
              category: group.category || "",
              warehouseStocks: item.warehouseStocks || [],
              itemGroupId: group._id,
              itemGroupName: group.name,
              isFromGroup: true,
              createdAt: group.createdAt,
            };
            groupItems.push(standaloneItem);
          }
        });
      }
    });
    
    console.log(`📦 Found ${groupItems.length} items from groups (checked ${groupItemsChecked}, included ${groupItemsIncluded})`);
    
    items = [...standaloneItems.map(item => ({ ...item.toObject ? item.toObject() : item, isFromGroup: false })), ...groupItems];
    
    console.log(`📦 Total items after combining standalone and group items: ${items.length}`);
    
    const inventorySummary = items.map(item => {
      let totalStock = 0;
      let totalValue = 0;
      
      // Determine which warehouse stocks to count based on user role and selection
      let warehouseStocksToShow = item.warehouseStocks || [];
      
      // If a specific warehouse is selected (not "All Stores"), only count that warehouse's stock
      if (warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
        warehouseStocksToShow = (item.warehouseStocks || []).filter(ws => {
          if (!ws || !ws.warehouse) return false;
          return warehouseMatches(ws.warehouse);
        });
      } else if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
        // Store user - only show their warehouse stock
        warehouseStocksToShow = (item.warehouseStocks || []).filter(ws => {
          if (!ws || !ws.warehouse) return false;
          return warehouseMatches(ws.warehouse);
        });
      }

      if (warehouseStocksToShow && Array.isArray(warehouseStocksToShow)) {
        warehouseStocksToShow.forEach(ws => {
          const stock = parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
          const cost = parseFloat(item.costPrice) || 0;
          totalStock += stock;
          totalValue += stock * cost;
        });
      }

      return {
        itemId: item._id,
        itemName: item.itemName || item.name,
        sku: item.sku,
        category: item.category,
        cost: parseFloat(item.costPrice) || 0,
        totalStock,
        totalValue,
        warehouseStocks: warehouseStocksToShow,
        branch: item.branch || item.warehouse,
        _hasMatchingWarehouseStock: warehouseStocksToShow && warehouseStocksToShow.length > 0,
        // Include group information for sorting
        itemGroupId: item.itemGroupId || null,
        itemGroupName: item.itemGroupName || null,
        isFromGroup: item.isFromGroup || false
      };
    }).filter(item => {
      // For specific warehouse view, only include items that have warehouseStocks matching the warehouse
      // This ensures we only show items that actually have stock entries for MG Road
      if (warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
        // Only include items that have at least one matching warehouse stock entry for MG Road
        // (even if the stock is 0, as long as the entry exists)
        return item._hasMatchingWarehouseStock === true;
      }
      return true; // Include all items for "All Stores" view
    });

    const totalItems = inventorySummary.length;
    const totalStockValue = inventorySummary.reduce((sum, item) => sum + item.totalValue, 0);
    const totalQuantity = inventorySummary.reduce((sum, item) => sum + item.totalStock, 0);
    
    console.log(`📊 Final inventory summary: ${totalItems} items, ${totalQuantity} total quantity, ₹${totalStockValue} total value`);
    console.log(`📋 Item names: ${inventorySummary.map(i => i.itemName).join(", ")}`);

    // Sort items to keep group items together
    // 1. Items from the same group are grouped together (by itemGroupId)
    // 2. Within each group, sort by totalValue (descending)
    // 3. Standalone items come after grouped items, sorted by totalValue (descending)
    const sortedItems = inventorySummary.sort((a, b) => {
      const aGroupId = a.itemGroupId || null;
      const bGroupId = b.itemGroupId || null;
      
      // If both items are from groups
      if (aGroupId && bGroupId) {
        // If same group, sort by totalValue within the group
        if (aGroupId === bGroupId) {
          return b.totalValue - a.totalValue;
        }
        // Different groups - sort by group name first, then totalValue
        const aGroupName = a.itemGroupName || '';
        const bGroupName = b.itemGroupName || '';
        if (aGroupName !== bGroupName) {
          return aGroupName.localeCompare(bGroupName);
        }
        return b.totalValue - a.totalValue;
      }
      
      // If only one is from a group, group items come first
      if (aGroupId && !bGroupId) return -1;
      if (!aGroupId && bGroupId) return 1;
      
      // Both are standalone items - sort by totalValue
      return b.totalValue - a.totalValue;
    });

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalItems,
          totalQuantity,
          totalStockValue
        },
        items: sortedItems
      }
    });
  } catch (error) {
    console.error("Get inventory summary error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Stock Summary Report
export const getStockSummary = async (req, res) => {
  try {
    const { locCode, warehouse } = req.query;
    const userId = req.query.userId || req.body.userId;

    // Check if user is admin
    const adminEmails = ['officerootments@gmail.com'];
    const isAdminEmail = userId && adminEmails.some(email => userId.toLowerCase() === email.toLowerCase());
    const isAdmin = isAdminEmail || (locCode && (locCode === '858' || locCode === '103'));
    const isMainAdmin = isAdmin;

    // Normalize warehouse name
    const normalizedWarehouse = warehouse ? normalizeWarehouseName(warehouse) : null;
    const warehouseVariations = warehouse ? getWarehouseNameVariations(warehouse) : [];
    
    // Helper function to check if warehouse matches
    const warehouseMatches = (wsWarehouse) => {
      if (!wsWarehouse) return false;
      const wsWarehouseStr = wsWarehouse.toString().trim();
      const normalizedWs = normalizeWarehouseName(wsWarehouseStr);
      
      // Check if the warehouse matches any of the variations or the normalized name
      return warehouseVariations.includes(wsWarehouseStr) || 
             warehouseVariations.includes(normalizedWs) ||
             normalizedWs === normalizedWarehouse;
    };
    
    // Fetch standalone items
    let standaloneItems = [];
    if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
      if (normalizedWarehouse && warehouseVariations.length > 0) {
        standaloneItems = await ShoeItem.find({
          "warehouseStocks.warehouse": { $in: warehouseVariations }
        });
      } else {
        standaloneItems = await ShoeItem.find({
          "warehouseStocks.warehouse": normalizedWarehouse
        });
      }
    } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
      // For admin viewing specific warehouse, get ALL items first
      // We'll filter warehouseStocks in memory to show only MG Road stock
      // This ensures we catch items even if they don't have warehouseStocks entries yet
      standaloneItems = await ShoeItem.find({});
      console.log(`📦 Fetched ALL ${standaloneItems.length} items (will filter warehouseStocks in memory)`);
    } else {
      // For "All Stores" view, get all items
      standaloneItems = await ShoeItem.find({});
    }
    
    // Fetch items from item groups
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    let groupItems = [];
    let groupItemsChecked = 0;
    let groupItemsIncluded = 0;
    
    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach((item, index) => {
          groupItemsChecked++;
          let shouldInclude = true;
          
          if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
            const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
              item.warehouseStocks.some(ws => {
                if (!ws || !ws.warehouse) return false;
                const wsWarehouse = ws.warehouse.toString().trim();
                const normalizedWs = normalizeWarehouseName(wsWarehouse);
                return warehouseMatches(wsWarehouse);
              });
            shouldInclude = hasStock;
          } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
            const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
              item.warehouseStocks.some(ws => {
                if (!ws || !ws.warehouse) return false;
                return warehouseMatches(ws.warehouse);
              });
            shouldInclude = hasStock;
          }
          
          if (shouldInclude) {
            groupItemsIncluded++;
            const standaloneItem = {
              _id: item._id || `${group._id}_${index}`,
              itemName: item.name || "",
              sku: item.sku || "",
              costPrice: item.costPrice || 0,
              category: group.category || "",
              warehouseStocks: item.warehouseStocks || [],
              itemGroupId: group._id,
              itemGroupName: group.name,
              isFromGroup: true,
              createdAt: group.createdAt,
            };
            groupItems.push(standaloneItem);
          }
        });
      }
    });
    
    console.log(`📦 Found ${groupItems.length} items from groups (checked ${groupItemsChecked}, included ${groupItemsIncluded})`);
    
    const items = [...standaloneItems.map(item => ({ ...item.toObject ? item.toObject() : item, isFromGroup: false })), ...groupItems];

    // Define all stores that should appear in the report
    const allStoresList = [
      "Warehouse",
      "Grooms Trivandrum",
      "Palakkad Branch",
      "Calicut",
      "Manjery Branch",
      "Kannur Branch",
      "Edappal Branch",
      "Edapally Branch",
      "Kalpetta Branch",
      "Kottakkal Branch",
      "Perinthalmanna Branch",
      "Chavakkad Branch",
      "Thrissur Branch",
      "Perumbavoor Branch",
      "Kottayam Branch",
      "MG Road Branch",
      "Vadakara Branch",
      "Head Office"
    ];

    // If a specific warehouse is selected, only show that one
    const storesToShow = (warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores")
      ? [normalizedWarehouse]
      : allStoresList;

    // Initialize warehouseStockMap with selected stores at 0
    const warehouseStockMap = {};
    storesToShow.forEach(storeName => {
      warehouseStockMap[storeName] = {
        warehouse: storeName,
        totalQuantity: 0,
        totalValue: 0,
        itemCount: 0
      };
    });

    const restrictToWarehouse = (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103')
      ? normalizedWarehouse
      : null;

    items.forEach(item => {
      if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
        item.warehouseStocks.forEach(ws => {
          if (restrictToWarehouse && ws.warehouse !== restrictToWarehouse) return;
          
          // Normalize the warehouse name from the item
          const normalizedWsName = normalizeWarehouseName(ws.warehouse) || ws.warehouse || "Unknown";
          
          // If a specific warehouse is selected, only count stock for that warehouse
          if (warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
            if (!warehouseMatches(ws.warehouse)) return;
          }
          
          const stock = parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
          const cost = parseFloat(item.costPrice) || 0;

          // Only add to map if it's in our predefined list
          if (warehouseStockMap[normalizedWsName]) {
            warehouseStockMap[normalizedWsName].totalQuantity += stock;
            warehouseStockMap[normalizedWsName].totalValue += stock * cost;
            warehouseStockMap[normalizedWsName].itemCount++;
          }
        });
      }
    });

    const stockSummary = Object.values(warehouseStockMap);
    const grandTotal = stockSummary.reduce((sum, ws) => sum + ws.totalValue, 0);
    const grandQuantity = stockSummary.reduce((sum, ws) => sum + ws.totalQuantity, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalWarehouses: stockSummary.length,
          grandTotalQuantity: grandQuantity,
          grandTotalValue: grandTotal
        },
        warehouses: stockSummary.sort((a, b) => b.totalValue - a.totalValue)
      }
    });
  } catch (error) {
    console.error("Get stock summary error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Inventory Valuation Report
export const getInventoryValuation = async (req, res) => {
  try {
    const { locCode, warehouse } = req.query;
    const userId = req.query.userId || req.body.userId;

    // Check if user is admin
    const adminEmails = ['officerootments@gmail.com'];
    const isAdminEmail = userId && adminEmails.some(email => userId.toLowerCase() === email.toLowerCase());
    const isAdmin = isAdminEmail || (locCode && (locCode === '858' || locCode === '103'));
    const isMainAdmin = isAdmin;

    // Normalize warehouse name
    const normalizedWarehouse = warehouse ? normalizeWarehouseName(warehouse) : null;
    
    // Fetch standalone items
    let standaloneItems = [];
    if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
      standaloneItems = await ShoeItem.find({
        "warehouseStocks.warehouse": normalizedWarehouse
      });
    } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
      standaloneItems = await ShoeItem.find({
        "warehouseStocks.warehouse": normalizedWarehouse
      });
    } else {
      standaloneItems = await ShoeItem.find({});
    }
    
    // Fetch items from item groups
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    let groupItems = [];
    
    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach((item, index) => {
          let shouldInclude = true;
          
          if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
            const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
              item.warehouseStocks.some(ws => ws.warehouse === normalizedWarehouse);
            shouldInclude = hasStock;
          } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
            const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
              item.warehouseStocks.some(ws => ws.warehouse === normalizedWarehouse);
            shouldInclude = hasStock;
          }
          
          if (shouldInclude) {
            const standaloneItem = {
              _id: item._id || `${group._id}_${index}`,
              itemName: item.name || "",
              sku: item.sku || "",
              costPrice: item.costPrice || 0,
              category: group.category || "",
              warehouseStocks: item.warehouseStocks || [],
              itemGroupId: group._id,
              itemGroupName: group.name,
              isFromGroup: true,
              createdAt: group.createdAt,
            };
            groupItems.push(standaloneItem);
          }
        });
      }
    });
    
    const items = [...standaloneItems.map(item => ({ ...item.toObject ? item.toObject() : item, isFromGroup: false })), ...groupItems];

    const valuationByCategory = {};
    let totalValuation = 0;

    items.forEach(item => {
      const category = item.category || "Uncategorized";
      let itemValue = 0;

      if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
        item.warehouseStocks.forEach(ws => {
          if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103' && ws.warehouse !== normalizedWarehouse) return;
          const stock = parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
          const cost = parseFloat(item.costPrice) || 0;
          itemValue += stock * cost;
        });
      }

      if (!valuationByCategory[category]) {
        valuationByCategory[category] = {
          category,
          itemCount: 0,
          totalQuantity: 0,
          totalValue: 0
        };
      }

      valuationByCategory[category].itemCount++;
      valuationByCategory[category].totalValue += itemValue;

      if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
        item.warehouseStocks.forEach(ws => {
          if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103' && ws.warehouse !== normalizedWarehouse) return;
          valuationByCategory[category].totalQuantity += parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
        });
      }

      totalValuation += itemValue;
    });

    const valuationList = Object.values(valuationByCategory)
      .sort((a, b) => b.totalValue - a.totalValue);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCategories: valuationList.length,
          totalValuation,
          averageValuePerCategory: valuationList.length > 0 ? totalValuation / valuationList.length : 0
        },
        categories: valuationList
      }
    });
  } catch (error) {
    console.error("Get inventory valuation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Inventory Aging Report
export const getInventoryAging = async (req, res) => {
  try {
    const { locCode, warehouse } = req.query;
    const userId = req.query.userId || req.body.userId;

    // Check if user is admin
    const adminEmails = ['officerootments@gmail.com'];
    const isAdminEmail = userId && adminEmails.some(email => userId.toLowerCase() === email.toLowerCase());
    const isAdmin = isAdminEmail || (locCode && (locCode === '858' || locCode === '103'));
    const isMainAdmin = isAdmin;

    // Normalize warehouse name
    const normalizedWarehouse = warehouse ? normalizeWarehouseName(warehouse) : null;
    
    // Fetch standalone items
    let standaloneItems = [];
    if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
      standaloneItems = await ShoeItem.find({
        "warehouseStocks.warehouse": normalizedWarehouse
      });
    } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
      standaloneItems = await ShoeItem.find({
        "warehouseStocks.warehouse": normalizedWarehouse
      });
    } else {
      standaloneItems = await ShoeItem.find({});
    }
    
    // Fetch items from item groups
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    let groupItems = [];
    
    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach((item, index) => {
          let shouldInclude = true;
          
          if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
            const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
              item.warehouseStocks.some(ws => ws.warehouse === normalizedWarehouse);
            shouldInclude = hasStock;
          } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
            const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
              item.warehouseStocks.some(ws => ws.warehouse === normalizedWarehouse);
            shouldInclude = hasStock;
          }
          
          if (shouldInclude) {
            const standaloneItem = {
              _id: item._id || `${group._id}_${index}`,
              itemName: item.name || "",
              sku: item.sku || "",
              costPrice: item.costPrice || 0,
              category: group.category || "",
              warehouseStocks: item.warehouseStocks || [],
              itemGroupId: group._id,
              itemGroupName: group.name,
              isFromGroup: true,
              createdAt: group.createdAt,
            };
            groupItems.push(standaloneItem);
          }
        });
      }
    });
    
    const items = [...standaloneItems.map(item => ({ ...item.toObject ? item.toObject() : item, isFromGroup: false })), ...groupItems];
    
    const now = new Date();

    const agingBuckets = {
      "0-30 days": { count: 0, value: 0, items: [] },
      "31-60 days": { count: 0, value: 0, items: [] },
      "61-90 days": { count: 0, value: 0, items: [] },
      "90+ days": { count: 0, value: 0, items: [] }
    };

    items.forEach(item => {
      const createdDate = new Date(item.createdAt || item.createdDate);
      const daysOld = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

      let bucket;
      if (daysOld <= 30) bucket = "0-30 days";
      else if (daysOld <= 60) bucket = "31-60 days";
      else if (daysOld <= 90) bucket = "61-90 days";
      else bucket = "90+ days";

      let itemValue = 0;
      let itemQuantity = 0;

      if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
        item.warehouseStocks.forEach(ws => {
          if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103' && ws.warehouse !== normalizedWarehouse) return;
          const stock = parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
          const cost = parseFloat(item.costPrice) || 0;
          itemValue += stock * cost;
          itemQuantity += stock;
        });
      }

      agingBuckets[bucket].count++;
      agingBuckets[bucket].value += itemValue;
      agingBuckets[bucket].items.push({
        itemName: item.itemName,
        sku: item.sku,
        quantity: itemQuantity,
        value: itemValue,
        daysOld
      });
    });

    const agingList = Object.entries(agingBuckets).map(([bucket, data]) => ({
      bucket,
      itemCount: data.count,
      totalValue: data.value,
      items: data.items
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalItems: items.length,
          totalValue: Object.values(agingBuckets).reduce((sum, b) => sum + b.value, 0)
        },
        aging: agingList
      }
    });
  } catch (error) {
    console.error("Get inventory aging error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
