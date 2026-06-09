/**
 * Nile Flow — Apply Cache Middleware to High-Traffic Routes
 *
 * Registers cacheMiddleware on high-traffic GET routes to reduce
 * database load and improve response times.
 *
 * Usage in Backend/src/index.js:
 *   require('./middleware/applyCacheToRoutes')(app);
 *
 * Phase 9 Expansion:
 *   - Added cache for: orders, nilemiles, vendor dashboard, rider routes
 *   - Added cache for: notifications, analytics, recommendations, search
 */

"use strict";

const { cacheMiddleware } = require("../src/lib/cache/cacheClient");
const { CacheKeys, TTL } = require("../src/lib/cache/cacheKeys");

/**
 * Apply cache middleware to high-traffic GET routes.
 * Must be called after all route mounting in index.js.
 *
 * @param {import('express').Express} app - Express application instance
 */
function applyCacheToRoutes(app) {
  if (!app || typeof app.use !== "function") {
    console.warn(
      "[applyCacheToRoutes] Invalid Express app provided — skipping cache setup",
    );
    return;
  }

  // ── Products ──────────────────────────────────────────────────────────────
  app.get(
    "/api/products/featured",
    cacheMiddleware(CacheKeys.featuredProducts(), TTL.MEDIUM, [
      "featured-products",
    ]),
  );

  // ── Categories ─────────────────────────────────────────────────────────────
  app.get(
    "/api/categories/:path(.*)",
    cacheMiddleware(CacheKeys.categories(), TTL.LONG, ["categories"]),
  );

  // ── African Facts ─────────────────────────────────────────────────────────
  app.get(
    "/api/africa/facts*",
    cacheMiddleware(CacheKeys.africanFacts(), TTL.CONTENT, ["african-facts"]),
  );

  // ── Settings ───────────────────────────────────────────────────────────────
  app.get(
    "/api/settings*",
    cacheMiddleware(CacheKeys.platformSettings(), TTL.STATIC, ["settings"]),
  );

  // ── Subscription — Premium Deals ──────────────────────────────────────────
  app.get(
    "/api/subscription/premium-deals*",
    cacheMiddleware(CacheKeys.premiumDeals(), TTL.MEDIUM, ["premium-deals"]),
  );

  // ── Admin Dashboard ────────────────────────────────────────────────────────
  app.get(
    "/api/admin/dashboard*",
    cacheMiddleware(CacheKeys.adminDashboardSummary(), TTL.ANALYTICS, [
      "admin-dashboard",
    ]),
  );

  // ═════════════════════════════════════════════════════════════════════════
  // PHASE 9 — Expanded Cache Coverage
  // ═════════════════════════════════════════════════════════════════════════

  // ── Orders — Paginated Order Lists ────────────────────────────────────────
  app.get(
    "/api/orders*",
    cacheMiddleware(CacheKeys.adminOrdersPage(1, "all"), TTL.SHORT, ["orders"]),
  );

  // ── Nile Miles / Loyalty ──────────────────────────────────────────────────
  app.get(
    "/api/nilemiles*",
    cacheMiddleware(CacheKeys.nileMilesSummary("all"), TTL.MEDIUM, [
      "nilemiles",
    ]),
  );

  // ── Vendor Dashboard ─────────────────────────────────────────────────────
  app.get(
    "/api/vendor/dashboard*",
    cacheMiddleware(CacheKeys.vendorDashboardSummary("all"), TTL.MEDIUM, [
      "vendor-dashboard",
    ]),
  );

  // ── Vendor Analytics ──────────────────────────────────────────────────────
  app.get(
    "/api/vendor/analytics*",
    cacheMiddleware(CacheKeys.vendorDashboardSummary("analytics"), TTL.MEDIUM, [
      "vendor-analytics",
    ]),
  );

  // ── Rider Routes ──────────────────────────────────────────────────────────
  app.get(
    "/api/rider/tracking*",
    cacheMiddleware(CacheKeys.nileMilesSummary("rider-tracking"), TTL.LIVE, [
      "rider-tracking",
    ]),
  );

  // ── Notifications ─────────────────────────────────────────────────────────
  app.get(
    "/api/notifications*",
    cacheMiddleware(CacheKeys.nileMilesSummary("notifications"), TTL.SHORT, [
      "notifications",
    ]),
  );

  // ── Recommendations ──────────────────────────────────────────────────────
  app.get(
    "/api/recommendations*",
    cacheMiddleware(CacheKeys.guestRecommendations(), TTL.RECOMMENDATIONS, [
      "recommendations",
    ]),
  );

  // ── Search Results ────────────────────────────────────────────────────────
  app.get(
    "/api/products/search*",
    cacheMiddleware(CacheKeys.searchResults("guest", 1), TTL.LIVE, ["search"]),
  );

  // ── Currency / Exchange Rates ─────────────────────────────────────────────
  app.get(
    "/api/currency*",
    cacheMiddleware(CacheKeys.exchangeRates(), TTL.EXCHANGE_RATES, [
      "exchange-rates",
    ]),
  );

  console.log(
    "[applyCacheToRoutes] ✅ Cache middleware applied to 15 route groups (6 baseline + 9 Phase 9)",
  );
}

module.exports = applyCacheToRoutes;
