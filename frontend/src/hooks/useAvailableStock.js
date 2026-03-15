// Hook for getting available stock (accounting for draft orders)
import { useState, useEffect, useCallback } from 'react';
import { getAvailableStock, getRawStock } from '../utils/stockCalculation';

export const useAvailableStock = (item, warehouse, options = {}) => {
  const [stock, setStock] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchStock = useCallback(async () => {
    if (!item || !warehouse) {
      setStock(0);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const availableStock = await getAvailableStock(item, warehouse, options);
      setStock(availableStock);
    } catch (err) {
      console.error(`Error fetching available stock for ${item.itemName}:`, err);
      setError(err);
      // Fallback to raw stock
      const fallbackStock = getRawStock(item, warehouse);
      setStock(fallbackStock);
    } finally {
      setLoading(false);
    }
  }, [item?._id, warehouse, options.excludeOrderId]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  return {
    stock,
    loading,
    error,
    refetch: fetchStock,
    isAvailableStock: !error && stock !== null
  };
};

// Hook for batch fetching stock for multiple items
export const useBatchAvailableStock = (items, warehouse, options = {}) => {
  const [stockMap, setStockMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBatchStock = useCallback(async () => {
    if (!items || items.length === 0 || !warehouse) {
      setStockMap({});
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const newStockMap = {};
      
      // Process in batches to avoid overwhelming the API
      const batchSize = 5;
      for (let i = 0; i < items.length; i += batchSize) {
        const batch = items.slice(i, i + batchSize);
        
        const promises = batch.map(async (item) => {
          try {
            const stock = await getAvailableStock(item, warehouse, options);
            return { itemId: item._id, stock };
          } catch (err) {
            console.error(`Error fetching stock for ${item.itemName}:`, err);
            return { itemId: item._id, stock: getRawStock(item, warehouse) };
          }
        });
        
        const results = await Promise.all(promises);
        results.forEach(({ itemId, stock }) => {
          newStockMap[itemId] = stock;
        });
      }
      
      setStockMap(newStockMap);
    } catch (err) {
      console.error('Error in batch stock fetch:', err);
      setError(err);
    } finally {
      setLoading(false);
    }
  }, [items?.length, warehouse, options.excludeOrderId]);

  useEffect(() => {
    fetchBatchStock();
  }, [fetchBatchStock]);

  return {
    stockMap,
    loading,
    error,
    refetch: fetchBatchStock,
    getStock: (itemId) => stockMap[itemId] || 0
  };
};

export default useAvailableStock;