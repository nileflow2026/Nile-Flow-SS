/**
 * Nile Flow — Cache Key Governance
 *
 * Centralised registry of all Redis cache keys used across the platform.
 * Every key must be defined here — no ad-hoc key strings in controllers.
 *
 * Key naming convention:
 *   nf:<domain>:<identifier>:<variant>
 *
 * TTL constants are in seconds.
 */

"use strict";

// ── TTL constants (seconds) ──────────────────────────────────────────────────

const TTL = {
  /** Static reference data — rarely changes */
  STATIC: 6 * 60 * 60, // 6 hours

  /** Semi-static: categories, settings, config */
  LONG: 30 * 60, // 30 minutes

  /** Frequently changing: featured products, deals */
  MEDIUM: 5 * 60, // 5 minutes

  /** High-churn: user-specific data, cart summaries */
  SHORT: 60, // 1 minute

  /** Very short: search results, live inventory */
  LIVE: 10, // 10 seconds

  /** Discover Africa & Proverbs — content doesn't change often */
  CONTENT: 2 * 60 * 60, // 2 hours

  /** Recommendation outputs — recomputed periodically */
  RECOMMENDATIONS: 15 * 60, // 15 minutes

  /** Subscription / premium status */
  PREMIUM: 5 * 60, // 5 minutes

  /** Exchange rates */
  EXCHANGE_RATES: 4 * 60 * 60, // 4 hours

  /** Analytics aggregates */
  ANALYTICS: 10 * 60, // 10 minutes
};

// ── Key builders ─────────────────────────────────────────────────────────────

const CacheKeys = {
  // ── Homepage feed ──────────────────────────────────────────────────────────
  homeFeed: () => "nf:home:feed",
  homeFeedGuest: () => "nf:home:feed:guest",

  // ── Products ───────────────────────────────────────────────────────────────
  /** Featured products (homepage carousel) */
  featuredProducts: () => "nf:products:featured",

  /** Product detail page */
  productDetail: (productId) => `nf:products:detail:${productId}`,

  /** Product reviews — keyed by product and page */
  productReviews: (productId, page = 1) =>
    `nf:products:reviews:${productId}:p${page}`,

  /** Products by category */
  categoryProducts: (category, page = 1) =>
    `nf:products:category:${category}:p${page}`,

  /** Trending products */
  trendingProducts: () => "nf:products:trending",

  /** Premium deals */
  premiumDeals: () => "nf:products:premium-deals",

  /** Search results — keyed by sanitised query + page */
  searchResults: (query, page = 1) =>
    `nf:products:search:${Buffer.from(query).toString("base64url").slice(0, 64)}:p${page}`,

  // ── Categories ─────────────────────────────────────────────────────────────
  categories: () => "nf:categories:all",

  // ── Vendors ────────────────────────────────────────────────────────────────
  /** Featured vendors */
  featuredVendors: () => "nf:vendors:featured",

  /** Single vendor public profile */
  vendorProfile: (vendorId) => `nf:vendors:profile:${vendorId}`,

  // ── Recommendations ────────────────────────────────────────────────────────
  userRecommendations: (userId, context = "homepage") =>
    `nf:recommendations:user:${userId}:${context}`,

  guestRecommendations: (context = "homepage") =>
    `nf:recommendations:guest:${context}`,

  // ── Discover Africa ────────────────────────────────────────────────────────
  africanFacts: (category = "all") => `nf:africa:facts:${category}`,
  africanProverbs: (country = "all") => `nf:africa:proverbs:${country}`,

  // ── Premium / Subscription ────────────────────────────────────────────────
  premiumStatus: (userId) => `nf:premium:status:${userId}`,
  monthlySummary: (userId, month) => `nf:premium:summary:${userId}:${month}`,

  // ── Exchange rates ─────────────────────────────────────────────────────────
  exchangeRates: (base = "USD") => `nf:fx:rates:${base}`,

  // ── Admin dashboard aggregates ────────────────────────────────────────────
  adminDashboardSummary: () => "nf:admin:dashboard:summary",
  adminOrdersPage: (page, status) =>
    `nf:admin:orders:p${page}:${status || "all"}`,

  // ── Vendor dashboard ───────────────────────────────────────────────────────
  vendorDashboardSummary: (vendorId) =>
    `nf:vendor:dashboard:${vendorId}:summary`,

  // ── Nile Miles / loyalty ──────────────────────────────────────────────────
  nileMilesSummary: (userId) => `nf:miles:summary:${userId}`,

  // ── Platform settings ─────────────────────────────────────────────────────
  platformSettings: () => "nf:settings:platform",

  // ── Invalidation tag sets (for bulk invalidation) ─────────────────────────
  /** Tag key — stores a Set of cache keys belonging to a tag */
  tagSet: (tag) => `nf:tags:${tag}`,
};

module.exports = { CacheKeys, TTL };
