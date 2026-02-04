// Check what locCode format is used for store 144
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

async function checkLocCode144() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Check all possible variations
    console.log('🔍 Checking all locCode variations for 144:\n');

    const variations = [
      { query: { locCode: 144 }, desc: 'Number 144' },
      { query: { locCode: '144' }, desc: 'String "144"' },
      { query: { locCode: '0144' }, desc: 'String "0144"' },
      { query: { locCode: 'Z-Edapally1' }, desc: 'Store name' },
    ];

    for (const variation of variations) {
      const count = await mongoose.connection.db.collection('closes').countDocuments(variation.query);
      console.log(`${variation.desc.padEnd(20)}: ${count} documents`);
      
      if (count > 0) {
        const sample = await mongoose.connection.db.collection('closes')
          .findOne(variation.query);
        console.log(`  Sample: locCode=${sample.locCode} (type: ${typeof sample.locCode}), date=${sample.date}`);
      }
    }

    // Check what locCodes exist in the database
    console.log('\n📊 All unique locCodes in database:');
    const uniqueLocCodes = await mongoose.connection.db.collection('closes')
      .distinct('locCode');
    
    console.log(`Total unique locCodes: ${uniqueLocCodes.length}`);
    uniqueLocCodes.sort().forEach(locCode => {
      console.log(`  ${locCode} (type: ${typeof locCode})`);
    });

    // Check for Z-Edapally specifically
    console.log('\n🔍 Searching for Z-Edapally related entries:');
    const edapallyVariations = [
      '144', 144, 'Z-Edapally1', 'Z-Edapally', 'Edapally'
    ];

    for (const loc of edapallyVariations) {
      const count = await mongoose.connection.db.collection('closes')
        .countDocuments({ locCode: loc });
      if (count > 0) {
        console.log(`  Found ${count} records with locCode: ${loc} (${typeof loc})`);
      }
    }

    console.log('\n✅ Check complete!');
    process.exit(0);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

checkLocCode144();
