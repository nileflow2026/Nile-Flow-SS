/**
 * Nile Flow — API v1 Router
 *
 * Consolidated, versioned API routes for the platform.
 *
 * These routes are the primary interface for clients going forward.
 * Existing /api/* routes remain active for backwards compatibility
 * during the migration period.
 *
 * Mount in index.js:
 *   const v1Router = require('./routes/v1');
 *   app.use('/api/v1', v1Router);
 */

"use strict";

const { Router } = require("express");
const router = Router();

// ── Middleware ────────────────────────────────────────────────────────────────

const authenticateToken = require("../middleware/authMiddleware");

// Optional auth — attaches req.user if a valid token is present; does NOT block unauthenticated requests
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // No token — guest request, proceed
  }
  // Delegate to the real middleware; if it fails, we still want to proceed as guest
  authenticateToken(req, res, (err) => {
    if (err) {
      // Invalid token — treat as guest, don't error
      req.user = null;
    }
    next();
  });
};

// ── Controllers ───────────────────────────────────────────────────────────────

const { getHomeFeed } = require("../controllers/v1/homeFeedController");

// ── Cache middleware factory ──────────────────────────────────────────────────

const { cacheMiddleware } = require("../src/lib/cache/cacheClient");
const { CacheKeys, TTL } = require("../src/lib/cache/cacheKeys");

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/home-feed
 * Orchestrated homepage payload. Optional auth for personalised data.
 */
router.get("/home-feed", optionalAuth, getHomeFeed);

/**
 * GET /api/v1/health
 * Liveness check for load balancers / uptime monitors.
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/cache/stats
 * Internal — returns cache hit/miss counters.
 * Restricted to admin JWT in production.
 */
router.get("/cache/stats", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    const authHeader = req.headers.authorization || "";
    const adminKey = process.env.INTERNAL_METRICS_KEY;
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
  }

  const { getStats } = require("../src/lib/cache/cacheClient");
  res.json({ success: true, data: getStats() });
});

module.exports = router;
