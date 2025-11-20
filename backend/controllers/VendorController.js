import Vendor from "../model/Vendor.js";

// Create a new vendor
export const createVendor = async (req, res) => {
  try {
    const vendorData = req.body;
    
    // Validate required fields
    if (!vendorData.displayName || !vendorData.userId) {
      return res.status(400).json({ message: "Display name and userId are required" });
    }
    
    const vendor = await Vendor.create(vendorData);
    res.status(201).json(vendor);
  } catch (error) {
    console.error("Create vendor error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "Vendor already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all vendors for a user
export const getVendors = async (req, res) => {
  try {
    const { userId, locCode } = req.query;
    
    const query = {};
    if (userId) query.userId = userId;
    if (locCode) query.locCode = locCode;
    
    const vendors = await Vendor.find(query).sort({ createdAt: -1 });
    res.status(200).json(vendors);
  } catch (error) {
    console.error("Get vendors error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single vendor by ID
export const getVendorById = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findById(id);
    
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    
    res.status(200).json(vendor);
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
    
    const vendor = await Vendor.findByIdAndUpdate(
      id,
      vendorData,
      { new: true, runValidators: true }
    );
    
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    
    res.status(200).json(vendor);
  } catch (error) {
    console.error("Update vendor error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a vendor
export const deleteVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const vendor = await Vendor.findByIdAndDelete(id);
    
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    
    res.status(200).json({ message: "Vendor deleted successfully" });
  } catch (error) {
    console.error("Delete vendor error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

