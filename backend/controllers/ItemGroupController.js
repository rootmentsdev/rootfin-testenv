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

// Helper function to map locName to warehouse name
const mapLocNameToWarehouse = (locName) => {
  if (!locName) return "Warehouse"; // Default to Warehouse
  // Remove prefixes like "G.", "Z.", "SG."
  let warehouse = locName.replace(/^[A-Z]\.?\s*/i, "").trim();
  // Add "Branch" if not already present and not "Warehouse"
  if (warehouse && warehouse.toLowerCase() !== "warehouse" && !warehouse.toLowerCase().includes("branch")) {
    warehouse = `${warehouse} Branch`;
  }
  return warehouse || "Warehouse";
};

export const createItemGroup = async (req, res) => {
  try {
    if (!req.body.name || req.body.name.trim() === "") {
      return res.status(400).json({ message: "Item group name is required." });
    }

    // Get user's warehouse from request
    const userWarehouse = req.body.userWarehouse || req.headers['x-user-warehouse'] || null;
    const userLocName = req.body.userLocName || req.headers['x-user-locname'] || null;
    
    // Determine warehouse - use provided warehouse or map from locName
    let targetWarehouse = userWarehouse;
    if (!targetWarehouse && userLocName) {
      targetWarehouse = mapLocNameToWarehouse(userLocName);
    }
    // Default to "Warehouse" if still not set
    if (!targetWarehouse) {
      targetWarehouse = "Warehouse";
    }

    // Ensure items array is properly formatted
    let items = Array.isArray(req.body.items) 
      ? req.body.items.filter(item => item && item.name && item.name.trim() !== "")
      : [];

    // Initialize warehouseStocks for each item if not provided
    items = items.map(item => {
      // If item already has warehouseStocks, use them; otherwise initialize
      if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks) || item.warehouseStocks.length === 0) {
        const initialStock = item.stock || item.openingStock || 0;
        item.warehouseStocks = [{
          warehouse: targetWarehouse,
          openingStock: initialStock,
          openingStockValue: 0,
          stockOnHand: initialStock,
          committedStock: 0,
          availableForSale: initialStock,
          physicalOpeningStock: initialStock,
          physicalStockOnHand: initialStock,
          physicalCommittedStock: 0,
          physicalAvailableForSale: initialStock,
        }];
      } else {
        // Ensure at least one entry has the user's warehouse
        const hasUserWarehouse = item.warehouseStocks.some(ws => {
          const wsWarehouse = (ws.warehouse || "").toString().toLowerCase().trim();
          const targetWarehouseLower = targetWarehouse.toLowerCase().trim();
          return wsWarehouse === targetWarehouseLower ||
                 wsWarehouse.includes(targetWarehouseLower) ||
                 targetWarehouseLower.includes(wsWarehouse);
        });
        
        if (!hasUserWarehouse) {
          // Add user's warehouse entry
          const initialStock = item.stock || item.openingStock || 0;
          item.warehouseStocks.push({
            warehouse: targetWarehouse,
            openingStock: initialStock,
            openingStockValue: 0,
            stockOnHand: initialStock,
            committedStock: 0,
            availableForSale: initialStock,
            physicalOpeningStock: initialStock,
            physicalStockOnHand: initialStock,
            physicalCommittedStock: 0,
            physicalAvailableForSale: initialStock,
          });
        }
      }
      return item;
    });

    console.log("Creating item group with items:", items.length, "for warehouse:", targetWarehouse);

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

// Helper function to check if item group has stock in warehouse (strict check - must have stock > 0)
const hasStockInWarehouse = (items, targetWarehouse) => {
  if (!items || !Array.isArray(items) || items.length === 0) {
    return false;
  }
  if (!targetWarehouse) {
    return true; // If no warehouse specified (admin), show all groups
  }
  
  const targetWarehouseLower = targetWarehouse.toLowerCase().trim();
  const isTargetWarehouse = targetWarehouseLower === "warehouse";
  
  // Check if ANY item in the group has stock in the target warehouse
  const hasMatchingItem = items.some(item => {
    const warehouseStocks = item.warehouseStocks || [];
    
    // If item has no warehouse stocks, exclude it
    if (!warehouseStocks || warehouseStocks.length === 0) {
      return false;
    }
    
    return warehouseStocks.some(stock => {
      const stockWarehouse = (stock.warehouse || "").toString().toLowerCase().trim();
      
      // For "Warehouse" - only match exactly "warehouse"
      if (isTargetWarehouse) {
        if (stockWarehouse !== "warehouse") {
          return false;
        }
      } else {
        // For store branches - exclude "warehouse" and match the specific store
        if (stockWarehouse === "warehouse") {
          return false; // Store users should NOT see items with stock only in "Warehouse"
        }
        
        // Check exact match first (most strict)
        if (stockWarehouse === targetWarehouseLower) {
          // Exact match - check stock
          const stockOnHand = parseFloat(stock.stockOnHand) || 0;
          const availableForSale = parseFloat(stock.availableForSale) || 0;
          return stockOnHand > 0 || availableForSale > 0;
        }
        
        // Check if warehouse name contains the store name (e.g., "kannur branch" contains "kannur")
        // Extract the base name (remove "branch", "warehouse", etc.)
        const stockBase = stockWarehouse.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
        const targetBase = targetWarehouseLower.replace(/\s*(branch|warehouse)\s*$/i, "").trim();
        
        if (stockBase && targetBase && stockBase === targetBase) {
          // Base names match - check stock
          const stockOnHand = parseFloat(stock.stockOnHand) || 0;
          const availableForSale = parseFloat(stock.availableForSale) || 0;
          return stockOnHand > 0 || availableForSale > 0;
        }
        
        return false;
      }
      
      // Check if there's actual stock (stockOnHand > 0 or availableForSale > 0)
      const stockOnHand = parseFloat(stock.stockOnHand) || 0;
      const availableForSale = parseFloat(stock.availableForSale) || 0;
      return stockOnHand > 0 || availableForSale > 0;
    });
  });
  
  return hasMatchingItem;
};

export const getItemGroups = async (req, res) => {
  try {
    const { userId, userPower, page, limit, warehouse, isAdmin } = req.query;
    
    console.log(`\n=== GET ITEM GROUPS REQUEST ===`);
    console.log(`Query params:`, req.query);
    console.log(`User warehouse: "${warehouse}"`);
    console.log(`Is admin: ${isAdmin}`);
    console.log(`==============================\n`);
    
    // Pagination parameters
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 20;
    const skip = (pageNum - 1) * limitNum;
    
    // Get user locCode from query
    const userLocCode = req.query.locCode || "";
    
    // User is admin if: power === 'admin' OR locCode === '858' (Warehouse) OR email === 'officerootments@gmail.com'
    const userId = req.query.userId || "";
    const adminEmails = ['officerootments@gmail.com'];
    const isAdminEmail = userId && typeof userId === 'string' && adminEmails.some(email => userId.toLowerCase() === email.toLowerCase());
    const userIsAdmin = isAdmin === "true" || isAdmin === true || 
                        isAdminEmail ||
                        (userPower && (userPower.toLowerCase() === 'admin' || userPower.toLowerCase() === 'super_admin')) ||
                        (userLocCode && (userLocCode === '858' || userLocCode === '103')); // 858 = Warehouse, 103 = WAREHOUSE
    
    // Don't filter by userId - item groups are shared, we filter by warehouse stock instead
    // This allows all users to see groups, but only groups with stock in their warehouse
    const query = {};
    // If admin, no filter - show all item groups
    // If not admin, we'll filter by warehouse stock below
    
    // Fetch ALL groups first (we'll filter by warehouse after)
    let groups = await ItemGroup.find(query)
      .sort({ createdAt: -1 });
    
    console.log(`Fetched ${groups.length} total groups from database`);
    
    // Filter by warehouse for non-admin users
    if (!userIsAdmin && warehouse) {
      const beforeFilter = groups.length;
      console.log(`\n=== FILTERING ITEM GROUPS FOR WAREHOUSE: "${warehouse}" ===`);
      console.log(`Total groups before filter: ${beforeFilter}`);
      
      let keptCount = 0;
      let filteredCount = 0;
      
      groups = groups.filter(group => {
        const items = group.items || [];
        const hasStock = hasStockInWarehouse(items, warehouse);
        
        if (!hasStock) {
          filteredCount++;
          if (filteredCount <= 10) {
            const itemWarehouses = items.flatMap(item => {
              const stocks = item.warehouseStocks || [];
              return stocks.map(s => s.warehouse);
            });
            const uniqueWarehouses = [...new Set(itemWarehouses)];
            console.log(`  ❌ Filtering out group "${group.name}" - items have stock in: [${uniqueWarehouses.join(", ")}], user warehouse: "${warehouse}"`);
          }
          return false;
        } else {
          keptCount++;
          if (keptCount <= 5) {
            const itemWarehouses = items.flatMap(item => {
              const stocks = item.warehouseStocks || [];
              return stocks.map(s => `${s.warehouse} (stock: ${s.stockOnHand || 0})`);
            });
            const uniqueWarehouses = [...new Set(itemWarehouses)];
            console.log(`  ✅ Keeping group "${group.name}" - items have stock in: [${uniqueWarehouses.join(", ")}]`);
          }
        }
        
        return hasStock;
      });
      
      console.log(`Total groups after filter: ${groups.length} (kept: ${keptCount}, filtered: ${filteredCount})`);
      console.log(`=== END FILTERING ===\n`);
    }
    
    // Get total count after filtering
    const totalGroups = groups.length;
    
    // Apply pagination
    const paginatedGroups = groups.slice(skip, skip + limitNum);
    
    // Transform data to match frontend format
    const formattedGroups = paginatedGroups.map(group => {
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
    
    const totalPages = Math.ceil(totalGroups / limitNum);
    
    // Return paginated response
    return res.json({
      groups: formattedGroups,
      pagination: {
        currentPage: pageNum,
        itemsPerPage: limitNum,
        totalItems: totalGroups,
        totalPages: totalPages,
        hasNextPage: pageNum < totalPages,
        hasPreviousPage: pageNum > 1
      }
    });
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

    // Get user's warehouse from request
    const userWarehouse = req.body.userWarehouse || req.headers['x-user-warehouse'] || null;
    const userLocName = req.body.userLocName || req.headers['x-user-locname'] || null;
    
    // Determine warehouse - use provided warehouse or map from locName
    let targetWarehouse = userWarehouse;
    if (!targetWarehouse && userLocName) {
      targetWarehouse = mapLocNameToWarehouse(userLocName);
    }
    // Default to "Warehouse" if still not set
    if (!targetWarehouse) {
      targetWarehouse = "Warehouse";
    }

    // Initialize warehouseStocks for items that don't have them
    if (req.body.items && Array.isArray(req.body.items)) {
      req.body.items = req.body.items.map(item => {
        // If item already has warehouseStocks, use them; otherwise initialize
        if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks) || item.warehouseStocks.length === 0) {
          const initialStock = item.stock || item.openingStock || 0;
          item.warehouseStocks = [{
            warehouse: targetWarehouse,
            openingStock: initialStock,
            openingStockValue: 0,
            stockOnHand: initialStock,
            committedStock: 0,
            availableForSale: initialStock,
            physicalOpeningStock: initialStock,
            physicalStockOnHand: initialStock,
            physicalCommittedStock: 0,
            physicalAvailableForSale: initialStock,
          }];
        } else {
          // Ensure at least one entry has the user's warehouse
          const hasUserWarehouse = item.warehouseStocks.some(ws => {
            const wsWarehouse = (ws.warehouse || "").toString().toLowerCase().trim();
            const targetWarehouseLower = targetWarehouse.toLowerCase().trim();
            return wsWarehouse === targetWarehouseLower ||
                   wsWarehouse.includes(targetWarehouseLower) ||
                   targetWarehouseLower.includes(wsWarehouse);
          });
          
          if (!hasUserWarehouse) {
            // Add user's warehouse entry
            const initialStock = item.stock || item.openingStock || 0;
            item.warehouseStocks.push({
              warehouse: targetWarehouse,
              openingStock: initialStock,
              openingStockValue: 0,
              stockOnHand: initialStock,
              committedStock: 0,
              availableForSale: initialStock,
              physicalOpeningStock: initialStock,
              physicalStockOnHand: initialStock,
              physicalCommittedStock: 0,
              physicalAvailableForSale: initialStock,
            });
          }
        }
        return item;
      });
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

