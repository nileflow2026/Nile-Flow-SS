# WORKSTREAM 2 — Repository Enforcement Report

## Objective

No controller may access Appwrite directly. All data access must go through domain-owned repositories.

---

## Repositories Created

| Repository         | Domain  | Methods                                                                                 | Collection   |
| ------------------ | ------- | --------------------------------------------------------------------------------------- | ------------ |
| ProductRepository  | CATALOG | getFeatured(), getByCategory(), getDetail(), search(), getPremiumDeals(), getTrending() | products     |
| UserRepository     | AUTH    | getProfile(), updateProfile(), getPreferences(), updatePreferences()                    | users        |
| CategoryRepository | CATALOG | getAll(), getBySlug()                                                                   | categories   |
| ContentRepository  | CONTENT | getFeaturedFacts(), getFactsByCategory(), getProverbs()                                 | africanFacts |
| SettingsRepository | AUTH    | getPlatformSettings()                                                                   | settings     |

## Pre-existing Repositories (not modified)

| Repository              | Domain        | Notes                        |
| ----------------------- | ------------- | ---------------------------- |
| NotificationRepository  | NOTIFICATIONS | Existed, uses BaseRepository |
| OrdersRepository        | COMMERCE      | Existed                      |
| PaymentsRepository      | PAYMENTS      | Existed                      |
| LoyaltyRepository       | LOYALTY       | Existed                      |
| VendorRepository        | CATALOG       | Existed                      |
| SubscriptionsRepository | SUBSCRIPTIONS | Existed                      |

## Repository Index Updated

Backend/src/data/repositories/index.js updated to export all 11 repositories.

---

## Controllers Still Using Raw `db.*` Calls (Not Migrated)

These controllers still call `db.listDocuments()` / `db.getDocument()` directly via the raw `db` export from `services/appwriteService.js`. They must be migrated to use repositories.

### AdminControllers (97+ raw calls identified)

- admin.js — products, orders, categories, deliveries, customers, riders
- PaymentController.js — cart, orders, subscriptions, users
- ProductapprovalController.js — products, vendors
- authController.js — users, sessions
- commissionController.js — orders, audit logs
- rewardController.js — users, miles, referrals
- notificationController.js — notifications
- newsletterController.js — subscribers, campaigns, products
- promoController.js — promotions
- staffcontroller.js — staff
- userController.js — users
- usercheckController.js — users
- stockController.js — products
- gamificationController.js — checkins, spins, referrals, rewards
- stripeWebhookController.js — orders
- groupOrderController.js — orders
- careersController.js — applications

### UserControllers (70+ raw calls identified)

- ClientController.js — products, reviews, orders, searches, carts
- ClientauthController.js — refreshTokens, user profiles
- Clientnotification.js — notifications
- Clientordercontroller.js — orders

### RiderControllers (38+ raw calls identified)

- RiderController.js — riders, deliveries, orders, customers
- riderAnalyticsController.js — 12 individual analytics queries
- riderAuthController.js — rider auth, OTP, profiles

### Services (77+ raw calls identified)

- paymentCallbackController.js — subscriptions, orders, users
- subscriptionController.js — subscriptions
- subscriptionCronService.js — subscriptions
- vendorPayoutService.js — orders, vendors
- socialCommerceService.js — posts, likes, comments, follows
- DeletionService.js — users, orders, profiles
- send-confirmation.js — users

---

## Raw `users.get()` Calls (42 identified)

These are NOT covered by repositories and hit the Appwrite Users API directly:

| Source File                        | Count |
| ---------------------------------- | ----- |
| ClientauthController.js            | 6     |
| auth.controller.js                 | 6     |
| paymentCallbackController.js       | 4     |
| subscriptionController.js          | 6     |
| DeletionService.js                 | 5     |
| premiumBenefitsService.js          | 5     |
| subscriptionCronService.js         | 4     |
| AdminControllers/authController.js | 3     |
| appwriteSessionService.js          | 2     |
| aiChatController.js                | 1     |
| middleware files                   | 3     |

---

## Migration Plan (Next Phase)

1. **Phase A:** Migrate ClientauthController.js → UserRepository + cache
2. **Phase B:** Migrate ClientController.js → ProductRepository + CategoryRepository
3. **Phase C:** Migrate auth.controller.js (admin) → UserRepository
4. **Phase D:** Migrate notification flows → NotificationRepository
5. **Phase E:** Migrate all services → appropriate repositories

Each migration replaces raw `db.listDocuments(env.APPWRITE_X_COLLECTION_ID, ...)` with `repository.list(...)` calls.

---

## Summary

| Metric                                             | Value                 |
| -------------------------------------------------- | --------------------- |
| Repositories created (this phase)                  | 5                     |
| Total repositories now available                   | 11                    |
| Controllers still using raw `db.*`                 | ~40                   |
| Raw `db.listDocuments/getDocument` calls remaining | ~370                  |
| Raw `users.get()` calls remaining                  | 42                    |
| Controllers migrated in this phase                 | 0 (foundations built) |
