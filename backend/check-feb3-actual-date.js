// Check the actual date format for Feb 3 data
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function checkActualDate() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get Feb 3 data directly from database
    console.log('🔍 Checking actual Feb 3 data in database:\n');

    const feb3Data = await mongoose.connection.db.collection('closes')
      .find({
        date: {
          $gte: new Date('2026-02-03'),
          $lt: new Date('2026-02-04')
        }
      })
      .limit(5)
      .toArray();

    console.log(`Found ${feb3Data.length} records for Feb 3`);
    
    if (feb3Data.length > 0) {
      console.log('\nSample records:');
      feb3Data.forEach((doc, i) => {
        console.log(`\n${i + 1}. LocCode: ${doc.locCode} (type: ${typeof doc.locCode})`);
        console.log(`   Date: ${doc.date}`);
        console.log(`   Date ISO: ${doc.date.toISOString()}`);
        console.log(`   Cash: ${doc.cash}, Closecash: ${doc.Closecash}`);
      });

      // Try to find with exact date from database
      const sampleDate = feb3Data[0].date;
      console.log(`\n🧪 Testing with exact date from database:`);
      console.log(`Sample date: ${sampleDate.toISOString()}`);

      const exactMatch = await mongoose.connection.db.collection('closes')
        .findOne({
          locCode: feb3Data[0].locCode,
          date: sampleDate
        });

      console.log(`Exact match: ${exactMatch ? '✅ FOUND' : '❌ NOT FOUND'}`);
    }

    // Check all dates in February 2026
    console.log('\n\n📅 All dates in February 2026:');
    const allFeb = await mongoose.connection.db.collection('closes')
      .aggregate([
        {
          $match: {
            date: {
              $gte: new Date('2026-02-01'),
              $lt: new Date('2026-03-01')
            }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
      .toArray();

    console.log('\nDates with data:');
    allFeb.forEach(item => {
      console.log(`  ${item._id}: ${item.count} records`);
    });

    console.log('\n✅ Check complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkActualDate();
