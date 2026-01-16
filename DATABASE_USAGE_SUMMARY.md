# 📊 Database Usage Summary - MongoDB vs PostgreSQL

## 🗄️ Your Application Uses BOTH Databases

Your application has a **dual-database architecture** where some features use MongoDB and some use PostgreSQL.

---

## 📦 MongoDB Collections (Primary Database)

### ✅ Currently Active & Storing Data:

1. **Items & Inventory**
   - `ItemGroup` - Item groups (shoe sales)
   - `ShoeItem` - Individual items
   - `ItemHistory` - Item change history
   - `ReorderAlert` - Low stock alerts

2. **Orders & Transfers**
   - `StoreOrder` - Store orders (what you see in frontend)
   - `TransferOrder` - Transfer orders between warehouses
   - `PurchaseOrder` - Purchase orders
   - `PurchaseReceive` - Purchase receipts

3. **Sales & Invoices**
   - `SalesInvoice` - Sales invoices
   - `Transaction` - Financial transactions
   - `TransactionHistory` - Transaction history
   - `Close` - Day closing transactions

4. **Vendors & Suppliers**
   - `Vendor` - Vendor information
   - `VendorCredit` - Vendor credits
   - `VendorHistory` - Vendor change history
   - `Bill` - Vendor bills

5. **Inventory Management**
   - `InventoryAdjustment` - Stock adjustments

6. **Master Data**
   - `User` - User accounts
   - `Address` - Addresses
   - `Brand` - Brands
   - `Manufacturer` - Manufacturers

---

## 🐘 PostgreSQL Tables (Secondary/Backup Database)

### ⚠️ Currently EMPTY (Not actively used yet):

1. **SalesInvoices** - Sales invoice records
2. **Transactions** - Financial transactions
3. **InventoryAdjustments** - Stock adjustments
4. **TransferOrders** - Transfer orders
5. **StoreOrders** - Store orders
6. **VendorCredits** - Vendor credits
7. **VendorHistories** - Vendor history
8. **Vendors** - Vendor information
9. **SalesPersons** - Sales person records
10. **Stores** - Store information
11. **Users** - User accounts

---

## 🔄 Dual Database Strategy

Your code has models for BOTH databases:
- **MongoDB models**: `backend/model/*.js`
- **PostgreSQL models**: `backend/models/sequelize/*.js`

### Why Both?

Looking at your code, it appears you're:
1. **Currently using MongoDB** for all operations (active)
2. **Preparing PostgreSQL** for future migration or backup (inactive)

Some models have a `postgresId` field (like StoreOrder, TransferOrder) suggesting a plan to sync data between databases.

---

## 📝 What This Means for Clearing Data

### To Clear Test Data You See in Frontend:

```bash
npm run check-mongodb    # Check MongoDB data
npm run clear-mongodb    # Clear MongoDB data
```

This will clear:
- ✅ Store Orders (what you see in screenshot)
- ✅ Transfer Orders
- ✅ Items & Item Groups
- ✅ Invoices
- ✅ Vendors
- ✅ Everything in your frontend

### PostgreSQL (Not Needed):

```bash
npm run check-production  # Already empty ✅
npm run check-local       # Already empty ✅
```

PostgreSQL tables are empty and not being used yet.

---

## 🚀 For Production Deployment

### Current State:
- **MongoDB**: Contains all your data (production-ready)
- **PostgreSQL**: Empty tables (not used yet)

### What to Clear Before Production:
1. ✅ Clear MongoDB test data: `npm run clear-mongodb`
2. ❌ PostgreSQL: Already empty, nothing to clear

### After Clearing:
- MongoDB will be empty and ready for real production data
- PostgreSQL remains empty (will be used when you implement the dual-database sync)

---

## 🎯 Summary

| Feature | Database | Status |
|---------|----------|--------|
| Store Orders | MongoDB | ✅ Active |
| Transfer Orders | MongoDB | ✅ Active |
| Items/Item Groups | MongoDB | ✅ Active |
| Sales Invoices | MongoDB | ✅ Active |
| Vendors | MongoDB | ✅ Active |
| Users | MongoDB | ✅ Active |
| All PostgreSQL Tables | PostgreSQL | ⚠️ Empty/Unused |

**Bottom Line**: Your app uses **MongoDB** for everything. PostgreSQL is set up but not actively storing data yet.
