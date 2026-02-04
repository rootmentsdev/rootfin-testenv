// Check if 2026-02-02 data exists for locCode 144
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function checkFeb2Data() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    const locCode = 144;
    const testDate = '2026-02-02';

    console.log(`🔍 Checking for locCode ${locCode} on ${testDate}\n`);

    // Method 1: Exact date match
    console.log('Method 1: Exact date match');
    const exactDate = new Date(testDate);
    const exact = await mongoose.connection.db.collection('closes')
      .findOne({ locCode, date: exactDate });
    console.log(`Result: ${exact ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (exact) {
      console.log(`  Cash: ${exact.cash}, Closecash: ${exact.Closecash}, Date: ${exact.date}`);
    }

    // Method 2: UTC date range
    console.log('\nMethod 2: UTC date range');
    const utcStart = new Date(Date.UTC(2026, 1, 2, 0, 0, 0, 0)); // Month is 0-indexed
    const utcEnd = new Date(Date.UTC(2026, 1, 2, 23, 59, 59, 999));
    console.log(`Range: ${utcStart.toISOString()} to ${utcEnd.toISOString()}`);
    const utcRange = await mongoose.connection.db.collection('closes')
      .findOne({ locCode, date: { $gte: utcStart, $lte: utcEnd } });
    console.log(`Result: ${utcRange ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (utcRange) {
      console.log(`  Cash: ${utcRange.cash}, Closecash: ${utcRange.Closecash}, Date: ${utcRange.date}`);
    }

    // Method 3: Local date range
    console.log('\nMethod 3: Local date range');
    const localDate = new Date(testDate);
    const localStart = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 0, 0, 0, 0);
    const localEnd = new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), 23, 59, 59, 999);
    console.log(`Range: ${localStart.toISOString()} to ${localEnd.toISOString()}`);
    const localRange = await mongoose.connection.db.collection('closes')
      .findOne({ locCode, date: { $gte: localStart, $lte: localEnd } });
    console.log(`Result: ${localRange ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (localRange) {
      console.log(`  Cash: ${localRange.cash}, Closecash: ${localRange.Closecash}, Date: ${localRange.date}`);
    }

    // Check what dates exist for this locCode
    console.log(`\n📅 All dates for locCode ${locCode} (last 10):`);
    const allDates = await mongoose.connection.db.collection('closes')
      .find({ locCode })
      .sort({ date: -1 })
      .limit(10)
      .toArray();
    
    allDates.forEach((doc, i) => {
      const dateStr = doc.date.toISOString().split('T')[0];
      console.log(`  ${i + 1}. ${dateStr}: Cash=${doc.cash}, Closecash=${doc.Closecash}`);
    });

    console.log('\n✅ Check complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkFeb2Data();
