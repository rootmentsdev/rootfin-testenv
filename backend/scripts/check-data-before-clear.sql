-- 📊 Check how much data exists in each table before clearing
-- Run this FIRST to see what will be deleted

SELECT 
    'SalesInvoices' as table_name, 
    COUNT(*) as row_count,
    pg_size_pretty(pg_total_relation_size('"SalesInvoices"')) as table_size
FROM "SalesInvoices"
UNION ALL
SELECT 'Transactions', COUNT(*), pg_size_pretty(pg_total_relation_size('"Transactions"'))
FROM "Transactions"
UNION ALL
SELECT 'InventoryAdjustments', COUNT(*), pg_size_pretty(pg_total_relation_size('"InventoryAdjustments"'))
FROM "InventoryAdjustments"
UNION ALL
SELECT 'TransferOrders', COUNT(*), pg_size_pretty(pg_total_relation_size('"TransferOrders"'))
FROM "TransferOrders"
UNION ALL
SELECT 'StoreOrders', COUNT(*), pg_size_pretty(pg_total_relation_size('"StoreOrders"'))
FROM "StoreOrders"
UNION ALL
SELECT 'VendorCredits', COUNT(*), pg_size_pretty(pg_total_relation_size('"VendorCredits"'))
FROM "VendorCredits"
UNION ALL
SELECT 'VendorHistories', COUNT(*), pg_size_pretty(pg_total_relation_size('"VendorHistories"'))
FROM "VendorHistories"
UNION ALL
SELECT 'Vendors', COUNT(*), pg_size_pretty(pg_total_relation_size('"Vendors"'))
FROM "Vendors"
UNION ALL
SELECT 'SalesPersons', COUNT(*), pg_size_pretty(pg_total_relation_size('"SalesPersons"'))
FROM "SalesPersons"
UNION ALL
SELECT 'Stores', COUNT(*), pg_size_pretty(pg_total_relation_size('"Stores"'))
FROM "Stores"
UNION ALL
SELECT 'Users', COUNT(*), pg_size_pretty(pg_total_relation_size('"Users"'))
FROM "Users"
ORDER BY row_count DESC;

-- This will show you:
-- - Table name
-- - Number of rows
-- - Size of each table
