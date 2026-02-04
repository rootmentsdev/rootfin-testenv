// Test if Feb 3 data can be found with the fix
import mongoose from 'mongoose';
import CloseTransaction from './model/Closing.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function testFeb3() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const testDate = '2026-02-03';
    const testLocCode = '717'; // G.Kalpetta from your screenshot

    console.log(`🧪 Testing Feb 3 data for locCode ${testLocCode}`);
    console.log('='.repeat(60));

    // Simulate the fixed API code
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

    console.log(`\n📅 Query:`);
    console.log(`Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
    console.log(`LocCode: ${locCodeNum} (number) OR "${locCodeStr}" (string)`);

    const result = await CloseTransaction.findOne({
      $or: [
        { locCode: locCodeNum },
        { locCode: locCodeStr }
      ],
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (result) {
      console.log(`\n✅ SUCCESS! Found data:`);
      console.log(`   Cash: ${result.cash}`);
      console.log(`   Closecash: ${result.Closecash}`);
      console.log(`   Bank: ${result.bank}`);
      console.log(`   Date: ${result.date}`);
      console.log(`\n✅ This should be the opening balance for Feb 4: ${result.Closecash}`);
    } else {
      console.log(`\n❌ FAILED! No data found`);
    }

    // Test for locCode 701 (G.Kottayam) which you're viewing
    console.log(`\n\n🧪 Testing Feb 3 data for locCode 701 (G.Kottayam)`);
    console.log('='.repeat(60));

    const result701 = await CloseTransaction.findOne({
      $or: [
        { locCode: 701 },
        { locCode: '701' }
      ],
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (result701) {
      console.log(`\n✅ SUCCESS! Found data:`);
      console.log(`   Cash: ${result701.cash}`);
      console.log(`   Closecash: ${result701.Closecash}`);
      console.log(`   Bank: ${result701.bank}`);
      console.log(`   Date: ${result701.date}`);
      console.log(`\n✅ Opening balance for Feb 4 should be: ${result701.Closecash}`);
    } else {
      console.log(`\n❌ FAILED! No data found for 701`);
    }

    console.log('\n✅ Test complete!');
    console.log('\n⚠️  If this test shows data but the API returns 404,');
    console.log('    it means the backend server needs to be RESTARTED!');
    
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testFeb3();
