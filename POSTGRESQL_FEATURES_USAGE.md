# PostgreSQL Features Usage Guide

This document identifies which features in the application use PostgreSQL (Sequelize) vs MongoDB.

## 📊 Database Usage Summary

### ✅ Features Using PostgreSQL (Sequelize)

1. **Vendors** (`VendorController.js`)
   - Full CRUD operations for vendor management
   - Uses: `Vendor` model from Sequelize
   - Database: PostgreSQL only

2. **Vendor Credits** (`VendorCreditController.js`)
   - Vendor credit note management
   - Uses: `VendorCredit` model from Sequelize
   - Database: PostgreSQL only

3. **Vendor History** (`VendorHistoryController.js`)
   - Tracks vendor transaction history
   - Uses: `VendorHistory` model from Sequelize
   - Database: PostgreSQL only

4. **Inventory Adjustments** (`InventoryAdjustmentController.js`)
   - Stock quantity and value adjustments
   - Uses: `InventoryAdjustment` model from Sequelize
   - Database: PostgreSQL only
   - Note: Still updates MongoDB item stocks (ShoeItem, ItemGroup)

5. **Stores** (`StoreController.js`)
   - Store/branch management
   - Uses: `Store` model from Sequelize
   - Database: PostgreSQL only

6. **Sales Persons** (via `Store` model)
   - Sales person management linked to stores
   - Uses: `SalesPerson` model from Sequelize
   - Database: PostgreSQL only

### 🔄 Features Using DUAL Databases (MongoDB + PostgreSQL)

1. **Sales Invoices** (`SalesInvoiceController.js`)
   - Primary: MongoDB (`SalesInvoice` model)
   - Secondary: PostgreSQL (`SalesInvoicePostgres` model)
   - Saves to both databases for redundancy
   - Also creates financial transactions in both databases

2. **Transactions** (Financial records)
   - Primary: MongoDB (`Transaction` model)
   - Secondary: PostgreSQL (`TransactionPostgres` model)
   - Created automatically when invoices are created/updated

3. **Transfer Orders** (`TransferOrderController.js`)
   - Primary: MongoDB (`TransferOrder` model)
   - Secondary: PostgreSQL (`TransferOrderPostgres` model)
   - Manages stock transfers between warehouses
   - Saves to both databases

4. **Store Orders** (`StoreOrderController.js`)
   - Primary: MongoDB (`StoreOrder` model)
   - Secondary: PostgreSQL (`StoreOrderPostgres` model - if implemented)
   - Store requests for stock from warehouse

### ❌ Features Using MongoDB ONLY

1. **Purchase Orders** (`PurchaseOrderController.js`)
   - Uses: MongoDB `PurchaseOrder` model only
   - No PostgreSQL integration

2. **Purchase Receives** (`PurchaseReceiveController.js`)
   - Uses: MongoDB `PurchaseReceive` model only
   - No PostgreSQL integration

3. **Shoe Items** (Standalone items)
   - Uses: MongoDB `ShoeItem` model only
   - No PostgreSQL integration

4. **Item Groups** (Product groups)
   - Uses: MongoDB `ItemGroup` model only
   - No PostgreSQL integration

5. **Bills** (`BillController.js`)
   - Uses: MongoDB `Bill` model only
   - No PostgreSQL integration

6. **Brands** (`BrandController.js`)
   - Uses: MongoDB `Brand` model only
   - No PostgreSQL integration

7. **Manufacturers** (`ManufacturerController.js`)
   - Uses: MongoDB `Manufacturer` model only
   - No PostgreSQL integration

8. **Users** (Authentication)
   - Uses: MongoDB `UserModel` only
   - Note: There's a Sequelize `User` model but it's not actively used

9. **Addresses** (`AddressController.js`)
   - Uses: MongoDB `Address` model only
   - No PostgreSQL integration

10. **Closing/DayBook** (`CloseController.js`, `DayBookController.js`)
    - Uses: MongoDB models only
    - No PostgreSQL integration

## 📁 PostgreSQL Models Location

All Sequelize (PostgreSQL) models are located in:
```
backend/models/sequelize/
├── index.js                    # Exports all models
├── InventoryAdjustment.js
├── SalesInvoice.js
├── SalesPerson.js
├── Store.js
├── StoreOrder.js
├── Transaction.js
├── TransferOrder.js
├── User.js
├── Vendor.js
├── VendorCredit.js
└── VendorHistory.js
```

## 🔧 Database Configuration

PostgreSQL connection is configured in:
- `backend/db/postgresql.js` - Sequelize connection setup
- `backend/.env` - Database credentials

MongoDB connection is configured in:
- `backend/db/database.js` - Mongoose connection setup
- `backend/.env` - Database credentials

## 🎯 Migration Strategy

### Already Migrated to PostgreSQL:
- ✅ Vendors
- ✅ Vendor Credits
- ✅ Vendor History
- ✅ Inventory Adjustments
- ✅ Stores
- ✅ Sales Persons

### Dual Database (Transitioning):
- 🔄 Sales Invoices
- 🔄 Transactions
- 🔄 Transfer Orders
- 🔄 Store Orders

### Still on MongoDB:
- ❌ Purchase Orders
- ❌ Purchase Receives
- ❌ Items (ShoeItem, ItemGroup)
- ❌ Bills
- ❌ Brands
- ❌ Manufacturers
- ❌ Users
- ❌ Addresses
- ❌ Closing/DayBook

## 💡 Key Insights

1. **Vendor Management** is fully on PostgreSQL
2. **Inventory Adjustments** use PostgreSQL for records but still update MongoDB item stocks
3. **Sales Invoices** and **Transactions** are being saved to both databases for redundancy
4. **Transfer Orders** are dual-database to ensure data consistency during migration
5. **Item/Product data** (ShoeItem, ItemGroup) remains on MongoDB
6. **Purchase workflow** (Orders, Receives) is still MongoDB-only

## 🔍 How to Identify Database Usage in Code

### PostgreSQL (Sequelize):
```javascript
import { Vendor } from "../models/sequelize/index.js";
// or
import Vendor from "../models/sequelize/Vendor.js";

// Usage
const vendor = await Vendor.findByPk(id);
```

### MongoDB (Mongoose):
```javascript
import Vendor from "../model/Vendor.js";

// Usage
const vendor = await Vendor.findById(id);
```

### Dual Database:
```javascript
import SalesInvoice from "../model/SalesInvoice.js"; // MongoDB
import SalesInvoicePostgres from "../models/sequelize/SalesInvoice.js"; // PostgreSQL

// Save to both
const mongoInvoice = await SalesInvoice.create(data);
const pgInvoice = await SalesInvoicePostgres.create(data);
```

## 📝 Notes

- PostgreSQL models use `id` (UUID) as primary key
- MongoDB models use `_id` (ObjectId) as primary key
- Some controllers transform PostgreSQL results to include `_id` for frontend compatibility
- Stock management (warehouseStocks) is still handled in MongoDB for all items
