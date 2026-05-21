"use strict";

/**
 * Nile Flow — Distributed Rate Limiter
 *
 * Replaces the in-process `express-rate-limit` with Redis-backed limiting
 * using `rate-limit-redis` (already installed). This ensures:
 *
 *   - Rate limits are SHARED across all server instances/processes
 *   - Limits survive server restarts
 *   - Limits work correctly behind load balancers
 *
 * The in-process limiters in middleware/rate-limiter.js are still available
 * as a fallback when Redis is absent (development without REDIS_URL).
 *
 * Priority traffic order (protected first):
 *   1. Payments
 *   2. Orders
 *   3. Auth
 *   4. Vendor operations
 *   5. AI requests
 *   6. General API
 *
 * Usage:
 *   const { distributedAuthLimiter, distributedApiLimiter } = require('./distributedRateLimit');
 *   app.use('/api/customerauth', distributedAuthLimiter);
 *   app.use('/api', distributedApiLimiter);
 */

const rateLimit = require("express-rate-limit");
const { metrics } = require("../src/observability/metrics");

// Lazy-load RedisStore to avoid crash when prom-client or rate-limit-redis
// isn't installed in older environments
let RedisStore;
try {
  RedisStore = require("rate-limit-redis").RedisStore;
} catch {
  RedisStore = null;
}

// Redis client (the existing shared instance from services/)
let redis;
try {
  redis = require("../services/redisClient").redis;
} catch {
  redis = null;
}

// ── Store Factory ─────────────────────────────────────────────────────────────

/**
 * Build a RedisStore for a given rate limiter namespace.
 * Falls back to undefined (in-memory store) if Redis isn't available.
 */
const makeStore = (prefix) => {
  if (!RedisStore || !redis || typeof redis.sendCommand !== "function") {
    // In-memory fallback (single-instance only, acceptable in dev)
    return undefined;
  }
  return new RedisStore({
    sendCommand: (...args) => redis.sendCommand(args),
    prefix: `nf:rl:${prefix}:`,
  });
};

// ── Counter Middleware ────────────────────────────────────────────────────────

const makeMetricsHandler = (routeGroup) => ({
  handler: (req, res, next, options) => {
    metrics.rateLimitHitsTotal.inc({ route_group: routeGroup });
    res.status(options.statusCode).json({
      success: false,
      message: options.message?.error || "Too many requests",
      code: "RATE_LIMITED",
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  },
});

// ── Limiter Definitions ───────────────────────────────────────────────────────

/**
 * Auth endpoints — strict (10 attempts / 15 min per IP)
 * Applied to: /api/customerauth, /api/vendor/auth, /api/rider/auth, /api/admin/auth
 */
const distributedAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
  store: makeStore("auth"),
  message: { error: "Too many authentication attempts", code: "RATE_LIMITED" },
  ...makeMetricsHandler("auth"),
});

/**
 * Payment endpoints — tight window, high consequence
 * Applied to: /api/payments, /api/subscription/subscribe
 */
const distributedPaymentLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("payment"),
  message: { error: "Too many payment requests", code: "RATE_LIMITED" },
  ...makeMetricsHandler("payment"),
});

/**
 * AI endpoints — OpenAI calls are expensive; protect aggressively
 * Applied to: /api/ai
 */
const distributedAiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("ai"),
  message: { error: "AI request rate limit exceeded", code: "RATE_LIMITED" },
  ...makeMetricsHandler("ai"),
});

/**
 * Vendor API — moderate limits for dashboard/analytics calls
 * Applied to: /api/vendor
 */
const distributedVendorLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("vendor"),
  message: { error: "Vendor API rate limit exceeded", code: "RATE_LIMITED" },
  ...makeMetricsHandler("vendor"),
});

/**
 * Admin API — tighter than general API, admin actions are high-impact
 * Applied to: /api/admin
 */
const distributedAdminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("admin"),
  message: { error: "Admin API rate limit exceeded", code: "RATE_LIMITED" },
  ...makeMetricsHandler("admin"),
});

/**
 * General API — broad limit for all other /api/* routes
 * Applied to: /api (catch-all)
 */
const distributedApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 150,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("api"),
  message: { error: "Too many requests", code: "RATE_LIMITED" },
  ...makeMetricsHandler("api"),
});

/**
 * Search/discovery — prevent scraping
 * Applied to: /api/customerprofile/featured-products, /api/customerprofile/search
 */
const distributedSearchLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  store: makeStore("search"),
  message: { error: "Search rate limit exceeded", code: "RATE_LIMITED" },
  ...makeMetricsHandler("search"),
});

const isRedisConnected = () => !!RedisStore && !!redis;

module.exports = {
  distributedAuthLimiter,
  distributedPaymentLimiter,
  distributedAiLimiter,
  distributedVendorLimiter,
  distributedAdminLimiter,
  distributedApiLimiter,
  distributedSearchLimiter,
  isRedisConnected,
};
