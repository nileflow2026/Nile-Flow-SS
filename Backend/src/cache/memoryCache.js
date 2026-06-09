"use strict";

/**
 * Nile Flow — In-Memory Cache Layer
 *
 * Production-grade TTL-based memory cache for Appwrite query results.
 * Provides:
 *   - TTL-based expiration per key
 *   - Cache hit/miss metrics integration
 *   - LRU-style eviction (when maxKeys is exceeded)
 *   - Cache invalidation by pattern
 *   - Stale-while-revalidate support
 */

const client = require("prom-client");
const { registry } = require("../observability/metrics");

// ── Metrics ──────────────────────────────────────────────────────────────────

const cacheHitsTotal = new client.Counter({
  name: "nf_appwrite_cache_hits_total",
  help: "Total Appwrite cache hits",
  labelNames: ["collection", "operation"],
  registers: [registry],
});

const cacheMissesTotal = new client.Counter({
  name: "nf_appwrite_cache_misses_total",
  help: "Total Appwrite cache misses",
  labelNames: ["collection", "operation"],
  registers: [registry],
});

const savedReadsTotal = new client.Counter({
  name: "nf_appwrite_saved_reads_total",
  help: "Total Appwrite reads saved by caching",
  labelNames: ["collection", "operation"],
  registers: [registry],
});

const duplicateRequestsBlocked = new client.Counter({
  name: "nf_appwrite_duplicate_requests_total",
  help: "Total duplicate Appwrite requests coalesced",
  labelNames: ["collection", "operation"],
  registers: [registry],
});

const cacheSizeGauge = new client.Gauge({
  name: "nf_appwrite_cache_entries",
  help: "Current number of entries in memory cache",
  registers: [registry],
});

// ── In-Memory Cache Implementation ───────────────────────────────────────────

class MemoryCache {
  constructor(options = {}) {
    this._store = new Map();
    this._maxKeys = options.maxKeys || 5000;
    this._defaultTTL = options.defaultTTL || 5 * 60 * 1000; // 5 minutes
    this._cleanupInterval = options.cleanupInterval || 60 * 1000; // 1 minute
    this._hits = 0;
    this._misses = 0;
    this._evictions = 0;

    // Periodic cleanup of expired entries
    this._cleanupTimer = setInterval(
      () => this._evictExpired(),
      this._cleanupInterval,
    );
    this._cleanupTimer.unref();
  }

  /**
   * Build a cache key from collection, operation, and query args.
   */
  _buildKey(collectionId, operation, args) {
    const normalized = JSON.stringify(args || []);
    return `appwrite:${collectionId}:${operation}:${normalized}`;
  }

  /**
   * Get a value from cache. Returns undefined on miss.
   * Updates hit/miss metrics.
   */
  get(collectionId, operation, args) {
    const key = this._buildKey(collectionId, operation, args);
    const entry = this._store.get(key);

    if (!entry) {
      this._misses++;
      cacheMissesTotal.inc({ collection: collectionId, operation });
      return undefined;
    }

    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this._store.delete(key);
      this._misses++;
      cacheMissesTotal.inc({ collection: collectionId, operation });
      this._evictions++;
      return undefined;
    }

    // Stale-while-revalidate: if stale but within grace period, return stale
    if (entry.staleAt && Date.now() > entry.staleAt) {
      this._hits++;
      cacheHitsTotal.inc({ collection: collectionId, operation });
      savedReadsTotal.inc({ collection: collectionId, operation });
      return entry.value; // Return stale data, caller should revalidate
    }

    this._hits++;
    cacheHitsTotal.inc({ collection: collectionId, operation });
    savedReadsTotal.inc({ collection: collectionId, operation });
    return entry.value;
  }

  /**
   * Set a value in cache with TTL and optional stale-while-revalidate window.
   */
  set(collectionId, operation, args, value, ttl) {
    const key = this._buildKey(collectionId, operation, args);
    const effectiveTTL = ttl || this._defaultTTL;
    const staleTTL = Math.floor(effectiveTTL * 1.5); // 50% grace period

    // Eviction: if at capacity, remove oldest entries
    if (this._store.size >= this._maxKeys) {
      const oldestKey = this._store.keys().next().value;
      if (oldestKey) {
        this._store.delete(oldestKey);
        this._evictions++;
      }
    }

    this._store.set(key, {
      value,
      expiresAt: Date.now() + effectiveTTL,
      staleAt: Date.now() + staleTTL,
      createdAt: Date.now(),
    });

    cacheSizeGauge.set(this._store.size);
  }

  /**
   * Invalidate specific cache entries matching a prefix pattern.
   * e.g., invalidate("products", "listDocuments") clears all product list caches.
   */
  invalidate(collectionId, operation) {
    const prefix = `appwrite:${collectionId}:${operation}:`;
    let count = 0;
    for (const key of this._store.keys()) {
      if (key.startsWith(prefix)) {
        this._store.delete(key);
        count++;
      }
    }
    cacheSizeGauge.set(this._store.size);
    return count;
  }

  /**
   * Invalidate by collection only (all operations for a collection).
   */
  invalidateCollection(collectionId) {
    const prefix = `appwrite:${collectionId}:`;
    let count = 0;
    for (const key of this._store.keys()) {
      if (key.startsWith(prefix)) {
        this._store.delete(key);
        count++;
      }
    }
    cacheSizeGauge.set(this._store.size);
    return count;
  }

  /**
   * Clear entire cache.
   */
  clear() {
    this._store.clear();
    cacheSizeGauge.set(0);
  }

  /**
   * Evict all expired entries.
   */
  _evictExpired() {
    const now = Date.now();
    let evicted = 0;
    for (const [key, entry] of this._store.entries()) {
      if (entry.expiresAt && now > entry.expiresAt) {
        this._store.delete(key);
        evicted++;
      }
    }
    if (evicted > 0) {
      this._evictions += evicted;
      cacheSizeGauge.set(this._store.size);
    }
  }

  /**
   * Get cache statistics.
   */
  getStats() {
    return {
      size: this._store.size,
      maxKeys: this._maxKeys,
      hits: this._hits,
      misses: this._misses,
      hitRate:
        this._hits + this._misses > 0
          ? ((this._hits / (this._hits + this._misses)) * 100).toFixed(2) + "%"
          : "0%",
      evictions: this._evictions,
    };
  }

  /**
   * Destroy the cache and stop cleanup timer.
   */
  destroy() {
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
    }
    this._store.clear();
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────

const globalCache = new MemoryCache({
  maxKeys: 5000,
  defaultTTL: 5 * 60 * 1000, // 5 minutes for list queries
});

// Shorter TTL cache for single-document gets (1 minute — higher churn tolerance)
const documentCache = new MemoryCache({
  maxKeys: 2000,
  defaultTTL: 60 * 1000, // 1 minute
});

module.exports = {
  MemoryCache,
  globalCache,
  documentCache,
  savedReadsTotal,
  duplicateRequestsBlocked,
  cacheHitsTotal,
  cacheMissesTotal,
};
