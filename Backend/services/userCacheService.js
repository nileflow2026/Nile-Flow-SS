/**
 * Nile Flow — User Cache Service
 *
 * Caches Appwrite User profile and preferences lookups in Redis.
 * Reduces redundant auth reads (users.get / users.getPrefs) by caching
 * results with a short TTL (120 seconds).
 *
 * Key naming: nf:auth:profile:<userId>  /  nf:auth:prefs:<userId>
 *
 * @module services/userCacheService
 */
"use strict";

const { users } = require("./appwriteService");
const { redis } = require("./redisClient");

const CACHE_TTL = 120; // 120 seconds

/**
 * Get a user profile from cache, falling back to Appwrite.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
async function getUserCached(userId) {
  const cacheKey = `nf:auth:profile:${userId}`;

  // Try cache
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  // Fetch from Appwrite
  const user = await users.get(userId);
  if (user) {
    await redis.set(cacheKey, JSON.stringify(user), "EX", CACHE_TTL);
  }

  return user;
}

/**
 * Get user preferences from cache, falling back to Appwrite.
 * @param {string} userId
 * @returns {Promise<object|null>}
 */
async function getUserPrefsCached(userId) {
  const cacheKey = `nf:auth:prefs:${userId}`;

  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);

  const prefs = await users.getPrefs(userId);
  if (prefs) {
    await redis.set(cacheKey, JSON.stringify(prefs), "EX", CACHE_TTL);
  }

  return prefs;
}

/**
 * Invalidate cached profile and preferences for a user.
 * Call this after updating user data or prefs.
 * @param {string} userId
 */
async function invalidateUserCache(userId) {
  await Promise.all([
    redis.del(`nf:auth:profile:${userId}`),
    redis.del(`nf:auth:prefs:${userId}`),
  ]);
}

module.exports = {
  getUserCached,
  getUserPrefsCached,
  invalidateUserCache,
  CACHE_TTL,
};