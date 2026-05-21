/**
 * Nile Flow — Cache Invalidation Strategy
 *
 * Centralised module defining WHAT gets invalidated WHEN.
 * Called from controllers/services after write operations.
 *
 * Rules:
 *  - Every write operation that changes data visible through a cached endpoint
 *    must call the appropriate invalidation function here.
 *  - Never invalidate more than necessary (targeted invalidation > flush-all).
 *  - Financial data is never cached — invalidation is a no-op for those paths.
 *
 * Usage:
 *   const invalidateCache = require('./invalidateCache');
 *   await invalidateCache.onProductUpdated(productId, vendorId);
 */

"use strict";

const { cacheDel, invalidateTags } = require("./cacheClient");
const { CacheKeys } = require("./cacheKeys");
const { logger } = require("../logger");

// ── Invalidation event handlers ──────────────────────────────────────────────

/**
 * Call when a product is created, updated, or deleted.
 */
async function onProductUpdated(productId, { category } = {}) {
  const keys = [
    CacheKeys.productDetail(productId),
    CacheKeys.featuredProducts(),
    CacheKeys.trendingProducts(),
    CacheKeys.homeFeed(),
    CacheKeys.homeFeedGuest(),
  ];

  if (category) {
    keys.push(CacheKeys.categoryProducts(category, 1));
    keys.push(CacheKeys.categoryProducts(category, 2));
    keys.push(CacheKeys.categoryProducts(category, 3));
  }

  await cacheDel(keys);
  logger.debug("Cache invalidated: product updated", {
    meta: { productId, category },
  });
}

/**
 * Call when product reviews are added/updated.
 */
async function onReviewUpdated(productId) {
  // Invalidate first 3 pages — deeper pages are rare
  const keys = [1, 2, 3].map((p) => CacheKeys.productReviews(productId, p));
  await cacheDel(keys);
}

/**
 * Call when categories change (new category, rename, delete).
 */
async function onCategoriesUpdated() {
  await cacheDel([CacheKeys.categories()]);
}

/**
 * Call when premium deals or featured deals are updated.
 */
async function onDealsUpdated() {
  await cacheDel([
    CacheKeys.premiumDeals(),
    CacheKeys.featuredProducts(),
    CacheKeys.homeFeed(),
    CacheKeys.homeFeedGuest(),
  ]);
}

/**
 * Call when a vendor's profile or product catalog changes.
 */
async function onVendorUpdated(vendorId) {
  await cacheDel([
    CacheKeys.vendorProfile(vendorId),
    CacheKeys.featuredVendors(),
    CacheKeys.vendorDashboardSummary(vendorId),
  ]);
}

/**
 * Call when a user's premium subscription status changes.
 */
async function onPremiumStatusChanged(userId) {
  await cacheDel([
    CacheKeys.premiumStatus(userId),
    // Monthly summary is now stale
    ...["all", "current"].map((m) => CacheKeys.monthlySummary(userId, m)),
  ]);
  logger.info("Cache invalidated: premium status changed", {
    meta: { userId },
  });
}

/**
 * Call when platform settings are updated (e.g., commission rates, shipping).
 */
async function onSettingsUpdated() {
  await cacheDel([CacheKeys.platformSettings()]);
}

/**
 * Call when Discover Africa content is updated.
 */
async function onAfricaContentUpdated() {
  await invalidateTags(["africa"]);
  await cacheDel([
    CacheKeys.africanFacts("all"),
    CacheKeys.africanProverbs("all"),
  ]);
}

/**
 * Call when exchange rates are refreshed.
 */
async function onExchangeRatesUpdated(base = "USD") {
  await cacheDel([CacheKeys.exchangeRates(base)]);
}

/**
 * Call when the admin dashboard summary is stale (new order, new user, etc).
 */
async function onAdminDashboardStale() {
  await cacheDel([CacheKeys.adminDashboardSummary()]);
}

/**
 * Nuke all caches matching a pattern — use sparingly, only for emergency
 * or full-platform settings refresh.  Requires the real Redis client.
 */
async function flushAll() {
  const { redis } = require("../../../services/redisClient");
  logger.warn("Full cache flush triggered — use sparingly");
  try {
    // Scan-and-delete all nf:* keys to avoid blocking FLUSHDB
    let cursor = "0";
    do {
      const [nextCursor, keys] = await redis.scan(
        cursor,
        "MATCH",
        "nf:*",
        "COUNT",
        100,
      );
      if (keys.length > 0) {
        await Promise.all(keys.map((k) => redis.del(k)));
      }
      cursor = nextCursor;
    } while (cursor !== "0");
    logger.info("Cache flush complete");
  } catch (err) {
    logger.error("Cache flush error", { meta: { error: err.message } });
  }
}

module.exports = {
  onProductUpdated,
  onReviewUpdated,
  onCategoriesUpdated,
  onDealsUpdated,
  onVendorUpdated,
  onPremiumStatusChanged,
  onSettingsUpdated,
  onAfricaContentUpdated,
  onExchangeRatesUpdated,
  onAdminDashboardStale,
  flushAll,
};
