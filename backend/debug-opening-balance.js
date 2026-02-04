// Debug script to check why opening balance is not showing
import mongoose from 'mongoose';
import CloseTransaction from './model/Closing.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function debugOpeningBalance() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Test case: Check for Z-Edapally (locCode 144) on 2026-02-03
    const testLocCode = '144';
    const testDate = '2026-02-02'; // Previous day of 2026-02-03

    console.log('\n📊 Testing Opening Balance Query');
    console.log('='.repeat(60));
    console.log(`Store: Z-Edapally (locCode: ${testLocCode})`);
    console.log(`Date: ${testDate} (previous day)`);
    console.log('='.repeat(60));

    // 1. Check what dates exist in database for this store
    console.log('\n1️⃣ Checking all closing dates for this store:');
    const allClosings = await CloseTransaction.find({ locCode: testLocCode }).sort({ date: -1 });
    console.log(`Found ${allClosings.length} closing records:`);
    allClosings.forEach((closing, index) => {
      console.log(`  ${index + 1}. Date: ${closing.date.toISOString()} | Cash: ${closing.cash} | Closecash: ${closing.Closecash}`);
    });

    // 2. Try exact date match
    console.log(`\n2️⃣ Trying exact date match for ${testDate}:`);
    const exactDate = new Date(testDate);
    console.log(`Query date (ISO): ${exactDate.toISOString()}`);
    
    const exactMatch = await CloseTransaction.findOne({
      locCode: testLocCode,
      date: exactDate
    });
    console.log(`Exact match result: ${exactMatch ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (exactMatch) {
      console.log(`  Cash: ${exactMatch.cash}, Closecash: ${exactMatch.Closecash}`);
    }

    // 3. Try date range match (what the API uses)
    console.log(`\n3️⃣ Trying date range match (API method):`);
    const startOfDay = new Date(testDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(testDate);
    endOfDay.setHours(23, 59, 59, 999);
    
    console.log(`Start: ${startOfDay.toISOString()}`);
    console.log(`End: ${endOfDay.toISOString()}`);
    
    const rangeMatch = await CloseTransaction.findOne({
      locCode: testLocCode,
      date: { $gte: startOfDay, $lte: endOfDay }
    });
    console.log(`Range match result: ${rangeMatch ? '✅ FOUND' : '❌ NOT FOUND'}`);
    if (rangeMatch) {
      console.log(`  Cash: ${rangeMatch.cash}, Closecash: ${rangeMatch.Closecash}`);
    }

    // 4. Check date format in database
    console.log(`\n4️⃣ Checking date format in database:`);
    if (allClosings.length > 0) {
      const sampleDate = allClosings[0].date;
      console.log(`Sample date from DB: ${sampleDate}`);
      console.log(`Type: ${typeof sampleDate}`);
      console.log(`ISO String: ${sampleDate.toISOString()}`);
      console.log(`Local String: ${sampleDate.toLocaleString()}`);
      console.log(`Date only: ${sampleDate.toISOString().split('T')[0]}`);
    }

    // 5. Test with all stores from your screenshot
    console.log(`\n5️⃣ Testing all stores from screenshot (2026-02-03):`);
    const stores = [
      { name: 'G.Chavakkad', locCode: '706' },
      { name: 'G.Calicut', locCode: '712' },
      { name: 'G.Palakkad', locCode: '705' },
      { name: 'G.Kalpetta', locCode: '717' },
      { name: 'Z.Kottakkal', locCode: '122' },
      { name: 'G.Vadakara', locCode: '708' },
      { name: 'G.Kannur', locCode: '716' },
      { name: 'G.Thrissur', locCode: '704' },
      { name: 'SG-Trivandrum', locCode: '700' },
      { name: 'G.Kottayam', locCode: '701' },
      { name: 'Z- Edappal', locCode: '100' },
      { name: 'Z.Perinthalmanna', locCode: '133' },
      { name: 'G.Edappal', locCode: '707' }
    ];

    const prevDay = '2026-02-02';
    const startOfPrevDay = new Date(prevDay);
    startOfPrevDay.setHours(0, 0, 0, 0);
    const endOfPrevDay = new Date(prevDay);
    endOfPrevDay.setHours(23, 59, 59, 999);

    console.log(`\nChecking opening balance for ${prevDay}:`);
    console.log('-'.repeat(80));
    
    for (const store of stores) {
      const closing = await CloseTransaction.findOne({
        locCode: store.locCode,
        date: { $gte: startOfPrevDay, $lte: endOfPrevDay }
      });
      
      if (closing) {
        console.log(`✅ ${store.name.padEnd(20)} (${store.locCode}): Closecash=${closing.Closecash}, Cash=${closing.cash}`);
      } else {
        console.log(`❌ ${store.name.padEnd(20)} (${store.locCode}): NO DATA FOUND`);
      }
    }

    // 6. Check if dates are stored with timezone offset
    console.log(`\n6️⃣ Checking timezone issues:`);
    const anyClosing = await CloseTransaction.findOne({ locCode: testLocCode });
    if (anyClosing) {
      const dbDate = anyClosing.date;
      const utcDate = new Date(dbDate.toISOString());
      const localDate = new Date(dbDate);
      
      console.log(`DB Date: ${dbDate}`);
      console.log(`UTC: ${utcDate.toISOString()}`);
      console.log(`Local: ${localDate.toLocaleString()}`);
      console.log(`Timezone offset: ${dbDate.getTimezoneOffset()} minutes`);
    }

    console.log('\n✅ Debug complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

debugOpeningBalance();
