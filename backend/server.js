// server.js - Khalil's Core API (Port 3000)
// Main entry point for all client requests

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import morgan from "morgan";

// Import routes
import authRoutes from "./routes/authRoutes.js";
import fileRoutes from "./routes/fileRoutes.js";
import analysisRoutes from "./routes/analysisRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import glossaryRoutes from "./routes/glossaryRoutes.js";
import healthRoutes from "./routes/healthRoutes.js";

// Import error handler
import errorHandler from "./middleware/errorHandler.js";

dotenv.config();

// ---- App setup -------------------------------------------------------------
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/statsmate";

// ---- Middleware ------------------------------------------------------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev")); // Request logging

// ---- Database connection ---------------------------------------------------
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log("✅ MongoDB connected successfully"))
  .catch((err) => {
    console.error("❌ MongoDB connection error:", err);
    process.exit(1);
  });

// ---- Routes ----------------------------------------------------------------
app.use("/api/auth", authRoutes);
app.use("/api", fileRoutes);
app.use("/api", analysisRoutes);
app.use("/api", resultRoutes);
app.use("/api", glossaryRoutes);
app.use("/api", healthRoutes);

// ---- Root endpoint ---------------------------------------------------------
app.get("/", (req, res) => {
  res.json({
    message: "StatsMate Core API",
    version: "1.0.0",
    endpoints: {
      auth: "/api/auth",
      files: "/api/files",
      upload: "/api/upload",
      analyze: "/api/analyze",
      results: "/api/result/:id",
      glossary: "/api/glossary/:term",
      health: "/api/health"
    }
  });
});

// ---- Error handler (must be LAST) -----------------------------------------
app.use(errorHandler);

// ---- Start server ----------------------------------------------------------
app.listen(PORT, "0.0.0.0", () => {
  console.log(`🚀 Core API running on http://0.0.0.0:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
});

