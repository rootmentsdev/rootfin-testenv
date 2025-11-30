import PurchaseReceive from "../model/PurchaseReceive.js";
import ShoeItem from "../model/ShoeItem.js";
import ItemGroup from "../model/ItemGroup.js";

// Helper function to update stock for an item (handles both standalone and group items)
const updateItemStock = async (itemIdValue, receivedQty, operation = 'add', itemName = null, itemGroupId = null) => {
  const defaultWarehouseName = "Warehouse";
  
  // Helper function to update warehouse stock
  const updateWarehouseStock = (warehouseStocks, qty) => {
    if (!warehouseStocks || warehouseStocks.length === 0) {
      return [{
        warehouse: defaultWarehouseName,
        openingStock: 0,
        openingStockValue: 0,
        stockOnHand: qty,
        committedStock: 0,
        availableForSale: qty,
        physicalOpeningStock: 0,
        physicalStockOnHand: qty,
        physicalCommittedStock: 0,
        physicalAvailableForSale: qty,
      }];
    }
    
    let warehouseStock = warehouseStocks.find(ws => 
      ws.warehouse === defaultWarehouseName || 
      ws.warehouse === "Main Warehouse" ||
      !ws.warehouse
    );
    
    if (!warehouseStock) {
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
      warehouseStocks.push(warehouseStock);
    }
    
    const currentStockOnHand = parseFloat(warehouseStock.stockOnHand) || 0;
    const currentAvailableForSale = parseFloat(warehouseStock.availableForSale) || 0;
    const currentPhysicalStockOnHand = parseFloat(warehouseStock.physicalStockOnHand) || 0;
    const currentPhysicalAvailableForSale = parseFloat(warehouseStock.physicalAvailableForSale) || 0;
    
    warehouseStock.warehouse = defaultWarehouseName;
    
    if (operation === 'add') {
      warehouseStock.stockOnHand = currentStockOnHand + qty;
      warehouseStock.availableForSale = currentAvailableForSale + qty;
      warehouseStock.physicalStockOnHand = currentPhysicalStockOnHand + qty;
      warehouseStock.physicalAvailableForSale = currentPhysicalAvailableForSale + qty;
    } else if (operation === 'subtract') {
      warehouseStock.stockOnHand = Math.max(0, currentStockOnHand - qty);
      warehouseStock.availableForSale = Math.max(0, currentAvailableForSale - qty);
      warehouseStock.physicalStockOnHand = Math.max(0, currentPhysicalStockOnHand - qty);
      warehouseStock.physicalAvailableForSale = Math.max(0, currentPhysicalAvailableForSale - qty);
    } else if (operation === 'adjust') {
      // For adjust, qty is the difference
      warehouseStock.stockOnHand = currentStockOnHand + qty;
      warehouseStock.availableForSale = currentAvailableForSale + qty;
      warehouseStock.physicalStockOnHand = currentPhysicalStockOnHand + qty;
      warehouseStock.physicalAvailableForSale = currentPhysicalAvailableForSale + qty;
    }
    
    return warehouseStocks;
  };
  
  // First, try to find as standalone item
  let shoeItem = await ShoeItem.findById(itemIdValue);
  if (shoeItem) {
    shoeItem.warehouseStocks = updateWarehouseStock(shoeItem.warehouseStocks, receivedQty);
    await shoeItem.save();
    const updatedStock = shoeItem.warehouseStocks.find(ws => ws.warehouse === defaultWarehouseName) || shoeItem.warehouseStocks[0];
    return { success: true, type: 'standalone', stock: updatedStock };
  }
  
  // Item not found in standalone items, try to find in item groups
  console.log(`🔍 Searching for item ${itemIdValue} in item groups...`);
  console.log(`   Item name: ${itemName || 'not provided'}, ItemGroupId: ${itemGroupId || 'not provided'}`);
  
  // If we have itemGroupId, search only that group first (more efficient)
  let itemGroups = [];
  if (itemGroupId) {
    const specificGroup = await ItemGroup.findById(itemGroupId);
    if (specificGroup && specificGroup.isActive !== false) {
      itemGroups = [specificGroup];
      console.log(`   Searching in specific group: ${specificGroup.name}`);
    }
  }
  
  // If not found in specific group or no itemGroupId provided, search all groups
  if (itemGroups.length === 0) {
    itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    console.log(`   Found ${itemGroups.length} active item groups to search`);
  }
  
  const itemIdStr = itemIdValue?.toString();
  
  for (const group of itemGroups) {
    if (group.items && Array.isArray(group.items)) {
      for (let i = 0; i < group.items.length; i++) {
        const groupItem = group.items[i];
        
        // Try multiple ID matching strategies
        const groupItemId = groupItem._id?.toString();
        const compositeId = `${group._id}_${i}`;
        const groupIdStr = group._id?.toString();
        
        // Check various ID formats
        let idMatches = false;
        
        // Normalize both IDs to strings for comparison
        const normalizedGroupItemId = groupItemId ? String(groupItemId) : null;
        const normalizedItemId = itemIdStr ? String(itemIdStr) : null;
        const normalizedCompositeId = String(compositeId);
        
        // Direct ID match (exact match)
        if (normalizedGroupItemId && normalizedItemId && normalizedGroupItemId === normalizedItemId) {
          idMatches = true;
          console.log(`   ✅ Direct ID match: ${normalizedGroupItemId} === ${normalizedItemId}`);
        }
        // Composite ID match
        else if (normalizedCompositeId === normalizedItemId) {
          idMatches = true;
          console.log(`   ✅ Composite ID match: ${normalizedCompositeId} === ${normalizedItemId}`);
        }
        // Check if itemIdStr contains group ID and index (for composite IDs with different formats)
        else if (normalizedItemId && groupIdStr && normalizedItemId.includes(String(groupIdStr)) && normalizedItemId.includes(`_${i}`)) {
          idMatches = true;
          console.log(`   ✅ Partial composite ID match: ${normalizedItemId} contains ${groupIdStr} and _${i}`);
        }
        // Try matching just the ObjectId part (in case only the ObjectId is stored)
        else if (normalizedItemId && normalizedGroupItemId) {
          // Check if the itemId is just the ObjectId (first 24 chars of composite)
          if (normalizedItemId === normalizedGroupItemId || normalizedItemId.startsWith(normalizedGroupItemId)) {
            idMatches = true;
            console.log(`   ✅ ObjectId prefix match: ${normalizedItemId} starts with ${normalizedGroupItemId}`);
          }
          // Also check reverse - if groupItemId contains the itemId
          else if (normalizedGroupItemId.includes(normalizedItemId)) {
            idMatches = true;
            console.log(`   ✅ ObjectId contains match: ${normalizedGroupItemId} contains ${normalizedItemId}`);
          }
        }
        
        // If still no match, try comparing just the ObjectId hex strings (remove any prefixes/suffixes)
        if (!idMatches && normalizedItemId && normalizedGroupItemId) {
          // Extract just the hex part (MongoDB ObjectIds are 24 hex characters)
          const itemIdHex = normalizedItemId.replace(/[^0-9a-fA-F]/g, '').substring(0, 24);
          const groupItemIdHex = normalizedGroupItemId.replace(/[^0-9a-fA-F]/g, '').substring(0, 24);
          if (itemIdHex && groupItemIdHex && itemIdHex === groupItemIdHex && itemIdHex.length === 24) {
            idMatches = true;
            console.log(`   ✅ Hex ID match: ${itemIdHex} === ${groupItemIdHex}`);
          }
        }
        
        // Also try matching by item name if provided (as fallback)
        let nameMatches = false;
        if (itemName && groupItem.name && groupItem.name.trim() === itemName.trim()) {
          nameMatches = true;
          console.log(`   ✅ Name match: "${groupItem.name}" === "${itemName}"`);
        }
        
        if (idMatches || nameMatches) {
          console.log(`✅ Found item in group "${group.name}" at index ${i}`);
          console.log(`   Item name: ${groupItem.name}`);
          console.log(`   Group item ID: ${groupItemId || 'none'}, Composite ID: ${compositeId}`);
          console.log(`   Searching for: ${itemIdStr}`);
          console.log(`   Matched by: ${idMatches ? 'ID' : 'Name'}`);
          
          // Update warehouse stocks for this item
          groupItem.warehouseStocks = updateWarehouseStock(groupItem.warehouseStocks || [], receivedQty);
          
          // Mark item as modified
          group.items[i] = groupItem;
          group.markModified('items');
          
          await group.save();
          
          const updatedStock = groupItem.warehouseStocks.find(ws => ws.warehouse === defaultWarehouseName) || groupItem.warehouseStocks[0];
          console.log(`✅ Successfully updated stock for item "${groupItem.name}" in group "${group.name}"`);
          return { success: true, type: 'group', stock: updatedStock, groupName: group.name, itemName: groupItem.name };
        }
      }
    }
  }
  
  console.warn(`⚠️ Item with ID ${itemIdValue} not found in any item groups`);
  console.warn(`   Searched ${itemGroups.length} groups`);
  return { success: false, message: `Item with ID ${itemIdValue} not found` };
};

// Helper function to update stock for an item by name and SKU within a group (when itemId is null)
const updateItemStockByName = async (itemGroupId, itemName, receivedQty, operation = 'add', itemSku = null) => {
  const defaultWarehouseName = "Warehouse";
  
  if (!itemGroupId || !itemName) {
    return { success: false, message: "itemGroupId and itemName are required when itemId is null" };
  }
  
  console.log(`🔍 Searching for item by name "${itemName}"${itemSku ? ` and SKU "${itemSku}"` : ''} in group ${itemGroupId}...`);
  
  const group = await ItemGroup.findById(itemGroupId);
  if (!group || group.isActive === false) {
    return { success: false, message: `Item group ${itemGroupId} not found or inactive` };
  }
  
  if (!group.items || !Array.isArray(group.items)) {
    return { success: false, message: `Item group ${itemGroupId} has no items` };
  }
  
  // Find item by name and SKU (if SKU is provided, match both; otherwise match by name only)
  let itemIndex = -1;
  if (itemSku) {
    // Match by both name AND SKU for better accuracy
    itemIndex = group.items.findIndex(gi => {
      const nameMatch = gi.name && gi.name.trim() === itemName.trim();
      const skuMatch = gi.sku && gi.sku.trim() === itemSku.trim();
      return nameMatch && skuMatch;
    });
    
    if (itemIndex === -1) {
      console.warn(`⚠️ Item with name "${itemName}" and SKU "${itemSku}" not found, trying name only...`);
      // Fallback to name only if SKU match fails
      itemIndex = group.items.findIndex(gi => gi.name && gi.name.trim() === itemName.trim());
    }
  } else {
    // Match by name only if SKU is not provided
    itemIndex = group.items.findIndex(gi => gi.name && gi.name.trim() === itemName.trim());
  }
  
  if (itemIndex === -1) {
    console.warn(`⚠️ Item with name "${itemName}"${itemSku ? ` and SKU "${itemSku}"` : ''} not found in group "${group.name}"`);
    return { success: false, message: `Item with name "${itemName}"${itemSku ? ` and SKU "${itemSku}"` : ''} not found in group` };
  }
  
  const groupItem = group.items[itemIndex];
  console.log(`✅ Found item "${groupItem.name}" in group "${group.name}" at index ${itemIndex}`);
  
  // Helper function to update warehouse stock (same as in updateItemStock)
  const updateWarehouseStock = (warehouseStocks, qty) => {
    if (!warehouseStocks || warehouseStocks.length === 0) {
      return [{
        warehouse: defaultWarehouseName,
        openingStock: 0,
        openingStockValue: 0,
        stockOnHand: qty,
        committedStock: 0,
        availableForSale: qty,
        physicalOpeningStock: 0,
        physicalStockOnHand: qty,
        physicalCommittedStock: 0,
        physicalAvailableForSale: qty,
      }];
    }
    
    let warehouseStock = warehouseStocks.find(ws => 
      ws.warehouse === defaultWarehouseName || 
      ws.warehouse === "Main Warehouse" ||
      !ws.warehouse
    );
    
    if (!warehouseStock) {
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
      warehouseStocks.push(warehouseStock);
    }
    
    const currentStockOnHand = parseFloat(warehouseStock.stockOnHand) || 0;
    const currentAvailableForSale = parseFloat(warehouseStock.availableForSale) || 0;
    const currentPhysicalStockOnHand = parseFloat(warehouseStock.physicalStockOnHand) || 0;
    const currentPhysicalAvailableForSale = parseFloat(warehouseStock.physicalAvailableForSale) || 0;
    
    warehouseStock.warehouse = defaultWarehouseName;
    
    if (operation === 'add') {
      warehouseStock.stockOnHand = currentStockOnHand + qty;
      warehouseStock.availableForSale = currentAvailableForSale + qty;
      warehouseStock.physicalStockOnHand = currentPhysicalStockOnHand + qty;
      warehouseStock.physicalAvailableForSale = currentPhysicalAvailableForSale + qty;
    } else if (operation === 'subtract') {
      warehouseStock.stockOnHand = Math.max(0, currentStockOnHand - qty);
      warehouseStock.availableForSale = Math.max(0, currentAvailableForSale - qty);
      warehouseStock.physicalStockOnHand = Math.max(0, currentPhysicalStockOnHand - qty);
      warehouseStock.physicalAvailableForSale = Math.max(0, currentPhysicalAvailableForSale - qty);
    } else if (operation === 'adjust') {
      warehouseStock.stockOnHand = currentStockOnHand + qty;
      warehouseStock.availableForSale = currentAvailableForSale + qty;
      warehouseStock.physicalStockOnHand = currentPhysicalStockOnHand + qty;
      warehouseStock.physicalAvailableForSale = currentPhysicalAvailableForSale + qty;
    }
    
    return warehouseStocks;
  };
  
  // Update warehouse stocks for this item
  groupItem.warehouseStocks = updateWarehouseStock(groupItem.warehouseStocks || [], receivedQty);
  
  // Mark item as modified
  group.items[itemIndex] = groupItem;
  group.markModified('items');
  
  await group.save();
  
  const updatedStock = groupItem.warehouseStocks.find(ws => ws.warehouse === defaultWarehouseName) || groupItem.warehouseStocks[0];
  console.log(`✅ Successfully updated stock for item "${groupItem.name}" in group "${group.name}"`);
  return { success: true, type: 'group', stock: updatedStock, groupName: group.name, itemName: groupItem.name };
};

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
        
        // If itemId is null but itemGroupId is present, this is an item from a group
        // We'll need to find it by name and SKU within the group
        const itemGroupId = item.itemGroupId || null;
        const itemName = item.itemName || "";
        const itemSku = item.itemSku || item.sku || "";
        
        console.log(`Processing item - itemId: ${itemIdValue}, itemName: ${itemName}, itemSku: ${itemSku}, itemGroupId: ${itemGroupId}, received: ${item.received}`);
        console.log(`   Full item object:`, JSON.stringify({ itemId: item.itemId, itemName: item.itemName, itemSku: itemSku, itemGroupId: itemGroupId, received: item.received }, null, 2));
        
        // If itemId is null but we have itemGroupId and itemName, we can still update stock
        if ((itemIdValue || (itemGroupId && itemName) || itemName) && item.received > 0) {
          try {
            const receivedQty = parseFloat(item.received) || 0;
            if (receivedQty <= 0) {
              console.log(`Skipping item ${itemIdValue} - received quantity is 0 or invalid`);
              continue;
            }
            
            console.log(`📦 Processing stock update for itemId: ${itemIdValue}, Item Name: ${item.itemName}, Item SKU: ${itemSku}, Received Qty: ${receivedQty}`);
            console.log(`   ItemId type: ${typeof itemIdValue}, value: ${itemIdValue}`);
            
            // Get itemGroupId if available (for items from groups)
            // If itemId is null, we'll use itemGroupId + itemName + itemSku to find the item
            let result;
            if (itemIdValue) {
              result = await updateItemStock(itemIdValue, receivedQty, 'add', itemName, itemGroupId);
            } else if (itemGroupId && itemName) {
              result = await updateItemStockByName(itemGroupId, itemName, receivedQty, 'add', itemSku);
            } else if (itemName) {
              // Search all groups by name and SKU
              const allGroups = await ItemGroup.find({ isActive: { $ne: false } });
              let found = false;
              
              for (const group of allGroups) {
                if (group.items && Array.isArray(group.items)) {
                  // Match by name and SKU if SKU is provided, otherwise match by name only
                  const matchingItem = itemSku
                    ? group.items.find(gi => {
                        const nameMatch = gi.name && gi.name.trim() === itemName.trim();
                        const skuMatch = gi.sku && gi.sku.trim() === itemSku.trim();
                        return nameMatch && skuMatch;
                      })
                    : group.items.find(gi => gi.name && gi.name.trim() === itemName.trim());
                  
                  if (matchingItem) {
                    console.log(`   ✅ Found item "${itemName}"${itemSku ? ` with SKU "${itemSku}"` : ''} in group "${group.name}", updating stock...`);
                    result = await updateItemStockByName(group._id, itemName, receivedQty, 'add', itemSku);
                    found = true;
                    break;
                  }
                }
              }
              
              if (!found) {
                result = { success: false, message: `Item "${itemName}"${itemSku ? ` with SKU "${itemSku}"` : ''} not found in any item group` };
              }
            } else {
              result = { success: false, message: "Cannot update stock: itemId is null and itemGroupId/itemName not provided" };
            }
            if (result.success) {
              if (result.type === 'standalone') {
                console.log(`✅ Successfully updated stock for standalone item ${item.itemName || itemIdValue}: +${receivedQty} units. New stock: Stock On Hand: ${result.stock?.stockOnHand || 0}, Available: ${result.stock?.availableForSale || 0}`);
              } else {
                console.log(`✅ Successfully updated stock for item "${result.itemName}" in group "${result.groupName}": +${receivedQty} units. New stock: Stock On Hand: ${result.stock?.stockOnHand || 0}, Available: ${result.stock?.availableForSale || 0}`);
              }
            } else {
              console.warn(`⚠️ ${result.message}, skipping stock update`);
              console.warn(`   This might be an item from a group. ItemId was: ${itemIdValue}, ItemName: ${item.itemName}, ItemGroupId: ${itemGroupId}`);
              
              // Fallback: If itemGroupId is provided but updateItemStockByName failed, or if itemGroupId is missing, search all groups by name
              if (item.itemName) {
                console.warn(`   Trying to find by item name "${item.itemName}" in all groups as fallback...`);
                const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
                let found = false;
                
                for (const group of itemGroups) {
                  if (group.items && Array.isArray(group.items)) {
                    const matchingItem = group.items.find(gi => gi.name && gi.name.trim() === item.itemName.trim());
                    if (matchingItem) {
                      console.log(`✅ Found item by name "${item.itemName}" in group "${group.name}"`);
                      found = true;
                      
                      // Use the updateItemStockByName function
                      const nameResult = await updateItemStockByName(group._id, item.itemName, receivedQty, 'add');
                      if (nameResult.success) {
                        console.log(`✅ Successfully updated stock for item "${nameResult.itemName}" in group "${nameResult.groupName}" by name match`);
                      }
                      break;
                    }
                  }
                }
                
                if (!found) {
                  console.error(`❌ Could not find item "${item.itemName}" in any item group`);
                }
              }
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
    const { userId, userPower, status } = req.query;
    
    const query = {};
    
    // Filter by user email only - admin users see all data
    const isAdmin = userPower && (userPower.toLowerCase() === 'admin' || userPower.toLowerCase() === 'super_admin');
    
    if (!isAdmin && userId) {
      const userIdStr = userId.toString();
      // Use email as primary identifier - case insensitive match
      if (userIdStr.includes('@')) {
        query.userId = { $regex: `^${userIdStr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
      } else {
        query.userId = userIdStr;
      }
    }
    // If admin, no userId filter - show all receives
    
    if (status) query.status = status;
    
    const purchaseReceives = await PurchaseReceive.find(query)
      .populate("purchaseOrderId", "orderNumber date")
      .sort({ createdAt: -1 });
    
    console.log(`Found ${purchaseReceives.length} purchase receives`);
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
      .populate("purchaseOrderId");
    
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
    
    console.log(`\n🔄 UPDATE PURCHASE RECEIVE REQUEST:`);
    console.log(`   Receive ID: ${id}`);
    console.log(`   Receive Number: ${receiveData.receiveNumber || 'N/A'}`);
    console.log(`   Status: ${receiveData.status || 'N/A'}`);
    console.log(`   Items count: ${receiveData.items?.length || 0}`);
    
    // Get the old purchase receive before updating
    const oldPurchaseReceive = await PurchaseReceive.findById(id);
    if (!oldPurchaseReceive) {
      console.log(`❌ Purchase receive not found: ${id}`);
      return res.status(404).json({ message: "Purchase receive not found" });
    }
    
    const oldStatus = oldPurchaseReceive.status;
    const newStatus = receiveData.status || oldStatus;
    const oldItems = oldPurchaseReceive.items || [];
    const newItems = receiveData.items || [];
    
    console.log(`   Old status: ${oldStatus}, New status: ${newStatus}`);
    console.log(`   Old items: ${oldItems.length}, New items: ${newItems.length}`);
    
    // Update the purchase receive
    const purchaseReceive = await PurchaseReceive.findByIdAndUpdate(
      id,
      receiveData,
      { new: true, runValidators: true }
    );
    
    if (!purchaseReceive) {
      console.log(`❌ Failed to update purchase receive: ${id}`);
      return res.status(404).json({ message: "Purchase receive not found" });
    }
    
    console.log(`✅ Purchase receive updated successfully`);
    
    // Handle stock updates if status is "received"
    if (newStatus === "received" && newItems && newItems.length > 0) {
      console.log(`\n📦 STOCK UPDATE CHECK:`);
      console.log(`   New status is "received": ${newStatus === "received"}`);
      console.log(`   New items exist: ${newItems && newItems.length > 0}`);
      console.log(`   Proceeding with stock update...\n`);
      console.log("🔄 Updating stock for edited purchase receive...");
      console.log("   Old status:", oldStatus, "New status:", newStatus);
      console.log("   Old items count:", oldItems.length, "New items count:", newItems.length);
      console.log("   Old items:", JSON.stringify(oldItems.map(oi => ({ itemId: oi.itemId?.toString(), received: oi.received })), null, 2));
      console.log("   New items:", JSON.stringify(newItems.map(ni => ({ itemId: ni.itemId?.toString(), received: ni.received })), null, 2));
      
      for (const newItem of newItems) {
        // Handle itemId - could be ObjectId string or populated object
        let itemIdValue = newItem.itemId?._id || newItem.itemId || null;
        
        // Convert to string if it's an ObjectId object
        if (itemIdValue && typeof itemIdValue === 'object' && itemIdValue.toString) {
          itemIdValue = itemIdValue.toString();
        }
        
        // If itemId is null but itemGroupId is present, this is an item from a group
        // We'll need to find it by name and SKU within the group
        const itemGroupId = newItem.itemGroupId || null;
        const itemName = newItem.itemName || "";
        const itemSku = newItem.itemSku || newItem.sku || "";
        
        // Don't skip if itemId is null - we can still update using itemGroupId + itemName
        if (!itemIdValue && !(itemGroupId && itemName) && !itemName) {
          console.log(`⚠️ Skipping item - no itemId, itemGroupId, or itemName:`, newItem);
          continue;
        }
        
        // Find the old item to calculate difference
        // For items with null itemId, match by itemName and SKU instead
        let oldItem = null;
        const newItemIdStr = itemIdValue?.toString();
        
        for (const oi of oldItems) {
          let oldItemId = null;
          if (oi.itemId) {
            // Handle ObjectId (Mongoose document)
            if (oi.itemId._id) {
              oldItemId = oi.itemId._id.toString();
            } else if (typeof oi.itemId === 'object' && oi.itemId.toString) {
              oldItemId = oi.itemId.toString();
            } else {
              oldItemId = String(oi.itemId);
            }
          }
          
          // Match by itemId if both have itemIds
          if (itemIdValue && oldItemId && oldItemId === newItemIdStr) {
            oldItem = oi;
            break;
          } else if (!itemIdValue && !oldItemId) {
            // Both have null itemIds - match by name and SKU (if SKU is available)
            const oldItemName = oi.itemName || "";
            const oldItemSku = oi.itemSku || oi.sku || "";
            
            if (itemSku && oldItemSku) {
              // Match by both name AND SKU
              if (oldItemName.trim() === itemName.trim() && oldItemSku.trim() === itemSku.trim()) {
                oldItem = oi;
                break;
              }
            } else {
              // Match by name only if SKU is not available
              if (oldItemName.trim() === itemName.trim()) {
                oldItem = oi;
                break;
              }
            }
          }
        }
        
        const oldReceivedQty = oldStatus === "received" ? (parseFloat(oldItem?.received) || 0) : 0;
        const newReceivedQty = parseFloat(newItem.received) || 0;
        const qtyDifference = newReceivedQty - oldReceivedQty;
        
        console.log(`📦 Stock Update - Item ${itemIdValue || `(null, name: "${itemName}")`} (${itemName || 'Unknown'})${itemSku ? `, SKU: "${itemSku}"` : ''}:`);
        console.log(`   Old item found: ${oldItem ? 'Yes' : 'No'}`);
        console.log(`   Old received qty: ${oldReceivedQty}, New received qty: ${newReceivedQty}`);
        console.log(`   Quantity difference: ${qtyDifference}`);
        console.log(`   Old status: ${oldStatus}, New status: ${newStatus}`);
        console.log(`   ItemGroupId: ${itemGroupId || 'null'}`);
        
        // Always update stock if status is "received" (even if quantities are the same, to ensure consistency)
        // This ensures stock is updated even if old item matching fails
        if (newStatus === "received" && newReceivedQty > 0) {
          try {
            let operation = 'add';
            let qtyToUpdate = newReceivedQty;
            
            // Determine operation and quantity based on status changes
            if (oldStatus !== "received" && newStatus === "received") {
              // Was draft, now received - add new quantity
              operation = 'add';
              qtyToUpdate = newReceivedQty;
            } else if (oldStatus === "received" && newStatus !== "received") {
              // Was received, now draft - subtract old quantity
              operation = 'subtract';
              qtyToUpdate = oldReceivedQty;
            } else if (oldStatus === "received" && newStatus === "received") {
              // Both received - adjust by difference
              if (!oldItem) {
                // Old item not found, treat as new item and add full quantity
                console.log(`   ⚠️ Old item not found - treating as new item, adding full quantity: ${newReceivedQty}`);
                operation = 'add';
                qtyToUpdate = newReceivedQty;
              } else {
                // Adjust by difference
                console.log(`   ✅ Adjusting stock by difference: ${qtyDifference}`);
                operation = 'adjust';
                qtyToUpdate = qtyDifference;
              }
            }
            
            // Get itemGroupId if available (for items from groups)
            // If itemId is null, we'll use itemGroupId + itemName to find the item
            let result;
            if (itemIdValue) {
              // Item has an ID, use normal update
              console.log(`   Using itemId to update stock: ${itemIdValue}`);
              result = await updateItemStock(itemIdValue, qtyToUpdate, operation, itemName, itemGroupId);
            } else if (itemGroupId && itemName) {
              // ItemId is null but we have itemGroupId and itemName, find by name and SKU
              console.log(`   ItemId is null, searching by name "${itemName}"${itemSku ? ` and SKU "${itemSku}"` : ''} in group ${itemGroupId}`);
              result = await updateItemStockByName(itemGroupId, itemName, qtyToUpdate, operation, itemSku);
            } else if (itemName) {
              // ItemId is null and itemGroupId is also null, but we have itemName - search all groups
              console.log(`   ItemId and itemGroupId are both null, searching all groups by name "${itemName}"${itemSku ? ` and SKU "${itemSku}"` : ''}`);
              const allGroups = await ItemGroup.find({ isActive: { $ne: false } });
              let found = false;
              
              for (const group of allGroups) {
                if (group.items && Array.isArray(group.items)) {
                  // Match by name and SKU if SKU is provided, otherwise match by name only
                  const matchingItem = itemSku
                    ? group.items.find(gi => {
                        const nameMatch = gi.name && gi.name.trim() === itemName.trim();
                        const skuMatch = gi.sku && gi.sku.trim() === itemSku.trim();
                        return nameMatch && skuMatch;
                      })
                    : group.items.find(gi => gi.name && gi.name.trim() === itemName.trim());
                  
                  if (matchingItem) {
                    console.log(`   ✅ Found item "${itemName}"${itemSku ? ` with SKU "${itemSku}"` : ''} in group "${group.name}", updating stock...`);
                    result = await updateItemStockByName(group._id, itemName, qtyToUpdate, operation, itemSku);
                    found = true;
                    break;
                  }
                }
              }
              
              if (!found) {
                result = { success: false, message: `Item "${itemName}"${itemSku ? ` with SKU "${itemSku}"` : ''} not found in any item group` };
              }
            } else {
              result = { success: false, message: "Cannot update stock: itemId is null and itemGroupId/itemName not provided" };
            }
            if (result.success) {
              if (result.type === 'standalone') {
                console.log(`✅ Successfully updated stock for standalone item ${newItem.itemName || itemIdValue}:`);
                console.log(`   Stock On Hand: ${result.stock?.stockOnHand || 0}`);
                console.log(`   Available for Sale: ${result.stock?.availableForSale || 0}`);
              } else {
                console.log(`✅ Successfully updated stock for item "${result.itemName}" in group "${result.groupName}":`);
                console.log(`   Stock On Hand: ${result.stock?.stockOnHand || 0}`);
                console.log(`   Available for Sale: ${result.stock?.availableForSale || 0}`);
              }
            } else {
              console.warn(`⚠️ ${result.message}, skipping stock update`);
            }
          } catch (itemError) {
            console.error(`❌ Error updating stock for item ${itemIdValue}:`, itemError);
            // Continue with other items even if one fails
          }
        }
      }
      
      console.log("✅ Stock update completed for edited purchase receive");
    } else if (oldStatus === "received" && newStatus !== "received") {
      // Status changed from received to draft - need to reverse stock updates
      console.log("Reverting stock updates - status changed from received to draft");
      
      for (const oldItem of oldItems) {
        // Handle itemId - could be ObjectId string or populated object
        let itemIdValue = oldItem.itemId?._id?.toString() || oldItem.itemId?.toString() || null;
        const itemGroupId = oldItem.itemGroupId || null;
        const itemName = oldItem.itemName || "";
        const itemSku = oldItem.itemSku || oldItem.sku || "";
        const oldReceivedQty = parseFloat(oldItem.received) || 0;
        
        if ((itemIdValue || (itemGroupId && itemName) || itemName) && oldReceivedQty > 0) {
          try {
            // Get itemGroupId if available (for items from groups)
            let result;
            if (itemIdValue) {
              result = await updateItemStock(itemIdValue, oldReceivedQty, 'subtract', itemName, itemGroupId);
            } else if (itemGroupId && itemName) {
              result = await updateItemStockByName(itemGroupId, itemName, oldReceivedQty, 'subtract', itemSku);
            } else if (itemName) {
              // Search all groups by name and SKU
              const allGroups = await ItemGroup.find({ isActive: { $ne: false } });
              let found = false;
              
              for (const group of allGroups) {
                if (group.items && Array.isArray(group.items)) {
                  // Match by name and SKU if SKU is provided, otherwise match by name only
                  const matchingItem = itemSku
                    ? group.items.find(gi => {
                        const nameMatch = gi.name && gi.name.trim() === itemName.trim();
                        const skuMatch = gi.sku && gi.sku.trim() === itemSku.trim();
                        return nameMatch && skuMatch;
                      })
                    : group.items.find(gi => gi.name && gi.name.trim() === itemName.trim());
                  
                  if (matchingItem) {
                    result = await updateItemStockByName(group._id, itemName, oldReceivedQty, 'subtract', itemSku);
                    found = true;
                    break;
                  }
                }
              }
              
              if (!found) {
                result = { success: false, message: `Item "${itemName}"${itemSku ? ` with SKU "${itemSku}"` : ''} not found in any item group` };
              }
            } else {
              result = { success: false, message: "Cannot revert stock: itemId is null and itemGroupId/itemName not provided" };
            }
            
            if (result.success) {
              if (result.type === 'standalone') {
                console.log(`✅ Reverted stock for standalone item ${itemName || itemIdValue}: -${oldReceivedQty} units.`);
              } else {
                console.log(`✅ Reverted stock for item "${result.itemName}" in group "${result.groupName}": -${oldReceivedQty} units.`);
              }
            } else {
              console.warn(`⚠️ ${result.message}, skipping stock reversal`);
            }
          } catch (itemError) {
            console.error(`❌ Error reverting stock for item ${itemIdValue || itemName}:`, itemError);
          }
        }
      }
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

