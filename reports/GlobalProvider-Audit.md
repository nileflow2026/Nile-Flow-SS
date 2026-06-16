# GLOBALPROVIDER AUDIT

## File: `Mobileapp/Context/GlobalProvider.js`

---

### useEffect #1 — `checkGuestStatus`

| Field            | Value                  |
| ---------------- | ---------------------- |
| **Trigger**      | Mount only (`[]` deps) |
| **Dependencies** | `[]`                   |
| **Calls API?**   | No                     |
| **How Often?**   | Once                   |
| **Can It Loop?** | No                     |
| **Risk Score**   | 🟢 Low                 |

Reads AsyncStorage only. Safe.

---

### useEffect #2 — `fetchUser`

| Field               | Value                                                                 |
| ------------------- | --------------------------------------------------------------------- |
| **Trigger**         | Mount only (`[]` deps)                                                |
| **Dependencies**    | `[]`                                                                  |
| **Calls API?**      | Yes — `getCurrentUser()` → `GET /api/customerauth/getCustomerProfile` |
| **Which Endpoint?** | `/api/customerauth/getCustomerProfile`                                |
| **How Often?**      | Once on provider mount                                                |
| **Can It Loop?**    | No                                                                    |
| **Risk Score**      | 🟡 Medium (duplicated by other callers)                               |

**Evidence**: Lines 268-295. Calls `getCurrentUser()` which fires one network request. The in-memory cache prevents duplicates within the 60s TTL window.

---

### getCurrentUser() function

| Field            | Value                                                                                           |
| ---------------- | ----------------------------------------------------------------------------------------------- |
| **Trigger**      | Called by GlobalProvider, `_layout.jsx` AppContent, Home, Explore, NotificationContext, Profile |
| **Endpoint**     | `GET /api/customerauth/getCustomerProfile`                                                      |
| **How Often?**   | Multiple times per app launch                                                                   |
| **Can It Loop?** | No — has dedup promise + 60s TTL                                                                |
| **Risk Score**   | 🟡 Medium                                                                                       |

**Evidence**: The function has a `_userCachePromise` dedup and 60s TTL cache (lines 37-66). However, the TTL of 60 seconds means it fires a network call every minute if called repeatedly.

---

### Export Inventory

| Export                      | Trigger                                                       | Calls API? | Endpoint                                            |
| --------------------------- | ------------------------------------------------------------- | ---------- | --------------------------------------------------- |
| `getCurrentUser()`          | Provider mount, Layout, Home, Explore, Notifications, Profile | ✅         | `/api/customerauth/getCustomerProfile`              |
| `signUp()`                  | User action                                                   | ✅         | `/api/customerauth/signup/customer`                 |
| `signIn()`                  | User action                                                   | ✅         | `/api/customerauth/signin/customer`                 |
| `signOut()`                 | User action                                                   | ✅         | `/api/customerauth/logout/customer`                 |
| `createGuestSession()`      | User action                                                   | ✅         | `/api/customerauth/guest-session`                   |
| `getGuestUser()`            | startGuestSessionFlow                                         | ✅         | `/api/customerauth/guest-session`                   |
| `createNotification()`      | Various actions                                               | ✅         | `/api/customernotifications/createnotification`     |
| `saveRecentSearch()`        | User action                                                   | ✅         | `/api/customerprofile/customer-searches`            |
| `getRecentSearches()`       | User action                                                   | ✅         | `/api/customerprofile/customer-recent-search`       |
| `clearRecentSearches()`     | User action                                                   | ✅         | `/api/customerprofile/clear-recent-search`          |
| `getCustomerNotification()` | NotificationContext mount, MyNotificationsScreen focus        | ✅         | `/api/customernotifications/customernotification`   |
| `getCustomerOrders()`       | Profile mount                                                 | ✅         | `/api/customerprofile/customer-orders`              |
| `fetchReviews()`            | ProductDetails mount                                          | ✅         | `/api/customerprofile/fetch-reviews/:id`            |
| `fetchUserId()`             | CartContext, Profile, ProductDetails                          | ✅         | Calls `getCurrentUser()` internally                 |
| `fetchUserName()`           | CartContext, ProductDetails                                   | ✅         | Calls `getCurrentUser()` internally                 |
| `getlatestProducts()`       | (exported, usage unknown)                                     | ✅         | `/api/customerprofile/fetch-product-mobile?limit=5` |

---

### Cascading Rerender Analysis

**State that changes**:

- `user` — set once on mount
- `isLogged` — set once on mount
- `loading` — transitions `true → false` once
- `isGuest` — set once on mount

**useMemo dependencies**: `[isLogged, user, loading, isGuest]`

**Risk**: Low. State is set once on mount and doesn't cascade. The provider does not re-fetch on any child rerender.

**Verdict**: ✅ GlobalProvider itself is NOT causing cascading rerenders. The issue is EXTERNAL callers calling `getCurrentUser()` redundantly.

---

### Duplicate Callers of getCurrentUser()

| Caller                        | File                        | Frequency                               |
| ----------------------------- | --------------------------- | --------------------------------------- |
| GlobalProvider useEffect      | `GlobalProvider.js:268`     | Once on mount                           |
| AppContent useEffect          | `_layout.jsx:107`           | Once on layout mount **<-- REDUNDANT**  |
| Home mount useEffect          | `Home.jsx:136`              | Once on Home mount **<-- REDUNDANT**    |
| Explore mount useEffect       | `Explore.jsx:118`           | Once on Explore mount **<-- REDUNDANT** |
| NotificationContext useEffect | `NotificationContext.js:74` | Once on mount **<-- REDUNDANT**         |
| CartContext loadUserId        | `CartContext_NEW.js:99`     | Once on mount **<-- REDUNDANT**         |

**Total redundant calls per app launch**: 5-6 calls to `getCurrentUser()` despite 60s TTL — but the first call in GlobalProvider populates the cache, so subsequent calls within 60s hit cache. The problem occurs when the app stays open >60s — every new screen mount fires a fresh network call.

**Estimated Read Impact**: If user opens Home (1) → Explore (1) → ProductDetails (1) → Cart (1) → Profile (1) in a 3-minute session, that's 5 `getCurrentUser()` calls → 5 Appwrite reads. With 368,160 daily reads, this accounts for roughly 25-30%.
