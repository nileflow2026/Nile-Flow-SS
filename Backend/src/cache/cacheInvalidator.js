"use strict";

/**
 * Nile Flow — Cache Invalidation Strategy
 *
 * Defines invalidation rules for write operations.
 * When a repository creates/updates/deletes a document, this module
 * determines which cache entries to invalidate across collections.
 *
 * Core principle: invalidate on write, don't try to update cache.
 * This prevents stale data from being served after mutations.
 */

const { globalCache, documentCache } = require("./memoryCache");

// ── Collection Dependency Map ────────────────────────────────────────────────
// When a document in the source collection is written, caches for
// the target collections should also be invalidated.

const WRITE_INVALIDATION_MAP = {
  // Products collection
  products: ["products", "categories", "featured"],
  orders: ["orders", "transactions", "payments", "users", "products"],
  carts: ["carts", "products"],
  users: ["users", "vendors", "riders"],
  transactions: ["transactions", "orders", "payments"],
  payments: ["payments", "orders", "transactions"],
  notifications: ["notifications"],
  reviews: ["reviews", "products"],
  categories: ["categories", "products"],
  subscriptions: ["subscriptions", "users"],
  vendors: ["vendors", "products", "users"],
  riders: ["riders", "orders", "users"],
  settings: ["settings"],
  content: ["content"],
  africanFacts: ["africanFacts", "content"],
  currencies: ["currencies"],
  nileMiles: ["nileMiles", "users"],
  groupOrders: ["groupOrders", "orders"],
};

/**
 * Invalidate all caches related to a collection mutation.
 *
 * @param {string} collectionId - The collection that was written to
 * @param {string} operation - The write operation (create, update, delete)
 * @returns {number} Total number of cache entries invalidated
 */
function invalidateOnWrite(collectionId, operation) {
  let total = 0;

  // Always invalidate the collection itself
  total += globalCache.invalidateCollection(collectionId);
  total += documentCache.invalidateCollection(collectionId);

  // Invalidate dependent collections
  const deps = WRITE_INVALIDATION_MAP[collectionId];
  if (deps) {
    for (const depCollection of deps) {
      total += globalCache.invalidateCollection(depCollection);
      total += documentCache.invalidateCollection(depCollection);
    }
  }

  // Log if we cleared a lot of entries (potential stampede risk)
  if (total > 50) {
    console.warn(
      `[CacheInvalidator] Invalidated ${total} entries for ${collectionId}.${operation} — high invalidation volume.`,
    );
  }

  return total;
}

/**
 * Invalidate specific known patterns after a mutation.
 * Useful for targeted invalidation when the cache key structure is known.
 */
function invalidatePattern(collectionId, operation, ...patterns) {
  let total = 0;
  for (const pattern of patterns) {
    const prefix = `appwrite:${collectionId}:${operation}:${pattern}`;
    for (const key of globalCache._store.keys()) {
      if (key.startsWith(prefix)) {
        globalCache._store.delete(key);
        total++;
      }
    }
  }
  return total;
}

module.exports = {
  invalidateOnWrite,
  invalidatePattern,
  WRITE_INVALIDATION_MAP,
};
