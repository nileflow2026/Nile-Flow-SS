# Nile Flow — Architecture Transformation Report

**Status:** Phase 1–3 Implementation Complete  
**Scope:** Backend infrastructure, real-time subscriptions, queue system, observability, cache layer, v1 API gateway

---

## Executive Summary

Nile Flow has been transformed from a prototype BaaS-heavy architecture into a scalable infrastructure capable of supporting millions of users. The changes target four failure modes:

1. **Silent data truncation** — Appwrite's default 25-doc limit silently corrupted analytics, financial reports, and admin dashboards
2. **Client-side over-fetching** — 4-6 separate API calls on every page load, infinite re-fetch loops from context effects
3. **No resilience layer** — Every user request hit Appwrite cold; no caching, no queuing, no retries
4. **No observability** — No structured logging, no correlation IDs, no audit trail

---

## Target Architecture

```
CLIENTS (Website · Mobile · Dashboards)
        │
        ▼
API Gateway (Express 5.x)
  ├── Request Tracing (Correlation IDs)
  ├── Rate Limiting (per-IP, per-route)
  ├── Auth Middleware (JWT + refresh tokens)
  └── v1 Consolidated Routes (/api/v1/*)
        │
        ├── Redis Cache Layer (ioredis)
        │     ├── Guest-level data: 5min TTL
        │     ├── Auth-level data: 1min TTL
        │     ├── Static content: 6hr TTL
        │     └── Tag-based invalidation
        │
        ├── BullMQ Queue System
        │     ├── nf:notifications (concurrency: 5)
        │     ├── nf:emails (concurrency: 3)
        │     ├── nf:miles (concurrency: 10)
        │     ├── nf:order-events (concurrency: 3)
        │     ├── nf:payment-reconciliation (10 retries)
        │     ├── nf:webhook-retry
        │     ├── nf:fraud-check
        │     ├── nf:analytics
        │     └── nf:recommendations
        │
        ▼
Appwrite (BaaS — Database + Auth + Realtime)
```

---

## Phase 1 — Critical Bug Fixes

### 1.1 Pagination Gaps (Silent Data Corruption)

**Problem:** Appwrite silently caps `listDocuments` at 25 docs without error. Controllers using it without explicit limits were serving incorrect data.

| File                                                                   | Bug                                                              | Fix                                                                                      |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `Backend/controllers/AdminControllers/admin.js`                        | `getOrders`, `getCancelledOrders` — no pagination                | Offset-based pagination, `page`+`limit` query params, max 100/page, returns `totalPages` |
| `Backend/controllers/VendorControllers/VendorsanalyticsController.js`  | Products fetch truncated at 25 — revenue calculations were wrong | Paginated loop: 100/page until all fetched                                               |
| `Backend/controllers/VendorControllers/vendorDashboardController.js`   | `Query.limit(1000)` hardcoded + products at 25                   | Cursor-based pagination for orders; loop for products                                    |
| `Backend/controllers/VendorControllers/VendorNotificationControler.js` | No pagination on notifications                                   | `page`+`limit` params, max 50/page                                                       |
| `Backend/services/vendorPayoutService.js`                              | `Query.limit(10000)` on financial data                           | Two paginated loops (completed orders + paid orders)                                     |
| `Backend/services/totReportingService.js`                              | `Query.limit(5000)` on tax reporting                             | Paginated loop, 100/page with offset                                                     |

### 1.2 Real-time Subscription Bugs

**File:** `Website/Context/NotificationContext.jsx`

**Bug 1 — Double-init loop:**  
Single `useEffect([initializeNotifications, handleNewNotification])` was re-running whenever `handleNewNotification` changed, causing infinite re-subscription cycles.  
**Fix:** Split into two separate `useEffect`s with stable dependency arrays.

**Bug 2 — API call on every WebSocket event:**  
`async` realtime callback called `await getCurrentUser()` on every notification event — hammering Appwrite for data already available at init time.  
**Fix:** Added `currentUserIdRef = useRef(null)` populated at init. Realtime callback now synchronous and reads from ref (zero API calls).

### 1.3 M-Pesa Polling Memory Leak

**File:** `Mobileapp/app/(Screens)/Payments.jsx`

**Bug:** Recursive `setTimeout` polling continued after component unmount.  
**Fix:** Added `cancelPollRef = useRef(false)`, cleanup effect sets it to `true` on unmount. Poll checks ref before scheduling next iteration.

---

## Phase 2 — Coordination Layer

### 2.1 Request Tracing

**File:** `Backend/middleware/requestTracing.js`

Every request now gets a correlation ID:

- Reads `X-Correlation-ID` / `X-Request-ID` header, or auto-generates `${hex timestamp}-${4 random bytes}`
- Stored in `AsyncLocalStorage` via `correlationStore` — available anywhere in the call stack without passing through function arguments
- Echoed back in response headers
- Response interceptor logs method, path, status, and duration at request completion

### 2.2 Structured Logging (Winston)

**File:** `Backend/src/lib/logger.js`

- JSON output in production, colorized in development
- Automatic redaction of sensitive fields (`password`, `token`, `apiKey`, `cvv`, `accountNumber`, etc.)
- Correlation ID injected into every log entry from `AsyncLocalStorage`
- Separate `auditLogger` — writes to `logs/financial-audit.log` with 30-file rotation for compliance
- `logger.withMeta(meta)` convenience wrapper

### 2.3 v1 API Gateway Routes

**Files:** `Backend/routes/v1.js`, `Backend/controllers/v1/homeFeedController.js`

`GET /api/v1/home-feed` — orchestrated homepage payload:

- Returns featured products + categories + Africa fact + platform settings in **one request** (vs 4-6 previously)
- Guest payload cached for 5 minutes (high cache hit ratio)
- Authenticated overlay adds premium status + premium deals without re-fetching guest data
- Optional auth middleware — guest requests are never blocked

`GET /api/v1/health` — liveness probe for load balancers  
`GET /api/v1/cache/stats` — cache hit/miss counters (guarded in production)

---

## Phase 3 — Infrastructure Intelligence

### 3.1 Redis Cache Layer

**Files:** `Backend/src/lib/cache/cacheKeys.js`, `Backend/src/lib/cache/cacheClient.js`, `Backend/src/lib/cache/invalidateCache.js`

**Key governance (`cacheKeys.js`):**

- Central registry — no ad-hoc key strings anywhere in the codebase
- Naming convention: `nf:<domain>:<identifier>:<variant>`
- TTL constants: STATIC=6h, LONG=30m, MEDIUM=5m, SHORT=1m, LIVE=10s

**Cache client (`cacheClient.js`):**

- `getOrSet(key, ttl, fetcher, tags)` — cache-aside pattern
- Tag-based invalidation — `invalidateTag('products')` clears all product keys atomically
- `cacheMiddleware(key, ttl, tags)` — Express middleware, sets `X-Cache: HIT/MISS` headers
- Hit/miss/error counters accessible via `getStats()`

**Invalidation strategies (`invalidateCache.js`):**
Domain-specific invalidation called after writes:

- `onProductUpdated(id, {category})` — clears product detail, featured, trending, home feed, category pages 1-3
- `onVendorUpdated(vendorId)` — clears vendor profile, featured vendors, dashboard summary
- `onPremiumStatusChanged(userId)` — clears premium status, monthly summary
- `flushAll()` — scan-and-delete all `nf:*` keys (avoids FLUSHDB blocking)

**Fallback:** When `REDIS_URL` is absent, existing in-memory fallback in `services/redisClient.js` activates automatically — development works without Redis installed.

### 3.2 Queue System (BullMQ)

**Files:** `Backend/src/jobs/queues/index.js`, workers in `Backend/src/jobs/workers/`

**9 queues with domain-appropriate retry policies:**

| Queue                       | Concurrency | Retries            | Purpose                                    |
| --------------------------- | ----------- | ------------------ | ------------------------------------------ |
| `nf:notifications`          | 5           | 5, exp backoff 1s  | In-app + batch notifications               |
| `nf:emails`                 | 3           | 5, exp backoff 3s  | Order confirmations, subscription receipts |
| `nf:miles`                  | 10          | 3, exp backoff 2s  | Nile Miles calculation                     |
| `nf:order-events`           | 3           | 5, exp backoff 2s  | Order lifecycle side-effects               |
| `nf:payment-reconciliation` | 2           | 10, exp backoff 5s | Stripe/M-Pesa matching (keeps 1000 failed) |
| `nf:webhook-retry`          | 5           | 7, exp backoff 10s | Outbound webhook retries                   |
| `nf:fraud-check`            | 3           | 3                  | Risk scoring                               |
| `nf:analytics`              | 5           | 2                  | Event aggregation (non-critical)           |
| `nf:recommendations`        | 2           | 2                  | Periodic re-scoring                        |

**Workers:**

- `notificationWorker.js` — handles `in-app` and `batch` job types; idempotent via job IDs
- `nileMilesWorker.js` — awards miles post-payment; formula: `base = floor(total/10)`, premium users get `2x`; logs to audit logger
- `orderEventsWorker.js` — dispatches fraud check, notifications, and miles jobs based on order lifecycle events

**Startup:** Workers are only started when `NODE_ENV=production` or `START_WORKERS=true` to avoid Redis dependency in local development.

**Note:** BullMQ uses a **separate** IORedis connection from the cache client — required because BullMQ uses blocking commands (`BRPOP`) that cannot share a connection with regular key operations.

---

## Dependency Changes

### Backend/package.json

Added:

- `bullmq@^5.51.1` — Queue system (installed)
- `winston@^3.19.0` — Structured logging (was already installed)

---

## Environment Variables Required

### New (queue + cache layer):

```
REDIS_URL=redis://...           # Redis connection. Absent = in-memory fallback
START_WORKERS=true              # Start BullMQ workers in non-production environments
LOG_TO_FILE=true                # Enable file transports in development
INTERNAL_METRICS_KEY=<secret>   # Bearer token for /api/v1/cache/stats in production
```

### Existing (unchanged):

```
APPWRITE_DATABASE_ID
APPWRITE_PROJECT_ID
APPWRITE_API_KEY
APPWRITE_ENDPOINT
APPWRITE_PRODUCT_COLLECTION_ID
APPWRITE_CATEGORIES_COLLECTION_ID
APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID
```

---

## Remaining Work (Phase 4)

| Priority | Item                                                                                               | Complexity |
| -------- | -------------------------------------------------------------------------------------------------- | ---------- |
| HIGH     | Apply `cacheMiddleware` to high-read routes (`/categories`, `/featured-products`, `/africa/facts`) | Low        |
| HIGH     | `vendorController.js` line 186 — products fetch without limit                                      | Low        |
| MEDIUM   | Email queue worker (`emailWorker.js`)                                                              | Medium     |
| MEDIUM   | Frontend: Update Admin Orders page for paginated API response format                               | Medium     |
| MEDIUM   | Frontend: Update Vendor Notifications page for paginated response                                  | Low        |
| MEDIUM   | Analytics + AI logging queue workers                                                               | Medium     |
| LOW      | Remove/relocate `ArtisansController.js` stub                                                       | Low        |
| LOW      | v1 API routes for dashboard summary, product search, vendor profile                                | High       |
| LOW      | Distributed rate limiting with Redis (currently in-process)                                        | Medium     |

---

## Architecture Principles Applied

1. **No silent failures** — All paginated fetches now loop until `total` is satisfied
2. **Financial data is exact** — `vendorPayoutService` and `totReportingService` now fetch complete datasets regardless of size
3. **Cache-aside at the edge** — Reads check cache first; writes invalidate by tag, not individual key
4. **Queue side-effects** — Notifications, miles, fraud checks are asynchronous and retryable — they no longer block order creation
5. **Correlation everywhere** — Every log line in production will carry the same `correlationId` as the HTTP request that triggered it
6. **Graceful degradation** — Cache failure, queue failure, and worker startup failure are all non-fatal; the server continues serving requests
