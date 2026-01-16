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

async function listAllTables() {
  const client = new Client({ connectionString });
  
  try {
    console.log('\n🔌 Connecting to LOCAL development database...\n');
    await client.connect();
    console.log('✅ Connected!\n');

    console.log('📊 All tables in database:\n');
    console.log('─'.repeat(70));
    console.log('Table Name'.padEnd(40) + 'Row Count');
    console.log('─'.repeat(70));

    // Get all tables
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);

    let totalRows = 0;

    for (const row of result.rows) {
      const tableName = row.table_name;
      try {
        const countResult = await client.query(`SELECT COUNT(*) as count FROM "${tableName}"`);
        const count = parseInt(countResult.rows[0].count);
        totalRows += count;
        console.log(tableName.padEnd(40) + count.toString());
      } catch (err) {
        console.log(tableName.padEnd(40) + 'Error counting');
      }
    }

    console.log('─'.repeat(70));
    console.log(`\nTotal rows across all tables: ${totalRows}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the script
listAllTables().catch(err => {
  console.error('Failed:', err.message);
  process.exit(1);
});
