# Warehouse Filtering Fix for In-Transit Stock

## Issue
When selecting specific stores like "G.Vadakara" in the in-transit stock page, no data was showing, but "Warehouse" or "All Stores" worked fine.

## Root Cause
The warehouse filtering logic was too simplistic and had several issues:

1. **Name Mismatch**: Frontend sends display names like "G.Vadakara" but database might have different formats
2. **Simple String Matching**: Only basic `includes()` matching wasn't robust enough
3. **Missing Store Codes**: Frontend wasn't sending store codes (708, 702, etc.) for better matching

## Solution Applied

### 1. Enhanced Frontend API Calls
**Before:**
```javascript
const warehouseParam = canChooseStore
  ? (selectedStoreLabel || selectedStore)
  : (currentUserStoreLabel || selectedStoreLabel || currentUser?.locCode || selectedStore);

const params = new URLSearchParams({
  warehouse: warehouseParam,
  userId: currentUser?.email || currentUser?.userId,
  locCode: currentUser?.locCode
});
```

**After:**
```javascript
const selectedStoreOption = storeOptions.find(s => s.value === selectedStore);
const currentUserStoreOption = storeOptions.find(s => s.value === currentUser?.locCode);

const warehouseParam = canChooseStore
  ? (selectedStoreOption?.label || selectedStore)
  : (currentUserStoreOption?.label || selectedStoreOption?.label || currentUser?.locCode || selectedStore);

const warehouseCodeParam = canChooseStore
  ? selectedStore
  : (currentUser?.locCode || selectedStore);

const params = new URLSearchParams({
  warehouse: warehouseParam,        // Display name (e.g., "G.Vadakara")
  warehouseCode: warehouseCodeParam, // Store code (e.g., "708")
  userId: currentUser?.email || currentUser?.userId,
  locCode: currentUser?.locCode
});
```

### 2. Robust Backend Warehouse Matching
**Before:**
```javascript
const warehouseLower = warehouse.toLowerCase().trim();
inTransitItems = inTransitItems.filter(item => {
  const sourceLower = (item.sourceWarehouse || '').toLowerCase().trim();
  const destLower = (item.destinationWarehouse || '').toLowerCase().trim();

  return sourceLower.includes(warehouseLower) ||
         destLower.includes(warehouseLower) ||
         warehouseLower.includes(sourceLower) ||
         warehouseLower.includes(destLower);
});
```

**After:**
```javascript
const matchesWarehouse = (orderWarehouse, filterWarehouse, filterCode) => {
  if (!orderWarehouse) return false;
  
  const orderLower = orderWarehouse.toLowerCase().trim();
  
  // Try matching against both warehouse name and code
  const filters = [filterWarehouse, filterCode].filter(Boolean);
  
  for (const filter of filters) {
    if (!filter) continue;
    
    const filterLower = filter.toLowerCase().trim();
    
    // 1. Direct match
    if (orderLower === filterLower) return true;
    
    // 2. Contains match (both ways)
    if (orderLower.includes(filterLower) || filterLower.includes(orderLower)) return true;
    
    // 3. Clean match (remove prefixes/suffixes)
    const cleanOrder = orderLower
      .replace(/^[a-z]{1,2}[.\-]\s*/i, '') // Remove G., SG-, Z-, etc.
      .replace(/\s*(branch|warehouse|store)\s*$/i, '') // Remove Branch, Warehouse, Store
      .trim();
    
    const cleanFilter = filterLower
      .replace(/^[a-z]{1,2}[.\-]\s*/i, '')
      .replace(/\s*(branch|warehouse|store)\s*$/i, '')
      .trim();
    
    if (cleanOrder && cleanFilter && (cleanOrder === cleanFilter || 
        cleanOrder.includes(cleanFilter) || cleanFilter.includes(cleanOrder))) {
      return true;
    }
    
    // 4. Special mappings for common variations
    const specialMappings = {
      'vadakara': ['vadakara', 'g.vadakara', 'g-vadakara', '708'],
      'edappally': ['edappally', 'g-edappally', 'g.edappally', 'edapally', '702'],
      'trivandrum': ['trivandrum', 'sg-trivandrum', 'trivendrum', 'tvm', '700'],
      'kottayam': ['kottayam', 'g.kottayam', 'g-kottayam', '701'],
      'warehouse': ['warehouse', 'main warehouse', 'central warehouse', '858'],
      // ... more mappings
    };
    
    // Check special mappings
    for (const [key, variations] of Object.entries(specialMappings)) {
      if (variations.some(v => cleanOrder.includes(v)) && variations.some(v => cleanFilter.includes(v))) {
        return true;
      }
    }
  }
  
  return false;
};
```

### 3. Added Debug Logging
```javascript
console.log(`📦 Available source warehouses: [${Array.from(summary.sourceWarehouses).join(', ')}]`);
console.log(`📦 Available destination warehouses: [${Array.from(summary.destinationWarehouses).join(', ')}]`);
console.log(`🔍 Filtering by warehouse: "${warehouse}" (code: "${warehouseCode}")`);
console.log(`🔍 Filtered from ${originalCount} to ${inTransitItems.length} items`);
```

## Store Code Mappings Added
- **708** → G.Vadakara, Vadakara
- **702** → G-Edappally, G.Edappally, Edappally
- **700** → SG-Trivandrum, Trivandrum, TVM
- **701** → G.Kottayam, Kottayam
- **858** → Warehouse, Main Warehouse
- **712** → G.Calicut, Calicut, Kozhikode
- **704** → G.Thrissur, Thrissur
- **705** → G.Palakkad, Palakkad
- **716** → G.Kannur, Kannur
- **717** → G.Kalpetta, Kalpetta
- **710** → G.Manjeri, Manjeri
- **711** → G.Kottakkal, Kottakkal
- **709** → G.Perinthalmanna, Perinthalmanna
- **707** → G.Edappal, Edappal
- **706** → G.Chavakkad, Chavakkad
- **703** → G.Perumbavoor, Perumbavoor

## Files Modified
1. `frontend/src/pages/InTransitStock.jsx` - Enhanced API call with warehouseCode
2. `frontend/src/pages/InventoryReport.jsx` - Enhanced API call with warehouseCode
3. `backend/controllers/InventoryReportController.js` - Robust warehouse matching logic

## Expected Result
✅ **Now Works**: Selecting "G.Vadakara" should now properly filter and show in-transit stock data for that store, matching against:
- Display name: "G.Vadakara"
- Store code: "708"
- Database variations: "Vadakara", "G-Vadakara", etc.

## Testing
1. Select "G.Vadakara" from the store dropdown
2. Click "Load In-Transit Stock"
3. Should now show data if there are any in-transit items for that store
4. Check browser console for debug logs showing the filtering process

The filtering now handles multiple name formats and should work for all store selections! 🎉