// Check which stores have Feb 3 data
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function checkStores() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const feb3Data = await mongoose.connection.db.collection('closes')
      .find({
        date: {
          $gte: new Date('2026-02-03T00:00:00.000Z'),
          $lt: new Date('2026-02-04T00:00:00.000Z')
        }
      })
      .sort({ locCode: 1 })
      .toArray();

    console.log(`📊 Stores with Feb 3 closing data (${feb3Data.length} total):\n`);
    
    feb3Data.forEach((doc, i) => {
      console.log(`${(i + 1).toString().padStart(2)}. LocCode ${doc.locCode.toString().padStart(3)}: Closecash=${doc.Closecash.toString().padStart(6)}, Cash=${doc.cash.toString().padStart(6)}`);
    });

    // Check if 701 has data
    const has701 = feb3Data.find(d => d.locCode === 701 || d.locCode === '701');
    console.log(`\n🔍 LocCode 701 (G.Kottayam): ${has701 ? '✅ HAS DATA' : '❌ NO DATA'}`);

    if (!has701) {
      console.log('\n⚠️  This is why opening balance shows 0 for Feb 4!');
      console.log('   Store 701 hasn\'t closed for Feb 3 yet.');
      
      // Check if 701 has Feb 2 data
      const feb2_701 = await mongoose.connection.db.collection('closes')
        .findOne({
          $or: [{ locCode: 701 }, { locCode: '701' }],
          date: {
            $gte: new Date('2026-02-02T00:00:00.000Z'),
            $lt: new Date('2026-02-03T00:00:00.000Z')
          }
        });

      if (feb2_701) {
        console.log(`\n✅ Store 701 has Feb 2 data:`);
        console.log(`   Closecash: ${feb2_701.Closecash}`);
        console.log(`   This should be the opening for Feb 3`);
      }
    }

    console.log('\n✅ Check complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkStores();
