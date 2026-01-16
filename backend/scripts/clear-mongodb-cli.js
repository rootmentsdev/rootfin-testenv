import mongoose from 'mongoose';
import readline from 'readline';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.development') });

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

async function checkData() {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  
  console.log('\n📊 Current data in MongoDB:\n');
  console.log('─'.repeat(60));
  console.log('Collection Name'.padEnd(40) + 'Count');
  console.log('─'.repeat(60));

  let totalDocs = 0;

  for (const collection of collections) {
    const count = await db.collection(collection.name).countDocuments();
    totalDocs += count;
    console.log(collection.name.padEnd(40) + count.toString());
  }

  console.log('─'.repeat(60));
  console.log(`Total documents: ${totalDocs}\n`);

  return totalDocs;
}

async function clearData() {
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  
  console.log('\n🗑️  Clearing all MongoDB collections...\n');

  for (const collection of collections) {
    try {
      await db.collection(collection.name).deleteMany({});
      console.log(`   ✅ Cleared ${collection.name}`);
    } catch (err) {
      console.log(`   ⚠️  ${collection.name}: ${err.message}`);
    }
  }

  console.log('\n✅ All data cleared successfully!\n');

  // Verify
  console.log('📊 Verifying collections are empty:\n');
  for (const collection of collections) {
    const count = await db.collection(collection.name).countDocuments();
    console.log(`   ${collection.name}: ${count} documents`);
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🗑️  CLEAR MONGODB DATA');
  console.log('='.repeat(60));
  console.log('\n⚠️  WARNING: This will delete ALL data from MongoDB!');
  console.log('⚠️  This includes:');
  console.log('   - Store Orders');
  console.log('   - Transfer Orders');
  console.log('   - Items & Item Groups');
  console.log('   - Invoices');
  console.log('   - Vendors');
  console.log('   - Everything else!\n');

  try {
    console.log('🔌 Connecting to MongoDB...\n');
    
    const mongoUri = process.env.MONGODB_URI_DEV || process.env.MONGODB_URI;
    await mongoose.connect(mongoUri);
    
    console.log('✅ Connected!\n');

    // Step 1: Check current data
    const totalDocs = await checkData();

    if (totalDocs === 0) {
      console.log('✅ MongoDB is already empty. Nothing to clear.\n');
      rl.close();
      await mongoose.connection.close();
      return;
    }

    // Step 2: Confirm deletion
    const answer1 = await askQuestion('\n❓ Do you want to DELETE all this MongoDB data? (yes/no): ');
    
    if (answer1.toLowerCase() !== 'yes') {
      console.log('\n❌ Operation cancelled. No data was deleted.\n');
      rl.close();
      await mongoose.connection.close();
      return;
    }

    const answer2 = await askQuestion('\n❓ Are you ABSOLUTELY SURE? Type "DELETE ALL MONGODB" to confirm: ');
    
    if (answer2 !== 'DELETE ALL MONGODB') {
      console.log('\n❌ Operation cancelled. No data was deleted.\n');
      rl.close();
      await mongoose.connection.close();
      return;
    }

    // Step 3: Clear data
    await clearData();

    console.log('\n✅ Done! Your MongoDB database is now empty.\n');

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    console.error('\nPlease check your MongoDB connection and try again.\n');
  } finally {
    rl.close();
    await mongoose.connection.close();
  }
}

// Run the script
main();
