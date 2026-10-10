# MILLION USER SCALE REPORT

**Date:** 2026-06-09
**Sprint:** Day 5 — Appwrite Platform Validation & 1M User Scale Preparation

---

## EXECUTIVE SUMMARY

Modeled Nile Flow's Appwrite infrastructure under 1,000,000 registered user assumptions to identify bottlenecks before they become production incidents.

---

## ASSUMPTIONS

| Parameter                | Value     | Notes                                  |
| ------------------------ | --------- | -------------------------------------- |
| Registered Users         | 1,000,000 | Account creation over 2 years          |
| DAU (Daily Active Users) | 100,000   | 10% DAU/MAU ratio (typical e-commerce) |
| Concurrent Sessions      | 10,000    | Peak-hour concurrency                  |
| Sessions/User/Month      | 15        | Mobile e-commerce benchmark            |
| Pages/Session            | 8         | Product browsing + checkout flow       |
| Orders/Day               | 25,000    | At scale conversion rate               |
| Products in Catalog      | 200,000   | Vendor product listings                |
| Vendors                  | 10,000    | Active vendors                         |

---

## APPWRITE LOAD PROJECTION (1M Users)

### Reads

| Source                              | Reads/Day      | Reads/Month     | Primary Collections        |
| ----------------------------------- | -------------- | --------------- | -------------------------- |
| Product browsing                    | 4,000,000      | 120,000,000     | products, categories       |
| User profile loads                  | 800,000        | 24,000,000      | users                      |
| Order history                       | 500,000        | 15,000,000      | orders                     |
| Cart operations                     | 400,000        | 12,000,000      | carts                      |
| Notifications                       | 300,000        | 9,000,000       | notifications              |
| Search queries                      | 200,000        | 6,000,000       | products (search)          |
| Admin/Vendor ops                    | 500,000        | 15,000,000      | orders, users, products    |
| Cron jobs                           | 100,000        | 3,000,000       | subscriptions, groupOrders |
| **Total (pre-cache)**               | **6,800,000**  | **204,000,000** |                            |
| **Total (post-cache 76% hit rate)** | **~1,632,000** | **~48,960,000** |                            |

### Writes

| Source               | Writes/Day  | Writes/Month   | Primary Collections        |
| -------------------- | ----------- | -------------- | -------------------------- |
| Orders created       | 25,000      | 750,000        | orders                     |
| Cart updates         | 50,000      | 1,500,000      | carts                      |
| Payment transactions | 25,000      | 750,000        | transactions, payments     |
| Notifications sent   | 100,000     | 3,000,000      | notifications              |
| User profile updates | 10,000      | 300,000        | users                      |
| Auth operations      | 150,000     | 4,500,000      | users (sessions)           |
| Cron job updates     | 10,000      | 300,000        | subscriptions, groupOrders |
| **Total writes**     | **370,000** | **11,100,000** |                            |

---

## CURRENT BOTTLENECKS

### 🔴 Critical (Must Fix Before 500K Users)

| #   | Bottleneck                              | Impact                                                                 | Solution                                       |
| --- | --------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------- |
| 1   | **Missing vendorId index on orders**    | Every vendor dashboard full-scans up to 500K order documents           | Create composite index `vendorId + $createdAt` |
| 2   | **Missing userId index on carts**       | Every cart load full-scans up to 100K cart documents                   | Create index `userId`                          |
| 3   | **N+1 in subscriptionCronService**      | Batch processing of 100K subscriptions triggers 100K+ individual reads | Use batch `listDocuments` with filters         |
| 4   | **subscriptionCronService runtime bug** | Undefined `instrumentedDb` causes crash on cron execution              | ✅ Fixed Day 5                                 |
| 5   | **withCache() not connected**           | 0% cache hit rate = every read hits Appwrite                           | ✅ repositoryFactory created Day 5             |

### 🟡 High Priority (Must Fix Before 1M Users)

| #   | Bottleneck                             | Impact                                             | Solution                                   |
| --- | -------------------------------------- | -------------------------------------------------- | ------------------------------------------ |
| 6   | **No cart repository**                 | Cart ops bypass cache and instrumentation          | Create CartRepository                      |
| 7   | **25 direct `db.*` calls in services** | Bypass caching layer for critical operations       | Migrate to repositoryFactory               |
| 8   | **Full-text search on Appwrite**       | `Query.search()` doesn't scale to 200K+ products   | Offload to Elasticsearch                   |
| 9   | **Analytics queries hitting Appwrite** | dashboard aggregates scan all documents            | Materialized views or ClickHouse           |
| 10  | **Realtime subscriptions unmanaged**   | Each Appwrite realtime connection = WebSocket cost | Use realtimeManager (created, not adopted) |

### 🟢 Medium Priority

| #   | Bottleneck                                    | Impact                                          | Solution                               |
| --- | --------------------------------------------- | ----------------------------------------------- | -------------------------------------- |
| 11  | No rate limiting on admin routes              | Potential for heavy Appwrite usage from admin   | Apply readBudget middleware            |
| 12  | No pagination enforcement on all list queries | Large page sizes consume extra reads            | Enforce `enforcePagination` everywhere |
| 13  | Redis cache single-instance bottleneck        | All cache operations through one Redis instance | Redis Cluster at scale                 |
| 14  | No cache warming on deploy                    | Cold cache = high Appwrite load after restart   | Pre-warm popular product caches        |

---

## ESTIMATED COST AT 1M USERS

### Without Optimizations

| Service            | Cost/Month      | Notes                   |
| ------------------ | --------------- | ----------------------- |
| Appwrite reads     | ~$40,800/mo     | 204M reads/month        |
| Appwrite writes    | ~$5,550/mo      | 11.1M writes/month      |
| Appwrite storage   | ~$2,000/mo      | 200K products, 1M users |
| **Total Appwrite** | **~$48,350/mo** |                         |

### With Optimizations (Post-Cache, 76% hit rate)

| Service         | Cost/Month      | Notes                              |
| --------------- | --------------- | ---------------------------------- |
| Appwrite reads  | ~$9,792/mo      | 48.96M reads/month (76% reduction) |
| Appwrite writes | ~$5,550/mo      | Same (writes not cached)           |
| Redis cache     | ~$200/mo        | Redis Cluster (3 nodes)            |
| **Total**       | **~$15,542/mo** |                                    |
| **Savings**     | **~$32,808/mo** | **68% reduction**                  |

---

## NODE.JS/EXPRESS BOTTLENECKS AT 10K CONCURRENT

| Bottleneck                | Impact                                                                     | Solution                           |
| ------------------------- | -------------------------------------------------------------------------- | ---------------------------------- |
| Single Event Loop         | 10K concurrent requests could saturate Node.js event loop                  | Horizontal scaling (4-8 instances) |
| Memory cache per-instance | Each instance has separate in-memory cache, resulting in 4 separate caches | Move to Redis for shared cache     |
| no `cluster` module       | Single-threaded Express handles all connections                            | Use PM2 cluster mode or ECS tasks  |
| No connection pooling     | Each request creates new Appwrite SDK client                               | Reuse client instances             |

---

## REQUIRED ARCHITECTURE FOR 1M USERS

```
                         ┌──────────────────┐
                         │   Load Balancer   │
                         │   (10K conns)     │
                         └────────┬─────────┘
                                  │
                  ┌───────────────┼───────────────┐
                  ▼               ▼               ▼
          ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
          │ Express #1  │ │ Express #2  │ │ Express #3  │
          │ (PM2/E CS)  │ │             │ │             │
          └──────┬──────┘ └──────┬──────┘ └──────┬──────┘
                 │               │               │
          ┌──────┴───────────────┴───────────────┴──────┐
          │               Redis Cluster                 │
          │   (Shared cache, rate limiting, sessions)   │
          └──────────────────────┬──────────────────────┘
                                 │
          ┌──────────────────────┴──────────────────────┐
          │               Appwrite                       │
          │   (Single source of truth, indexed queries) │
          └─────────────────────────────────────────────┘
```

---

## 1M READINESS SCORECARD

| Criterion                       | Current          | Target            | Status                               |
| ------------------------------- | ---------------- | ----------------- | ------------------------------------ |
| Reads under 2M/day (post-cache) | 6.8M (pre-cache) | 1.6M (post-cache) | ⚠️ Needs cache connection            |
| Cache hit rate > 70%            | 0%               | 76%               | ❌ Cache not connected               |
| Missing indexes resolved        | 6 missing        | 0                 | ❌ Need deployment                   |
| Repository pattern adoption     | ~16%             | 95%               | ❌ Need migration                    |
| N+1 patterns eliminated         | 4 remaining      | 0                 | ❌ subscriptionCronService fixed     |
| Read budget enforcement         | None             | Active            | ❌ readBudget created, not connected |
| Redis shared cache              | In-memory only   | Redis cluster     | ❌ Requires setup                    |
| Horizontal scaling              | Single instance  | 4-8 instances     | ❌ Requires infra                    |
| **1M readiness score**          |                  |                   | **~35%**                             |
