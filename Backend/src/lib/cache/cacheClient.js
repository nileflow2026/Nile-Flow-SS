/**
 * Nile Flow — Cache Client
 *
 * Thin wrapper around the existing Redis client (services/redisClient.js)
 * that adds:
 *   - get / set / del with JSON serialisation
 *   - getOrSet (cache-aside pattern)
 *   - tag-based invalidation helpers
 *   - cache hit/miss counters (logged via logger)
 *
 * All callers should import from here, not from services/redisClient directly,
 * unless they need the raw Redis client for auth token operations.
 */

"use strict";

const { redis } = require("../../../services/redisClient");
const { logger } = require("../logger");

// ── Instrumentation counters (in-process, lightweight) ──────────────────────

let hits = 0;
let misses = 0;
let errors = 0;

function getStats() {
  return { hits, misses, errors };
}

// ── Core operations ──────────────────────────────────────────────────────────

/**
 * Get a cached value. Returns parsed JSON or null on miss/error.
 * @param {string} key
 * @returns {Promise<any>}
 */
async function cacheGet(key) {
  try {
    const raw = await redis.get(key);
    if (raw === null) {
      misses++;
      return null;
    }
    hits++;
    return JSON.parse(raw);
  } catch (err) {
    errors++;
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
  try {
    await redis.set(key, JSON.stringify(value), "EX", ttlSeconds);

    // Register key under each tag for bulk invalidation
    if (tags.length > 0) {
      const tagOps = tags.map((tag) => {
        const tagKey = `nf:tags:${tag}`;
        // We store tag members as a Redis set for O(1) membership checks
        return redis.set(
          tagKey,
          JSON.stringify([
            ...new Set([
              ...(JSON.parse((await redis.get(tagKey)) || "[]")),
              key,
            ]),
          ]),
          "EX",
          Math.max(ttlSeconds, 3600), // tags live at least as long as their entries
        );
      });
      await Promise.allSettled(tagOps);
    }
  } catch (err) {
    errors++;
    logger.warn("Cache SET error", { meta: { key, error: err.message } });
  }
}

/**
 * Delete one or more cache keys.
 * @param {string|string[]} keys
 */
async function cacheDel(keys) {
  try {
    const keyArr = Array.isArray(keys) ? keys : [keys];
    await Promise.all(keyArr.map((k) => redis.del(k)));
  } catch (err) {
    errors++;
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
  try {
    const tagKey = `nf:tags:${tag}`;
    const raw = await redis.get(tagKey);
    if (!raw) return;

    const keys = JSON.parse(raw);
    if (keys.length > 0) {
      await Promise.all(keys.map((k) => redis.del(k)));
      logger.info("Cache tag invalidated", {
        meta: { tag, keysCleared: keys.length },
      });
    }
    await redis.del(tagKey);
  } catch (err) {
    errors++;
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
