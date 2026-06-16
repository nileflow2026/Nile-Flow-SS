# READ HEATMAP — TOP 25 MOST EXPENSIVE FILES

## Ranked by Estimated Read Impact

| Rank | File                                                | Endpoint(s)                                                                                                                                                                          | Trigger Frequency                      | Estimated Reads/Day | Risk Level  |
| ---- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- | ------------------- | ----------- |
| 1    | `Mobileapp/app/(Screens)/MyNotificationsScreen.jsx` | `GET /api/customernotifications/customernotification`                                                                                                                                | Every tab focus + mount (double fetch) | 40,000-60,000       | 🔴 CRITICAL |
| 2    | `Mobileapp/app/(Screens)/Explore.jsx`               | `GET /api/customerprofile/fetch-product-mobile`, `GET /api/customerprofile/categories`                                                                                               | Mount + every 5min focus               | 25,000-40,000       | 🔴 CRITICAL |
| 3    | `Mobileapp/app/(tabs)/BottomTabs.jsx`               | All child screens (via conditional remount)                                                                                                                                          | Every tab switch                       | 20,000-35,000       | 🔴 CRITICAL |
| 4    | `Mobileapp/app/(Screens)/Home.jsx`                  | `GET /api/customerprofile/categories`, `GET /api/customerprofile/fetch-product-mobile` (via FeaturedProducts)                                                                        | Mount + retry                          | 15,000-25,000       | 🔴 HIGH     |
| 5    | `Mobileapp/Context/NotificationContext.js`          | `GET /api/customerauth/getCustomerProfile`, `GET /api/customernotifications/customernotification`                                                                                    | Provider mount                         | 10,000-15,000       | 🔴 HIGH     |
| 6    | `Mobileapp/Context/PremiumContext.js`               | `GET /api/subscription/status`                                                                                                                                                       | Provider mount (every launch)          | 8,000-12,000        | 🟡 MEDIUM   |
| 7    | `Mobileapp/Context/SocialContext.js`                | `GET /api/nilemiles/nilemiles/status`                                                                                                                                                | Provider mount (every launch)          | 8,000-12,000        | 🟡 MEDIUM   |
| 8    | `Mobileapp/app/_layout.jsx`                         | `getCurrentUser()` → `GET /api/customerauth/getCustomerProfile`                                                                                                                      | Layout mount (redundant)               | 5,000-8,000         | 🟡 MEDIUM   |
| 9    | `Mobileapp/app/(Screens)/ProductDetails.jsx`        | `GET /api/customerprofile/fetch-reviews/:id`, `GET /api/customerprofile/fetch-product-mobile`, `GET /api/customerprofile/product/:id/images`, `GET /api/customerprofile/product/:id` | Mount                                  | 5,000-8,000         | 🟡 MEDIUM   |
| 10   | `Mobileapp/app/(Screens)/Profile.jsx`               | `GET /api/nilemiles/nilemiles/status`, `GET /api/customerprofile/customer-orders`                                                                                                    | Mount + refresh                        | 4,000-6,000         | 🟡 MEDIUM   |
| 11   | `Mobileapp/api.js`                                  | `https://ipapi.co/json/`                                                                                                                                                             | App launch (initCurrency)              | 2,000-4,000         | 🟢 LOW      |
| 12   | `Mobileapp/Context/CurrencyProvider.js`             | `GET /api/currency/detect`, `GET /api/currency/rates`                                                                                                                                | Provider mount                         | 2,000-4,000         | 🟢 LOW      |
| 13   | `Mobileapp/app/(Screens)/Orders.jsx`                | `GET /api/customerprofile/customer-orders`, `GET /api/customerauth/getCustomerProfile`                                                                                               | Mount + refresh                        | 2,000-3,000         | 🟢 LOW      |
| 14   | `Mobileapp/app/(Screens)/Cart.jsx`                  | `GET /api/cart/fetch/${id}`                                                                                                                                                          | Focus (empty cart)                     | 1,000-2,000         | 🟢 LOW      |
| 15   | `Mobileapp/Context/CartContext_NEW.js`              | `getCurrentUser()` → `GET /api/customerauth/getCustomerProfile`                                                                                                                      | Mount                                  | 1,000-2,000         | 🟢 LOW      |
| 16   | `Mobileapp/app/(auth)/sign-in.jsx`                  | `GET /api/customerauth/getCustomerProfile` (after OAuth), `GET /api/customerauth/oauth/google\|facebook`                                                                             | User action                            | 500-1,000           | 🟢 LOW      |
| 17   | `Mobileapp/app/(Screens)/CategoryDetailsScreen.jsx` | (presumed fetch-product-mobile or /category/:id)                                                                                                                                     | Mount                                  | 500-1,000           | 🟢 LOW      |
| 18   | `Mobileapp/app/components/FeaturedProducts.jsx`     | `GET /api/customerprofile/fetch-product-mobile`                                                                                                                                      | Mount                                  | 500-1,000           | 🟢 LOW      |
| 19   | `Mobileapp/app/components/PremiumDeals.jsx`         | (presumed product fetch)                                                                                                                                                             | Mount                                  | 500-1,000           | 🟢 LOW      |
| 20   | `Mobileapp/app/components/HeroCarousel.jsx`         | (presumed API or image fetch)                                                                                                                                                        | Mount                                  | 300-500             | 🟢 LOW      |
| 21   | `Mobileapp/hooks/usePremiumStatus.js`               | (presumed subscription status)                                                                                                                                                       | Mount                                  | 300-500             | 🟢 LOW      |
| 22   | `Mobileapp/app/(Screens)/TrackOrder.jsx`            | `GET /api/orders/track/:id`                                                                                                                                                          | Mount                                  | 200-400             | 🟢 LOW      |
| 23   | `Mobileapp/app/(Screens)/EditProfile.jsx`           | `GET /api/customerauth/getCustomerProfile`                                                                                                                                           | Mount                                  | 200-400             | 🟢 LOW      |
| 24   | `Mobileapp/app/(Screens)/Addresses.jsx`             | `GET /api/customerprofile/addresses`                                                                                                                                                 | Mount                                  | 200-400             | 🟢 LOW      |
| 25   | `Mobileapp/app/(Screens)/PaymentMethods.jsx`        | `GET /api/customerprofile/payment-methods`                                                                                                                                           | Mount                                  | 100-300             | 🟢 LOW      |

## Summary

| Severity    | Count  | Estimated Reads/Day |
| ----------- | ------ | ------------------- |
| 🔴 CRITICAL | 3      | 85,000-135,000      |
| 🔴 HIGH     | 2      | 25,000-40,000       |
| 🟡 MEDIUM   | 5      | 22,000-36,000       |
| 🟢 LOW      | 15     | 8,000-15,000        |
| **TOTAL**   | **25** | **140,000-226,000** |

## Top 5 Files to Fix First

1. **MyNotificationsScreen.jsx** — Remove duplicate focusEffect, use TanStack Query staleTime
2. **BottomTabs.jsx** — Fix conditional remount pattern
3. **Explore.jsx** — Cache categories, debounce focusEffect more aggressively
4. **NotificationContext.js** — Remove redundant getCurrentUser() call
5. **Home.jsx** — Share categories data with TanStack Query
