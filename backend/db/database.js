import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

// 🔁 Load correct .env file based on env (only if not loaded already by server.js)
const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;
if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
}

const connectMongoDB = async () => {
  const dbURI =
    env === 'production'
      ? process.env.MONGODB_URI_PROD
      : process.env.MONGODB_URI_DEV;

  if (!dbURI) {
    console.error('❌ MONGODB_URI is not defined in environment file.');
    process.exit(1);
  }

  // 🛑 Safety check: Prevent connecting to production DB locally
  if (env !== 'production' && dbURI.includes('rootfin.onrender.com')) {
    console.warn('❌ Aborting: Trying to connect to production DB from non-production env.');
    process.exit(1);
  }

  try {
    await mongoose.connect(dbURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`✅ MongoDB connected [${env}]`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

export default connectMongoDB;