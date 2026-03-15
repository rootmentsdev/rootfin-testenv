// Centralized stock calculation utility
// This ensures all pages show available stock (accounting for draft orders) consistently

import baseUrl from "../api/api";

const API_URL = baseUrl?.baseUrl?.replace(/\/$/, "") || "http://localhost:7000";

/**
 * Get available stock for an item in a specific warehouse
 * This accounts for draft transfer orders and sales invoices
 * @param {Object} item - The item object
 * @param {string} warehouse - The warehouse name
 * @param {Object} options - Additional options
 * @returns {Promise<number>} Available stock quantity
 */
export const getAvailableStock = async (item, warehouse, options = {}) => {
  if (!item || !warehouse) {
    console.warn('getAvailableStock: Missing item or warehouse');
    return 0;
  }

  try {
    const params = new URLSearchParams();
    
    // Handle grouped items vs standalone items
    if (item.isFromGroup || item.itemGroupId) {
      params.append('itemGroupId', item.itemGroupId || item._id);
      params.append('itemName', item.itemName);
      if (item.sku) params.append('itemSku', item.sku);
    } else {
      params.append('itemId', item._id);
    }
    
    params.append('warehouse', warehouse);
    
    // Exclude current order if editing
    if (options.excludeOrderId) {
      params.append('excludeOrderId', options.excludeOrderId);
    }

    const response = await fetch(`${API_URL}/api/inventory/stock/item?${params}`);
    
    if (response.ok) {
      const stockData = await response.json();
      console.log(`✅ Available stock for ${item.itemName} in ${warehouse}:`, stockData.availableStock);
      return stockData.availableStock || 0;
    } else {
      console.error(`❌ Stock API failed for ${item.itemName}:`, response.status);
    }
  } catch (error) {
    console.error(`❌ Error fetching available stock for ${item.itemName}:`, error);
  }

  // Fallback to raw stock from warehouse stocks
  return getRawStock(item, warehouse);
};

/**
 * Get raw stock (without accounting for draft orders) from warehouse stocks
 * @param {Object} item - The item object
 * @param {string} warehouse - The warehouse name
 * @returns {number} Raw stock quantity
 */
export const getRawStock = (item, warehouse) => {
  if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks) || !warehouse) {
    return 0;
  }

  const normalizeWarehouse = (name) => {
    if (!name) return '';
    return name.toString().toLowerCase().trim();
  };

  const targetWarehouse = normalizeWarehouse(warehouse);
  
  const warehouseStock = item.warehouseStocks.find(ws => {
    if (!ws.warehouse) return false;
    
    const stockWarehouse = normalizeWarehouse(ws.warehouse);
    
    // Direct match
    if (stockWarehouse === targetWarehouse) return true;
    
    // Contains match
    if (stockWarehouse.includes(targetWarehouse) || targetWarehouse.includes(stockWarehouse)) return true;
    
    // Clean match (remove prefixes/suffixes)
    const cleanStock = stockWarehouse.replace(/^[a-z]{1,2}[.\-]\s*/i, '').replace(/\s*(branch|warehouse|store)\s*$/i, '').trim();
    const cleanTarget = targetWarehouse.replace(/^[a-z]{1,2}[.\-]\s*/i, '').replace(/\s*(branch|warehouse|store)\s*$/i, '').trim();
    
    if (cleanStock && cleanTarget && (cleanStock === cleanTarget || cleanStock.includes(cleanTarget) || cleanTarget.includes(cleanStock))) {
      return true;
    }
    
    return false;
  });

  // Use availableForSale first (already accounts for some reservations), then stockOnHand
  return parseFloat(warehouseStock?.availableForSale) || parseFloat(warehouseStock?.stockOnHand) || 0;
};

/**
 * Get total available stock across all warehouses
 * @param {Object} item - The item object
 * @returns {number} Total available stock
 */
export const getTotalAvailableStock = (item) => {
  if (!item.warehouseStocks || !Array.isArray(item.warehouseStocks)) {
    return 0;
  }

  return item.warehouseStocks.reduce((sum, ws) => {
    // Use availableForSale first, then stockOnHand
    const stock = parseFloat(ws.availableForSale) || parseFloat(ws.stockOnHand) || 0;
    return sum + Math.max(0, stock);
  }, 0);
};

/**
 * Batch fetch available stock for multiple items
 * @param {Array} items - Array of items
 * @param {string} warehouse - The warehouse name
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} Map of item ID to available stock
 */
export const batchGetAvailableStock = async (items, warehouse, options = {}) => {
  const stockMap = {};
  
  // Process items in batches to avoid overwhelming the API
  const batchSize = 10;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    
    const promises = batch.map(async (item) => {
      const stock = await getAvailableStock(item, warehouse, options);
      return { itemId: item._id, stock };
    });
    
    const results = await Promise.all(promises);
    results.forEach(({ itemId, stock }) => {
      stockMap[itemId] = stock;
    });
  }
  
  return stockMap;
};

/**
 * Format stock display text
 * @param {number} stock - Stock quantity
 * @param {boolean} showPcs - Whether to show "pcs" suffix
 * @returns {string} Formatted stock text
 */
export const formatStock = (stock, showPcs = true) => {
  const quantity = Number(stock) || 0;
  const formatted = quantity.toFixed(2);
  return showPcs ? `${formatted} pcs` : formatted;
};

/**
 * Get raw warehouse stock (without accounting for draft orders) - returns detailed object
 * @param {Object} item - The item object
 * @param {string} warehouse - The warehouse name
 * @returns {Object} Raw stock data object
 */
export const getRawWarehouseStock = (item, warehouse) => {
  if (!item?.warehouseStocks || !Array.isArray(item.warehouseStocks) || !warehouse) {
    return {
      currentQuantity: 0,
      stockOnHand: 0,
      availableStock: 0,
      inTransit: 0,
      draft: 0,
      reserved: 0,
      success: false
    };
  }

  const normalizeWarehouse = (warehouseName) => {
    if (!warehouseName) return '';
    return warehouseName.toString().toLowerCase().trim();
  };

  const targetWarehouse = normalizeWarehouse(warehouse);
  
  const warehouseStock = item.warehouseStocks.find(ws => {
    if (!ws.warehouse) return false;
    
    const stockWarehouse = normalizeWarehouse(ws.warehouse);
    
    // Direct match
    if (stockWarehouse === targetWarehouse) return true;
    
    // Contains match
    if (stockWarehouse.includes(targetWarehouse) || targetWarehouse.includes(stockWarehouse)) return true;
    
    // Clean match (remove prefixes/suffixes)
    const cleanStock = stockWarehouse.replace(/^[a-z]{1,2}[.\-]\s*/i, '').replace(/\s*(branch|warehouse|store)\s*$/i, '').trim();
    const cleanTarget = targetWarehouse.replace(/^[a-z]{1,2}[.\-]\s*/i, '').replace(/\s*(branch|warehouse|store)\s*$/i, '').trim();
    
    if (cleanStock && cleanTarget && (cleanStock === cleanTarget || cleanStock.includes(cleanTarget) || cleanTarget.includes(cleanStock))) {
      return true;
    }
    
    return false;
  });

  if (warehouseStock) {
    const stockOnHand = parseFloat(warehouseStock.stockOnHand) || 
                       parseFloat(warehouseStock.availableForSale) ||
                       parseFloat(warehouseStock.stock) || 
                       parseFloat(warehouseStock.currentStock) ||
                       parseFloat(warehouseStock.quantity) || 0;
    
    return {
      currentQuantity: stockOnHand,
      stockOnHand: stockOnHand,
      availableStock: stockOnHand, // Same as stockOnHand for raw data
      inTransit: 0,
      draft: 0,
      reserved: 0,
      success: true
    };
  }

  return {
    currentQuantity: 0,
    stockOnHand: 0,
    availableStock: 0,
    inTransit: 0,
    draft: 0,
    reserved: 0,
    success: false
  };
};

export default {
  getAvailableStock,
  getRawStock,
  getRawWarehouseStock,
  getTotalAvailableStock,
  batchGetAvailableStock,
  formatStock
};