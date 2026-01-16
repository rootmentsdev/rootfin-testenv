import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.development') });

// LOCAL database connection (development)
const connectionString = `postgresql://${process.env.POSTGRES_USER_DEV}:${process.env.POSTGRES_PASSWORD_DEV}@${process.env.POSTGRES_HOST_DEV}:${process.env.POSTGRES_PORT_DEV}/${process.env.POSTGRES_DB_DEV}`;

async function checkData() {
  const client = new Client({ connectionString });
  
  try {
    console.log('\n🔌 Connecting to LOCAL development database...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📊 Current data in LOCAL database:\n');
    console.log('─'.repeat(70));
    console.log('Table Name'.padEnd(30) + 'Row Count'.padEnd(20) + 'Size');
    console.log('─'.repeat(70));

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

    console.log('─'.repeat(70));
    console.log(`\nTotal rows across all tables: ${totalRows}\n`);

    if (totalRows === 0) {
      console.log('✅ Local database is empty!\n');
    } else {
      console.log('⚠️  Local database contains test data.\n');
      console.log('💡 To clear this data, run: npm run clear-local\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nConnection details:');
    console.error(`- Host: ${process.env.POSTGRES_HOST_DEV}`);
    console.error(`- Port: ${process.env.POSTGRES_PORT_DEV}`);
    console.error(`- Database: ${process.env.POSTGRES_DB_DEV}`);
    console.error(`- User: ${process.env.POSTGRES_USER_DEV}`);
    console.error('\nMake sure PostgreSQL is running locally!\n');
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
