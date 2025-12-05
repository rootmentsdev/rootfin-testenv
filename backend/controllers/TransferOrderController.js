// Transfer Order Controller - Manages stock transfers between warehouses
import { Op } from "sequelize";
import { TransferOrder } from "../models/sequelize/index.js";
import ShoeItem from "../model/ShoeItem.js";
import ItemGroup from "../model/ItemGroup.js";

// Helper function for flexible warehouse matching
// Warehouse name normalization mapping (same as frontend)
const WAREHOUSE_NAME_MAPPING = {
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
  "G.Kalpetta": "Kalpetta Branch",
  "GKalpetta": "Kalpetta Branch",
  "Kalpetta Branch": "Kalpetta Branch",
  "G.Kottakkal": "Kottakkal Branch",
  "GKottakkal": "Kottakkal Branch",
  "Kottakkal Branch": "Kottakkal Branch",
  "G.Perinthalmanna": "Perinthalmanna Branch",
  "GPerinthalmanna": "Perinthalmanna Branch",
  "Perinthalmanna Branch": "Perinthalmanna Branch",
  "Grooms Trivandum": "Grooms Trivandrum",
  "SG-Trivandrum": "Grooms Trivandrum",
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
  "G.MG Road": "SuitorGuy MG Road",
  "G.Mg Road": "SuitorGuy MG Road",
  "GMG Road": "SuitorGuy MG Road",
  "GMg Road": "SuitorGuy MG Road",
  "MG Road": "SuitorGuy MG Road",
  "SuitorGuy MG Road": "SuitorGuy MG Road",
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

const matchesWarehouse = (itemWarehouse, targetWarehouse) => {
  if (!itemWarehouse || !targetWarehouse) return false;
  
  // Normalize both warehouse names
  const normalizedItem = normalizeWarehouseName(itemWarehouse);
  const normalizedTarget = normalizeWarehouseName(targetWarehouse);
  
  // Exact match after normalization
  if (normalizedItem && normalizedTarget && normalizedItem.toLowerCase() === normalizedTarget.toLowerCase()) {
    return true;
  }
  
  // Fallback to original flexible matching
  const itemWarehouseLower = itemWarehouse.toString().toLowerCase().trim();
  const targetWarehouseLower = targetWarehouse.toLowerCase().trim();
  
  // Exact match
  if (itemWarehouseLower === targetWarehouseLower) {
    return true;
  }
  
  // Base name match (e.g., "warehouse" matches "Warehouse", "kannur" matches "Kannur Branch")
  const itemBase = itemWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
  const targetBase = targetWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
  
  if (itemBase && targetBase && itemBase === targetBase) {
    return true;
  }
  
  // Partial match (e.g., "kannur branch" contains "kannur")
  if (itemWarehouseLower.includes(targetWarehouseLower) || targetWarehouseLower.includes(itemWarehouseLower)) {
    return true;
  }
  
  return false;
};

// Helper function to update warehouse stock for transfer
const updateWarehouseStock = (warehouseStocks, quantityChange, targetWarehouse, operation = 'subtract') => {
  if (!warehouseStocks || warehouseStocks.length === 0) {
    // Create new warehouse entry if subtracting (shouldn't happen, but handle it)
    if (operation === 'add') {
      return [{
        warehouse: targetWarehouse,
        openingStock: 0,
        openingStockValue: 0,
        stockOnHand: quantityChange,
        committedStock: 0,
        availableForSale: quantityChange,
        physicalOpeningStock: 0,
        physicalStockOnHand: quantityChange,
        physicalCommittedStock: 0,
        physicalAvailableForSale: quantityChange,
      }];
    }
    return [];
  }
  
  // Find the specific warehouse using flexible matching (same as getCurrentStock)
  let warehouseStock = null;
  for (const ws of warehouseStocks) {
    if (ws.warehouse && matchesWarehouse(ws.warehouse, targetWarehouse)) {
      warehouseStock = ws;
      console.log(`  ✅ Found matching warehouse stock: "${ws.warehouse}" matches "${targetWarehouse}"`);
      break;
    }
  }
  
  if (!warehouseStock) {
    // Create new warehouse entry if adding
    if (operation === 'add') {
      console.log(`  📦 Creating new warehouse stock entry for "${targetWarehouse}"`);
      warehouseStock = {
        warehouse: targetWarehouse,
        openingStock: 0,
        openingStockValue: 0,
        stockOnHand: quantityChange,
        committedStock: 0,
        availableForSale: quantityChange,
        physicalOpeningStock: 0,
        physicalStockOnHand: quantityChange,
        physicalCommittedStock: 0,
        physicalAvailableForSale: quantityChange,
      };
      warehouseStocks.push(warehouseStock);
      return warehouseStocks;
    }
    console.log(`  ⚠️ Warehouse "${targetWarehouse}" not found in existing stocks, cannot subtract`);
    return warehouseStocks; // Can't subtract from non-existent warehouse
  }
  
  // Normalize warehouse name to target warehouse name to avoid duplicates
  warehouseStock.warehouse = targetWarehouse;
  
  const currentStockOnHand = parseFloat(warehouseStock.stockOnHand) || 0;
  const currentAvailableForSale = parseFloat(warehouseStock.availableForSale) || 0;
  const currentPhysicalStockOnHand = parseFloat(warehouseStock.physicalStockOnHand) || 0;
  const currentPhysicalAvailableForSale = parseFloat(warehouseStock.physicalAvailableForSale) || 0;
  
  if (operation === 'subtract') {
    const newStockOnHand = Math.max(0, currentStockOnHand - quantityChange);
    const newAvailableForSale = Math.max(0, currentAvailableForSale - quantityChange);
    const newPhysicalStockOnHand = Math.max(0, currentPhysicalStockOnHand - quantityChange);
    const newPhysicalAvailableForSale = Math.max(0, currentPhysicalAvailableForSale - quantityChange);
    
    console.log(`  📉 ${targetWarehouse}: ${currentStockOnHand} - ${quantityChange} = ${newStockOnHand} (Stock On Hand)`);
    
    warehouseStock.stockOnHand = newStockOnHand;
    warehouseStock.availableForSale = newAvailableForSale;
    warehouseStock.physicalStockOnHand = newPhysicalStockOnHand;
    warehouseStock.physicalAvailableForSale = newPhysicalAvailableForSale;
  } else {
    const newStockOnHand = currentStockOnHand + quantityChange;
    const newAvailableForSale = currentAvailableForSale + quantityChange;
    const newPhysicalStockOnHand = currentPhysicalStockOnHand + quantityChange;
    const newPhysicalAvailableForSale = currentPhysicalAvailableForSale + quantityChange;
    
    console.log(`  📈 ${targetWarehouse}: ${currentStockOnHand} + ${quantityChange} = ${newStockOnHand} (Stock On Hand)`);
    
    warehouseStock.stockOnHand = newStockOnHand;
    warehouseStock.availableForSale = newAvailableForSale;
    warehouseStock.physicalStockOnHand = newPhysicalStockOnHand;
    warehouseStock.physicalAvailableForSale = newPhysicalAvailableForSale;
  }
  
  return warehouseStocks;
};

// Transfer stock for an item
const transferItemStock = async (itemIdValue, quantity, sourceWarehouse, destinationWarehouse, itemName = null, itemGroupId = null, itemSku = null) => {
  const sourceWarehouseName = sourceWarehouse?.trim() || "Warehouse";
  const destWarehouseName = destinationWarehouse?.trim() || "Warehouse";
  
  // Try standalone item first
  if (itemIdValue && itemIdValue !== null && itemIdValue !== "null") {
    const shoeItem = await ShoeItem.findById(itemIdValue);
    if (shoeItem) {
      // Subtract from source warehouse
      shoeItem.warehouseStocks = updateWarehouseStock(shoeItem.warehouseStocks || [], quantity, sourceWarehouseName, 'subtract');
      // Add to destination warehouse
      shoeItem.warehouseStocks = updateWarehouseStock(shoeItem.warehouseStocks || [], quantity, destWarehouseName, 'add');
      await shoeItem.save();
      return { success: true, type: 'standalone' };
    }
  }
  
  // Try item groups
  if (itemGroupId && itemName) {
    const group = await ItemGroup.findById(itemGroupId);
    if (group) {
      const itemIndex = group.items.findIndex(item => {
        if (itemSku && item.sku) {
          return item.sku.toLowerCase() === itemSku.toLowerCase();
        }
        return item.name.toLowerCase() === itemName.toLowerCase();
      });
      
      if (itemIndex !== -1) {
        const groupItem = group.items[itemIndex];
        // Subtract from source warehouse
        groupItem.warehouseStocks = updateWarehouseStock(groupItem.warehouseStocks || [], quantity, sourceWarehouseName, 'subtract');
        // Add to destination warehouse
        groupItem.warehouseStocks = updateWarehouseStock(groupItem.warehouseStocks || [], quantity, destWarehouseName, 'add');
        group.items[itemIndex] = groupItem;
        group.markModified('items');
        await group.save();
        return { success: true, type: 'group' };
      }
    }
  }
  
  return { success: false, message: `Item "${itemName || itemIdValue}" not found` };
};

// Reverse transfer (when status changes from transferred back to draft/in_transit)
const reverseTransferStock = async (itemIdValue, quantity, sourceWarehouse, destinationWarehouse, itemName = null, itemGroupId = null, itemSku = null) => {
  // Reverse: add back to source, subtract from destination
  const sourceWarehouseName = sourceWarehouse?.trim() || "Warehouse";
  const destWarehouseName = destinationWarehouse?.trim() || "Warehouse";
  
  // Try standalone item first
  if (itemIdValue && itemIdValue !== null && itemIdValue !== "null") {
    const shoeItem = await ShoeItem.findById(itemIdValue);
    if (shoeItem) {
      // Add back to source warehouse
      shoeItem.warehouseStocks = updateWarehouseStock(shoeItem.warehouseStocks || [], quantity, sourceWarehouseName, 'add');
      // Subtract from destination warehouse
      shoeItem.warehouseStocks = updateWarehouseStock(shoeItem.warehouseStocks || [], quantity, destWarehouseName, 'subtract');
      await shoeItem.save();
      return { success: true, type: 'standalone' };
    }
  }
  
  // Try item groups
  if (itemGroupId && itemName) {
    const group = await ItemGroup.findById(itemGroupId);
    if (group) {
      const itemIndex = group.items.findIndex(item => {
        if (itemSku && item.sku) {
          return item.sku.toLowerCase() === itemSku.toLowerCase();
        }
        return item.name.toLowerCase() === itemName.toLowerCase();
      });
      
      if (itemIndex !== -1) {
        const groupItem = group.items[itemIndex];
        // Add back to source warehouse
        groupItem.warehouseStocks = updateWarehouseStock(groupItem.warehouseStocks || [], quantity, sourceWarehouseName, 'add');
        // Subtract from destination warehouse
        groupItem.warehouseStocks = updateWarehouseStock(groupItem.warehouseStocks || [], quantity, destWarehouseName, 'subtract');
        group.items[itemIndex] = groupItem;
        group.markModified('items');
        await group.save();
        return { success: true, type: 'group' };
      }
    }
  }
  
  return { success: false, message: `Item "${itemName || itemIdValue}" not found` };
};

// Get current stock for an item in a warehouse
const getCurrentStock = async (itemIdValue, warehouseName, itemName = null, itemGroupId = null, itemSku = null) => {
  const targetWarehouse = warehouseName?.trim() || "Warehouse";
  const normalizedTarget = normalizeWarehouseName(targetWarehouse);
  
  console.log(`\n🔍 Getting stock for warehouse: "${targetWarehouse}" (normalized: "${normalizedTarget}")`);
  console.log(`   ItemId: ${itemIdValue}, ItemName: ${itemName}, ItemGroupId: ${itemGroupId}, ItemSku: ${itemSku}`);
  
  // Try standalone item first
  if (itemIdValue && itemIdValue !== null && itemIdValue !== "null") {
    const shoeItem = await ShoeItem.findById(itemIdValue);
      if (shoeItem) {
        console.log(`   Found standalone item: "${shoeItem.itemName}"`);
        const availableWarehouses = shoeItem.warehouseStocks?.map(ws => {
          const normalized = normalizeWarehouseName(ws.warehouse);
          return `${ws.warehouse} (normalized: "${normalized}", stock: ${ws.stockOnHand})`;
        }).join(", ") || "none";
        console.log(`   Available warehouses:`, availableWarehouses);
        
        // Try to find matching warehouse stock
        let warehouseStock = null;
        for (const ws of (shoeItem.warehouseStocks || [])) {
          const normalizedWs = normalizeWarehouseName(ws.warehouse);
          const matches = matchesWarehouse(ws.warehouse, targetWarehouse);
          console.log(`   Checking "${ws.warehouse}" (normalized: "${normalizedWs}") against "${targetWarehouse}" (normalized: "${normalizedTarget}"): ${matches ? "✅ MATCH" : "❌ NO MATCH"}`);
          
          if (matches) {
            warehouseStock = ws;
            console.log(`   ✅ Matched "${ws.warehouse}" with target "${targetWarehouse}"`);
            break;
          }
        }
      
      if (warehouseStock) {
        console.log(`   ✅ Found stock in "${warehouseStock.warehouse}": ${warehouseStock.stockOnHand}`);
        return {
          success: true,
          stockOnHand: warehouseStock.stockOnHand || 0,
          currentQuantity: warehouseStock.stockOnHand || 0,
          currentValue: (warehouseStock.stockOnHand || 0) * (shoeItem.costPrice || 0),
        };
      } else {
        console.log(`   ❌ No stock found in "${targetWarehouse}"`);
        console.log(`   💡 Tip: Check if warehouse name matches exactly (case-insensitive) or try base name matching`);
      }
    } else {
      console.log(`   ❌ Item not found with ID: ${itemIdValue}`);
    }
  }
  
  // Try item groups
  if (itemGroupId && itemName) {
    const group = await ItemGroup.findById(itemGroupId);
    if (group) {
      const item = group.items.find(item => {
        if (itemSku && item.sku) {
          return item.sku.toLowerCase() === itemSku.toLowerCase();
        }
        return item.name.toLowerCase() === itemName.toLowerCase();
      });
      
      if (item) {
        console.log(`   Found item in group: "${item.name}"`);
        const availableWarehouses = item.warehouseStocks?.map(ws => {
          const normalized = normalizeWarehouseName(ws.warehouse);
          return `${ws.warehouse} (normalized: "${normalized}", stock: ${ws.stockOnHand})`;
        }).join(", ") || "none";
        console.log(`   Available warehouses:`, availableWarehouses);
        
        // Try to find matching warehouse stock
        let warehouseStock = null;
        for (const ws of (item.warehouseStocks || [])) {
          const normalizedWs = normalizeWarehouseName(ws.warehouse);
          const matches = matchesWarehouse(ws.warehouse, targetWarehouse);
          console.log(`   Checking "${ws.warehouse}" (normalized: "${normalizedWs}") against "${targetWarehouse}" (normalized: "${normalizedTarget}"): ${matches ? "✅ MATCH" : "❌ NO MATCH"}`);
          
          if (matches) {
            warehouseStock = ws;
            console.log(`   ✅ Matched "${ws.warehouse}" with target "${targetWarehouse}"`);
            break;
          }
        }
        
        if (warehouseStock) {
          console.log(`   ✅ Found stock in "${warehouseStock.warehouse}": ${warehouseStock.stockOnHand}`);
          return {
            success: true,
            stockOnHand: warehouseStock.stockOnHand || 0,
            currentQuantity: warehouseStock.stockOnHand || 0,
            currentValue: (warehouseStock.stockOnHand || 0) * (item.costPrice || 0),
          };
        } else {
          console.log(`   ❌ No stock found in "${targetWarehouse}"`);
          console.log(`   💡 Tip: Check if warehouse name matches exactly (case-insensitive) or try base name matching`);
        }
      } else {
        console.log(`   ❌ Item "${itemName}" not found in group ${itemGroupId}`);
      }
    }
  }
  
  console.log(`   ⚠️ Returning 0 stock\n`);
  return { success: false, currentQuantity: 0, currentValue: 0 };
};

// Create a new transfer order
export const createTransferOrder = async (req, res) => {
  try {
    const transferData = req.body;
    
    // Safely parse user info
    let userId = "";
    let createdBy = "";
    try {
      const userStr = req.headers['user'] || req.body.userId;
      if (userStr) {
        if (typeof userStr === 'object' && userStr !== null) {
          userId = userStr.email || userStr._id || userStr.id || transferData.userId || "";
          createdBy = userStr.name || userStr.displayName || userId;
        } else if (typeof userStr === 'string') {
          if (userStr.trim().startsWith('{') || userStr.trim().startsWith('[')) {
            try {
              const user = JSON.parse(userStr);
              userId = user?.email || user?._id || user?.id || transferData.userId || "";
              createdBy = user?.name || user?.displayName || userId;
            } catch (e) {
              userId = userStr || transferData.userId || "";
              createdBy = userId;
            }
          } else {
            userId = userStr || transferData.userId || "";
            createdBy = userId;
          }
        } else {
          userId = transferData.userId || "";
          createdBy = userId;
        }
      } else {
        userId = transferData.userId || "";
        createdBy = userId;
      }
    } catch (parseError) {
      console.warn("Error parsing user info, using fallback:", parseError);
      userId = transferData.userId || "";
      createdBy = userId;
    }
    
    // Validate required fields
    if (!transferData.date || !transferData.sourceWarehouse || !transferData.destinationWarehouse || !transferData.transferOrderNumber) {
      return res.status(400).json({ 
        message: "Missing required fields: date, sourceWarehouse, destinationWarehouse, and transferOrderNumber are required" 
      });
    }
    
    if (transferData.sourceWarehouse === transferData.destinationWarehouse) {
      return res.status(400).json({ 
        message: "Source and destination warehouses cannot be the same" 
      });
    }
    
    // Validate status
    if (transferData.status && !["draft", "in_transit", "transferred"].includes(transferData.status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be 'draft', 'in_transit', or 'transferred'" 
      });
    }
    
    // Validate userId
    if (!userId || userId === "") {
      return res.status(400).json({ 
        message: "User ID is required. Please ensure you are logged in." 
      });
    }
    
    // Parse date safely
    let transferDate;
    try {
      if (transferData.date instanceof Date) {
        transferDate = transferData.date;
      } else if (typeof transferData.date === 'string') {
        transferDate = new Date(transferData.date);
        if (isNaN(transferDate.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      } else {
        return res.status(400).json({ message: "Date is required and must be a valid date" });
      }
    } catch (dateError) {
      console.error("Error parsing date:", dateError);
      return res.status(400).json({ message: "Invalid date format" });
    }
    
    // Process items and calculate totals
    let totalQuantityTransferred = 0;
    const processedItems = [];
    
    // Validate items array
    if (!Array.isArray(transferData.items) || transferData.items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }
    
    for (const item of transferData.items) {
      if (!item.itemName) continue;
      
      try {
        const quantity = parseFloat(item.quantity) || 0;
        if (quantity <= 0) continue;
        
        // Get current stock in source warehouse
        const sourceStockInfo = await getCurrentStock(
          item.itemId || null,
          transferData.sourceWarehouse,
          item.itemName,
          item.itemGroupId || null,
          item.itemSku || null
        );
        
        const sourceQuantity = sourceStockInfo.currentQuantity || 0;
        
        // Get current stock in destination warehouse
        const destStockInfo = await getCurrentStock(
          item.itemId || null,
          transferData.destinationWarehouse,
          item.itemName,
          item.itemGroupId || null,
          item.itemSku || null
        );
        
        const destQuantity = destStockInfo.currentQuantity || 0;
        
        totalQuantityTransferred += quantity;
        
        processedItems.push({
          itemId: item.itemId ? String(item.itemId) : null,
          itemGroupId: item.itemGroupId ? String(item.itemGroupId) : null,
          itemName: item.itemName,
          itemSku: item.itemSku || "",
          quantity,
          sourceQuantity,
          destQuantity,
        });
      } catch (itemError) {
        console.error(`Error processing item ${item.itemName}:`, itemError);
      }
    }
    
    if (processedItems.length === 0) {
      return res.status(400).json({ message: "No valid items to process" });
    }
    
    // Create transfer order in PostgreSQL
    const transferOrder = await TransferOrder.create({
      transferOrderNumber: transferData.transferOrderNumber,
      date: transferDate,
      reason: transferData.reason || "",
      sourceWarehouse: transferData.sourceWarehouse,
      destinationWarehouse: transferData.destinationWarehouse,
      items: processedItems,
      totalQuantityTransferred,
      userId,
      createdBy: userId || createdBy,
      status: transferData.status || "draft",
      locCode: transferData.locCode || "",
    });
    
    // IMPORTANT: Stock transfer logic:
    // - If status is "draft" or "in_transit": Do NOT transfer stock (stock stays in source warehouse)
    // - If status is "transferred": Transfer stock immediately (for direct completion)
    // - When receiving later (status changes from "in_transit" to "transferred"): Transfer stock then
    // This prevents double-transferring stock
    
    if (transferOrder.status === "transferred") {
      // Only transfer stock if order is created directly as "transferred" (Complete Transfer button)
      console.log(`📦 Transfer order created with status "transferred" - Transferring stock immediately`);
      const items = transferOrder.items || [];
      for (const item of items) {
        try {
          const result = await transferItemStock(
            item.itemId,
            item.quantity,
            transferData.sourceWarehouse,
            transferData.destinationWarehouse,
            item.itemName,
            item.itemGroupId,
            item.itemSku
          );
          if (!result.success) {
            console.warn(`Failed to transfer stock for item ${item.itemName}:`, result.message);
          }
        } catch (stockError) {
          console.error(`Error transferring stock for item ${item.itemName}:`, stockError);
        }
      }
    } else {
      console.log(`📦 Transfer order created with status: "${transferOrder.status}" - Stock will be transferred when order is received`);
    }
    
    res.status(201).json(transferOrder);
  } catch (error) {
    console.error("Error creating transfer order:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all transfer orders
export const getTransferOrders = async (req, res) => {
  try {
    const { userId, sourceWarehouse, destinationWarehouse, status, startDate, endDate } = req.query;
    
    console.log(`\n=== GET TRANSFER ORDERS REQUEST ===`);
    console.log(`Query params:`, req.query);
    console.log(`Filtering by destinationWarehouse: "${destinationWarehouse}"`);
    console.log(`Filtering by sourceWarehouse: "${sourceWarehouse}"`);
    console.log(`==============================\n`);
    
    const where = {};
    
    // Only filter by userId if NOT filtering by warehouse
    // Transfer orders should be visible to warehouse users regardless of creator
    if (userId && !destinationWarehouse && !sourceWarehouse) {
      where.userId = userId;
    }
    
    // Don't filter by sourceWarehouse or destinationWarehouse here - we'll filter after fetching
    // This allows for flexible matching (e.g., "Kannur" vs "Kannur Branch")
    
    if (status) {
      where.status = status;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = new Date(startDate);
      if (endDate) where.date[Op.lte] = new Date(endDate);
    }
    
    // Fetch all matching orders first
    let transferOrders = await TransferOrder.findAll({
      where,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: 1000,
    });
    
    console.log(`Found ${transferOrders.length} transfer orders before warehouse filtering`);
    
    // Helper function to match warehouse names flexibly
    const matchesWarehouse = (orderWarehouse, targetWarehouse) => {
      if (!orderWarehouse || !targetWarehouse) return false;
      
      const orderWarehouseLower = orderWarehouse.toString().toLowerCase().trim();
      const targetWarehouseLower = targetWarehouse.toLowerCase().trim();
      const orderBase = orderWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
      const targetBase = targetWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
      
      // Exact match
      if (orderWarehouseLower === targetWarehouseLower) {
        return true;
      }
      
      // Base name match (e.g., "kannur" matches "kannur branch")
      if (orderBase && targetBase && orderBase === targetBase) {
        return true;
      }
      
      // Partial match
      if (orderWarehouseLower.includes(targetWarehouseLower) || targetWarehouseLower.includes(orderWarehouseLower)) {
        return true;
      }
      
      return false;
    };
    
    // Filter by destinationWarehouse OR sourceWarehouse (store users see orders where they are source OR destination)
    if (destinationWarehouse || sourceWarehouse) {
      // If both are provided and they're the same, show orders where user's warehouse is source OR destination
      // This allows stores to see all their transfer orders (both incoming and outgoing)
      const targetWarehouse = destinationWarehouse || sourceWarehouse;
      const isDestinationFilter = !!destinationWarehouse;
      const isSourceFilter = !!sourceWarehouse;
      const bothProvided = isDestinationFilter && isSourceFilter;
      
      console.log(`Filtering for warehouse: "${targetWarehouse}"`);
      if (bothProvided && destinationWarehouse === sourceWarehouse) {
        console.log(`  Showing orders where warehouse is source OR destination`);
      } else if (isDestinationFilter) {
        console.log(`  Showing orders where warehouse is destination`);
      } else if (isSourceFilter) {
        console.log(`  Showing orders where warehouse is source`);
      }
      
      // Log all warehouses for debugging
      if (transferOrders.length > 0) {
        const uniqueSources = [...new Set(transferOrders.map(o => o.sourceWarehouse))];
        const uniqueDestinations = [...new Set(transferOrders.map(o => o.destinationWarehouse))];
        console.log(`All source warehouses:`, uniqueSources);
        console.log(`All destination warehouses:`, uniqueDestinations);
      }
      
      transferOrders = transferOrders.filter(order => {
        const matchesDest = matchesWarehouse(order.destinationWarehouse, targetWarehouse);
        const matchesSource = matchesWarehouse(order.sourceWarehouse, targetWarehouse);
        
        // If both filters provided and same warehouse, show if matches destination OR source
        // Otherwise, show based on which filter was provided
        if (bothProvided && destinationWarehouse === sourceWarehouse) {
          // Show if matches destination OR source (user wants to see all their orders)
          if (matchesDest || matchesSource) {
            console.log(`✅ Match: Order ${order.transferOrderNumber} - Source: "${order.sourceWarehouse}", Dest: "${order.destinationWarehouse}"`);
            return true;
          }
        } else if (isDestinationFilter) {
          // Show only if matches destination
          if (matchesDest) {
            console.log(`✅ Match (destination): Order ${order.transferOrderNumber} - Dest: "${order.destinationWarehouse}"`);
            return true;
          }
        } else if (isSourceFilter) {
          // Show only if matches source
          if (matchesSource) {
            console.log(`✅ Match (source): Order ${order.transferOrderNumber} - Source: "${order.sourceWarehouse}"`);
            return true;
          }
        }
        
        return false;
      });
      
      console.log(`Filtered to ${transferOrders.length} transfer orders`);
    }
    
    console.log(`Returning ${transferOrders.length} transfer orders`);
    
    res.status(200).json(transferOrders);
  } catch (error) {
    console.error("Error fetching transfer orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single transfer order by ID
export const getTransferOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const transferOrder = await TransferOrder.findByPk(id);
    
    if (!transferOrder) {
      return res.status(404).json({ message: "Transfer order not found" });
    }
    
    res.status(200).json(transferOrder);
  } catch (error) {
    console.error("Error fetching transfer order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a transfer order
export const updateTransferOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const transferData = req.body;
    
    // Safely parse user info
    let userId = "";
    let modifiedBy = "";
    try {
      const userStr = req.headers['user'] || req.body.userId;
      if (userStr) {
        if (typeof userStr === 'object' && userStr !== null) {
          userId = userStr.email || userStr._id || userStr.id || transferData.userId || "";
          modifiedBy = userStr.name || userStr.displayName || userId;
        } else if (typeof userStr === 'string') {
          if (userStr.trim().startsWith('{') || userStr.trim().startsWith('[')) {
            try {
              const user = JSON.parse(userStr);
              userId = user?.email || user?._id || user?.id || transferData.userId || "";
              modifiedBy = user?.name || user?.displayName || userId;
            } catch (e) {
              userId = userStr || transferData.userId || "";
              modifiedBy = userId;
            }
          } else {
            userId = userStr || transferData.userId || "";
            modifiedBy = userId;
          }
        } else {
          userId = transferData.userId || "";
          modifiedBy = userId;
        }
      } else {
        userId = transferData.userId || "";
        modifiedBy = userId;
      }
    } catch (parseError) {
      console.warn("Error parsing user info, using fallback:", parseError);
      userId = transferData.userId || "";
      modifiedBy = userId;
    }
    
    const existingOrder = await TransferOrder.findByPk(id);
    if (!existingOrder) {
      return res.status(404).json({ message: "Transfer order not found" });
    }
    
    const oldStatus = existingOrder.status;
    const newStatus = transferData.status || oldStatus;
    
    // If changing from draft/in_transit to transferred, apply stock transfer
    if ((oldStatus === "draft" || oldStatus === "in_transit") && newStatus === "transferred") {
      const items = existingOrder.items || [];
      for (const item of items) {
        try {
          const result = await transferItemStock(
            item.itemId,
            item.quantity,
            existingOrder.sourceWarehouse,
            existingOrder.destinationWarehouse,
            item.itemName,
            item.itemGroupId,
            item.itemSku
          );
          if (!result.success) {
            console.warn(`Failed to transfer stock for item ${item.itemName}:`, result.message);
          }
        } catch (stockError) {
          console.error(`Error transferring stock for item ${item.itemName}:`, stockError);
        }
      }
    }
    
    // If changing from transferred back to draft/in_transit, reverse stock transfer
    if (oldStatus === "transferred" && (newStatus === "draft" || newStatus === "in_transit")) {
      const items = existingOrder.items || [];
      for (const item of items) {
        try {
          const result = await reverseTransferStock(
            item.itemId,
            item.quantity,
            existingOrder.sourceWarehouse,
            existingOrder.destinationWarehouse,
            item.itemName,
            item.itemGroupId,
            item.itemSku
          );
          if (!result.success) {
            console.warn(`Failed to reverse transfer stock for item ${item.itemName}:`, result.message);
          }
        } catch (stockError) {
          console.error(`Error reversing transfer stock for item ${item.itemName}:`, stockError);
        }
      }
    }
    
    // Update the transfer order
    transferData.modifiedBy = userId || modifiedBy;
    await existingOrder.update(transferData);
    
    // Reload to get updated data
    await existingOrder.reload();
    
    res.status(200).json(existingOrder);
  } catch (error) {
    console.error("Error updating transfer order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Receive a transfer order (change status from in_transit to transferred)
export const receiveTransferOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Safely parse user info
    let userId = "";
    let modifiedBy = "";
    try {
      const userStr = req.headers['user'] || req.body.userId;
      if (userStr) {
        if (typeof userStr === 'object' && userStr !== null) {
          userId = userStr.email || userStr._id || userStr.id || "";
          modifiedBy = userStr.name || userStr.displayName || userId;
        } else if (typeof userStr === 'string') {
          if (userStr.trim().startsWith('{') || userStr.trim().startsWith('[')) {
            try {
              const user = JSON.parse(userStr);
              userId = user?.email || user?._id || user?.id || "";
              modifiedBy = user?.name || user?.displayName || userId;
            } catch (e) {
              userId = userStr || "";
              modifiedBy = userId;
            }
          } else {
            userId = userStr || "";
            modifiedBy = userId;
          }
        } else {
          userId = "";
          modifiedBy = "";
        }
      }
    } catch (parseError) {
      console.warn("Error parsing user info, using fallback:", parseError);
      userId = "";
      modifiedBy = "";
    }
    
    const transferOrder = await TransferOrder.findByPk(id);
    
    if (!transferOrder) {
      return res.status(404).json({ message: "Transfer order not found" });
    }
    
    // Only allow receiving if status is "in_transit"
    if (transferOrder.status !== "in_transit") {
      return res.status(400).json({ 
        message: `Cannot receive transfer order. Current status is "${transferOrder.status}". Only orders with status "in_transit" can be received.` 
      });
    }
    
    // Check if stock was already transferred when order was created
    // If the order was created with "in_transit" status, stock might have been transferred already
    // We need to check if stock was already transferred by comparing current stock with expected stock
    const items = transferOrder.items || [];
    const stockUpdates = [];
    
    console.log(`\n=== RECEIVING TRANSFER ORDER ${id} ===`);
    console.log(`Source: ${transferOrder.sourceWarehouse} -> Destination: ${transferOrder.destinationWarehouse}`);
    console.log(`Items to transfer: ${items.length}`);
    console.log(`⚠️ IMPORTANT: Checking if stock was already transferred...`);
    
    for (const item of items) {
      try {
        console.log(`\nProcessing item: ${item.itemName} (Qty: ${item.quantity})`);
        
        // Get current stock in destination warehouse BEFORE any transfer
        const stockBeforeReceive = await getCurrentStock(
          item.itemId,
          transferOrder.destinationWarehouse,
          item.itemName,
          item.itemGroupId,
          item.itemSku
        );
        console.log(`  📊 Current stock in ${transferOrder.destinationWarehouse}: ${stockBeforeReceive.stockOnHand || 0}`);
        
        // Get current stock in source warehouse
        const sourceStockBefore = await getCurrentStock(
          item.itemId,
          transferOrder.sourceWarehouse,
          item.itemName,
          item.itemGroupId,
          item.itemSku
        );
        console.log(`  📊 Current stock in ${transferOrder.sourceWarehouse}: ${sourceStockBefore.stockOnHand || 0}`);
        
        // Transfer stock (this will subtract from source and add to destination)
        // Note: Stock should NOT have been transferred when order was created with "in_transit" status
        // Stock is only transferred when order is received (status changes to "transferred")
        const result = await transferItemStock(
          item.itemId,
          item.quantity,
          transferOrder.sourceWarehouse,
          transferOrder.destinationWarehouse,
          item.itemName,
          item.itemGroupId,
          item.itemSku
        );
        
        if (result.success) {
          // Get current stock after transfer
          const stockAfter = await getCurrentStock(
            item.itemId,
            transferOrder.destinationWarehouse,
            item.itemName,
            item.itemGroupId,
            item.itemSku
          );
          console.log(`  📊 Stock AFTER transfer in ${transferOrder.destinationWarehouse}: ${stockAfter.stockOnHand || 0}`);
          console.log(`  ✅ Added ${item.quantity} units (${stockBeforeReceive.stockOnHand || 0} → ${stockAfter.stockOnHand || 0})`);
          
          stockUpdates.push({
            itemName: item.itemName,
            itemSku: item.itemSku || item.itemId,
            quantity: item.quantity,
            destinationWarehouse: transferOrder.destinationWarehouse,
            stockBefore: stockBeforeReceive.stockOnHand || 0,
            stockAfter: stockAfter.stockOnHand || 0,
            status: "success"
          });
        } else {
          stockUpdates.push({
            itemName: item.itemName,
            quantity: item.quantity,
            status: "failed",
            error: result.message
          });
          console.warn(`❌ Failed to transfer stock for item ${item.itemName}:`, result.message);
        }
      } catch (stockError) {
        stockUpdates.push({
          itemName: item.itemName,
          quantity: item.quantity,
          status: "error",
          error: stockError.message
        });
        console.error(`❌ Error transferring stock for item ${item.itemName}:`, stockError);
      }
    }
    
    console.log(`\nStock transfer summary:`);
    stockUpdates.forEach(update => {
      if (update.status === "success") {
        console.log(`  ✅ ${update.itemName}: ${update.quantity} units added to ${transferOrder.destinationWarehouse}`);
      } else {
        console.log(`  ❌ ${update.itemName}: Failed - ${update.error || "Unknown error"}`);
      }
    });
    console.log(`=== END RECEIVING TRANSFER ORDER ===\n`);
    
    // Update status to transferred
    await transferOrder.update({
      status: "transferred",
      modifiedBy: modifiedBy || userId,
    });
    
    // Reload to get updated data
    await transferOrder.reload();
    
    res.status(200).json({
      message: "Transfer order received successfully",
      transferOrder,
      stockUpdates: stockUpdates // Include stock update details in response
    });
  } catch (error) {
    console.error("Error receiving transfer order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a transfer order
export const deleteTransferOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const transferOrder = await TransferOrder.findByPk(id);
    
    if (!transferOrder) {
      return res.status(404).json({ message: "Transfer order not found" });
    }
    
    // If status is "transferred", reverse the stock transfer before deleting
    if (transferOrder.status === "transferred") {
      const items = transferOrder.items || [];
      for (const item of items) {
        try {
          const result = await reverseTransferStock(
            item.itemId,
            item.quantity,
            transferOrder.sourceWarehouse,
            transferOrder.destinationWarehouse,
            item.itemName,
            item.itemGroupId,
            item.itemSku
          );
          if (!result.success) {
            console.warn(`Failed to reverse transfer stock for item ${item.itemName}:`, result.message);
          }
        } catch (stockError) {
          console.error(`Error reversing transfer stock for item ${item.itemName}:`, stockError);
        }
      }
    }
    
    await transferOrder.destroy();
    
    res.status(200).json({ message: "Transfer order deleted successfully" });
  } catch (error) {
    console.error("Error deleting transfer order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get current stock for an item in a warehouse (helper endpoint)
export const getItemStock = async (req, res) => {
  try {
    const { itemId, itemGroupId, itemName, itemSku, warehouse } = req.query;
    
    if (!warehouse) {
      return res.status(400).json({ message: "Warehouse is required" });
    }
    
    const stockInfo = await getCurrentStock(itemId, warehouse, itemName, itemGroupId, itemSku);
    
    res.status(200).json(stockInfo);
  } catch (error) {
    console.error("Error fetching item stock:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



