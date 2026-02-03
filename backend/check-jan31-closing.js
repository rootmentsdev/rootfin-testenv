import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const checkJan31Closing = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB\n');

        // Define the Closing schema
        const CloseSchema = new mongoose.Schema({
            cash: Number,
            Closecash: Number,
            bank: Number,
            rbl: Number,
            date: Date,
            locCode: String,
            email: String
        }, { timestamps: true });

        const CloseTransaction = mongoose.model('Close', CloseSchema);

        // Check Jan 31, 2026 closing for G-Thrissur (locCode 704)
        const jan31Start = new Date('2026-01-31T00:00:00.000Z');
        const jan31End = new Date('2026-02-01T00:00:00.000Z');

        console.log('📅 Searching for closing data on Jan 31, 2026');
        console.log(`Date range: ${jan31Start.toISOString()} to ${jan31End.toISOString()}\n`);

        const closingData = await CloseTransaction.find({
            date: {
                $gte: jan31Start,
                $lt: jan31End
            }
        }).sort({ locCode: 1 });

        if (closingData.length === 0) {
            console.log('❌ No closing data found for Jan 31, 2026');
        } else {
            console.log(`✅ Found ${closingData.length} closing records for Jan 31, 2026:\n`);
            
            closingData.forEach((record, index) => {
                console.log(`Record ${index + 1}:`);
                console.log(`  LocCode: ${record.locCode}`);
                console.log(`  Date: ${record.date.toISOString()}`);
                console.log(`  Cash (Calculated): ${record.cash}`);
                console.log(`  Closecash (Physical): ${record.Closecash}`);
                console.log(`  Bank: ${record.bank}`);
                console.log(`  RBL: ${record.rbl || 0}`);
                console.log(`  Email: ${record.email}`);
                console.log(`  Created: ${record.createdAt?.toISOString()}`);
                console.log('');
            });

            // Specifically check for G-Thrissur (locCode 704)
            const thrissurRecord = closingData.find(r => r.locCode === '704');
            if (thrissurRecord) {
                console.log('🎯 G-Thrissur (locCode 704) Jan 31, 2026:');
                console.log(`  Cash (for Feb 1 opening): ${thrissurRecord.cash}`);
                console.log(`  Closecash (physical count): ${thrissurRecord.Closecash}`);
                console.log(`  Difference: ${thrissurRecord.cash - thrissurRecord.Closecash}`);
            } else {
                console.log('⚠️  No closing data found for G-Thrissur (locCode 704)');
            }
        }

        // Also check Feb 1, 2026 to see if there's any data
        console.log('\n📅 Checking Feb 1, 2026 closing data...');
        const feb1Start = new Date('2026-02-01T00:00:00.000Z');
        const feb1End = new Date('2026-02-02T00:00:00.000Z');

        const feb1Data = await CloseTransaction.find({
            date: {
                $gte: feb1Start,
                $lt: feb1End
            },
            locCode: '704'
        });

        if (feb1Data.length > 0) {
            console.log('✅ Found Feb 1, 2026 closing for G-Thrissur:');
            feb1Data.forEach(record => {
                console.log(`  Cash: ${record.cash}`);
                console.log(`  Closecash: ${record.Closecash}`);
                console.log(`  Bank: ${record.bank}`);
            });
        } else {
            console.log('ℹ️  No Feb 1, 2026 closing data yet for G-Thrissur');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        console.log('\n🔌 Disconnecting from MongoDB...');
        await mongoose.disconnect();
        console.log('✅ Disconnected');
    }
};

checkJan31Closing();
