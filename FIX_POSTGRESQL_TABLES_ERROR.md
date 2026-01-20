# Fix: PostgreSQL Tables Missing Error

## The Problem

You're getting this error:
```
SequelizeDatabaseError: relation "stores" does not exist
```

This means your PostgreSQL database exists, but the **tables haven't been created yet**. Your code is trying to query tables that don't exist.

## The Solution

You need to run a one-time initialization script to create all the PostgreSQL tables.

### Step 1: Navigate to Backend Directory

```bash
cd backend
```

### Step 2: Run the Initialization Script

```bash
node init-postgresql-tables.js
```

This script will:
- ✅ Connect to your production PostgreSQL database
- ✅ Create all missing tables (`stores`, `sales_persons`, `vendors`, etc.)
- ✅ Set up the correct schema based on your Sequelize models
- ✅ Use `alter: true` mode (safe - won't drop existing data)
- ✅ Verify all required tables are created

### Step 3: Restart Your Backend Server

After the tables are created, restart your backend:

```bash
# If using npm
npm start

# If using node directly
node server.js
```

## What Tables Will Be Created?

The script will create these PostgreSQL tables:

1. **stores** - Store/branch information
2. **sales_persons** - Sales person records linked to stores
3. **vendors** - Vendor management
4. **vendor_credits** - Vendor credit notes
5. **vendor_history** - Vendor transaction history
6. **inventory_adjustments** - Stock adjustments
7. **transfer_orders** - Stock transfers between warehouses
8. **store_orders** - Store requests for stock
9. **sales_invoices** - Sales invoice records (dual database)
10. **transactions** - Financial transaction records (dual database)

## Alternative: Use Existing Sync Script

You can also use the existing sync script:

```bash
node sync-production-db.js
```

This does the same thing but with more verbose logging.

## Verification

After running the script, you should see output like:

```
✅ Verifying required tables:
   ✅ stores
   ✅ sales_persons
   ✅ vendors
   ✅ vendor_credits
   ✅ vendor_history
   ✅ inventory_adjustments
   ✅ transfer_orders
   ✅ store_orders
   ✅ sales_invoices
   ✅ transactions
```

## Important Notes

1. **Safe Operation**: The script uses `{ alter: true }` which:
   - Creates missing tables
   - Adds missing columns to existing tables
   - Does NOT drop existing data
   - Does NOT delete columns (safe for production)

2. **One-Time Setup**: You only need to run this once per database

3. **Future Updates**: If you add new models or columns, run the script again to update the schema

## Troubleshooting

### If the script fails with connection error:

Check your `.env` file has the correct `DATABASE_URL`:
```
DATABASE_URL=postgresql://username:password@host/database
```

### If tables still don't exist after running:

1. Check the script output for errors
2. Verify your PostgreSQL connection is working
3. Make sure you have write permissions on the database

### If you see "table already exists" warnings:

This is normal and safe - it means some tables were already created.

## After Tables Are Created

Once the tables are created, your application should work normally. The errors about "relation does not exist" will be gone.

You can verify by:
1. Restarting your backend server
2. Trying to access the Stores or Sales Persons features
3. Checking the logs - no more "relation does not exist" errors
