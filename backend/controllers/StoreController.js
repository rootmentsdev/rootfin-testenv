import Store from "../model/Store.js";
import SalesPerson from "../model/SalesPerson.js";

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
    
    // Remove empty email if provided to avoid validation issues
    if (storeData.email === '' || !storeData.email) {
      delete storeData.email; // Let it use the default empty string
    }
    
    const store = await Store.create(storeData);
    
    res.status(201).json({
      message: "Store created successfully",
      store: store,
    });
  } catch (error) {
    console.error("Create store error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Store with this name or location code already exists" 
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

// Get all stores
export const getStores = async (req, res) => {
  try {
    const { isActive } = req.query;
    
    const filter = {};
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    const stores = await Store.find(filter).sort({ name: 1 });
    
    res.status(200).json({
      message: "Stores retrieved successfully",
      stores: stores,
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
    
    const store = await Store.findById(id);
    
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    
    // Get associated sales persons
    const salesPersons = await SalesPerson.find({ 
      storeId: id, 
      isActive: true 
    });
    
    const storeWithSalesPersons = {
      ...store.toObject(),
      salesPersons: salesPersons
    };
    
    res.status(200).json({
      message: "Store retrieved successfully",
      store: storeWithSalesPersons,
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
    
    const store = await Store.findOne({ locCode });
    
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    
    // Get associated sales persons
    const salesPersons = await SalesPerson.find({ 
      storeId: store._id, 
      isActive: true 
    });
    
    const storeWithSalesPersons = {
      ...store.toObject(),
      salesPersons: salesPersons
    };
    
    res.status(200).json({
      message: "Store retrieved successfully",
      store: storeWithSalesPersons,
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
    
    const store = await Store.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    
    res.status(200).json({
      message: "Store updated successfully",
      store: store,
    });
  } catch (error) {
    console.error("Update store error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Store with this name or location code already exists" 
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

// Delete store (soft delete by setting isActive to false)
export const deleteStore = async (req, res) => {
  try {
    const { id } = req.params;
    
    const store = await Store.findByIdAndUpdate(
      id, 
      { isActive: false }, 
      { new: true }
    );
    
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    
    res.status(200).json({
      message: "Store deleted successfully",
    });
  } catch (error) {
    console.error("Delete store error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};