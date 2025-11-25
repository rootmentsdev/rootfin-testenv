import PurchaseOrder from "../model/PurchaseOrder.js";

// Create a new purchase order
export const createPurchaseOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    // Validate required fields
    if (!orderData.orderNumber || !orderData.userId) {
      return res.status(400).json({ message: "Order number and userId are required" });
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
    const { userId, locCode, status, orderNumber } = req.query;
    
    const query = {};
    
    // If orderNumber is provided, find by orderNumber (for searching) - no userId filter needed
    if (orderNumber) {
      query.orderNumber = orderNumber;
      console.log(`Searching by orderNumber: ${orderNumber}`);
    } else {
      // For listing orders, be more inclusive to show all user's orders
      // Some orders might have been saved with different userId formats
      const userConditions = [];
      
      if (userId) {
        const userIdStr = userId.toString();
        // Prioritize email-based matching - use email as primary identifier
        userConditions.push(
          { userId: userId },        // Exact match (email or other)
          { userId: userIdStr }      // String version
        );
        
        // If userId is an email, also try matching without case sensitivity
        if (userId.includes('@')) {
          // MongoDB case-insensitive email match
          userConditions.push({ userId: { $regex: `^${userIdStr}$`, $options: 'i' } });
        }
      }
      
      // If locCode is provided, also match by locCode
      if (locCode) {
        userConditions.push({ locCode: locCode });
      }
      
      // If we have conditions, use $or to match ANY of them
      // If no conditions, show all orders (for cases where userId wasn't saved properly)
      if (userConditions.length > 0) {
        query.$or = userConditions;
      } else {
        // No userId or locCode provided - show all orders
        // This helps debug and also shows orders that might not have proper userId
        console.log("No userId/locCode filter - showing all orders");
      }
    }
    
    if (status) query.status = status;
    
    console.log(`Query for purchase orders:`, JSON.stringify(query, null, 2));
    console.log(`Query params - userId: ${userId}, locCode: ${locCode}, status: ${status}`);
    
    let purchaseOrders = await PurchaseOrder.find(query)
      .populate("vendorId", "displayName companyName")
      .sort({ createdAt: -1 });
    
    console.log(`Found ${purchaseOrders.length} purchase orders with initial query`);
    
    // Always check if PO-0001 or any orders exist with different userId (email), then fix them
    // Update all orders that don't have the current user's email to use email as userId
    if (userId && !orderNumber) {
      // Check if userId is an email (contains @)
      const isEmail = userId.includes('@');
      
      if (isEmail) {
        // Find orders that don't have this email but might belong to this user
        // First, try fetching ALL orders without userId filter to see what exists
        const allOrdersCheck = await PurchaseOrder.find({})
          .select('orderNumber userId locCode')
          .limit(50)
          .sort({ createdAt: -1 });
        
        // Find orders that don't match current email but might be the user's orders
        // (e.g., PO-0001 that was created before email-based system)
        const ordersNeedingUpdate = allOrdersCheck.filter(order => 
          order.userId !== userId && 
          (order.locCode === locCode || !order.userId || order.userId === "" || order.userId === null)
        );
        
        if (ordersNeedingUpdate.length > 0) {
          console.log(`Found ${ordersNeedingUpdate.length} orders that need userId update to: ${userId}`);
          console.log(`Order numbers to update:`, ordersNeedingUpdate.map(o => o.orderNumber).join(', '));
          
          // Update each order individually to use email as userId
          for (const order of ordersNeedingUpdate) {
            await PurchaseOrder.findByIdAndUpdate(order._id, {
              userId: userId,
              locCode: locCode || order.locCode || ""
            });
          }
          
          console.log(`Updated ${ordersNeedingUpdate.length} orders to use email as userId`);
          
          // Re-fetch orders now that they're updated
          purchaseOrders = await PurchaseOrder.find(query)
            .populate("vendorId", "displayName companyName")
            .sort({ createdAt: -1 });
          console.log(`After updating orders, found ${purchaseOrders.length} orders`);
        }
      }
    }
    
    // If still no results and we're filtering by userId, try a more permissive search
    // Include orders that might have been saved with similar but not exact userId
    if (purchaseOrders.length === 0 && userId && !orderNumber) {
      console.log("Trying more permissive query (showing all orders)...");
      const permissiveQuery = status ? { status } : {};
      const allOrders = await PurchaseOrder.find(permissiveQuery)
        .populate("vendorId", "displayName companyName")
        .sort({ createdAt: -1 })
        .limit(50); // Limit to prevent huge results
      
      console.log(`Found ${allOrders.length} total orders in database (without userId filter)`);
      if (allOrders.length > 0) {
        console.log("Sample order userIds:", allOrders.slice(0, 3).map(o => ({ orderNumber: o.orderNumber, userId: o.userId, locCode: o.locCode })));
      }
      
      // If we found orders but none matched, return them anyway for now (helps debug)
      // TODO: In production, you might want to remove this or make it conditional
      purchaseOrders = allOrders;
    }
    
    if (purchaseOrders.length > 0) {
      console.log(`Returning ${purchaseOrders.length} orders. Order numbers:`, purchaseOrders.map(o => o.orderNumber).join(', '));
    }
    
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
    const purchaseOrder = await PurchaseOrder.findOne({ orderNumber })
      .populate("vendorId", "displayName companyName");
    
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
      .populate("vendorId")
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

