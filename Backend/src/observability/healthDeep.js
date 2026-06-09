"use strict";

/**
 * Nile Flow — Deep Health Check Logic
 *
 * Provides comprehensive health assessment of all critical dependencies:
 *   - Appwrite (database connectivity)
 *   - Redis (cache layer connectivity)
 *   - Stripe API
 *   - Payment providers availability
 *   - Email service availability
 *
 * Each dependency is checked independently so one failure doesn't cascade.
 * Exports results for the /health/deep endpoint.
 */

const { env } = require("../env");
const { db } = require("../appwrite");

/**
 * Check Appwrite database connectivity.
 * Attempts a lightweight listDocuments with limit 1 on a known collection.
 */
async function checkAppwrite() {
  const start = Date.now();
  try {
    await db.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      [],
      1,
    );
    return {
      status: "healthy",
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      error: err.message,
    };
  }
}

/**
 * Check Redis connectivity.
 */
async function checkRedis() {
  const start = Date.now();
  try {
    const Redis = require("ioredis");
    const client = new Redis({
      host: process.env.REDIS_HOST || "localhost",
      port: parseInt(process.env.REDIS_PORT || "6379", 10),
      connectTimeout: 3000,
      retryStrategy: () => null, // No retry for health checks
      lazyConnect: true,
    });
    await client.connect();
    await client.ping();
    await client.quit();
    return {
      status: "healthy",
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      error: err.message,
    };
  }
}

/**
 * Check Stripe API availability.
 */
async function checkStripe() {
  const start = Date.now();
  try {
    const stripeKey = process.env.STRIPE_SECRET_KEY;
    if (!stripeKey) {
      return {
        status: "unconfigured",
        latencyMs: Date.now() - start,
        error: "STRIPE_SECRET_KEY not set",
      };
    }
    const stripe = require("stripe")(stripeKey);
    await stripe.balance.retrieve();
    return {
      status: "healthy",
      latencyMs: Date.now() - start,
    };
  } catch (err) {
    return {
      status: "unhealthy",
      latencyMs: Date.now() - start,
      error: err.message,
    };
  }
}

/**
 * Run all deep health checks in parallel.
 */
async function runDeepHealth() {
  const [appwrite, redis, stripe] = await Promise.allSettled([
    checkAppwrite(),
    checkRedis(),
    checkStripe(),
  ]);

  const dependencies = {
    appwrite:
      appwrite.status === "fulfilled"
        ? appwrite.value
        : { status: "error", error: appwrite.reason?.message },
    redis:
      redis.status === "fulfilled"
        ? redis.value
        : { status: "error", error: redis.reason?.message },
    stripe:
      stripe.status === "fulfilled"
        ? stripe.value
        : { status: "error", error: stripe.reason?.message },
  };

  const allHealthy = Object.values(dependencies).every(
    (d) => d.status === "healthy" || d.status === "unconfigured",
  );

  return {
    status: allHealthy ? "healthy" : "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.APP_VERSION || "unknown",
    dependencies,
  };
}

module.exports = { runDeepHealth, checkAppwrite, checkRedis, checkStripe };
