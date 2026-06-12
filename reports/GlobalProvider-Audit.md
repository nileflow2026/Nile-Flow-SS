# GlobalProvider Audit — Mobile Read Investigation

## File: `Mobileapp/Context/GlobalProvider.js`

### Functions Audited

| Function                    | Trigger                                                                      | Dependencies             | Calls API?    | Endpoint                                          | How Often                                     | Can Loop?                      | Risk            |
| --------------------------- | ---------------------------------------------------------------------------- | ------------------------ | ------------- | ------------------------------------------------- | --------------------------------------------- | ------------------------------ | --------------- |
| `getCurrentUser()`          | Mount, \_layout, Home, Explore, Profile, Settings, Addresses, ProductDetails | none                     | YES           | `/api/customerauth/getCustomerProfile`            | **6+ times per launch**                       | NO (async, not state-reactive) | 🔴 **CRITICAL** |
| `fetchUserId()`             | CartContext, ProductDetails, saveRecentSearch                                | calls `getCurrentUser()` | YES (cascade) | Same as getCurrentUser                            | Every call to fetchUserId                     | NO                             | 🟠 HIGH         |
| `fetchUserName()`           | CartContext, ProductDetails                                                  | calls `getCurrentUser()` | YES (cascade) | Same                                              | Every call to fetchUserName                   | NO                             | 🟠 HIGH         |
| `getCustomerNotification()` | NotificationContext, MyNotificationsScreen                                   | none                     | YES           | `/api/customernotifications/customernotification` | On mount + every focus                        | NO                             | 🟠 HIGH         |
| `updateCurrencyRates()`     | Home.jsx, Explore.jsx                                                        | none                     | YES           | `/api/update-currencies/update-currencies`        | **2 simultaneous intervals** (Home + Explore) | NO                             | 🟡 MEDIUM       |
| `handleLogout()`            | User action                                                                  | none                     | YES           | `/api/customerauth/logout/customer`               | On demand                                     | NO                             | 🟢 LOW          |
| `startGuestSessionFlow()`   | User action                                                                  | none                     | YES           | `/api/customerauth/guest-session`                 | On demand                                     | NO                             | 🟢 LOW          |
| `submitReview()`            | ProductDetails                                                               | none                     | YES           | `/api/customerprofile/submit-review`              | On demand                                     | NO                             | 🟢 LOW          |
| `getCustomerOrders()`       | Profile                                                                      | none                     | YES           | `/api/customerprofile/customer-orders`            | On Profile mount + refresh                    | NO                             | 🟡 MEDIUM       |

### useEffect Analysis in GlobalProvider

**Effect 1**: `checkGuestStatus()` — runs once on mount. Reads AsyncStorage only. **Safe.**

**Effect 2**: `fetchUser()` — runs once on mount. Calls `getCurrentUser()`. **Was causing 1 read + CACHING now added.**

### Root Cause

`getCurrentUser()` had **zero caching** — every call hit the backend. It was called from:

1. GlobalProvider mount (1x)
2. `_layout.jsx` AppContent mount (1x — now reads cache)
3. `Home.jsx` mount (1x — now reads cache)
4. `Explore.jsx` mount (1x — now reads cache)
5. `Profile.jsx` via `fetchNileMiles()` (1x — now reads cache)
6. `Settings.jsx` via `fetchNileMiles()` (1x — now reads cache)
7. CartContext via `fetchUserId()`/`loadCartFromStorage()` (1x — now reads cache)
8. ProductDetails via `handleAddReview()` (1x — now reads cache)

**Fix Applied**: In-memory cache with 60s TTL + in-flight deduplication.

### What About Loops?

**No infinite loops detected** in GlobalProvider. The provider's effects run once (empty deps `[]`). However, state updates in GlobalProvider (`setUser`, `setIsLogged`, `setLoading`, `setIsGuest`) cause **all consumers of `useGlobalContext()` to re-render**.

### Context Cascade Risk

**HIGH**. Every time `setUser` is called, every component using `useGlobalContext()` re-renders. This includes:

- BottomTabs (re-renders tab bar + ALL 5 tab screens)
- Every screen that uses `user`, `isLogged`, `isGuest`

**Mitigation**: `useMemo` on the context value prevents unnecessary re-renders when values don't change.
