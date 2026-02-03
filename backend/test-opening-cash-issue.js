import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from backend directory
dotenv.config({ path: join(__dirname, '.env') });

const testOpeningCashIssue = async () => {
    try {
        console.log('🔌 Connecting to MongoDB...');
        console.log('Using connection string:', process.env.MONGODB_URI ? 'Found' : 'NOT FOUND');
        
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

        // Test for G-Thrissur (locCode 704) - the store in the screenshot
        const locCode = '704';
        const storeName = 'G-Thrissur';

        console.log(`🏪 Testing Opening Cash Issue for ${storeName} (locCode: ${locCode})\n`);
        console.log('=' .repeat(70));

        // Check Jan 31, 2026 closing
        console.log('\n📅 Step 1: Check Jan 31, 2026 Closing Data');
        console.log('-'.repeat(70));
        
        const jan31Start = new Date('2026-01-31T00:00:00.000Z');
        const jan31End = new Date('2026-01-31T23:59:59.999Z');

        const jan31Closing = await CloseTransaction.findOne({
            locCode: locCode,
            date: {
                $gte: jan31Start,
                $lte: jan31End
            }
        });

        if (!jan31Closing) {
            console.log('❌ No closing data found for Jan 31, 2026');
            console.log('   This is the problem! No closing data exists for the previous day.');
        } else {
            console.log('✅ Found Jan 31, 2026 closing data:');
            console.log(`   Date: ${jan31Closing.date.toISOString()}`);
            console.log(`   Cash (Calculated Closing): ${jan31Closing.cash}`);
            console.log(`   Closecash (Physical Count): ${jan31Closing.Closecash}`);
            console.log(`   Bank: ${jan31Closing.bank}`);
            console.log(`   RBL: ${jan31Closing.rbl || 0}`);
            console.log(`   Email: ${jan31Closing.email}`);
            console.log(`   Created: ${jan31Closing.createdAt?.toISOString()}`);
            
            // This is what should be used as Feb 1 opening
            console.log(`\n   ➡️  This cash value (${jan31Closing.cash}) should be Feb 1 opening`);
        }

        // Check Feb 1, 2026 closing (if exists)
        console.log('\n📅 Step 2: Check Feb 1, 2026 Closing Data (if exists)');
        console.log('-'.repeat(70));
        
        const feb1Start = new Date('2026-02-01T00:00:00.000Z');
        const feb1End = new Date('2026-02-01T23:59:59.999Z');

        const feb1Closing = await CloseTransaction.findOne({
            locCode: locCode,
            date: {
                $gte: feb1Start,
                $lte: feb1End
            }
        });

        if (!feb1Closing) {
            console.log('ℹ️  No closing data for Feb 1, 2026 yet (this is normal)');
        } else {
            console.log('✅ Found Feb 1, 2026 closing data:');
            console.log(`   Cash: ${feb1Closing.cash}`);
            console.log(`   Closecash: ${feb1Closing.Closecash}`);
            console.log(`   Bank: ${feb1Closing.bank}`);
        }

        // Check all recent closings for this store
        console.log('\n📅 Step 3: Recent Closing History');
        console.log('-'.repeat(70));
        
        const recentClosings = await CloseTransaction.find({
            locCode: locCode,
            date: {
                $gte: new Date('2026-01-25T00:00:00.000Z'),
                $lte: new Date('2026-02-05T23:59:59.999Z')
            }
        }).sort({ date: 1 });

        if (recentClosings.length === 0) {
            console.log('❌ No closing data found for late Jan / early Feb 2026');
        } else {
            console.log(`✅ Found ${recentClosings.length} closing records:\n`);
            
            recentClosings.forEach((record, index) => {
                const dateStr = record.date.toISOString().split('T')[0];
                console.log(`   ${index + 1}. ${dateStr}:`);
                console.log(`      Cash: ${record.cash}, Closecash: ${record.Closecash}, Bank: ${record.bank}`);
                
                // Check for the specific issue: 8359 vs 8159
                if (record.cash === 8359 || record.cash === 8159) {
                    console.log(`      ⚠️  FOUND THE VALUE! Cash = ${record.cash}`);
                }
            });
        }

        // Simulate the API call that Datewisedaybook makes
        console.log('\n🔍 Step 4: Simulate API Call for Feb 1 Opening');
        console.log('-'.repeat(70));
        
        const requestedDate = '2026-01-31'; // This is what frontend requests for Feb 1 opening
        console.log(`   Frontend requests: /user/getsaveCashBank?locCode=${locCode}&date=${requestedDate}`);
        
        // Parse date like the backend does
        const parts = requestedDate.split('-');
        const formattedDate = new Date(`${parts[0]}-${parts[1]}-${parts[2]}`);
        
        const startOfDay = new Date(formattedDate);
        startOfDay.setHours(0, 0, 0, 0);
        
        const endOfDay = new Date(formattedDate);
        endOfDay.setHours(23, 59, 59, 999);
        
        const apiResult = await CloseTransaction.findOne({
            locCode: locCode,
            date: { $gte: startOfDay, $lte: endOfDay }
        });
        
        if (!apiResult) {
            console.log('   ❌ API would return 404 - No data found');
        } else {
            console.log('   ✅ API would return:');
            console.log(`      cash: ${apiResult.cash}`);
            console.log(`      Closecash: ${apiResult.Closecash}`);
            console.log(`      bank: ${apiResult.bank}`);
            console.log(`\n   ➡️  Frontend would use: ${apiResult.cash ?? apiResult.Closecash ?? 0} as opening`);
        }

        // Summary
        console.log('\n' + '='.repeat(70));
        console.log('📊 SUMMARY');
        console.log('='.repeat(70));
        
        if (jan31Closing) {
            console.log(`✅ Jan 31 closing exists with cash: ${jan31Closing.cash}`);
            console.log(`✅ This should be the Feb 1 opening balance`);
            
            if (jan31Closing.cash === 8359) {
                console.log(`\n✅ CORRECT: Database has 8359`);
                console.log(`   If Daybook shows 8159, the issue is in the FRONTEND calculation`);
            } else if (jan31Closing.cash === 8159) {
                console.log(`\n❌ WRONG: Database has 8159 instead of 8359`);
                console.log(`   The issue is in the DATABASE - admin entered wrong value`);
                console.log(`   Fix: Use Admin Close to update Jan 31 closing to 8359`);
            } else {
                console.log(`\n⚠️  Database has: ${jan31Closing.cash}`);
                console.log(`   Expected: 8359`);
                console.log(`   Difference: ${jan31Closing.cash - 8359}`);
            }
        } else {
            console.log(`❌ No Jan 31 closing data found`);
            console.log(`   This is why Feb 1 opening is wrong!`);
            console.log(`   Fix: Use Admin Close to enter Jan 31 closing data`);
        }

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.error(error);
    } finally {
        console.log('\n🔌 Disconnecting from MongoDB...');
        await mongoose.disconnect();
        console.log('✅ Disconnected\n');
    }
};

testOpeningCashIssue();
