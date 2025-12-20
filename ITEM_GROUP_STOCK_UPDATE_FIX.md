# Item Group Stock Update Bug Fix

## Problem
When editing the stock of an item in an item group, the item would disappear from the group view after saving. The item still existed in the database and showed in "All Items" list, but was filtered out from the item group detail page.

## Root Cause

### File: `frontend/src/pages/ItemStockManagement.jsx`

When updating stock for an item in a group, the code was not preserving the individual item's `isActive` status. The item was being updated with stock data, but the `isActive` field was not being explicitly set, which could cause it to become `undefined` or inherit the wrong value.

### File: `frontend/src/pages/ShoeSalesItemGroupDetail.jsx` (Line 237)

The item group detail page filters out inactive items:

```javascript
const items = allItems.filter(item => item.isActive !== false);
```

So if an item's `isActive` becomes `undefined` or `false` during stock update, it gets filtered out.

## The Fix

### Modified: `frontend/src/pages/ItemStockManagement.jsx`

**Before** (Line 218-228):
```javascript
const updatedItems = itemGroup.items.map(i => {
  const currentItemId = (i._id || i.id || "").toString();
  const targetItemId = itemId.toString();
  if (currentItemId === targetItemId) {
    return {
      ...i,
      _id: i._id || i.id, // Preserve _id
      id: i.id || i._id, // Preserve id
      warehouseStocks: stockData
    };
  }
  return i;
});
```

**After**:
```javascript
const updatedItems = itemGroup.items.map(i => {
  const currentItemId = (i._id || i.id || "").toString();
  const targetItemId = itemId.toString();
  if (currentItemId === targetItemId) {
    return {
      ...i,
      _id: i._id || i.id, // Preserve _id
      id: i.id || i._id, // Preserve id
      warehouseStocks: stockData,
      isActive: i.isActive !== undefined ? i.isActive : true // ✅ Preserve item's isActive status
    };
  }
  return i;
});
```

## How It Works Now

1. **User edits stock** for an item in a group (e.g., size 10 item)
2. **Stock update preserves** the item's `isActive` status
3. **Item remains visible** in the item group after saving
4. **Item appears** in both "All Items" and the item group view

## Testing

### Test Case 1: Edit Stock for Active Item
1. Navigate to item group "Abhiram Test"
2. Click "Edit Variant" for size 10 item
3. Click "Opening Stock" to edit stock
4. Change stock values
5. Click "Save"
6. ✅ Item still appears in the group
7. ✅ Stock values updated correctly

### Test Case 2: Edit Stock Multiple Times
1. Edit stock for an item
2. Save
3. Edit stock again
4. Save again
5. ✅ Item remains visible after multiple edits

### Test Case 3: Inactive Items Stay Inactive
1. Mark an item as inactive
2. Edit stock for a different active item
3. ✅ Inactive item stays inactive
4. ✅ Active item stays active

## Related Code

### Item Filtering Logic
The item group detail page filters items:

```javascript
// frontend/src/pages/ShoeSalesItemGroupDetail.jsx (Line 237)
const allItems = itemGroup.items && Array.isArray(itemGroup.items) ? itemGroup.items : [];
const items = allItems.filter(item => item.isActive !== false);
```

This means:
- Items with `isActive: true` → shown
- Items with `isActive: undefined` → shown (not false)
- Items with `isActive: false` → hidden

### Stock Update Payload
The complete update payload now preserves all item properties:

```javascript
const updatePayload = {
  name: itemGroup.name,
  // ... other group properties ...
  items: updatedItems, // ✅ Each item has isActive preserved
  isActive: itemGroup.isActive !== undefined ? itemGroup.isActive : true,
  itemId: itemId,
  changedBy: changedBy,
};
```

## Files Modified

1. `frontend/src/pages/ItemStockManagement.jsx` - Added `isActive` preservation

## Prevention

To prevent similar issues in the future:

1. **Always preserve `isActive`** when updating items
2. **Explicitly set `isActive`** rather than relying on spread operator
3. **Test item visibility** after any update operation
4. **Check filtering logic** when items disappear unexpectedly

## User Experience

**Before Fix**:
- User edits stock for size 10 item
- Clicks save
- Item disappears from group view
- User confused - item seems deleted
- Item still exists in "All Items" but not in group

**After Fix**:
- User edits stock for size 10 item
- Clicks save
- Item remains visible in group view
- Stock values updated correctly
- User can continue editing without issues

## Summary

The bug was caused by not explicitly preserving the `isActive` status when updating item stock. The fix ensures that each item's `isActive` status is maintained during stock updates, preventing items from being accidentally filtered out of the group view.
