import TransferOrderMongo from "../model/TransferOrder.js";
import TransferOrderPostgres from "../models/sequelize/TransferOrder.js";
import ShoeItem from "../model/ShoeItem.js";
import ItemGroup from "../model/ItemGroup.js";
import { Op } from 'sequelize';

// Use MongoDB model for queries, PostgreSQL for fallback
const TransferOrder = TransferOrderMongo;

// Create a new transfer order
export const createTransferOrder = async (req, res) => {
  try {
    const {
      transferOrderNumber,
      date,
      reason,
      sourceWarehouse,
      destinationWarehouse,
      items,
      userId,
      createdBy,
      locCode
    } = req.body;

    // Validate required fields
    if (!sourceWarehouse || !destinationWarehouse || !items || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Source warehouse, destination warehouse, and items are required"
      });
    }

    // Create the transfer order
    const savedTransferOrder = await TransferOrder.create({
      transferOrderNumber,
      date: date || new Date(),
      reason,
      sourceWarehouse,
      destinationWarehouse,
      items,
      status: 'draft',
      userId,
      createdBy,
      locCode
    });

    res.status(201).json({
      success: true,
      message: "Transfer order created successfully",
      data: savedTransferOrder
    });

  } catch (error) {
    console.error("Error creating transfer order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create transfer order",
      error: error.message
    });
  }
};

// Get all transfer orders with filtering
export const getTransferOrders = async (req, res) => {
  try {
    const { 
      status, 
      sourceWarehouse, 
      destinationWarehouse, 
      startDate, 
      endDate,
      page = 1,
      limit = 50
    } = req.query;

    // Build MongoDB query
    const query = {};
    
    if (status) query.status = status;
    if (sourceWarehouse) query.sourceWarehouse = { $regex: sourceWarehouse, $options: 'i' };
    if (destinationWarehouse) query.destinationWarehouse = { $regex: destinationWarehouse, $options: 'i' };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Execute query with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const transferOrders = await TransferOrder.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await TransferOrder.countDocuments(query);

    res.json({
      success: true,
      data: transferOrders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error("Error fetching transfer orders:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transfer orders",
      error: error.message
    });
  }
};

// Get a single transfer order by ID
export const getTransferOrderById = async (req, res) => {
  try {
    const { id } = req.params;

    const transferOrder = await TransferOrder.findById(id);

    if (!transferOrder) {
      return res.status(404).json({
        success: false,
        message: "Transfer order not found"
      });
    }

    res.json({
      success: true,
      data: transferOrder
    });

  } catch (error) {
    console.error("Error fetching transfer order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch transfer order",
      error: error.message
    });
  }
};

// Update a transfer order
export const updateTransferOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const updatedTransferOrder = await TransferOrder.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedTransferOrder) {
      return res.status(404).json({
        success: false,
        message: "Transfer order not found"
      });
    }

    res.json({
      success: true,
      message: "Transfer order updated successfully",
      data: updatedTransferOrder
    });

  } catch (error) {
    console.error("Error updating transfer order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update transfer order",
      error: error.message
    });
  }
};

// Delete a transfer order
export const deleteTransferOrder = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedTransferOrder = await TransferOrder.findByIdAndDelete(id);

    if (!deletedTransferOrder) {
      return res.status(404).json({
        success: false,
        message: "Transfer order not found"
      });
    }

    res.json({
      success: true,
      message: "Transfer order deleted successfully"
    });

  } catch (error) {
    console.error("Error deleting transfer order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete transfer order",
      error: error.message
    });
  }
};

// Receive/complete a transfer order
export const receiveTransferOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { receivedItems, receivedBy, receivedDate } = req.body;

    const transferOrder = await TransferOrder.findById(id);

    if (!transferOrder) {
      return res.status(404).json({
        success: false,
        message: "Transfer order not found"
      });
    }

    // Update transfer order status and received information
    const updatedTransferOrder = await TransferOrder.findByIdAndUpdate(
      id,
      {
        status: 'transferred',
        receivedItems: receivedItems || transferOrder.items,
        receivedBy: receivedBy,
        receivedDate: receivedDate || new Date()
      },
      { new: true, runValidators: true }
    );

    res.json({
      success: true,
      message: "Transfer order received successfully",
      data: updatedTransferOrder
    });

  } catch (error) {
    console.error("Error receiving transfer order:", error);
    res.status(500).json({
      success: false,
      message: "Failed to receive transfer order",
      error: error.message
    });
  }
};

// Get item stock for transfer order creation
export const getItemStock = async (req, res) => {
  console.log('🚀 getItemStock API called');
  console.log('📋 Request query params:', req.query);
  console.log('📋 Request headers:', req.headers);
  
  try {
    const { 
      itemId, 
      itemGroupId, 
      itemName, 
      itemSku, 
      warehouse, 
      excludeOrderId 
    } = req.query;

    console.log('📦 getItemStock called with params:', {
      itemId,
      itemGroupId,
      itemName,
      itemSku,
      warehouse,
      excludeOrderId
    });

    if (!itemId && !itemGroupId) {
      console.log('❌ Missing required parameters');
      return res.status(400).json({
        success: false,
        message: "Item ID or Item Group ID is required"
      });
    }

    if (!warehouse) {
      console.log('❌ Missing warehouse parameter');
      return res.status(400).json({
        success: false,
        message: "Warehouse is required"
      });
    }

    let item = null;
    let isFromGroup = false;

    // Handle grouped items
    if (itemGroupId && itemName) {
      console.log('🔍 Looking for grouped item...');
      try {
        const itemGroup = await ItemGroup.findById(itemGroupId);
        console.log('📦 ItemGroup query result:', itemGroup ? 'found' : 'not found');
        if (itemGroup && itemGroup.items && Array.isArray(itemGroup.items)) {
          // Find the specific item within the group
          item = itemGroup.items.find(groupItem => {
            const nameMatch = (groupItem.itemName || groupItem.name) === itemName;
            const skuMatch = !itemSku || (groupItem.sku === itemSku);
            return nameMatch && skuMatch;
          });
          isFromGroup = true;
          console.log('✅ Found grouped item:', item ? item.itemName || item.name : 'not found');
        }
      } catch (groupError) {
        console.error('❌ Error finding item group:', groupError);
      }
    }
    
    // Handle standalone items
    if (!item && itemId) {
      console.log('🔍 Looking for standalone item...');
      try {
        item = await ShoeItem.findById(itemId);
        console.log('📦 ShoeItem query result:', item ? 'found' : 'not found');
        console.log('✅ Found standalone item:', item ? item.itemName || item.name : 'not found');
      } catch (itemError) {
        console.error('❌ Error finding standalone item:', itemError);
      }
    }

    if (!item) {
      console.log('❌ Item not found after all searches');
      return res.status(404).json({
        success: false,
        message: "Item not found"
      });
    }

    // Normalize warehouse name for matching
    const normalizeWarehouse = (warehouseName) => {
      if (!warehouseName) return '';
      return warehouseName.toString().toLowerCase().trim();
    };

    const targetWarehouse = normalizeWarehouse(warehouse);
    console.log('🏢 Target warehouse:', warehouse, '→', targetWarehouse);

    // Get warehouse stock
    let currentQuantity = 0;
    let stockOnHand = 0;
    
    console.log('🔍 Item warehouse stocks check:');
    console.log('   Item has warehouseStocks:', !!item.warehouseStocks);
    console.log('   warehouseStocks is array:', Array.isArray(item.warehouseStocks));
    console.log('   warehouseStocks length:', item.warehouseStocks?.length || 0);
    
    if (item.warehouseStocks && Array.isArray(item.warehouseStocks)) {
      console.log('📊 Available warehouse stocks:', item.warehouseStocks.map(ws => ({
        warehouse: ws.warehouse,
        stock: ws.stock,
        stockOnHand: ws.stockOnHand,
        availableForSale: ws.availableForSale,
        quantity: ws.quantity,
        currentStock: ws.currentStock,
        availableStock: ws.availableStock
      })));

      // Find matching warehouse stock
      const warehouseStock = item.warehouseStocks.find(ws => {
        if (!ws.warehouse) {
          console.log('   ❌ Warehouse stock has no warehouse name:', ws);
          return false;
        }
        
        const stockWarehouse = normalizeWarehouse(ws.warehouse);
        console.log(`   🔍 Comparing "${stockWarehouse}" with "${targetWarehouse}"`);
        
        // Direct match
        if (stockWarehouse === targetWarehouse) {
          console.log('✅ Direct warehouse match:', ws.warehouse);
          return true;
        }
        
        // Contains match (both ways)
        if (stockWarehouse.includes(targetWarehouse) || targetWarehouse.includes(stockWarehouse)) {
          console.log('✅ Contains warehouse match:', ws.warehouse);
          return true;
        }
        
        // Remove common prefixes/suffixes and try again
        const cleanStock = stockWarehouse.replace(/^[a-z]{1,2}[.\-]\s*/i, '').replace(/\s*(branch|warehouse|store)\s*$/i, '').trim();
        const cleanTarget = targetWarehouse.replace(/^[a-z]{1,2}[.\-]\s*/i, '').replace(/\s*(branch|warehouse|store)\s*$/i, '').trim();
        
        console.log(`   🧹 Clean comparison: "${cleanStock}" vs "${cleanTarget}"`);
        
        if (cleanStock && cleanTarget && (cleanStock === cleanTarget || cleanStock.includes(cleanTarget) || cleanTarget.includes(cleanStock))) {
          console.log('✅ Clean warehouse match:', ws.warehouse, '(', cleanStock, '→', cleanTarget, ')');
          return true;
        }
        
        console.log('   ❌ No match for:', ws.warehouse);
        return false;
      });

      if (warehouseStock) {
        // Try different stock fields - prioritize stockOnHand since that's what the dropdown uses
        currentQuantity = parseFloat(warehouseStock.stockOnHand) || 
                         parseFloat(warehouseStock.availableForSale) ||
                         parseFloat(warehouseStock.stock) || 
                         parseFloat(warehouseStock.currentStock) ||
                         parseFloat(warehouseStock.quantity) ||
                         parseFloat(warehouseStock.availableStock) || 0;
        stockOnHand = currentQuantity;
        console.log('📊 Found warehouse stock:', warehouseStock.warehouse, '→', currentQuantity);
        console.log('   Stock fields:', {
          stock: warehouseStock.stock,
          stockOnHand: warehouseStock.stockOnHand,
          availableForSale: warehouseStock.availableForSale,
          currentStock: warehouseStock.currentStock,
          quantity: warehouseStock.quantity,
          availableStock: warehouseStock.availableStock,
          allFields: Object.keys(warehouseStock)
        });
      } else {
        console.log('⚠️ No matching warehouse stock found');
        console.log('   Available warehouses:', item.warehouseStocks.map(ws => ws.warehouse));
        console.log('   Looking for:', warehouse, '→', targetWarehouse);
      }
    } else {
      console.log('⚠️ No warehouse stocks available for item');
      console.log('   Item structure:', {
        _id: item._id,
        itemName: item.itemName || item.name,
        hasWarehouseStocks: !!item.warehouseStocks,
        warehouseStocksType: typeof item.warehouseStocks
      });
    }

    // Calculate in-transit and draft quantities
    let inTransit = 0;
    let draft = 0;

    try {
      // Find transfer orders that affect this item's stock in this warehouse
      // Use MongoDB syntax since TransferOrder is a MongoDB model
      const query = {
        $or: [
          { sourceWarehouse: { $regex: warehouse, $options: 'i' } },
          { destinationWarehouse: { $regex: warehouse, $options: 'i' } }
        ]
      };

      // Only exclude the order if it's specifically requested (when editing the same order)
      if (excludeOrderId) {
        query._id = { $ne: excludeOrderId };
        console.log(`🚫 Excluding order ID: ${excludeOrderId} from stock calculation`);
      }

      const transferOrders = await TransferOrder.find(query);
      console.log(`📦 Found ${transferOrders.length} transfer orders affecting this warehouse`);

      transferOrders.forEach(order => {
        console.log(`🔍 Checking order ${order._id} - Status: ${order.status}, Source: ${order.sourceWarehouse}, Dest: ${order.destinationWarehouse}`);
        
        if (!order.items || !Array.isArray(order.items)) {
          console.log('   ❌ Order has no items array');
          return;
        }

        order.items.forEach(orderItem => {
          console.log(`   📦 Checking item: ${orderItem.itemName} (ID: ${orderItem.itemId})`);
          
          // Check if this order item matches our target item
          let itemMatches = false;
          
          if (isFromGroup) {
            // For grouped items, match by name (SKU is optional for matching)
            // Since we're already filtering by itemGroupId, name match should be sufficient
            const nameMatch = orderItem.itemName === itemName;
            itemMatches = nameMatch;
            console.log(`   🔍 Group item match: ${itemMatches} (name: ${nameMatch})`);
            console.log(`   📝 Comparing: "${orderItem.itemName}" === "${itemName}"`);
          } else {
            // For standalone items, match by ID or name
            const nameMatch = orderItem.itemName === (item.itemName || item.name);
            const idMatch = orderItem.itemId && orderItem.itemId.toString() === itemId.toString();
            itemMatches = nameMatch || idMatch;
            console.log(`   🔍 Standalone item match: ${itemMatches} (name: ${nameMatch}, id: ${idMatch})`);
            console.log(`   📝 Comparing: "${orderItem.itemName}" === "${item.itemName || item.name}" OR "${orderItem.itemId}" === "${itemId}"`);
          }

          if (itemMatches) {
            const quantity = parseFloat(orderItem.quantity) || 0;
            console.log(`   ✅ Item matches! Quantity: ${quantity}`);
            
            // Check if this warehouse is the source (items being transferred OUT)
            const sourceMatch = normalizeWarehouse(order.sourceWarehouse) === targetWarehouse ||
                               normalizeWarehouse(order.sourceWarehouse).includes(targetWarehouse) ||
                               targetWarehouse.includes(normalizeWarehouse(order.sourceWarehouse));
            
            console.log(`   🏢 Source match check: ${sourceMatch} (${order.sourceWarehouse} vs ${warehouse})`);
            
            if (sourceMatch) {
              if (order.status === 'draft') {
                draft += quantity;
                console.log(`   📝 Added to draft: ${quantity} (total draft: ${draft})`);
              } else if (order.status === 'in_transit') {
                inTransit += quantity;
                console.log(`   🚚 Added to in-transit: ${quantity} (total in-transit: ${inTransit})`);
              }
            }
          } else {
            console.log(`   ❌ Item doesn't match`);
          }
        });
      });

      console.log('📊 Final transfer order quantities:', { inTransit, draft });
    } catch (transferError) {
      console.error('⚠️ Error calculating transfer quantities:', transferError);
      // Continue with 0 values
    }

    // Calculate available stock (current stock minus reserved quantities)
    const availableStock = Math.max(0, currentQuantity - draft - inTransit);

    const stockData = {
      success: true,
      itemId: item._id,
      itemName: item.itemName || item.name,
      sku: item.sku,
      warehouse,
      currentQuantity,
      stockOnHand,
      inTransit,
      draft,
      availableStock,
      costPrice: item.costPrice || 0
    };

    console.log('✅ Returning stock data:', stockData);
    res.json(stockData);

  } catch (error) {
    console.error("❌ Error fetching item stock:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch item stock",
      error: error.message
    });
  }
};