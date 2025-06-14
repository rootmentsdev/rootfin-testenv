import fs from 'fs';
import dotenv from 'dotenv';
import cors from 'cors';
import express from 'express';
import cookieParser from 'cookie-parser';
import connectMongoDB from './db/database.js';
import UserRouter from './route/LoginRoute.js';
import setupSwagger from './swagger.js';
import TwsRoutes from './route/TwsRoutes.js';
import OverrideRoutes from './route/OverrideRoute.js';
import './cronScheduler.js';  // Import the cron job file so it starts running



// 1️⃣ Determine the environment and load the correct .env file
const env = process.env.NODE_ENV || 'development';
const envFile = `.env.${env}`;

if (fs.existsSync(envFile)) {
  dotenv.config({ path: envFile });
  console.log(`🛠️ Loaded environment config from ${envFile}`);
} else {
  console.warn(`⚠️ ${envFile} not found. Falling back to default .env`);
  dotenv.config(); // fallback to generic .env
}

const app = express();
setupSwagger(app);

// 2️⃣ Define port
const port = process.env.PORT || 7000;

// 3️⃣ Middleware
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(
  cors({
    origin: [
      'http://localhost:5173/',
      'http://localhost:3000',
      'https://rootfin.vercel.app',
      'https://rootfin.rootments.live',
      'https://rootfin-testenv-clab.vercel.app',
    ],
    credentials: true,
  })
);

// 4️⃣ Routes
app.get('/', (req, res) => {
  res.send('App is running');
});
app.use('/user', UserRouter);

app.use('/api/overrides', OverrideRoutes);


// mount your routes
app.use('/api/tws', TwsRoutes); // ✅ correct


// 5️⃣ Start server
app.listen(port, () => {
  connectMongoDB(env); // pass env to DB handler
  console.log(`🚀 Server running on port ${port}`);
});