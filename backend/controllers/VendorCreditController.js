import VendorCredit from "../model/VendorCredit.js";
import Vendor from "../model/Vendor.js";
import { nextCreditNote } from "../utils/nextCreditNote.js";
import Counter from "../model/Counter.js";
import mongoose from "mongoose";
import ShoeItem from "../model/ShoeItem.js";
import ItemGroup from "../model/ItemGroup.js";

// Helper function to add stock (for reversing vendor credits) - adds back to specific warehouse
const addItemStock = async (itemIdValue, quantity, warehouseName, itemName = null, itemGroupId = null, itemSku = null) => {
  // Helper function to update warehouse stock (add) - only to specified warehouse
  const updateWarehouseStock = (warehouseStocks, qty, targetWarehouse) => {
    if (!warehouseStocks || warehouseStocks.length === 0) {
      // Create new warehouse entry if it doesn't exist
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
    
    // Add stock to the specific warehouse
    warehouseStock.stockOnHand = (warehouseStock.stockOnHand || 0) + qty;
    warehouseStock.availableForSale = (warehouseStock.availableForSale || 0) + qty;
    warehouseStock.physicalStockOnHand = (warehouseStock.physicalStockOnHand || 0) + qty;
    warehouseStock.physicalAvailableForSale = (warehouseStock.physicalAvailableForSale || 0) + qty;
    
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
      const updatedWarehouseStocks = updateWarehouseStock(item.warehouseStocks, quantity, warehouseName);
      await ShoeItem.findByIdAndUpdate(item._id, { warehouseStocks: updatedWarehouseStocks });
      console.log(`✅ Added ${quantity} units to item ${item.itemName} in warehouse ${warehouseName}`);
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
        const updatedWarehouseStocks = updateWarehouseStock(itemGroup.warehouseStocks, quantity, warehouseName);
        await ItemGroup.findByIdAndUpdate(itemGroup._id, { warehouseStocks: updatedWarehouseStocks });
        console.log(`✅ Added ${quantity} units to item group ${itemGroup.itemName} in warehouse ${warehouseName}`);
        return { success: true, itemName: itemGroup.itemName };
      }
    }
    
    console.log(`❌ Item not found for adding stock: ${itemIdValue} / ${itemName} / ${itemSku}`);
    return { success: false, error: "Item not found" };
  } catch (error) {
    console.error(`❌ Error adding stock for item ${itemIdValue}:`, error);
    return { success: false, error: error.message };
  }
};

// Create vendor credit
export const createVendorCredit = async (req, res) => {
  try {
    const vendorCreditData = req.body;

    // Validate required fields
    if (!vendorCreditData.vendorName || !vendorCreditData.creditNoteNumber) {
      return res.status(400).json({ 
        message: "Vendor name and credit note number are required" 
      });
    }

    const vendorCredit = await VendorCredit.create(vendorCreditData);

    res.status(201).json({
      message: "Vendor credit created successfully",
      vendorCredit: vendorCredit,
    });
  } catch (error) {
    console.error("Create vendor credit error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Vendor credit with this number already exists" 
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

// Get all vendor credits
export const getVendorCredits = async (req, res) => {
  try {
    const { userId, vendorId, status } = req.query;
    
    let filter = {};
    
    if (userId) {
      filter.userId = userId;
    }
    
    if (vendorId) {
      filter.vendorId = vendorId;
    }
    
    if (status) {
      filter.status = status;
    }

    const vendorCredits = await VendorCredit.find(filter)
      .sort({ creditDate: -1 })
      .limit(100);

    res.status(200).json({
      message: "Vendor credits retrieved successfully",
      vendorCredits: vendorCredits,
    });
  } catch (error) {
    console.error("Get vendor credits error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get vendor credit by ID
export const getVendorCreditById = async (req, res) => {
  try {
    const { id } = req.params;

    const vendorCredit = await VendorCredit.findById(id);

    if (!vendorCredit) {
      return res.status(404).json({ message: "Vendor credit not found" });
    }

    res.status(200).json({
      message: "Vendor credit retrieved successfully",
      vendorCredit: vendorCredit,
    });
  } catch (error) {
    console.error("Get vendor credit by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update vendor credit
export const updateVendorCredit = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const vendorCredit = await VendorCredit.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );

    if (!vendorCredit) {
      return res.status(404).json({ message: "Vendor credit not found" });
    }

    res.status(200).json({
      message: "Vendor credit updated successfully",
      vendorCredit: vendorCredit,
    });
  } catch (error) {
    console.error("Update vendor credit error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Vendor credit with this number already exists" 
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

// Delete vendor credit
export const deleteVendorCredit = async (req, res) => {
  try {
    const { id } = req.params;

    const vendorCredit = await VendorCredit.findById(id);

    if (!vendorCredit) {
      return res.status(404).json({ message: "Vendor credit not found" });
    }

    // If vendor credit has items, add stock back to warehouse
    if (vendorCredit.items && vendorCredit.items.length > 0) {
      for (const item of vendorCredit.items) {
        if (item.quantity > 0) {
          await addItemStock(
            item.itemId,
            item.quantity,
            vendorCredit.warehouse || "Warehouse",
            item.itemName,
            null,
            null
          );
        }
      }
    }

    await VendorCredit.findByIdAndDelete(id);

    res.status(200).json({
      message: "Vendor credit deleted successfully",
    });
  } catch (error) {
    console.error("Delete vendor credit error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get next credit note number
export const getNextCreditNoteNumber = async (req, res) => {
  try {
    const { prefix } = req.query;
    const nextNumber = await nextCreditNote(prefix || "CN-");
    
    res.status(200).json({
      nextNumber: nextNumber,
    });
  } catch (error) {
    console.error("Get next credit note number error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get available vendor credits (for applying to bills)
export const getAvailableVendorCredits = async (req, res) => {
  try {
    const { vendorId, userId } = req.query;
    
    let filter = { status: "open" };
    
    if (vendorId) {
      filter.vendorId = vendorId;
    }
    
    if (userId) {
      filter.userId = userId;
    }

    const availableCredits = await VendorCredit.find(filter)
      .sort({ creditDate: -1 });

    res.status(200).json({
      message: "Available vendor credits retrieved successfully",
      vendorCredits: availableCredits,
    });
  } catch (error) {
    console.error("Get available vendor credits error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Apply credit to bill
export const applyCreditToBill = async (req, res) => {
  try {
    const { creditId, billId, amountToApply } = req.body;

    if (!creditId || !billId || !amountToApply) {
      return res.status(400).json({ 
        message: "Credit ID, Bill ID, and amount to apply are required" 
      });
    }

    const vendorCredit = await VendorCredit.findById(creditId);

    if (!vendorCredit) {
      return res.status(404).json({ message: "Vendor credit not found" });
    }

    if (vendorCredit.status !== "open") {
      return res.status(400).json({ message: "Vendor credit is not available for application" });
    }

    // Update vendor credit status if fully applied
    const remainingAmount = vendorCredit.finalTotal - amountToApply;
    if (remainingAmount <= 0) {
      vendorCredit.status = "applied";
    }

    await vendorCredit.save();

    res.status(200).json({
      message: "Credit applied to bill successfully",
      remainingAmount: Math.max(0, remainingAmount),
    });
  } catch (error) {
    console.error("Apply credit to bill error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};