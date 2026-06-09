# HOT COLLECTIONS REPORT

**Date:** 2026-06-09
**Sprint:** Day 5 — Appwrite Platform Validation

---

## TOP COLLECTIONS BY ESTIMATED READ VOLUME

Based on code path analysis and expected access patterns at 100,000 users.

| Rank | Collection        | Est. Reads/Day | Est. Writes/Day | Read/Write Ratio | Cacheability | Priority    |
| ---- | ----------------- | -------------- | --------------- | ---------------- | ------------ | ----------- |
| 1    | **products**      | 400,000        | 200             | 2000:1           | HIGH (95%)   | 🔴 Critical |
| 2    | **users**         | 200,000        | 5,000           | 40:1             | HIGH (85%)   | 🔴 Critical |
| 3    | **orders**        | 250,000        | 50,000          | 5:1              | MEDIUM (60%) | 🔴 Critical |
| 4    | **carts**         | 100,000        | 25,000          | 4:1              | MEDIUM (50%) | 🟡 High     |
| 5    | **notifications** | 100,000        | 50,000          | 2:1              | LOW (40%)    | 🟡 High     |
| 6    | **transactions**  | 75,000         | 25,000          | 3:1              | MEDIUM (60%) | 🟡 High     |
| 7    | **subscriptions** | 50,000         | 10,000          | 5:1              | MEDIUM (50%) | 🟡 High     |
| 8    | **categories**    | 50,000         | 10              | 5000:1           | HIGH (98%)   | 🟢 Medium   |
| 9    | **nileMiles**     | 30,000         | 15,000          | 2:1              | LOW (40%)    | 🟢 Medium   |
| 10   | **groupOrders**   | 25,000         | 5,000           | 5:1              | MEDIUM (60%) | 🟢 Medium   |

---

## COLLECTION ANALYSIS

### 1. 🔴 products (Read-Heavy Champion)

**Access Pattern:**

- `listDocuments` with filters: status, featured, category, premiumDeal
- `search` with full-text on name
- `getDocument` by ID for product detail pages

**Read Profile:** 400K reads/day, 200 writes/day = 2000:1 ratio

**Optimal Cache Strategy:** Static cache, TTL 10 minutes, SWR grace 15 minutes

**Current State:**

- ProductRepository exists with all required methods
- `withCache()` wrapper NOT applied — each request hits Appwrite
- Route-level cache middleware ON for `/api/products/featured`
- Missing indexes for `premiumDeal + status` and `status + viewCount`

**Recommendation:**

1. ✅ Use `productRepo()` from repositoryFactory to get caching instantly
2. ✅ Add composite indexes for all 5 product query patterns
3. ✅ Apply cache middleware to all product GET routes

---

### 2. 🔴 users (High-Frequency Reads)

**Access Pattern:**

- `getDocument` by userId (profile, auth, preferences)
- `listDocuments` by email for admin lookups
- `listDocuments` by role for vendor/rider management

**Read Profile:** 200K reads/day, 5K writes/day = 40:1 ratio

**Optimal Cache Strategy:** Medium cache, TTL 3 minutes

**Current State:**

- UserRepository exists with getProfile, getPreferences
- `withCache()` NOT applied
- Auth middleware loads user profile on every request (3-4x per request)

**Recommendation:**

1. ✅ Use `userRepo()` from repositoryFactory
2. ✅ Auth middleware should cache user profile per request
3. ✅ Add composite index on `role + $createdAt`

---

### 3. 🔴 orders (High Write Volume)

**Access Pattern:**

- `listDocuments` by userId (order history)
- `listDocuments` by vendorId (vendor dashboard)
- `getDocument` by orderId (order detail)
- `updateDocument` on status changes (frequent mutations)

**Read Profile:** 250K reads/day, 50K writes/day = 5:1 ratio

**Optimal Cache Strategy:** Short cache, TTL 30 seconds, invalidate on status change

**Current State:**

- OrdersRepository exists but uses string-based filters instead of Query builders
- Missing index on `vendorId` — every vendor dashboard triggers full scan

**Recommendation:**

1. ✅ Use `orderRepo()` from repositoryFactory
2. ✅ Fix `listOrdersForVendor` to use Query.equal instead of string
3. 🔴 **CRITICAL**: Add vendorId index before scaling past 10K users

---

### 4. 🟡 carts (Session-Based Reads)

**Access Pattern:**

- `listDocuments` by userId (cart load)
- `createDocument` (add to cart)
- `updateDocument` (update quantity)

**Read Profile:** 100K reads/day, 25K writes/day = 4:1 ratio

**Optimal Cache Strategy:** Short cache, TTL 30 seconds

**Current State:**

- No dedicated CartRepository exists
- Cart operations go through direct `db` calls
- Missing index on `userId`

**Recommendation:**

1. 🆕 Create CartRepository
2. ✅ Add composite index on `userId + productId`
3. ✅ Cache cart reads for 30 seconds (high write frequency invalidates)

---

## CACHEABILITY ASSESSMENT

| Cacheability Level | Criteria                                | Collections                                              | Strategy                               |
| ------------------ | --------------------------------------- | -------------------------------------------------------- | -------------------------------------- |
| HIGH (95%+)        | Read-heavy, write-light, rarely mutates | products, categories, settings, content, currencies      | Long TTL, lazy invalidation            |
| MEDIUM (50-85%)    | Balanced read/write, periodic updates   | users, vendors, reviews, orders, subscriptions           | Medium TTL, write-through invalidation |
| LOW (< 50%)        | Write-heavy, constant mutations         | carts, notifications, transactions, nileMiles, auditLogs | Short TTL, no cache for audit          |

---

## OPTIMIZATION PRIORITY MATRIX

```
                    HIGH READ VOLUME      LOW READ VOLUME
HIGH WRITE VOLUME   [orders] (30s TTL)     [auditLogs] (no cache)
LOW WRITE VOLUME    [products] (10m TTL)   [settings] (10m TTL)
                    [users] (3m TTL)       [categories] (10m TTL)
                    [carts] (30s TTL)      [content] (10m TTL)
```

**Key Insight:** `products` and `users` are the highest-impact targets for caching because they have the best read/write ratios. A 95% cache hit rate on products alone saves 380,000 reads/day at 100K users.
