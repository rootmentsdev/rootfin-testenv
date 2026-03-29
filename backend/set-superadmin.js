import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';

const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;
if (fs.existsSync(envFile)) dotenv.config({ path: envFile });

const dbURI = process.env.MONGODB_URI_DEV || process.env.MONGODB_URI;

const userSchema = new mongoose.Schema({
  email: String,
  power: String,
});
const User = mongoose.model('User', userSchema);

async function run() {
  await mongoose.connect(dbURI);
  console.log('✅ Connected to MongoDB');

  const email = 'officerootments@gmail.com'; // change if needed
  const result = await User.updateOne({ email }, { $set: { power: 'superadmin' } });

  if (result.modifiedCount > 0) {
    console.log(`✅ User "${email}" updated to superadmin`);
  } else {
    console.log(`⚠️ No user found with email "${email}" or already superadmin`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => { console.error(err); process.exit(1); });
