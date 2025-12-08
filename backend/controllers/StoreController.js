import { Store, SalesPerson } from "../models/sequelize/index.js";
import { randomUUID } from 'crypto';

// Create a new store
export const createStore = async (req, res) => {
  try {
    const storeData = req.body;
    
    // Validate required fields
    if (!storeData.name || !storeData.locCode) {
      return res.status(400).json({ 
        message: "Store name and location code (locCode) are required" 
      });
    }
    
    // Generate UUID if not provided
    if (!storeData.id) {
      storeData.id = randomUUID();
    }
    
    // Remove empty email if provided to avoid validation issues
    if (storeData.email === '' || !storeData.email) {
      delete storeData.email; // Let it use the default empty string
    }
    
    const store = await Store.create(storeData);
    const storeJson = store.toJSON();
    
    res.status(201).json({
      message: "Store created successfully",
      store: storeJson,
    });
  } catch (error) {
    console.error("Create store error:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        message: "Store with this name or location code already exists" 
      });
    }
    if (error.name === 'SequelizeValidationError') {
      const validationErrors = error.errors?.map(e => e.message).join(', ') || error.message;
      return res.status(400).json({ 
        message: "Validation error", 
        errors: validationErrors 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all stores
export const getStores = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const whereClause = {};
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }
    
    const stores = await Store.findAll({
      where: whereClause,
      order: [['name', 'ASC']],
    });
    
    res.status(200).json({
      message: "Stores retrieved successfully",
      stores: stores.map(store => store.toJSON()),
    });
  } catch (error) {
    console.error("Get stores error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get store by ID
export const getStoreById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const store = await Store.findByPk(id, {
      include: [{
        model: SalesPerson,
        as: 'salesPersons',
        where: { isActive: true },
        required: false,
      }],
    });
    
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    
    res.status(200).json({
      message: "Store retrieved successfully",
      store: store.toJSON(),
    });
  } catch (error) {
    console.error("Get store by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get store by location code
export const getStoreByLocCode = async (req, res) => {
  try {
    const { locCode } = req.params;
    
    const store = await Store.findOne({
      where: { locCode },
      include: [{
        model: SalesPerson,
        as: 'salesPersons',
        where: { isActive: true },
        required: false,
      }],
    });
    
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    
    res.status(200).json({
      message: "Store retrieved successfully",
      store: store.toJSON(),
    });
  } catch (error) {
    console.error("Get store by locCode error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update store
export const updateStore = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    
    await store.update(updateData);
    const storeJson = store.toJSON();
    
    res.status(200).json({
      message: "Store updated successfully",
      store: storeJson,
    });
  } catch (error) {
    console.error("Update store error:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        message: "Store with this name or location code already exists" 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete store (soft delete by setting isActive to false)
export const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    
    const store = await Store.findByPk(id);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    
    // Soft delete - set isActive to false
    await store.update({ isActive: false });
    
    res.status(200).json({
      message: "Store deleted successfully",
    });
  } catch (error) {
    console.error("Delete store error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
