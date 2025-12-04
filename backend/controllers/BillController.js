import Bill from "../model/Bill.js";
import ShoeItem from "../model/ShoeItem.js";
import ItemGroup from "../model/ItemGroup.js";
import { Vendor } from "../models/sequelize/index.js";
import mongoose from "mongoose";
import { logVendorActivity, getOriginatorName } from "../utils/vendorHistoryLogger.js";

// Helper function to add stock for items in bills (similar to purchase receive)
const addItemStock = async (itemIdValue, quantity, warehouseName, itemName = null, itemGroupId = null, itemSku = null) => {
  // Use default warehouse if not provided
  const targetWarehouse = warehouseName?.trim() || "Warehouse";
  
  // Helper function to update warehouse stock (add)
  const updateWarehouseStock = (warehouseStocks, qty, targetWarehouse) => {
    if (!warehouseStocks || warehouseStocks.length === 0) {
      return [{
        warehouse: targetWarehouse,
        openingStock: 0,
        openingStockValue: 0,
        stockOnHand: qty,
        committedStock: 0,
        availableForSale: qty,
        physicalOpeningStock: 0,
        physicalStockOnHand: qty,
        physicalCommittedStock: 0,
        physicalAvailableForSale: qty,
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
        stockOnHand: 0,
        committedStock: 0,
        availableForSale: 0,
        physicalOpeningStock: 0,
        physicalStockOnHand: 0,
        physicalCommittedStock: 0,
        physicalAvailableForSale: 0,
      };
      warehouseStocks.push(warehouseStock);
    }
    
    const currentStockOnHand = parseFloat(warehouseStock.stockOnHand) || 0;
    const currentAvailableForSale = parseFloat(warehouseStock.availableForSale) || 0;
    const currentPhysicalStockOnHand = parseFloat(warehouseStock.physicalStockOnHand) || 0;
    const currentPhysicalAvailableForSale = parseFloat(warehouseStock.physicalAvailableForSale) || 0;
    
    warehouseStock.warehouse = targetWarehouse;
    
    // Add stock (bill increases inventory)
    warehouseStock.stockOnHand = currentStockOnHand + qty;
    warehouseStock.availableForSale = currentAvailableForSale + qty;
    warehouseStock.physicalStockOnHand = currentPhysicalStockOnHand + qty;
    warehouseStock.physicalAvailableForSale = currentPhysicalAvailableForSale + qty;
    
    return warehouseStocks;
  };
  
  // If itemId is null but we have itemGroupId and itemName, use name-based search
  if ((!itemIdValue || itemIdValue === null || itemIdValue === "null") && itemGroupId && itemName) {
    return await addItemStockByName(itemGroupId, itemName, quantity, targetWarehouse, itemSku);
  }
  
  // First, try to find as standalone item
  let shoeItem = null;
  if (itemIdValue && itemIdValue !== null && itemIdValue !== "null") {
    shoeItem = await ShoeItem.findById(itemIdValue);
  }
  
  if (shoeItem) {
    shoeItem.warehouseStocks = updateWarehouseStock(shoeItem.warehouseStocks, quantity, targetWarehouse);
    await shoeItem.save();
    console.log(`✅ Added stock for standalone item: ${itemName || itemIdValue}, Quantity: ${quantity}, Warehouse: ${targetWarehouse}`);
    return { success: true, type: 'standalone', warehouse: targetWarehouse };
  }
  
  // Item not found in standalone items, try to find in item groups
  if (itemGroupId && itemName) {
    const nameBasedResult = await addItemStockByName(itemGroupId, itemName, quantity, targetWarehouse, itemSku);
    if (nameBasedResult.success) {
      return nameBasedResult;
    }
  }
  
  let itemGroups = [];
  if (itemGroupId) {
    const specificGroup = await ItemGroup.findById(itemGroupId);
    if (specificGroup && specificGroup.isActive !== false) {
      itemGroups = [specificGroup];
    }
  }
  
  if (itemGroups.length === 0) {
    itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
  }
  
  // Search through groups
  for (const group of itemGroups) {
    if (!group.items || !Array.isArray(group.items)) continue;
    
    for (let i = 0; i < group.items.length; i++) {
      const groupItem = group.items[i];
      const groupItemId = groupItem._id?.toString() || groupItem.id?.toString();
      const compositeId = `${group._id}_${i}`;
      
      const itemIdStr = itemIdValue?.toString() || "";
      const idMatches = 
        itemIdStr === groupItemId ||
        itemIdStr === compositeId ||
        itemIdStr.includes(groupItemId) ||
        groupItemId?.includes(itemIdStr);
      
      const nameMatches = itemName && groupItem.name && 
        groupItem.name.toLowerCase().trim() === itemName.toLowerCase().trim();
      
      const skuMatches = itemSku && groupItem.sku && 
        groupItem.sku.toLowerCase().trim() === itemSku.toLowerCase().trim();
      
      if (idMatches || nameMatches || skuMatches) {
        groupItem.warehouseStocks = updateWarehouseStock(groupItem.warehouseStocks || [], quantity, targetWarehouse);
        group.items[i] = groupItem;
        group.markModified('items');
        await group.save();
        console.log(`✅ Added stock for item in group: ${groupItem.name} (Group: ${group.name}), Quantity: ${quantity}, Warehouse: ${targetWarehouse}`);
        return { success: true, type: 'group', groupName: group.name, itemName: groupItem.name, warehouse: targetWarehouse };
      }
    }
  }
  
  console.warn(`⚠️ Item with ID ${itemIdValue} not found for stock addition`);
  return { success: false, message: `Item with ID ${itemIdValue} not found` };
};

// Helper function to add stock by name and SKU (when itemId is null)
const addItemStockByName = async (itemGroupId, itemName, quantity, warehouseName, itemSku = null) => {
  if (!itemGroupId || !itemName) {
    return { success: false, message: "itemGroupId and itemName are required when itemId is null" };
  }
  
  const targetWarehouse = warehouseName?.trim() || "Warehouse";
  const group = await ItemGroup.findById(itemGroupId);
  if (!group || group.isActive === false) {
    return { success: false, message: `Item group ${itemGroupId} not found or inactive` };
  }
  
  if (!group.items || !Array.isArray(group.items)) {
    return { success: false, message: `Item group ${itemGroupId} has no items` };
  }
  
  // Find item by name and SKU
  let itemIndex = -1;
  if (itemSku) {
    itemIndex = group.items.findIndex(gi => {
      const nameMatch = gi.name && gi.name.trim() === itemName.trim();
      const skuMatch = gi.sku && gi.sku.trim() === itemSku.trim();
      return nameMatch && skuMatch;
    });
    
    if (itemIndex === -1) {
      itemIndex = group.items.findIndex(gi => gi.name && gi.name.trim() === itemName.trim());
    }
  } else {
    itemIndex = group.items.findIndex(gi => gi.name && gi.name.trim() === itemName.trim());
  }
  
  if (itemIndex === -1) {
    return { success: false, message: `Item with name "${itemName}"${itemSku ? ` and SKU "${itemSku}"` : ''} not found in group` };
  }
  
  const groupItem = group.items[itemIndex];
  
  // Helper function to update warehouse stock
  const updateWarehouseStock = (warehouseStocks, qty, targetWarehouse) => {
    if (!warehouseStocks || warehouseStocks.length === 0) {
      return [{
        warehouse: targetWarehouse,
        openingStock: 0,
        openingStockValue: 0,
        stockOnHand: qty,
        committedStock: 0,
        availableForSale: qty,
        physicalOpeningStock: 0,
        physicalStockOnHand: qty,
        physicalCommittedStock: 0,
        physicalAvailableForSale: qty,
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
        stockOnHand: 0,
        committedStock: 0,
        availableForSale: 0,
        physicalOpeningStock: 0,
        physicalStockOnHand: 0,
        physicalCommittedStock: 0,
        physicalAvailableForSale: 0,
      };
      warehouseStocks.push(warehouseStock);
    }
    
    const currentStockOnHand = parseFloat(warehouseStock.stockOnHand) || 0;
    const currentAvailableForSale = parseFloat(warehouseStock.availableForSale) || 0;
    const currentPhysicalStockOnHand = parseFloat(warehouseStock.physicalStockOnHand) || 0;
    const currentPhysicalAvailableForSale = parseFloat(warehouseStock.physicalAvailableForSale) || 0;
    
    warehouseStock.warehouse = targetWarehouse;
    warehouseStock.stockOnHand = currentStockOnHand + qty;
    warehouseStock.availableForSale = currentAvailableForSale + qty;
    warehouseStock.physicalStockOnHand = currentPhysicalStockOnHand + qty;
    warehouseStock.physicalAvailableForSale = currentPhysicalAvailableForSale + qty;
    
    return warehouseStocks;
  };
  
  groupItem.warehouseStocks = updateWarehouseStock(groupItem.warehouseStocks || [], quantity, targetWarehouse);
  group.items[itemIndex] = groupItem;
  group.markModified('items');
  await group.save();
  
  console.log(`✅ Added stock for item "${groupItem.name}" in group "${group.name}"`);
  return { success: true, type: 'group', stock: groupItem.warehouseStocks, groupName: group.name, itemName: groupItem.name, warehouse: targetWarehouse };
};

// Helper function to reduce stock (for reversing bills)
const reduceItemStock = async (itemIdValue, quantity, warehouseName, itemName = null, itemGroupId = null, itemSku = null) => {
  const targetWarehouse = warehouseName?.trim() || "Warehouse";
  
  const updateWarehouseStock = (warehouseStocks, qty, targetWarehouse) => {
    if (!warehouseStocks || warehouseStocks.length === 0) {
      return { success: false, message: `No stock found in warehouse "${targetWarehouse}"` };
    }
    
    let warehouseStock = warehouseStocks.find(ws => 
      ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === targetWarehouse.trim().toLowerCase()
    );
    
    if (!warehouseStock) {
      return { success: false, message: `Warehouse "${targetWarehouse}" not found for this item` };
    }
    
    const currentStockOnHand = parseFloat(warehouseStock.stockOnHand) || 0;
    const currentAvailableForSale = parseFloat(warehouseStock.availableForSale) || 0;
    const currentPhysicalStockOnHand = parseFloat(warehouseStock.physicalStockOnHand) || 0;
    const currentPhysicalAvailableForSale = parseFloat(warehouseStock.physicalAvailableForSale) || 0;
    
    if (currentStockOnHand < qty) {
      return { 
        success: false, 
        message: `Insufficient stock in warehouse "${targetWarehouse}". Available: ${currentStockOnHand}, Required: ${qty}` 
      };
    }
    
    warehouseStock.stockOnHand = Math.max(0, currentStockOnHand - qty);
    warehouseStock.availableForSale = Math.max(0, currentAvailableForSale - qty);
    warehouseStock.physicalStockOnHand = Math.max(0, currentPhysicalStockOnHand - qty);
    warehouseStock.physicalAvailableForSale = Math.max(0, currentPhysicalAvailableForSale - qty);
    
    return { success: true, warehouseStocks };
  };
  
  // If itemId is null, use name-based search
  if ((!itemIdValue || itemIdValue === null || itemIdValue === "null") && itemGroupId && itemName) {
    return await reduceItemStockByName(itemGroupId, itemName, quantity, targetWarehouse, itemSku);
  }
  
  let shoeItem = null;
  if (itemIdValue && itemIdValue !== null && itemIdValue !== "null") {
    shoeItem = await ShoeItem.findById(itemIdValue);
  }
  
  if (shoeItem) {
    const result = updateWarehouseStock(shoeItem.warehouseStocks, quantity, targetWarehouse);
    if (!result.success) return result;
    shoeItem.warehouseStocks = result.warehouseStocks;
    await shoeItem.save();
    return { success: true, type: 'standalone', warehouse: targetWarehouse };
  }
  
  if (itemGroupId && itemName) {
    const nameBasedResult = await reduceItemStockByName(itemGroupId, itemName, quantity, targetWarehouse, itemSku);
    if (nameBasedResult.success) return nameBasedResult;
  }
  
  let itemGroups = [];
  if (itemGroupId) {
    const specificGroup = await ItemGroup.findById(itemGroupId);
    if (specificGroup && specificGroup.isActive !== false) {
      itemGroups = [specificGroup];
    }
  }
  
  if (itemGroups.length === 0) {
    itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
  }
  
  for (const group of itemGroups) {
    if (!group.items || !Array.isArray(group.items)) continue;
    
    for (let i = 0; i < group.items.length; i++) {
      const groupItem = group.items[i];
      const groupItemId = groupItem._id?.toString() || groupItem.id?.toString();
      const compositeId = `${group._id}_${i}`;
      
      const itemIdStr = itemIdValue?.toString() || "";
      const idMatches = 
        itemIdStr === groupItemId ||
        itemIdStr === compositeId ||
        itemIdStr.includes(groupItemId) ||
        groupItemId?.includes(itemIdStr);
      
      const nameMatches = itemName && groupItem.name && 
        groupItem.name.toLowerCase().trim() === itemName.toLowerCase().trim();
      
      const skuMatches = itemSku && groupItem.sku && 
        groupItem.sku.toLowerCase().trim() === itemSku.toLowerCase().trim();
      
      if (idMatches || nameMatches || skuMatches) {
        const result = updateWarehouseStock(groupItem.warehouseStocks || [], quantity, targetWarehouse);
        if (!result.success) return result;
        groupItem.warehouseStocks = result.warehouseStocks;
        group.items[i] = groupItem;
        group.markModified('items');
        await group.save();
        return { success: true, type: 'group', groupName: group.name, itemName: groupItem.name, warehouse: targetWarehouse };
      }
    }
  }
  
  return { success: false, message: `Item with ID ${itemIdValue} not found` };
};

// Helper function to reduce stock by name (for reversing)
const reduceItemStockByName = async (itemGroupId, itemName, quantity, warehouseName, itemSku = null) => {
  if (!itemGroupId || !itemName) {
    return { success: false, message: "itemGroupId and itemName are required" };
  }
  
  const targetWarehouse = warehouseName?.trim() || "Warehouse";
  const group = await ItemGroup.findById(itemGroupId);
  if (!group || group.isActive === false) {
    return { success: false, message: `Item group ${itemGroupId} not found or inactive` };
  }
  
  if (!group.items || !Array.isArray(group.items)) {
    return { success: false, message: `Item group ${itemGroupId} has no items` };
  }
  
  let itemIndex = -1;
  if (itemSku) {
    itemIndex = group.items.findIndex(gi => {
      const nameMatch = gi.name && gi.name.trim() === itemName.trim();
      const skuMatch = gi.sku && gi.sku.trim() === itemSku.trim();
      return nameMatch && skuMatch;
    });
    
    if (itemIndex === -1) {
      itemIndex = group.items.findIndex(gi => gi.name && gi.name.trim() === itemName.trim());
    }
  } else {
    itemIndex = group.items.findIndex(gi => gi.name && gi.name.trim() === itemName.trim());
  }
  
  if (itemIndex === -1) {
    return { success: false, message: `Item with name "${itemName}"${itemSku ? ` and SKU "${itemSku}"` : ''} not found in group` };
  }
  
  const groupItem = group.items[itemIndex];
  
  const updateWarehouseStock = (warehouseStocks, qty, targetWarehouse) => {
    if (!warehouseStocks || warehouseStocks.length === 0) {
      return { success: false, message: `No stock found in warehouse "${targetWarehouse}"` };
    }
    
    let warehouseStock = warehouseStocks.find(ws => 
      ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === targetWarehouse.trim().toLowerCase()
    );
    
    if (!warehouseStock) {
      return { success: false, message: `Warehouse "${targetWarehouse}" not found for this item` };
    }
    
    const currentStockOnHand = parseFloat(warehouseStock.stockOnHand) || 0;
    const currentAvailableForSale = parseFloat(warehouseStock.availableForSale) || 0;
    const currentPhysicalStockOnHand = parseFloat(warehouseStock.physicalStockOnHand) || 0;
    const currentPhysicalAvailableForSale = parseFloat(warehouseStock.physicalAvailableForSale) || 0;
    
    if (currentStockOnHand < qty) {
      return { 
        success: false, 
        message: `Insufficient stock in warehouse "${targetWarehouse}". Available: ${currentStockOnHand}, Required: ${qty}` 
      };
    }
    
    warehouseStock.stockOnHand = Math.max(0, currentStockOnHand - qty);
    warehouseStock.availableForSale = Math.max(0, currentAvailableForSale - qty);
    warehouseStock.physicalStockOnHand = Math.max(0, currentPhysicalStockOnHand - qty);
    warehouseStock.physicalAvailableForSale = Math.max(0, currentPhysicalAvailableForSale - qty);
    
    return { success: true, warehouseStocks };
  };
  
  const result = updateWarehouseStock(groupItem.warehouseStocks || [], quantity, targetWarehouse);
  if (!result.success) return result;
  
  groupItem.warehouseStocks = result.warehouseStocks;
  group.items[itemIndex] = groupItem;
  group.markModified('items');
  await group.save();
  
  return { success: true, type: 'group', stock: groupItem.warehouseStocks, groupName: group.name, itemName: groupItem.name, warehouse: targetWarehouse };
};

// Helper function to update vendor balance (increase payables)
const updateVendorBalance = async (vendorId, billAmount, operation = 'add') => {
  try {
    if (!vendorId) return { success: false, message: "Vendor ID is required" };
    
    // Find vendor in PostgreSQL
    const vendor = await Vendor.findByPk(vendorId);
    if (!vendor) {
      // Try MongoDB as fallback
      const VendorMongo = mongoose.model("Vendor", new mongoose.Schema({}, { strict: false }));
      const vendorMongo = await VendorMongo.findById(vendorId);
      if (!vendorMongo) {
        return { success: false, message: "Vendor not found" };
      }
      
      const currentPayables = parseFloat(vendorMongo.payables) || 0;
      
      if (operation === 'add') {
        vendorMongo.payables = currentPayables + billAmount;
      } else if (operation === 'subtract') {
        vendorMongo.payables = Math.max(0, currentPayables - billAmount);
      }
      
      await vendorMongo.save();
      return { success: true, type: 'mongodb' };
    }
    
    // Update PostgreSQL vendor
    const currentPayables = parseFloat(vendor.payables) || 0;
    
    if (operation === 'add') {
      vendor.payables = currentPayables + billAmount;
    } else if (operation === 'subtract') {
      vendor.payables = Math.max(0, currentPayables - billAmount);
    }
    
    await vendor.save();
    return { success: true, type: 'postgresql' };
  } catch (error) {
    console.error("Error updating vendor balance:", error);
    return { success: false, message: error.message };
  }
};

// Create a new bill
export const createBill = async (req, res) => {
  try {
    const billData = req.body;
    
    // Validate required fields
    if (!billData.billNumber || !billData.vendorName || !billData.userId) {
      return res.status(400).json({ message: "Bill number, vendor name, and userId are required" });
    }
    
    // vendorId is now a UUID string from PostgreSQL Vendor (optional field)
    if (!billData.vendorId) {
      billData.vendorId = null;
    }
    
    // Make billNumber unique per user (email) instead of globally unique
    const existingBill = await Bill.findOne({ 
      billNumber: billData.billNumber,
      userId: billData.userId
    });
    
    if (existingBill) {
      return res.status(409).json({ message: "Bill number already exists for this user" });
    }
    
    const bill = await Bill.create(billData);
    
    // Log vendor activity for bill creation
    if (billData.vendorId) {
      const formatCurrency = (value) => {
        if (!value && value !== 0) return "0.00";
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 2,
        }).format(value).replace("₹", "₹").replace(/\s/g, "");
      };
      
      const originator = getOriginatorName(
        billData.warehouse,
        billData.branch,
        { locName: billData.locCode }
      );
      
      await logVendorActivity({
        vendorId: billData.vendorId,
        eventType: "BILL_ADDED",
        title: "Bill added",
        description: `Bill ${billData.billNumber} of amount ${formatCurrency(billData.finalTotal || 0)} created by ${originator}`,
        originator: originator,
        relatedEntityId: bill._id.toString(),
        relatedEntityType: "bill",
        metadata: {
          billNumber: billData.billNumber,
          amount: billData.finalTotal || 0,
          status: billData.status || "draft",
        },
        changedBy: billData.userId || "",
      });
    }
    
    // If status is "open", process the bill (add stock and update vendor balance)
    // IMPORTANT: If bill is from Purchase Receive, stock was already added at Receive stage
    // So we should NOT add stock again - only update vendor balance
    if (billData.status === "open" && billData.finalTotal > 0) {
      const sourceType = billData.sourceType || "direct";
      
      // Only add stock for Direct Bills
      // IMPORTANT: 
      // - PO → Bill: Does NOT add stock (stock will be added when Receive is created)
      // - PO → Receive → Bill: Does NOT add stock (already added at Receive stage)
      // - Direct Bill: Adds stock (manual entry, no PO/Receive)
      if (sourceType === "direct") {
        // Use default warehouse if not provided
        const warehouseName = billData.warehouse?.trim() || "Warehouse";
        
        console.log(`📦 Processing Direct Bill with status "open" - adding stock for items to warehouse: ${warehouseName}`);
        
        // Add stock for items (if any) - only to the selected warehouse
        if (billData.items && Array.isArray(billData.items) && billData.items.length > 0) {
        console.log(`   Found ${billData.items.length} items to process`);
        const stockAdditionErrors = [];
        
        for (const item of billData.items) {
          if (item.quantity && parseFloat(item.quantity) > 0) {
            try {
              console.log(`   🔍 Processing item for stock addition:`);
              console.log(`      - Item ID: ${item.itemId}`);
              console.log(`      - Item Name: ${item.itemName}`);
              console.log(`      - Item Group ID: ${item.itemGroupId || 'none'}`);
              console.log(`      - Item SKU: ${item.itemSku || 'none'}`);
              console.log(`      - Quantity: ${item.quantity}`);
              console.log(`      - Warehouse: ${warehouseName}`);
              
              const result = await addItemStock(
                item.itemId,
                parseFloat(item.quantity),
                warehouseName,
                item.itemName,
                item.itemGroupId,
                item.itemSku
              );
              if (result.success) {
                console.log(`   ✅ Successfully added stock for ${item.itemName || item.itemId} to ${warehouseName}`);
                if (result.type === 'group') {
                  console.log(`      - Group: ${result.groupName}`);
                }
              } else {
                const errorMsg = `Item ${item.itemName || item.itemId}: ${result.message}`;
                console.warn(`   ⚠️ Failed to add stock: ${errorMsg}`);
                stockAdditionErrors.push(errorMsg);
              }
            } catch (error) {
              const errorMsg = `Item ${item.itemName || item.itemId}: ${error.message}`;
              console.error(`   ❌ Error adding stock for item ${item.itemName}:`, error);
              stockAdditionErrors.push(errorMsg);
            }
          }
        }
        
        // If there are stock addition errors, log them but don't fail the bill creation
        // (unlike vendor credits, bills can be created even if stock update fails)
        if (stockAdditionErrors.length > 0) {
          console.warn(`⚠️ Some items failed to update stock, but bill was created:`, stockAdditionErrors);
        }
        } else {
          console.log(`   No items found in bill - skipping stock addition`);
        }
      } else if (sourceType === "from_po") {
        console.log(`📦 Processing bill from Purchase Order - skipping stock addition (stock will be added when Receive is created)`);
      } else if (sourceType === "from_receive") {
        console.log(`📦 Processing bill from Purchase Receive - skipping stock addition (already added at Receive stage)`);
      }
      
      // Update vendor balance (increase payables) - always do this for "open" bills
      if (billData.vendorId) {
        await updateVendorBalance(billData.vendorId, billData.finalTotal, 'add');
        console.log(`✅ Updated vendor balance - increased payables by ${billData.finalTotal}`);
      }
    }
    
    res.status(201).json(bill);
  } catch (error) {
    console.error("Create bill error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      keyValue: error.keyValue,
      errors: error.errors
    });
    
    if (error.code === 11000) {
      return res.status(409).json({ message: "Bill number already exists" });
    }
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(e => e.message).join(", ");
      return res.status(400).json({ message: "Validation error", error: errors });
    }
    
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all bills for a user
export const getBills = async (req, res) => {
  try {
    const { userId, userPower, status } = req.query;
    
    const query = {};
    
    // Filter by user email only - admin users see all data
    const isAdmin = userPower && (userPower.toLowerCase() === 'admin' || userPower.toLowerCase() === 'super_admin');
    
    if (!isAdmin && userId) {
      const userIdStr = userId.toString();
      // Use email as primary identifier - case insensitive match
      if (userIdStr.includes('@')) {
        query.userId = { $regex: `^${userIdStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
      } else {
        query.userId = userIdStr;
      }
    }
    // If admin, no userId filter - show all bills
    
    if (status) query.status = status;
    
    const bills = await Bill.find(query)
      .sort({ createdAt: -1 });
    res.status(200).json(bills);
  } catch (error) {
    console.error("Get bills error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single bill by ID
export const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findById(id);
    
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    
    res.status(200).json(bill);
  } catch (error) {
    console.error("Get bill error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a bill
export const updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const billData = req.body;
    
    // Get existing bill to check status changes
    const existingBill = await Bill.findById(id);
    if (!existingBill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    
    const oldStatus = existingBill.status;
    const newStatus = billData.status || oldStatus;
    const oldFinalTotal = parseFloat(existingBill.finalTotal) || 0;
    const newFinalTotal = parseFloat(billData.finalTotal) || oldFinalTotal;
    const warehouseName = billData.warehouse?.trim() || existingBill.warehouse?.trim() || "Warehouse";
    const sourceType = billData.sourceType || existingBill.sourceType || "direct";
    
    // Handle status changes and reversals
    // IMPORTANT: Only add/reduce stock for Direct Bills
    // PO → Bill and PO → Receive → Bill should NOT affect stock
    
    // If changing from "open" to "draft", reverse stock and vendor balance
    if (oldStatus === "open" && newStatus === "draft") {
      // Only reverse stock for Direct Bills
      if (sourceType === "direct" && existingBill.items && Array.isArray(existingBill.items)) {
        console.log(`📦 Reversing stock for Direct Bill (changing from open to draft)`);
        for (const item of existingBill.items) {
          if (item.quantity && parseFloat(item.quantity) > 0) {
            try {
              await reduceItemStock(
                item.itemId,
                parseFloat(item.quantity),
                warehouseName,
                item.itemName,
                item.itemGroupId,
                item.itemSku
              );
            } catch (error) {
              console.error(`Error reversing stock for item ${item.itemName}:`, error);
            }
          }
        }
      } else {
        console.log(`📦 Skipping stock reversal (bill is from ${sourceType}, stock not managed here)`);
      }
      
      // Reverse vendor balance (reduce payables) - always do this
      if (existingBill.vendorId) {
        await updateVendorBalance(existingBill.vendorId, oldFinalTotal, 'subtract');
      }
    }
    
    // If changing from "draft" to "open", process the bill
    if (oldStatus === "draft" && newStatus === "open" && newFinalTotal > 0) {
      // Only add stock for Direct Bills
      if (sourceType === "direct") {
        console.log(`📦 Adding stock for Direct Bill (changing from draft to open)`);
        const itemsToProcess = billData.items || existingBill.items || [];
        if (Array.isArray(itemsToProcess) && itemsToProcess.length > 0) {
          for (const item of itemsToProcess) {
            if (item.quantity && parseFloat(item.quantity) > 0) {
              try {
                await addItemStock(
                  item.itemId,
                  parseFloat(item.quantity),
                  warehouseName,
                  item.itemName,
                  item.itemGroupId,
                  item.itemSku
                );
              } catch (error) {
                console.error(`Error adding stock for item ${item.itemName}:`, error);
              }
            }
          }
        }
      } else {
        console.log(`📦 Skipping stock addition (bill is from ${sourceType}, stock not managed here)`);
      }
      
      // Update vendor balance - always do this
      const vendorId = billData.vendorId || existingBill.vendorId;
      if (vendorId) {
        await updateVendorBalance(vendorId, newFinalTotal, 'add');
      }
    }
    
    // If status remains "open" but finalTotal changed, adjust vendor balance
    if (oldStatus === "open" && newStatus === "open" && oldFinalTotal !== newFinalTotal) {
      const difference = newFinalTotal - oldFinalTotal;
      const vendorId = billData.vendorId || existingBill.vendorId;
      if (vendorId) {
        if (difference > 0) {
          // Bill increased
          await updateVendorBalance(vendorId, difference, 'add');
        } else {
          // Bill decreased
          await updateVendorBalance(vendorId, Math.abs(difference), 'subtract');
        }
      }
      
      // Handle stock changes if items changed
      // This is complex - for now, we'll just log it
      console.log(`⚠️ Bill total changed but items may have changed - stock adjustment may be needed`);
    }
    
    const bill = await Bill.findByIdAndUpdate(
      id,
      billData,
      { new: true, runValidators: true }
    );
    
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    
    // Log vendor activity for bill updates
    const vendorId = billData.vendorId || existingBill.vendorId;
    if (vendorId) {
      const formatCurrency = (value) => {
        if (!value && value !== 0) return "0.00";
        return new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
          maximumFractionDigits: 2,
        }).format(value).replace("₹", "₹").replace(/\s/g, "");
      };
      
      // Log status changes
      if (oldStatus !== newStatus) {
        const originator = getOriginatorName(
          billData.warehouse || existingBill.warehouse,
          billData.branch || existingBill.branch,
          { locName: billData.locCode || existingBill.locCode }
        );
        
        let description = "";
        if (newStatus === "open") {
          description = `Bill ${bill.billNumber} marked as open by ${originator}`;
        } else if (newStatus === "draft") {
          description = `Bill ${bill.billNumber} marked as draft by ${originator}`;
        } else if (newStatus === "paid") {
          description = `Bill ${bill.billNumber} marked as paid by ${originator}`;
        }
        
        if (description) {
          await logVendorActivity({
            vendorId: vendorId,
            eventType: "BILL_UPDATED",
            title: "Bill updated",
            description: description,
            originator: originator,
            relatedEntityId: bill._id.toString(),
            relatedEntityType: "bill",
            metadata: {
              billNumber: bill.billNumber,
              oldStatus,
              newStatus,
            },
            changedBy: billData.userId || existingBill.userId || "",
          });
        }
      }
    }
    
    res.status(200).json(bill);
  } catch (error) {
    console.error("Update bill error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a bill
export const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get the bill before deleting to reverse operations
    const bill = await Bill.findById(id);
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    
    // If bill was "open", reverse stock and vendor balance
    if (bill.status === "open") {
      const finalTotal = parseFloat(bill.finalTotal) || 0;
      const warehouseName = bill.warehouse?.trim() || "Warehouse";
      const sourceType = bill.sourceType || "direct";
      
      // Only reverse stock for Direct Bills
      // PO → Bill and PO → Receive → Bill should NOT affect stock
      if (sourceType === "direct" && bill.items && Array.isArray(bill.items)) {
        console.log(`📦 Reversing stock for Direct Bill (deleting open bill)`);
        for (const item of bill.items) {
          if (item.quantity && parseFloat(item.quantity) > 0) {
            try {
              await reduceItemStock(
                item.itemId,
                parseFloat(item.quantity),
                warehouseName,
                item.itemName,
                item.itemGroupId,
                item.itemSku
              );
            } catch (error) {
              console.error(`Error reversing stock for item ${item.itemName}:`, error);
            }
          }
        }
      } else {
        console.log(`📦 Skipping stock reversal (bill is from ${sourceType}, stock not managed here)`);
      }
      
      // Reverse vendor balance (reduce payables) - always do this
      if (bill.vendorId) {
        await updateVendorBalance(bill.vendorId, finalTotal, 'subtract');
      }
    }
    
    const deletedBill = await Bill.findByIdAndDelete(id);
    
    if (!deletedBill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    
    res.status(200).json({ message: "Bill deleted successfully" });
  } catch (error) {
    console.error("Delete bill error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Convert Purchase Order to Bill
export const convertPurchaseOrderToBill = async (req, res) => {
  try {
    const { purchaseOrderId } = req.params;
    const { billNumber, billDate, dueDate, warehouse, branch } = req.body;
    
    // Import PurchaseOrder model
    const PurchaseOrder = (await import("../model/PurchaseOrder.js")).default;
    
    // Get the purchase order
    const purchaseOrder = await PurchaseOrder.findById(purchaseOrderId);
    if (!purchaseOrder) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    
    // Check if bill already exists for this PO
    const existingBill = await Bill.findOne({ purchaseOrderId: purchaseOrderId });
    if (existingBill) {
      return res.status(409).json({ 
        message: "Bill already exists for this purchase order",
        billId: existingBill._id 
      });
    }
    
    // First, convert items and calculate amounts
    const convertedItems = purchaseOrder.items.map(item => {
        // Ensure we have proper numeric values - parse all amounts
        const quantity = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        
        // ALWAYS calculate baseAmount from quantity and rate (don't trust stored value if it's 0)
        // This ensures amounts are correct even if PO wasn't saved properly
        const baseAmount = quantity * rate;
        
        // Get tax percentages
        const cgstPercent = parseFloat(item.cgstPercent) || 0;
        const sgstPercent = parseFloat(item.sgstPercent) || 0;
        const igstPercent = parseFloat(item.igstPercent) || 0;
        const isInterState = item.isInterState || false;
        
        // ALWAYS recalculate tax amounts from baseAmount and percentages
        // This ensures taxes are correct
        let cgstAmount = 0;
        let sgstAmount = 0;
        let igstAmount = 0;
        
        if (isInterState && igstPercent > 0) {
          igstAmount = (baseAmount * igstPercent) / 100;
        } else {
          if (cgstPercent > 0) {
            cgstAmount = (baseAmount * cgstPercent) / 100;
          }
          if (sgstPercent > 0) {
            sgstAmount = (baseAmount * sgstPercent) / 100;
          }
        }
        
        // Round tax amounts to 2 decimal places
        cgstAmount = Math.round(cgstAmount * 100) / 100;
        sgstAmount = Math.round(sgstAmount * 100) / 100;
        igstAmount = Math.round(igstAmount * 100) / 100;
        
        // Calculate line tax total
        const lineTaxTotal = cgstAmount + sgstAmount + igstAmount;
        
        // Get discounted amount (if any discount was applied at item level)
        const discountedAmount = parseFloat(item.discountedAmount) || 0;
        
        // Calculate line total (baseAmount + taxes, or discountedAmount + taxes if discount applied)
        const amountForTotal = discountedAmount > 0 ? discountedAmount : baseAmount;
        const lineTotal = amountForTotal + lineTaxTotal;
        
        // Amount field should show baseAmount (quantity * rate)
        const amount = baseAmount;
        
        console.log(`📊 Converting PO item to Bill: ${item.itemName || 'Unknown'}`);
        console.log(`   Quantity: ${quantity}, Rate: ${rate}, BaseAmount: ${baseAmount}`);
        console.log(`   CGST: ${cgstAmount}, SGST: ${sgstAmount}, IGST: ${igstAmount}`);
        console.log(`   LineTaxTotal: ${lineTaxTotal}, LineTotal: ${lineTotal}`);
        
        return {
          itemId: item.itemId,
          itemName: item.itemName,
          itemDescription: item.itemDescription || "",
          account: item.account || "",
          size: item.size || "",
          quantity: quantity,
          rate: rate,
          tax: item.tax || "",
          amount: amount,
          baseAmount: baseAmount,
          discountedAmount: discountedAmount,
          cgstAmount: cgstAmount,
          sgstAmount: sgstAmount,
          igstAmount: igstAmount,
          lineTaxTotal: lineTaxTotal,
          lineTotal: lineTotal,
          taxCode: item.taxCode || "",
          taxPercent: parseFloat(item.taxPercent) || 0,
          cgstPercent: cgstPercent,
          sgstPercent: sgstPercent,
          igstPercent: igstPercent,
          isInterState: isInterState,
          itemGroupId: item.itemGroupId || null,
          itemSku: item.itemSku || "",
        };
      });
    
    // Calculate totals from converted items
    const subTotal = convertedItems.reduce((sum, item) => sum + (item.baseAmount || 0), 0);
    const totalTax = convertedItems.reduce((sum, item) => sum + (item.lineTaxTotal || 0), 0);
    const totalTaxAmount = convertedItems.reduce((sum, item) => {
      return sum + (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0);
    }, 0);
    const discountAmount = parseFloat(purchaseOrder.discountAmount) || 0;
    const tdsTcsAmount = parseFloat(purchaseOrder.tdsTcsAmount) || 0;
    const adjustment = parseFloat(purchaseOrder.adjustment) || 0;
    const finalTotal = subTotal + totalTax - discountAmount - tdsTcsAmount + adjustment;
    
    console.log(`📊 PO to Bill Conversion Totals:`);
    console.log(`   SubTotal: ${subTotal}, TotalTax: ${totalTax}, FinalTotal: ${finalTotal}`);
    
    // Prepare bill data from purchase order
    const billData = {
      vendorId: purchaseOrder.vendorId,
      vendorName: purchaseOrder.vendorName,
      branch: branch || purchaseOrder.branch || "Head Office",
      billNumber: billNumber || `BILL-${purchaseOrder.orderNumber}`,
      orderNumber: purchaseOrder.orderNumber,
      billDate: billDate ? new Date(billDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      paymentTerms: purchaseOrder.paymentTerms || "Net 60",
      subject: `Bill for Purchase Order ${purchaseOrder.orderNumber}`,
      reverseCharge: false,
      taxExclusive: true,
      atTransactionLevel: true,
      sourceOfSupply: "",
      destinationOfSupply: "",
      warehouse: warehouse || "Warehouse",
      items: convertedItems,
      discount: purchaseOrder.discount || { value: "0", type: "%" },
      applyDiscountAfterTax: purchaseOrder.applyDiscountAfterTax || false,
      totalTaxAmount: totalTaxAmount,
      tdsTcsType: purchaseOrder.tdsTcsType || "TDS",
      tdsTcsTax: purchaseOrder.tdsTcsTax || "",
      tdsTcsAmount: tdsTcsAmount,
      adjustment: adjustment,
      subTotal: subTotal,
      discountAmount: discountAmount,
      totalTax: totalTax,
      finalTotal: finalTotal,
      notes: `Converted from Purchase Order ${purchaseOrder.orderNumber}`,
      userId: purchaseOrder.userId,
      locCode: purchaseOrder.locCode || "",
      status: "open", // Default to "open" when converting from PO
      purchaseOrderId: purchaseOrderId,
      sourceType: "from_po",
    };
    
    // Create the bill
    const bill = await Bill.create(billData);
    
    // Process the bill (update vendor balance only, NO stock addition)
    // IMPORTANT: Stock should only be added when Purchase Receive is created
    // PO → Bill conversion does NOT add stock (stock will be added later when Receive is created)
    if (billData.finalTotal > 0) {
      console.log(`📦 Converting PO to Bill - updating vendor balance only (stock will be added when Receive is created)`);
      
      // Update vendor balance only (do NOT add stock)
      if (billData.vendorId) {
        await updateVendorBalance(billData.vendorId, billData.finalTotal, 'add');
        console.log(`✅ Updated vendor balance - increased payables by ${billData.finalTotal}`);
      }
    }
    
    res.status(201).json(bill);
  } catch (error) {
    console.error("Convert purchase order to bill error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Convert Purchase Receive to Bill
export const convertPurchaseReceiveToBill = async (req, res) => {
  try {
    const { purchaseReceiveId } = req.params;
    const { billNumber, billDate, dueDate, branch } = req.body;
    
    // Import PurchaseReceive model
    const PurchaseReceive = (await import("../model/PurchaseReceive.js")).default;
    
    // Get the purchase receive
    const purchaseReceive = await PurchaseReceive.findById(purchaseReceiveId);
    if (!purchaseReceive) {
      return res.status(404).json({ message: "Purchase receive not found" });
    }
    
    // Check if bill already exists for this Receive
    const existingBill = await Bill.findOne({ purchaseReceiveId: purchaseReceiveId });
    if (existingBill) {
      return res.status(409).json({ 
        message: "Bill already exists for this purchase receive",
        billId: existingBill._id 
      });
    }
    
    // Get the purchase order to get item details (rates, taxes, etc.)
    const PurchaseOrder = (await import("../model/PurchaseOrder.js")).default;
    const purchaseOrder = await PurchaseOrder.findById(purchaseReceive.purchaseOrderId);
    
    if (!purchaseOrder) {
      console.error(`❌ Purchase Order not found: ${purchaseReceive.purchaseOrderId}`);
      return res.status(404).json({ message: "Purchase order not found for this receive" });
    }
    
    console.log(`✅ Found Purchase Order: ${purchaseOrder.orderNumber} with ${purchaseOrder.items?.length || 0} items`);
    
    // Create a map of items from PO for rates/taxes
    // Use multiple keys for better matching (itemId, itemName, SKU, itemGroupId)
    const poItemMap = new Map();
    if (purchaseOrder && purchaseOrder.items) {
      purchaseOrder.items.forEach(item => {
        // Add multiple keys for flexible matching
        const itemIdKey = item.itemId?.toString();
        const itemNameKey = item.itemName?.toLowerCase().trim();
        const skuKey = item.itemSku?.toLowerCase().trim();
        const itemGroupIdKey = item.itemGroupId?.toString();
        
        if (itemIdKey) poItemMap.set(itemIdKey, item);
        if (itemNameKey) poItemMap.set(`name:${itemNameKey}`, item);
        if (skuKey) poItemMap.set(`sku:${skuKey}`, item);
        if (itemGroupIdKey && itemNameKey) poItemMap.set(`group:${itemGroupIdKey}:${itemNameKey}`, item);
        
        console.log(`   PO Item: ${item.itemName}, Rate: ${item.rate || 0}, Quantity: ${item.quantity || 0}, ItemId: ${itemIdKey || 'null'}, SKU: ${skuKey || 'none'}`);
      });
    } else {
      console.warn(`⚠️ Purchase Order has no items!`);
    }
    
    // Prepare bill items from purchase receive (use received quantities)
    const billItems = purchaseReceive.items.map(receiveItem => {
      // Try multiple matching strategies
      let poItem = null;
      
      // Strategy 1: Match by itemId
      if (receiveItem.itemId) {
        poItem = poItemMap.get(receiveItem.itemId.toString());
      }
      
      // Strategy 2: Match by itemName (case-insensitive)
      if (!poItem && receiveItem.itemName) {
        poItem = poItemMap.get(`name:${receiveItem.itemName.toLowerCase().trim()}`);
      }
      
      // Strategy 3: Match by SKU
      if (!poItem && receiveItem.itemSku) {
        poItem = poItemMap.get(`sku:${receiveItem.itemSku.toLowerCase().trim()}`);
      }
      
      // Strategy 4: Match by itemGroupId + itemName (for grouped items)
      if (!poItem && receiveItem.itemGroupId && receiveItem.itemName) {
        poItem = poItemMap.get(`group:${receiveItem.itemGroupId.toString()}:${receiveItem.itemName.toLowerCase().trim()}`);
      }
      
      if (!poItem || Object.keys(poItem).length === 0) {
        console.warn(`⚠️ PO item not found for receive item: ${receiveItem.itemName}`);
        console.warn(`   Receive item - ItemId: ${receiveItem.itemId}, ItemName: ${receiveItem.itemName}, SKU: ${receiveItem.itemSku}, GroupId: ${receiveItem.itemGroupId}`);
      }
      
      const receivedQty = parseFloat(receiveItem.received) || 0;
      const rate = parseFloat(poItem?.rate) || 0;
      
      if (rate === 0) {
        console.warn(`⚠️ Rate is 0 for item: ${receiveItem.itemName}`);
        console.warn(`   PO item rate: ${poItem?.rate}, PO item: ${JSON.stringify(poItem ? { name: poItem.itemName, rate: poItem.rate, quantity: poItem.quantity } : 'not found')}`);
      }
      
      // ALWAYS calculate baseAmount from received quantity and rate
      const baseAmount = receivedQty * rate;
      
      // Get tax percentages from PO item (use safe access)
      const cgstPercent = parseFloat(poItem?.cgstPercent) || 0;
      const sgstPercent = parseFloat(poItem?.sgstPercent) || 0;
      const igstPercent = parseFloat(poItem?.igstPercent) || 0;
      const isInterState = poItem?.isInterState || false;
      
      // ALWAYS recalculate tax amounts based on received quantity and baseAmount
      // Don't use PO tax amounts directly as they're based on PO quantity, not received quantity
      let cgstAmount = 0;
      let sgstAmount = 0;
      let igstAmount = 0;
      
      if (isInterState && igstPercent > 0) {
        igstAmount = (baseAmount * igstPercent) / 100;
      } else {
        if (cgstPercent > 0) {
          cgstAmount = (baseAmount * cgstPercent) / 100;
        }
        if (sgstPercent > 0) {
          sgstAmount = (baseAmount * sgstPercent) / 100;
        }
      }
      
      // Round tax amounts to 2 decimal places
      cgstAmount = Math.round(cgstAmount * 100) / 100;
      sgstAmount = Math.round(sgstAmount * 100) / 100;
      igstAmount = Math.round(igstAmount * 100) / 100;
      
      // Calculate line tax total
      const lineTaxTotal = cgstAmount + sgstAmount + igstAmount;
      
      // Get discounted amount (if any discount was applied at item level in PO)
      const discountedAmount = parseFloat(poItem?.discountedAmount) || 0;
      
      // Calculate line total
      const amountForTotal = discountedAmount > 0 ? discountedAmount : baseAmount;
      const lineTotal = amountForTotal + lineTaxTotal;
      
      console.log(`📊 Converting Receive item to Bill: ${receiveItem.itemName || 'Unknown'}`);
      console.log(`   ReceivedQty: ${receivedQty}, Rate: ${rate}, BaseAmount: ${baseAmount}`);
      console.log(`   CGST: ${cgstAmount}, SGST: ${sgstAmount}, IGST: ${igstAmount}`);
      console.log(`   LineTaxTotal: ${lineTaxTotal}, LineTotal: ${lineTotal}`);
      
      return {
        itemId: receiveItem.itemId,
        itemName: receiveItem.itemName,
        itemDescription: receiveItem.itemDescription || "",
        account: poItem?.account || "",
        size: poItem?.size || "",
        quantity: receivedQty,
        rate: rate,
        tax: poItem?.tax || "",
        amount: baseAmount,
        baseAmount: baseAmount,
        discountedAmount: discountedAmount,
        cgstAmount: cgstAmount,
        sgstAmount: sgstAmount,
        igstAmount: igstAmount,
        lineTaxTotal: lineTaxTotal,
        lineTotal: lineTotal,
        taxCode: poItem?.taxCode || "",
        taxPercent: parseFloat(poItem?.taxPercent) || 0,
        cgstPercent: cgstPercent,
        sgstPercent: sgstPercent,
        igstPercent: igstPercent,
        isInterState: isInterState,
        itemGroupId: receiveItem.itemGroupId || poItem?.itemGroupId || null,
        itemSku: receiveItem.itemSku || poItem?.itemSku || "",
      };
    });
    
    // Calculate totals from converted items
    const subTotal = billItems.reduce((sum, item) => sum + (item.baseAmount || 0), 0);
    const totalTax = billItems.reduce((sum, item) => sum + (item.lineTaxTotal || 0), 0);
    const totalTaxAmount = billItems.reduce((sum, item) => {
      return sum + (item.cgstAmount || 0) + (item.sgstAmount || 0) + (item.igstAmount || 0);
    }, 0);
    const discountAmount = parseFloat(purchaseOrder?.discountAmount) || 0;
    const tdsTcsAmount = parseFloat(purchaseOrder?.tdsTcsAmount) || 0;
    const adjustment = parseFloat(purchaseOrder?.adjustment) || 0;
    const finalTotal = subTotal + totalTax - discountAmount - tdsTcsAmount + adjustment;
    
    console.log(`📊 Receive to Bill Conversion Totals:`);
    console.log(`   SubTotal: ${subTotal}, TotalTax: ${totalTax}, FinalTotal: ${finalTotal}`);
    
    // Prepare bill data
    const billData = {
      vendorId: purchaseReceive.vendorId,
      vendorName: purchaseReceive.vendorName,
      branch: branch || "Head Office",
      billNumber: billNumber || `BILL-${purchaseReceive.receiveNumber}`,
      orderNumber: purchaseReceive.purchaseOrderNumber,
      billDate: billDate ? new Date(billDate) : new Date(),
      dueDate: dueDate ? new Date(dueDate) : null,
      paymentTerms: "Net 60",
      subject: `Bill for Purchase Receive ${purchaseReceive.receiveNumber}`,
      reverseCharge: false,
      taxExclusive: true,
      atTransactionLevel: true,
      sourceOfSupply: "",
      destinationOfSupply: "",
      warehouse: "Warehouse", // Use default since stock was already added at Receive
      items: billItems,
      discount: purchaseOrder?.discount || { value: "0", type: "%" },
      applyDiscountAfterTax: purchaseOrder?.applyDiscountAfterTax || false,
      totalTaxAmount: totalTaxAmount,
      tdsTcsType: purchaseOrder?.tdsTcsType || "TDS",
      tdsTcsTax: purchaseOrder?.tdsTcsTax || "",
      tdsTcsAmount: tdsTcsAmount,
      adjustment: adjustment,
      subTotal: subTotal,
      discountAmount: discountAmount,
      totalTax: totalTax,
      finalTotal: finalTotal,
      notes: `Converted from Purchase Receive ${purchaseReceive.receiveNumber}`,
      userId: purchaseReceive.userId,
      locCode: purchaseReceive.locCode || "",
      status: "open", // Default to "open"
      purchaseOrderId: purchaseReceive.purchaseOrderId,
      purchaseReceiveId: purchaseReceiveId,
      sourceType: "from_receive",
    };
    
    // Create the bill
    const bill = await Bill.create(billData);
    
    // IMPORTANT: For PO → Receive → Bill workflow:
    // Stock was already added when Purchase Receive was created
    // So we should NOT add stock again here
    // Only update vendor balance
    
    if (billData.finalTotal > 0) {
      // Update vendor balance only (stock already handled at Receive stage)
      if (billData.vendorId) {
        await updateVendorBalance(billData.vendorId, billData.finalTotal, 'add');
        console.log(`✅ Converted Receive to Bill - updated vendor balance only (stock already added at Receive)`);
      }
    }
    
    res.status(201).json(bill);
  } catch (error) {
    console.error("Convert purchase receive to bill error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

