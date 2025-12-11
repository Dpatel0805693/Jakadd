// routes/healthRoutes.js
// Health check endpoints for monitoring

import express from "express";
import mongoose from "mongoose";
import axios from "axios";

const router = express.Router();

const INTEGRATION_API_URL =
  process.env.INTEGRATION_API_URL || "http://localhost:5001";

// GET /api/health - Basic health check
router.get("/health", (req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
  };

  const statusCode = health.database === "connected" ? 200 : 503;
  res.status(statusCode).json(health);
});

// GET /api/health/detailed - Detailed health check including dependencies
router.get("/health/detailed", async (req, res) => {
  const health = {
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    services: {
      api: "ok",
      database: mongoose.connection.readyState === 1 ? "ok" : "error",
      integration: "unknown",
    },
  };

  // Check Integration API
  try {
    await axios.get(`${INTEGRATION_API_URL}/integrate/health`, {
      timeout: 3000,
    });
    health.services.integration = "ok";
  } catch (error) {
    health.services.integration = "error";
    health.status = "degraded";
  }

  // Determine overall status
  if (health.services.database === "error") {
    health.status = "error";
  } else if (health.services.integration === "error") {
    health.status = "degraded";
  }

  const statusCode = health.status === "ok" ? 200 : health.status === "degraded" ? 200 : 503;
  res.status(statusCode).json(health);
});

export default router;
