import { Sequelize } from 'sequelize';
import dotenv from 'dotenv';
import fs from 'fs';

// 🔁 Load correct .env file based on env
const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
}

// Get PostgreSQL connection details from environment variables
const getPostgresConfig = () => {
  if (env === 'production') {
    return {
      database: process.env.POSTGRES_DB_PROD || process.env.POSTGRES_DB,
      username: process.env.POSTGRES_USER_PROD || process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD_PROD || process.env.POSTGRES_PASSWORD,
      host: process.env.POSTGRES_HOST_PROD || process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT_PROD || process.env.POSTGRES_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.POSTGRES_LOGGING === 'true' ? console.log : false,
    };
  } else {
    // Development configuration
    return {
      database: process.env.POSTGRES_DB_DEV || process.env.POSTGRES_DB || 'rootfin_dev',
      username: process.env.POSTGRES_USER_DEV || process.env.POSTGRES_USER || 'postgres',
      password: process.env.POSTGRES_PASSWORD_DEV || process.env.POSTGRES_PASSWORD || 'postgres',
      host: process.env.POSTGRES_HOST_DEV || process.env.POSTGRES_HOST || 'localhost',
      port: process.env.POSTGRES_PORT_DEV || process.env.POSTGRES_PORT || 5432,
      dialect: 'postgres',
      logging: process.env.POSTGRES_LOGGING === 'true' ? console.log : false,
      // Development-specific options
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    };
  }
};

// Alternative: Use connection URI if provided
const getConnectionUri = () => {
  if (env === 'production') {
    return process.env.POSTGRES_URI_PROD || process.env.DATABASE_URL;
  } else {
    return process.env.POSTGRES_URI_DEV || process.env.DATABASE_URL;
  }
};

// Initialize Sequelize instance
let sequelize;

const initializePostgres = () => {
  const connectionUri = getConnectionUri();
  
  if (connectionUri) {
    // Use connection URI (common for cloud providers like Heroku, Render, etc.)
    sequelize = new Sequelize(connectionUri, {
      dialect: 'postgres',
      logging: process.env.POSTGRES_LOGGING === 'true' ? console.log : false,
      dialectOptions: {
        ssl: env === 'production' ? {
          require: true,
          rejectUnauthorized: false,
        } : false,
      },
      pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000,
      },
    });
  } else {
    // Use individual connection parameters
    const config = getPostgresConfig();
    sequelize = new Sequelize(
      config.database,
      config.username,
      config.password,
      {
        host: config.host,
        port: config.port,
        dialect: config.dialect,
        logging: config.logging,
        pool: config.pool,
      }
    );
  }

  return sequelize;
};

// Connect to PostgreSQL database
const connectPostgreSQL = async () => {
  try {
    if (!sequelize) {
      sequelize = initializePostgres();
    }

    await sequelize.authenticate();
    console.log(`✅ PostgreSQL connected [${env}]`);
    console.log(`📊 Database: ${sequelize.getDatabaseName()}`);
    
    // Sync models (set to false in production, use migrations instead)
    if (env === 'development' && process.env.SYNC_DB === 'true') {
      console.log('🔄 Syncing database models...');
      await sequelize.sync({ alter: false }); // Use migrations in production
      console.log('✅ Database models synced');
    }
    
    return sequelize;
  } catch (error) {
    console.error('❌ PostgreSQL connection error:', error.message);
    console.error('💡 Make sure PostgreSQL is running and credentials are correct');
    process.exit(1);
  }
};

// Get the Sequelize instance (for model definitions)
const getSequelize = () => {
  if (!sequelize) {
    sequelize = initializePostgres();
  }
  return sequelize;
};

export { connectPostgreSQL, getSequelize, initializePostgres };
// Default export returns the Sequelize instance getter
export default getSequelize;

