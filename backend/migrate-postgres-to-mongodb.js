// PostgreSQL to MongoDB Data Migration Script
import dotenv from 'dotenv';
import pkg from 'pg';
import mongoose from 'mongoose';

// Load migration environment variables
dotenv.config({ path: '.env.migration' });

// Import all MongoDB models
import Address from './model/Address.js';
import Bill from './model/Bill.js';
import Brand from './model/Brand.js';
import Closing from './model/Closing.js';
import Counter from './model/Counter.js';
import InventoryAdjustment from './model/InventoryAdjustment.js';
import ItemGroup from './model/ItemGroup.js';
import ItemHistory from './model/ItemHistory.js';
import Manufacturer from './model/Manufacturer.js';
import PurchaseOrder from './model/PurchaseOrder.js';
import PurchaseReceive from './model/PurchaseReceive.js';
import ReorderAlert from './model/ReorderAlert.js';
import SalesInvoice from './model/SalesInvoice.js';
import SalesPerson from './model/SalesPerson.js';
import ShoeItem from './model/ShoeItem.js';
import Store from './model/Store.js';
import StoreOrder from './model/StoreOrder.js';
import Transaction from './model/Transaction.js';
import TransactionHistory from './model/Transactionhistory.js';
import TransferOrder from './model/TransferOrder.js';
import UserModel from './model/UserModel.js';
import Vendor from './model/Vendor.js';
import VendorCredit from './model/VendorCredit.js';
import VendorHistory from './model/VendorHistory.js';

const { Pool } = pkg;

// PostgreSQL connection configuration
const pgConfig = {
  user: process.env.PG_USER || 'postgres',
  host: process.env.PG_HOST || 'localhost',
  database: process.env.PG_DATABASE || 'rootfin_dev',
  password: process.env.PG_PASSWORD || 'root',
  port: process.env.PG_PORT || 5432,
};

// MongoDB connection
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://abhiramskumar75_db_user:root@cluster0.btura2s.mongodb.net/rootfin?retryWrites=true&w=majority&appName=Cluster0';

class DataMigrator {
  constructor() {
    this.pgPool = new Pool(pgConfig);
    this.migrationStats = {};
  }

  async connectDatabases() {
    try {
      console.log('🔌 Connecting to PostgreSQL...');
      await this.pgPool.connect();
      console.log('✅ PostgreSQL connected');

      console.log('🔌 Connecting to MongoDB...');
      await mongoose.connect(mongoUri);
      console.log('✅ MongoDB connected');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  }

  async getPostgreSQLTables() {
    const query = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `;
    
    const result = await this.pgPool.query(query);
    return result.rows.map(row => row.table_name);
  }

  async migrateTable(tableName, mongoModel) {
    try {
      console.log(`\n📊 Migrating table: ${tableName}`);
      
      // Get all data from PostgreSQL table
      const pgData = await this.pgPool.query(`SELECT * FROM ${tableName}`);
      const rows = pgData.rows;
      
      if (rows.length === 0) {
        console.log(`⚠️  No data found in ${tableName}`);
        this.migrationStats[tableName] = { count: 0, status: 'empty' };
        return;
      }

      console.log(`📝 Found ${rows.length} records in ${tableName}`);
      
      // Clear existing MongoDB collection (optional - remove if you want to keep existing data)
      await mongoModel.deleteMany({});
      console.log(`🗑️  Cleared existing MongoDB collection for ${tableName}`);
      
      // Transform and insert data
      const transformedData = rows.map(row => this.transformRow(row, tableName));
      
      // Insert in batches to avoid memory issues
      const batchSize = 100;
      let insertedCount = 0;
      
      for (let i = 0; i < transformedData.length; i += batchSize) {
        const batch = transformedData.slice(i, i + batchSize);
        try {
          await mongoModel.insertMany(batch, { ordered: false });
          insertedCount += batch.length;
          console.log(`✅ Inserted batch ${Math.ceil((i + 1) / batchSize)} - ${insertedCount}/${transformedData.length} records`);
        } catch (batchError) {
          console.error(`⚠️  Batch insert error for ${tableName}:`, batchError.message);
          // Continue with next batch
        }
      }
      
      this.migrationStats[tableName] = { 
        count: insertedCount, 
        total: rows.length,
        status: 'completed' 
      };
      
      console.log(`✅ Migration completed for ${tableName}: ${insertedCount}/${rows.length} records`);
      
    } catch (error) {
      console.error(`❌ Error migrating ${tableName}:`, error);
      this.migrationStats[tableName] = { 
        count: 0, 
        status: 'failed', 
        error: error.message 
      };
    }
  }

  transformRow(row, tableName) {
    // Transform PostgreSQL row to MongoDB document
    const transformed = { ...row };
    
    // Handle common transformations
    if (transformed.id) {
      // Keep the original ID as a reference, let MongoDB generate new _id
      transformed.originalId = transformed.id;
      delete transformed.id;
    }
    
    // Convert date strings to Date objects
    Object.keys(transformed).forEach(key => {
      const value = transformed[key];
      
      // Handle date fields
      if (key.toLowerCase().includes('date') || key.toLowerCase().includes('time')) {
        if (typeof value === 'string' && value) {
          transformed[key] = new Date(value);
        }
      }
      
      // Handle boolean fields
      if (typeof value === 'boolean') {
        transformed[key] = value;
      }
      
      // Handle JSON fields
      if (typeof value === 'object' && value !== null) {
        transformed[key] = value;
      }
    });
    
    return transformed;
  }

  async runMigration() {
    try {
      await this.connectDatabases();
      
      console.log('🚀 Starting PostgreSQL to MongoDB migration...\n');
      
      // Define table to model mapping
      const tableMappings = {
        'addresses': Address,
        'bills': Bill,
        'brands': Brand,
        'closings': Closing,
        'counters': Counter,
        'inventory_adjustments': InventoryAdjustment,
        'item_groups': ItemGroup,
        'item_histories': ItemHistory,
        'manufacturers': Manufacturer,
        'purchase_orders': PurchaseOrder,
        'purchase_receives': PurchaseReceive,
        'reorder_alerts': ReorderAlert,
        'sales_invoices': SalesInvoice,
        'sales_persons': SalesPerson,
        'shoe_items': ShoeItem,
        'stores': Store,
        'store_orders': StoreOrder,
        'transactions': Transaction,
        'transaction_histories': TransactionHistory,
        'transfer_orders': TransferOrder,
        'users': UserModel,
        'vendors': Vendor,
        'vendor_credits': VendorCredit,
        'vendor_histories': VendorHistory
      };
      
      // Get available PostgreSQL tables
      const availableTables = await this.getPostgreSQLTables();
      console.log('📋 Available PostgreSQL tables:', availableTables);
      
      // Migrate each table
      for (const [tableName, mongoModel] of Object.entries(tableMappings)) {
        if (availableTables.includes(tableName)) {
          await this.migrateTable(tableName, mongoModel);
        } else {
          console.log(`⚠️  Table ${tableName} not found in PostgreSQL`);
        }
      }
      
      // Print migration summary
      console.log('\n📊 MIGRATION SUMMARY:');
      console.log('========================');
      Object.entries(this.migrationStats).forEach(([table, stats]) => {
        const status = stats.status === 'completed' ? '✅' : 
                      stats.status === 'empty' ? '⚠️' : '❌';
        console.log(`${status} ${table}: ${stats.count}${stats.total ? `/${stats.total}` : ''} records (${stats.status})`);
        if (stats.error) {
          console.log(`   Error: ${stats.error}`);
        }
      });
      
      console.log('\n🎉 Migration process completed!');
      
    } catch (error) {
      console.error('❌ Migration failed:', error);
    } finally {
      // Close connections
      await this.pgPool.end();
      await mongoose.disconnect();
      console.log('🔌 Database connections closed');
    }
  }
}

// Run migration
const migrator = new DataMigrator();
migrator.runMigration().catch(console.error);