import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import CloseTransaction from './model/Closing.js';

// Load environment file
const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;
if (fs.existsSync(envFile)) {
    dotenv.config({ path: envFile });
} else {
    dotenv.config();
}

const mongoUri = process.env.MONGODB_URI_DEV || process.env.MONGO_URI;
console.log('📁 Using database:', mongoUri ? 'Found' : 'NOT FOUND');

const checkOpeningBalance = async () => {
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Check what data exists for locCode 701 on Feb 3, 2026
        const locCode = 701;
        const date = '2026-02-03';

        console.log('\n🔍 Searching for locCode:', locCode, 'on date:', date);
        console.log('Trying different query methods...\n');

        // Method 1: Exact string match
        const result1 = await CloseTransaction.findOne({ 
            locCode: String(locCode),
            date: new Date(date)
        });
        console.log('1️⃣ String locCode + exact date:', result1 ? '✅ FOUND' : '❌ NOT FOUND');
        if (result1) console.log('   Data:', JSON.stringify(result1, null, 2));

        // Method 2: Exact number match
        const result2 = await CloseTransaction.findOne({ 
            locCode: Number(locCode),
            date: new Date(date)
        });
        console.log('\n2️⃣ Number locCode + exact date:', result2 ? '✅ FOUND' : '❌ NOT FOUND');
        if (result2) console.log('   Data:', JSON.stringify(result2, null, 2));

        // Method 3: Date range (like the API does)
        const targetDate = new Date(date);
        const startOfDay = new Date(targetDate);
        startOfDay.setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setUTCHours(23, 59, 59, 999);

        const result3 = await CloseTransaction.findOne({ 
            locCode: Number(locCode),
            date: { $gte: startOfDay, $lte: endOfDay }
        });
        console.log('\n3️⃣ Number locCode + date range:', result3 ? '✅ FOUND' : '❌ NOT FOUND');
        if (result3) console.log('   Data:', JSON.stringify(result3, null, 2));

        // Method 4: $or operator (like the fix)
        const result4 = await CloseTransaction.findOne({ 
            $or: [
                { locCode: locCode },
                { locCode: String(locCode) },
                { locCode: Number(locCode) }
            ],
            date: { $gte: startOfDay, $lte: endOfDay }
        });
        console.log('\n4️⃣ $or operator + date range:', result4 ? '✅ FOUND' : '❌ NOT FOUND');
        if (result4) {
            console.log('   Data:', JSON.stringify(result4, null, 2));
            console.log('\n📊 Field Analysis:');
            console.log('   - cash field:', result4.cash, '(type:', typeof result4.cash, ')');
            console.log('   - Closecash field:', result4.Closecash, '(type:', typeof result4.Closecash, ')');
            console.log('   - locCode field:', result4.locCode, '(type:', typeof result4.locCode, ')');
            console.log('   - date field:', result4.date);
        }

        // Method 5: Show ALL documents for this locCode (any date)
        console.log('\n5️⃣ ALL documents for locCode 701:');
        const allDocs = await CloseTransaction.find({ 
            $or: [
                { locCode: 701 },
                { locCode: "701" }
            ]
        }).sort({ date: -1 }).limit(5);
        
        console.log(`   Found ${allDocs.length} documents:`);
        allDocs.forEach((doc, i) => {
            console.log(`   ${i+1}. Date: ${doc.date}, cash: ${doc.cash}, Closecash: ${doc.Closecash}, locCode: ${doc.locCode} (${typeof doc.locCode})`);
        });

        // Method 6: Show what locCodes actually exist
        console.log('\n6️⃣ What locCodes exist in the database:');
        const allClosings = await CloseTransaction.find({}).limit(20).sort({ date: -1 });
        console.log(`   Total documents found: ${allClosings.length}`);
        
        const uniqueLocCodes = [...new Set(allClosings.map(doc => doc.locCode))];
        console.log(`   Unique locCodes: ${uniqueLocCodes.join(', ')}`);
        
        if (allClosings.length > 0) {
            console.log('\n   Recent closing entries:');
            allClosings.slice(0, 10).forEach((doc, i) => {
                console.log(`   ${i+1}. locCode: ${doc.locCode} (${typeof doc.locCode}), Date: ${doc.date}, cash: ${doc.cash}, Closecash: ${doc.Closecash}`);
            });
        } else {
            console.log('   ⚠️ The closes collection is COMPLETELY EMPTY!');
        }

        await mongoose.disconnect();
        console.log('\n✅ Disconnected from MongoDB');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
};

checkOpeningBalance();
