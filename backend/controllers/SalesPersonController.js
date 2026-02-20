import SalesPerson from "../model/SalesPerson.js";
import Store from "../model/Store.js";

// Create a new sales person
export const createSalesPerson = async (req, res) => {
  try {
    const salesPersonData = req.body;
    
    // Validate required fields - only firstName, employeeId, and storeId
    if (!salesPersonData.firstName || !salesPersonData.employeeId || !salesPersonData.storeId) {
      return res.status(400).json({ 
        message: "First name, employee ID, and store ID are required" 
      });
    }
    
    // Set default values for optional fields
    if (!salesPersonData.lastName) {
      salesPersonData.lastName = "-";
    }
    if (!salesPersonData.phone) {
      salesPersonData.phone = "0000000000";
    }
    if (!salesPersonData.email) {
      salesPersonData.email = `${salesPersonData.employeeId}@placeholder.com`;
    }
    
    // Verify store exists
    const store = await Store.findById(salesPersonData.storeId);
    if (!store) {
      return res.status(404).json({ message: "Store not found" });
    }
    
    const salesPerson = await SalesPerson.create(salesPersonData);
    
    // Populate store information in response
    const salesPersonWithStore = await SalesPerson.findById(salesPerson._id).populate('storeId');
    
    res.status(201).json({
      message: "Sales person created successfully",
      salesPerson: salesPersonWithStore,
    });
  } catch (error) {
    console.error("Create sales person error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Sales person with this employee ID already exists" 
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

// Get all sales persons
export const getSalesPersons = async (req, res) => {
  try {
    const { storeId, locCode, isActive } = req.query;
    
    let filter = {};
    
    // Filter by active status
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    // Filter by storeId if provided
    if (storeId) {
      filter.storeId = storeId;
    }
    
    // Filter by locCode if provided (need to find store first)
    if (locCode && !storeId) {
      const store = await Store.findOne({ locCode });
      if (store) {
        filter.storeId = store._id;
      } else {
        return res.status(404).json({ message: "Store not found for the provided location code" });
      }
    }
    
    const salesPersons = await SalesPerson.find(filter)
      .populate('storeId')
      .sort({ firstName: 1 });
    
    res.status(200).json({
      message: "Sales persons retrieved successfully",
      salesPersons: salesPersons,
    });
  } catch (error) {
    console.error("Get sales persons error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get sales persons by location code
export const getSalesPersonsByLocCode = async (req, res) => {
  try {
    const { locCode } = req.params;
    const { isActive } = req.query;
    
    // Find store by location code
    const store = await Store.findOne({ locCode });
    if (!store) {
      return res.status(404).json({ message: "Store not found for the provided location code" });
    }
    
    let filter = { storeId: store._id };
    
    // Filter by active status
    if (isActive !== undefined) {
      filter.isActive = isActive === 'true';
    }
    
    const salesPersons = await SalesPerson.find(filter)
      .populate('storeId')
      .sort({ firstName: 1 });
    
    res.status(200).json({
      message: "Sales persons retrieved successfully",
      salesPersons: salesPersons,
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
    
    const salesPerson = await SalesPerson.findById(id).populate('storeId');
    
    if (!salesPerson) {
      return res.status(404).json({ message: "Sales person not found" });
    }
    
    res.status(200).json({
      message: "Sales person retrieved successfully",
      salesPerson: salesPerson,
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
      const store = await Store.findById(updateData.storeId);
      if (!store) {
        return res.status(404).json({ message: "Store not found" });
      }
    }
    
    const salesPerson = await SalesPerson.findByIdAndUpdate(
      id, 
      updateData, 
      { new: true, runValidators: true }
    ).populate('storeId');
    
    if (!salesPerson) {
      return res.status(404).json({ message: "Sales person not found" });
    }
    
    res.status(200).json({
      message: "Sales person updated successfully",
      salesPerson: salesPerson,
    });
  } catch (error) {
    console.error("Update sales person error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ 
        message: "Sales person with this employee ID already exists" 
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

// Delete sales person (soft delete by setting isActive to false)
export const deleteSalesPerson = async (req, res) => {
  try {
    const { id } = req.params;
    
    const salesPerson = await SalesPerson.findByIdAndUpdate(
      id, 
      { isActive: false }, 
      { new: true }
    );
    
    if (!salesPerson) {
      return res.status(404).json({ message: "Sales person not found" });
    }
    
    res.status(200).json({
      message: "Sales person deleted successfully",
    });
  } catch (error) {
    console.error("Delete sales person error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};