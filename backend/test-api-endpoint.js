// Test the getsaveCashBank endpoint directly
import express from 'express';
import mongoose from 'mongoose';
import CloseTransaction from './model/Closing.js';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function testEndpoint() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Simulate the API request
    const locCode = '701';
    const date = '2026-02-03';

    console.log(`🧪 Testing getsaveCashBank endpoint`);
    console.log(`Request: locCode=${locCode}, date=${date}\n`);

    // Simulate what the API does
    const locCodeNum = parseInt(locCode);
    const locCodeStr = String(locCode);

    const formattedDate = new Date(date);
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

    console.log(`📅 Query parameters:`);
    console.log(`  Date range: ${startOfDay.toISOString()} to ${endOfDay.toISOString()}`);
    console.log(`  LocCode: ${locCodeNum} (number) OR "${locCodeStr}" (string)\n`);

    const result = await CloseTransaction.findOne({
      $or: [
        { locCode: locCodeNum },
        { locCode: locCodeStr }
      ],
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    if (result) {
      console.log(`✅ SUCCESS! API should return:`);
      console.log(JSON.stringify({
        message: "data Found",
        data: {
          _id: result._id,
          cash: result.cash,
          Closecash: result.Closecash,
          bank: result.bank,
          date: result.date,
          locCode: result.locCode
        }
      }, null, 2));
    } else {
      console.log(`❌ FAILED! API returns 404`);
      console.log(`{"message":"No Data Found"}\n`);
      
      // Debug why
      console.log(`🔍 Debugging:`);
      
      // Check if data exists with different query
      const anyData = await CloseTransaction.findOne({ locCode: locCodeNum });
      if (anyData) {
        console.log(`  ✅ Data exists for locCode ${locCodeNum}`);
        console.log(`     Latest date: ${anyData.date.toISOString()}`);
      } else {
        console.log(`  ❌ No data at all for locCode ${locCodeNum}`);
      }
    }

    console.log('\n✅ Test complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

testEndpoint();
