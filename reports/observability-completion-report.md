# WORKSTREAM 6 — Observability Completion Report

## Objective

Make every Appwrite read path observable. All operations must go through `instrumentedDb` to emit metrics for collection, operation, latency, and errors.

## Current State

| Metric                         | Value                                         |
| ------------------------------ | --------------------------------------------- |
| Files using `instrumentedDb`   | **0**                                         |
| Files using raw `db` object    | **~40 controllers**                           |
| Files using `users.get()` raw  | **~42 calls**                                 |
| Prometheus metrics defined     | ✅ All metrics in metrics.js                  |
| Prometheus `/metrics` endpoint | ✅ Wired in index.js                          |
| HTTP request metrics           | ✅ Active                                     |
| Appwrite operation metrics     | ❌ **Inactive** (no code uses instrumentedDb) |
| Cache hit/miss metrics         | ❌ Inactive                                   |
| Queue metrics                  | ❌ Poller running but limited adoption        |

## What `instrumentedDb` Provides

The `createInstrumentedDb()` function in `Backend/src/observability/appwriteMetrics.js` wraps every Appwrite database method with:

- **Read counter:** `nf_appwrite_reads_total{collection, operation}` — increments on every `listDocuments` / `getDocument`
- **Write counter:** `nf_appwrite_writes_total{collection, operation}` — increments on every `createDocument` / `updateDocument` / `deleteDocument`
- **Error counter:** `nf_appwrite_errors_total{collection, operation}` — increments on every failed operation
- **Duration histogram:** `nf_appwrite_operation_duration_seconds{collection, operation}` — tracks latency

Without this, we have **zero visibility** into which collections are driving the 1M reads/month.

## Migration Plan

### Phase A: Core Services (Week 1)

Replace `db` with `instrumentedDb` in:

1. `Backend/services/appwriteService.js` — export `instrumentedDb` as default
2. `Backend/controllers/v1/homeFeedController.js` — already the best candidate
3. `Backend/controllers/subscriptionController.js` — high traffic

### Phase B: AdminControllers (Week 2)

Replace in:

1. `admin.js` (97 raw calls — highest impact)
2. `PaymentController.js`
3. `authController.js`
4. `commissionController.js`

### Phase C: All Remaining Controllers (Week 3)

Replace in all UserControllers, RiderControllers, and Services.

## How to Integrate

Current pattern:

```js
const { db } = require("../../services/appwriteService");
const result = await db.listDocuments(databaseId, collectionId, queries);
```

Target pattern:

```js
const { instrumentedDb } = require("../../services/appwriteService");
const result = await instrumentedDb.listDocuments(
  databaseId,
  collectionId,
  queries,
);
```

The `instrumentedDb` is a Proxy — it has the **exact same API** as the raw `db`. No argument changes needed.

## Metric Dashboards (To Configure in Grafana)

| Dashboard Panel     | Metric                                        | Purpose                                       |
| ------------------- | --------------------------------------------- | --------------------------------------------- |
| Reads by Collection | `nf_appwrite_reads_total{collection}`         | Identifies highest-read collections           |
| Reads by Operation  | `nf_appwrite_reads_total{operation}`          | Identifies listDocuments vs getDocument ratio |
| Write Volume        | `nf_appwrite_writes_total`                    | Tracks mutation load                          |
| Error Rate          | `nf_appwrite_errors_total`                    | Alerts on Appwrite failures                   |
| Operation Latency   | `nf_appwrite_operation_duration_seconds`      | Finds slow queries                            |
| Cache Hit Ratio     | `nf_cache_hits_total / nf_cache_misses_total` | Measures caching effectiveness                |
| Top Routes          | `nf_http_requests_total{route}`               | Identifies highest-traffic endpoints          |
| users.get Frequency | `nf_appwrite_reads_total{collection="users"}` | Measures auth read traffic                    |

## Remaining Work

1. Add `users.get()` instrumentation to the `createInstrumentedDb` proxy or create a separate wrapper
2. Add cache metrics to the `cacheGet`/`cacheSet` functions in `Backend/src/lib/cache/cacheClient.js`
3. Create a Grafana dashboard with the panels listed above
4. Set up alerts for:
   - Error rate > 1%
   - P95 operation latency > 2s
   - Cache hit ratio < 50%

## Verification

- [ ] instrumentedDb exported from appwriteService.js
- [ ] createInstrumentedDb proxy wraps all DB operations
- [ ] Prometheus metrics defined for Appwrite operations
- [ ] 0 controllers currently using instrumentedDb
- [ ] ~40 controllers need migration
