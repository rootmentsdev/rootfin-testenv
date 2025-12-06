// Updated to use PostgreSQL (Sequelize) instead of MongoDB
import { Op } from "sequelize";
import { InventoryAdjustment } from "../models/sequelize/index.js";
import ShoeItem from "../model/ShoeItem.js";
import ItemGroup from "../model/ItemGroup.js";

// Helper function to update warehouse stock for inventory adjustment
const adjustItemStock = async (itemIdValue, quantityAdjustment, warehouseName, itemName = null, itemGroupId = null, itemSku = null) => {
  const targetWarehouse = warehouseName?.trim() || "Warehouse";
  
  // Helper function to update warehouse stock
  const updateWarehouseStock = (warehouseStocks, qtyAdjustment, targetWarehouse) => {
    if (!warehouseStocks || warehouseStocks.length === 0) {
      // Create new warehouse entry
      return [{
        warehouse: targetWarehouse,
        openingStock: 0,
        openingStockValue: 0,
        stockOnHand: qtyAdjustment,
        committedStock: 0,
        availableForSale: qtyAdjustment,
        physicalOpeningStock: 0,
        physicalStockOnHand: qtyAdjustment,
        physicalCommittedStock: 0,
        physicalAvailableForSale: qtyAdjustment,
      }];
    }
    
    // Find the specific warehouse (case-insensitive match)
    let warehouseStock = warehouseStocks.find(ws => 
      ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === targetWarehouse.trim().toLowerCase()
    );
    
    if (!warehouseStock) {
      // Create new warehouse entry if it doesn't exist
      warehouseStock = {
        warehouse: targetWarehouse,
        openingStock: 0,
        openingStockValue: 0,
        stockOnHand: qtyAdjustment,
        committedStock: 0,
        availableForSale: qtyAdjustment,
        physicalOpeningStock: 0,
        physicalStockOnHand: qtyAdjustment,
        physicalCommittedStock: 0,
        physicalAvailableForSale: qtyAdjustment,
      };
      warehouseStocks.push(warehouseStock);
      return warehouseStocks;
    }
    
    const currentStockOnHand = parseFloat(warehouseStock.stockOnHand) || 0;
    const currentAvailableForSale = parseFloat(warehouseStock.availableForSale) || 0;
    const currentPhysicalStockOnHand = parseFloat(warehouseStock.physicalStockOnHand) || 0;
    const currentPhysicalAvailableForSale = parseFloat(warehouseStock.physicalAvailableForSale) || 0;
    
    // Apply adjustment (can be positive or negative)
    warehouseStock.stockOnHand = Math.max(0, currentStockOnHand + qtyAdjustment);
    warehouseStock.availableForSale = Math.max(0, currentAvailableForSale + qtyAdjustment);
    warehouseStock.physicalStockOnHand = Math.max(0, currentPhysicalStockOnHand + qtyAdjustment);
    warehouseStock.physicalAvailableForSale = Math.max(0, currentPhysicalAvailableForSale + qtyAdjustment);
    
    return warehouseStocks;
  };
  
  // If itemId is null but we have itemGroupId and itemName, use name-based search
  if ((!itemIdValue || itemIdValue === null || itemIdValue === "null") && itemGroupId && itemName) {
    return await adjustItemStockByName(itemGroupId, itemName, quantityAdjustment, targetWarehouse, itemSku);
  }
  
  // First, try to find as standalone item
  let shoeItem = null;
  if (itemIdValue && itemIdValue !== null && itemIdValue !== "null") {
    shoeItem = await ShoeItem.findById(itemIdValue);
  }
  
  if (shoeItem) {
    // Convert to plain object, modify, then update using $set (same fix as PurchaseReceiveController)
    const itemPlain = shoeItem.toObject();
    const oldStock = itemPlain.warehouseStocks?.find(ws => 
      ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === targetWarehouse.trim().toLowerCase()
    )?.stockOnHand || 0;
    
    if (!itemPlain.warehouseStocks || !Array.isArray(itemPlain.warehouseStocks)) {
      itemPlain.warehouseStocks = [];
    }
    
    // Find or create warehouse stock entry
    let wsEntry = itemPlain.warehouseStocks.find(ws => 
      ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === targetWarehouse.trim().toLowerCase()
    );
    
    if (!wsEntry) {
      wsEntry = {
        warehouse: targetWarehouse,
        openingStock: 0,
        openingStockValue: 0,
        stockOnHand: 0,
        committedStock: 0,
        availableForSale: 0,
        physicalOpeningStock: 0,
        physicalStockOnHand: 0,
        physicalCommittedStock: 0,
        physicalAvailableForSale: 0,
      };
      itemPlain.warehouseStocks.push(wsEntry);
    }
    
    // Update stock values
    const currentStock = parseFloat(wsEntry.stockOnHand) || 0;
    const newStock = Math.max(0, currentStock + quantityAdjustment);
    wsEntry.stockOnHand = newStock;
    wsEntry.availableForSale = Math.max(0, (parseFloat(wsEntry.availableForSale) || 0) + quantityAdjustment);
    wsEntry.physicalStockOnHand = Math.max(0, (parseFloat(wsEntry.physicalStockOnHand) || 0) + quantityAdjustment);
    wsEntry.physicalAvailableForSale = Math.max(0, (parseFloat(wsEntry.physicalAvailableForSale) || 0) + quantityAdjustment);
    wsEntry.warehouse = targetWarehouse;
    
    console.log(`   📊 Inventory adjustment: ${currentStock} ${quantityAdjustment >= 0 ? '+' : ''}${quantityAdjustment} = ${newStock}`);
    
    // Update using $set to replace entire warehouseStocks array
    const updatedItem = await ShoeItem.findByIdAndUpdate(
      itemIdValue,
      {
        $set: {
          warehouseStocks: itemPlain.warehouseStocks
        }
      },
      { new: true }
    );
    
    if (!updatedItem) {
      console.error(`❌ Failed to update standalone item stock`);
      return { success: false, message: "Failed to update stock" };
    }
    
    const updatedStock = updatedItem.warehouseStocks.find(ws => 
      ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === targetWarehouse.trim().toLowerCase()
    ) || updatedItem.warehouseStocks[0];
    
    return { 
      success: true, 
      type: 'standalone', 
      stock: updatedStock,
      newQuantity: updatedStock?.stockOnHand || 0
    };
  }
  
  // Item not found in standalone items, try to find in item groups
  if (itemGroupId && itemName) {
    const nameBasedResult = await adjustItemStockByName(itemGroupId, itemName, quantityAdjustment, targetWarehouse, itemSku);
    if (nameBasedResult.success) {
      return nameBasedResult;
    }
  }
  
  // Search all item groups if itemGroupId not provided
  let itemGroups = [];
  if (itemGroupId) {
    const group = await ItemGroup.findById(itemGroupId);
    if (group) itemGroups = [group];
  } else {
    itemGroups = await ItemGroup.find({});
  }
  
  for (const group of itemGroups) {
    const itemIndex = group.items.findIndex(item => {
      if (itemSku && item.sku) {
        return item.sku.toLowerCase() === itemSku.toLowerCase();
      }
      return item.name.toLowerCase() === itemName.toLowerCase();
    });
    
    if (itemIndex !== -1) {
      // Use the same fix - convert to plain object, modify, then update using $set
      const groupPlain = group.toObject();
      const itemPlain = groupPlain.items[itemIndex];
      
      if (!itemPlain.warehouseStocks) {
        itemPlain.warehouseStocks = [];
      }
      
      let wsEntry = itemPlain.warehouseStocks.find(ws => 
        ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === targetWarehouse.trim().toLowerCase()
      );
      
      if (!wsEntry) {
        wsEntry = {
          warehouse: targetWarehouse,
          openingStock: 0,
          openingStockValue: 0,
          stockOnHand: 0,
          committedStock: 0,
          availableForSale: 0,
          physicalOpeningStock: 0,
          physicalStockOnHand: 0,
          physicalCommittedStock: 0,
          physicalAvailableForSale: 0,
        };
        itemPlain.warehouseStocks.push(wsEntry);
      }
      
      // Update stock values
      const currentStock = parseFloat(wsEntry.stockOnHand) || 0;
      const newStock = Math.max(0, currentStock + quantityAdjustment);
      wsEntry.stockOnHand = newStock;
      wsEntry.availableForSale = Math.max(0, (parseFloat(wsEntry.availableForSale) || 0) + quantityAdjustment);
      wsEntry.physicalStockOnHand = Math.max(0, (parseFloat(wsEntry.physicalStockOnHand) || 0) + quantityAdjustment);
      wsEntry.physicalAvailableForSale = Math.max(0, (parseFloat(wsEntry.physicalAvailableForSale) || 0) + quantityAdjustment);
      wsEntry.warehouse = targetWarehouse;
      
      // Update using $set
      const updateResult = await ItemGroup.findByIdAndUpdate(
        group._id,
        {
          $set: {
            [`items.${itemIndex}`]: itemPlain
          }
        },
        { new: true }
      );
      
      if (updateResult) {
        // Reload to get actual saved values
        const savedGroup = await ItemGroup.findById(group._id);
        const savedItem = savedGroup.items[itemIndex];
        const savedStock = savedItem.warehouseStocks.find(ws => 
          ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === targetWarehouse.trim().toLowerCase()
        ) || savedItem.warehouseStocks[0];
        
        return { 
          success: true, 
          type: 'group', 
          stock: savedStock,
          groupName: group.name,
          itemName: itemPlain.name,
          newQuantity: savedStock?.stockOnHand || 0
        };
      }
    }
  }
  
  return { success: false, message: `Item "${itemName || itemIdValue}" not found` };
};

// Helper function to adjust stock by name (for items in groups)
const adjustItemStockByName = async (itemGroupId, itemName, quantityAdjustment, warehouseName, itemSku = null) => {
  if (!itemGroupId || !itemName) {
    return { success: false, message: "ItemGroupId and itemName are required" };
  }
  
  const targetWarehouse = warehouseName?.trim() || "Warehouse";
  const group = await ItemGroup.findById(itemGroupId);
  
  if (!group) {
    return { success: false, message: `Item group not found: ${itemGroupId}` };
  }
  
  const itemIndex = group.items.findIndex(item => {
    if (itemSku && item.sku) {
      return item.sku.toLowerCase() === itemSku.toLowerCase();
    }
    return item.name.toLowerCase() === itemName.toLowerCase();
  });
  
  if (itemIndex === -1) {
    return { success: false, message: `Item "${itemName}" not found in group "${group.name}"` };
  }
  
  const groupItem = group.items[itemIndex];
  
  const updateWarehouseStock = (warehouseStocks, qtyAdjustment, targetWarehouse) => {
    if (!warehouseStocks || warehouseStocks.length === 0) {
      return [{
        warehouse: targetWarehouse,
        openingStock: 0,
        openingStockValue: 0,
        stockOnHand: qtyAdjustment,
        committedStock: 0,
        availableForSale: qtyAdjustment,
        physicalOpeningStock: 0,
        physicalStockOnHand: qtyAdjustment,
        physicalCommittedStock: 0,
        physicalAvailableForSale: qtyAdjustment,
      }];
    }
    
    let warehouseStock = warehouseStocks.find(ws => 
      ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === targetWarehouse.trim().toLowerCase()
    );
    
    if (!warehouseStock) {
      warehouseStock = {
        warehouse: targetWarehouse,
        openingStock: 0,
        openingStockValue: 0,
        stockOnHand: qtyAdjustment,
        committedStock: 0,
        availableForSale: qtyAdjustment,
        physicalOpeningStock: 0,
        physicalStockOnHand: qtyAdjustment,
        physicalCommittedStock: 0,
        physicalAvailableForSale: qtyAdjustment,
      };
      warehouseStocks.push(warehouseStock);
      return warehouseStocks;
    }
    
    const currentStockOnHand = parseFloat(warehouseStock.stockOnHand) || 0;
    const currentAvailableForSale = parseFloat(warehouseStock.availableForSale) || 0;
    const currentPhysicalStockOnHand = parseFloat(warehouseStock.physicalStockOnHand) || 0;
    const currentPhysicalAvailableForSale = parseFloat(warehouseStock.physicalAvailableForSale) || 0;
    
    warehouseStock.stockOnHand = Math.max(0, currentStockOnHand + qtyAdjustment);
    warehouseStock.availableForSale = Math.max(0, currentAvailableForSale + qtyAdjustment);
    warehouseStock.physicalStockOnHand = Math.max(0, currentPhysicalStockOnHand + qtyAdjustment);
    warehouseStock.physicalAvailableForSale = Math.max(0, currentPhysicalAvailableForSale + qtyAdjustment);
    
    return warehouseStocks;
  };
  
  // Convert group to plain object, modify, then update using $set (same fix as PurchaseReceiveController)
  const groupPlain = group.toObject();
  const itemPlain = groupPlain.items[itemIndex];
  const oldStock = itemPlain.warehouseStocks?.find(ws => 
    ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === targetWarehouse.trim().toLowerCase()
  )?.stockOnHand || 0;
  
  // Find or create warehouse stock entry
  if (!itemPlain.warehouseStocks) {
    itemPlain.warehouseStocks = [];
  }
  
  let wsEntry = itemPlain.warehouseStocks.find(ws => 
    ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === targetWarehouse.trim().toLowerCase()
  );
  
  if (!wsEntry) {
    wsEntry = {
      warehouse: targetWarehouse,
      openingStock: 0,
      openingStockValue: 0,
      stockOnHand: 0,
      committedStock: 0,
      availableForSale: 0,
      physicalOpeningStock: 0,
      physicalStockOnHand: 0,
      physicalCommittedStock: 0,
      physicalAvailableForSale: 0,
    };
    itemPlain.warehouseStocks.push(wsEntry);
  }
  
  // Update stock values
  const currentStock = parseFloat(wsEntry.stockOnHand) || 0;
  const newStock = Math.max(0, currentStock + quantityAdjustment);
  wsEntry.stockOnHand = newStock;
  wsEntry.availableForSale = Math.max(0, (parseFloat(wsEntry.availableForSale) || 0) + quantityAdjustment);
  wsEntry.physicalStockOnHand = Math.max(0, (parseFloat(wsEntry.physicalStockOnHand) || 0) + quantityAdjustment);
  wsEntry.physicalAvailableForSale = Math.max(0, (parseFloat(wsEntry.physicalAvailableForSale) || 0) + quantityAdjustment);
  wsEntry.warehouse = targetWarehouse;
  
  console.log(`   📊 Inventory adjustment: ${currentStock} ${quantityAdjustment >= 0 ? '+' : ''}${quantityAdjustment} = ${newStock}`);
  
  // Update the entire items array using $set
  const updateResult = await ItemGroup.findByIdAndUpdate(
    itemGroupId,
    {
      $set: {
        [`items.${itemIndex}`]: itemPlain
      }
    },
    { new: true }
  );
  
  if (!updateResult) {
    console.error(`❌ Failed to update stock using findByIdAndUpdate`);
    return { success: false, message: "Failed to update stock" };
  }
  
  // Reload to get actual saved values
  const savedGroup = await ItemGroup.findById(itemGroupId);
  const savedItem = savedGroup.items[itemIndex];
  const savedStock = savedItem.warehouseStocks.find(ws => 
    ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === targetWarehouse.trim().toLowerCase()
  ) || savedItem.warehouseStocks[0];
  
  console.log(`   ✅ Stock updated successfully: ${savedStock?.stockOnHand || 0}`);
  
  return { 
    success: true, 
    type: 'group', 
    stock: savedStock,
    groupName: group.name,
    itemName: groupItem.name,
    newQuantity: savedStock?.stockOnHand || 0
  };
};

// Get current stock for an item
const getCurrentStock = async (itemIdValue, warehouseName, itemName = null, itemGroupId = null, itemSku = null) => {
  const targetWarehouse = warehouseName?.trim() || "Warehouse";
  
  // Try standalone item first
  if (itemIdValue && itemIdValue !== null && itemIdValue !== "null") {
    const shoeItem = await ShoeItem.findById(itemIdValue);
    if (shoeItem) {
      const warehouseStock = shoeItem.warehouseStocks?.find(ws => 
        ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === targetWarehouse.trim().toLowerCase()
      );
      return {
        success: true,
        currentQuantity: warehouseStock?.stockOnHand || 0,
        currentValue: (warehouseStock?.stockOnHand || 0) * (shoeItem.costPrice || 0),
      };
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
        const warehouseStock = item.warehouseStocks?.find(ws => 
          ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === targetWarehouse.trim().toLowerCase()
        );
        return {
          success: true,
          currentQuantity: warehouseStock?.stockOnHand || 0,
          currentValue: (warehouseStock?.stockOnHand || 0) * (item.costPrice || 0),
        };
      }
    }
  }
  
  return { success: false, currentQuantity: 0, currentValue: 0 };
};

// Create a new inventory adjustment
export const createInventoryAdjustment = async (req, res) => {
  try {
    const adjustmentData = req.body;
    
    // Safely parse user info
    let userId = "";
    let createdBy = "";
    try {
      const userStr = req.headers['user'] || req.body.userId;
      if (userStr) {
        // Check if it's already an object
        if (typeof userStr === 'object' && userStr !== null) {
          userId = userStr.email || userStr._id || userStr.id || adjustmentData.userId || "";
          createdBy = userStr.name || userStr.displayName || userId;
        } else if (typeof userStr === 'string') {
          // Check if it's a JSON string (starts with { or [)
          if (userStr.trim().startsWith('{') || userStr.trim().startsWith('[')) {
            try {
              const user = JSON.parse(userStr);
              userId = user?.email || user?._id || user?.id || adjustmentData.userId || "";
              createdBy = user?.name || user?.displayName || userId;
            } catch (e) {
              // If JSON parse fails, treat as plain string (email)
              userId = userStr || adjustmentData.userId || "";
              createdBy = userId;
            }
          } else {
            // It's a plain string (like an email), use it directly
            userId = userStr || adjustmentData.userId || "";
            createdBy = userId;
          }
        } else {
          userId = adjustmentData.userId || "";
          createdBy = userId;
        }
      } else {
        userId = adjustmentData.userId || "";
        createdBy = userId;
      }
    } catch (parseError) {
      console.warn("Error parsing user info, using fallback:", parseError);
      userId = adjustmentData.userId || "";
      createdBy = userId;
    }
    
    // Validate required fields
    if (!adjustmentData.date || !adjustmentData.warehouse || !adjustmentData.account || !adjustmentData.reason) {
      return res.status(400).json({ 
        message: "Missing required fields: date, warehouse, account, and reason are required" 
      });
    }
    
    // Validate adjustmentType
    if (adjustmentData.adjustmentType && !["quantity", "value"].includes(adjustmentData.adjustmentType)) {
      return res.status(400).json({ 
        message: "Invalid adjustmentType. Must be 'quantity' or 'value'" 
      });
    }
    
    // Validate status
    if (adjustmentData.status && !["draft", "adjusted"].includes(adjustmentData.status)) {
      return res.status(400).json({ 
        message: "Invalid status. Must be 'draft' or 'adjusted'" 
      });
    }
    
    // Validate userId
    if (!userId || userId === "") {
      return res.status(400).json({ 
        message: "User ID is required. Please ensure you are logged in." 
      });
    }
    
    // Parse date safely
    let adjustmentDate;
    try {
      if (adjustmentData.date instanceof Date) {
        adjustmentDate = adjustmentData.date;
      } else if (typeof adjustmentData.date === 'string') {
        adjustmentDate = new Date(adjustmentData.date);
        if (isNaN(adjustmentDate.getTime())) {
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
    let totalQuantityAdjusted = 0;
    let totalValueAdjusted = 0;
    const processedItems = [];
    
    // Validate items array
    if (!Array.isArray(adjustmentData.items) || adjustmentData.items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }
    
    for (const item of adjustmentData.items) {
      if (!item.itemName) continue;
      
      try {
        // Get current stock
        const stockInfo = await getCurrentStock(
          item.itemId || null,
          adjustmentData.warehouse,
          item.itemName,
          item.itemGroupId || null,
          item.itemSku || null
        );
        
        const currentQuantity = stockInfo.currentQuantity || 0;
        const currentValue = stockInfo.currentValue || 0;
        
        let newQuantity = currentQuantity;
        let newValue = currentValue;
        let quantityAdjusted = 0;
        let valueAdjusted = 0;
        
        if (adjustmentData.adjustmentType === "quantity") {
          quantityAdjusted = parseFloat(item.quantityAdjusted) || 0;
          newQuantity = Math.max(0, currentQuantity + quantityAdjusted);
          // For quantity adjustment, use current item cost if available
          const itemCost = parseFloat(item.unitCost) || 0;
          newValue = newQuantity * itemCost;
          totalQuantityAdjusted += Math.abs(quantityAdjusted);
        } else {
          // Value adjustment
          const unitCost = parseFloat(item.unitCost) || 0;
          const newQty = parseFloat(item.newQuantity) || currentQuantity;
          newQuantity = newQty;
          newValue = newQty * unitCost;
          valueAdjusted = newValue - currentValue;
          totalValueAdjusted += Math.abs(valueAdjusted);
        }
        
        // Store itemId and itemGroupId as strings (PostgreSQL doesn't use ObjectId)
        processedItems.push({
          itemId: item.itemId ? String(item.itemId) : null,
          itemGroupId: item.itemGroupId ? String(item.itemGroupId) : null,
          itemName: item.itemName,
          itemSku: item.itemSku || "",
          currentQuantity,
          currentValue,
          quantityAdjusted,
          newQuantity,
          unitCost: parseFloat(item.unitCost) || 0,
          valueAdjusted,
          newValue,
        });
      } catch (itemError) {
        console.error(`Error processing item ${item.itemName}:`, itemError);
        // Continue with other items, but log the error
      }
    }
    
    if (processedItems.length === 0) {
      return res.status(400).json({ message: "No valid items to process" });
    }
    
    // Create adjustment record in PostgreSQL
    const adjustment = await InventoryAdjustment.create({
      adjustmentType: adjustmentData.adjustmentType || "quantity",
      referenceNumber: adjustmentData.referenceNumber || "",
      date: adjustmentDate,
      account: adjustmentData.account,
      reason: adjustmentData.reason,
      branch: adjustmentData.branch || "Head Office",
      warehouse: adjustmentData.warehouse,
      description: adjustmentData.description || "",
      items: processedItems,
      totalQuantityAdjusted,
      totalValueAdjusted,
      userId, // Store the email/userId
      createdBy: userId || createdBy, // Store email/userId as createdBy
      status: adjustmentData.status || "draft",
      locCode: adjustmentData.locCode || "",
    });
    
    // If status is "adjusted", apply the adjustments to stock
    if (adjustment.status === "adjusted") {
      for (const item of processedItems) {
        if (adjustmentData.adjustmentType === "quantity" && item.quantityAdjusted !== 0) {
          try {
            const result = await adjustItemStock(
              item.itemId,
              item.quantityAdjusted,
              adjustmentData.warehouse,
              item.itemName,
              item.itemGroupId,
              item.itemSku
            );
            if (!result.success) {
              console.warn(`Failed to adjust stock for item ${item.itemName}:`, result.message);
            }
          } catch (stockError) {
            console.error(`Error adjusting stock for item ${item.itemName}:`, stockError);
            // Continue with other items
          }
        }
      }
    }
    
    res.status(201).json(adjustment);
  } catch (error) {
    console.error("Error creating inventory adjustment:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all inventory adjustments
export const getInventoryAdjustments = async (req, res) => {
  try {
    const { userId, userPower, warehouse, status, adjustmentType, startDate, endDate } = req.query;
    
    const where = {};
    
    if (userId) {
      where.userId = userId;
    }
    
    if (warehouse) {
      where.warehouse = warehouse;
    }
    
    if (status) {
      where.status = status;
    }
    
    if (adjustmentType) {
      where.adjustmentType = adjustmentType;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = new Date(startDate);
      if (endDate) where.date[Op.lte] = new Date(endDate);
    }
    
    const adjustments = await InventoryAdjustment.findAll({
      where,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: 1000,
    });
    
    // Transform to include both id and _id for compatibility
    const transformedAdjustments = adjustments.map(adj => {
      const adjData = adj.toJSON();
      return {
        ...adjData,
        _id: adjData.id, // Add _id for compatibility with frontend
      };
    });
    
    res.status(200).json(transformedAdjustments);
  } catch (error) {
    console.error("Error fetching inventory adjustments:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single inventory adjustment by ID
export const getInventoryAdjustmentById = async (req, res) => {
  try {
    const { id } = req.params;
    const adjustment = await InventoryAdjustment.findByPk(id);
    
    if (!adjustment) {
      return res.status(404).json({ message: "Inventory adjustment not found" });
    }
    
    // Transform to include both id and _id for compatibility
    const adjData = adjustment.toJSON();
    const transformedAdjustment = {
      ...adjData,
      _id: adjData.id, // Add _id for compatibility with frontend
    };
    
    res.status(200).json(transformedAdjustment);
  } catch (error) {
    console.error("Error fetching inventory adjustment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update an inventory adjustment
export const updateInventoryAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    const adjustmentData = req.body;
    
    // Safely parse user info (same logic as createInventoryAdjustment)
    let userId = "";
    let modifiedBy = "";
    try {
      const userStr = req.headers['user'] || req.body.userId;
      if (userStr) {
        // Check if it's already an object
        if (typeof userStr === 'object' && userStr !== null) {
          userId = userStr.email || userStr._id || userStr.id || adjustmentData.userId || "";
          modifiedBy = userStr.name || userStr.displayName || userId;
        } else if (typeof userStr === 'string') {
          // Check if it's a JSON string (starts with { or [)
          if (userStr.trim().startsWith('{') || userStr.trim().startsWith('[')) {
            try {
              const user = JSON.parse(userStr);
              userId = user?.email || user?._id || user?.id || adjustmentData.userId || "";
              modifiedBy = user?.name || user?.displayName || userId;
            } catch (e) {
              // If JSON parse fails, treat as plain string (email)
              userId = userStr || adjustmentData.userId || "";
              modifiedBy = userId;
            }
          } else {
            // It's a plain string (like an email), use it directly
            userId = userStr || adjustmentData.userId || "";
            modifiedBy = userId;
          }
        } else {
          userId = adjustmentData.userId || "";
          modifiedBy = userId;
        }
      } else {
        userId = adjustmentData.userId || "";
        modifiedBy = userId;
      }
    } catch (parseError) {
      console.warn("Error parsing user info, using fallback:", parseError);
      userId = adjustmentData.userId || "";
      modifiedBy = userId;
    }
    
    const existingAdjustment = await InventoryAdjustment.findByPk(id);
    if (!existingAdjustment) {
      return res.status(404).json({ message: "Inventory adjustment not found" });
    }
    
    // If changing from draft to adjusted, apply stock changes
    if (existingAdjustment.status === "draft" && adjustmentData.status === "adjusted") {
      const items = existingAdjustment.items || [];
      for (const item of items) {
        if (existingAdjustment.adjustmentType === "quantity" && item.quantityAdjusted !== 0) {
          await adjustItemStock(
            item.itemId,
            item.quantityAdjusted,
            adjustmentData.warehouse || existingAdjustment.warehouse,
            item.itemName,
            item.itemGroupId,
            item.itemSku
          );
        }
      }
    }
    
    // If changing from adjusted to draft, reverse stock changes
    if (existingAdjustment.status === "adjusted" && adjustmentData.status === "draft") {
      const items = existingAdjustment.items || [];
      for (const item of items) {
        if (existingAdjustment.adjustmentType === "quantity" && item.quantityAdjusted !== 0) {
          // Reverse the adjustment
          await adjustItemStock(
            item.itemId,
            -item.quantityAdjusted,
            existingAdjustment.warehouse,
            item.itemName,
            item.itemGroupId,
            item.itemSku
          );
        }
      }
    }
    
    // Update the adjustment - ensure modifiedBy is set to the email/userId
    const updateData = {
      ...adjustmentData,
      modifiedBy: userId || modifiedBy, // Use userId (email) as modifiedBy
    };
    
    await existingAdjustment.update(updateData);
    
    // Reload to get updated data
    await existingAdjustment.reload();
    
    res.status(200).json(existingAdjustment);
  } catch (error) {
    console.error("Error updating inventory adjustment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete an inventory adjustment
export const deleteInventoryAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    const adjustment = await InventoryAdjustment.findByPk(id);
    
    if (!adjustment) {
      return res.status(404).json({ message: "Inventory adjustment not found" });
    }
    
    // If status is "adjusted", reverse the stock changes before deleting
    if (adjustment.status === "adjusted") {
      const items = adjustment.items || [];
      for (const item of items) {
        if (adjustment.adjustmentType === "quantity" && item.quantityAdjusted !== 0) {
          // Reverse the adjustment
          await adjustItemStock(
            item.itemId,
            -item.quantityAdjusted,
            adjustment.warehouse,
            item.itemName,
            item.itemGroupId,
            item.itemSku
          );
        }
      }
    }
    
    await adjustment.destroy();
    
    res.status(200).json({ message: "Inventory adjustment deleted successfully" });
  } catch (error) {
    console.error("Error deleting inventory adjustment:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get current stock for an item (helper endpoint)
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
