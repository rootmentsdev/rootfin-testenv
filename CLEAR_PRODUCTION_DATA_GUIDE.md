# 🗑️ Clear Production PostgreSQL Data - Step by Step Guide

## ⚠️ IMPORTANT WARNINGS
- This will **permanently delete ALL data** from your production PostgreSQL database
- **There is NO UNDO** - once deleted, data cannot be recovered
- **MongoDB data is NOT affected** - only PostgreSQL tables will be cleared
- Make sure you have a backup if you need to keep any data

---

## 📋 Step-by-Step Instructions

### Option 1: Using Render Dashboard (Easiest)

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com/
   - Login to your account

2. **Open Your PostgreSQL Database**
   - Click on your PostgreSQL database: `rootfin_testenv`

3. **Open the Shell Tab**
   - Click on "Shell" in the left sidebar
   - This opens a SQL command interface

4. **Check Current Data (Optional but Recommended)**
   - Copy and paste the contents of `backend/scripts/check-data-before-clear.sql`
   - Click "Run" or press Enter
   - This shows you how many rows are in each table

5. **Clear All Data**
   - Copy and paste the contents of `backend/scripts/clear-production-data.sql`
   - **Double-check you're in the right database!**
   - Click "Run" or press Enter
   - Wait for completion (should take a few seconds)

6. **Verify Data is Cleared**
   - The script will automatically show row counts
   - All tables should show 0 rows

---

### Option 2: Using pgAdmin (If You Prefer GUI)

1. **Connect pgAdmin to Production**
   - Open pgAdmin
   - Right-click "Servers" → "Register" → "Server"
   
   **Connection Details:**
   - Host: `dpg-ctcvvctumphs73f5vu50-a.oregon-postgres.render.com`
   - Port: `5432`
   - Database: `rootfin_testenv`
   - Username: `rootfin_testenv_user`
   - Password: (from your backend/.env DATABASE_URL)
   - SSL Mode: `Require`

2. **Open Query Tool**
   - Right-click on your database → "Query Tool"

3. **Check Current Data (Optional)**
   - Open `backend/scripts/check-data-before-clear.sql`
   - Copy and paste into Query Tool
   - Click "Execute" (F5)

4. **Clear All Data**
   - Open `backend/scripts/clear-production-data.sql`
   - Copy and paste into Query Tool
   - **Double-check you're connected to the right database!**
   - Click "Execute" (F5)

5. **Verify**
   - Check the results - all tables should show 0 rows

---

## 📊 What Gets Deleted

The following PostgreSQL tables will be cleared:
- ✅ SalesInvoices
- ✅ Transactions
- ✅ InventoryAdjustments
- ✅ TransferOrders
- ✅ StoreOrders
- ✅ VendorCredits
- ✅ VendorHistories
- ✅ Vendors
- ✅ SalesPersons
- ✅ Stores
- ✅ Users

## 🔒 What is NOT Affected

- ❌ MongoDB data (item groups, items, etc.) - **NOT touched**
- ❌ Database structure/schema - **NOT deleted**
- ❌ Your application code - **NOT affected**

---

## 🚀 After Clearing Data

1. **Your app will work normally** - just with empty PostgreSQL tables
2. **MongoDB data remains** - items, item groups, etc. are still there
3. **You can start fresh** - create new invoices, vendors, etc.
4. **Users may need to be recreated** - if you cleared the Users table

---

## 🆘 Need Help?

If you're unsure or need assistance:
1. Take a screenshot of the data check results
2. Ask before running the clear script
3. Consider creating a backup first

---

## 📝 Quick Commands Summary

**Check data:**
```sql
-- See in check-data-before-clear.sql
```

**Clear data:**
```sql
-- See in clear-production-data.sql
```

**Verify cleared:**
```sql
SELECT COUNT(*) FROM "SalesInvoices";
-- Should return 0
```
