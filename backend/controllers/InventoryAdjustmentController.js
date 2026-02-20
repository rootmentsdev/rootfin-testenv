import InventoryAdjustment from "../model/InventoryAdjustment.js";
import ShoeItem from "../model/ShoeItem.js";
import ItemGroup from "../model/ItemGroup.js";
import { nextInventoryAdjustment } from "../utils/nextInventoryAdjustment.js";
import mongoose from "mongoose";

// Helper function to update warehouse stock for inventory adjustment
const adjustItemStock = async (itemIdValue, quantityAdjustment, warehouseName, itemName = null, itemGroupId = null, itemSku = null) => {
  const targetWarehouse = warehouseName?.trim() || "Warehouse";
  
  console.log(`\n🔧 adjustItemStock called:`);
  console.log(`   itemIdValue: ${itemIdValue}`);
  console.log(`   quantityAdjustment: ${quantityAdjustment}`);
  console.log(`   targetWarehouse: ${targetWarehouse}`);
  console.log(`   itemName: ${itemName}`);
  console.log(`   itemGroupId: ${itemGroupId}`);
  console.log(`   itemSku: ${itemSku}`);
  
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
    } else {
      // Update existing warehouse stock
      warehouseStock.stockOnHand = Math.max(0, (warehouseStock.stockOnHand || 0) + qtyAdjustment);
      warehouseStock.availableForSale = Math.max(0, (warehouseStock.availableForSale || 0) + qtyAdjustment);
      warehouseStock.physicalStockOnHand = Math.max(0, (warehouseStock.physicalStockOnHand || 0) + qtyAdjustment);
      warehouseStock.physicalAvailableForSale = Math.max(0, (warehouseStock.physicalAvailableForSale || 0) + qtyAdjustment);
    }
    
    return warehouseStocks;
  };

  try {
    // Try to find by ObjectId first
    let item = null;
    if (mongoose.Types.ObjectId.isValid(itemIdValue)) {
      item = await ShoeItem.findById(itemIdValue);
    }
    
    // If not found by ObjectId, try to find by SKU or name
    if (!item && itemSku) {
      item = await ShoeItem.findOne({ sku: itemSku });
    }
    if (!item && itemName) {
      item = await ShoeItem.findOne({ itemName: itemName });
    }
    
    if (item) {
      // Update item stock
      const updatedWarehouseStocks = updateWarehouseStock(item.warehouseStocks, quantityAdjustment, targetWarehouse);
      await ShoeItem.findByIdAndUpdate(item._id, { warehouseStocks: updatedWarehouseStocks });
      console.log(`✅ Adjusted ${quantityAdjustment} units for item ${item.itemName} in warehouse ${targetWarehouse}`);
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
        const updatedWarehouseStocks = updateWarehouseStock(itemGroup.warehouseStocks, quantityAdjustment, targetWarehouse);
        await ItemGroup.findByIdAndUpdate(itemGroup._id, { warehouseStocks: updatedWarehouseStocks });
        console.log(`✅ Adjusted ${quantityAdjustment} units for item group ${itemGroup.itemName} in warehouse ${targetWarehouse}`);
        return { success: true, itemName: itemGroup.itemName };
      }
    }
    
    console.log(`❌ Item not found for adjustment: ${itemIdValue} / ${itemName} / ${itemSku}`);
    return { success: false, error: "Item not found" };
  } catch (error) {
    console.error(`❌ Error adjusting stock for item ${itemIdValue}:`, error);
    return { success: false, error: error.message };
  }
};

// Create inventory adjustment
export const createInventoryAdjustment = async (req, res) => {
  try {
    const adjustmentData = req.body;

    // Validate required fields
    if (!adjustmentData.date || !adjustmentData.warehouse || !adjustmentData.reason) {
      return res.status(400).json({ 
        message: "Date, warehouse, and reason are required" 
      });
    }

    // Generate reference number if not provided
    if (!adjustmentData.referenceNumber) {
      adjustmentData.referenceNumber = await nextInventoryAdjustment();
    }

    const adjustment = await InventoryAdjustment.create(adjustmentData);

    // If status is 'adjusted', update stock for all items
    if (adjustment.status === 'adjusted' && adjustment.items && adjustment.items.length > 0) {
      const stockUpdateResults = [];
      
      for (const item of adjustment.items) {
        if (item.quantityAdjusted !== 0) {
          const result = await adjustItemStock(
            item.itemId,
            item.quantityAdjusted,
            adjustment.warehouse,
            item.itemName,
            item.itemGroupId,
            item.itemSku
          );
          stockUpdateResults.push({
            itemName: item.itemName,
            quantityAdjusted: item.quantityAdjusted,
            ...result
          });
        }
      }
      
      console.log(`📊 Stock update results:`, stockUpdateResults);
    }

    res.status(201).json({
      message: "Inventory adjustment created successfully",
      adjustment: adjustment,
    });
  } catch (error) {
    console.error("Create inventory adjustment error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Inventory adjustment with this reference number already exists" 
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

// Get all inventory adjustments
export const getInventoryAdjustments = async (req, res) => {
  try {
    const { userId, warehouse, status, limit = 50, offset = 0 } = req.query;
    
    let filter = {};
    
    if (userId) {
      filter.userId = userId;
    }
    
    if (warehouse) {
      filter.warehouse = warehouse;
    }
    
    if (status) {
      filter.status = status;
    }

    const adjustments = await InventoryAdjustment.find(filter)
      .sort({ date: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const totalCount = await InventoryAdjustment.countDocuments(filter);

    res.status(200).json({
      message: "Inventory adjustments retrieved successfully",
      adjustments: adjustments,
      totalCount: totalCount,
      hasMore: (parseInt(offset) + adjustments.length) < totalCount,
    });
  } catch (error) {
    console.error("Get inventory adjustments error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get inventory adjustment by ID
export const getInventoryAdjustmentById = async (req, res) => {
  try {
    const { id } = req.params;

    const adjustment = await InventoryAdjustment.findById(id);

    if (!adjustment) {
      return res.status(404).json({ message: "Inventory adjustment not found" });
    }

    res.status(200).json({
      message: "Inventory adjustment retrieved successfully",
      adjustment: adjustment,
    });
  } catch (error) {
    console.error("Get inventory adjustment by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update inventory adjustment
export const updateInventoryAdjustment = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const existingAdjustment = await InventoryAdjustment.findById(id);
    if (!existingAdjustment) {
      return res.status(404).json({ message: "Inventory adjustment not found" });
    }

    const adjustment = await InventoryAdjustment.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    // If status changed to 'adjusted', update stock for all items
    if (updateData.status === 'adjusted' && existingAdjustment.status !== 'adjusted' && 
        adjustment.items && adjustment.items.length > 0) {
      const stockUpdateResults = [];
      
      for (const item of adjustment.items) {
        if (item.quantityAdjusted !== 0) {
          const result = await adjustItemStock(
            item.itemId,
            item.quantityAdjusted,
            adjustment.warehouse,
            item.itemName,
            item.itemGroupId,
            item.itemSku
          );
          stockUpdateResults.push({
            itemName: item.itemName,
            quantityAdjusted: item.quantityAdjusted,
            ...result
          });
        }
      }
      
      console.log(`📊 Stock update results:`, stockUpdateResults);
    }

    res.status(200).json({
      message: "Inventory adjustment updated successfully",
      adjustment: adjustment,
    });
  } catch (error) {
    console.error("Update inventory adjustment error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Inventory adjustment with this reference number already exists" 
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

// Delete inventory adjustment
export const deleteInventoryAdjustment = async (req, res) => {
  try {
    const { id } = req.params;

    const adjustment = await InventoryAdjustment.findById(id);

    if (!adjustment) {
      return res.status(404).json({ message: "Inventory adjustment not found" });
    }

    // If adjustment was applied, reverse the stock changes
    if (adjustment.status === 'adjusted' && adjustment.items && adjustment.items.length > 0) {
      const stockReversalResults = [];
      
      for (const item of adjustment.items) {
        if (item.quantityAdjusted !== 0) {
          // Reverse the adjustment by applying negative quantity
          const result = await adjustItemStock(
            item.itemId,
            -item.quantityAdjusted,
            adjustment.warehouse,
            item.itemName,
            item.itemGroupId,
            item.itemSku
          );
          stockReversalResults.push({
            itemName: item.itemName,
            quantityReversed: -item.quantityAdjusted,
            ...result
          });
        }
      }
      
      console.log(`📊 Stock reversal results:`, stockReversalResults);
    }

    await InventoryAdjustment.findByIdAndDelete(id);

    res.status(200).json({
      message: "Inventory adjustment deleted successfully",
    });
  } catch (error) {
    console.error("Delete inventory adjustment error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};