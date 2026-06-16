# READ EXPLOSION ROOT CAUSE

---

## Root Cause #1: BottomTabs Conditional Remount (CRITICAL)

| Field                     | Value                                                                                                                                                                                                 |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Root Cause**            | `{isFocused && <ActiveComponent />}` in BottomTabs.jsx destroys and recreates the entire screen component tree on every tab switch                                                                    |
| **Evidence**              | BottomTabs.jsx line 100: `{isFocused && <ActiveComponent />}` — React conditional rendering. Every tab switch: old component unmounts → all cleanup runs → new component mounts → all useEffects fire |
| **Affected Files**        | BottomTabs.jsx (root cause), plus every screen: Home.jsx, Explore.jsx, Cart.jsx, MyNotificationsScreen.jsx, Profile.jsx                                                                               |
| **Estimated Read Impact** | 20,000-35,000 reads/day                                                                                                                                                                               |
| **Confidence Level**      | 🔴 HIGH — confirmed by code structure                                                                                                                                                                 |
| **Recommended Fix**       | Replace conditional render with visibility-based approach using `display: 'none'` or keep all tabs mounted and toggle visibility                                                                      |

---

## Root Cause #2: MyNotificationsScreen Double Fetch (CRITICAL)

| Field                     | Value                                                                                                                                                            |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Root Cause**            | MyNotificationsScreen.jsx has BOTH a mount `useEffect` AND a `useFocusEffect` that both call `getCustomerNotification()` — compounded by the remount issue above |
| **Evidence**              | Line 70-80 (useFocusEffect) + Lines 87-107 (useEffect). Both fetch from `GET /api/customernotifications/customernotification`                                    |
| **Affected Files**        | MyNotificationsScreen.jsx                                                                                                                                        |
| **Estimated Read Impact** | 40,000-60,000 reads/day                                                                                                                                          |
| **Confidence Level**      | 🔴 HIGH — confirmed by code                                                                                                                                      |
| **Recommended Fix**       | Remove the mount useEffect. Keep only the useFocusEffect. Add staleTime via TanStack Query                                                                       |

---

## Root Cause #3: NotificationContext Fires at Startup (HIGH)

| Field                     | Value                                                                                                                                            |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Root Cause**            | NotificationContext.js mounts early in the provider tree and fires `getCurrentUser()` + `getCustomerNotification()` before any screen is visible |
| **Evidence**              | NotificationContext.js lines 74-99: two API calls on mount. These are unnecessary at provider level since MyNotificationsScreen also fetches     |
| **Affected Files**        | NotificationContext.js                                                                                                                           |
| **Estimated Read Impact** | 10,000-15,000 reads/day                                                                                                                          |
| **Confidence Level**      | 🟡 MEDIUM                                                                                                                                        |
| **Recommended Fix**       | Remove the notification fetch from provider. Move to MyNotificationsScreen only.                                                                 |

---

## Root Cause #4: PremiumProvider Fires on Every Launch (MEDIUM)

| Field                     | Value                                                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------- |
| **Root Cause**            | PremiumContext.js fires `premiumService.getStatus()` on mount for EVERY user regardless of whether they care about premium |
| **Evidence**              | PremiumContext.js line 42-57: fetchPremiumStatus() called in useEffect([])                                                 |
| **Affected Files**        | PremiumContext.js                                                                                                          |
| **Estimated Read Impact** | 8,000-12,000 reads/day                                                                                                     |
| **Confidence Level**      | 🟡 MEDIUM                                                                                                                  |
| **Recommended Fix**       | Lazy-load premium status — only fetch when user opens premium-related screen or profile                                    |

---

## Root Cause #5: SocialContext Fires on Every Launch (MEDIUM)

| Field                     | Value                                                                            |
| ------------------------- | -------------------------------------------------------------------------------- |
| **Root Cause**            | SocialContext.js fires `/api/nilemiles/nilemiles/status` on mount for EVERY user |
| **Evidence**              | SocialContext.js line 69-84: axiosClient.get on mount                            |
| **Affected Files**        | SocialContext.js                                                                 |
| **Estimated Read Impact** | 8,000-12,000 reads/day                                                           |
| **Confidence Level**      | 🟡 MEDIUM                                                                        |
| **Recommended Fix**       | Lazy-load Nile Miles data — only fetch when user opens Feed or Profile           |

---

## Root Cause #6: Explore FocusEffect Refetch (MEDIUM)

| Field                     | Value                                                                                                  |
| ------------------------- | ------------------------------------------------------------------------------------------------------ |
| **Root Cause**            | Explore.jsx useFocusEffect re-fetches all products every 5 minutes even if user hasn't left the screen |
| **Evidence**              | Explore.jsx line 177-187: 5-min staleTime check triggers re-fetch                                      |
| **Affected Files**        | Explore.jsx                                                                                            |
| **Estimated Read Impact** | 25,000-40,000 reads/day                                                                                |
| **Confidence Level**      | 🟡 MEDIUM                                                                                              |
| **Recommended Fix**       | Increase stale window to 15 minutes. Use TanStack Query for automatic refetch management               |

---

## Summary of Estimated Read Reduction

| Fix                             | Before      | After      | Reduction   |
| ------------------------------- | ----------- | ---------- | ----------- |
| BottomTabs remount fix          | 35,000      | 5,000      | 30,000      |
| Notifications double fetch fix  | 60,000      | 10,000     | 50,000      |
| NotificationContext startup fix | 15,000      | 0          | 15,000      |
| PremiumProvider lazy loading    | 12,000      | 1,000      | 11,000      |
| SocialContext lazy loading      | 12,000      | 1,000      | 11,000      |
| Explore focusEffect staleTime   | 40,000      | 15,000     | 25,000      |
| **TOTAL**                       | **174,000** | **32,000** | **142,000** |

**Projected reduction**: ~82% reduction in mobile reads after implementing all fixes.
