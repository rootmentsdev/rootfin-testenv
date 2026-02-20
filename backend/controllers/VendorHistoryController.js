import VendorHistory from "../model/VendorHistory.js";

// Get vendor history by vendor ID
export const getVendorHistory = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    if (!vendorId) {
      return res.status(400).json({ message: "Vendor ID is required" });
    }

    const history = await VendorHistory.find({ vendorId })
      .sort({ changedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const totalCount = await VendorHistory.countDocuments({ vendorId });

    res.status(200).json({
      message: "Vendor history retrieved successfully",
      history: history,
      totalCount: totalCount,
      hasMore: (parseInt(offset) + history.length) < totalCount,
    });
  } catch (error) {
    console.error("Get vendor history error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all vendor history (with pagination)
export const getAllVendorHistory = async (req, res) => {
  try {
    const { limit = 50, offset = 0, eventType } = req.query;
    
    let filter = {};
    if (eventType) {
      filter.eventType = eventType;
    }

    const history = await VendorHistory.find(filter)
      .sort({ changedAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const totalCount = await VendorHistory.countDocuments(filter);

    res.status(200).json({
      message: "Vendor history retrieved successfully",
      history: history,
      totalCount: totalCount,
      hasMore: (parseInt(offset) + history.length) < totalCount,
    });
  } catch (error) {
    console.error("Get all vendor history error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create vendor history entry
export const createVendorHistory = async (req, res) => {
  try {
    const historyData = req.body;

    // Validate required fields
    if (!historyData.vendorId || !historyData.eventType || !historyData.title || !historyData.description) {
      return res.status(400).json({ 
        message: "Vendor ID, event type, title, and description are required" 
      });
    }

    const history = await VendorHistory.create(historyData);

    res.status(201).json({
      message: "Vendor history entry created successfully",
      history: history,
    });
  } catch (error) {
    console.error("Create vendor history error:", error);
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