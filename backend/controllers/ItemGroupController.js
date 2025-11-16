import ItemGroup from "../model/ItemGroup.js";
import ItemHistory from "../model/ItemHistory.js";

// Helper function to generate change details
const generateChangeDetails = (oldItem, newItem, changeType) => {
  const changes = [];
  
  if (changeType === "STOCK_UPDATE") {
    // Check for warehouse stock changes
    const oldStocks = oldItem?.warehouseStocks || [];
    const newStocks = newItem?.warehouseStocks || [];
    
    // Compare warehouse stocks
    newStocks.forEach(newStock => {
      const oldStock = oldStocks.find(s => s.warehouse === newStock.warehouse);
      if (oldStock) {
        if (oldStock.openingStock !== newStock.openingStock) {
          changes.push(`Opening stock for ${newStock.warehouse} changed from ${oldStock.openingStock || 0} to ${newStock.openingStock || 0}`);
        }
        if (oldStock.stockOnHand !== newStock.stockOnHand) {
          changes.push(`Stock on hand for ${newStock.warehouse} changed from ${oldStock.stockOnHand || 0} to ${newStock.stockOnHand || 0}`);
        }
      } else {
        changes.push(`Added stock for ${newStock.warehouse}: ${newStock.openingStock || 0}`);
      }
    });
    
    // Check for removed stocks
    oldStocks.forEach(oldStock => {
      if (!newStocks.find(s => s.warehouse === oldStock.warehouse)) {
        changes.push(`Removed stock for ${oldStock.warehouse}`);
      }
    });
    
    // Check for general stock changes
    if (oldItem?.stock !== newItem?.stock) {
      changes.push(`Initial stock changed from ${oldItem?.stock || 0} to ${newItem?.stock || 0}`);
    }
  } else {
    // General field changes
    const fieldsToCheck = ['name', 'sku', 'costPrice', 'sellingPrice', 'stock', 'reorderPoint'];
    fieldsToCheck.forEach(field => {
      if (oldItem?.[field] !== newItem?.[field]) {
        const oldVal = oldItem?.[field] ?? '';
        const newVal = newItem?.[field] ?? '';
        if (field === 'stock') {
          changes.push(`Initial stock changed from ${oldVal} to ${newVal}`);
        } else {
          changes.push(`${field} changed from ${oldVal} to ${newVal}`);
        }
      }
    });
  }
  
  if (changes.length === 0) {
    return "updated";
  }
  
  return changes.join(", ");
};

export const createItemGroup = async (req, res) => {
  try {
    if (!req.body.name || req.body.name.trim() === "") {
      return res.status(400).json({ message: "Item group name is required." });
    }

    // Ensure items array is properly formatted
    const items = Array.isArray(req.body.items) 
      ? req.body.items.filter(item => item && item.name && item.name.trim() !== "")
      : [];

    console.log("Creating item group with items:", items.length, items);

    const payload = {
      ...req.body,
      name: req.body.name.trim(),
      items: items,
      stock: req.body.stock || 0,
      attributeRows: req.body.attributeRows || [],
    };

    const itemGroup = await ItemGroup.create(payload);
    console.log("Item group created with items count:", itemGroup.items ? itemGroup.items.length : 0);
    return res.status(201).json(itemGroup);
  } catch (error) {
    console.error("Error creating item group:", error);
    
    // Return more detailed error message
    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: "Validation error", 
        errors: errors 
      });
    }
    
    return res.status(500).json({ 
      message: "Failed to create item group.",
      error: error.message 
    });
  }
};

export const getItemGroups = async (_req, res) => {
  try {
    const groups = await ItemGroup.find().sort({ createdAt: -1 });
    
    // Transform data to match frontend format
    const formattedGroups = groups.map(group => {
      const groupObj = group.toObject();
      
      // Get items array - ensure it's an array
      const itemsArray = Array.isArray(groupObj.items) ? groupObj.items : [];
      
      // Calculate total stock from all items
      const totalStock = itemsArray.reduce((sum, item) => {
        const itemStock = typeof item.stock === 'number' ? item.stock : 0;
        return sum + itemStock;
      }, 0);
      
      // Get item count
      const itemCount = itemsArray.length;
      
      console.log(`Item Group "${groupObj.name}": ${itemCount} items`);
      
      return {
        id: groupObj._id,
        name: groupObj.name,
        items: itemCount,
        sku: groupObj.sku || "",
        stock: totalStock.toFixed(2),
        reorder: groupObj.reorder || "",
        // Only include primitive fields, exclude nested objects/arrays
        itemType: groupObj.itemType,
        unit: groupObj.unit,
        manufacturer: groupObj.manufacturer,
        brand: groupObj.brand,
        isActive: groupObj.isActive !== undefined ? groupObj.isActive : true,
        createdAt: groupObj.createdAt,
        updatedAt: groupObj.updatedAt,
      };
    });
    
    return res.json(formattedGroups);
  } catch (error) {
    console.error("Error fetching item groups:", error);
    return res.status(500).json({ message: "Failed to fetch item groups." });
  }
};

export const getItemGroupById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Item group ID is required." });
    }

    const itemGroup = await ItemGroup.findById(id);
    if (!itemGroup) {
      return res.status(404).json({ message: "Item group not found." });
    }

    return res.json(itemGroup);
  } catch (error) {
    console.error("Error fetching item group:", error);
    return res.status(500).json({ message: "Failed to fetch item group." });
  }
};

export const updateItemGroup = async (req, res) => {
  try {
    const { id } = req.params;
    const changedBy = req.body.changedBy || req.headers['x-user-name'] || "System";

    if (!id) {
      return res.status(400).json({ message: "Item group ID is required." });
    }

    // Get old data before update
    const oldItemGroup = await ItemGroup.findById(id);
    if (!oldItemGroup) {
      return res.status(404).json({ message: "Item group not found." });
    }

    // Update the item group
    const itemGroup = await ItemGroup.findByIdAndUpdate(
      id,
      { ...req.body },
      { new: true, runValidators: true }
    );

    if (!itemGroup) {
      return res.status(404).json({ message: "Item group not found." });
    }

    // Track history for item changes
    const itemId = req.body.itemId;
    
    if (req.body.items && Array.isArray(req.body.items) && itemId) {
      const oldItems = oldItemGroup.items || [];
      const newItems = req.body.items;
      
      // Find which item was updated
      const oldItem = oldItems.find(i => {
        const itemIdStr = (i._id?.toString() || i.id || "").toString();
        return itemIdStr === itemId.toString();
      });
      
      const newItem = newItems.find(i => {
        const itemIdStr = (i._id?.toString() || i.id || "").toString();
        return itemIdStr === itemId.toString();
      });
      
      if (oldItem && newItem) {
        // Check if it's a stock update
        const oldStocks = (oldItem.warehouseStocks || []).sort((a, b) => (a.warehouse || "").localeCompare(b.warehouse || ""));
        const newStocks = (newItem.warehouseStocks || []).sort((a, b) => (a.warehouse || "").localeCompare(b.warehouse || ""));
        const oldStocksStr = JSON.stringify(oldStocks);
        const newStocksStr = JSON.stringify(newStocks);
        const isStockUpdate = oldStocksStr !== newStocksStr ||
                              oldItem.stock !== newItem.stock;
        
        const changeType = isStockUpdate ? "STOCK_UPDATE" : "UPDATE";
        const details = generateChangeDetails(oldItem, newItem, changeType);
        
        // Create history entry
        try {
          await ItemHistory.create({
            itemGroupId: id,
            itemId: itemId.toString(),
            changedBy: changedBy,
            changeType: changeType,
            details: details,
            oldData: oldItem,
            newData: newItem,
          });
          console.log(`History created for item ${itemId}: ${details}`);
        } catch (historyError) {
          console.error("Error creating history:", historyError);
        }
      } else if (newItem && !oldItem) {
        // New item added - check if it's from a standalone item (has originalStandaloneItemId)
        const isFromStandalone = req.body.originalStandaloneItemId;
        const details = isFromStandalone 
          ? `moved to group "${itemGroup.name}"` 
          : `Item "${newItem.name || 'New Item'}" created`;
        
        try {
          await ItemHistory.create({
            itemGroupId: id,
            itemId: itemId.toString(),
            changedBy: changedBy,
            changeType: "CREATE",
            details: details,
            oldData: null,
            newData: newItem,
          });
        } catch (historyError) {
          console.error("Error creating history:", historyError);
        }
      } else {
        // Item not found, create general update
        console.log(`Item ${itemId} not found in old or new items, creating general update`);
        try {
          await ItemHistory.create({
            itemGroupId: id,
            itemId: itemId.toString(),
            changedBy: changedBy,
            changeType: "UPDATE",
            details: "updated",
            oldData: oldItemGroup.toObject(),
            newData: itemGroup.toObject(),
          });
        } catch (historyError) {
          console.error("Error creating history:", historyError);
        }
      }
    } else {
      // General item group update (no itemId or no items array)
      try {
        await ItemHistory.create({
          itemGroupId: id,
          itemId: itemId ? itemId.toString() : "group",
          changedBy: changedBy,
          changeType: "UPDATE",
          details: "updated",
          oldData: oldItemGroup.toObject(),
          newData: itemGroup.toObject(),
        });
      } catch (historyError) {
        console.error("Error creating history:", historyError);
      }
    }

    return res.json(itemGroup);
  } catch (error) {
    console.error("Error updating item group:", error);
    return res.status(500).json({ message: "Failed to update item group." });
  }
};

// Get item history
export const getItemHistory = async (req, res) => {
  try {
    const { id, itemId } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Item group ID is required." });
    }

    const query = { itemGroupId: id };
    if (itemId && itemId !== "group") {
      // Try to match itemId as both string and ObjectId
      query.itemId = itemId.toString();
    }

    console.log(`Fetching history for itemGroupId: ${id}, itemId: ${itemId}, query:`, query);
    const history = await ItemHistory.find(query)
      .sort({ changedAt: -1 })
      .limit(100);

    console.log(`Found ${history.length} history entries`);
    return res.json(history);
  } catch (error) {
    console.error("Error fetching item history:", error);
    return res.status(500).json({ message: "Failed to fetch item history." });
  }
};

export const deleteItemGroup = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Item group ID is required." });
    }

    const itemGroup = await ItemGroup.findByIdAndDelete(id);
    if (!itemGroup) {
      return res.status(404).json({ message: "Item group not found." });
    }

    return res.json({ message: "Item group deleted successfully." });
  } catch (error) {
    console.error("Error deleting item group:", error);
    return res.status(500).json({ message: "Failed to delete item group." });
  }
};

