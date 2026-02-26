// Transfer Order Controller - MongoDB Only Version
import TransferOrder from "../model/TransferOrder.js";
import ShoeItem from "../model/ShoeItem.js";
import ItemGroup from "../model/ItemGroup.js";
import { updateMonthlyStockForTransfer } from "../utils/monthlyStockTracking.js";

// Helper function for flexible warehouse matching
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
  "G.Kottayam": "Kottayam Branch",
  "GKottayam": "Kottayam Branch",
  "Kottayam Branch": "Kottayam Branch",
  "G.Perinthalmanna": "Perinthalmanna Branch",
  "GPerinthalmanna": "Perinthalmanna Branch",
  "Perinthalmanna Branch": "Perinthalmanna Branch",
};

const normalizeWarehouseName = (warehouseName) => {
  if (!warehouseName) return "Warehouse";
  const trimmed = warehouseName.trim();
  return WAREHOUSE_NAME_MAPPING[trimmed] || trimmed;
};

// Helper function to transfer stock between warehouses
const transferItemStock = async (itemIdValue, quantity, sourceWarehouse, destinationWarehouse, itemName = null, itemGroupId = null, itemSku = null) => {
  const normalizedSource = normalizeWarehouseName(sourceWarehouse);
  const normalizedDestination = normalizeWarehouseName(destinationWarehouse);
  
  console.log(`🔄 Transferring stock: ${itemName || itemIdValue}`);
  console.log(`   From: ${normalizedSource} → To: ${normalizedDestination}`);
  console.log(`   Quantity: ${quantity}`);
  
  // Helper function to update warehouse stock
  const updateWarehouseStock = (warehouseStocks, qty, sourceWh, destWh) => {
    if (!warehouseStocks || warehouseStocks.length === 0) {
      return {
        success: false,
        message: `No stock found in source warehouse "${sourceWh}"`
      };
    }
    
    // Find source warehouse
    let sourceStock = warehouseStocks.find(ws => 
      ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === sourceWh.trim().toLowerCase()
    );
    
    if (!sourceStock) {
      return {
        success: false,
        message: `Source warehouse "${sourceWh}" not found`
      };
    }
    
    const currentSourceStock = parseFloat(sourceStock.stockOnHand) || 0;
    if (currentSourceStock < qty) {
      return {
        success: false,
        message: `Insufficient stock in "${sourceWh}". Available: ${currentSourceStock}, Required: ${qty}`
      };
    }
    
    // Find or create destination warehouse
    let destStock = warehouseStocks.find(ws => 
      ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === destWh.trim().toLowerCase()
    );
    
    if (!destStock) {
      destStock = {
        warehouse: destWh,
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
      warehouseStocks.push(destStock);
    }
    
    // Transfer stock
    sourceStock.stockOnHand = Math.max(0, currentSourceStock - qty);
    sourceStock.availableForSale = Math.max(0, (parseFloat(sourceStock.availableForSale) || 0) - qty);
    sourceStock.physicalStockOnHand = Math.max(0, (parseFloat(sourceStock.physicalStockOnHand) || 0) - qty);
    sourceStock.physicalAvailableForSale = Math.max(0, (parseFloat(sourceStock.physicalAvailableForSale) || 0) - qty);
    
    const currentDestStock = parseFloat(destStock.stockOnHand) || 0;
    destStock.stockOnHand = currentDestStock + qty;
    destStock.availableForSale = (parseFloat(destStock.availableForSale) || 0) + qty;
    destStock.physicalStockOnHand = (parseFloat(destStock.physicalStockOnHand) || 0) + qty;
    destStock.physicalAvailableForSale = (parseFloat(destStock.physicalAvailableForSale) || 0) + qty;
    
    return { success: true, warehouseStocks };
  };
  
  // Try standalone item first
  if (itemIdValue && itemIdValue !== null && itemIdValue !== "null") {
    const shoeItem = await ShoeItem.findById(itemIdValue);
    if (shoeItem) {
      const result = updateWarehouseStock(shoeItem.warehouseStocks || [], quantity, normalizedSource, normalizedDestination);
      if (!result.success) {
        return result;
      }
      shoeItem.warehouseStocks = result.warehouseStocks;
      await shoeItem.save();
      console.log(`✅ Stock transferred for standalone item: ${itemName || itemIdValue}`);
      return { success: true, type: 'standalone' };
    }
  }
  
  // Try item groups
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
    for (let i = 0; i < group.items.length; i++) {
      const groupItem = group.items[i];
      const groupItemId = groupItem._id?.toString() || groupItem.id?.toString();
      
      // Match by ID, name, or SKU
      const itemIdStr = itemIdValue?.toString() || "";
      const idMatches = itemIdStr === groupItemId || itemIdStr.includes(groupItemId);
      const nameMatches = itemName && groupItem.name && 
        groupItem.name.toLowerCase().trim() === itemName.toLowerCase().trim();
      const skuMatches = itemSku && groupItem.sku && 
        groupItem.sku.toLowerCase().trim() === itemSku.toLowerCase().trim();
      
      if (idMatches || nameMatches || skuMatches) {
        const result = updateWarehouseStock(groupItem.warehouseStocks || [], quantity, normalizedSource, normalizedDestination);
        if (!result.success) {
          return result;
        }
        groupItem.warehouseStocks = result.warehouseStocks;
        group.items[i] = groupItem;
        group.markModified('items');
        await group.save();
        console.log(`✅ Stock transferred for item in group: ${groupItem.name} (Group: ${group.name})`);
        return { success: true, type: 'group', groupName: group.name, itemName: groupItem.name };
      }
    }
  }
  
  console.warn(`⚠️ Item with ID ${itemIdValue} not found for stock transfer`);
  return { success: false, message: `Item with ID ${itemIdValue} not found` };
};

// Create a new transfer order
export const createTransferOrder = async (req, res) => {
  try {
    const transferData = req.body;
    
    // Validate required fields
    if (!transferData.sourceWarehouse || !transferData.destinationWarehouse || !transferData.items || !Array.isArray(transferData.items) || transferData.items.length === 0) {
      return res.status(400).json({ 
        message: "Source warehouse, destination warehouse, and items are required" 
      });
    }
    
    // Create MongoDB transfer order
    const mongoOrder = new TransferOrder(transferData);
    await mongoOrder.save();
    
    console.log(`✅ MongoDB transfer order created: ${transferData.transferOrderNumber} (ID: ${mongoOrder._id})`);
    
    // If status is "transferred", update stock immediately
    if (transferData.status === "transferred") {
      console.log(`📦 Processing stock transfer for order: ${transferData.transferOrderNumber}`);
      
      for (const item of transferData.items) {
        if (item.quantity && parseFloat(item.quantity) > 0) {
          try {
            await transferItemStock(
              item.itemId,
              parseFloat(item.quantity),
              transferData.sourceWarehouse,
              transferData.destinationWarehouse,
              item.itemName,
              item.itemGroupId,
              item.itemSku
            );
            console.log(`✅ Stock transferred for item: ${item.itemName}`);
          } catch (stockError) {
            console.error(`❌ Error transferring stock for item ${item.itemName}:`, stockError);
          }
        }
      }
    }
    
    res.status(201).json(mongoOrder);
  } catch (error) {
    console.error("Error creating transfer order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all transfer orders
export const getTransferOrders = async (req, res) => {
  try {
    const { userId, sourceWarehouse, destinationWarehouse, status, startDate, endDate, userPower, locCode } = req.query;
    
    const filter = {};
    
    // Admin check
    const adminEmails = ['officerootments@gmail.com'];
    const isAdminEmail = userId && typeof userId === 'string' && adminEmails.some(email => userId.toLowerCase() === email.toLowerCase());
    const isAdmin = isAdminEmail ||
                    (userPower && (userPower.toLowerCase() === 'admin' || userPower.toLowerCase() === 'super_admin')) ||
                    (locCode && (locCode === '858' || locCode === '103'));
    
    // Apply filters
    if (sourceWarehouse) filter.sourceWarehouse = sourceWarehouse;
    if (destinationWarehouse) filter.destinationWarehouse = destinationWarehouse;
    if (status) filter.status = status;
    
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }
    
    // User-specific filtering for non-admins
    if (!isAdmin && userId) {
      filter.userId = userId;
    }
    
    const transferOrders = await TransferOrder.find(filter)
      .sort({ date: -1, createdAt: -1 })
      .limit(1000);
    
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
    const transferOrder = await TransferOrder.findById(id);
    
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
    
    const existingOrder = await TransferOrder.findById(id);
    if (!existingOrder) {
      return res.status(404).json({ message: "Transfer order not found" });
    }
    
    // Update the transfer order
    const updatedOrder = await TransferOrder.findByIdAndUpdate(id, transferData, { new: true });
    
    console.log(`✅ MongoDB transfer order updated: ${updatedOrder.transferOrderNumber} (ID: ${id})`);
    
    res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating transfer order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Receive a transfer order (change status from in_transit to transferred)
export const receiveTransferOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const transferOrder = await TransferOrder.findById(id);
    if (!transferOrder) {
      return res.status(404).json({ message: "Transfer order not found" });
    }
    
    // Only allow receiving if status is "in_transit"
    if (transferOrder.status !== "in_transit") {
      return res.status(400).json({ 
        message: `Cannot receive transfer order with status "${transferOrder.status}". Only "in_transit" orders can be received.` 
      });
    }
    
    console.log(`📦 Receiving transfer order: ${transferOrder.transferOrderNumber}`);
    
    // Transfer stock for all items
    for (const item of transferOrder.items || []) {
      if (item.quantity && parseFloat(item.quantity) > 0) {
        try {
          await transferItemStock(
            item.itemId,
            parseFloat(item.quantity),
            transferOrder.sourceWarehouse,
            transferOrder.destinationWarehouse,
            item.itemName,
            item.itemGroupId,
            item.itemSku
          );
          console.log(`✅ Stock transferred for item: ${item.itemName}`);
        } catch (stockError) {
          console.error(`❌ Error transferring stock for item ${item.itemName}:`, stockError);
        }
      }
    }
    
    // Update status to transferred
    transferOrder.status = "transferred";
    await transferOrder.save();
    
    console.log(`✅ MongoDB transfer order received: ${transferOrder.transferOrderNumber} (ID: ${id})`);
    
    res.status(200).json(transferOrder);
  } catch (error) {
    console.error("Error receiving transfer order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a transfer order
export const deleteTransferOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const transferOrder = await TransferOrder.findByIdAndDelete(id);
    if (!transferOrder) {
      return res.status(404).json({ message: "Transfer order not found" });
    }
    
    console.log(`✅ MongoDB transfer order deleted: ${transferOrder.transferOrderNumber} (ID: ${id})`);
    
    res.status(200).json({ message: "Transfer order deleted successfully" });
  } catch (error) {
    console.error("Error deleting transfer order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get current stock for an item in a warehouse (helper endpoint)
export const getItemStock = async (req, res) => {
  try {
    const { itemId, itemGroupId, itemName, itemSku, warehouse, excludeOrderId } = req.query;
    
    if (!warehouse) {
      return res.status(400).json({ message: "Warehouse parameter is required" });
    }
    
    const normalizedWarehouse = normalizeWarehouseName(warehouse);
    let stockInfo = { currentQuantity: 0, itemFound: false };
    
    // Try standalone item first
    if (itemId && itemId !== "null") {
      const shoeItem = await ShoeItem.findById(itemId);
      if (shoeItem) {
        const warehouseStock = shoeItem.warehouseStocks?.find(ws => 
          ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === normalizedWarehouse.trim().toLowerCase()
        );
        stockInfo = {
          currentQuantity: parseFloat(warehouseStock?.stockOnHand || 0),
          itemFound: true,
          itemName: shoeItem.name,
          type: 'standalone'
        };
      }
    }
    
    // Try item groups if not found
    if (!stockInfo.itemFound && itemGroupId) {
      const group = await ItemGroup.findById(itemGroupId);
      if (group) {
        for (const groupItem of group.items || []) {
          const nameMatches = itemName && groupItem.name && 
            groupItem.name.toLowerCase().trim() === itemName.toLowerCase().trim();
          const skuMatches = itemSku && groupItem.sku && 
            groupItem.sku.toLowerCase().trim() === itemSku.toLowerCase().trim();
          
          if (nameMatches || skuMatches) {
            const warehouseStock = groupItem.warehouseStocks?.find(ws => 
              ws.warehouse && ws.warehouse.toString().trim().toLowerCase() === normalizedWarehouse.trim().toLowerCase()
            );
            stockInfo = {
              currentQuantity: parseFloat(warehouseStock?.stockOnHand || 0),
              itemFound: true,
              itemName: groupItem.name,
              type: 'group',
              groupName: group.name
            };
            break;
          }
        }
      }
    }
    
    res.status(200).json(stockInfo);
  } catch (error) {
    console.error("Error getting item stock:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};