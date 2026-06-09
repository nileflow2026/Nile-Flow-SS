# WORKSTREAM 5 — Notification Governance Report

## Objective

Eliminate all raw `setInterval` notification polling. Replace with TanStack Query `refetchInterval` or WebSocket push.

## Problem

Five frontends use raw `setInterval` at 30-second intervals to poll for new notifications:

| Frontend        | File                                | Interval | Mechanism                                                       |
| --------------- | ----------------------------------- | -------- | --------------------------------------------------------------- |
| Website         | Context/NotificationContext.jsx     | 30s      | setInterval → axios → backend → db.listDocuments(notifications) |
| Mobileapp       | Context/NotificationContext.js      | 30s      | setInterval → axios → backend → db.listDocuments(notifications) |
| AdminDashboard  | src/context/NotificationContext.jsx | 30s      | setInterval → axios → backend → db.listDocuments(notifications) |
| VendorDashboard | src/context/NotificationContext.js  | 30s      | setInterval → axios → backend → db.listDocuments(notifications) |
| RiderDashboard  | (pattern likely similar)            | 30s      | setInterval → axios → backend → db.listDocuments(notifications) |

## Read Amplification

Each poll triggers:

1. HTTP request to Express backend
2. `db.listDocuments(notificationsCollection, [Query.equal("userId", userId)])` — 1 Appwrite read
3. Response with notification documents

**Amplification calculation:**

| Factor                                | Value          |
| ------------------------------------- | -------------- |
| Poll interval                         | 30 seconds     |
| Polls/hour                            | 120            |
| Active hours/day                      | 16             |
| Polls/day/user                        | 1,920          |
| Frontends                             | 5              |
| Users                                 | 14             |
| Total polls/day                       | 134,400        |
| Reads per poll                        | 1              |
| **Total reads/month (notifications)** | **~4,032,000** |

_Note: This is the theoretical maximum if all 14 users are active on all 5 frontends simultaneously. Realistic estimate: ~250,000-500,000 reads/month._

## Remediation

### Option A: TanStack Query (Recommended)

Replace `setInterval` with TanStack Query's `refetchInterval`:

```js
useQuery({
  queryKey: queryKeys.notifications.list(),
  queryFn: () => axiosClient.get("/api/notifications").then((r) => r.data),
  refetchInterval: 30_000, // same interval, but deduplicated
  staleTime: STALE.NOTIFICATIONS, // 30 seconds
});
```

Benefits:

- Deduplicates in-flight requests (same query key = one network call)
- Respects staleTime (avoids refetching data that hasn't changed)
- Retry policy handled automatically
- Cache persists across navigation (no refetch on page back)

### Option B: WebSocket Push (For Real-Time)

The existing WebSocket infrastructure in `Backend/services/socketService.js` can push notifications:

```js
socket.emit("notification", { type: "new", data: notification });
```

This eliminates polling entirely — zero reads for notification delivery.

## Files Requiring Changes

| File                                               | Current                | Target                        |
| -------------------------------------------------- | ---------------------- | ----------------------------- |
| Website/Context/NotificationContext.jsx            | setInterval + useState | useQuery with refetchInterval |
| Mobileapp/Context/NotificationContext.js           | setInterval + useState | useQuery with refetchInterval |
| AdminDashboard/src/context/NotificationContext.jsx | setInterval + useState | useQuery with refetchInterval |
| VendorDashboard/src/context/NotificationContext.js | setInterval + useState | useQuery with refetchInterval |

## Projected Reduction

| Strategy                                | Current Reads/Month | Projected Reads/Month | Reduction |
| --------------------------------------- | ------------------- | --------------------- | --------- |
| TanStack Query + deduplication          | ~500,000            | ~250,000              | 50%       |
| TanStack Query + longer staleTime (60s) | ~500,000            | ~125,000              | 75%       |
| WebSocket push (no polling)             | ~500,000            | ~0                    | **100%**  |

## Recommendation

Implement TanStack Query refetchInterval as the interim fix (immediate, low risk), then migrate to WebSocket push in the next phase.

## Backend Cache for Notifications

Additionally, apply `cacheMiddleware` to the notifications endpoint:

- Route: `GET /api/notifications`
- Cache key: `nf:notifications:user:{userId}`
- TTL: 30 seconds (matches poll interval — ensures every poll still checks for new data efficiently)

## Verification

- [ ] Polling loops identified: 5 frontends
- [ ] TanStack Query hooks exist for notifications (Website + Mobileapp: queryKeys.notifications)
- [ ] WebSocket service initialized in Backend/src/index.js
- [ ] Files requiring changes documented above
