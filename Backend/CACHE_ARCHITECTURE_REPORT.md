# CACHE ARCHITECTURE REPORT

**Date:** 2026-06-09
**Sprint:** Day 4 — Appwrite Scale Optimization

---

## CACHE ARCHITECTURE OVERVIEW

```
┌─────────────────────────────────────────────────────────────────────┐
│                        FRONTEND LAYER                               │
│                                                                     │
│  useOptimizedQuery (React)                                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                │
│  │ Memory Cache │  │ Dedup In-   │  │ SWR Pattern │                │
│  │ (TTL 5 min)  │  │ Flight Reqs │  │ (stale ok)  │                │
│  └─────────────┘  └─────────────┘  └─────────────┘                │
└─────────────────────────────────────────────────────────────────────┘
                                  │ axiosClient
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        BACKEND LAYER                                │
│                                                                     │
│  Express API → withCache(repo)                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                  CACHE COORDINATION LAYER                    │   │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐  │   │
│  │  │ MemoryCache  │  │ Request      │  │ CacheInvalidator│  │   │
│  │  │ (dual-TTL)   │  │ Coalescer    │  │ (write-through) │  │   │
│  │  │              │  │              │  │                 │  │   │
│  │  │ • 5 min list │  │ • In-flight  │  │ • Collection    │  │   │
│  │  │ • 1 min doc  │  │   dedup      │  │   dependency    │  │   │
│  │  │ • SWR grace  │  │ • Promise    │  │   map           │  │   │
│  │  │ • LRU evict  │  │   registry   │  │ • Pattern-based │  │   │
│  │  └──────┬───────┘  └──────┬───────┘  └────────┬────────┘  │   │
│  └─────────┼─────────────────┼────────────────────┼────────────┘   │
│            │                 │                    │                │
│            ▼                 ▼                    ▼                │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                 INSTRUMENTED REPOSITORY LAYER               │   │
│  │  (createInstrumentedDb + performanceTracker)                │   │
│  └─────────────────────────┬───────────────────────────────────┘   │
│                            │                                      │
│                            ▼                                      │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                      APPWRITE                                │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## CACHE LAYER COMPONENTS

### 1. MemoryCache (`memoryCache.js`)

| Property          | Value                                  | Rationale                       |
| ----------------- | -------------------------------------- | ------------------------------- |
| Max entries       | 5,000 (list cache) / 2,000 (doc cache) | Fits ~50MB heap                 |
| Default TTL       | 5 min (list) / 1 min (doc)             | Balance freshness vs hit rate   |
| SWR grace         | 50% of TTL (7.5 min / 1.5 min)         | Serve stale during revalidation |
| Cleanup interval  | 60 seconds                             | Evict expired entries           |
| Eviction strategy | LRU (oldest first at capacity)         | Fair eviction                   |

### 2. CachedRepository (`cachedRepository.js`)

Transparent Proxy wrapping any repository. Detects read vs write methods:

- **Read methods** → check cache → miss → execute → cache result → return
- **Write methods** → execute → invalidate collection + dependents → return

### 3. CacheInvalidator (`cacheInvalidator.js`)

Collection dependency graph for cascade invalidation:

| Write Collection | Invalidates                                     |
| ---------------- | ----------------------------------------------- |
| products         | products, categories, featured                  |
| orders           | orders, transactions, payments, users, products |
| carts            | carts, products                                 |
| users            | users, vendors, riders                          |
| transactions     | transactions, orders, payments                  |
| payments         | payments, orders, transactions                  |

### 4. Request Coalescer (`requestCoalescer.js`)

In-flight deduplication within the same Node.js process:

- Same operation + same collection + same args → single promise
- Eliminates redundant Appwrite calls during concurrent request handling

---

## EXPECTED CACHE PERFORMANCE

### Hit Rates by Collection Type

| Collection Type                                                     | TTL    | Expected Hit Rate | Notes                      |
| ------------------------------------------------------------------- | ------ | ----------------- | -------------------------- |
| Static (products, categories, settings, currencies, content)        | 10 min | 95-99%            | Rarely changes, high reuse |
| Semi-static (users, vendors, reviews)                               | 3 min  | 80-85%            | Moderate churn             |
| Dynamic (orders, carts, transactions, notifications, subscriptions) | 30 sec | 40-60%            | High write volume          |

### Read Reduction

| User Base | Before (reads/day) | After (reads/day) | Reduction |
| --------- | ------------------ | ----------------- | --------- |
| 1,000     | 12,500             | 2,500             | 80%       |
| 10,000    | 125,000            | 25,000            | 80%       |
| 50,000    | 625,000            | 125,000           | 80%       |
| 100,000   | 1,250,000          | 250,000           | 80%       |

---

## CACHE LIFECYCLE

### Read Path

```
1. Request → Repository.get()
2.   → withCache wraps → memoryCache.get()
3.     Hit → return cached result (0ms latency)
4.     Miss → requestCoalescer dedup check
5.       In-flight → return existing promise
6.       New → execute → instrumentedDb.getDocument()
7.         → performanceTracker.recordQuery()
8.         → memoryCache.set() with TTL
9.         → return result
```

### Write Path (Invalidation)

```
1. Request → Repository.update()
2.   → withCache wraps → execute update
3.     → instrumentedDb.updateDocument()
4.     → cacheInvalidator.invalidateOnWrite(collection)
5.       → clear globalCache[collection]
6.       → clear documentCache[collection]
7.       → clear dependent collections
8.       → return write result
```

---

## CACHE METRICS (Prometheus)

| Metric                                   | Type      | Labels                | Description                |
| ---------------------------------------- | --------- | --------------------- | -------------------------- |
| `nf_appwrite_cache_hits_total`           | Counter   | collection, operation | Cache hit count            |
| `nf_appwrite_cache_misses_total`         | Counter   | collection, operation | Cache miss count           |
| `nf_appwrite_saved_reads_total`          | Counter   | collection, operation | Reads avoided by caching   |
| `nf_appwrite_duplicate_requests_total`   | Counter   | collection, operation | Deduped in-flight requests |
| `nf_appwrite_cache_entries`              | Gauge     | —                     | Current cache size         |
| `nf_appwrite_reads_total`                | Counter   | collection, operation | All Appwrite reads         |
| `nf_appwrite_operation_duration_seconds` | Histogram | collection, operation | Operation latency          |

---

## FILES IMPLEMENTED

| File                                                      | Lines | Purpose                                           |
| --------------------------------------------------------- | ----- | ------------------------------------------------- |
| `Backend/src/cache/memoryCache.js`                        | ~180  | TTL-based in-memory cache with Prometheus metrics |
| `Backend/src/cache/cachedRepository.js`                   | ~160  | Proxy wrapper for cache-transparent repositories  |
| `Backend/src/cache/cacheInvalidator.js`                   | ~110  | Smart cache invalidation on writes                |
| `Backend/src/data/coordination/requestCoalescer.js`       | ~30   | In-flight deduplication                           |
| `Backend/src/data/coordination/promiseRegistry.js`        | ~40   | Promise tracking for dedup                        |
| `Backend/src/observability/appwritePerformanceMetrics.js` | ~220  | Expanded metrics + dashboard endpoint             |
