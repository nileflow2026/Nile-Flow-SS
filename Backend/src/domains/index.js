/**
 * Nile Flow — Domain Ownership Registry
 *
 * Defines clear bounded contexts for data ownership.
 * Each domain owns its data — no service reads another domain's database tables directly.
 *
 * This file is the single source of truth for:
 *   - Which service owns which data domain
 *   - What cache key namespaces each domain controls
 *   - What queue channels each domain uses
 *   - What metrics prefix each domain reports under
 *
 * IMPORTANT: This is documentation + governance, not runtime logic.
 * Services are still co-located in a monolith today — this marks the
 * lines that would become service boundaries in a microservices split.
 */

"use strict";

// ── Domain Definitions ────────────────────────────────────────────────────────

const DOMAINS = {
  /**
   * AUTH domain
   * Owns: User accounts, sessions, JWT issuance, OAuth, password reset
   * Cannot: Access orders, payments, or product data directly
   */
  AUTH: {
    name: "auth",
    owner: "Backend/controllers/auth.controller.js",
    cacheNamespace: "auth:",
    queues: [],
    metricsPrefix: "nf_auth_",
    appwriteCollections: ["users", "sessions", "refreshTokens", "oauthStates"],
  },

  /**
   * CATALOG domain
   * Owns: Products, categories, vendor profiles, featured listings, search
   * Cannot: Access orders or customer financials directly
   */
  CATALOG: {
    name: "catalog",
    owner: "Backend/routes/Vendorroutes/productsRouter.js",
    cacheNamespace: "catalog:",
    queues: [],
    metricsPrefix: "nf_catalog_",
    appwriteCollections: [
      "products",
      "categories",
      "vendors",
      "featuredProducts",
    ],
  },

  /**
   * COMMERCE domain
   * Owns: Cart, orders, order lifecycle, cancellations
   * Cannot: Process payments directly (delegates to PAYMENTS domain)
   */
  COMMERCE: {
    name: "commerce",
    owner: "Backend/routes/adminRouter.js",
    cacheNamespace: "commerce:",
    queues: ["order-events"],
    metricsPrefix: "nf_commerce_",
    appwriteCollections: [
      "orders",
      "orderItems",
      "cart",
      "cancellationRequests",
    ],
  },

  /**
   * PAYMENTS domain
   * Owns: Payment attempts, Stripe sessions, M-Pesa callbacks, refunds
   * Cannot: Modify order status directly (emits events; COMMERCE reacts)
   */
  PAYMENTS: {
    name: "payments",
    owner: "Backend/controllers/paymentCallbackController.js",
    cacheNamespace: "payments:",
    queues: [],
    metricsPrefix: "nf_payment_",
    appwriteCollections: ["payments", "paymentCallbacks", "refunds"],
  },

  /**
   * LOYALTY domain
   * Owns: Nile Miles balance, award/redemption history, gamification tiers
   * Cannot: Access payment records directly
   */
  LOYALTY: {
    name: "loyalty",
    owner: "Backend/routes/reward.js",
    cacheNamespace: "loyalty:",
    queues: ["nile-miles"],
    metricsPrefix: "nf_loyalty_",
    appwriteCollections: ["nileMiles", "rewardHistory", "gamificationTiers"],
  },

  /**
   * SUBSCRIPTIONS domain
   * Owns: Premium status, subscription lifecycle, billing cycles
   * Cannot: Process payments (delegates to PAYMENTS)
   */
  SUBSCRIPTIONS: {
    name: "subscriptions",
    owner: "Backend/controllers/subscriptionController.js",
    cacheNamespace: "subscriptions:",
    queues: [],
    metricsPrefix: "nf_subscription_",
    appwriteCollections: ["subscriptions", "premiumDeals"],
  },

  /**
   * NOTIFICATIONS domain
   * Owns: In-app notifications, email dispatch, push tokens
   * Cannot: Modify orders or payments
   */
  NOTIFICATIONS: {
    name: "notifications",
    owner: "Backend/routes/notificationRoutes.js",
    cacheNamespace: "notifications:",
    queues: ["notifications", "email"],
    metricsPrefix: "nf_notifications_",
    appwriteCollections: ["notifications", "pushTokens"],
  },

  /**
   * DELIVERY domain
   * Owns: Rider assignments, delivery tracking, hub management
   * Cannot: Access vendor financials or customer payments
   */
  DELIVERY: {
    name: "delivery",
    owner: "Backend/routes/Riderroutes/riderRoutes.js",
    cacheNamespace: "delivery:",
    queues: [],
    metricsPrefix: "nf_delivery_",
    appwriteCollections: [
      "deliveries",
      "riders",
      "deliveryHubs",
      "riderTracking",
    ],
  },

  /**
   * CONTENT domain
   * Owns: African facts, chronicles, cultural content
   * Cannot: Access user financials or order data
   */
  CONTENT: {
    name: "content",
    owner: "Backend/routes/africanFactsRoutes.js",
    cacheNamespace: "content:",
    queues: [],
    metricsPrefix: "nf_content_",
    appwriteCollections: ["africanFacts", "chronicles", "proverbs"],
  },

  /**
   * SOCIAL domain
   * Owns: Group buys, social commerce features, referrals
   * Cannot: Access payments or payment records
   */
  SOCIAL: {
    name: "social",
    owner: "Backend/routes/groupOrderRoutes.js",
    cacheNamespace: "social:",
    queues: ["group-orders"],
    metricsPrefix: "nf_social_",
    appwriteCollections: ["groupOrders", "groupMembers", "referrals"],
  },

  /**
   * AI domain
   * Owns: Chat sessions, AI request logs, token budgets
   * Cannot: Modify any commerce or payment records
   */
  AI: {
    name: "ai",
    owner: "Backend/controllers/aiChatController.js",
    cacheNamespace: "ai:",
    queues: ["ai-processing"],
    metricsPrefix: "nf_ai_",
    appwriteCollections: ["aiChatSessions", "aiRequestLogs"],
  },
};

// ── Domain Rules ──────────────────────────────────────────────────────────────

/**
 * Cross-domain communication rules:
 *
 * ✅ ALLOWED:
 *   - Domain reads its own Appwrite collections
 *   - Domain writes to its own cache namespace
 *   - Domain enqueues jobs to its own queues
 *   - Domain emits an event to the order-events queue (for cross-domain reactions)
 *
 * ❌ FORBIDDEN:
 *   - AUTH directly querying orders collection
 *   - PAYMENTS writing to product stock fields
 *   - LOYALTY reading payment records directly
 *   - Any domain bypassing cache to hit Appwrite for cross-domain data
 *
 * Cross-domain data needs:
 *   - Use the order-events queue for async reactions
 *   - Use the /api/v1 home-feed controller as the only allowed aggregator
 *   - Request the data via HTTP from the owning domain's route
 */

module.exports = { DOMAINS };
