-- Performance indexes migration
-- Safe to run on existing data - CREATE INDEX CONCURRENTLY does NOT lock the table
-- Run this directly on your AWS RDS PostgreSQL instance

-- ============================================================
-- transactions table (most queried - highest priority)
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_loc_code ON transactions ("locCode");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_date ON transactions ("date");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_category ON transactions ("category");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_type ON transactions ("type");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_loc_date ON transactions ("locCode", "date");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_transactions_loc_category ON transactions ("locCode", "category");

-- ============================================================
-- vendors table
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_user_id ON vendors ("userId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_loc_code ON vendors ("locCode");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_is_active ON vendors ("isActive");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_display_name ON vendors ("displayName");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_user_created ON vendors ("userId", "createdAt");

-- ============================================================
-- sales_persons table
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_persons_store_id ON sales_persons ("storeId");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_persons_is_active ON sales_persons ("isActive");
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_persons_store_active ON sales_persons ("storeId", "isActive");

-- ============================================================
-- stores table
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_stores_is_active ON stores ("isActive");

-- ============================================================
-- users table
-- ============================================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_users_loc_code ON users ("locCode");

-- ============================================================
-- Verify indexes were created
-- ============================================================
SELECT schemaname, tablename, indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('transactions', 'vendors', 'sales_persons', 'stores', 'users')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
