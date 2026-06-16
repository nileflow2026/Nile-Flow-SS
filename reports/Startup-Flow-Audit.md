# STARTUP FLOW AUDIT

## Complete Launch Sequence Trace

### Timeline: Fresh App Launch

```
0ms    → App opens (SplashScreen)
          ├─ Sentry.init()
          ├─ OTA update check (checkForUpdateAsync)
          └─ PostHogProvider mounts

100ms  → GestureHandlerRootView → ErrorBoundary → QueryClientProvider
          ├─ ThemeProvider (reads AsyncStorage)
          ├─ StripeProvider
          └─ GlobalProvider mounts
              └─ useEffect: checkGuestStatus (AsyncStorage only)

200ms  → PremiumProvider mounts
          └─ useEffect: fetchPremiumStatus()
              └─ API CALL: GET /api/subscription/status ✅

300ms  → NotificationProvider mounts
          └─ useEffect: init()
              ├─ API CALL: getCurrentUser() → GET /api/customerauth/getCustomerProfile ✅
              └─ API CALL: getCustomerNotification() → GET /api/customernotifications/customernotification ✅

400ms  → SocialProvider mounts
          └─ useEffect: loadSocialData()
              └─ API CALL: GET /api/nilemiles/nilemiles/status ✅

500ms  → CartProvider mounts
          └─ useEffect: loadCartFromStorage() (AsyncStorage only — no API)
          └─ useEffect: loadWishlistFromStorage() (AsyncStorage only)
          └─ useEffect: loadUserId()
              └─ API CALL: fetchUserId() → getCurrentUser() → cache hit (60s TTL) ✅

600ms  → GroupBuyProvider mounts (no startup API calls)
        → FavoritesProvider mounts (AsyncStorage only)

700ms  → AppContent mounts
          ├─ useFonts() starts loading 9 Poppins fonts
          └─ useEffect: fetchUser() → getCurrentUser() → cache hit ✅

800ms  → initCurrency() fires → API CALL: ipapi.co/json/ ✅

900ms  → initializeLanguage() fires (AsyncStorage only)

1000ms → Fonts loaded → SplashScreen.hideAsync()

1100ms → Stack.Navigator renders
          └─ Index screen (onboarding) mounts

1500ms → User taps "Explore African Excellence"
          └─ BottomTabs mounts
              └─ Tab 0 (Home) mounts
                  └─ useEffect: fetchUser() → getCurrentUser() → cache hit ✅
                  └─ useEffect: fetchCats() → API CALL: GET /api/customerprofile/categories ✅
                  └─ FeaturedProducts mounts
                      └─ API CALL: GET /api/customerprofile/fetch-product-mobile ✅
                  └─ PremiumDeals mounts
                      └─ (likely API call to fetch premium products)

2000ms → User navigates to Tab 1 (Explore)
          └─ useEffect: fetchUser() → getCurrentUser() → cache hit ✅
          └─ useEffect: fetchCats() → API CALL: GET /api/customerprofile/categories ✅
          └─ useEffect: fetchAllData() → API CALL: GET /api/customerprofile/fetch-product-mobile ✅
```

### Total API Calls at Launch: 10-14

| #   | Time    | Endpoint                                                  | Trigger                         |
| --- | ------- | --------------------------------------------------------- | ------------------------------- |
| 1   | ~200ms  | `GET /api/subscription/status`                            | PremiumProvider mount           |
| 2   | ~300ms  | `GET /api/customerauth/getCustomerProfile`                | NotificationProvider mount      |
| 3   | ~300ms  | `GET /api/customernotifications/customernotification`     | NotificationProvider mount      |
| 4   | ~400ms  | `GET /api/nilemiles/nilemiles/status`                     | SocialProvider mount            |
| 5   | ~800ms  | `https://ipapi.co/json/`                                  | initCurrency()                  |
| 6   | ~1500ms | `GET /api/customerprofile/categories`                     | Home mount                      |
| 7   | ~1500ms | `GET /api/customerprofile/fetch-product-mobile`           | FeaturedProducts mount          |
| 8   | ~1500ms | `GET /api/customerprofile/fetch-product-mobile` (premium) | PremiumDeals mount              |
| 9   | ~2000ms | `GET /api/customerprofile/categories`                     | Explore mount (duplicate of #6) |
| 10  | ~2000ms | `GET /api/customerprofile/fetch-product-mobile`           | Explore mount                   |

### Redundant Calls at Launch

1. **`getCurrentUser()`** called 5-6 times (all cache hits within 60s, but still fires 1 network request)
2. **`/api/customerprofile/categories`** called TWICE — once by Home, once by Explore
3. **`/api/customerprofile/fetch-product-mobile`** called at least 3 times (FeaturedProducts, PremiumDeals, Explore)

### Appwrite Reads from One Launch

If each endpoint generates 1 Appwrite read:

- **Conservative**: 10 reads
- **With pagination**: 10-14 reads
- **With PremiumDeals fetch**: 12-16 reads

For 10,000 daily users: **120,000-160,000 reads** just from startup.

### Key Findings

1. **Categories API duplicated**: Home and Explore both fetch categories independently
2. **Product fetch triplicated**: FeaturedProducts, PremiumDeals, and Explore all fetch products
3. **getCurrentUser() called 5+ times**: Cache dedup prevents network duplicates within 60s, but the SINGLE hit is still wasteful at startup
4. **PremiumProvider fires at launch**: Every app launch triggers a subscription status check
5. **SocialProvider fires at launch**: Every app launch triggers a NileMiles status check
6. **NotificationProvider fires 2 API calls at launch**: getCurrentUser() + getCustomerNotification()
