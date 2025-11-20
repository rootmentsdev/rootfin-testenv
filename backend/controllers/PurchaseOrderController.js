import PurchaseOrder from "../model/PurchaseOrder.js";

// Create a new purchase order
export const createPurchaseOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validate required fields
    if (!orderData.orderNumber || !orderData.userId) {
      return res.status(400).json({ message: "Order number and userId are required" });
    }
    
    const purchaseOrder = await PurchaseOrder.create(orderData);
    res.status(201).json(purchaseOrder);
  } catch (error) {
    console.error("Create purchase order error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "Order number already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all purchase orders for a user
export const getPurchaseOrders = async (req, res) => {
  try {
    const { userId, locCode, status } = req.query;
    
    const query = {};
    if (userId) query.userId = userId;
    if (locCode) query.locCode = locCode;
    if (status) query.status = status;
    
    const purchaseOrders = await PurchaseOrder.find(query)
      .populate("vendorId", "displayName companyName")
      .sort({ createdAt: -1 });
    res.status(200).json(purchaseOrders);
  } catch (error) {
    console.error("Get purchase orders error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single purchase order by ID
export const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseOrder = await PurchaseOrder.findById(id).populate("vendorId");
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    
    res.status(200).json(purchaseOrder);
  } catch (error) {
    console.error("Get purchase order error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a purchase order
export const updatePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const orderData = req.body;
    
    const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      id,
      orderData,
      { new: true, runValidators: true }
    );
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    
    res.status(200).json(purchaseOrder);
  } catch (error) {
    console.error("Update purchase order error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a purchase order
export const deletePurchaseOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseOrder = await PurchaseOrder.findByIdAndDelete(id);
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    
    res.status(200).json({ message: "Purchase order deleted successfully" });
  } catch (error) {
    console.error("Delete purchase order error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

