# Remove Physical Stock - Use Only Opening Stock

## Goal
Remove all physical stock logic from the system and use only opening stock (accounting stock) for all operations.

## Controllers to Update

### 1. ✅ BillController.js - DONE
- Already updated to use only opening stock

### 2. ✅ PurchaseReceiveController.js - DONE  
- Already updated to use only opening stock

### 3. TransferOrderController.js - TODO
- Remove physical stock updates
- Use only opening stock for transfers

### 4. VendorCreditController.js - TODO
- Remove physical stock updates
- Use only opening stock for vendor returns

### 5. SalesInvoiceController.js - TODO
- Remove physical stock updates
- Use only opening stock for sales

### 6. InventoryAdjustmentController.js - TODO
- Remove physical stock updates
- Use only opening stock for adjustments

### 7. StoreOrderController.js - TODO
- Remove physical stock updates
- Use only opening stock for store orders

### 8. ShoeItemController.js - TODO
- Remove physical stock initialization
- Use only opening stock when creating items

## Changes Required

For each controller, replace:
```javascript
// OLD - Updates both
warehouseStock.openingStock = value;
warehouseStock.physicalStockOnHand = value;
warehouseStock.physicalAvailableForSale = value;
```

With:
```javascript
// NEW - Updates only opening stock
warehouseStock.openingStock = value;
// Physical stock fields remain at 0
```

## Commit Message
```
Remove physical stock logic system-wide - use only opening stock for all inventory operations
```
