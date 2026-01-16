import pkg from 'pg';
const { Client } = pkg;
import readline from 'readline';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.development') });

// PRODUCTION database connection
const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=require`;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (question) => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

async function checkData() {
  const client = new Client({ connectionString });
  
  try {
    console.log('\n🔌 Connecting to PRODUCTION database...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📊 Current data in PRODUCTION:\n');
    console.log('─'.repeat(60));
    console.log('Table Name'.padEnd(30) + 'Row Count'.padEnd(15) + 'Size');
    console.log('─'.repeat(60));

    const tables = [
      'sales_invoices',
      'transactions',
      'inventory_adjustments',
      'transfer_orders',
      'store_orders',
      'vendor_credits',
      'vendor_histories',
      'vendors',
      'sales_persons',
      'stores',
      'users',
      'test_models'
    ];

    let totalRows = 0;

    for (const table of tables) {
      try {
        const result = await client.query(`
          SELECT 
            COUNT(*) as count,
            pg_size_pretty(pg_total_relation_size('"${table}"')) as size
          FROM "${table}"
        `);
        
        const count = parseInt(result.rows[0].count);
        const size = result.rows[0].size;
        totalRows += count;
        
        console.log(
          table.padEnd(30) + 
          count.toString().padEnd(15) + 
          size
        );
      } catch (err) {
        console.log(table.padEnd(30) + 'Table not found');
      }
    }

    console.log('─'.repeat(60));
    console.log(`Total rows: ${totalRows}\n`);

    return totalRows;

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

async function clearData() {
  const client = new Client({ connectionString });
  
  try {
    console.log('\n🔌 Connecting to PRODUCTION database...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🗑️  Clearing all PRODUCTION data...\n');

    // Clear tables in order to avoid foreign key constraints
    // Clear child tables first, then parent tables
    const tables = [
      'sales_invoices',      // Has foreign keys to other tables
      'transactions',        // Has foreign keys
      'inventory_adjustments', // Has foreign keys
      'transfer_orders',     // Has foreign keys
      'store_orders',        // Has foreign keys
      'vendor_credits',      // Has foreign key to vendors
      'vendor_histories',    // Has foreign key to vendors
      'test_models',         // Test data
      'sales_persons',       // May have foreign keys
      'vendors',             // Parent table
      'stores',              // Parent table
      'users'                // Parent table
    ];

    for (const table of tables) {
      try {
        // Use CASCADE to automatically handle foreign key constraints
        await client.query(`TRUNCATE TABLE "${table}" RESTART IDENTITY CASCADE`);
        console.log(`   ✅ Cleared ${table}`);
      } catch (err) {
        console.log(`   ⚠️  ${table}: ${err.message}`);
      }
    }

    console.log('\n✅ All PRODUCTION data cleared successfully!\n');

    // Verify
    console.log('📊 Verifying tables are empty:\n');
    for (const table of tables) {
      try {
        const result = await client.query(`SELECT COUNT(*) as count FROM "${table}"`);
        const count = parseInt(result.rows[0].count);
        console.log(`   ${table}: ${count} rows`);
      } catch (err) {
        console.log(`   ${table}: Error checking`);
      }
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

async function main() {
  console.log('\n' + '='.repeat(60));
  console.log('🚨 CLEAR PRODUCTION DATABASE DATA 🚨');
  console.log('='.repeat(60));
  console.log('\n⚠️  WARNING: This will delete ALL data from PRODUCTION!');
  console.log('⚠️  This will affect your LIVE SITE!');
  console.log('⚠️  Database: ' + process.env.DB_NAME);
  console.log('⚠️  Host: ' + process.env.DB_HOST);
  console.log('\n🌐 Your live site will show NO DATA after this!\n');

  try {
    // Step 1: Check current data
    const totalRows = await checkData();

    if (totalRows === 0) {
      console.log('✅ Production database is already empty.\n');
      rl.close();
      return;
    }

    // Step 2: Confirm deletion
    const answer1 = await askQuestion('\n❓ Do you want to DELETE all PRODUCTION data? (yes/no): ');
    
    if (answer1.toLowerCase().trim() !== 'yes') {
      console.log('\n❌ Operation cancelled. No data was deleted.\n');
      rl.close();
      return;
    }

    const answer2 = await askQuestion('\n❓ This will affect your LIVE SITE! Type "DELETE PRODUCTION DATA" to confirm: ');
    
    if (answer2.trim() !== 'DELETE PRODUCTION DATA') {
      console.log('\n❌ Operation cancelled. No data was deleted.\n');
      rl.close();
      return;
    }

    const answer3 = await askQuestion('\n❓ FINAL WARNING: Are you ABSOLUTELY SURE? Type "YES DELETE EVERYTHING": ');
    
    if (answer3.trim() !== 'YES DELETE EVERYTHING') {
      console.log('\n❌ Operation cancelled. No data was deleted.\n');
      rl.close();
      return;
    }

    // Step 3: Clear data
    await clearData();

    console.log('\n✅ Done! Your PRODUCTION database is now empty.\n');
    console.log('🌐 Your live site will now show no data.\n');

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    console.error('\nPlease check your database connection and try again.\n');
  } finally {
    rl.close();
  }
}

// Run the script
main();
