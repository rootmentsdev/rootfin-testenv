-- ⚠️ WARNING: This script will DELETE ALL DATA from PostgreSQL tables
-- ⚠️ Use this ONLY when you want to clear test data before production launch
-- ⚠️ There is NO UNDO - data will be permanently deleted
-- ⚠️ Make sure you have a backup if needed

-- Run this script in pgAdmin or Render's SQL shell

-- Disable foreign key checks temporarily (if needed)
SET session_replication_role = 'replica';

-- Clear all tables (in order to avoid foreign key conflicts)
TRUNCATE TABLE "SalesInvoices" CASCADE;
TRUNCATE TABLE "Transactions" CASCADE;
TRUNCATE TABLE "InventoryAdjustments" CASCADE;
TRUNCATE TABLE "TransferOrders" CASCADE;
TRUNCATE TABLE "StoreOrders" CASCADE;
TRUNCATE TABLE "VendorCredits" CASCADE;
TRUNCATE TABLE "VendorHistories" CASCADE;
TRUNCATE TABLE "Vendors" CASCADE;
TRUNCATE TABLE "SalesPersons" CASCADE;
TRUNCATE TABLE "Stores" CASCADE;
TRUNCATE TABLE "Users" CASCADE;

-- Re-enable foreign key checks
SET session_replication_role = 'origin';

-- Verify tables are empty
SELECT 'SalesInvoices' as table_name, COUNT(*) as row_count FROM "SalesInvoices"
UNION ALL
SELECT 'Transactions', COUNT(*) FROM "Transactions"
UNION ALL
SELECT 'InventoryAdjustments', COUNT(*) FROM "InventoryAdjustments"
UNION ALL
SELECT 'TransferOrders', COUNT(*) FROM "TransferOrders"
UNION ALL
SELECT 'StoreOrders', COUNT(*) FROM "StoreOrders"
UNION ALL
SELECT 'VendorCredits', COUNT(*) FROM "VendorCredits"
UNION ALL
SELECT 'VendorHistories', COUNT(*) FROM "VendorHistories"
UNION ALL
SELECT 'Vendors', COUNT(*) FROM "Vendors"
UNION ALL
SELECT 'SalesPersons', COUNT(*) FROM "SalesPersons"
UNION ALL
SELECT 'Stores', COUNT(*) FROM "Stores"
UNION ALL
SELECT 'Users', COUNT(*) FROM "Users";

-- ✅ If all counts show 0, the data has been successfully cleared
