import pkg from 'pg';
const { Client } = pkg;
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

async function checkData() {
  const client = new Client({ connectionString });
  
  try {
    console.log('\n🔌 Connecting to production database...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📊 Current data in tables:\n');
    console.log('─'.repeat(70));
    console.log('Table Name'.padEnd(30) + 'Row Count'.padEnd(20) + 'Size');
    console.log('─'.repeat(70));

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
        
        const countStr = count.toString().padEnd(20);
        console.log(table.padEnd(30) + countStr + size);
      } catch (err) {
        console.log(table.padEnd(30) + 'Table not found or error');
      }
    }

    console.log('─'.repeat(70));
    console.log(`\nTotal rows across all tables: ${totalRows}\n`);

    if (totalRows === 0) {
      console.log('✅ Database is empty - ready for production!\n');
    } else {
      console.log('⚠️  Database contains test data.\n');
      console.log('💡 To clear this data, run: npm run clear-production\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nConnection details:');
    console.error('- Make sure your .env.development file has correct DB credentials');
    console.error('- Check that your database is accessible\n');
    throw error;
  } finally {
    await client.end();
  }
}

// Run the script
checkData().catch(err => {
  console.error('Failed to check data:', err.message);
  process.exit(1);
});
