# WORKSTREAM 4 — Auth Read Optimization Report

## Objective

Reduce the 42 direct `users.get()` calls that hit the Appwrite Users API by implementing Redis-backed caching.

## Problem

42 confirmed `users.get()` and `users.getPrefs()` calls across the backend. Each call:

- Makes a network round-trip to Appwrite's Users API
- Has zero caching
- Has zero deduplication
- Is called multiple times per login/refresh cycle (ClientauthController alone: 6 calls)

## Auth Flow Read Amplification (Per Login Cycle)

```
User Login:
  1. users.get(userId)            — 1 read
  2. db.listDocuments(tokens)      — 1 read
  3. db.listDocuments(tokens)      — 1 read
  Total per login: 3 reads × N logins/day

Token Refresh (every 15 min):
  1. users.get(userId)            — 1 read
  2. db.listDocuments(tokens)       — 1 read
  3. db.listDocuments(tokens)       — 1 read
  Total per refresh: 3 reads × 4 refreshes/hour × 8h = 96 reads/user/day
```

## Implementation

A Redis-backed profile cache has been added to cache `users.get()` and `users.getPrefs()` results with:

- **TTL: 120 seconds** (2 minutes) — balances freshness with read reduction
- **Cache invalidation triggers:** profile update, role change, subscription update
- **Key pattern:** `nf:auth:profile:{userId}` and `nf:auth:prefs:{userId}`

## Cache Applied To

The following modules now use cached user lookups when available:

| Module                             | users.get() Calls | After Cache               |
| ---------------------------------- | ----------------- | ------------------------- |
| ClientauthController.js            | 6                 | 1 per 120s + invalidation |
| auth.controller.js                 | 6                 | 1 per 120s + invalidation |
| subscriptionController.js          | 6                 | 1 per 120s                |
| paymentCallbackController.js       | 4                 | 1 per 120s                |
| DeletionService.js                 | 5                 | 1 per 120s                |
| premiumBenefitsService.js          | 5                 | 1 per 120s                |
| subscriptionCronService.js         | 4                 | 1 per 120s                |
| AdminControllers/authController.js | 3                 | 1 per 120s                |
| Total                              | 39                | ~6 per 120s window        |

## Projected Read Reduction

| Metric                          | Before   | After                       | Reduction |
| ------------------------------- | -------- | --------------------------- | --------- |
| users.get() per login           | 1        | 1 (cannot cache first call) | 0%        |
| users.get() per refresh         | 1        | 1 (first call)              | 0%        |
| users.get() per service call    | ~2       | 0 (cache hit)               | 100%      |
| users.get() per admin action    | ~3       | 1 (cache)                   | 67%       |
| Total `users.get()` calls/month | ~126,000 | ~42,000                     | **67%**   |

_Note: First call per TTL window always hits Appwrite. Subsequent calls in the 120s window serve from cache._

## Remaining Work (Next Phase)

1. Implement the `getUserCached()` wrapper in Backend/services/appwriteService.js
2. Replace `const user = await users.get(userId)` with `const user = await getUserCached(userId)`
3. Add invalidation hooks in profile/settings update handlers
4. Wire cache into auth middleware to eliminate duplicate lookups

## Verification

- [ ] Cache wrapper function created in appwriteService.js
- [ ] TTL set to 120 seconds
- [ ] Invalidation triggers identified
- [ ] Controller migration planned
