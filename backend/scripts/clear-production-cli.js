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

// Production database connection
const connectionString = process.env.DATABASE_URL || 
  `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=require`;

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
    console.log('\n🔌 Connecting to production database...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📊 Current data in tables:\n');
    console.log('─'.repeat(60));
    console.log('Table Name'.padEnd(30) + 'Row Count'.padEnd(15) + 'Size');
    console.log('─'.repeat(60));

    const tables = [
      'SalesInvoices',
      'Transactions',
      'InventoryAdjustments',
      'TransferOrders',
      'StoreOrders',
      'VendorCredits',
      'VendorHistories',
      'Vendors',
      'SalesPersons',
      'Stores',
      'Users'
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
        console.log(table.padEnd(30) + 'Table not found or error');
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
    console.log('\n🔌 Connecting to production database...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('🗑️  Clearing all data...\n');

    // Disable foreign key checks
    await client.query("SET session_replication_role = 'replica'");

    const tables = [
      'SalesInvoices',
      'Transactions',
      'InventoryAdjustments',
      'TransferOrders',
      'StoreOrders',
      'VendorCredits',
      'VendorHistories',
      'Vendors',
      'SalesPersons',
      'Stores',
      'Users'
    ];

    for (const table of tables) {
      try {
        await client.query(`TRUNCATE TABLE "${table}" CASCADE`);
        console.log(`   ✅ Cleared ${table}`);
      } catch (err) {
        console.log(`   ⚠️  ${table}: ${err.message}`);
      }
    }

    // Re-enable foreign key checks
    await client.query("SET session_replication_role = 'origin'");

    console.log('\n✅ All data cleared successfully!\n');

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
  console.log('🗑️  CLEAR PRODUCTION DATABASE DATA');
  console.log('='.repeat(60));
  console.log('\n⚠️  WARNING: This will permanently delete ALL data!');
  console.log('⚠️  There is NO UNDO!\n');

  try {
    // Step 1: Check current data
    const totalRows = await checkData();

    if (totalRows === 0) {
      console.log('✅ Database is already empty. Nothing to clear.\n');
      rl.close();
      return;
    }

    // Step 2: Confirm deletion
    const answer1 = await askQuestion('\n❓ Do you want to DELETE all this data? (yes/no): ');
    
    if (answer1.toLowerCase() !== 'yes') {
      console.log('\n❌ Operation cancelled. No data was deleted.\n');
      rl.close();
      return;
    }

    const answer2 = await askQuestion('\n❓ Are you ABSOLUTELY SURE? Type "DELETE ALL DATA" to confirm: ');
    
    if (answer2 !== 'DELETE ALL DATA') {
      console.log('\n❌ Operation cancelled. No data was deleted.\n');
      rl.close();
      return;
    }

    // Step 3: Clear data
    await clearData();

    console.log('\n✅ Done! Your production database is now empty.\n');

  } catch (error) {
    console.error('\n❌ Failed:', error.message);
    console.error('\nPlease check your database connection and try again.\n');
  } finally {
    rl.close();
  }
}

// Run the script
main();
