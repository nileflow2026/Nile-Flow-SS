# Startup Flow Audit — Mobile Read Investigation

## App Launch Sequence (Before Fixes)

```
0.0s  app/_layout.jsx mounts
      ├── Sentry.init()                       (no reads)
      ├── PostHogProvider wraps                (no reads)
      ├── QueryClientProvider wraps            (no reads)
      ├── ThemeProvider wraps                  (no reads)
      ├── GlobalProvider wraps                 (no reads)
      │   └── useEffect: checkGuestStatus()    (no reads)
      │   └── useEffect: getCurrentUser()      ⚡ 1 READ
      ├── PremiumProvider wraps                (no reads)
      │   └── useEffect: fetchPremiumStatus()  ⚡ 1 READ
      ├── NotificationProvider wraps           (no reads)
      │   └── useEffect: getCurrentUser()      ⚡ CACHED (1st was in GlobalProvider)
      │   └── useEffect: getCustomerNotification() ⚡ 1 READ
      ├── SocialProvider wraps                 (no reads)
      │   └── useEffect: loadSocialData()      (axiosUser.get - maybe 1-2 reads)
      ├── CartProvider wraps                   (no reads)
      │   └── useEffect: loadCartFromStorage() (no reads - deleted)
      │   └── useEffect: loadUserId() → fetchUserId() → getCurrentUser() ⚡ CACHED
      ├── FavoritesProvider wraps              (no reads)
      └── AppContent mounts
          └── useEffect: getCurrentUser()      ⚡ CACHED
          └── useEffect: initCurrency()        (no reads - ipapi.co, not Appwrite)
          └── useEffect: initializeLanguage()  (no reads)

0.2s  ───────────────────────────────────────────────────────────
      Home.jsx mounts (first tab)
      ├── useEffect: getCurrentUser()          ⚡ CACHED
      ├── useEffect: fetchCats()               ⚡ 1 READ (/categories)
      ├── useEffect: updateCurrencyRates()     ⚡ 1 READ (REMOVED)
      └── useEffect: setInterval(updateCurrencyRates, 4h) ⚡ recurring (REMOVED)
      HeroCarousel mounts                       (no reads)
      FeaturedProducts mounts                   (no reads)
      PremiumDeals mounts                       (no reads)

1.0s  ───────────────────────────────────────────────────────────
      Tab switch to Explore
      └── useEffect: getCurrentUser()          ⚡ CACHED
      ├── useEffect: fetchCats()               ⚡ 1 READ (REMOVED duplicates)
      ├── useEffect: updateCurrencyRates()     ⚡ 1 READ (REMOVED)
      └── useEffect: fetchAllData()            ⚡ 1-3 READS (products + categories)
      └── useFocusEffect: fetchAllData()       ⚡ 1 READ (on every focus)

1.5s  ───────────────────────────────────────────────────────────
      Tab switch to Cart
      └── useFocusEffect: fetchCartItems()     ⚡ 1 READ (cart/fetch/{id})
      └── (refetches every time tab focused)

2.0s  ───────────────────────────────────────────────────────────
      Tab switch to Notifications
      └── useFocusEffect: markAllAsRead()      ⚡ 1 WRITE
      └── useFocusEffect: getCustomerNotification() ⚡ 1 READ
      └── useEffect: getCustomerNotification() ⚡ 1 READ (duplicate with focus!)

2.5s  ───────────────────────────────────────────────────────────
      Tab switch to Profile
      └── useEffect: fetchNileMiles()          ⚡ 1 READ
      └── useEffect: getCustomerOrders()       ⚡ 1 READ
      └── useEffect: getCurrentUser()          ⚡ CACHED
```

## Total Reads on Fresh App Launch (Before Fixes)

| Time      | Event                   | Reads            |
| --------- | ----------------------- | ---------------- |
| 0.0s      | Provider init chain     | 3-6              |
| 0.2s      | Home mounts             | 2-3              |
| 1.0s      | Explore tab             | 2-4              |
| 1.5s      | Cart tab                | 1                |
| 2.0s      | Notifications tab       | 2                |
| 2.5s      | Profile tab             | 2                |
| **Total** | **1 full launch cycle** | **~12-18 reads** |

With 20,000 app launches/day: **240,000-360,000 reads just from startup fetches**.

## Total Reads on Fresh App Launch (After Fixes)

| Time      | Event                        | Reads                       |
| --------- | ---------------------------- | --------------------------- |
| 0.0s      | Provider init chain (cached) | 2 (premium + notifications) |
| 0.2s      | Home mounts (cached user)    | 1                           |
| 1.0s      | Explore tab                  | 1                           |
| 1.5s      | Cart tab                     | 1                           |
| 2.0s      | Notifications tab            | 1                           |
| 2.5s      | Profile tab                  | 1                           |
| **Total** | **1 full launch cycle**      | **~7 reads**                |

**Savings: ~50-65% reduction in startup reads.**

## Worst Offenders on Startup

1. `getCurrentUser()` — 6 calls reduced to 1 real call + 5 cache hits
2. `updateCurrencyRates()` — 2 triggers removed (currency updates are handled by CurrencyProvider)
3. `fetchCats()` — called from both Home and Explore on mount, same endpoint, no dedup
4. `getCustomerNotification()` — called on mount AND on every focus (duplicate)
