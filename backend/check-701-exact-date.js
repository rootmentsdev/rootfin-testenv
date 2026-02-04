// Check exact date for locCode 701
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function check701() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get the actual record for 701
    const record = await mongoose.connection.db.collection('closes')
      .findOne({ locCode: 701 }, { sort: { date: -1 } });

    if (record) {
      console.log('📊 Latest record for locCode 701:');
      console.log(`  Date: ${record.date}`);
      console.log(`  Date ISO: ${record.date.toISOString()}`);
      console.log(`  Date UTC: ${record.date.toUTCString()}`);
      console.log(`  Cash: ${record.cash}`);
      console.log(`  Closecash: ${record.Closecash}`);
      console.log(`  LocCode type: ${typeof record.locCode}`);
      
      // Try to find it with the exact date
      const exactFind = await mongoose.connection.db.collection('closes')
        .findOne({
          locCode: 701,
          date: record.date
        });
      
      console.log(`\n✅ Can find with exact date: ${exactFind ? 'YES' : 'NO'}`);
      
      // Try with date range
      const rangeFind = await mongoose.connection.db.collection('closes')
        .findOne({
          locCode: 701,
          date: {
            $gte: new Date('2026-02-03T00:00:00.000Z'),
            $lte: new Date('2026-02-03T23:59:59.999Z')
          }
        });
      
      console.log(`✅ Can find with date range: ${rangeFind ? 'YES' : 'NO'}`);
      
      if (!rangeFind) {
        console.log(`\n⚠️  Date is OUTSIDE the range!`);
        console.log(`   Record date: ${record.date.toISOString()}`);
        console.log(`   Query range: 2026-02-03T00:00:00.000Z to 2026-02-03T23:59:59.999Z`);
      }
    } else {
      console.log('❌ No record found for locCode 701');
    }

    console.log('\n✅ Check complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

check701();
