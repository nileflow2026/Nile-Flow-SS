# Phase 4 Architecture: Operational Infrastructure

**Status:** Implemented  
**Date:** 2026-05-20  
**Scope:** Backend, Website, Mobileapp, AdminDashboard, Infra

---

## Context

Nile Flow's Phase 1–3 work established correctness: pagination fixes, memory leak repairs, a v1 home-feed API, BullMQ queues, Winston logging, and Redis-backed caching. Phase 4 addresses the next layer — the operational and governance infrastructure required before the platform can scale to continental traffic volumes.

Four problem areas drove this phase:

1. **No visibility** — no metrics, no dashboards, no scrape endpoint. Incidents were discovered by users, not by alerting.
2. **In-process rate limiting** — `express-rate-limit` with a memory store is per-instance. A second Node.js process has a completely independent counter, making limits meaningless under horizontal scaling.
3. **Uncoordinated data fetching** — every frontend component fetched independently, with no deduplication, no caching, no retry policy, and no consistent error handling. Identical requests fired in parallel from the same page.
4. **Implicit service boundaries** — no definition of which code owned which data, making it easy for controllers to reach into unrelated collections.

---

## Decision 1: Prometheus over a managed APM

### Options considered

| Option               | Pros                                 | Cons                                                  |
| -------------------- | ------------------------------------ | ----------------------------------------------------- |
| Datadog / New Relic  | Turnkey, rich UI                     | $300–$2000/month at scale; vendor lock-in             |
| OpenTelemetry        | Standard, future-proof               | Complex setup; OTLP pipeline needed                   |
| Prometheus + Grafana | Open source, self-hosted, pull model | Requires scrape config and Grafana Cloud or self-host |
| None (log-only)      | Zero cost now                        | Blind to traffic, cache, queue, and payment health    |

### Decision

Prometheus + Grafana was chosen. The Prometheus pull model fits Nile Flow's deployment model — a single backend process that can expose `/metrics` without a sidecar. Grafana Cloud has a free tier sufficient for early scale. The entire metric namespace is prefixed `nf_` with sub-prefixes per domain (`nf_http_`, `nf_cache_`, `nf_queue_`, `nf_payment_`, `nf_ai_`, etc.).

### Registry isolation

A named registry instance is used (`new Registry()`) rather than the `prom-client` global default. This prevents metric conflicts if tests or tooling ever instantiate the module twice.

```js
// Backend/src/observability/metrics.js
const { Registry } = require("prom-client");
const registry = new Registry();
```

The global default registry is intentionally left empty.

### Cardinality governance

Route labels on HTTP metrics are normalized before recording. Without normalization, Appwrite document IDs in paths like `/api/orders/67f3a1b2...` would create a unique time series per request, eventually crashing Prometheus's storage.

```js
// Backend/src/observability/requestMetrics.js
const normalizeRoute = (path) =>
  path
    .replace(/\/[0-9a-f]{20,}/gi, "/:id") // Appwrite IDs
    .replace(/\/[0-9a-f-]{36}/gi, "/:id") // UUIDs
    .replace(/\/\d+/g, "/:id") // numeric IDs
    .replace(/\/cs_[a-zA-Z0-9_]+/g, "/:id"); // Stripe session IDs
```

The `/metrics` endpoint itself is protected: in production it requires an `x-metrics-key` header matching `INTERNAL_METRICS_KEY`. At the NGINX layer it is additionally restricted to `127.0.0.1` and the internal network range.

---

## Decision 2: Redis-backed distributed rate limiting

### Problem with in-process limiting

`express-rate-limit` with its default `MemoryStore` counts requests per IP inside a single Node.js process. When two instances run behind a load balancer, each instance allows the full limit — doubling the effective cap per IP.

### Implementation

`rate-limit-redis` is used as the backing store, connected to the same Redis instance used by the cache layer. A critical API constraint: `rate-limit-redis` v4 requires a `sendCommand` adapter, not a direct Redis client reference.

```js
// Backend/middleware/distributedRateLimit.js
new RedisStore({
  sendCommand: (...args) => redis.sendCommand(args),
  prefix: `nf:rl:${namespace}:`,
});
```

### Fallback behavior

If Redis is unavailable (e.g., `REDIS_URL` is unset, falling back to `InMemoryRedis`), the limiter detects the absence of a real `sendCommand` implementation and falls back to an in-memory store. This is logged as a warning. The server does not crash.

```js
const isRedisConnected = () =>
  redis &&
  typeof redis.sendCommand === "function" &&
  !(redis instanceof InMemoryRedis);
```

### Namespaces defined

| Limiter   | Window | Limit   | Notes                                                        |
| --------- | ------ | ------- | ------------------------------------------------------------ |
| `auth`    | 15 min | 10 req  | `skipSuccessfulRequests: true` — only counts failed attempts |
| `payment` | 1 min  | 20 req  | Covers all payment routes                                    |
| `ai`      | 1 min  | 15 req  | Token budget protection                                      |
| `vendor`  | 1 min  | 120 req | Dashboard polling tolerance                                  |
| `admin`   | 1 min  | 200 req | Higher for data-heavy admin views                            |
| `api`     | 1 min  | 150 req | General customer API                                         |
| `search`  | 1 min  | 60 req  | Prevents scraping                                            |

All limiters increment `nf_rate_limit_hits_total{limiter="..."}` so Grafana can alert on abuse spikes.

---

## Decision 3: TanStack Query as the frontend data layer

### Problem

Each component fetching data independently with raw `axiosClient.get()` meant:

- The same endpoint called multiple times per page render (no deduplication)
- No standard retry policy — some components retry infinitely, some never
- No cache — navigating back to a page always refetches
- No loading/error state standardization
- No mechanism to invalidate related data after a mutation

### Why TanStack Query over alternatives

| Option              | Why rejected                                                             |
| ------------------- | ------------------------------------------------------------------------ |
| SWR                 | Less control over retry policy; no mutation cache; less active ecosystem |
| Apollo              | GraphQL-only; backend is REST                                            |
| Redux Toolkit Query | Heavy; requires Redux in the tree; overkill for a React Query use case   |
| Raw React Query     | TanStack Query IS React Query v5 — this is the same library              |
| Context + useEffect | Status quo — the exact problem being solved                              |

### StaleTime governance

StaleTime values are deliberately matched to backend cache TTLs so that a fresh response from Redis is not immediately refetched by the client:

| Constant              | Value  | Used for                               |
| --------------------- | ------ | -------------------------------------- |
| `STALE.STATIC`        | 30 min | Categories, settings, cultural content |
| `STALE.LONG`          | 10 min | Vendor profiles, featured vendors      |
| `STALE.STANDARD`      | 5 min  | Featured products, home feed           |
| `STALE.USER`          | 2 min  | User profile, premium status           |
| `STALE.NOTIFICATIONS` | 30 sec | Notification counts                    |
| `STALE.LIVE`          | 15 sec | Active orders, delivery tracking       |

### Query key registry

All query keys are defined in a single `queryKeys.js` file per frontend. No component or hook ever uses an inline string array as a key. This makes invalidation predictable and refactoring safe.

```js
// Website/src/hooks/api/queryKeys.js
export const queryKeys = {
  homeFeed: {
    feed: () => ["homeFeed", "feed"],
  },
  orders: {
    list: (page = 1) => ["orders", "list", page],
    detail: (id) => ["orders", "detail", id],
  },
  // ...
};
```

### Retry policy

4xx errors are explicitly excluded from retries. A `RATE_LIMITED` 429 or a `FORBIDDEN` 403 will not improve by retrying. Only network errors and 5xx responses are retried, up to 3 times, with exponential backoff capped at 10 seconds.

```js
const shouldRetry = (failureCount, error) => {
  if (error?.response?.status >= 400 && error?.response?.status < 500)
    return false;
  return failureCount < 3;
};
```

### Mutations have zero retry

Mutations (POST, PATCH, DELETE) are intentionally set to `retry: 0`. A double-submitted order or a double-cancelled subscription causes real financial damage. If a mutation fails, the user must explicitly retry.

### Provider placement

`QueryClientProvider` is placed outside all domain providers (Auth, Premium, Notifications, Cart) so that any provider can use query hooks internally. The hierarchy is:

```
ErrorBoundary
  QueryClientProvider        ← must be outermost real provider
    ThemeProvider
      Router / StripeProvider
        CustomerAuthProvider
          PremiumProvider
            NotificationProvider
              CartProvider
```

### Mobile-specific adjustments

The Mobileapp query client sets `gcTime: 15 * 60 * 1000` (15 min) instead of 10 minutes to survive background-to-foreground transitions without a full refetch. `refetchIntervalInBackground: false` is set globally to conserve battery.

---

## Decision 4: Domain ownership registry

### Motivation

With 10+ Appwrite collections accessed across dozens of controllers, there was no enforcement of which service "owned" which data. Any controller could read or write any collection. This makes it impossible to:

- Reason about the blast radius of a schema change
- Plan a future microservices split
- Enforce consistency rules (e.g., "balance mutations must go through the LOYALTY service")

### Approach

`Backend/src/domains/index.js` is a documentation-first boundary definition. It does not enforce anything at runtime today — it is a governance document expressed in code.

Each domain entry declares:

- `owner` — the primary file responsible
- `cacheNamespace` — the Redis key prefix the domain controls
- `queues` — BullMQ queue names the domain enqueues to
- `metricsPrefix` — Prometheus metric prefix
- `appwriteCollections` — the collections the domain may access

```js
LOYALTY: {
  cacheNamespace: "loyalty:",
  queues: ["nile-miles"],
  metricsPrefix: "nf_loyalty_",
  appwriteCollections: ["nileMiles", "rewardHistory", "gamificationTiers"],
}
```

### Cross-domain communication rules

- A domain may only read its own `appwriteCollections`
- Cross-domain data needs go through the `order-events` BullMQ queue (async) or via HTTP to the owning domain's route
- The only approved aggregator is `/api/v1/home-feed` — the single orchestration endpoint that composes across catalog, premium, and content domains for the homepage

---

## Decision 5: NGINX as the edge layer

### Rationale

Nile Flow's backend is a single Node.js process. Node.js is single-threaded and cannot saturate multiple CPUs for I/O-bound work without clustering. NGINX handles:

- TLS termination (Node.js doesn't need to do crypto)
- Connection rate limiting (before requests hit Node.js at all)
- Edge caching for high-read endpoints (`/api/v1/home-feed` cached 60s for unauthenticated requests)
- Static asset caching (7-day immutable for hashed assets)
- `least_conn` load balancing across future Node.js instances

### Rate limit zones at NGINX

NGINX-level rate limiting is a first defense — it operates at the TCP/HTTP level before Node.js sees the request. The Redis-backed limiters in Node.js are a second defense, catching abuse that bypasses NGINX (direct IP connections, internal services).

### Home feed cache bypass

The `/api/v1/home-feed` edge cache uses `$http_cookie` as part of the cache key and bypasses cache entirely when `customer_session` cookie is present:

```nginx
proxy_cache_bypass  $cookie_customer_session;
proxy_no_cache      $cookie_customer_session;
```

This means anonymous users get the cached response (60s TTL), while authenticated users always get a fresh response that includes their premium status and personalized deals.

---

## Files Created / Modified

### New files

| File                                                     | Purpose                                                     |
| -------------------------------------------------------- | ----------------------------------------------------------- |
| `Backend/src/observability/metrics.js`                   | Central Prometheus registry — all metric definitions        |
| `Backend/src/observability/requestMetrics.js`            | HTTP metrics Express middleware                             |
| `Backend/src/observability/queueMetrics.js`              | Queue depth poller + worker helper functions                |
| `Backend/src/observability/appwriteMetrics.js`           | Proxy wrapper that instruments all Appwrite DB calls        |
| `Backend/middleware/distributedRateLimit.js`             | Redis-backed distributed rate limiters (7 namespaces)       |
| `Backend/src/domains/index.js`                           | Domain ownership registry                                   |
| `Website/src/lib/queryClient.js`                         | TanStack Query client for Website                           |
| `Website/src/hooks/api/queryKeys.js`                     | Centralized query key registry                              |
| `Website/src/hooks/api/useHomeFeedQuery.js`              | Home feed + granular selectors                              |
| `Website/src/hooks/api/useOrdersQuery.js`                | Orders list, detail, tracking, cancel mutation              |
| `Website/src/hooks/api/usePremiumStatusQuery.js`         | Premium status, deals, summary, subscribe/cancel            |
| `Website/src/hooks/api/useNotificationsQuery.js`         | Notifications with 30s polling                              |
| `Website/src/hooks/api/invalidation.js`                  | Domain-scoped cache invalidation helpers                    |
| `Mobileapp/lib/queryClient.js`                           | TanStack Query client for Mobileapp                         |
| `Mobileapp/hooks/api/queryKeys.js`                       | Query key registry (mobile)                                 |
| `Mobileapp/hooks/api/useHomeFeedQuery.js`                | Home feed + selectors                                       |
| `Mobileapp/hooks/api/useOrdersQuery.js`                  | Orders hooks for mobile                                     |
| `Mobileapp/hooks/api/invalidation.js`                    | Invalidation helpers (mobile)                               |
| `AdminDashboard/src/lib/queryClient.js`                  | TanStack Query client (admin, `refetchOnWindowFocus: true`) |
| `AdminDashboard/src/hooks/api/queryKeys.js`              | Query keys (admin)                                          |
| `AdminDashboard/src/hooks/api/useAdminDashboardQuery.js` | Dashboard summary with 2-min auto-refresh                   |
| `AdminDashboard/src/hooks/api/useOrdersQuery.js`         | Paginated orders, cancellation queue, mutations             |
| `infra/nginx/nileflow.conf`                              | NGINX reverse proxy config                                  |
| `infra/grafana/dashboards/commerce-operations.json`      | Grafana dashboard (15 panels)                               |

### Modified files

| File                         | Change                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------- |
| `Backend/src/index.js`       | Added `requestMetricsMiddleware`, `/metrics` endpoint, `startQueueMetricsPoller()` |
| `Website/src/App.jsx`        | Added `QueryClientProvider` wrapping all providers                                 |
| `AdminDashboard/src/App.jsx` | Added `QueryClientProvider` wrapping `AuthProvider` + `Router`                     |
| `Mobileapp/app/_layout.jsx`  | Added `QueryClientProvider` as second provider after `ErrorBoundary`               |

---

## Environment Variables Required

| Variable               | Where          | Purpose                                                                    |
| ---------------------- | -------------- | -------------------------------------------------------------------------- |
| `INTERNAL_METRICS_KEY` | Backend `.env` | Bearer token required to scrape `/metrics` in production                   |
| `REDIS_URL`            | Backend `.env` | Enables Redis-backed rate limiting and cache (absent = in-memory fallback) |
| `START_WORKERS`        | Backend `.env` | Set to `true` to enable BullMQ workers in development                      |

---

## What This Does Not Cover

The following items were identified but deferred:

- **VendorDashboard / RiderDashboard** — TanStack Query not yet wired. These dashboards have lower traffic. Hooks should follow the same pattern as AdminDashboard when implemented.
- **Route-level `cacheMiddleware`** — applying `cacheMiddleware` to `/api/categories`, `/api/featured-products`, and `/api/africa/facts` individually to serve Redis-cached responses for the highest-read non-v1 routes.
- **Email worker** — `Backend/src/jobs/workers/emailWorker.js` not yet created. The `email` queue is defined but has no processor.
- **`appwriteMetrics` integration** — the Appwrite instrumentation proxy (`createInstrumentedDb`) is created but not yet applied to existing controllers. Controllers instantiate `databases` directly. Integrating the proxy requires replacing those instantiation points.
