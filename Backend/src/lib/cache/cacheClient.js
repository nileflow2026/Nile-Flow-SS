/**
 * Nile Flow — Cache Client
 *
 * Thin wrapper around the existing Redis client (services/redisClient.js)
 * that adds:
 *   - get / set / del with JSON serialisation
 *   - getOrSet (cache-aside pattern)
 *   - tag-based invalidation helpers
 *   - cache hit/miss counters (logged via logger + Prometheus metrics)
 *
 * Phase 9: Added Prometheus metrics integration for cache operations.
 *
 * All callers should import from here, not from services/redisClient directly,
 * unless they need the raw Redis client for auth token operations.
 */

"use strict";

const { redis } = require("../../../services/redisClient");
const { logger } = require("../logger");

// ── Prometheus metrics integration ──────────────────────────────────────────

let cacheHitsCounter,
  cacheMissesCounter,
  cacheErrorsCounter,
  cacheDurationHistogram;

try {
  const { metrics } = require("../../observability/metrics");
  cacheHitsCounter = metrics.cacheHitsTotal;
  cacheMissesCounter = metrics.cacheMissesTotal;
  cacheErrorsCounter = metrics.cacheErrorsTotal;
  cacheDurationHistogram = metrics.cacheOperationDuration;
} catch (err) {
  // Metrics unavailable — use no-op stubs
  cacheHitsCounter = { inc: () => {} };
  cacheMissesCounter = { inc: () => {} };
  cacheErrorsCounter = { inc: () => {} };
  cacheDurationHistogram = { observe: () => {} };
}

// ── Instrumentation counters (in-process, lightweight) ──────────────────────

let hits = 0;
let misses = 0;
let errors = 0;

function getStats() {
  return { hits, misses, errors };
}

/**
 * Extract a key prefix for metrics labeling (e.g., "nf:auth:" -> "auth").
 */
function extractKeyPrefix(key) {
  if (!key || typeof key !== "string") return "unknown";
  const parts = key.split(":");
  return parts.length >= 2 ? parts[1] : "other";
}

// ── Core operations ──────────────────────────────────────────────────────────

/**
 * Get a cached value. Returns parsed JSON or null on miss/error.
 * @param {string} key
 * @returns {Promise<any>}
 */
async function cacheGet(key) {
  const endTimer = cacheDurationHistogram.startTimer({ operation: "get" });
  try {
    const raw = await redis.get(key);
    if (raw === null) {
      misses++;
      cacheMissesCounter.inc({ key_prefix: extractKeyPrefix(key) });
      endTimer();
      return null;
    }
    hits++;
    cacheHitsCounter.inc({ key_prefix: extractKeyPrefix(key) });
    endTimer();
    return JSON.parse(raw);
  } catch (err) {
    errors++;
    cacheErrorsCounter.inc();
    endTimer();
    logger.warn("Cache GET error", { meta: { key, error: err.message } });
    return null;
  }
}

/**
 * Set a cache value with TTL.
 * @param {string} key
 * @param {any} value  — will be JSON-serialised
 * @param {number} ttlSeconds
 * @param {string[]} [tags]  — optional tag set keys for bulk invalidation
 */
async function cacheSet(key, value, ttlSeconds, tags = []) {
  const endTimer = cacheDurationHistogram.startTimer({ operation: "set" });
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);

    // Register key under each tag for bulk invalidation
    if (tags.length > 0) {
      const tagOps = tags.map(async (tag) => {
        const tagKey = `nf:tags:${tag}`;
        const existing = await redis.get(tagKey);
        const members = existing ? JSON.parse(existing) : [];
        if (!members.includes(key)) {
          members.push(key);
          await redis.set(
            tagKey,
            JSON.stringify(members),
            "EX",
            Math.max(ttlSeconds, 3600),
          );
        }
      });
      await Promise.allSettled(tagOps);
    }
    endTimer();
  } catch (err) {
    errors++;
    cacheErrorsCounter.inc();
    endTimer();
    logger.warn("Cache SET error", { meta: { key, error: err.message } });
  }
}

/**
 * Delete one or more cache keys.
 * @param {string|string[]} keys
 */
async function cacheDel(keys) {
  const endTimer = cacheDurationHistogram.startTimer({ operation: "del" });
  try {
    const keyArr = Array.isArray(keys) ? keys : [keys];
    await Promise.all(keyArr.map((k) => redis.del(k)));
    endTimer();
  } catch (err) {
    errors++;
    cacheErrorsCounter.inc();
    endTimer();
    logger.warn("Cache DEL error", { meta: { keys, error: err.message } });
  }
}

// ── Cache-aside pattern ──────────────────────────────────────────────────────

/**
 * Returns cached value if present, otherwise calls `fetcher`, caches the
 * result, and returns it.  On fetcher error the error is re-thrown and
 * nothing is cached.
 *
 * @param {string} key
 * @param {number} ttlSeconds
 * @param {() => Promise<any>} fetcher
 * @param {string[]} [tags]
 * @returns {Promise<any>}
 */
async function getOrSet(key, ttlSeconds, fetcher, tags = []) {
  const cached = await cacheGet(key);
  if (cached !== null) return cached;

  const fresh = await fetcher();
  if (fresh !== undefined && fresh !== null) {
    await cacheSet(key, fresh, ttlSeconds, tags);
  }
  return fresh;
}

// ── Tag-based invalidation ───────────────────────────────────────────────────

/**
 * Invalidate all cache keys registered under a given tag.
 * @param {string} tag
 */
async function invalidateTag(tag) {
  const endTimer = cacheDurationHistogram.startTimer({
    operation: "invalidate_tag",
  });
  try {
    const tagKey = `nf:tags:${tag}`;
    const raw = await redis.get(tagKey);
    if (!raw) {
      endTimer();
      return;
    }

    const keys = JSON.parse(raw);
    if (keys.length > 0) {
      await Promise.all(keys.map((k) => redis.del(k)));
      logger.info("Cache tag invalidated", {
        meta: { tag, keysCleared: keys.length },
      });
    }
    await redis.del(tagKey);
    endTimer();
  } catch (err) {
    errors++;
    cacheErrorsCounter.inc();
    endTimer();
    logger.warn("Cache tag invalidation error", {
      meta: { tag, error: err.message },
    });
  }
}

/**
 * Invalidate multiple tags.
 * @param {string[]} tags
 */
async function invalidateTags(tags) {
  await Promise.allSettled(tags.map(invalidateTag));
}

// ── Express middleware (route-level caching) ─────────────────────────────────

/**
 * Creates an Express middleware that caches the full response for GET requests.
 *
 * Usage:
 *   router.get('/featured', cacheMiddleware(CacheKeys.featuredProducts(), TTL.MEDIUM), handler)
 *
 * @param {string} key      — cache key
 * @param {number} ttl      — TTL in seconds
 * @param {string[]} [tags] — optional tags for bulk invalidation
 */
function cacheMiddleware(key, ttl, tags = []) {
  return async (req, res, next) => {
    // Only cache GET requests
    if (req.method !== "GET") return next();

    const cached = await cacheGet(key);
    if (cached !== null) {
      res.setHeader("X-Cache", "HIT");
      return res.json(cached);
    }

    // Intercept the response to cache it before sending
    const originalJson = res.json.bind(res);
    res.json = async (body) => {
      res.setHeader("X-Cache", "MISS");
      if (res.statusCode >= 200 && res.statusCode < 300) {
        await cacheSet(key, body, ttl, tags);
      }
      return originalJson(body);
    };

    next();
  };
}

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  cacheGet,
  cacheSet,
  cacheDel,
  getOrSet,
  invalidateTag,
  invalidateTags,
  cacheMiddleware,
  getStats,
};
