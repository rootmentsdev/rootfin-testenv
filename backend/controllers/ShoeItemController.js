import ShoeItem from "../model/ShoeItem.js";
import ItemHistory from "../model/ItemHistory.js";

const sanitizeWords = (text = "") =>
  text
    .replace(/[^a-zA-Z0-9\s-]/g, " ")
    .split(/[\s-_,]+/)
    .filter(Boolean);

const buildSkuBase = (name = "") => {
  const words = sanitizeWords(name);
  if (words.length === 0) {
    return "ITEM";
  }

  const alphaWords = words.filter((word) => /[A-Za-z]/.test(word));
  const numericWords = words.filter((word) => /^\d+$/.test(word));

  let letters = alphaWords.map((word) => word[0].toUpperCase()).join("");

  if (!letters && alphaWords.length > 0) {
    letters = alphaWords[0].slice(0, 3).toUpperCase();
  }

  if (!letters) {
    letters = words[0].slice(0, 3).toUpperCase();
  }

  let base = letters || "ITEM";
  const digits = numericWords.join("");
  if (digits) {
    base += `-${digits}`;
  }

  return base;
};

const generateUniqueSku = async (name = "") => {
  const base = buildSkuBase(name);
  let sku = base;
  let counter = 1;

  // Ensure uniqueness
  while (await ShoeItem.exists({ sku })) {
    const suffix = String(counter).padStart(2, "0");
    sku = `${base}-${suffix}`;
    counter += 1;
  }

  return sku;
};

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
    const fieldsToCheck = ['itemName', 'sku', 'costPrice', 'sellingPrice', 'stock', 'reorderPoint'];
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
  
  return `updated. ${changes.join(", ")}`;
};

export const createShoeItem = async (req, res) => {
  try {
    if (!req.body.itemName || req.body.itemName.trim() === "") {
      return res.status(400).json({ message: "Item name is required." });
    }

    let incomingSku = req.body.sku?.toString().trim().toUpperCase();
    if (incomingSku) {
      const existing = await ShoeItem.exists({ sku: incomingSku });
      if (existing) {
        incomingSku = await generateUniqueSku(req.body.itemName);
      }
    } else {
      incomingSku = await generateUniqueSku(req.body.itemName);
    }

    // Get user information for createdBy and changedBy
    const changedBy = req.body.changedBy || req.body.createdBy || req.headers['x-user-name'] || "System";
    
    const payload = {
      ...req.body,
      itemName: req.body.itemName.trim(),
      sku: incomingSku,
      sellingPrice: req.body.sellingPrice ? Number(req.body.sellingPrice) : 0,
      costPrice: req.body.costPrice ? Number(req.body.costPrice) : 0,
      createdBy: req.body.createdBy || changedBy,
    };

    const item = await ShoeItem.create(payload);
    
    // Log history for item creation
    try {
      const historyEntry = {
        itemGroupId: null, // Standalone item
        itemId: item._id.toString(),
        changedBy: changedBy,
        changeType: "CREATE",
        details: `created`,
        oldData: null,
        newData: item.toObject(),
        changedAt: item.createdAt || new Date(), // Use item's createdAt or current date
      };
      await ItemHistory.create(historyEntry);
      console.log(`History created for item creation: ${item._id}, changedAt: ${historyEntry.changedAt}`);
    } catch (historyError) {
      console.error("Error creating history:", historyError);
    }
    
    return res.status(201).json(item);
  } catch (error) {
    console.error("Error creating shoe item:", error);
    return res.status(500).json({ message: "Failed to create shoe item." });
  }
};

export const getShoeItems = async (req, res) => {
  try {
    // Get pagination parameters from query
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    
    // Fetch ALL standalone items (we'll combine and paginate after)
    const standaloneItems = await ShoeItem.find().sort({ createdAt: -1 });
    
    // Fetch ALL item groups and extract items from them
    const ItemGroup = (await import("../model/ItemGroup.js")).default;
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } }).sort({ createdAt: -1 });
    
    // Flatten items from groups and convert to standalone item format
    const groupItems = [];
    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach((item, index) => {
          // Convert group item to standalone item format
          const standaloneItem = {
            _id: item._id || `${group._id}_${index}`, // Use item's _id or create composite ID
            itemName: item.name || "",
            sku: item.sku || "",
            costPrice: item.costPrice || 0,
            sellingPrice: item.sellingPrice || 0,
            upc: item.upc || "",
            hsnCode: item.hsnCode || "",
            isbn: item.isbn || "",
            reorderPoint: item.reorderPoint || "",
            stock: item.stock || 0,
            warehouseStocks: item.warehouseStocks || [],
            // Include group information
            itemGroupId: group._id,
            itemGroupName: group.name,
            isFromGroup: true,
            // Copy group-level properties
            type: group.itemType || "goods",
            unit: group.unit || "",
            manufacturer: group.manufacturer || "",
            brand: group.brand || "",
            taxPreference: group.taxPreference || "taxable",
            taxRateIntra: group.intraStateTaxRate || "",
            taxRateInter: group.interStateTaxRate || "",
            inventoryValuation: group.inventoryValuationMethod || "",
            trackInventory: group.trackInventory !== undefined ? group.trackInventory : false,
            sellable: group.sellable !== undefined ? group.sellable : true,
            purchasable: group.purchasable !== undefined ? group.purchasable : true,
            isActive: group.isActive !== undefined ? group.isActive : true,
            attributeCombination: item.attributeCombination || [],
            createdAt: group.createdAt,
            updatedAt: group.updatedAt || group.createdAt,
          };
          groupItems.push(standaloneItem);
        });
      }
    });
    
    // Combine standalone items and group items
    const allItems = [...standaloneItems.map(item => ({ ...item.toObject(), isFromGroup: false })), ...groupItems];
    
    // Sort by creation date (newest first)
    allItems.sort((a, b) => {
      const dateA = new Date(a.createdAt || 0);
      const dateB = new Date(b.createdAt || 0);
      return dateB - dateA;
    });
    
    // Apply pagination to combined results
    const totalItems = allItems.length;
    const totalPages = Math.ceil(totalItems / limit);
    const paginatedItems = allItems.slice(skip, skip + limit);
    
    console.log(`Fetched ${standaloneItems.length} standalone items and ${groupItems.length} items from groups. Total: ${totalItems}, Showing page ${page} of ${totalPages} (${paginatedItems.length} items)`);
    
    // Return paginated response
    return res.json({
      items: paginatedItems,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: totalItems,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1
      }
    });
  } catch (error) {
    console.error("Error fetching shoe items:", error);
    return res.status(500).json({ message: "Failed to fetch shoe items." });
  }
};

export const getShoeItemById = async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required." });
    }

    // First try to find as standalone item
    const standaloneItem = await ShoeItem.findById(itemId);
    if (standaloneItem) {
      return res.json({ ...standaloneItem.toObject(), isFromGroup: false });
    }
    
    // If not found, check if it's an item from a group
    const ItemGroup = (await import("../model/ItemGroup.js")).default;
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    
    for (const group of itemGroups) {
      if (group.items && Array.isArray(group.items)) {
        const groupItem = group.items.find(item => {
          const itemIdStr = item._id?.toString() || `${group._id}_${group.items.indexOf(item)}`;
          return itemIdStr === itemId || item._id?.toString() === itemId;
        });
        
        if (groupItem) {
          // Convert group item to standalone item format
          const standaloneItem = {
            _id: groupItem._id || itemId,
            itemName: groupItem.name || "",
            sku: groupItem.sku || "",
            costPrice: groupItem.costPrice || 0,
            sellingPrice: groupItem.sellingPrice || 0,
            upc: groupItem.upc || "",
            hsnCode: groupItem.hsnCode || "",
            isbn: groupItem.isbn || "",
            reorderPoint: groupItem.reorderPoint || "",
            stock: groupItem.stock || 0,
            warehouseStocks: groupItem.warehouseStocks || [],
            // Include group information
            itemGroupId: group._id,
            itemGroupName: group.name,
            isFromGroup: true,
            // Copy group-level properties
            type: group.itemType || "goods",
            unit: group.unit || "",
            manufacturer: group.manufacturer || "",
            brand: group.brand || "",
            taxPreference: group.taxPreference || "taxable",
            taxRateIntra: group.intraStateTaxRate || "",
            taxRateInter: group.interStateTaxRate || "",
            inventoryValuation: group.inventoryValuationMethod || "",
            trackInventory: group.trackInventory !== undefined ? group.trackInventory : false,
            sellable: group.sellable !== undefined ? group.sellable : true,
            purchasable: group.purchasable !== undefined ? group.purchasable : true,
            isActive: group.isActive !== undefined ? group.isActive : true,
            attributeCombination: groupItem.attributeCombination || [],
            createdAt: group.createdAt,
            updatedAt: group.updatedAt || group.createdAt,
          };
          return res.json(standaloneItem);
        }
      }
    }
    
    // Item not found in standalone items or groups
    return res.status(404).json({ message: "Item not found." });
  } catch (error) {
    console.error("Error fetching shoe item:", error);
    return res.status(500).json({ message: "Failed to fetch shoe item." });
  }
};

export const updateShoeItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const changedBy = req.body.changedBy || req.headers['x-user-name'] || "System";

    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required." });
    }

    const oldItem = await ShoeItem.findById(itemId);
    if (!oldItem) {
      return res.status(404).json({ message: "Item not found." });
    }

    // Check for special operations
    const isMarkingInactive = req.body.isActive === false && oldItem.isActive !== false;
    const isMovingToGroup = req.body.movedToGroupId && req.body.movedToGroupId !== oldItem.movedToGroupId;
    const targetGroupId = req.body.movedToGroupId || req.body.targetGroupId;
    const targetGroupName = req.body.targetGroupName;

    // Update item fields
    const updateData = {
      ...req.body,
      itemName: req.body.itemName ? req.body.itemName.trim() : oldItem.itemName,
      sellingPrice: req.body.sellingPrice !== undefined ? Number(req.body.sellingPrice) : oldItem.sellingPrice,
      costPrice: req.body.costPrice !== undefined ? Number(req.body.costPrice) : oldItem.costPrice,
    };

    // Remove _id and __v from update data if present
    delete updateData._id;
    delete updateData.__v;
    delete updateData.movedToGroupId;
    delete updateData.targetGroupId;
    delete updateData.targetGroupName;

    const updatedItem = await ShoeItem.findByIdAndUpdate(
      itemId,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Determine change type and details
    let changeType = "UPDATE";
    let details = "";

    if (isMovingToGroup && targetGroupName) {
      // Item moved to a group
      changeType = "UPDATE";
      details = `moved to group "${targetGroupName}"`;
    } else if (isMarkingInactive) {
      // Item marked as inactive
      changeType = "UPDATE";
      details = "marked as inactive";
    } else {
      // Check if it's a stock update
      const oldStocks = (oldItem.warehouseStocks || []).sort((a, b) => (a.warehouse || "").localeCompare(b.warehouse || ""));
      const newStocks = (updatedItem.warehouseStocks || []).sort((a, b) => (a.warehouse || "").localeCompare(b.warehouse || ""));
      const oldStocksStr = JSON.stringify(oldStocks);
      const newStocksStr = JSON.stringify(newStocks);
      const isStockUpdate = oldStocksStr !== newStocksStr;
      
      changeType = isStockUpdate ? "STOCK_UPDATE" : "UPDATE";
      details = generateChangeDetails(oldItem.toObject(), updatedItem.toObject(), changeType);
    }
    
    // Log history for item update
    try {
      const historyEntry = {
        itemGroupId: null, // Standalone item
        itemId: itemId.toString(),
        changedBy: changedBy,
        changeType: changeType,
        details: details,
        oldData: oldItem.toObject(),
        newData: updatedItem.toObject(),
        changedAt: new Date(), // Explicitly set current date
      };
      await ItemHistory.create(historyEntry);
      console.log(`History created for item update: ${itemId}, changedAt: ${historyEntry.changedAt}`);
    } catch (historyError) {
      console.error("Error creating history:", historyError);
    }

    return res.json(updatedItem);
  } catch (error) {
    console.error("Error updating shoe item:", error);
    return res.status(500).json({ message: "Failed to update shoe item." });
  }
};

export const deleteShoeItem = async (req, res) => {
  try {
    const { itemId } = req.params;
    const changedBy = req.body.changedBy || req.headers['x-user-name'] || "System";

    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required." });
    }

    const item = await ShoeItem.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    // Log history before deletion
    try {
      await ItemHistory.create({
        itemGroupId: null, // Standalone item
        itemId: itemId.toString(),
        changedBy: changedBy,
        changeType: "DELETE",
        details: `deleted`,
        oldData: item.toObject(),
        newData: null,
      });
    } catch (historyError) {
      console.error("Error creating history:", historyError);
    }

    await ShoeItem.findByIdAndDelete(itemId);

    return res.json({ message: "Item deleted successfully." });
  } catch (error) {
    console.error("Error deleting shoe item:", error);
    return res.status(500).json({ message: "Failed to delete shoe item." });
  }
};

export const getShoeItemHistory = async (req, res) => {
  try {
    const { itemId } = req.params;

    if (!itemId) {
      return res.status(400).json({ message: "Item ID is required." });
    }

    // Fetch history for standalone item (where itemGroupId is null or the itemId matches)
    // This includes history when item was standalone, and also when it was moved to/from groups
    const query = { 
      itemId: itemId.toString() 
    };

    console.log(`Fetching history for itemId: ${itemId}, query:`, query);
    const history = await ItemHistory.find(query)
      .sort({ changedAt: -1 })
      .limit(100);

    console.log(`Found ${history.length} history entries`);
    return res.json(history);
  } catch (error) {
    console.error("Error fetching shoe item history:", error);
    return res.status(500).json({ message: "Failed to fetch item history." });
  }
};

