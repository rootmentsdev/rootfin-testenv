import PurchaseReceive from "../model/PurchaseReceive.js";
import ShoeItem from "../model/ShoeItem.js";

// Create a new purchase receive
export const createPurchaseReceive = async (req, res) => {
  try {
    const receiveData = req.body;
    
    // Validate required fields
    if (!receiveData.receiveNumber || !receiveData.userId || !receiveData.purchaseOrderId) {
      return res.status(400).json({ message: "Receive number, userId, and purchase order ID are required" });
    }
    
    // Check if receive with this receiveNumber already exists
    const existingReceive = await PurchaseReceive.findOne({ receiveNumber: receiveData.receiveNumber });
    if (existingReceive) {
      // Return the existing receive so frontend can navigate to it
      return res.status(409).json({ 
        message: "Receive number already exists",
        existingReceive: existingReceive 
      });
    }
    
    // Save all data to MongoDB
    const purchaseReceive = await PurchaseReceive.create(receiveData);
    console.log(`Purchase receive ${receiveData.receiveNumber} saved to MongoDB with ID: ${purchaseReceive._id}`);
    console.log(`Items saved: ${receiveData.items?.length || 0} item(s)`);
    
    // If status is "received", automatically increase stock for all items
    if (receiveData.status === "received" && receiveData.items && receiveData.items.length > 0) {
      console.log("Status is 'received', updating item stock...");
      
      for (const item of receiveData.items) {
        // Handle itemId - could be ObjectId string or populated object
        let itemIdValue = item.itemId?._id || item.itemId || null;
        
        // Convert to string if it's an ObjectId object
        if (itemIdValue && typeof itemIdValue === 'object' && itemIdValue.toString) {
          itemIdValue = itemIdValue.toString();
        }
        
        console.log(`Processing item - itemId: ${itemIdValue}, itemName: ${item.itemName}, received: ${item.received}`);
        
        if (itemIdValue && item.received > 0) {
          try {
            const receivedQty = parseFloat(item.received) || 0;
            if (receivedQty <= 0) {
              console.log(`Skipping item ${itemIdValue} - received quantity is 0 or invalid`);
              continue;
            }
            
            console.log(`Processing stock update for itemId: ${itemIdValue}, Item Name: ${item.itemName}, Received Qty: ${receivedQty}`);
            
            const shoeItem = await ShoeItem.findById(itemIdValue);
            if (shoeItem) {
              console.log(`Updating stock for item: ${item.itemName || item.itemId}, Quantity: ${receivedQty}`);
              
              // Use "Warehouse" as default warehouse name (matches frontend expectations)
              const defaultWarehouseName = "Warehouse";
              
              // Update warehouse stocks - if no warehouse stocks exist, create one with default warehouse
              if (!shoeItem.warehouseStocks || shoeItem.warehouseStocks.length === 0) {
                // Create default warehouse stock entry
                console.log(`Creating new warehouse stock entry for item ${item.itemId}`);
                shoeItem.warehouseStocks = [{
                  warehouse: defaultWarehouseName,
                  openingStock: 0,
                  openingStockValue: 0,
                  stockOnHand: receivedQty,
                  committedStock: 0,
                  availableForSale: receivedQty,
                  physicalOpeningStock: 0,
                  physicalStockOnHand: receivedQty,
                  physicalCommittedStock: 0,
                  physicalAvailableForSale: receivedQty,
                }];
              } else {
                // Find or create "Warehouse" entry
                let warehouseStock = shoeItem.warehouseStocks.find(ws => 
                  ws.warehouse === defaultWarehouseName || 
                  ws.warehouse === "Main Warehouse" ||
                  !ws.warehouse
                );
                
                if (!warehouseStock) {
                  // Create new warehouse entry if "Warehouse" doesn't exist
                  console.log(`Creating new "Warehouse" entry for item ${item.itemId}`);
                  warehouseStock = {
                    warehouse: defaultWarehouseName,
                    openingStock: 0,
                    openingStockValue: 0,
                    stockOnHand: 0,
                    committedStock: 0,
                    availableForSale: 0,
                    physicalOpeningStock: 0,
                    physicalStockOnHand: 0,
                    physicalCommittedStock: 0,
                    physicalAvailableForSale: 0,
                  };
                  shoeItem.warehouseStocks.push(warehouseStock);
                }
                
                // Update the warehouse stock
                const currentStockOnHand = parseFloat(warehouseStock.stockOnHand) || 0;
                const currentAvailableForSale = parseFloat(warehouseStock.availableForSale) || 0;
                const currentPhysicalStockOnHand = parseFloat(warehouseStock.physicalStockOnHand) || 0;
                const currentPhysicalAvailableForSale = parseFloat(warehouseStock.physicalAvailableForSale) || 0;
                
                warehouseStock.warehouse = defaultWarehouseName; // Ensure it's "Warehouse"
                warehouseStock.stockOnHand = currentStockOnHand + receivedQty;
                warehouseStock.availableForSale = currentAvailableForSale + receivedQty;
                warehouseStock.physicalStockOnHand = currentPhysicalStockOnHand + receivedQty;
                warehouseStock.physicalAvailableForSale = currentPhysicalAvailableForSale + receivedQty;
                
                console.log(`Updated warehouse stock - Stock On Hand: ${currentStockOnHand} -> ${warehouseStock.stockOnHand}, Available: ${currentAvailableForSale} -> ${warehouseStock.availableForSale}`);
              }
              
              await shoeItem.save();
              const updatedStock = shoeItem.warehouseStocks.find(ws => ws.warehouse === defaultWarehouseName) || shoeItem.warehouseStocks[0];
              console.log(`✅ Successfully updated stock for item ${item.itemName || itemIdValue}: +${receivedQty} units. New stock: Stock On Hand: ${updatedStock?.stockOnHand || 0}, Available: ${updatedStock?.availableForSale || 0}`);
            } else {
              console.warn(`⚠️ Item with ID ${itemIdValue} not found in database, skipping stock update`);
            }
          } catch (itemError) {
            console.error(`❌ Error updating stock for item ${itemIdValue}:`, itemError);
            // Continue with other items even if one fails
          }
        } else {
          console.log(`Skipping item - itemId: ${item.itemId}, received: ${item.received}`);
        }
      }
      
      console.log("✅ Stock update completed for all items");
    }
    
    res.status(201).json(purchaseReceive);
  } catch (error) {
    console.error("Create purchase receive error:", error);
    if (error.code === 11000) {
      // Double check in case of race condition
      const existingReceive = await PurchaseReceive.findOne({ receiveNumber: req.body.receiveNumber });
      if (existingReceive) {
        return res.status(409).json({ 
          message: "Receive number already exists",
          existingReceive: existingReceive 
        });
      }
      return res.status(409).json({ message: "Receive number already exists" });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get all purchase receives for a user
export const getPurchaseReceives = async (req, res) => {
  try {
    const { userId, locCode, status } = req.query;
    
    const query = {};
    
    // Try to match userId with multiple possible formats (supports _id, id, email, locCode)
    if (userId) {
      query.$or = [
        { userId: userId },
        { userId: userId.toString() }
      ];
    }
    
    if (locCode) query.locCode = locCode;
    if (status) query.status = status;
    
    const purchaseReceives = await PurchaseReceive.find(query)
      .populate("purchaseOrderId", "orderNumber date")
      .populate("vendorId", "displayName companyName")
      .sort({ createdAt: -1 });
    
    console.log(`Found ${purchaseReceives.length} purchase receives for query:`, JSON.stringify(query));
    res.status(200).json(purchaseReceives);
  } catch (error) {
    console.error("Get purchase receives error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get a single purchase receive by ID
export const getPurchaseReceiveById = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseReceive = await PurchaseReceive.findById(id)
      .populate("purchaseOrderId")
      .populate("vendorId");
    
    if (!purchaseReceive) {
      return res.status(404).json({ message: "Purchase receive not found" });
    }
    
    res.status(200).json(purchaseReceive);
  } catch (error) {
    console.error("Get purchase receive error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update a purchase receive
export const updatePurchaseReceive = async (req, res) => {
  try {
    const { id } = req.params;
    const receiveData = req.body;
    
    const purchaseReceive = await PurchaseReceive.findByIdAndUpdate(
      id,
      receiveData,
      { new: true, runValidators: true }
    );
    
    if (!purchaseReceive) {
      return res.status(404).json({ message: "Purchase receive not found" });
    }
    
    res.status(200).json(purchaseReceive);
  } catch (error) {
    console.error("Update purchase receive error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Delete a purchase receive
export const deletePurchaseReceive = async (req, res) => {
  try {
    const { id } = req.params;
    const purchaseReceive = await PurchaseReceive.findByIdAndDelete(id);
    
    if (!purchaseReceive) {
      return res.status(404).json({ message: "Purchase receive not found" });
    }
    
    res.status(200).json({ message: "Purchase receive deleted successfully" });
  } catch (error) {
    console.error("Delete purchase receive error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

