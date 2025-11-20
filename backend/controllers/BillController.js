import Bill from "../model/Bill.js";

// Create a new bill
export const createBill = async (req, res) => {
  try {
    const billData = req.body;
    
    // Validate required fields
    if (!billData.billNumber || !billData.vendorName || !billData.userId) {
      return res.status(400).json({ message: "Bill number, vendor name, and userId are required" });
    }
    
    // Validate vendorId if provided
    if (billData.vendorId) {
      const mongoose = (await import("mongoose")).default;
      if (!mongoose.Types.ObjectId.isValid(billData.vendorId)) {
        // If vendorId is not a valid ObjectId, set it to null (optional field)
        console.warn("Invalid vendorId format, setting to null:", billData.vendorId);
        billData.vendorId = null;
      }
    } else {
      // Make vendorId optional if not provided
      billData.vendorId = null;
    }
    
    // Make billNumber unique per user/locCode instead of globally unique
    const existingBill = await Bill.findOne({ 
      billNumber: billData.billNumber,
      userId: billData.userId,
      locCode: billData.locCode || ""
    });
    
    if (existingBill) {
      return res.status(409).json({ message: "Bill number already exists for this user" });
    }
    
    const bill = await Bill.create(billData);
    res.status(201).json(bill);
  } catch (error) {
    console.error("Create bill error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      code: error.code,
      keyValue: error.keyValue,
      errors: error.errors
    });
    
    if (error.code === 11000) {
      return res.status(409).json({ message: "Bill number already exists" });
    }
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(e => e.message).join(", ");
      return res.status(400).json({ message: "Validation error", error: errors });
    }
    
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all bills for a user
export const getBills = async (req, res) => {
  try {
    const { userId, locCode, status } = req.query;
    
    const query = {};
    if (userId) query.userId = userId;
    if (locCode) query.locCode = locCode;
    if (status) query.status = status;
    
    const bills = await Bill.find(query)
      .populate("vendorId", "displayName companyName gstin")
      .sort({ createdAt: -1 });
    res.status(200).json(bills);
  } catch (error) {
    console.error("Get bills error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single bill by ID
export const getBillById = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findById(id).populate("vendorId");
    
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    
    res.status(200).json(bill);
  } catch (error) {
    console.error("Get bill error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a bill
export const updateBill = async (req, res) => {
  try {
    const { id } = req.params;
    const billData = req.body;
    
    const bill = await Bill.findByIdAndUpdate(
      id,
      billData,
      { new: true, runValidators: true }
    );
    
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    
    res.status(200).json(bill);
  } catch (error) {
    console.error("Update bill error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a bill
export const deleteBill = async (req, res) => {
  try {
    const { id } = req.params;
    const bill = await Bill.findByIdAndDelete(id);
    
    if (!bill) {
      return res.status(404).json({ message: "Bill not found" });
    }
    
    res.status(200).json({ message: "Bill deleted successfully" });
  } catch (error) {
    console.error("Delete bill error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

