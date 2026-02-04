// Check all collections in database
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function checkCollections() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    console.log(`Database: ${mongoose.connection.name}`);

    // Get all collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    console.log('\n📊 All Collections in Database:');
    console.log('='.repeat(60));
    
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`${collection.name.padEnd(30)} - ${count} documents`);
      
      // If it's a closing-related collection, show sample
      if (collection.name.toLowerCase().includes('clos')) {
        console.log(`  📝 Sample document:`);
        const sample = await mongoose.connection.db.collection(collection.name).findOne();
        console.log(`  `, JSON.stringify(sample, null, 2).split('\n').join('\n   '));
      }
    }

    // Specifically check for "closes" collection (plural)
    console.log('\n🔍 Checking "closes" collection specifically:');
    const closesCount = await mongoose.connection.db.collection('closes').countDocuments();
    console.log(`Total documents: ${closesCount}`);
    
    if (closesCount > 0) {
      console.log('\n📋 Sample closing records:');
      const samples = await mongoose.connection.db.collection('closes')
        .find()
        .sort({ date: -1 })
        .limit(5)
        .toArray();
      
      samples.forEach((doc, index) => {
        console.log(`\n${index + 1}. LocCode: ${doc.locCode}, Date: ${doc.date}`);
        console.log(`   Cash: ${doc.cash}, Closecash: ${doc.Closecash}, Bank: ${doc.bank}`);
      });

      // Check for 2026-02-02 specifically
      console.log('\n🎯 Checking for 2026-02-02 data:');
      const feb2Data = await mongoose.connection.db.collection('closes')
        .find({
          date: {
            $gte: new Date('2026-02-02T00:00:00.000Z'),
            $lt: new Date('2026-02-03T00:00:00.000Z')
          }
        })
        .toArray();
      
      console.log(`Found ${feb2Data.length} records for 2026-02-02`);
      feb2Data.forEach(doc => {
        console.log(`  LocCode ${doc.locCode}: Cash=${doc.cash}, Closecash=${doc.Closecash}`);
      });
    }

    console.log('\n✅ Check complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkCollections();
