# Quick Fix: PostgreSQL Tables Missing

## Error You're Seeing
```
SequelizeDatabaseError: relation "stores" does not exist
```

## Quick Fix (3 Steps)

### 1. Go to backend folder
```bash
cd backend
```

### 2. Run the initialization script
```bash
npm run init-db
```

OR

```bash
node init-postgresql-tables.js
```

### 3. Restart your server
```bash
npm start
```

## Done! ✅

Your PostgreSQL tables are now created and the error should be gone.

---

## What This Does

Creates these tables in PostgreSQL:
- ✅ stores
- ✅ sales_persons  
- ✅ vendors
- ✅ vendor_credits
- ✅ vendor_history
- ✅ inventory_adjustments
- ✅ transfer_orders
- ✅ store_orders
- ✅ sales_invoices
- ✅ transactions

## Why This Happened

Your code uses PostgreSQL (Sequelize) for some features, but the database tables weren't created yet. This is a one-time setup that needs to happen when you first deploy or when you add new PostgreSQL models.

## Safe to Run?

Yes! The script uses `{ alter: true }` which:
- ✅ Creates missing tables
- ✅ Adds missing columns
- ❌ Does NOT delete data
- ❌ Does NOT drop tables

## Need Help?

See `FIX_POSTGRESQL_TABLES_ERROR.md` for detailed instructions.
