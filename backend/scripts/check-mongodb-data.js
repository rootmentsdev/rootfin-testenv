import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.development') });

async function checkData() {
  try {
    console.log('\n🔌 Connecting to MongoDB...\n');
    
    const mongoUri = process.env.MONGODB_URI_DEV || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected!\n');

    console.log('📊 Current data in MongoDB collections:\n');
    console.log('─'.repeat(70));
    console.log('Collection Name'.padEnd(40) + 'Document Count');
    console.log('─'.repeat(70));

    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    
    let totalDocs = 0;

    for (const collection of collections) {
      const count = await db.collection(collection.name).countDocuments();
      totalDocs += count;
      console.log(collection.name.padEnd(40) + count.toString());
    }

    console.log('─'.repeat(70));
    console.log(`\nTotal documents across all collections: ${totalDocs}\n`);

    if (totalDocs === 0) {
      console.log('✅ MongoDB is empty!\n');
    } else {
      console.log('⚠️  MongoDB contains data.\n');
      console.log('💡 To clear this data, run: npm run clear-mongodb\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nMake sure MongoDB connection string is correct in .env.development\n');
    throw error;
  } finally {
    await mongoose.connection.close();
  }
}

// Run the script
checkData().catch(err => {
  console.error('Failed to check data:', err.message);
  process.exit(1);
});
