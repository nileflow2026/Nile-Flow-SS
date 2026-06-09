# APPWRITE PERFORMANCE DASHBOARD REPORT

**Date:** 2026-06-09
**Sprint:** Day 4 — Appwrite Scale Optimization

---

## INSTRUMENTATION EXPANSION

The existing `nf_appwrite_*` metrics have been expanded with detailed tracking for cache operations, duplicate requests, and cost estimation.

---

## METRICS REGISTRY

### New Metrics Added

| Metric                                 | Type      | Labels                | Description                       | Source                          |
| -------------------------------------- | --------- | --------------------- | --------------------------------- | ------------------------------- |
| `nf_appwrite_cache_hits_total`         | Counter   | collection, operation | Data served without Appwrite call | `appwritePerformanceMetrics.js` |
| `nf_appwrite_cache_misses_total`       | Counter   | collection, operation | Data fetched from Appwrite        | `appwritePerformanceMetrics.js` |
| `nf_appwrite_saved_reads_total`        | Counter   | collection, operation | Reads avoided by caching          | `appwritePerformanceMetrics.js` |
| `nf_appwrite_duplicate_requests_total` | Counter   | collection, operation | Duplicate requests coalesced      | `appwritePerformanceMetrics.js` |
| `nf_appwrite_query_cost_estimate`      | Histogram | collection, operation | Estimated cost impact             | `appwritePerformanceMetrics.js` |
| `nf_appwrite_cache_entries`            | Gauge     | —                     | Current cache size                | `memoryCache.js`                |

### Existing Metrics (maintained)

| Metric                                          | Type      | Labels                | Description                   |
| ----------------------------------------------- | --------- | --------------------- | ----------------------------- |
| `nf_appwrite_reads_total`                       | Counter   | collection, operation | All Appwrite reads            |
| `nf_appwrite_writes_total`                      | Counter   | collection, operation | All Appwrite writes           |
| `nf_appwrite_errors_total`                      | Counter   | collection, operation | Appwrite operation errors     |
| `nf_appwrite_operation_duration_seconds`        | Histogram | collection, operation | Operation latency             |
| `nf_appwrite_realtime_subscriptions`            | Gauge     | —                     | Active realtime subscriptions |
| `nf_data_coordination_deduplicated_reads_total` | Counter   | collection, operation | In-flight dedup reads         |
| `nf_data_coordination_batch_requests_total`     | Counter   | collection, operation | Batch query coordination      |

---

## PERFORMANCE DASHBOARD ENDPOINT

**Route:** `GET /api/admin/appwrite-performance`

**Access:** Internal/admin only (requires INTERNAL_METRICS_KEY header in production)

**Response shape:**

```json
{
  "success": true,
  "timestamp": "2026-06-09T21:00:00.000Z",
  "topCollections": [
    {
      "collectionId": "products",
      "reads": 4500,
      "writes": 23,
      "duration": 12500,
      "count": 4523,
      "lastAccessed": "2026-06-09T21:00:00.000Z"
    }
  ],
  "topEndpoints": [
    {
      "operation": "listDocuments",
      "count": 3200,
      "totalDuration": 45000
    }
  ],
  "expensiveQueries": [
    {
      "collectionId": "orders",
      "operation": "listDocuments",
      "durationMs": 1250,
      "filters": ["status=active", "userId=*"],
      "timestamp": "2026-06-09T20:59:59.000Z",
      "estimatedCost": 15
    }
  ],
  "totalCollectionsTracked": 12,
  "cacheMetrics": {
    "hits": [
      {
        "labels": { "collection": "products", "operation": "listDocuments" },
        "value": 850
      }
    ],
    "misses": [
      {
        "labels": { "collection": "products", "operation": "listDocuments" },
        "value": 150
      }
    ],
    "savedReads": [
      {
        "labels": { "collection": "products", "operation": "listDocuments" },
        "value": 850
      }
    ],
    "duplicatesBlocked": [
      {
        "labels": { "collection": "orders", "operation": "listDocuments" },
        "value": 120
      }
    ],
    "hitRate": "85.00%"
  }
}
```

---

## TOP COLLECTIONS TRACKER

The `AppwritePerformanceTracker` class maintains an in-memory ring buffer of:

- **Top 10 collections** by operation count (sorted desc)
- **Top 10 endpoints** by invocation count
- **Last 100 expensive queries** (duration > 500ms)

This provides instant visibility into:

- Which collections generate the most reads
- Which operations are most expensive
- Slow queries that need index optimization

---

## GRAFANA DASHBOARD PANELS (Recommended)

### Panel 1: Appwrite Read/Write Volume

```
Query: rate(nf_appwrite_reads_total[5m]) by (collection)
Query: rate(nf_appwrite_writes_total[5m]) by (collection)
Type: Bar chart, stacked by collection
Refresh: 15s
```

### Panel 2: Cache Performance

```
Query: rate(nf_appwrite_cache_hits_total[5m]) by (collection)
Query: rate(nf_appwrite_cache_misses_total[5m]) by (collection)
Type: Gauge (hit rate %)
Refresh: 15s
```

### Panel 3: Saved Reads (Cost Savings)

```
Query: rate(nf_appwrite_saved_reads_total[5m])
Type: Stat (current rate), Area chart (history)
Refresh: 30s
```

### Panel 4: Expensive Queries

```
Query: topk(10, nf_appwrite_query_cost_estimate_sum)
Type: Table
Refresh: 60s
```

### Panel 5: Duplicate Requests Blocked

```
Query: rate(nf_appwrite_duplicate_requests_total[5m]) by (collection)
Type: Bar chart
Refresh: 30s
```

---

## ALERTING RULES (Recommended)

| Alert                 | Condition                                              | Severity | Channel   |
| --------------------- | ------------------------------------------------------ | -------- | --------- |
| High Error Rate       | `rate(nf_appwrite_errors_total[5m]) > 10`              | Critical | PagerDuty |
| Low Cache Hit Rate    | `hit_rate < 50% for 10m`                               | Warning  | Email     |
| High Duplicate Rate   | `rate(nf_appwrite_duplicate_requests_total[5m]) > 100` | Warning  | Email     |
| Expensive Query Spike | `nf_appwrite_query_cost_estimate_sum > 1000`           | Warning  | Slack     |
| Cache Entry Flood     | `nf_appwrite_cache_entries > 4000`                     | Info     | Log       |

---

## IMPLEMENTED FILES

| File                                                      | Description                                                                               |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `Backend/src/observability/appwriteMetrics.js`            | Core Appwrite operation instrumentation (reads, writes, errors, duration)                 |
| `Backend/src/observability/appwritePerformanceMetrics.js` | Expanded: cache hits/misses, saved reads, duplicates, cost estimation, dashboard endpoint |
| `Backend/src/observability/metrics.js`                    | Prometheus registry with all metric definitions                                           |
| `Backend/src/data/coordination/coordinationMetrics.js`    | Deduplication and batch coordination metrics                                              |
| `Backend/src/cache/memoryCache.js`                        | Cache metrics (hits, misses, entries gauge, saved reads)                                  |

---

## VERIFICATION

- ✅ All new metrics registered with prom-client
- ✅ Metrics exposed at /metrics endpoint
- ✅ `/api/admin/appwrite-performance` dashboard endpoint available
- ✅ Metric types correctly declared (Counter, Gauge, Histogram)
- ✅ Proper label names used for collection/operation correlation
- ✅ No metric conflicts or double-registrations
