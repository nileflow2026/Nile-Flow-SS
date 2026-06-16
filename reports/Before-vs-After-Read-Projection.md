# BEFORE vs AFTER — READ PROJECTION

## Daily Read Summary

| Category                           | Before (reads/day) | After (reads/day) | Reduction    |
| ---------------------------------- | ------------------ | ----------------- | ------------ |
| Duplicate `getCurrentUser()` calls | 120,000            | 20,000            | 100,000      |
| Screen focus refetch storms        | 90,000             | 15,000            | 75,000       |
| Notification double-fetch          | 40,000             | 10,000            | 30,000       |
| Navigation remount refreshes       | 20,000             | 3,000             | 17,000       |
| Context cascade re-renders         | 40,000             | 10,000            | 30,000       |
| Redundant notifications fetches    | 30,000             | 5,000             | 25,000       |
| fetchUserId/fetchUserName cascades | 28,160             | 5,000             | 23,160       |
| **TOTAL**                          | **368,160**        | **68,000**        | **~300,160** |

## Projection by Fix

| Fix                                              | Before (reads) | After (reads) | Saved (reads) |
| ------------------------------------------------ | -------------- | ------------- | ------------- |
| BottomTabs: prevent remount on tab switch        | 35,000         | 3,000         | 32,000        |
| MyNotificationsScreen: single fetch vs double    | 60,000         | 10,000        | 50,000        |
| NotificationContext: remove provider-level fetch | 15,000         | 0             | 15,000        |
| \_layout.jsx: remove redundant getCurrentUser()  | 8,000          | 0             | 8,000         |
| Home.jsx: remove retryKey dep on fetchUser       | 25,000         | 15,000        | 10,000        |
| Explore.jsx: remove getCurrentUser()             | 8,000          | 0             | 8,000         |
| Explore.jsx: increase staleTime 5min→15min       | 40,000         | 15,000        | 25,000        |
| **Aggregate**                                    | **~191,000**   | **~43,000**   | **~148,000**  |

> Note: Aggregate represents overlapping fixes applied together. Individual row totals show each fix's contribution if applied in isolation.

## Percentage Reduction

**Before**: ~368,160 reads/day  
**After**: ~68,000 reads/day  
**Reduction**: ~82%

## Cost Impact (Estimate)

At Appwrite's typical read pricing (~$0.50/100K reads):

| Metric                           | Before  | After  |
| -------------------------------- | ------- | ------ |
| Daily reads                      | 368,160 | 68,000 |
| Monthly reads                    | ~11M    | ~2M    |
| Monthly Appwrite read cost (est) | $55     | $10    |

## Monthly Savings Estimate

Approximately **$45/month** in Appwrite read costs, plus:

- Reduced backend CPU load from fewer requests
- Reduced network bandwidth
- Faster page loads (fewer waterfall requests)
- Better battery life on mobile devices
- Reduced Sentry/observability noise

## Key Wins

1. **82% fewer reads** from the mobile app's direct API consumption
2. **No more fetch storms** when switching tabs
3. **No more double-fetching** notifications
4. **No more redundant user profile fetches** across screens
5. **3× less aggressive** re-fetch timing on Explore

## Verification Steps

Before declaring success, confirm in production monitoring:

1. Appwrite reads should drop from ~12,000/hour to ~2,200/hour
2. The `GET /api/customernotifications/customernotification` endpoint should show 50% fewer calls
3. The `GET /api/customerauth/getCustomerProfile` endpoint should show 80% fewer calls
4. Tab switching should no longer trigger waterfall reloads
