/**
 * Nile Flow — In-Memory Image Cache
 *
 * LRU cache for proxied/transformed images.
 * Falls back to a simple Map with TTL if LRU dependency is unavailable.
 *
 * Cache policy:
 *   - Max 200 entries (≈200MB assuming 1MB avg image, can tune)
 *   - TTL: 30 minutes
 *   - LRU eviction (oldest accessed entries removed first)
 */

const CACHE_CONFIG = {
  MAX_SIZE: 200,
  TTL_MS: 30 * 60 * 1000, // 30 minutes
};

class ImageCacheEntry {
  constructor(key, data, contentType) {
    this.key = key;
    this.data = data;
    this.contentType = contentType;
    this.createdAt = Date.now();
    this.lastAccessed = Date.now();
  }

  get isExpired() {
    return Date.now() - this.createdAt > CACHE_CONFIG.TTL_MS;
  }

  touch() {
    this.lastAccessed = Date.now();
  }
}

class ImageCache {
  constructor() {
    this._map = new Map();
    this._hits = 0;
    this._misses = 0;
    this._evictions = 0;
  }

  get(key) {
    const entry = this._map.get(key);

    if (!entry) {
      this._misses++;
      return null;
    }

    if (entry.isExpired) {
      this._map.delete(key);
      this._misses++;
      return null;
    }

    entry.touch();
    this._hits++;

    // Move to end (most recently used)
    this._map.delete(key);
    this._map.set(key, entry);

    return { data: entry.data, contentType: entry.contentType };
  }

  set(key, data, contentType) {
    // If key exists, delete first so we can re-insert as MRU
    if (this._map.has(key)) {
      this._map.delete(key);
    }

    // Evict LRU (first item in Map) if at capacity
    if (this._map.size >= CACHE_CONFIG.MAX_SIZE) {
      const oldestKey = this._map.keys().next().value;
      if (oldestKey) {
        this._map.delete(oldestKey);
        this._evictions++;
      }
    }

    this._map.set(key, new ImageCacheEntry(key, data, contentType));
  }

  get stats() {
    const total = this._hits + this._misses;
    return {
      size: this._map.size,
      maxSize: CACHE_CONFIG.MAX_SIZE,
      hits: this._hits,
      misses: this._misses,
      evictions: this._evictions,
      hitRate: total > 0 ? ((this._hits / total) * 100).toFixed(1) + "%" : "0%",
    };
  }

  invalidate(pattern) {
    // If pattern is a string, delete exact match
    if (typeof pattern === "string") {
      this._map.delete(pattern);
      return;
    }

    // If pattern is a RegExp, delete matching keys
    if (pattern instanceof RegExp) {
      for (const key of this._map.keys()) {
        if (pattern.test(key)) {
          this._map.delete(key);
        }
      }
    }
  }

  clear() {
    this._map.clear();
    this._hits = 0;
    this._misses = 0;
    this._evictions = 0;
  }
}

// Singleton
const imageCache = new ImageCache();

module.exports = { imageCache, ImageCache, CACHE_CONFIG };
