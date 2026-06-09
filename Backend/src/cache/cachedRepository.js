"use strict";

/**
 * Nile Flow — Cached Repository Wrapper
 *
 * Wraps any repository instance with transparent caching.
 * All reads go through the cache first — only cache misses hit Appwrite.
 * Writes automatically invalidate the relevant cache entries.
 *
 * Usage:
 *   const repo = new ProductRepository(db);
 *   const cachedRepo = withCache(repo, 'products');
 *   await cachedRepo.getFeatured(10);  // cached after first call
 */

const { globalCache, documentCache } = require("./memoryCache");
const { createInstrumentedDb } = require("../observability/appwriteMetrics");

// Collections that change infrequently — long cache TTL (10 minutes)
const STATIC_COLLECTIONS = new Set([
  "currencies",
  "categories",
  "settings",
  "platformSettings",
  "africanFacts",
  "content",
]);

// Collections that change on user action — medium cache TTL (3 minutes)
const SEMI_STATIC_COLLECTIONS = new Set([
  "products",
  "users",
  "vendorProfiles",
  "premiumBenefits",
  "reviews",
]);

// Collections that change frequently — short cache TTL (30 seconds)
const DYNAMIC_COLLECTIONS = new Set([
  "orders",
  "carts",
  "transactions",
  "notifications",
  "subscriptions",
  "payments",
]);

function getCacheTTL(collectionId) {
  if (STATIC_COLLECTIONS.has(collectionId)) return 10 * 60 * 1000; // 10 min
  if (SEMI_STATIC_COLLECTIONS.has(collectionId)) return 3 * 60 * 1000; // 3 min
  if (DYNAMIC_COLLECTIONS.has(collectionId)) return 30 * 1000; // 30 sec
  return 60 * 1000; // default 1 min
}

function getCacheForOperation(operation) {
  // Single document gets use a shorter TTL cache
  if (operation === "get" || operation === "getDocument") {
    return documentCache;
  }
  return globalCache;
}

/**
 * Wrap a repository method with caching logic.
 * Handles: get, list, create, update, delete.
 */
function wrapMethod(repo, methodName, collectionId) {
  const original = repo[methodName];

  if (typeof original !== "function") return original;

  return async function wrappedMethod(...args) {
    const isRead = [
      "get",
      "list",
      "getProfile",
      "getDetail",
      "getFeatured",
      "getByCategory",
      "search",
      "getPremiumDeals",
      "getTrending",
      "getAll",
      "getBySlug",
      "getOrderById",
      "getActiveSubscriptionsForUser",
      "getPlatformSettings",
      "getFeaturedFacts",
      "getFactsByCategory",
      "getProverbs",
      "getPreferences",
      "getMilesForUser",
      "getOrderById",
      "getProductById",
      "getUserById",
    ].includes(methodName);

    const isWrite = [
      "create",
      "update",
      "delete",
      "updateProfile",
      "approveVendor",
      "suspendVendor",
      "markOrderDelivered",
      "cancelOrder",
      "recordPaymentAttempt",
      "reconcileSettlement",
      "markPaymentFailed",
      "renewSubscription",
      "awardMiles",
      "createNotification",
      "createBatchNotifications",
      "updatePreferences",
    ].includes(methodName);

    if (isRead) {
      const cache = getCacheForOperation(methodName);
      const cached = cache.get(collectionId, methodName, args);

      if (cached !== undefined) {
        return cached;
      }

      // Cache miss — execute the original method
      const result = await original.apply(repo, args);

      // Only cache successful, non-empty results
      if (result !== null && result !== undefined) {
        const ttl = getCacheTTL(collectionId);
        cache.set(collectionId, methodName, args, result, ttl);
      }

      return result;
    }

    if (isWrite) {
      // Execute write first
      const result = await original.apply(repo, args);

      // Then invalidate related caches
      const docId = args[0];
      globalCache.invalidateCollection(collectionId);
      documentCache.invalidateCollection(collectionId);

      // Also invalidate related collections that might reference this data
      if (collectionId === "orders") {
        globalCache.invalidateCollection("transactions");
      }
      if (collectionId === "carts") {
        globalCache.invalidateCollection("products");
      }

      return result;
    }

    // Fallthrough for unknown methods
    return original.apply(repo, args);
  };
}

/**
 * Wrap a repository instance with caching.
 *
 * @param {object} repo - Repository instance (e.g., ProductRepository)
 * @param {string} collectionId - Collection ID for cache key namespacing
 * @returns {Proxy} Cached repository proxy
 */
function withCache(repo, collectionId) {
  const methodNames = Object.getOwnPropertyNames(
    Object.getPrototypeOf(repo),
  ).filter(
    (name) => name !== "constructor" && typeof repo[name] === "function",
  );

  return new Proxy(repo, {
    get(target, prop) {
      if (typeof target[prop] !== "function") return target[prop];
      if (prop === "constructor") return target[prop];

      const wrapped = wrapMethod(target, prop, collectionId);
      return wrapped.bind(target);
    },
  });
}

module.exports = {
  withCache,
  getCacheTTL,
  STATIC_COLLECTIONS,
  SEMI_STATIC_COLLECTIONS,
  DYNAMIC_COLLECTIONS,
};
