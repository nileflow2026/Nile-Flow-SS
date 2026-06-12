/**
 * useCache — NileFlow In-Memory Cache Hook
 *
 * Eliminates redundant network requests for static/slow-changing data.
 * Each cache entry has a configurable TTL. Deduplicates in-flight requests.
 *
 * Usage:
 *   const { getOrFetch, invalidate } = useCache('categories', fetchCategories, 30 * 60 * 1000);
 *   const data = await getOrFetch(); // returns cached or fresh data
 *   invalidate();                     // force refetch next time
 */

import { useRef, useCallback } from "react";

// Global store shared across all component instances
const STORE = new Map();

// Default TTLs by cache key pattern
export const CACHE_TTL = {
  categories: 30 * 60 * 1000, // 30 min — rarely changes
  heroProducts: 10 * 60 * 1000, // 10 min — admin publishes new ones occasionally
  featuredProducts: 10 * 60 * 1000, // 10 min
  deals: 10 * 60 * 1000, // 10 min
  exchangeRates: 60 * 60 * 1000, // 1 hour — fetched via Redis on backend
  userProfile: 60 * 1000, // 1 min — fast-changing but expensive
};

/**
 * React hook wrapping a keyed in-memory cache with dedup and TTL.
 */
export function useCache(
  key,
  fetcher,
  ttl = CACHE_TTL[key] || CACHE_TTL.categories,
) {
  const dataRef = useRef(null);
  const tsRef = useRef(0);
  const inflightRef = useRef(null);

  const getOrFetch = useCallback(
    async (force = false) => {
      const now = Date.now();

      // Return cached value if within TTL
      if (!force && dataRef.current && now - tsRef.current < ttl) {
        return dataRef.current;
      }

      // Deduplicate concurrent fetches for the same key
      if (inflightRef.current) {
        return inflightRef.current;
      }

      inflightRef.current = (async () => {
        try {
          const data = await fetcher();
          dataRef.current = data;
          tsRef.current = Date.now();

          // Also set in global store for cross-component sharing
          STORE.set(key, { data, ts: Date.now() });

          return data;
        } catch (err) {
          // On failure, return stale cached data if available
          if (dataRef.current) return dataRef.current;
          throw err;
        } finally {
          inflightRef.current = null;
        }
      })();

      return inflightRef.current;
    },
    [key, fetcher, ttl],
  );

  const invalidate = useCallback(() => {
    dataRef.current = null;
    tsRef.current = 0;
    STORE.delete(key);
  }, [key]);

  return { getOrFetch, invalidate };
}

/**
 * Global cache access — use outside React components (e.g. in event handlers).
 */
export function getGlobalCache(key) {
  const entry = STORE.get(key);
  if (!entry) return null;
  const ttl = CACHE_TTL[key] || CACHE_TTL.categories;
  if (Date.now() - entry.ts > ttl) {
    STORE.delete(key);
    return null;
  }
  return entry.data;
}

export function setGlobalCache(key, data) {
  STORE.set(key, { data, ts: Date.now() });
}
