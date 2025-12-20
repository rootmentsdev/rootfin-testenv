import PurchaseOrder from "../model/PurchaseOrder.js";
import { nextPurchaseOrder } from "../utils/nextPurchaseOrder.js";

// Get next purchase order number
export const getNextOrderNumber = async (req, res) => {
  try {
    const nextNumber = await nextPurchaseOrder();
    res.status(200).json({ orderNumber: nextNumber });
  } catch (error) {
    console.error("Get next order number error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Create a new purchase order
export const createPurchaseOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    // Auto-generate order number if not provided
    if (!orderData.orderNumber) {
      orderData.orderNumber = await nextPurchaseOrder();
    }
    
    // Validate required fields
    if (!orderData.userId) {
      return res.status(400).json({ message: "UserId is required" });
    }
    
    // Check if order with this orderNumber already exists
    const existingOrder = await PurchaseOrder.findOne({ orderNumber: orderData.orderNumber });
    if (existingOrder) {
      // Return the existing order so frontend can navigate to it
      return res.status(409).json({ 
        message: "Order number already exists",
        existingOrder: existingOrder 
      });
    }
    
    // Save all data to MongoDB
    const purchaseOrder = await PurchaseOrder.create(orderData);
    console.log(`Purchase order ${orderData.orderNumber} saved to MongoDB with ID: ${purchaseOrder._id}`);
    res.status(201).json(purchaseOrder);
  } catch (error) {
    console.error("Create purchase order error:", error);
    if (error.code === 11000) {
      // Double check in case of race condition
      const existingOrder = await PurchaseOrder.findOne({ orderNumber: req.body.orderNumber });
      if (existingOrder) {
        return res.status(409).json({ 
          message: "Order number already exists",
          existingOrder: existingOrder 
        });
      }
      return res.status(409).json({ message: "Order number already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all purchase orders for a user
export const getPurchaseOrders = async (req, res) => {
  try {
    const { userId, userPower, status, orderNumber, warehouse, locCode } = req.query;
    
    const query = {};
    
    // If orderNumber is provided, find by orderNumber (for searching)
    if (orderNumber) {
      query.orderNumber = orderNumber;
      console.log(`Searching by orderNumber: ${orderNumber}`);
    } else {
      // Filter by user email only - admin users see all data
      const adminEmails = ['officerootments@gmail.com'];
      const isAdminEmail = userId && typeof userId === 'string' && adminEmails.some(email => userId.toLowerCase() === email.toLowerCase());
      const isAdmin = isAdminEmail ||
                      (userPower && (userPower.toLowerCase() === 'admin' || userPower.toLowerCase() === 'super_admin')) ||
                      (locCode && (locCode === '858' || locCode === '103'));
      
      // If admin has switched to a specific store (not Warehouse), filter by that store
      const isAdminViewingSpecificStore = isAdmin && warehouse && warehouse !== "Warehouse";
      
      if ((!isAdmin || isAdminViewingSpecificStore) && warehouse) {
        // Check warehouse, branch, or locCode fields for compatibility with old orders
        query.$or = [
          { warehouse: warehouse },
          { branch: warehouse },
          { locCode: warehouse }
        ];
        console.log(`📦 Filtering purchase orders for warehouse: ${warehouse}`);
      } else if (!isAdmin && userId) {
        const userIdStr = userId.toString();
        // Use email as primary identifier - case insensitive match
        if (userIdStr.includes('@')) {
          query.userId = { $regex: `^${userIdStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
        } else {
          query.userId = userIdStr;
        }
      }
      // If admin, no userId filter - show all orders
    }
    
    if (status) query.status = status;
    
    console.log(`Query for purchase orders:`, JSON.stringify(query, null, 2));
    console.log(`Query params - userId: ${userId}, userPower: ${userPower}, status: ${status}`);
    
    const purchaseOrders = await PurchaseOrder.find(query)
      .sort({ createdAt: -1 });
    
    console.log(`Found ${purchaseOrders.length} purchase orders`);
    
    res.status(200).json(purchaseOrders);
  } catch (error) {
    console.error("Get purchase orders error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get purchase order by orderNumber
export const getPurchaseOrderByNumber = async (req, res) => {
  try {
    const { orderNumber } = req.params;
    const purchaseOrder = await PurchaseOrder.findOne({ orderNumber });
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    
    res.status(200).json(purchaseOrder);
  } catch (error) {
    console.error("Get purchase order by number error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single purchase order by ID
export const getPurchaseOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseOrder = await PurchaseOrder.findById(id)
      .populate("items.itemId"); // Populate itemId in items array
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    
    console.log(`Fetched purchase order ${purchaseOrder.orderNumber} with ${purchaseOrder.items?.length || 0} items`);
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
    
    // Check if orderNumber is being changed and if it already exists
    if (orderData.orderNumber) {
      const existingOrder = await PurchaseOrder.findOne({ 
        orderNumber: orderData.orderNumber,
        _id: { $ne: id } // Exclude current order
      });
      
      if (existingOrder) {
        return res.status(409).json({ 
          message: "Order number already exists",
          existingOrder: existingOrder 
        });
      }
    }
    
    // Update the order - all data is saved to MongoDB
    const purchaseOrder = await PurchaseOrder.findByIdAndUpdate(
      id,
      orderData,
      { new: true, runValidators: true }
    );
    
    if (!purchaseOrder) {
      return res.status(404).json({ message: "Purchase order not found" });
    }
    
    console.log(`Purchase order ${purchaseOrder.orderNumber} updated in MongoDB with ID: ${purchaseOrder._id}`);
    res.status(200).json(purchaseOrder);
  } catch (error) {
    console.error("Update purchase order error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ message: "Order number already exists" });
    }
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

