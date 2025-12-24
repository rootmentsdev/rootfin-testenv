import ShoeItem from "../model/ShoeItem.js";
import ItemGroup from "../model/ItemGroup.js";

// Warehouse name normalization mapping (same as ShoeItemController)
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

// Get Inventory Summary Report
export const getInventorySummary = async (req, res) => {
  try {
    const { locCode, warehouse } = req.query;
    const userId = req.query.userId || req.body.userId;

    // Check if user is admin
    const adminEmails = ['officerootments@gmail.com'];
    const isAdminEmail = userId && adminEmails.some(email => userId.toLowerCase() === email.toLowerCase());
    const isAdmin = isAdminEmail || (locCode && (locCode === '858' || locCode === '103'));
    const isMainAdmin = isAdmin;

    let query = {};

    // For store users (non-admin), filter by their locCode
    if (!isAdmin && locCode && locCode !== '858' && locCode !== '103') {
      query.$or = [
        { warehouse: locCode },
        { branch: locCode },
        { locCode: locCode }
      ];
    }
    // For admin users, filter by selected warehouse if specified and not "All Stores"
    else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
      query.$or = [
        { warehouse: warehouse },
        { branch: warehouse },
        { locCode: warehouse }
      ];
    }

    // For store users, filter items that have stock in their warehouse
    // For admin users viewing all stores, get all items
    let items;
    
    // Normalize warehouse name
    const normalizedWarehouse = warehouse ? normalizeWarehouseName(warehouse) : null;
    
    console.log("🔍 Original warehouse:", warehouse);
    console.log("🔍 Normalized warehouse:", normalizedWarehouse);
    console.log("🔍 User locCode:", locCode);
    console.log("🔍 Is Admin:", isAdmin);
    console.log("🔍 Is Main Admin:", isMainAdmin);
    
    // Fetch standalone items
    let standaloneItems = [];
    if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
      standaloneItems = await ShoeItem.find({
        "warehouseStocks.warehouse": normalizedWarehouse
      });
    } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
      standaloneItems = await ShoeItem.find({
        "warehouseStocks.warehouse": normalizedWarehouse
      });
    } else {
      standaloneItems = await ShoeItem.find({});
    }
    
    // Fetch items from item groups
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    let groupItems = [];
    
    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach((item, index) => {
          let shouldInclude = true;
          
          if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
            const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
              item.warehouseStocks.some(ws => ws.warehouse === normalizedWarehouse);
            shouldInclude = hasStock;
          } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
            const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
              item.warehouseStocks.some(ws => ws.warehouse === normalizedWarehouse);
            shouldInclude = hasStock;
          }
          
          if (shouldInclude) {
            const standaloneItem = {
              _id: item._id || `${group._id}_${index}`,
              itemName: item.name || "",
              sku: item.sku || "",
              costPrice: item.costPrice || 0,
              category: group.category || "",
              warehouseStocks: item.warehouseStocks || [],
              itemGroupId: group._id,
              itemGroupName: group.name,
              isFromGroup: true,
              createdAt: group.createdAt,
            };
            groupItems.push(standaloneItem);
          }
        });
      }
    });
    
    items = [...standaloneItems.map(item => ({ ...item.toObject ? item.toObject() : item, isFromGroup: false })), ...groupItems];

    const inventorySummary = items.map(item => {
      let totalStock = 0;
      let totalValue = 0;
      
      // For store users, only count stock in their warehouse
      // For admin users, count all stock
      let warehouseStocksToShow = item.warehouseStocks || [];
      
      if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
        // Store user - only show their warehouse stock
        warehouseStocksToShow = (item.warehouseStocks || []).filter(ws => ws.warehouse === normalizedWarehouse);
      }

      if (warehouseStocksToShow && Array.isArray(warehouseStocksToShow)) {
        warehouseStocksToShow.forEach(ws => {
          const stock = parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
          const cost = parseFloat(item.costPrice) || 0;
          totalStock += stock;
          totalValue += stock * cost;
        });
      }

      return {
        itemId: item._id,
        itemName: item.itemName,
        sku: item.sku,
        category: item.category,
        cost: parseFloat(item.costPrice) || 0,
        totalStock,
        totalValue,
        warehouseStocks: warehouseStocksToShow,
        branch: item.branch || item.warehouse
      };
    });

    const totalItems = inventorySummary.length;
    const totalStockValue = inventorySummary.reduce((sum, item) => sum + item.totalValue, 0);
    const totalQuantity = inventorySummary.reduce((sum, item) => sum + item.totalStock, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalItems,
          totalQuantity,
          totalStockValue
        },
        items: inventorySummary.sort((a, b) => b.totalValue - a.totalValue)
      }
    });
  } catch (error) {
    console.error("Get inventory summary error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Stock Summary Report
export const getStockSummary = async (req, res) => {
  try {
    const { locCode, warehouse } = req.query;
    const userId = req.query.userId || req.body.userId;

    // Check if user is admin
    const adminEmails = ['officerootments@gmail.com'];
    const isAdminEmail = userId && adminEmails.some(email => userId.toLowerCase() === email.toLowerCase());
    const isAdmin = isAdminEmail || (locCode && (locCode === '858' || locCode === '103'));
    const isMainAdmin = isAdmin;

    // Normalize warehouse name
    const normalizedWarehouse = warehouse ? normalizeWarehouseName(warehouse) : null;
    
    // Fetch standalone items
    let standaloneItems = [];
    if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
      standaloneItems = await ShoeItem.find({
        "warehouseStocks.warehouse": normalizedWarehouse
      });
    } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
      standaloneItems = await ShoeItem.find({
        "warehouseStocks.warehouse": normalizedWarehouse
      });
    } else {
      standaloneItems = await ShoeItem.find({});
    }
    
    // Fetch items from item groups
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    let groupItems = [];
    
    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach((item, index) => {
          let shouldInclude = true;
          
          if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
            const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
              item.warehouseStocks.some(ws => ws.warehouse === normalizedWarehouse);
            shouldInclude = hasStock;
          } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
            const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
              item.warehouseStocks.some(ws => ws.warehouse === normalizedWarehouse);
            shouldInclude = hasStock;
          }
          
          if (shouldInclude) {
            const standaloneItem = {
              _id: item._id || `${group._id}_${index}`,
              itemName: item.name || "",
              sku: item.sku || "",
              costPrice: item.costPrice || 0,
              category: group.category || "",
              warehouseStocks: item.warehouseStocks || [],
              itemGroupId: group._id,
              itemGroupName: group.name,
              isFromGroup: true,
              createdAt: group.createdAt,
            };
            groupItems.push(standaloneItem);
          }
        });
      }
    });
    
    const items = [...standaloneItems.map(item => ({ ...item.toObject ? item.toObject() : item, isFromGroup: false })), ...groupItems];

    const warehouseStockMap = {};

    const restrictToWarehouse = (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103')
      ? normalizedWarehouse
      : null;

    items.forEach(item => {
      if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
        item.warehouseStocks.forEach(ws => {
          if (restrictToWarehouse && ws.warehouse !== restrictToWarehouse) return;
          const warehouseName = ws.warehouse || "Unknown";
          const stock = parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
          const cost = parseFloat(item.costPrice) || 0;

          if (!warehouseStockMap[warehouseName]) {
            warehouseStockMap[warehouseName] = {
              warehouse: warehouseName,
              totalQuantity: 0,
              totalValue: 0,
              itemCount: 0
            };
          }

          warehouseStockMap[warehouseName].totalQuantity += stock;
          warehouseStockMap[warehouseName].totalValue += stock * cost;
          warehouseStockMap[warehouseName].itemCount++;
        });
      }
    });

    const stockSummary = Object.values(warehouseStockMap);
    const grandTotal = stockSummary.reduce((sum, ws) => sum + ws.totalValue, 0);
    const grandQuantity = stockSummary.reduce((sum, ws) => sum + ws.totalQuantity, 0);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalWarehouses: stockSummary.length,
          grandTotalQuantity: grandQuantity,
          grandTotalValue: grandTotal
        },
        warehouses: stockSummary.sort((a, b) => b.totalValue - a.totalValue)
      }
    });
  } catch (error) {
    console.error("Get stock summary error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Inventory Valuation Report
export const getInventoryValuation = async (req, res) => {
  try {
    const { locCode, warehouse } = req.query;
    const userId = req.query.userId || req.body.userId;

    // Check if user is admin
    const adminEmails = ['officerootments@gmail.com'];
    const isAdminEmail = userId && adminEmails.some(email => userId.toLowerCase() === email.toLowerCase());
    const isAdmin = isAdminEmail || (locCode && (locCode === '858' || locCode === '103'));
    const isMainAdmin = isAdmin;

    // Normalize warehouse name
    const normalizedWarehouse = warehouse ? normalizeWarehouseName(warehouse) : null;
    
    // Fetch standalone items
    let standaloneItems = [];
    if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
      standaloneItems = await ShoeItem.find({
        "warehouseStocks.warehouse": normalizedWarehouse
      });
    } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
      standaloneItems = await ShoeItem.find({
        "warehouseStocks.warehouse": normalizedWarehouse
      });
    } else {
      standaloneItems = await ShoeItem.find({});
    }
    
    // Fetch items from item groups
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    let groupItems = [];
    
    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach((item, index) => {
          let shouldInclude = true;
          
          if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
            const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
              item.warehouseStocks.some(ws => ws.warehouse === normalizedWarehouse);
            shouldInclude = hasStock;
          } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
            const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
              item.warehouseStocks.some(ws => ws.warehouse === normalizedWarehouse);
            shouldInclude = hasStock;
          }
          
          if (shouldInclude) {
            const standaloneItem = {
              _id: item._id || `${group._id}_${index}`,
              itemName: item.name || "",
              sku: item.sku || "",
              costPrice: item.costPrice || 0,
              category: group.category || "",
              warehouseStocks: item.warehouseStocks || [],
              itemGroupId: group._id,
              itemGroupName: group.name,
              isFromGroup: true,
              createdAt: group.createdAt,
            };
            groupItems.push(standaloneItem);
          }
        });
      }
    });
    
    const items = [...standaloneItems.map(item => ({ ...item.toObject ? item.toObject() : item, isFromGroup: false })), ...groupItems];

    const valuationByCategory = {};
    let totalValuation = 0;

    items.forEach(item => {
      const category = item.category || "Uncategorized";
      let itemValue = 0;

      if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
        item.warehouseStocks.forEach(ws => {
          if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103' && ws.warehouse !== normalizedWarehouse) return;
          const stock = parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
          const cost = parseFloat(item.costPrice) || 0;
          itemValue += stock * cost;
        });
      }

      if (!valuationByCategory[category]) {
        valuationByCategory[category] = {
          category,
          itemCount: 0,
          totalQuantity: 0,
          totalValue: 0
        };
      }

      valuationByCategory[category].itemCount++;
      valuationByCategory[category].totalValue += itemValue;

      if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
        item.warehouseStocks.forEach(ws => {
          if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103' && ws.warehouse !== normalizedWarehouse) return;
          valuationByCategory[category].totalQuantity += parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
        });
      }

      totalValuation += itemValue;
    });

    const valuationList = Object.values(valuationByCategory)
      .sort((a, b) => b.totalValue - a.totalValue);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalCategories: valuationList.length,
          totalValuation,
          averageValuePerCategory: valuationList.length > 0 ? totalValuation / valuationList.length : 0
        },
        categories: valuationList
      }
    });
  } catch (error) {
    console.error("Get inventory valuation error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get Inventory Aging Report
export const getInventoryAging = async (req, res) => {
  try {
    const { locCode, warehouse } = req.query;
    const userId = req.query.userId || req.body.userId;

    // Check if user is admin
    const adminEmails = ['officerootments@gmail.com'];
    const isAdminEmail = userId && adminEmails.some(email => userId.toLowerCase() === email.toLowerCase());
    const isAdmin = isAdminEmail || (locCode && (locCode === '858' || locCode === '103'));
    const isMainAdmin = isAdmin;

    // Normalize warehouse name
    const normalizedWarehouse = warehouse ? normalizeWarehouseName(warehouse) : null;
    
    // Fetch standalone items
    let standaloneItems = [];
    if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
      standaloneItems = await ShoeItem.find({
        "warehouseStocks.warehouse": normalizedWarehouse
      });
    } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
      standaloneItems = await ShoeItem.find({
        "warehouseStocks.warehouse": normalizedWarehouse
      });
    } else {
      standaloneItems = await ShoeItem.find({});
    }
    
    // Fetch items from item groups
    const itemGroups = await ItemGroup.find({ isActive: { $ne: false } });
    let groupItems = [];
    
    itemGroups.forEach(group => {
      if (group.items && Array.isArray(group.items)) {
        group.items.forEach((item, index) => {
          let shouldInclude = true;
          
          if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103') {
            const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
              item.warehouseStocks.some(ws => ws.warehouse === normalizedWarehouse);
            shouldInclude = hasStock;
          } else if (isAdmin && warehouse && warehouse !== "Warehouse" && warehouse !== "All Stores") {
            const hasStock = item.warehouseStocks && Array.isArray(item.warehouseStocks) &&
              item.warehouseStocks.some(ws => ws.warehouse === normalizedWarehouse);
            shouldInclude = hasStock;
          }
          
          if (shouldInclude) {
            const standaloneItem = {
              _id: item._id || `${group._id}_${index}`,
              itemName: item.name || "",
              sku: item.sku || "",
              costPrice: item.costPrice || 0,
              category: group.category || "",
              warehouseStocks: item.warehouseStocks || [],
              itemGroupId: group._id,
              itemGroupName: group.name,
              isFromGroup: true,
              createdAt: group.createdAt,
            };
            groupItems.push(standaloneItem);
          }
        });
      }
    });
    
    const items = [...standaloneItems.map(item => ({ ...item.toObject ? item.toObject() : item, isFromGroup: false })), ...groupItems];
    
    const now = new Date();

    const agingBuckets = {
      "0-30 days": { count: 0, value: 0, items: [] },
      "31-60 days": { count: 0, value: 0, items: [] },
      "61-90 days": { count: 0, value: 0, items: [] },
      "90+ days": { count: 0, value: 0, items: [] }
    };

    items.forEach(item => {
      const createdDate = new Date(item.createdAt || item.createdDate);
      const daysOld = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));

      let bucket;
      if (daysOld <= 30) bucket = "0-30 days";
      else if (daysOld <= 60) bucket = "31-60 days";
      else if (daysOld <= 90) bucket = "61-90 days";
      else bucket = "90+ days";

      let itemValue = 0;
      let itemQuantity = 0;

      if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
        item.warehouseStocks.forEach(ws => {
          if (!isMainAdmin && locCode && locCode !== '858' && locCode !== '103' && ws.warehouse !== normalizedWarehouse) return;
          const stock = parseFloat(ws.stockOnHand) || parseFloat(ws.stock) || 0;
          const cost = parseFloat(item.costPrice) || 0;
          itemValue += stock * cost;
          itemQuantity += stock;
        });
      }

      agingBuckets[bucket].count++;
      agingBuckets[bucket].value += itemValue;
      agingBuckets[bucket].items.push({
        itemName: item.itemName,
        sku: item.sku,
        quantity: itemQuantity,
        value: itemValue,
        daysOld
      });
    });

    const agingList = Object.entries(agingBuckets).map(([bucket, data]) => ({
      bucket,
      itemCount: data.count,
      totalValue: data.value,
      items: data.items
    }));

    res.status(200).json({
      success: true,
      data: {
        summary: {
          totalItems: items.length,
          totalValue: Object.values(agingBuckets).reduce((sum, b) => sum + b.value, 0)
        },
        aging: agingList
      }
    });
  } catch (error) {
    console.error("Get inventory aging error:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};
