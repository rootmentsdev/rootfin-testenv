import { SalesPerson, Store } from "../models/sequelize/index.js";
import { randomUUID } from 'crypto';

// Create a new sales person
export const createSalesPerson = async (req, res) => {
  try {
    const salesPersonData = req.body;
    
    // Validate required fields
    if (!salesPersonData.firstName || !salesPersonData.lastName || 
        !salesPersonData.employeeId || !salesPersonData.phone || !salesPersonData.storeId) {
      return res.status(400).json({ 
        message: "First name, last name, employee ID, phone, and store ID are required" 
      });
    }
    
    // Verify store exists
    const store = await Store.findByPk(salesPersonData.storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    
    // Generate UUID if not provided
    if (!salesPersonData.id) {
      salesPersonData.id = randomUUID();
    }
    
    const salesPerson = await SalesPerson.create(salesPersonData);
    const salesPersonJson = salesPerson.toJSON();
    
    // Include store information in response
    const salesPersonWithStore = await SalesPerson.findByPk(salesPersonJson.id, {
      include: [{
        model: Store,
        as: 'store',
      }],
    });
    
    res.status(201).json({
      message: "Sales person created successfully",
      salesPerson: salesPersonWithStore.toJSON(),
    });
  } catch (error) {
    console.error("Create sales person error:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        message: "Sales person with this employee ID already exists" 
      });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        message: "Invalid store ID" 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all sales persons (optionally filtered by store)
export const getSalesPersons = async (req, res) => {
  try {
    const { storeId, locCode, isActive } = req.query;
    
    const whereClause = {};
    const includeOptions = {
      model: Store,
      as: 'store',
      required: true,
    };
    
    // Filter by storeId if provided
    if (storeId) {
      whereClause.storeId = storeId;
    }
    
    // Filter by location code if provided
    if (locCode) {
      includeOptions.where = { locCode };
    }
    
    // Filter by active status
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }
    
    const salesPersons = await SalesPerson.findAll({
      where: whereClause,
      include: [includeOptions],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    });
    
    res.status(200).json({
      message: "Sales persons retrieved successfully",
      salesPersons: salesPersons.map(sp => sp.toJSON()),
    });
  } catch (error) {
    console.error("Get sales persons error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get sales persons by location code (e.g., Edapally)
export const getSalesPersonsByLocCode = async (req, res) => {
  try {
    const { locCode } = req.params;
    const { isActive } = req.query;
    
    // First, find the store by location code
    const store = await Store.findOne({ where: { locCode } });
    
    if (!store) {
      return res.status(404).json({ 
        message: `Store with location code "${locCode}" not found` 
      });
    }
    
    const whereClause = { storeId: store.id };
    
    // Filter by active status if provided
    if (isActive !== undefined) {
      whereClause.isActive = isActive === 'true';
    }
    
    const salesPersons = await SalesPerson.findAll({
      where: whereClause,
      include: [{
        model: Store,
        as: 'store',
      }],
      order: [['firstName', 'ASC'], ['lastName', 'ASC']],
    });
    
    res.status(200).json({
      message: `Sales persons for ${store.name} (${locCode}) retrieved successfully`,
      store: {
        id: store.id,
        name: store.name,
        locCode: store.locCode,
      },
      salesPersons: salesPersons.map(sp => sp.toJSON()),
    });
  } catch (error) {
    console.error("Get sales persons by locCode error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get sales person by ID
export const getSalesPersonById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const salesPerson = await SalesPerson.findByPk(id, {
      include: [{
        model: Store,
        as: 'store',
      }],
    });
    
    if (!salesPerson) {
      return res.status(404).json({ message: "Sales person not found" });
    }
    
    res.status(200).json({
      message: "Sales person retrieved successfully",
      salesPerson: salesPerson.toJSON(),
    });
  } catch (error) {
    console.error("Get sales person by ID error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update sales person
export const updateSalesPerson = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // If storeId is being updated, verify the store exists
    if (updateData.storeId) {
      const store = await Store.findByPk(updateData.storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
    }
    
    const salesPerson = await SalesPerson.findByPk(id);
    if (!salesPerson) {
      return res.status(404).json({ message: "Sales person not found" });
    }
    
    await salesPerson.update(updateData);
    
    // Fetch updated sales person with store info
    const updatedSalesPerson = await SalesPerson.findByPk(id, {
      include: [{
        model: Store,
        as: 'store',
      }],
    });
    
    res.status(200).json({
      message: "Sales person updated successfully",
      salesPerson: updatedSalesPerson.toJSON(),
    });
  } catch (error) {
    console.error("Update sales person error:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ 
        message: "Sales person with this employee ID already exists" 
      });
    }
    if (error.name === 'SequelizeForeignKeyConstraintError') {
      return res.status(400).json({ 
        message: "Invalid store ID" 
      });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete sales person (soft delete by setting isActive to false)
export const deleteSalesPerson = async (req, res) => {
  try {
    const { id } = req.params;
    
    const salesPerson = await SalesPerson.findByPk(id);
    if (!salesPerson) {
      return res.status(404).json({ message: "Sales person not found" });
    }
    
    // Soft delete - set isActive to false
    await salesPerson.update({ isActive: false });
    
    res.status(200).json({
      message: "Sales person deleted successfully",
    });
  } catch (error) {
    console.error("Delete sales person error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
