import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env.development') });

// Try the production database from .env.development
const connectionString = `postgresql://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_NAME}?sslmode=require`;

async function checkData() {
  const client = new Client({ connectionString });
  
  try {
    console.log('\n🔌 Connecting to ACTUAL production database...');
    console.log(`📍 Host: ${process.env.DB_HOST}`);
    console.log(`📍 Database: ${process.env.DB_NAME}\n`);
    
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📊 Current data in PRODUCTION database:\n');
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
        
        const countStr = count.toString().padEnd(20);
        console.log(table.padEnd(30) + countStr + size);
      } catch (err) {
        console.log(table.padEnd(30) + 'Table not found');
      }
    }

    console.log('─'.repeat(70));
    console.log(`\nTotal rows across all tables: ${totalRows}\n`);

    if (totalRows === 0) {
      console.log('✅ Production database is empty - ready for launch!\n');
    } else {
      console.log('⚠️  Production database contains data.\n');
      console.log('💡 This is the data your live site is using!\n');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('\nConnection details:');
    console.error(`- Host: ${process.env.DB_HOST}`);
    console.error(`- Port: ${process.env.DB_PORT}`);
    console.error(`- Database: ${process.env.DB_NAME}`);
    console.error(`- User: ${process.env.DB_USER}`);
    console.error('\nMake sure the database is accessible!\n');
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
