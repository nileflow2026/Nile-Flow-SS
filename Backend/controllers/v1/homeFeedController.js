/**
 * Nile Flow — v1 Home Feed Orchestration Controller
 *
 * GET /api/v1/home-feed
 *
 * Returns everything the homepage needs in ONE request:
 *   - Featured products
 *   - Categories
 *   - Premium deals (if authenticated + premium)
 *   - Discover Africa snippet (1 featured fact)
 *   - Platform settings (shipping threshold, etc.)
 *
 * Benefits:
 *   - Eliminates 4-6 parallel client-side requests on homepage load
 *   - Single cache entry for guest feed (high hit ratio)
 *   - Personalised data added only for authenticated users
 *
 * Cache strategy:
 *   - Guest feed: TTL 5 minutes (MEDIUM)
 *   - Auth feed: TTL 1 minute (SHORT) — may contain personalised data
 */

"use strict";

const { Query } = require("node-appwrite");
const { db } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const { getOrSet, cacheGet, cacheSet } = require("../lib/cache/cacheClient");
const { CacheKeys, TTL } = require("../lib/cache/cacheKeys");
const { logger } = require("../lib/logger");

/**
 * GET /api/v1/home-feed
 * Query params: currency (optional, e.g. KES)
 */
const getHomeFeed = async (req, res) => {
  const isAuthenticated = !!req.user;
  const userId = req.user?.userId || null;

  try {
    // ── Guest-level data (heavily cached) ─────────────────────────────────

    const guestKey = CacheKeys.homeFeedGuest();
    let guestData = await cacheGet(guestKey);

    if (!guestData) {
      logger.debug("Home feed cache MISS — fetching from Appwrite");

      const [featuredResult, categoriesResult, africaResult, settingsResult] =
        await Promise.allSettled([
          // Featured products
          db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_PRODUCT_COLLECTION_ID,
            [
              Query.equal("status", "approved"),
              Query.equal("featured", true),
              Query.limit(20),
              Query.orderDesc("$createdAt"),
            ],
          ),
          // Categories
          db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_CATEGORIES_COLLECTION_ID,
            [Query.limit(50), Query.orderAsc("sortOrder")],
          ),
          // Single featured Africa fact
          db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.AFRICAN_FACTS_COLLECTION_ID || "africanFacts",
            [
              Query.equal("active", true),
              Query.equal("featured", true),
              Query.limit(1),
            ],
          ),
          // Platform settings (shipping threshold, etc.)
          db.listDocuments(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID,
            [Query.limit(1)],
          ),
        ]);

      guestData = {
        featuredProducts:
          featuredResult.status === "fulfilled"
            ? featuredResult.value.documents
            : [],
        categories:
          categoriesResult.status === "fulfilled"
            ? categoriesResult.value.documents
            : [],
        africanFact:
          africaResult.status === "fulfilled" &&
          africaResult.value.documents.length > 0
            ? africaResult.value.documents[0]
            : null,
        settings:
          settingsResult.status === "fulfilled" &&
          settingsResult.value.documents.length > 0
            ? settingsResult.value.documents[0]
            : null,
        cachedAt: new Date().toISOString(),
      };

      await cacheSet(guestKey, guestData, TTL.MEDIUM, [
        "products",
        "categories",
      ]);
      logger.info("Home feed cached", {
        meta: {
          products: guestData.featuredProducts.length,
          categories: guestData.categories.length,
        },
      });
    }

    // ── Authenticated overlay ──────────────────────────────────────────────

    let personalizedData = {};

    if (isAuthenticated && userId) {
      // Premium status (short cache — subscription can change)
      const premiumKey = CacheKeys.premiumStatus(userId);
      const cachedPremium = await cacheGet(premiumKey);

      if (!cachedPremium) {
        try {
          const { users } = require("../../services/appwriteService");
          const prefs = await users.getPrefs(userId);
          const isPremium =
            prefs?.isPremium === "true" || prefs?.isPremium === true;
          await cacheSet(premiumKey, { isPremium }, TTL.PREMIUM);
          personalizedData.isPremium = isPremium;
        } catch {
          personalizedData.isPremium = false;
        }
      } else {
        personalizedData.isPremium = cachedPremium.isPremium;
      }

      // Premium deals if applicable
      if (personalizedData.isPremium) {
        const dealsKey = CacheKeys.premiumDeals();
        const cachedDeals = await cacheGet(dealsKey);

        if (!cachedDeals) {
          try {
            const dealsResult = await db.listDocuments(
              env.APPWRITE_DATABASE_ID,
              env.APPWRITE_PRODUCT_COLLECTION_ID,
              [
                Query.equal("premiumDeal", true),
                Query.equal("status", "approved"),
                Query.limit(10),
                Query.orderDesc("$createdAt"),
              ],
            );
            const deals = dealsResult.documents;
            await cacheSet(dealsKey, deals, TTL.MEDIUM, ["products"]);
            personalizedData.premiumDeals = deals;
          } catch {
            personalizedData.premiumDeals = [];
          }
        } else {
          personalizedData.premiumDeals = cachedDeals;
        }
      }
    }

    // ── Response ───────────────────────────────────────────────────────────

    res.json({
      success: true,
      data: {
        ...guestData,
        ...personalizedData,
        isAuthenticated,
      },
    });
  } catch (err) {
    logger.error("Home feed orchestration error", {
      meta: { error: err.message, userId },
    });
    res.status(500).json({
      success: false,
      message: "Failed to load home feed",
    });
  }
};

module.exports = { getHomeFeed };
