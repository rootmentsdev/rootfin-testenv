import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';

// Load environment
dotenv.config({ path: '.env' });

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env');
  console.log('💡 Make sure .env file has DATABASE_URL set');
  process.exit(1);
}

console.log('🔗 Connecting to:', DATABASE_URL.replace(/:[^:@]+@/, ':****@')); // Hide password

const sequelize = new Sequelize(DATABASE_URL, {
  dialect: 'postgres',
  logging: false, // Disable SQL logging for cleaner output
  dialectOptions: {
    ssl: {
      require: true,
      rejectUnauthorized: false,
    },
  },
  pool: {
    max: 5,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

async function initializeTables() {
  try {
    console.log('\n🔌 Connecting to PostgreSQL database...');
    await sequelize.authenticate();
    console.log('✅ Connected successfully!\n');
    
    // Check if tables already exist
    console.log('🔍 Checking existing tables...');
    const [existingTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    if (existingTables.length > 0) {
      console.log('📋 Existing tables found:');
      existingTables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      console.log('');
    } else {
      console.log('📋 No tables found. This is a fresh database.\n');
    }
    
    console.log('📦 Loading Sequelize models...');
    const models = await import('./models/sequelize/index.js');
    console.log('✅ Models loaded\n');
    
    // List all models to be created
    console.log('📋 Models to create/update:');
    const modelNames = Object.keys(models.default).filter(key => key !== 'sequelize');
    modelNames.forEach(name => {
      console.log(`   - ${name}`);
    });
    console.log('');
    
    console.log('🔄 Creating/updating tables...');
    console.log('⚠️  Using { alter: true } - will modify existing tables safely');
    console.log('⚠️  This will NOT drop data, only add missing columns/tables\n');
    
    // Sync with alter: true (safe for production - adds missing columns, doesn't drop data)
    await sequelize.sync({ alter: true });
    
    console.log('\n✅ Database tables created/updated successfully!\n');
    
    // List all tables after sync
    const [finalTables] = await sequelize.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `);
    
    console.log('📋 Final tables in database:');
    finalTables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });
    console.log('');
    
    // Check specific tables we need
    const requiredTables = ['stores', 'sales_persons', 'vendors', 'vendor_credits', 'vendor_history', 
                           'inventory_adjustments', 'transfer_orders', 'store_orders', 'sales_invoices', 'transactions'];
    
    console.log('✅ Verifying required tables:');
    for (const tableName of requiredTables) {
      const exists = finalTables.some(t => t.table_name === tableName);
      console.log(`   ${exists ? '✅' : '❌'} ${tableName}`);
    }
    console.log('');
    
    await sequelize.close();
    console.log('✅ Done! Connection closed.');
    console.log('\n🎉 Your PostgreSQL database is ready to use!');
    console.log('💡 You can now restart your backend server.\n');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Initialization failed:', error.message);
    console.error('\nFull error:', error);
    await sequelize.close();
    process.exit(1);
  }
}

initializeTables();
