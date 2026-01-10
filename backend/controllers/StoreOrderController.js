// Store Order Controller - Manages store orders from stores to warehouse
import { Op } from "sequelize";
import { StoreOrder as StoreOrderPostgres, TransferOrder as TransferOrderPostgres } from "../models/sequelize/index.js";
import StoreOrder from "../model/StoreOrder.js"; // MongoDB model
import ShoeItem from "../model/ShoeItem.js";
import ItemGroup from "../model/ItemGroup.js";
import { nextStoreOrder } from "../utils/nextStoreOrder.js";

// Get next store order number
export const getNextOrderNumber = async (req, res) => {
  try {
    const nextNumber = await nextStoreOrder();
    res.status(200).json({ orderNumber: nextNumber });
  } catch (error) {
    console.error("Get next store order number error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Helper function for flexible warehouse matching (same as TransferOrderController)
const WAREHOUSE_NAME_MAPPING = {
  "Grooms Trivandum": "Grooms Trivandrum",
  "Grooms Trivandrum": "Grooms Trivandrum",
  "SG-Trivandrum": "Grooms Trivandrum",
  "G.Palakkad": "Palakkad Branch",
  "G.Palakkad ": "Palakkad Branch",
  "GPalakkad": "Palakkad Branch",
  "Palakkad Branch": "Palakkad Branch",
  "Warehouse": "Warehouse",
  "warehouse": "Warehouse",
  "WAREHOUSE": "Warehouse",
  "G.Calicut": "Calicut",
  "G.Calicut ": "Calicut",
  "GCalicut": "Calicut",
  "Calicut": "Calicut",
  "G.Manjeri": "Manjery Branch",
  "G.Manjery": "Manjery Branch",
  "GManjeri": "Manjery Branch",
  "GManjery": "Manjery Branch",
  "Manjery Branch": "Manjery Branch",
  "G.Kannur": "Kannur Branch",
  "GKannur": "Kannur Branch",
  "Kannur Branch": "Kannur Branch",
  "G.Edappal": "Edappal Branch",
  "GEdappal": "Edappal Branch",
  "Edappal Branch": "Edappal Branch",
  "G.Edappally": "Edapally Branch",
  "G-Edappally": "Edapally Branch",
  "GEdappally": "Edapally Branch",
  "Edapally Branch": "Edapally Branch",
  "G.Kalpetta": "Kalpetta Branch",
  "GKalpetta": "Kalpetta Branch",
  "Kalpetta Branch": "Kalpetta Branch",
  "G.Kottakkal": "Kottakkal Branch",
  "GKottakkal": "Kottakkal Branch",
  "Kottakkal Branch": "Kottakkal Branch",
  "Z.Kottakkal": "Kottakkal Branch",
  "G.Perinthalmanna": "Perinthalmanna Branch",
  "GPerinthalmanna": "Perinthalmanna Branch",
  "Perinthalmanna Branch": "Perinthalmanna Branch",
  "Z.Perinthalmanna": "Perinthalmanna Branch",
  "G.Chavakkad": "Chavakkad Branch",
  "GChavakkad": "Chavakkad Branch",
  "Chavakkad Branch": "Chavakkad Branch",
  "G.Thrissur": "Thrissur Branch",
  "GThrissur": "Thrissur Branch",
  "Thrissur Branch": "Thrissur Branch",
  "G.Perumbavoor": "Perumbavoor Branch",
  "GPerumbavoor": "Perumbavoor Branch",
  "Perumbavoor Branch": "Perumbavoor Branch",
  "G.Kottayam": "Kottayam Branch",
  "GKottayam": "Kottayam Branch",
  "Kottayam Branch": "Kottayam Branch",
  "G.MG Road": "SuitorGuy MG Road",
  "G.Mg Road": "SuitorGuy MG Road",
  "GMG Road": "SuitorGuy MG Road",
  "GMg Road": "SuitorGuy MG Road",
  "MG Road": "SuitorGuy MG Road",
  "SuitorGuy MG Road": "SuitorGuy MG Road",
  "HEAD OFFICE01": "Head Office",
  "Head Office": "Head Office",
  "Z-Edapally1": "Warehouse",
  "Z- Edappal": "Warehouse",
  "Production": "Warehouse",
  "Office": "Warehouse",
  "G.Vadakara": "Warehouse",
};

const normalizeWarehouseName = (warehouseName) => {
  if (!warehouseName) return null;
  const trimmed = warehouseName.toString().trim();
  if (WAREHOUSE_NAME_MAPPING[trimmed]) {
    return WAREHOUSE_NAME_MAPPING[trimmed];
  }
  const lowerName = trimmed.toLowerCase();
  for (const [key, value] of Object.entries(WAREHOUSE_NAME_MAPPING)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  return trimmed;
};

const matchesWarehouse = (itemWarehouse, targetWarehouse) => {
  if (!itemWarehouse || !targetWarehouse) return false;
  const normalizedItem = normalizeWarehouseName(itemWarehouse);
  const normalizedTarget = normalizeWarehouseName(targetWarehouse);
  if (normalizedItem && normalizedTarget && normalizedItem.toLowerCase() === normalizedTarget.toLowerCase()) {
    return true;
  }
  const itemWarehouseLower = itemWarehouse.toString().toLowerCase().trim();
  const targetWarehouseLower = targetWarehouse.toLowerCase().trim();
  const itemBase = itemWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
  const targetBase = targetWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
  if (itemWarehouseLower === targetWarehouseLower) return true;
  if (itemBase && targetBase && itemBase === targetBase) return true;
  if (itemWarehouseLower.includes(targetWarehouseLower) || targetWarehouseLower.includes(itemWarehouseLower)) {
    return true;
  }
  return false;
};

// Get current stock for an item in a warehouse
const getCurrentStock = async (itemIdValue, warehouseName, itemName = null, itemGroupId = null, itemSku = null) => {
  const targetWarehouse = warehouseName?.trim() || "Warehouse";
  const normalizedTarget = normalizeWarehouseName(targetWarehouse);
  
  // Try standalone item first
  if (itemIdValue && itemIdValue !== null && itemIdValue !== "null") {
    const shoeItem = await ShoeItem.findById(itemIdValue);
    if (shoeItem) {
      const warehouseStocks = shoeItem.warehouseStocks || [];
      for (const ws of warehouseStocks) {
        if (matchesWarehouse(ws.warehouse, normalizedTarget)) {
          return {
            currentQuantity: parseFloat(ws.stockOnHand) || 0,
            availableForSale: parseFloat(ws.availableForSale) || 0,
            type: 'standalone'
          };
        }
      }
      return { currentQuantity: 0, availableForSale: 0, type: 'standalone' };
    }
  }
  
  // Try item groups
  if (itemGroupId && itemName) {
    const group = await ItemGroup.findById(itemGroupId);
    if (group) {
      const item = group.items.find(i => {
        if (itemSku && i.sku) {
          return i.sku.toLowerCase() === itemSku.toLowerCase();
        }
        return i.name.toLowerCase() === itemName.toLowerCase();
      });
      
      if (item) {
        const warehouseStocks = item.warehouseStocks || [];
        for (const ws of warehouseStocks) {
          if (matchesWarehouse(ws.warehouse, normalizedTarget)) {
            return {
              currentQuantity: parseFloat(ws.stockOnHand) || 0,
              availableForSale: parseFloat(ws.availableForSale) || 0,
              type: 'group'
            };
          }
        }
        return { currentQuantity: 0, availableForSale: 0, type: 'group' };
      }
    }
  }
  
  return { currentQuantity: 0, availableForSale: 0, type: 'unknown' };
};

// Create a store order
export const createStoreOrder = async (req, res) => {
  try {
    const orderData = req.body;
    
    // Parse user info
    let userId = "";
    let createdBy = "";
    try {
      const userStr = req.headers['user'] || req.body.userId;
      if (userStr) {
        if (typeof userStr === 'object' && userStr !== null) {
          userId = userStr.email || userStr._id || userStr.id || orderData.userId || "";
          createdBy = userStr.name || userStr.displayName || userId;
        } else if (typeof userStr === 'string') {
          if (userStr.trim().startsWith('{') || userStr.trim().startsWith('[')) {
            try {
              const user = JSON.parse(userStr);
              userId = user?.email || user?._id || user?.id || orderData.userId || "";
              createdBy = user?.name || user?.displayName || userId;
            } catch (e) {
              userId = userStr || orderData.userId || "";
              createdBy = userId;
            }
          } else {
            userId = userStr || orderData.userId || "";
            createdBy = userId;
          }
        } else {
          userId = orderData.userId || "";
          createdBy = userId;
        }
      } else {
        userId = orderData.userId || "";
        createdBy = userId;
      }
    } catch (parseError) {
      console.warn("Error parsing user info, using fallback:", parseError);
      userId = orderData.userId || "";
      createdBy = userId;
    }
    
    // Validate required fields
    if (!orderData.date || !orderData.storeWarehouse) {
      return res.status(400).json({ 
        message: "Missing required fields: date and storeWarehouse are required" 
      });
    }
    
    if (!userId || userId === "") {
      return res.status(400).json({ 
        message: "User ID is required. Please ensure you are logged in." 
      });
    }
    
    // Validate items array
    if (!Array.isArray(orderData.items) || orderData.items.length === 0) {
      return res.status(400).json({ message: "At least one item is required" });
    }
    
    // Generate order number if not provided
    let orderNumber = orderData.orderNumber;
    if (!orderNumber) {
      orderNumber = await nextStoreOrder();
    }
    
    // Parse date
    let orderDate;
    try {
      if (orderData.date instanceof Date) {
        orderDate = orderData.date;
      } else if (typeof orderData.date === 'string') {
        orderDate = new Date(orderData.date);
        if (isNaN(orderDate.getTime())) {
          return res.status(400).json({ message: "Invalid date format" });
        }
      } else {
        return res.status(400).json({ message: "Date is required and must be a valid date" });
      }
    } catch (dateError) {
      console.error("Error parsing date:", dateError);
      return res.status(400).json({ message: "Invalid date format" });
    }
    
    // Process items and get current stock for each
    let totalQuantityRequested = 0;
    const processedItems = [];
    
    for (const item of orderData.items) {
      if (!item.itemName) continue;
      
      try {
        const quantity = parseFloat(item.quantity) || 0;
        if (quantity <= 0) continue;
        
        // Get current stock in store warehouse
        const stockInfo = await getCurrentStock(
          item.itemId || null,
          orderData.storeWarehouse,
          item.itemName,
          item.itemGroupId || null,
          item.itemSku || null
        );
        
        totalQuantityRequested += quantity;
        
        processedItems.push({
          itemId: item.itemId ? String(item.itemId) : null,
          itemGroupId: item.itemGroupId ? String(item.itemGroupId) : null,
          itemName: item.itemName,
          itemSku: item.itemSku || "",
          quantity: quantity,
          currentStock: stockInfo.currentQuantity || 0,
        });
      } catch (itemError) {
        console.error(`Error processing item ${item.itemName}:`, itemError);
      }
    }
    
    if (processedItems.length === 0) {
      return res.status(400).json({ message: "No valid items to process" });
    }
    
    // Prepare store order data
    const storeOrderData = {
      orderNumber,
      date: orderDate,
      reason: orderData.reason || "",
      storeWarehouse: orderData.storeWarehouse,
      destinationWarehouse: "Warehouse", // Always warehouse
      items: processedItems,
      totalQuantityRequested,
      userId,
      createdBy,
      status: "pending",
      locCode: orderData.locCode || "",
    };
    
    let postgresOrder = null;
    let mongoOrder = null;
    
    try {
      // Save to PostgreSQL first
      postgresOrder = await StoreOrderPostgres.create(storeOrderData);
      console.log(`✅ PostgreSQL store order created: ${orderNumber} (ID: ${postgresOrder.id})`);
      
      // Save to MongoDB with PostgreSQL ID reference
      const mongoData = {
        ...storeOrderData,
        postgresId: postgresOrder.id.toString(),
      };
      mongoOrder = await StoreOrder.create(mongoData);
      console.log(`✅ MongoDB store order created: ${orderNumber} (ID: ${mongoOrder._id})`);
      
      // Update PostgreSQL with MongoDB ID reference (optional, for cross-reference)
      // postgresOrder.mongoId = mongoOrder._id.toString();
      // await postgresOrder.save();
      
      // Return PostgreSQL order as primary (or merge both if needed)
      res.status(201).json({
        ...postgresOrder.toJSON(),
        mongoId: mongoOrder._id.toString(),
      });
    } catch (pgError) {
      console.error("❌ Error creating store order in PostgreSQL:", pgError);
      // If PostgreSQL fails, try MongoDB only
      try {
        if (!mongoOrder) {
          mongoOrder = await StoreOrder.create(storeOrderData);
          console.log(`⚠️ MongoDB store order created (PostgreSQL failed): ${orderNumber}`);
        }
        res.status(201).json({
          ...mongoOrder.toJSON(),
          _id: mongoOrder._id.toString(),
          warning: "Saved to MongoDB only (PostgreSQL save failed)",
        });
      } catch (mongoError) {
        console.error("❌ Error creating store order in MongoDB:", mongoError);
        // If MongoDB also fails, try to clean up PostgreSQL if it was created
        if (postgresOrder) {
          try {
            await postgresOrder.destroy();
          } catch (cleanupError) {
            console.error("Error cleaning up PostgreSQL order:", cleanupError);
          }
        }
        throw new Error("Failed to save store order to both databases");
      }
    }
  } catch (error) {
    console.error("Error creating store order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all store orders
export const getStoreOrders = async (req, res) => {
  try {
    const { userId, storeWarehouse, status, startDate, endDate, userPower } = req.query;
    
    const where = {};
    
    // Filter by store warehouse for store users
    if (storeWarehouse && userPower !== 'admin' && userPower !== 'warehouse') {
      where.storeWarehouse = storeWarehouse;
    }
    
    // Admin/warehouse users see all orders, but can filter by storeWarehouse if provided
    if (storeWarehouse && (userPower === 'admin' || userPower === 'warehouse')) {
      // Use flexible matching for admin/warehouse users
      // We'll filter after fetching
    }
    
    if (status) {
      where.status = status;
    }
    
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = new Date(startDate);
      if (endDate) where.date[Op.lte] = new Date(endDate);
    }
    
    // Fetch all matching orders from PostgreSQL (primary source)
    let storeOrders = await StoreOrderPostgres.findAll({
      where,
      order: [['date', 'DESC'], ['createdAt', 'DESC']],
      limit: 1000,
    });
    
    // Apply flexible warehouse matching for admin/warehouse users
    if (storeWarehouse && (userPower === 'admin' || userPower === 'warehouse')) {
      const normalizedTarget = normalizeWarehouseName(storeWarehouse);
      storeOrders = storeOrders.filter(order => {
        return matchesWarehouse(order.storeWarehouse, normalizedTarget);
      });
    }
    
    res.status(200).json(storeOrders);
  } catch (error) {
    console.error("Error fetching store orders:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single store order by ID
export const getStoreOrderById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Try PostgreSQL first (primary source)
    let storeOrder = await StoreOrderPostgres.findByPk(id);
    
    // If not found in PostgreSQL, try MongoDB by postgresId
    if (!storeOrder) {
      const mongoOrder = await StoreOrder.findOne({ postgresId: id });
      if (mongoOrder) {
        return res.status(200).json(mongoOrder);
      }
      return res.status(404).json({ message: "Store order not found" });
    }
    
    res.status(200).json(storeOrder);
  } catch (error) {
    console.error("Error fetching store order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update store order (approve/reject)
export const updateStoreOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Parse user info for approval/rejection
    let userId = "";
    let userName = "";
    try {
      const userStr = req.headers['user'] || req.body.userId;
      if (userStr) {
        if (typeof userStr === 'object' && userStr !== null) {
          userId = userStr.email || userStr._id || userStr.id || "";
          userName = userStr.name || userStr.displayName || userId;
        } else if (typeof userStr === 'string') {
          if (userStr.trim().startsWith('{') || userStr.trim().startsWith('[')) {
            try {
              const user = JSON.parse(userStr);
              userId = user?.email || user?._id || user?.id || "";
              userName = user?.name || user?.displayName || userId;
            } catch (e) {
              userId = userStr || "";
              userName = userId;
            }
          } else {
            userId = userStr || "";
            userName = userId;
          }
        }
      }
    } catch (parseError) {
      console.warn("Error parsing user info:", parseError);
    }
    
    // Get store order from PostgreSQL (primary source)
    const storeOrder = await StoreOrderPostgres.findByPk(id);
    
    if (!storeOrder) {
      return res.status(404).json({ message: "Store order not found" });
    }
    
    // Get MongoDB order for sync
    let mongoOrder = null;
    try {
      mongoOrder = await StoreOrder.findOne({ postgresId: id.toString() });
    } catch (mongoError) {
      console.warn("MongoDB order not found for sync:", mongoError);
    }
    
    // Only allow status changes for pending orders
    if (storeOrder.status !== 'pending' && updateData.status) {
      return res.status(400).json({ 
        message: `Cannot change status of ${storeOrder.status} order` 
      });
    }
    
    // Update status
    if (updateData.status === 'approved') {
      // Check stock availability in Warehouse before approving
      const sourceWarehouse = "Warehouse"; // Warehouse is the source for all store orders
      const stockIssues = [];
      
      console.log(`\n📦 Checking stock availability in Warehouse for store order ${storeOrder.orderNumber}`);
      console.log(`   Store Warehouse: ${storeOrder.storeWarehouse}`);
      console.log(`   Number of items: ${storeOrder.items?.length || 0}`);
      
      if (!storeOrder.items || !Array.isArray(storeOrder.items) || storeOrder.items.length === 0) {
        return res.status(400).json({ 
          message: "Cannot approve store order: No items found in the order" 
        });
      }
      
      // Check stock for each item
      for (const item of storeOrder.items) {
        const requestedQuantity = parseFloat(item.quantity) || 0;
        if (requestedQuantity <= 0) {
          console.log(`   ⚠️ Skipping item ${item.itemName || 'Unknown'}: invalid quantity (${item.quantity})`);
          continue; // Skip items with zero quantity
        }
        
        try {
          console.log(`   🔍 Checking stock for: ${item.itemName || 'Unknown'} (SKU: ${item.itemSku || 'N/A'})`);
          console.log(`      ItemId: ${item.itemId || 'N/A'}, ItemGroupId: ${item.itemGroupId || 'N/A'}`);
          console.log(`      Requested: ${requestedQuantity} units`);
          
          const stockInfo = await getCurrentStock(
            item.itemId,
            sourceWarehouse,
            item.itemName,
            item.itemGroupId,
            item.itemSku
          );
          
          const availableStock = parseFloat(stockInfo?.currentQuantity) || 0;
          const availableForSale = parseFloat(stockInfo?.availableForSale) || 0;
          const itemType = stockInfo?.type || 'unknown';
          
          console.log(`      Available Stock (${sourceWarehouse}): ${availableStock} units (Type: ${itemType})`);
          console.log(`      Available for Sale: ${availableForSale} units`);
          
          // Check if available stock is less than requested quantity
          if (availableStock < requestedQuantity) {
            const shortfall = requestedQuantity - availableStock;
            console.log(`      ❌ INSUFFICIENT STOCK: Available ${availableStock} < Requested ${requestedQuantity} (Shortfall: ${shortfall})`);
            
            stockIssues.push({
              itemName: item.itemName || "Unknown Item",
              itemSku: item.itemSku || "N/A",
              requested: requestedQuantity,
              available: availableStock,
              availableForSale: availableForSale,
              shortfall: shortfall,
              warehouse: sourceWarehouse,
              itemType: itemType
            });
          } else {
            console.log(`      ✅ Sufficient stock: Available ${availableStock} >= Requested ${requestedQuantity}`);
          }
        } catch (stockError) {
          console.error(`   ❌ Error checking stock for item ${item.itemName}:`, stockError);
          stockIssues.push({
            itemName: item.itemName || "Unknown Item",
            itemSku: item.itemSku || "N/A",
            requested: requestedQuantity,
            available: 0,
            availableForSale: 0,
            shortfall: requestedQuantity,
            warehouse: sourceWarehouse,
            error: stockError.message || "Unable to check stock"
          });
        }
      }
      
      // If there are stock issues, reject the approval
      if (stockIssues.length > 0) {
        console.log(`\n❌ Store order approval rejected: ${stockIssues.length} item(s) have insufficient stock`);
        
        const itemsList = stockIssues.map((issue, index) => 
          `${index + 1}. ${issue.itemName} (SKU: ${issue.itemSku || 'N/A'})\n   Requested: ${issue.requested.toFixed(2)} units\n   Available in Warehouse: ${issue.available.toFixed(2)} units\n   Shortfall: ${issue.shortfall.toFixed(2)} units${issue.error ? `\n   Error: ${issue.error}` : ''}`
        ).join('\n\n');
        
        return res.status(400).json({
          message: `Cannot approve store order: Insufficient stock in Warehouse.\n\nPlease check the stock availability for the following items:\n\n${itemsList}`,
          stockIssues: stockIssues
        });
      }
      
      console.log(`\n✅ All items have sufficient stock in Warehouse. Proceeding with approval...`);
      
      // All items have sufficient stock, proceed with approval
      storeOrder.status = 'approved';
      storeOrder.approvedBy = userId;
      storeOrder.approvedAt = new Date();
      
      // Create transfer order when approved
      try {
        // Generate transfer order number
        const transferOrderNumber = `TO-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        
        // Prepare transfer order data
        const transferData = {
          transferOrderNumber,
          date: storeOrder.date,
          reason: `Store Order: ${storeOrder.orderNumber} - ${storeOrder.reason || 'Stock request from store'}`,
          sourceWarehouse: "Warehouse", // Warehouse is source
          destinationWarehouse: storeOrder.storeWarehouse, // Store is destination
          items: storeOrder.items.map(item => ({
            itemId: item.itemId,
            itemGroupId: item.itemGroupId,
            itemName: item.itemName,
            itemSku: item.itemSku,
            quantity: item.quantity,
          })),
          status: "in_transit", // Set to in_transit when store order is approved
          userId: userId || storeOrder.userId,
        };
        
        // Create transfer order in both PostgreSQL and MongoDB
        // Import TransferOrder MongoDB model here to avoid circular dependency
        const TransferOrderMongo = (await import("../model/TransferOrder.js")).default;
        
        // Create in PostgreSQL first
        const transferOrderPostgres = await TransferOrderPostgres.create({
          transferOrderNumber: transferData.transferOrderNumber,
          date: transferData.date,
          reason: transferData.reason,
          sourceWarehouse: transferData.sourceWarehouse,
          destinationWarehouse: transferData.destinationWarehouse,
          items: transferData.items,
          totalQuantityTransferred: storeOrder.totalQuantityRequested,
          userId: transferData.userId,
          createdBy: userName || userId,
          status: transferData.status,
          locCode: storeOrder.locCode || "",
        });
        console.log(`✅ PostgreSQL transfer order created: ${transferOrderNumber} (ID: ${transferOrderPostgres.id})`);
        
        // Create in MongoDB
        try {
          const transferOrderMongo = await TransferOrderMongo.create({
            transferOrderNumber: transferData.transferOrderNumber,
            date: transferData.date,
            reason: transferData.reason,
            sourceWarehouse: transferData.sourceWarehouse,
            destinationWarehouse: transferData.destinationWarehouse,
            items: transferData.items,
            totalQuantityTransferred: storeOrder.totalQuantityRequested,
            userId: transferData.userId,
            createdBy: userName || userId,
            status: transferData.status,
            locCode: storeOrder.locCode || "",
            postgresId: transferOrderPostgres.id.toString(),
          });
          console.log(`✅ MongoDB transfer order created: ${transferOrderNumber} (ID: ${transferOrderMongo._id})`);
        } catch (mongoError) {
          console.error("⚠️ Error creating MongoDB transfer order (non-critical):", mongoError);
        }
        
        // Link transfer order to store order
        storeOrder.transferOrderId = transferOrderPostgres.id;
        
        console.log(`✅ Created transfer order ${transferOrderNumber} from store order ${storeOrder.orderNumber}`);
      } catch (transferError) {
        console.error("Error creating transfer order:", transferError);
        // Don't fail the approval if transfer order creation fails
        // The admin can manually create the transfer order
      }
    } else if (updateData.status === 'rejected') {
      storeOrder.status = 'rejected';
      storeOrder.rejectedBy = userId;
      storeOrder.rejectedAt = new Date();
      storeOrder.rejectionReason = updateData.rejectionReason || "";
    }
    
    // Update other fields if provided
    if (updateData.reason !== undefined) {
      storeOrder.reason = updateData.reason;
    }
    
    // Save to PostgreSQL
    await storeOrder.save();
    console.log(`✅ PostgreSQL store order updated: ${storeOrder.orderNumber} (ID: ${storeOrder.id})`);
    
    // Sync to MongoDB
    try {
      if (mongoOrder) {
        // Update existing MongoDB order
        mongoOrder.status = storeOrder.status;
        mongoOrder.approvedBy = storeOrder.approvedBy;
        mongoOrder.approvedAt = storeOrder.approvedAt;
        mongoOrder.rejectedBy = storeOrder.rejectedBy;
        mongoOrder.rejectedAt = storeOrder.rejectedAt;
        mongoOrder.rejectionReason = storeOrder.rejectionReason || "";
        mongoOrder.transferOrderId = storeOrder.transferOrderId ? storeOrder.transferOrderId.toString() : null;
        if (updateData.reason !== undefined) {
          mongoOrder.reason = updateData.reason;
        }
        await mongoOrder.save();
        console.log(`✅ MongoDB store order updated: ${storeOrder.orderNumber} (ID: ${mongoOrder._id})`);
      } else {
        // Create MongoDB order if it doesn't exist (sync scenario)
        const mongoData = {
          orderNumber: storeOrder.orderNumber,
          date: storeOrder.date,
          reason: storeOrder.reason || "",
          storeWarehouse: storeOrder.storeWarehouse,
          destinationWarehouse: storeOrder.destinationWarehouse,
          items: storeOrder.items || [],
          totalQuantityRequested: parseFloat(storeOrder.totalQuantityRequested) || 0,
          userId: storeOrder.userId,
          createdBy: storeOrder.createdBy || "",
          status: storeOrder.status,
          approvedBy: storeOrder.approvedBy,
          approvedAt: storeOrder.approvedAt,
          rejectedBy: storeOrder.rejectedBy,
          rejectedAt: storeOrder.rejectedAt,
          rejectionReason: storeOrder.rejectionReason || "",
          transferOrderId: storeOrder.transferOrderId ? storeOrder.transferOrderId.toString() : null,
          locCode: storeOrder.locCode || "",
          postgresId: storeOrder.id.toString(),
        };
        const newMongoOrder = await StoreOrder.create(mongoData);
        console.log(`✅ MongoDB store order created (sync): ${storeOrder.orderNumber} (ID: ${newMongoOrder._id})`);
      }
    } catch (mongoError) {
      console.error("⚠️ Error syncing to MongoDB (non-critical):", mongoError);
      // Don't fail the request if MongoDB sync fails
    }
    
    res.status(200).json(storeOrder);
  } catch (error) {
    console.error("Error updating store order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete store order
export const deleteStoreOrder = async (req, res) => {
  try {
    const { id } = req.params;
    
    const storeOrder = await StoreOrderPostgres.findByPk(id);
    
    if (!storeOrder) {
      return res.status(404).json({ message: "Store order not found" });
    }
    
    // Only allow deletion of pending or rejected orders
    if (storeOrder.status === 'approved' || storeOrder.status === 'transferred') {
      return res.status(400).json({ 
        message: "Cannot delete approved or transferred orders" 
      });
    }
    
    // Delete from PostgreSQL
    await storeOrder.destroy();
    console.log(`✅ PostgreSQL store order deleted: ${storeOrder.orderNumber} (ID: ${id})`);
    
    // Delete from MongoDB
    try {
      const mongoOrder = await StoreOrder.findOneAndDelete({ postgresId: id.toString() });
      if (mongoOrder) {
        console.log(`✅ MongoDB store order deleted: ${storeOrder.orderNumber} (ID: ${mongoOrder._id})`);
      }
    } catch (mongoError) {
      console.error("⚠️ Error deleting from MongoDB (non-critical):", mongoError);
      // Don't fail the request if MongoDB deletion fails
    }
    
    res.status(200).json({ message: "Store order deleted successfully" });
  } catch (error) {
    console.error("Error deleting store order:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get item stock for store order creation (helper endpoint)
export const getItemStockForStore = async (req, res) => {
  try {
    const { itemId, itemGroupId, itemName, itemSku, warehouse } = req.query;
    
    if (!warehouse) {
      return res.status(400).json({ message: "Warehouse is required" });
    }
    
    const stockInfo = await getCurrentStock(
      itemId || null,
      warehouse,
      itemName || null,
      itemGroupId || null,
      itemSku || null
    );
    
    res.status(200).json(stockInfo);
  } catch (error) {
    console.error("Error getting item stock:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
