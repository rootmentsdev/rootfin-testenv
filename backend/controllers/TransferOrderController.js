// Transfer Order Controller - Manages stock transfers between warehouses
import TransferOrder from "../model/TransferOrder.js";
import ShoeItem from "../model/ShoeItem.js";
import ItemGroup from "../model/ItemGroup.js";
import { updateMonthlyStockForTransfer } from "../utils/monthlyStockTracking.js";
import mongoose from "mongoose";

// Helper function for flexible warehouse matching
// Warehouse name normalization mapping (same as frontend)
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
  
  // Perinthalmanna variations
  "G.Perinthalmanna": "Perinthalmanna Branch",
  "GPerinthalmanna": "Perinthalmanna Branch",
  "Perinthalmanna Branch": "Perinthalmanna Branch",
  
  // MG Road variations
  "G.MG Road": "MG Road Branch",
  "GMG Road": "MG Road Branch",
  "MG Road Branch": "MG Road Branch",
  
  // Gedapally variations
  "G.Gedapally": "Gedapally Branch",
  "GGedapally": "Gedapally Branch",
  "Gedapally Branch": "Gedapally Branch",
};

const normalizeWarehouseName = (warehouseName) => {
  if (!warehouseName) return "Warehouse";
  const trimmed = warehouseName.trim();
  return WAREHOUSE_NAME_MAPPING[trimmed] || trimmed;
};

// Helper function to update stock during transfer
const updateStockForTransfer = async (itemId, itemGroupId, quantity, sourceWarehouse, destinationWarehouse, itemName = null, itemSku = null) => {
  const normalizedSource = normalizeWarehouseName(sourceWarehouse);
  const normalizedDestination = normalizeWarehouseName(destinationWarehouse);
  
  console.log(`🔄 Updating stock for transfer:`);
  console.log(`   Item: ${itemName || itemId}`);
  console.log(`   Quantity: ${quantity}`);
  console.log(`   From: ${normalizedSource}`);
  console.log(`   To: ${normalizedDestination}`);

  try {
    // Try to find by ObjectId first
    let item = null;
    if (mongoose.Types.ObjectId.isValid(itemId)) {
      item = await ShoeItem.findById(itemId);
    }
    
    // If not found by ObjectId, try to find by SKU or name
    if (!item && itemSku) {
      item = await ShoeItem.findOne({ sku: itemSku });
    }
    if (!item && itemName) {
      item = await ShoeItem.findOne({ itemName: itemName });
    }
    
    if (item) {
      let warehouseStocks = item.warehouseStocks || [];
      
      // Find source warehouse and reduce stock
      let sourceStock = warehouseStocks.find(ws => 
        normalizeWarehouseName(ws.warehouse) === normalizedSource
      );
      
      if (sourceStock) {
        sourceStock.stockOnHand = Math.max(0, (sourceStock.stockOnHand || 0) - quantity);
        sourceStock.availableForSale = Math.max(0, (sourceStock.availableForSale || 0) - quantity);
        sourceStock.physicalStockOnHand = Math.max(0, (sourceStock.physicalStockOnHand || 0) - quantity);
        sourceStock.physicalAvailableForSale = Math.max(0, (sourceStock.physicalAvailableForSale || 0) - quantity);
      }
      
      // Find destination warehouse and add stock
      let destStock = warehouseStocks.find(ws => 
        normalizeWarehouseName(ws.warehouse) === normalizedDestination
      );
      
      if (!destStock) {
        // Create new warehouse entry
        destStock = {
          warehouse: normalizedDestination,
          openingStock: 0,
          openingStockValue: 0,
          stockOnHand: quantity,
          committedStock: 0,
          availableForSale: quantity,
          physicalOpeningStock: 0,
          physicalStockOnHand: quantity,
          physicalCommittedStock: 0,
          physicalAvailableForSale: quantity,
        };
        warehouseStocks.push(destStock);
      } else {
        destStock.stockOnHand = (destStock.stockOnHand || 0) + quantity;
        destStock.availableForSale = (destStock.availableForSale || 0) + quantity;
        destStock.physicalStockOnHand = (destStock.physicalStockOnHand || 0) + quantity;
        destStock.physicalAvailableForSale = (destStock.physicalAvailableForSale || 0) + quantity;
      }
      
      await ShoeItem.findByIdAndUpdate(item._id, { warehouseStocks });
      console.log(`✅ Updated stock for item ${item.itemName}`);
      return { success: true, itemName: item.itemName };
    }
    
    // Try ItemGroup if item not found
    if (itemGroupId) {
      let itemGroup = null;
      if (mongoose.Types.ObjectId.isValid(itemGroupId)) {
        itemGroup = await ItemGroup.findById(itemGroupId);
      }
      
      if (!itemGroup && itemName) {
        itemGroup = await ItemGroup.findOne({ itemName: itemName });
      }
      
      if (itemGroup) {
        let warehouseStocks = itemGroup.warehouseStocks || [];
        
        // Find source warehouse and reduce stock
        let sourceStock = warehouseStocks.find(ws => 
          normalizeWarehouseName(ws.warehouse) === normalizedSource
        );
        
        if (sourceStock) {
          sourceStock.stockOnHand = Math.max(0, (sourceStock.stockOnHand || 0) - quantity);
          sourceStock.availableForSale = Math.max(0, (sourceStock.availableForSale || 0) - quantity);
          sourceStock.physicalStockOnHand = Math.max(0, (sourceStock.physicalStockOnHand || 0) - quantity);
          sourceStock.physicalAvailableForSale = Math.max(0, (sourceStock.physicalAvailableForSale || 0) - quantity);
        }
        
        // Find destination warehouse and add stock
        let destStock = warehouseStocks.find(ws => 
          normalizeWarehouseName(ws.warehouse) === normalizedDestination
        );
        
        if (!destStock) {
          // Create new warehouse entry
          destStock = {
            warehouse: normalizedDestination,
            openingStock: 0,
            openingStockValue: 0,
            stockOnHand: quantity,
            committedStock: 0,
            availableForSale: quantity,
            physicalOpeningStock: 0,
            physicalStockOnHand: quantity,
            physicalCommittedStock: 0,
            physicalAvailableForSale: quantity,
          };
          warehouseStocks.push(destStock);
        } else {
          destStock.stockOnHand = (destStock.stockOnHand || 0) + quantity;
          destStock.availableForSale = (destStock.availableForSale || 0) + quantity;
          destStock.physicalStockOnHand = (destStock.physicalStockOnHand || 0) + quantity;
          destStock.physicalAvailableForSale = (destStock.physicalAvailableForSale || 0) + quantity;
        }
        
        await ItemGroup.findByIdAndUpdate(itemGroup._id, { warehouseStocks });
        console.log(`✅ Updated stock for item group ${itemGroup.itemName}`);
        return { success: true, itemName: itemGroup.itemName };
      }
    }
    
    console.log(`❌ Item not found for transfer: ${itemId} / ${itemName} / ${itemSku}`);
    return { success: false, error: "Item not found" };
  } catch (error) {
    console.error(`❌ Error updating stock for transfer:`, error);
    return { success: false, error: error.message };
  }
};

// Create transfer order
export const createTransferOrder = async (req, res) => {
  try {
    const transferOrderData = req.body;

    // Validate required fields
    if (!transferOrderData.transferOrderNumber || !transferOrderData.sourceWarehouse || 
        !transferOrderData.destinationWarehouse) {
      return res.status(400).json({ 
        message: "Transfer order number, source warehouse, and destination warehouse are required" 
      });
    }

    const transferOrder = await TransferOrder.create(transferOrderData);

    res.status(201).json({
      message: "Transfer order created successfully",
      transferOrder: transferOrder,
    });
  } catch (error) {
    console.error("Create transfer order error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Transfer order with this number already exists" 
      });
    }
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationErrors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all transfer orders
export const getTransferOrders = async (req, res) => {
  try {
    const { userId, sourceWarehouse, destinationWarehouse, status, limit = 50, offset = 0 } = req.query;
    
    let filter = {};
    
    if (userId) {
      filter.userId = userId;
    }
    
    if (sourceWarehouse) {
      filter.sourceWarehouse = new RegExp(sourceWarehouse, 'i');
    }
    
    if (destinationWarehouse) {
      filter.destinationWarehouse = new RegExp(destinationWarehouse, 'i');
    }
    
    if (status) {
      filter.status = status;
    }

    const transferOrders = await TransferOrder.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const totalCount = await TransferOrder.countDocuments(filter);

    res.status(200).json({
      message: "Transfer orders retrieved successfully",
      transferOrders: transferOrders,
      totalCount: totalCount,
      hasMore: (parseInt(offset) + transferOrders.length) < totalCount,
    });
  } catch (error) {
    console.error("Get transfer orders error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get transfer order by ID
export const getTransferOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const transferOrder = await TransferOrder.findById(id);

    if (!transferOrder) {
      return res.status(404).json({ message: "Transfer order not found" });
    }

    res.status(200).json({
      message: "Transfer order retrieved successfully",
      transferOrder: transferOrder,
    });
  } catch (error) {
    console.error("Get transfer order by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update transfer order
export const updateTransferOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const transferOrder = await TransferOrder.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!transferOrder) {
      return res.status(404).json({ message: "Transfer order not found" });
    }

    res.status(200).json({
      message: "Transfer order updated successfully",
      transferOrder: transferOrder,
    });
  } catch (error) {
    console.error("Update transfer order error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Transfer order with this number already exists" 
      });
    }
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(e => e.message).join(', ');
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationErrors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete transfer order
export const deleteTransferOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const transferOrder = await TransferOrder.findByIdAndDelete(id);

    if (!transferOrder) {
      return res.status(404).json({ message: "Transfer order not found" });
    }

    res.status(200).json({
      message: "Transfer order deleted successfully",
    });
  } catch (error) {
    console.error("Delete transfer order error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Receive transfer order (update stock)
export const receiveTransferOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedItems } = req.body;

    const transferOrder = await TransferOrder.findById(id);

    if (!transferOrder) {
      return res.status(404).json({ message: "Transfer order not found" });
    }

    if (transferOrder.status !== "in_transit") {
      return res.status(400).json({ message: "Transfer order is not in transit" });
    }

    // Update stock for received items
    const stockUpdateResults = [];
    
    if (receivedItems && receivedItems.length > 0) {
      for (const receivedItem of receivedItems) {
        const originalItem = transferOrder.items.find(item => 
          item.itemId === receivedItem.itemId || item.itemSku === receivedItem.itemSku
        );
        
        if (originalItem && receivedItem.quantityReceived > 0) {
          const result = await updateStockForTransfer(
            originalItem.itemId,
            originalItem.itemGroupId,
            receivedItem.quantityReceived,
            transferOrder.sourceWarehouse,
            transferOrder.destinationWarehouse,
            originalItem.itemName,
            originalItem.itemSku
          );
          
          stockUpdateResults.push({
            itemName: originalItem.itemName,
            quantityReceived: receivedItem.quantityReceived,
            ...result
          });
        }
      }
    }

    // Update transfer order status
    transferOrder.status = "transferred";
    await transferOrder.save();

    res.status(200).json({
      message: "Transfer order received successfully",
      transferOrder: transferOrder,
      stockUpdateResults: stockUpdateResults,
    });
  } catch (error) {
    console.error("Receive transfer order error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get item stock for transfer
export const getItemStock = async (req, res) => {
  try {
    const { itemId, warehouse } = req.query;

    if (!itemId || !warehouse) {
      return res.status(400).json({ message: "Item ID and warehouse are required" });
    }

    let item = null;
    if (mongoose.Types.ObjectId.isValid(itemId)) {
      item = await ShoeItem.findById(itemId);
    }

    if (!item) {
      item = await ItemGroup.findById(itemId);
    }

    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }

    const normalizedWarehouse = normalizeWarehouseName(warehouse);
    const warehouseStock = item.warehouseStocks?.find(ws => 
      normalizeWarehouseName(ws.warehouse) === normalizedWarehouse
    );

    const stockInfo = {
      itemName: item.itemName,
      warehouse: normalizedWarehouse,
      stockOnHand: warehouseStock?.stockOnHand || 0,
      availableForSale: warehouseStock?.availableForSale || 0,
    };

    res.status(200).json({
      message: "Item stock retrieved successfully",
      stock: stockInfo,
    });
  } catch (error) {
    console.error("Get item stock error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};