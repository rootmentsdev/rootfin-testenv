// Updated to use PostgreSQL (Sequelize) instead of MongoDB
import { Vendor } from "../models/sequelize/index.js";
import { randomUUID } from 'crypto';

// Create a new vendor
export const createVendor = async (req, res) => {
  try {
    const vendorData = req.body;
    
    // Validate required fields
    if (!vendorData.displayName || !vendorData.userId) {
      return res.status(400).json({ message: "Display name and userId are required" });
    }
    
    // Ensure contacts and bankAccounts are arrays
    if (vendorData.contacts && !Array.isArray(vendorData.contacts)) {
      vendorData.contacts = [];
    }
    if (vendorData.bankAccounts && !Array.isArray(vendorData.bankAccounts)) {
      vendorData.bankAccounts = [];
    }
    
    // Generate UUID for new vendors if id not provided
    if (!vendorData.id) {
      vendorData.id = randomUUID();
    }
    
    const vendor = await Vendor.create(vendorData);
    res.status(201).json(vendor.toJSON());
  } catch (error) {
    console.error("Create vendor error:", error);
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: "Vendor already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all vendors for a user
export const getVendors = async (req, res) => {
  try {
    const { userId, locCode } = req.query;
    
    const whereClause = {};
    if (userId) whereClause.userId = userId;
    if (locCode) whereClause.locCode = locCode;
    
    const vendors = await Vendor.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']],
    });
    
    res.status(200).json(vendors.map(vendor => vendor.toJSON()));
  } catch (error) {
    console.error("Get vendors error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single vendor by ID
export const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findByPk(id);
    
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    
    res.status(200).json(vendor.toJSON());
  } catch (error) {
    console.error("Get vendor error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a vendor
export const updateVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const vendorData = req.body;
    
    // Ensure contacts and bankAccounts are arrays if provided
    if (vendorData.contacts && !Array.isArray(vendorData.contacts)) {
      vendorData.contacts = [];
    }
    if (vendorData.bankAccounts && !Array.isArray(vendorData.bankAccounts)) {
      vendorData.bankAccounts = [];
    }
    
    const [updatedRows] = await Vendor.update(vendorData, {
      where: { id },
      returning: true,
    });
    
    if (updatedRows === 0) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    
    // Fetch updated vendor
    const vendor = await Vendor.findByPk(id);
    res.status(200).json(vendor.toJSON());
  } catch (error) {
    console.error("Update vendor error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a vendor
export const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedRows = await Vendor.destroy({
      where: { id },
    });
    
    if (deletedRows === 0) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    
    res.status(200).json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Delete vendor error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

