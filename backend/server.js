// // backend/server.js
// import express        from "express";
// import cookieParser   from "cookie-parser";
// import cors           from "cors";
// import dotenv         from "dotenv";
// import fs             from "fs";

// import connectMongoDB from "./db/database.js";
// import UserRouter     from "./route/LoginRoute.js";
// import TwsRoutes      from "./route/TwsRoutes.js";
// import setupSwagger   from "./swagger.js";

// const env     = process.env.NODE_ENV || "development";
// const envFile = `.env.${env}`;
// fs.existsSync(envFile) ? dotenv.config({ path: envFile }) : dotenv.config();

// const app  = express();
// const PORT = process.env.PORT || 7000;

// setupSwagger(app);

// // ── middleware ──────────────────────────────────────────────
// // 🛠️ Increase body size limit for large base64 attachments
// app.use(express.json({ limit: "10mb" }));
// app.use(express.urlencoded({ extended: true, limit: "10mb" }));
// app.use(cookieParser());

// app.use(
//   cors({
//     origin: [
//       "http://localhost:5173",
//       "http://localhost:3000",
//       "https://rootfin.vercel.app",
//       "https://rootfin.rootments.live",
//       "https://rootfin-testenv-clab.vercel.app",
//       "https://rootfin-testenv-3.onrender.com",
//       "https://rootfin-testenv-ebb5.onrender.com",
//       "https://api.rootments.live",
//     ],
//     credentials: true,
//   })
// );

// // ── routes ──────────────────────────────────────────────────
// app.get("/", (_req, res) => res.send("App is running on AWS"));

// app.use("/user",    UserRouter);
// app.use("/api/tws", TwsRoutes);

// // ── start server ────────────────────────────────────────────
// app.listen(PORT, () => {
//   connectMongoDB(env);
//   console.log(`🚀  Server listening on :${PORT}`);
// });

// console.log("Auto-deploy test at " + new Date());

// backend/server.js
import express        from "express";
import cookieParser   from "cookie-parser";
import cors           from "cors";
import dotenv         from "dotenv";
import fs             from "fs";

import connectMongoDB from "./db/database.js";
import UserRouter     from "./route/LoginRoute.js";
import TwsRoutes      from "./route/TwsRoutes.js";
import MergRoutes     from "./route/MergRoutes.js";   // ⬅️ ADDED
import setupSwagger   from "./swagger.js";

const env     = process.env.NODE_ENV || "development";
const envFile = `.env.${env}`;
fs.existsSync(envFile) ? dotenv.config({ path: envFile }) : dotenv.config();

const app  = express();
const PORT = process.env.PORT || 7000;

setupSwagger(app);

// ── middleware ──────────────────────────────────────────────
// Bigger limits for base64 attachments
app.use(express.json({ limit: "25mb" }));                    // ⬅️ was 10mb
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:3000",
      "https://rootfin.vercel.app",
      "https://rootfin.rootments.live",
      "https://rootfin-testenv-clab.vercel.app",
      "https://rootfin-testenv-3.onrender.com",
      "https://rootfin-testenv-ebb5.onrender.com",
      "https://api.rootments.live",
    ],
    credentials: true,
    methods: ["GET","POST","PUT","PATCH","DELETE","OPTIONS"],
    allowedHeaders: ["Content-Type","Authorization","X-Requested-With"],
  })
);
// handle preflight
app.options("*", cors());

// ── routes ──────────────────────────────────────────────────
app.get("/", (_req, res) => res.send("App is running on AWS"));

app.use("/user",    UserRouter);
app.use("/api/tws", TwsRoutes);
app.use("/api",     MergRoutes);                            // ⬅️ ADDED (exposes /api/createPayment etc.)

// optional 404 for unknown API routes (helps debug)
app.use((req, res, next) => {
  if (req.path.startsWith("/api") || req.path.startsWith("/user")) {
    return res.status(404).json({ message: "Route not found" });
  }
  next();
});

// global error handler → return JSON instead of empty 500
app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return;
  res.status(500).json({ message: "Server error", error: err.message });
});

// ── start server ────────────────────────────────────────────
app.listen(PORT, () => {
  connectMongoDB(env);
  console.log(`🚀  Server listening on :${PORT}`);
});

console.log("Auto-deploy test at " + new Date());
