// Test if the opening balance fix is working
import mongoose from 'mongoose';
import CloseTransaction from './model/Closing.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function testOpeningFix() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Test case: locCode 144, date 2026-02-02
    const testLocCode = '144';
    const testDate = '2026-02-02';

    console.log('🧪 Testing Opening Balance Fix');
    console.log('='.repeat(60));
    console.log(`Store: Z-Edapally (locCode: ${testLocCode})`);
    console.log(`Date: ${testDate}`);
    console.log('='.repeat(60));

    // Simulate what the API does
    const locCodeNum = parseInt(testLocCode);
    const locCodeStr = String(testLocCode);

    const formattedDate = new Date(testDate);
    const startOfDay = new Date(Date.UTC(
      formattedDate.getFullYear(),
      formattedDate.getMonth(),
      formattedDate.getDate(),
      0, 0, 0, 0
    ));
    const endOfDay = new Date(Date.UTC(
      formattedDate.getFullYear(),
      formattedDate.getMonth(),
      formattedDate.getDate(),
      23, 59, 59, 999
    ));

    console.log(`\n📅 Date Range:`);
    console.log(`Start: ${startOfDay.toISOString()}`);
    console.log(`End: ${endOfDay.toISOString()}`);

    console.log(`\n🔍 Query:`);
    console.log(`locCode: ${locCodeNum} (number) OR "${locCodeStr}" (string)`);

    const result = await CloseTransaction.findOne({
      $or: [
        { locCode: locCodeNum },
        { locCode: locCodeStr }
      ],
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (result) {
      console.log(`\n✅ SUCCESS! Found closing data:`);
      console.log(`   Cash: ${result.cash}`);
      console.log(`   Closecash: ${result.Closecash}`);
      console.log(`   Bank: ${result.bank}`);
      console.log(`   Date: ${result.date}`);
      console.log(`   LocCode: ${result.locCode} (type: ${typeof result.locCode})`);
      console.log(`\n✅ Opening balance for next day should be: ${result.Closecash}`);
    } else {
      console.log(`\n❌ FAILED! No data found`);
      
      // Debug: Check what's actually in the database
      console.log(`\n🔍 Checking what's in database for locCode 144...`);
      const allForStore = await CloseTransaction.find({
        $or: [{ locCode: 144 }, { locCode: '144' }]
      }).sort({ date: -1 }).limit(5);
      
      console.log(`Found ${allForStore.length} records:`);
      allForStore.forEach((doc, i) => {
        console.log(`  ${i + 1}. Date: ${doc.date.toISOString()}, Cash: ${doc.cash}, Closecash: ${doc.Closecash}, LocCode: ${doc.locCode} (${typeof doc.locCode})`);
      });
    }

    console.log('\n✅ Test complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testOpeningFix();
