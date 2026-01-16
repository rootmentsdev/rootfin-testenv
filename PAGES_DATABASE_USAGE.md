# 📄 Which Pages Use PostgreSQL vs MongoDB

## 🐘 Pages Using PostgreSQL (Sequelize)

### 1. **Vendors** (`/api/vendors`)
- ✅ **PostgreSQL** - VendorController
- Create, Read, Update, Delete vendors
- Vendor history tracking

### 2. **Vendor Credits** (`/api/vendor-credits`)
- ✅ **PostgreSQL** - VendorCreditController
- Vendor credit notes
- Credit management
- **Note**: Also uses MongoDB for Items (ShoeItem, ItemGroup)

### 3. **Vendor History** (`/api/vendor-history`)
- ✅ **PostgreSQL** - VendorHistoryController
- Vendor activity logs
- Change tracking

### 4. **Stores** (`/api/stores`)
- ✅ **PostgreSQL** - StoreController
- Store/branch management
- Store information

### 5. **Sales Persons** (`/api/sales-persons`)
- ✅ **PostgreSQL** - SalesPersonController
- Sales person records
- Sales team management

### 6. **Inventory Adjustments** (`/api/inventory-adjustments`)
- ✅ **PostgreSQL** - InventoryAdjustmentController
- Stock adjustments
- Inventory corrections
- **Note**: Also uses MongoDB for Items (ShoeItem, ItemGroup)

### 7. **Sales Invoices** (`/api/sales-invoices`)
- ✅ **BOTH PostgreSQL & MongoDB** - SalesInvoiceController
- Creates records in BOTH databases
- PostgreSQL: SalesInvoicePostgres, TransactionPostgres
- MongoDB: SalesInvoice, Transaction
- **Dual-database sync**

---

## 🍃 Pages Using MongoDB Only

### 1. **Store Orders** (`/api/store-orders`)
- ✅ **MongoDB** - StoreOrderController
- Store order requests
- **This is what you see in your frontend screenshot!**

### 2. **Transfer Orders** (`/api/transfer-orders`)
- ✅ **BOTH MongoDB & PostgreSQL** - TransferOrderController
- Primary: MongoDB (TransferOrder)
- Backup: PostgreSQL (TransferOrderPostgres)
- **Dual-database with MongoDB as primary**

### 3. **Items & Item Groups** (`/api/shoe-sales/items`, `/api/shoe-sales/item-groups`)
- ✅ **MongoDB** - ShoeItemController, ItemGroupController
- Item management
- Item groups
- Stock tracking
- Item history

### 4. **Purchase Orders** (`/api/purchase-orders`)
- ✅ **MongoDB** - PurchaseOrderController
- Purchase order creation
- Vendor orders

### 5. **Purchase Receives** (`/api/purchase-receives`)
- ✅ **MongoDB** - PurchaseReceiveController
- Receiving purchased items
- Stock updates

### 6. **Transactions** (`/api/transactions`)
- ✅ **MongoDB** - TransactionController
- Financial transactions
- Transaction history

### 7. **Day Book** (`/api/daybook`)
- ✅ **MongoDB** - DayBookController
- Daily transaction records
- Financial reports

### 8. **Close Day** (`/api/close`)
- ✅ **MongoDB** - CloseController
- Day closing operations
- End of day processing

### 9. **Sales Reports** (`/api/reports/sales`)
- ✅ **MongoDB** - SalesReportController
- Sales analytics
- Revenue reports

### 10. **Inventory Reports** (`/api/reports/inventory`)
- ✅ **MongoDB** - InventoryReportController
- Stock reports
- Inventory analytics

### 11. **Users/Login** (`/api/auth`)
- ✅ **MongoDB** - LoginAndSignup
- User authentication
- User management

### 12. **Brands** (`/api/brands`)
- ✅ **MongoDB** - BrandController
- Brand management

### 13. **Manufacturers** (`/api/manufacturers`)
- ✅ **MongoDB** - ManufacturerController
- Manufacturer management

### 14. **Bills** (`/api/bills`)
- ✅ **MongoDB** - BillController
- Vendor bills
- **Note**: Uses PostgreSQL for Vendor lookup

---

## 📊 Summary Table

| Feature/Page | Database | Controller |
|-------------|----------|------------|
| **Store Orders** ⭐ | MongoDB | StoreOrderController |
| **Transfer Orders** | MongoDB + PostgreSQL | TransferOrderController |
| **Items/Item Groups** | MongoDB | ShoeItemController |
| **Sales Invoices** | MongoDB + PostgreSQL | SalesInvoiceController |
| **Vendors** | PostgreSQL | VendorController |
| **Vendor Credits** | PostgreSQL | VendorCreditController |
| **Stores** | PostgreSQL | StoreController |
| **Sales Persons** | PostgreSQL | SalesPersonController |
| **Inventory Adjustments** | PostgreSQL | InventoryAdjustmentController |
| **Purchase Orders** | MongoDB | PurchaseOrderController |
| **Purchase Receives** | MongoDB | PurchaseReceiveController |
| **Transactions** | MongoDB | TransactionController |
| **Day Book** | MongoDB | DayBookController |
| **Reports** | MongoDB | Various |
| **Users/Auth** | MongoDB | LoginAndSignup |
| **Brands/Manufacturers** | MongoDB | Various |

---

## 🎯 Key Findings

### Your Frontend Screenshot Shows:
**Store Orders** = **MongoDB** ✅

### Dual-Database Features (Both):
1. **Sales Invoices** - Saves to both databases
2. **Transfer Orders** - Primary MongoDB, backup PostgreSQL

### PostgreSQL Only:
- Vendors
- Vendor Credits
- Stores
- Sales Persons
- Inventory Adjustments

### MongoDB Only (Majority):
- Store Orders ⭐
- Items & Item Groups
- Purchase Orders
- Transactions
- Reports
- Users
- Everything else

---

## 🗑️ To Clear Your Test Data

Since **Store Orders** (what you see in frontend) use **MongoDB**:

```bash
npm run check-mongodb    # Check MongoDB data
npm run clear-mongodb    # Clear MongoDB data
```

This will clear the Store Orders you see in your screenshot!
