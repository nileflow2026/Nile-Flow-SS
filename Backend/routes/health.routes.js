// routes/health.routes.js
const express = require("express");
const AppwriteSessionService = require("../services/AppwriteSessionService");
const { runDeepHealth } = require("../src/observability/healthDeep");
const router = express.Router();

// ── Simple health check (always returns 200 if server is running) ────────────

router.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "nile-flow-backend",
    uptime: process.uptime(),
    version: process.env.APP_VERSION || "unknown",
  });
});

// ── Appwrite connectivity check ──────────────────────────────────────────────

router.get("/health/appwrite", async (req, res) => {
  try {
    await AppwriteSessionService.ensureConnected();
    const users = await AppwriteSessionService.getUsers();
    const userCount = await users.list([], 1);

    res.json({
      status: "connected",
      appwrite: "healthy",
      users: userCount.total,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      appwrite: "disconnected",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// ── Deep health check (all critical dependencies) ────────────────────────────

router.get("/health/deep", async (req, res) => {
  try {
    const health = await runDeepHealth();
    const statusCode = health.status === "healthy" ? 200 : 503;
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

module.exports = router;
