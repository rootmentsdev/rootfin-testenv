// Check MongoDB Collections After Migration
import dotenv from 'dotenv';
import mongoose from 'mongoose';

// Import models to check data
import InventoryAdjustment from './model/InventoryAdjustment.js';
import SalesPerson from './model/SalesPerson.js';
import Store from './model/Store.js';
import TransferOrder from './model/TransferOrder.js';
import Vendor from './model/Vendor.js';
import VendorHistory from './model/VendorHistory.js';

dotenv.config();

const mongoUri = process.env.MONGODB_URI;

async function checkMigratedData() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('✅ MongoDB connected\n');

    console.log('📊 CHECKING MIGRATED DATA IN MONGODB:');
    console.log('=====================================\n');

    // Check each migrated collection
    const collections = [
      { name: 'InventoryAdjustments', model: InventoryAdjustment },
      { name: 'SalesPersons', model: SalesPerson },
      { name: 'Stores', model: Store },
      { name: 'TransferOrders', model: TransferOrder },
      { name: 'Vendors', model: Vendor },
      { name: 'VendorHistories', model: VendorHistory }
    ];

    for (const collection of collections) {
      try {
        const count = await collection.model.countDocuments();
        console.log(`📋 ${collection.name}: ${count} records`);
        
        if (count > 0) {
          // Show sample data
          const sample = await collection.model.findOne().lean();
          console.log(`   Sample record:`, JSON.stringify(sample, null, 2).substring(0, 200) + '...\n');
        } else {
          console.log(`   No data found\n`);
        }
      } catch (error) {
        console.log(`❌ Error checking ${collection.name}:`, error.message);
      }
    }

    console.log('🎉 Data verification completed!');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 MongoDB connection closed');
  }
}

checkMigratedData();