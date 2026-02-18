# Invoice Item Name Corruption Fix

## Problem
Some invoices have corrupted item names showing as SKU codes (like "6I6I6I0I0") instead of proper item names (like "Shoe Formal-1003 - BLACK/9").

### Example:
- **Corrupted Invoice (INV-009375)**: Items show as "6I6I6I0I0", "0I0I0I0I0"
- **Correct Invoice (INV-009376)**: Items show as "Shoe Formal-1003 - BLACK/9"

## Root Cause
During invoice creation, the item selection dropdown saved the SKU code in the `item` field instead of the actual item name. This happened because:

1. The item dropdown value was set to SKU instead of item name
2. The form submission used the dropdown value directly
3. No validation checked if the item name was actually a name vs a code

## Impact
- Invoice detail view shows SKU codes instead of item names
- Printed invoices look unprofessional
- Difficult to identify what was sold
- Customer confusion

## Solution

### Option 1: Run Automated Fix Script (Recommended)

Run the provided script to automatically fix all corrupted invoices:

```bash
cd backend
node fix-corrupted-invoice-items.js
```

**What the script does:**
1. Scans all invoices in the database
2. Identifies items with corrupted names (SKU-like patterns)
3. Looks up correct item names using the SKU
4. Updates the invoice with correct item names
5. Saves the fixed invoices

**Script Output:**
```
🔍 Searching for invoices with corrupted item names...
📊 Found 150 total invoices

📄 Checking Invoice: INV-009375
  ❌ Corrupted item found: "6I6I6I0I0" (SKU: 6I6I6I0I0)
  ✅ Found correct name: "Shoe Formal-1003 - BLACK/9"
  💾 Invoice INV-009375 updated successfully

============================================================
📊 SUMMARY:
   Total invoices checked: 150
   Invoices with corruption: 5
   Invoices fixed: 5
============================================================
```

### Option 2: Manual Fix (For Single Invoice)

If you need to fix just one invoice manually:

1. **Find the invoice in MongoDB:**
   ```javascript
   db.salesinvoices.findOne({ invoiceNumber: "INV-009375" })
   ```

2. **Look up the correct item name:**
   - Use the SKU to find the item in `shoeitems` or `itemgroups`
   ```javascript
   db.shoeitems.findOne({ sku: "6I6I6I0I0" })
   ```

3. **Update the invoice:**
   ```javascript
   db.salesinvoices.updateOne(
     { invoiceNumber: "INV-009375" },
     { 
       $set: { 
         "lineItems.0.item": "Shoe Formal-1003 - BLACK/9" 
       } 
     }
   )
   ```

## Prevention

To prevent this from happening in the future, the invoice creation form needs to be updated:

### Changes Needed in `SalesInvoiceCreate.jsx`:

1. **Ensure item dropdown stores item name, not SKU:**
   ```javascript
   // When selecting item from dropdown
   const selectedItem = items.find(i => i.sku === selectedSKU);
   lineItem.item = selectedItem.itemName || selectedItem.name; // Use name, not SKU
   lineItem.sku = selectedItem.sku;
   ```

2. **Add validation before saving:**
   ```javascript
   // Before submitting invoice
   const validateLineItems = (lineItems) => {
     return lineItems.every(item => {
       // Check if item name looks like a proper name, not a SKU
       const isValidName = item.item && 
                          item.item.length > 5 && 
                          !/^[0-9A-Z]{5,}$/i.test(item.item);
       
       if (!isValidName) {
         console.error(`Invalid item name: ${item.item}`);
         return false;
       }
       return true;
     });
   };
   ```

3. **Add warning if SKU detected in item name:**
   ```javascript
   if (/^[0-9A-Z]{5,}$/i.test(lineItem.item)) {
     alert('Warning: Item name looks like a SKU code. Please select the item again.');
     return;
   }
   ```

## Testing

After running the fix script:

1. **Check the corrupted invoice:**
   - Go to Sales → Invoices
   - Find INV-009375
   - Click to view details
   - **Expected**: Item names should show properly (e.g., "Shoe Formal-1003 - BLACK/9")

2. **Verify in database:**
   ```javascript
   db.salesinvoices.findOne(
     { invoiceNumber: "INV-009375" },
     { "lineItems.item": 1, "lineItems.sku": 1 }
   )
   ```
   
   **Expected output:**
   ```json
   {
     "lineItems": [
       {
         "item": "Shoe Formal-1003 - BLACK/9",
         "sku": "6I6I6I0I0"
       }
     ]
   }
   ```

3. **Test new invoice creation:**
   - Create a new invoice
   - Add items
   - Save
   - Verify item names are correct (not SKU codes)

## Identifying Corrupted Invoices

To find all invoices with corrupted item names:

```javascript
// In MongoDB shell
db.salesinvoices.find({
  "lineItems.item": { $regex: /^[0-9A-Z]{5,}$/i }
}).forEach(invoice => {
  print(`Invoice: ${invoice.invoiceNumber}`);
  invoice.lineItems.forEach((item, idx) => {
    if (/^[0-9A-Z]{5,}$/i.test(item.item)) {
      print(`  Item ${idx + 1}: "${item.item}" (SKU: ${item.sku})`);
    }
  });
});
```

## Backup Before Running

**IMPORTANT**: Always backup your database before running the fix script:

```bash
# Backup MongoDB database
mongodump --uri="your_mongodb_uri" --out=./backup_before_fix
```

## Rollback (If Needed)

If something goes wrong, restore from backup:

```bash
mongorestore --uri="your_mongodb_uri" ./backup_before_fix
```

## Related Files
- `backend/fix-corrupted-invoice-items.js` - Automated fix script
- `frontend/src/pages/SalesInvoiceCreate.jsx` - Invoice creation form (needs validation)
- `frontend/src/pages/SalesInvoiceDetail.jsx` - Invoice display (already handles fallback)
- `backend/model/SalesInvoice.js` - Invoice schema

## Support

If you encounter issues:
1. Check the script output for errors
2. Verify MongoDB connection
3. Ensure items exist in the database with matching SKUs
4. Check if item names were manually edited in the database
