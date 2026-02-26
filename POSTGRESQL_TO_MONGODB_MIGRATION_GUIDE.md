# PostgreSQL to MongoDB Data Migration Guide

## Overview
This guide will help you migrate all your existing PostgreSQL data to MongoDB.

## Prerequisites
- Your PostgreSQL database is running and accessible
- You have the PostgreSQL connection credentials
- MongoDB is set up and running

## Step-by-Step Migration Process

### Step 1: Install PostgreSQL Client
```bash
cd backend
npm install
```

### Step 2: Configure PostgreSQL Connection
Edit the file `backend/.env.migration` with your PostgreSQL credentials:

```env
PG_USER=your_actual_postgres_username
PG_HOST=your_postgres_host (usually localhost)
PG_DATABASE=your_actual_database_name
PG_PASSWORD=your_actual_postgres_password
PG_PORT=5432
```

### Step 3: Run the Migration
```bash
cd backend
npm run migrate
```

## What the Migration Does

### 🔄 **Data Transfer Process:**
1. **Connects** to both PostgreSQL and MongoDB
2. **Scans** all PostgreSQL tables
3. **Extracts** data from each table
4. **Transforms** the data to MongoDB format:
   - Converts PostgreSQL IDs to MongoDB format
   - Handles date/time fields properly
   - Preserves JSON data structures
   - Maintains data relationships
5. **Inserts** data into corresponding MongoDB collections
6. **Reports** migration statistics

### 📊 **Tables/Collections Migrated:**
- addresses → Address collection
- bills → Bill collection
- brands → Brand collection
- closings → Closing collection
- counters → Counter collection
- inventory_adjustments → InventoryAdjustment collection
- item_groups → ItemGroup collection
- item_histories → ItemHistory collection
- manufacturers → Manufacturer collection
- purchase_orders → PurchaseOrder collection
- purchase_receives → PurchaseReceive collection
- reorder_alerts → ReorderAlert collection
- sales_invoices → SalesInvoice collection
- sales_persons → SalesPerson collection
- shoe_items → ShoeItem collection
- stores → Store collection
- store_orders → StoreOrder collection
- transactions → Transaction collection
- transaction_histories → TransactionHistory collection
- transfer_orders → TransferOrder collection
- users → UserModel collection
- vendors → Vendor collection
- vendor_credits → VendorCredit collection
- vendor_histories → VendorHistory collection

### ⚠️ **Important Notes:**
- **Backup First**: Always backup your PostgreSQL data before migration
- **Test Environment**: Run migration in test environment first
- **Data Validation**: Verify data integrity after migration
- **Downtime**: Plan for application downtime during migration

## After Migration

### Step 4: Verify Data
1. Check MongoDB collections have data:
   ```javascript
   // In MongoDB shell or compass
   db.shoeitems.countDocuments()
   db.salesinvoices.countDocuments()
   db.vendors.countDocuments()
   ```

2. Test your application functionality
3. Verify all features work with MongoDB

### Step 5: Remove PostgreSQL Dependency (Optional)
After successful migration and testing:
```bash
cd backend
npm uninstall pg
```

## Troubleshooting

### Common Issues:

1. **Connection Error**: Check PostgreSQL credentials in `.env.migration`
2. **Permission Error**: Ensure PostgreSQL user has read access
3. **Memory Error**: Migration processes large datasets in batches
4. **Data Type Error**: Some PostgreSQL data types may need manual conversion

### Migration Logs:
The migration script provides detailed logs showing:
- Connection status
- Tables being processed
- Record counts
- Success/failure status
- Error details

## Rollback Plan
If you need to rollback:
1. Keep your PostgreSQL database intact until migration is verified
2. You can re-run the migration script multiple times
3. The script clears MongoDB collections before inserting new data

## Support
If you encounter issues:
1. Check the migration logs for specific error messages
2. Verify PostgreSQL connection details
3. Ensure MongoDB is accessible
4. Check data types and constraints

---

**🎉 Once migration is complete, your application will run entirely on MongoDB with all your existing data preserved!**