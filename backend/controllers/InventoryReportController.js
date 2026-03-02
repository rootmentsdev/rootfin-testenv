import ShoeItem from "../model/ShoeItem.js";
import ItemGroup from "../model/ItemGroup.js";
import SalesInvoice from "../model/SalesInvoice.js";
import TransferOrder from "../model/TransferOrder.js";
import PurchaseReceive from "../model/PurchaseReceive.js";
// Import PostgreSQL InventoryAdjustment instead of MongoDB
import { InventoryAdjustment } from "../models/sequelize/index.js";
// Also import MongoDB model as fallback
import MongoInventoryAdjustment from "../model/InventoryAdjustment.js";
import { Op } from "sequelize";

// Helper function to get inventory adjustments from both PostgreSQL and MongoDB
const getInventoryAdjustments = async (whereConditions) => {
  try {
    // Try PostgreSQL first
    const pgAdjustments = await InventoryAdjustment.findAll({
      where: whereConditions
    });
    
    // Filter in JavaScript for JSONB array search if itemId is specified
    let relevantPgAdjustments = pgAdjustments;
    if (whereConditions.itemId) {
      relevantPgAdjustments = pgAdjustments.filter(ia => {
        return ia.items && ia.items.some(adjItem => 
          adjItem.itemId && adjItem.itemId.toString() === whereConditions.itemId.toString()
        );
      });
    }
    
    console.log(`📊 Found ${relevantPgAdjustments.length} adjustments in PostgreSQL`);
    
    // Also try MongoDB as fallback/additional source
    try {
      const mongoWhereConditions = { ...whereConditions };
      
      // Convert PostgreSQL conditions to MongoDB conditions
      if (whereConditions.createdAt) {
        mongoWhereConditions.createdAt = {};
        if (whereConditions.createdAt[Op.gte]) {
          mongoWhereConditions.createdAt.$gte = whereConditions.createdAt[Op.gte];
        }
        if (whereConditions.createdAt[Op.lte]) {
          mongoWhereConditions.createdAt.$lte = whereConditions.createdAt[Op.lte];
        }
      }
      
      // Handle itemId search for MongoDB
      if (whereConditions.itemId) {
        mongoWhereConditions['items.itemId'] = whereConditions.itemId;
        delete mongoWhereConditions.itemId; // Remove the converted field
      }
      
      const mongoAdjustments = await MongoInventoryAdjustment.find(mongoWhereConditions);
      console.log(`📊 Found ${mongoAdjustments.length} adjustments in MongoDB`);
      
      // Convert MongoDB documents to match PostgreSQL format
      const convertedMongoAdjustments = mongoAdjustments.map(doc => ({
        id: doc._id.toString(),
        items: doc.items || [],
        warehouse: doc.warehouse,
        status: doc.status,
        createdAt: doc.createdAt,
        adjustmentType: doc.adjustmentType,
        // Add other fields as needed
      }));
      
      // Combine results, avoiding duplicates by reference number
      const allAdjustments = [...relevantPgAdjustments];
      const pgReferenceNumbers = new Set(relevantPgAdjustments.map(adj => adj.referenceNumber));
      
      convertedMongoAdjustments.forEach(mongoAdj => {
        // Only add if not already present from PostgreSQL
        if (!pgReferenceNumbers.has(mongoAdj.referenceNumber)) {
          allAdjustments.push(mongoAdj);
        }
      });
      
      console.log(`📊 Total combined adjustments: ${allAdjustments.length}`);
      return allAdjustments;
      
    } catch (mongoError) {
      console.log(`⚠️  MongoDB query failed, using PostgreSQL results only:`, mongoError.message);
      return relevantPgAdjustments;
    }
    
  } catch (pgError) {
    console.log(`⚠️  PostgreSQL query failed, trying MongoDB only:`, pgError.message);
    
    // Fallback to MongoDB only
    try {
      const mongoWhereConditions = { ...whereConditions };
      
      // Convert PostgreSQL conditions to MongoDB conditions
      if (whereConditions.createdAt) {
        mongoWhereConditions.createdAt = {};
        if (whereConditions.createdAt[Op.gte]) {
          mongoWhereConditions.createdAt.$gte = whereConditions.createdAt[Op.gte];
        }
        if (whereConditions.createdAt[Op.lte]) {
          mongoWhereConditions.createdAt.$lte = whereConditions.createdAt[Op.lte];
        }
      }
      
      // Handle itemId search for MongoDB
      if (whereConditions.itemId) {
        mongoWhereConditions['items.itemId'] = whereConditions.itemId;
        delete mongoWhereConditions.itemId;
      }
      
      const mongoAdjustments = await MongoInventoryAdjustment.find(mongoWhereConditions);
      
      // Convert MongoDB documents to match PostgreSQL format
      return mongoAdjustments.map(doc => ({
        id: doc._id.toString(),
        items: doc.items || [],
        warehouse: doc.warehouse,
        status: doc.status,
        createdAt: doc.createdAt,
        adjustmentType: doc.adjustmentType,
      }));
      
    } catch (mongoError) {
      console.error(`❌ Both PostgreSQL and MongoDB queries failed:`, pgError.message, mongoError.message);
      return [];
    }
  }
};

// Helper function to get items from sales invoice (handles both 'items' and 'lineItems' structures)
const getInvoiceItems = (salesInvoice) => {
  if (salesInvoice.items && Array.isArray(salesInvoice.items)) {
    return salesInvoice.items;
  }
  if (salesInvoice.lineItems && Array.isArray(salesInvoice.lineItems)) {
    // Convert lineItems to items format
    return salesInvoice.lineItems.map(lineItem => ({
      itemId: lineItem.itemData?._id || lineItem.itemId,
      quantity: lineItem.quantity,
      rate: lineItem.rate,
      amount: lineItem.amount
    }));
  }
  return [];
};

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
  // Fix corrupted warehouse names
  "arehouse Branch": "Warehouse", // Missing 'W' at the beginning
  "-Kalpetta Branch": "Kalpetta Branch", // Remove leading dash
  "-Kannur Branch": "Kannur Branch", // Remove leading dash
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

    // Helper function to extract size number from item name or SKU
    const extractSizeFromName = (itemName, sku) => {
      // Try to extract size from SKU first (e.g., BLF6-1010 -> 6)
      if (sku) {
        const skuSizeMatch = sku.match(/([A-Z]+)(\d+)-/);
        if (skuSizeMatch) {
          return parseInt(skuSizeMatch[2]);
        }
      }
      
      // Try to extract size from item name (e.g., "Shoes Formal-1010 - Black/6" -> 6)
      if (itemName) {
        const nameSizeMatch = itemName.match(/\/(\d+)$/);
        if (nameSizeMatch) {
          return parseInt(nameSizeMatch[1]);
        }
      }
      
      return 999; // Default for items without recognizable size
    };

    // Sort items to keep group items together with proper size ordering
    // 1. Items from the same group are grouped together (by itemGroupId)
    // 2. Within each group, sort by item name alphabetically, then by size numerically
    // 3. Standalone items come after grouped items, sorted alphabetically then by size
    const sortedItems = inventorySummary.sort((a, b) => {
      const aGroupId = a.itemGroupId || null;
      const bGroupId = b.itemGroupId || null;
      
      // If both items are from groups
      if (aGroupId && bGroupId) {
        // If same group, sort by item name first, then by size
        if (aGroupId === bGroupId) {
          // First sort by base item name (without size)
          const aBaseName = (a.itemName || '').replace(/\/\d+$/, '').trim();
          const bBaseName = (b.itemName || '').replace(/\/\d+$/, '').trim();
          
          if (aBaseName !== bBaseName) {
            return aBaseName.localeCompare(bBaseName);
          }
          
          // Same base name, sort by size numerically
          const aSize = extractSizeFromName(a.itemName, a.sku);
          const bSize = extractSizeFromName(b.itemName, b.sku);
          return aSize - bSize;
        }
        
        // Different groups - sort by group name first
        const aGroupName = a.itemGroupName || '';
        const bGroupName = b.itemGroupName || '';
        if (aGroupName !== bGroupName) {
          return aGroupName.localeCompare(bGroupName);
        }
        
        // Same group name but different IDs, sort by item name then size
        const aBaseName = (a.itemName || '').replace(/\/\d+$/, '').trim();
        const bBaseName = (b.itemName || '').replace(/\/\d+$/, '').trim();
        
        if (aBaseName !== bBaseName) {
          return aBaseName.localeCompare(bBaseName);
        }
        
        const aSize = extractSizeFromName(a.itemName, a.sku);
        const bSize = extractSizeFromName(b.itemName, b.sku);
        return aSize - bSize;
      }
      
      // If only one is from a group, group items come first
      if (aGroupId && !bGroupId) return -1;
      if (!aGroupId && bGroupId) return 1;
      
      // Both are standalone items - sort by item name alphabetically, then by size
      const aBaseName = (a.itemName || '').replace(/\/\d+$/, '').trim();
      const bBaseName = (b.itemName || '').replace(/\/\d+$/, '').trim();
      
      if (aBaseName !== bBaseName) {
        return aBaseName.localeCompare(bBaseName);
      }
      
      const aSize = extractSizeFromName(a.itemName, a.sku);
      const bSize = extractSizeFromName(b.itemName, b.sku);
      return aSize - bSize;
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

// Get Opening Stock Report - Shows total opening stock added by month and store
export const getOpeningStockReport = async (req, res) => {
  try {
    const { locCode, warehouse, month } = req.query;
    
    console.log("📊 Opening Stock Report Request:", { locCode, warehouse, month });
    
    // Date range setup based on month
    let dateFilter = {};
    let displayPeriod = "All time";
    
    if (month) {
      // Month format: "2026-01" for January 2026
      const [year, monthNum] = month.split('-');
      if (year && monthNum && !isNaN(year) && !isNaN(monthNum)) {
        const startDate = new Date(year, monthNum - 1, 1); // First day of month
        const endDate = new Date(year, monthNum, 0); // Last day of month
        
        dateFilter = {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        };
        
        displayPeriod = new Date(year, monthNum - 1).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long' 
        });
      } else {
        console.warn("Invalid month format:", month);
        displayPeriod = "Invalid month format";
      }
    } else {
      // Default to last 12 months
      const twelveMonthsAgo = new Date();
      twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);
      dateFilter = {
        createdAt: { $gte: twelveMonthsAgo }
      };
      displayPeriod = "Last 12 months";
    }
    
    // Get standalone items with opening stock created in the date range
    const standaloneItems = await ShoeItem.find({
      'warehouseStocks.openingStock': { $gt: 0 },
      ...dateFilter
    }).select('itemName sku warehouseStocks createdAt');
    
    // Get item groups with opening stock created in the date range
    const itemGroups = await ItemGroup.find({
      'items.warehouseStocks.openingStock': { $gt: 0 },
      ...dateFilter
    }).select('groupName items.name items.warehouseStocks createdAt');
    
    // Process data by store (no monthly grouping)
    const storeData = {};
    const itemDetails = [];
    let totalOpeningStock = 0;
    let totalOpeningValue = 0;
    
    // Helper function to normalize warehouse names
    const normalizeWarehouseName = (name) => {
      if (!name) return "Warehouse";
      const normalized = WAREHOUSE_NAME_MAPPING[name.trim()] || name.trim();
      return normalized;
    };
    
    // Process standalone items
    standaloneItems.forEach(item => {
      item.warehouseStocks.forEach(stock => {
        if (stock.openingStock > 0) {
          const storeName = normalizeWarehouseName(stock.warehouse);
          const stockQty = stock.openingStock || 0;
          const stockValue = stock.openingStockValue || 0;
          
          // Store totals
          if (!storeData[storeName]) {
            storeData[storeName] = { totalStock: 0, totalValue: 0, itemCount: 0 };
          }
          storeData[storeName].totalStock += stockQty;
          storeData[storeName].totalValue += stockValue;
          storeData[storeName].itemCount += 1;
          
          // Item details
          itemDetails.push({
            itemName: item.itemName,
            sku: item.sku,
            store: storeName,
            openingStock: stockQty,
            openingValue: stockValue,
            createdAt: item.createdAt,
            type: 'standalone'
          });
          
          // Grand totals
          totalOpeningStock += stockQty;
          totalOpeningValue += stockValue;
        }
      });
    });
    
    // Process item groups
    itemGroups.forEach(group => {
      group.items.forEach(item => {
        if (item.warehouseStocks) {
          item.warehouseStocks.forEach(stock => {
            if (stock.openingStock > 0) {
              const storeName = normalizeWarehouseName(stock.warehouse);
              const stockQty = stock.openingStock || 0;
              const stockValue = stock.openingStockValue || 0;
              
              // Store totals
              if (!storeData[storeName]) {
                storeData[storeName] = { totalStock: 0, totalValue: 0, itemCount: 0 };
              }
              storeData[storeName].totalStock += stockQty;
              storeData[storeName].totalValue += stockValue;
              storeData[storeName].itemCount += 1;
              
              // Item details
              itemDetails.push({
                itemName: item.name,
                sku: item.sku,
                store: storeName,
                openingStock: stockQty,
                openingValue: stockValue,
                createdAt: group.createdAt,
                type: 'grouped',
                groupName: group.groupName
              });
              
              // Grand totals
              totalOpeningStock += stockQty;
              totalOpeningValue += stockValue;
            }
          });
        }
      });
    });
    
    // Convert to arrays and sort
    const storeReport = Object.entries(storeData).map(([store, data]) => ({
      store,
      totalStock: data.totalStock,
      totalValue: data.totalValue,
      itemCount: data.itemCount
    })).sort((a, b) => b.totalStock - a.totalStock);
    
    // Sort item details by creation date (newest first)
    itemDetails.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    
    // Filter by warehouse if specified
    let filteredStoreReport = storeReport;
    let filteredItemDetails = itemDetails;
    
    if (warehouse && warehouse !== 'all' && warehouse !== 'Warehouse') {
      const targetWarehouse = normalizeWarehouseName(warehouse);
      
      filteredStoreReport = storeReport.filter(store => store.store === targetWarehouse);
      filteredItemDetails = itemDetails.filter(item => item.store === targetWarehouse);
      
      // Recalculate totals for filtered data
      totalOpeningStock = filteredItemDetails.reduce((sum, item) => sum + item.openingStock, 0);
      totalOpeningValue = filteredItemDetails.reduce((sum, item) => sum + item.openingValue, 0);
    }
    
    console.log("📊 Opening Stock Report Generated:", {
      totalItems: filteredItemDetails.length,
      totalStores: filteredStoreReport.length,
      grandTotalStock: totalOpeningStock,
      grandTotalValue: totalOpeningValue,
      period: displayPeriod
    });
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalOpeningStock,
          totalOpeningValue,
          totalItems: filteredItemDetails.length,
          totalStores: filteredStoreReport.length,
          period: displayPeriod
        },
        storeReport: filteredStoreReport,
        itemDetails: filteredItemDetails
      }
    });
    
  } catch (error) {
    console.error("❌ Get opening stock report error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// Get Stock On Hand Report - Shows available stock for a specific date range
export const getStockOnHandReport = async (req, res) => {
  try {
    const { locCode, warehouse, startDate, endDate } = req.query;
    const userId = req.query.userId || req.body.userId;
    
    console.log("📊 Stock On Hand Report Request:", { locCode, warehouse, startDate, endDate });
    console.log("📅 Date objects:", { 
      startDateObj: startDate ? new Date(startDate) : null, 
      endDateObj: endDate ? new Date(endDate) : new Date(),
      currentDate: new Date()
    });
    
    // Check if user is admin
    const adminEmails = ['officerootments@gmail.com'];
    const isAdminEmail = userId && adminEmails.some(email => userId.toLowerCase() === email.toLowerCase());
    const isAdmin = isAdminEmail || (locCode && (locCode === '858' || locCode === '103'));
    const isMainAdmin = isAdmin;
    
    // Date range setup
    let endDateObj = new Date();
    let startDateObj = null;
    let displayPeriod = "Current Stock";
    
    if (endDate) {
      endDateObj = new Date(endDate);
      endDateObj.setHours(23, 59, 59, 999); // End of day
      displayPeriod = `Stock as of ${endDateObj.toLocaleDateString('en-IN')}`;
    }
    
    if (startDate) {
      startDateObj = new Date(startDate);
      startDateObj.setHours(0, 0, 0, 0); // Start of day
      displayPeriod = `Stock from ${startDateObj.toLocaleDateString('en-IN')} to ${endDateObj.toLocaleDateString('en-IN')}`;
    } else {
      // If no start date provided, use a date far in the past to capture all movements
      startDateObj = new Date('2020-01-01');
      startDateObj.setHours(0, 0, 0, 0);
    }
    
    // Normalize warehouse name
    const normalizedWarehouse = warehouse ? normalizeWarehouseName(warehouse) : null;
    const warehouseVariations = warehouse ? getWarehouseNameVariations(warehouse) : [];
    
    // Helper function to check if warehouse matches
    const warehouseMatches = (wsWarehouse) => {
      if (!wsWarehouse) return false;
      const wsWarehouseStr = wsWarehouse.toString().trim();
      const normalizedWs = normalizeWarehouseName(wsWarehouseStr);
      
      return warehouseVariations.includes(wsWarehouseStr) || 
             warehouseVariations.includes(normalizedWs) ||
             normalizedWs === normalizedWarehouse;
    };
    
    // Fetch standalone items
    let standaloneItems = [];
    if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
      standaloneItems = await ShoeItem.find({});
      standaloneItems = standaloneItems.filter(item => {
        return (item.warehouseStocks || []).some(ws => {
          if (!ws || !ws.warehouse) return false;
          return warehouseMatches(ws.warehouse);
        });
      });
    } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
      standaloneItems = await ShoeItem.find({});
      standaloneItems = standaloneItems.filter(item => {
        return (item.warehouseStocks || []).some(ws => {
          if (!ws || !ws.warehouse) return false;
          return warehouseMatches(ws.warehouse);
        });
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
              item.warehouseStocks.some(ws => {
                if (!ws || !ws.warehouse) return false;
                return warehouseMatches(ws.warehouse);
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
    
    console.log(`📊 Stock On Hand Report Debug:`, {
      startDate: startDateObj,
      endDate: endDateObj,
      warehouse: warehouse,
      normalizedWarehouse: normalizedWarehouse,
      totalItems: items.length,
      warehouseVariations: warehouseVariations
    });
    
    // Debug: Check what sales invoices exist in the period
    try {
      const allSalesInvoicesInPeriod = await SalesInvoice.find({
        createdAt: { 
          $gte: startDateObj,
          $lte: endDateObj 
        }
      }).select('_id warehouse createdAt items');
      
      console.log(`📋 Found ${allSalesInvoicesInPeriod.length} total sales invoices in period:`, 
        allSalesInvoicesInPeriod.map(si => ({
          id: si._id,
          warehouse: si.warehouse,
          date: si.createdAt,
          itemCount: (si.items?.length || si.lineItems?.length || 0)
        }))
      );
    } catch (error) {
      console.log("Warning: Could not fetch debug sales invoices:", error.message);
    }
    
    // Calculate stock on hand for each item
    const stockOnHandData = [];
    let totalStockOnHand = 0;
    let totalStockValue = 0;
    let totalStockIn = 0;
    let totalStockOut = 0;
    let totalOpeningStock = 0;
    
    for (const item of items) {
      console.log(`\n🔍 Processing item: ${item.itemName || item.name} (${item.sku})`);
      
      // Determine which warehouse stocks to process
      let warehouseStocksToProcess = item.warehouseStocks || [];
      
      if (warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
        warehouseStocksToProcess = warehouseStocksToProcess.filter(ws => {
          if (!ws || !ws.warehouse) return false;
          const matches = warehouseMatches(ws.warehouse);
          console.log(`  Warehouse: ${ws.warehouse} -> Matches: ${matches}`);
          return matches;
        });
      } else if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
        warehouseStocksToProcess = warehouseStocksToProcess.filter(ws => {
          if (!ws || !ws.warehouse) return false;
          const matches = warehouseMatches(ws.warehouse);
          console.log(`  Warehouse: ${ws.warehouse} -> Matches: ${matches}`);
          return matches;
        });
      }
      
      console.log(`  Warehouse stocks to process: ${warehouseStocksToProcess.length}`);
      
      for (const warehouseStock of warehouseStocksToProcess) {
        const warehouseName = normalizeWarehouseName(warehouseStock.warehouse);
        
        // Calculate opening stock (stock as of the day before start date)
        let openingStock = 0;
        
        // Always start with the item's original opening stock
        const originalOpeningStock = parseFloat(warehouseStock.openingStock) || 0;
        
        if (startDate) {
          // If start date is provided, calculate opening stock as of day before start date
          openingStock = originalOpeningStock;
          
          const dayBeforeStart = new Date(startDateObj);
          dayBeforeStart.setDate(dayBeforeStart.getDate() - 1);
          dayBeforeStart.setHours(23, 59, 59, 999); // End of previous day
          
          console.log(`🔍 Calculating opening stock for ${item.itemName} as of ${dayBeforeStart.toLocaleDateString()}`);
          console.log(`  Starting with original opening stock: ${originalOpeningStock}`);
          
          // Only calculate additional movements if the day before start date is after the item creation
          const itemCreationDate = new Date(item.createdAt || '2020-01-01');
          
          if (dayBeforeStart >= itemCreationDate) {
            // Add stock from purchase receives up to day before start date
            try {
              const purchaseReceivesBeforeStart = await PurchaseReceive.find({
                'items.itemId': item._id,
                status: 'received',
                toWarehouse: warehouseName,
                createdAt: { 
                  $gte: itemCreationDate,
                  $lte: dayBeforeStart 
                }
              });
              
              console.log(`📦 Found ${purchaseReceivesBeforeStart.length} purchase receives before start date`);
              
              purchaseReceivesBeforeStart.forEach(pr => {
                const prItem = pr.items.find(i => i.itemId.toString() === item._id.toString());
                if (prItem) {
                  const qty = parseFloat(prItem.receivedQuantity) || parseFloat(prItem.quantity) || parseFloat(prItem.received) || 0;
                  openingStock += qty;
                  console.log(`  ➕ Added ${qty} from purchase receive`);
                }
              });
            } catch (error) {
              console.log(`Warning: Could not calculate opening stock from purchases for item ${item.itemName}:`, error.message);
            }
            
            // Add stock from transfer orders received up to day before start date
            try {
              const transferOrdersReceivedBeforeStart = await TransferOrder.find({
                'items.itemId': item._id,
                status: 'completed',
                destinationWarehouse: warehouseName,
                createdAt: { 
                  $gte: itemCreationDate,
                  $lte: dayBeforeStart 
                }
              });
              
              console.log(`🔄 Found ${transferOrdersReceivedBeforeStart.length} transfer orders received before start date`);
              
              transferOrdersReceivedBeforeStart.forEach(to => {
                const toItem = to.items.find(i => i.itemId.toString() === item._id.toString());
                if (toItem) {
                  const qty = parseFloat(toItem.quantity) || 0;
                  openingStock += qty;
                  console.log(`  ➕ Added ${qty} from transfer in`);
                }
              });
            } catch (error) {
              console.log(`Warning: Could not calculate opening stock from transfers in for item ${item.itemName}:`, error.message);
            }
            
            // Subtract stock from transfer orders sent up to day before start date
            try {
              const transferOrdersSentBeforeStart = await TransferOrder.find({
                'items.itemId': item._id,
                status: 'completed',
                sourceWarehouse: warehouseName,
                createdAt: { 
                  $gte: itemCreationDate,
                  $lte: dayBeforeStart 
                }
              });
              
              console.log(`🔄 Found ${transferOrdersSentBeforeStart.length} transfer orders sent before start date`);
              
              transferOrdersSentBeforeStart.forEach(to => {
                const toItem = to.items.find(i => i.itemId.toString() === item._id.toString());
                if (toItem) {
                  const qty = parseFloat(toItem.quantity) || 0;
                  openingStock -= qty;
                  console.log(`  ➖ Subtracted ${qty} from transfer out`);
                }
              });
            } catch (error) {
              console.log(`Warning: Could not calculate opening stock from transfers out for item ${item.itemName}:`, error.message);
            }
            
            // Subtract stock from sales invoices up to day before start date
            try {
              const salesInvoicesBeforeStart = await SalesInvoice.find({
                $or: [
                  { 'items.itemId': item._id },
                  { 'lineItems.itemData._id': item._id.toString() }
                ],
                warehouse: warehouseName,
                createdAt: { 
                  $gte: itemCreationDate,
                  $lte: dayBeforeStart 
                }
              });
              
              console.log(`💰 Found ${salesInvoicesBeforeStart.length} sales invoices before start date`);
              
              salesInvoicesBeforeStart.forEach(si => {
                const invoiceItems = getInvoiceItems(si);
                const siItem = invoiceItems.find(i => i.itemId.toString() === item._id.toString());
                if (siItem) {
                  const qty = parseFloat(siItem.quantity) || 0;
                  openingStock -= qty;
                  console.log(`  ➖ Subtracted ${qty} from sales`);
                }
              });
            } catch (error) {
              console.log(`Warning: Could not calculate opening stock from sales for item ${item.itemName}:`, error.message);
            }
            
            // Add/subtract stock from inventory adjustments up to day before start date
            try {
              const relevantAdjustments = await getInventoryAdjustments({
                warehouse: warehouseName,
                status: 'adjusted',
                createdAt: { 
                  [Op.gte]: itemCreationDate,
                  [Op.lte]: dayBeforeStart 
                },
                itemId: item._id.toString()
              });
              
              console.log(`📊 Found ${relevantAdjustments.length} inventory adjustments before start date`);
              
              relevantAdjustments.forEach(ia => {
                const iaItem = ia.items.find(i => i.itemId && i.itemId.toString() === item._id.toString());
                if (iaItem) {
                  const adjustmentQty = parseFloat(iaItem.quantityAdjusted) || 0;
                  openingStock += adjustmentQty; // Can be positive or negative
                  console.log(`  ${adjustmentQty >= 0 ? '➕' : '➖'} Adjusted by ${Math.abs(adjustmentQty)} from inventory adjustment`);
                }
              });
            } catch (error) {
              console.log(`Warning: Could not calculate opening stock from adjustments for item ${item.itemName}:`, error.message);
            }
          } else {
            console.log(`  Day before start date (${dayBeforeStart.toLocaleDateString()}) is before item creation (${itemCreationDate.toLocaleDateString()}), using original opening stock only`);
          }
          
          console.log(`📊 Final opening stock for ${item.itemName}: ${openingStock}`);
        } else {
          // If no start date provided, use original opening stock
          openingStock = originalOpeningStock;
          console.log(`📊 No start date provided, using original opening stock for ${item.itemName}: ${openingStock}`);
        }
        
        // Ensure opening stock is not negative
        openingStock = Math.max(0, openingStock);
        
        // Start with opening stock
        let stockOnHand = openingStock;
        
        // Add stock from purchase receives up to end date
        try {
          const purchaseReceives = await PurchaseReceive.find({
            'items.itemId': item._id,
            status: 'received',
            toWarehouse: warehouseName,
            createdAt: { $lte: endDateObj }
          });
          
          purchaseReceives.forEach(pr => {
            const prItem = pr.items.find(i => i.itemId.toString() === item._id.toString());
            if (prItem) {
              stockOnHand += parseFloat(prItem.receivedQuantity) || parseFloat(prItem.quantity) || parseFloat(prItem.received) || 0;
            }
          });
        } catch (error) {
          console.log(`Warning: Could not fetch purchase receives for item ${item.itemName}:`, error.message);
        }
        
        // Add stock from transfer orders (received) up to end date
        try {
          const transferOrdersReceived = await TransferOrder.find({
            'items.itemId': item._id,
            status: 'completed',
            destinationWarehouse: warehouseName,
            createdAt: { $lte: endDateObj }
          });
          
          transferOrdersReceived.forEach(to => {
            const toItem = to.items.find(i => i.itemId.toString() === item._id.toString());
            if (toItem) {
              stockOnHand += parseFloat(toItem.quantity) || 0;
            }
          });
        } catch (error) {
          console.log(`Warning: Could not fetch transfer orders received for item ${item.itemName}:`, error.message);
        }
        
        // Subtract stock from transfer orders (sent) up to end date
        try {
          const transferOrdersSent = await TransferOrder.find({
            'items.itemId': item._id,
            status: 'completed',
            sourceWarehouse: warehouseName,
            createdAt: { $lte: endDateObj }
          });
          
          transferOrdersSent.forEach(to => {
            const toItem = to.items.find(i => i.itemId.toString() === item._id.toString());
            if (toItem) {
              stockOnHand -= parseFloat(toItem.quantity) || 0;
            }
          });
        } catch (error) {
          console.log(`Warning: Could not fetch transfer orders sent for item ${item.itemName}:`, error.message);
        }
        
        // Subtract stock from sales invoices up to end date
        try {
          const salesInvoices = await SalesInvoice.find({
            $or: [
              { 'items.itemId': item._id },
              { 'lineItems.itemData._id': item._id.toString() }
            ],
            warehouse: warehouseName,
            createdAt: { $lte: endDateObj }
          });
          
          salesInvoices.forEach(si => {
            const invoiceItems = getInvoiceItems(si);
            const siItem = invoiceItems.find(i => i.itemId.toString() === item._id.toString());
            if (siItem) {
              stockOnHand -= parseFloat(siItem.quantity) || 0;
            }
          });
        } catch (error) {
          console.log(`Warning: Could not fetch sales invoices for item ${item.itemName}:`, error.message);
        }
        
        // Add/subtract stock from inventory adjustments up to end date
        try {
          const relevantAdjustments = await getInventoryAdjustments({
            warehouse: warehouseName,
            status: 'adjusted',
            createdAt: { [Op.lte]: endDateObj },
            itemId: item._id.toString()
          });
          
          relevantAdjustments.forEach(ia => {
            const iaItem = ia.items.find(i => i.itemId && i.itemId.toString() === item._id.toString());
            if (iaItem) {
              const adjustmentQty = parseFloat(iaItem.quantityAdjusted) || 0;
              stockOnHand += adjustmentQty; // Can be positive or negative
            }
          });
        } catch (error) {
          console.log(`Warning: Could not fetch inventory adjustments for item ${item.itemName}:`, error.message);
        }
        
        // Calculate stock movements within the selected period
        let stockIn = 0; // Stock added during the period
        let stockOut = 0; // Stock sold during the period
        
        // Calculate Stock In (additions during the period)
        try {
          console.log(`🔍 Calculating Stock In for ${item.itemName} from ${startDateObj.toLocaleDateString()} to ${endDateObj.toLocaleDateString()}`);
          
          // Stock from purchase receives within the period
          const purchaseReceivesInPeriod = await PurchaseReceive.find({
            'items.itemId': item._id,
            status: 'received',
            toWarehouse: warehouseName,
            createdAt: { 
              $gte: startDateObj,
              $lte: endDateObj 
            }
          });
          
          console.log(`📦 Found ${purchaseReceivesInPeriod.length} purchase receives in period`);
          
          purchaseReceivesInPeriod.forEach(pr => {
            const prItem = pr.items.find(i => i.itemId.toString() === item._id.toString());
            if (prItem) {
              const qty = parseFloat(prItem.receivedQuantity) || parseFloat(prItem.quantity) || parseFloat(prItem.received) || 0;
              stockIn += qty;
              console.log(`  ➕ Added ${qty} from purchase receive`);
            }
          });
          
          // Stock from transfer orders received within the period
          const transferOrdersReceivedInPeriod = await TransferOrder.find({
            'items.itemId': item._id,
            status: 'completed',
            destinationWarehouse: warehouseName,
            createdAt: { 
              $gte: startDateObj,
              $lte: endDateObj 
            }
          });
          
          console.log(`🔄 Found ${transferOrdersReceivedInPeriod.length} transfer orders received in period`);
          
          transferOrdersReceivedInPeriod.forEach(to => {
            const toItem = to.items.find(i => i.itemId.toString() === item._id.toString());
            if (toItem) {
              const qty = parseFloat(toItem.quantity) || 0;
              stockIn += qty;
              console.log(`  ➕ Added ${qty} from transfer in`);
            }
          });
          
          // Positive inventory adjustments within the period
          const relevantPositiveAdjustments = await getInventoryAdjustments({
            warehouse: warehouseName,
            status: 'adjusted',
            createdAt: { 
              [Op.gte]: startDateObj,
              [Op.lte]: endDateObj 
            },
            itemId: item._id.toString()
          });
          
          console.log(`📊 Found ${relevantPositiveAdjustments.length} inventory adjustments in period`);
          
          relevantPositiveAdjustments.forEach(ia => {
            const iaItem = ia.items.find(i => i.itemId && i.itemId.toString() === item._id.toString());
            if (iaItem) {
              const adjustmentQty = parseFloat(iaItem.quantityAdjusted) || 0;
              if (adjustmentQty > 0) {
                stockIn += adjustmentQty;
                console.log(`  ➕ Added ${adjustmentQty} from positive adjustment`);
              }
            }
          });
          
          console.log(`📊 Total Stock In for ${item.itemName}: ${stockIn}`);
        } catch (error) {
          console.log(`Warning: Could not calculate stock in for item ${item.itemName}:`, error.message);
        }
        
        // Calculate Stock Out (reductions during the period)
        try {
          // Stock sold via sales invoices within the period
          const salesInvoicesInPeriod = await SalesInvoice.find({
            $or: [
              { 'items.itemId': item._id },
              { 'lineItems.itemData._id': item._id.toString() }
            ],
            warehouse: warehouseName,
            createdAt: { 
              $gte: startDateObj,
              $lte: endDateObj 
            }
          });
          
          // Also try with warehouse variations to catch any naming mismatches
          const warehouseVariations = getWarehouseNameVariations(warehouseName);
          const salesInvoicesWithVariations = await SalesInvoice.find({
            $or: [
              { 'items.itemId': item._id },
              { 'lineItems.itemData._id': item._id.toString() }
            ],
            warehouse: { $in: warehouseVariations },
            createdAt: { 
              $gte: startDateObj,
              $lte: endDateObj 
            }
          });
          
          console.log(`🔍 Debug for item "${item.itemName}" in warehouse "${warehouseName}":`, {
            itemId: item._id,
            startDate: startDateObj,
            endDate: endDateObj,
            warehouseVariations: warehouseVariations,
            foundInvoicesExact: salesInvoicesInPeriod.length,
            foundInvoicesWithVariations: salesInvoicesWithVariations.length
          });
          
          if (salesInvoicesWithVariations.length > 0) {
            console.log(`📋 Found ${salesInvoicesWithVariations.length} sales invoices (with variations) for item "${item.itemName}":`, 
              salesInvoicesWithVariations.map(si => ({
                invoiceId: si._id,
                warehouse: si.warehouse,
                createdAt: si.createdAt,
                items: getInvoiceItems(si).filter(i => i.itemId.toString() === item._id.toString())
              }))
            );
          }
          
          // Use the broader search with variations
          salesInvoicesWithVariations.forEach(si => {
            const invoiceItems = getInvoiceItems(si);
            const siItem = invoiceItems.find(i => i.itemId.toString() === item._id.toString());
            if (siItem) {
              const qty = parseFloat(siItem.quantity) || 0;
              stockOut += qty;
              console.log(`📤 Adding ${qty} to stock out for item "${item.itemName}" from invoice ${si._id} (warehouse: ${si.warehouse})`);
            }
          });
          
          // Stock sent via transfer orders within the period
          const transferOrdersSentInPeriod = await TransferOrder.find({
            'items.itemId': item._id,
            status: 'completed',
            sourceWarehouse: warehouseName,
            createdAt: { 
              $gte: startDateObj,
              $lte: endDateObj 
            }
          });
          
          transferOrdersSentInPeriod.forEach(to => {
            const toItem = to.items.find(i => i.itemId.toString() === item._id.toString());
            if (toItem) {
              stockOut += parseFloat(toItem.quantity) || 0;
            }
          });
          
          // Negative inventory adjustments within the period
          const relevantNegativeAdjustments = await getInventoryAdjustments({
            warehouse: warehouseName,
            status: 'adjusted',
            createdAt: { 
              [Op.gte]: startDateObj,
              [Op.lte]: endDateObj 
            },
            itemId: item._id.toString()
          });
          
          relevantNegativeAdjustments.forEach(ia => {
            const iaItem = ia.items.find(i => i.itemId && i.itemId.toString() === item._id.toString());
            if (iaItem) {
              const adjustmentQty = parseFloat(iaItem.quantityAdjusted) || 0;
              if (adjustmentQty < 0) {
                stockOut += Math.abs(adjustmentQty);
              }
            }
          });
        } catch (error) {
          console.log(`Warning: Could not calculate stock out for item ${item.itemName}:`, error.message);
        }
        
        // If no movements found and we have opening stock, closing stock should equal opening stock
        if (stockIn === 0 && stockOut === 0 && openingStock > 0) {
          stockOnHand = openingStock;
          console.log(`📊 No movements found, setting closing stock equal to opening stock: ${stockOnHand}`);
        }
        
        // Calculate stock value
        const itemCost = parseFloat(item.costPrice) || 0;
        const closingStock = Math.max(0, stockOnHand); // Ensure non-negative
        const stockValue = closingStock * itemCost;
        
        // Only include items with stock > 0 or movements during the period or if showing all
        // Also include items that have warehouse stock entries even if all values are 0 (for debugging)
        const hasWarehouseEntry = warehouseStocksToProcess.length > 0;
        const shouldInclude = closingStock > 0 || stockIn > 0 || stockOut > 0 || openingStock > 0 || warehouse === "Warehouse" || warehouse === "All Stores" || hasWarehouseEntry;
        
        console.log(`  📊 Stock calculation for ${item.itemName || item.name}:`);
        console.log(`    Opening: ${openingStock}, In: ${stockIn}, Out: ${stockOut}, Closing: ${closingStock}`);
        console.log(`    Should include: ${shouldInclude} (hasWarehouseEntry: ${hasWarehouseEntry})`);
        
        if (shouldInclude) {
          stockOnHandData.push({
            itemId: item._id,
            itemName: item.itemName || item.name,
            sku: item.sku,
            category: item.category,
            warehouse: warehouseName,
            openingStock: Math.max(0, openingStock), // Stock at start of period
            stockIn: stockIn, // Stock added during period
            stockOut: stockOut, // Stock sold during period
            closingStock: closingStock, // Stock at end of period
            costPrice: itemCost,
            stockValue: Math.max(0, stockValue), // Ensure non-negative
            itemGroupId: item.itemGroupId || null,
            itemGroupName: item.itemGroupName || null,
            isFromGroup: item.isFromGroup || false
          });
          
          totalStockOnHand += closingStock;
          totalStockValue += Math.max(0, stockValue);
          totalStockIn += stockIn;
          totalStockOut += stockOut;
          totalOpeningStock += Math.max(0, openingStock);
          
          console.log(`    ✅ INCLUDED in report`);
        } else {
          console.log(`    ❌ EXCLUDED from report`);
        }
      }
    }
    
    // Sort by warehouse, then by item name
    stockOnHandData.sort((a, b) => {
      if (a.warehouse !== b.warehouse) {
        return a.warehouse.localeCompare(b.warehouse);
      }
      return (a.itemName || '').localeCompare(b.itemName || '');
    });
    
    // Group by warehouse for summary
    const warehouseSummary = {};
    stockOnHandData.forEach(item => {
      if (!warehouseSummary[item.warehouse]) {
        warehouseSummary[item.warehouse] = {
          warehouse: item.warehouse,
          totalItems: 0,
          totalStock: 0,
          totalValue: 0
        };
      }
      
      warehouseSummary[item.warehouse].totalItems += 1;
      warehouseSummary[item.warehouse].totalStock += item.closingStock;
      warehouseSummary[item.warehouse].totalValue += item.stockValue;
    });
    
    const warehouseReport = Object.values(warehouseSummary).sort((a, b) => b.totalValue - a.totalValue);
    
    console.log("📊 Stock On Hand Report Generated:", {
      totalItems: stockOnHandData.length,
      totalWarehouses: warehouseReport.length,
      grandTotalStock: totalStockOnHand,
      grandTotalValue: totalStockValue,
      period: displayPeriod,
      itemsProcessed: items.length,
      itemsIncluded: stockOnHandData.length
    });
    
    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalItems: stockOnHandData.length,
          totalOpeningStock,
          totalStockIn,
          totalStockOut,
          totalClosingStock: totalStockOnHand,
          totalStockValue,
          totalWarehouses: warehouseReport.length,
          period: displayPeriod
        },
        warehouseReport,
        itemDetails: stockOnHandData
      }
    });
    
  } catch (error) {
    console.error("❌ Get stock on hand report error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};