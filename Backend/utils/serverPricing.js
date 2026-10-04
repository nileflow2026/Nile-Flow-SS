// utils/serverPricing.js
// ZERO TRUST: Server-side price computation - never trust client-sent prices
const {
  db,
  instrumentedDb,
  getCachedUser,
} = require("../services/appwriteService");
const { env } = require("../src/env");
const logger = require("./logger");
const { evaluateDeal, getDealFailure } = require("./dealPricingRules");

/**
 * Fetch the authoritative price for a single product from the database.
 * @param {string} productId
 * @returns {Promise<{price: number, productName: string} | null>}
 */
async function getProductPrice(productId) {
  if (!env.APPWRITE_PRODUCT_COLLECTION_ID) {
    logger.warn(
      "APPWRITE_PRODUCT_COLLECTION_ID not configured - cannot verify prices",
    );
    return null;
  }

  try {
    const product = await db.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId,
    );
    return {
      price: parseFloat(product.price),
      productName: product.productName || product.name,
    };
  } catch (error) {
    logger.error(
      `Failed to fetch product price for ${productId}:`,
      error.message,
    );
    return null;
  }
}

async function getDealPrice(dealId, productId, userId) {
  if (!env.APPWRITE_DEALS_COLLECTION_ID) {
    throw new Error("Deal collection is not configured.");
  }

  let deal;
  try {
    deal = await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_DEALS_COLLECTION_ID,
      dealId,
    );
  } catch (error) {
    if (error.code === 404 || error.code === "not_found") {
      return { valid: false, reason: "NOT_FOUND" };
    }
    throw error;
  }

  const pricing = evaluateDeal(deal, productId);
  if (!pricing.valid) return pricing;

  if (pricing.requiresPremium) {
    if (!userId) return { valid: false, reason: "PREMIUM_REQUIRED" };

    const user = await getCachedUser(userId);
    const expiresAt = user.prefs?.subscriptionExpiresAt;
    const hasActivePremium =
      user.prefs?.isPremium === true &&
      (!expiresAt || new Date(expiresAt).getTime() > Date.now());
    if (!hasActivePremium) {
      return { valid: false, reason: "PREMIUM_REQUIRED" };
    }
  }

  return {
    ...pricing,
    valid: true,
    dealId: deal.$id,
    productName: deal.productName,
  };
}

function getSubmittedCartPrice(item) {
  const value =
    item.price && typeof item.price === "object"
      ? (item.price.basePrice ?? item.price.raw ?? item.price.convertedPrice)
      : item.price;
  const price = Number(value);
  return Number.isFinite(price) ? price : NaN;
}

/**
 * Given a cart array, resolve all prices from trusted product and deal records.
 *
 * @param {Array<{productId: string, quantity: number}>} cartItems
 * @returns {Promise<{subtotal: number, verifiedItems: Array, errors: Array}>}
 */
async function computeCartSubtotal(cartItems, { userId } = {}) {
  const verifiedItems = [];
  const errors = [];
  const dealErrors = [];
  let subtotal = 0;

  for (const item of cartItems) {
    const productId = item.productId;
    const quantity = Number(item.quantity || 1);
    const clientPrice = getSubmittedCartPrice(item);

    if (!productId) {
      errors.push("Cart item missing productId");
      continue;
    }

    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 1000) {
      errors.push(`Invalid quantity ${quantity} for product ${productId}`);
      continue;
    }

    const dealId = item.dealId;
    let trustedPrice;
    let productName;
    let originalPrice = null;
    if (dealId) {
      const deal = await getDealPrice(dealId, productId, userId);
      if (!deal.valid) {
        const failure = getDealFailure(deal.reason);
        dealErrors.push({
          productId,
          dealId,
          code: failure.code,
          message: failure.message,
        });
        errors.push(failure.message);
        continue;
      }
      if (
        !Number.isFinite(clientPrice) ||
        Math.abs(clientPrice - deal.price) > 0.01
      ) {
        const failure = getDealFailure("PRICE_CHANGED");
        dealErrors.push({
          productId,
          dealId,
          code: failure.code,
          message: failure.message,
        });
        errors.push(failure.message);
        continue;
      }
      trustedPrice = deal.price;
      productName = deal.productName || item.productName;
      originalPrice = deal.originalPrice;
    } else {
      const productData = await getProductPrice(productId);
      if (
        !productData ||
        !Number.isFinite(productData.price) ||
        productData.price < 0
      ) {
        errors.push(`Product not found: ${productId}`);
        continue;
      }
      trustedPrice = productData.price;
      productName = productData.productName;
    }

    const lineTotal = trustedPrice * quantity;
    subtotal += lineTotal;

    verifiedItems.push({
      productId,
      productName,
      dbPrice: trustedPrice,
      price: trustedPrice,
      clientPrice,
      quantity,
      lineTotal,
      dealId: dealId || null,
      originalPrice,
      cartItem: {
        ...item,
        productId,
        productName,
        price: trustedPrice,
        quantity,
        ...(dealId
          ? {
              dealId,
              isDeal: true,
              originalPrice,
            }
          : {}),
      },
      priceMismatch:
        Number.isFinite(clientPrice) &&
        Math.abs(trustedPrice - clientPrice) > 0.01,
    });
  }

  // Log any price mismatches (potential tampering or stale cache)
  const mismatches = verifiedItems.filter((v) => v.priceMismatch);
  if (mismatches.length > 0) {
    logger.warn(
      "PRICE MISMATCH DETECTED - client sent different prices than DB:",
      {
        mismatches: mismatches.map((m) => ({
          productId: m.productId,
          dbPrice: m.dbPrice,
          clientPrice: m.clientPrice,
        })),
      },
    );
  }

  return {
    subtotal: Math.round(subtotal * 100) / 100,
    verifiedItems,
    errors,
    dealErrors,
  };
}

function getTrustedCartItems(verifiedItems) {
  return verifiedItems.map((item) => item.cartItem);
}

/**
 * Get the current KSH-to-USD exchange rate from platform settings,
 * falling back to the env var, then to a safe default.
 * In production this should be replaced with a real-time FX API.
 *
 * @returns {Promise<number>} KSH per 1 USD
 */
async function getExchangeRate() {
  // 1. Try platform settings (cached in PlatformSettingsService)
  try {
    const {
      platformSettingsService,
    } = require("../services/platformSettingsService");
    if (platformSettingsService) {
      const setting = await platformSettingsService.getSetting(
        "exchange_rate_ksh_usd",
      );
      if (setting && setting.settingValue) {
        const rate = parseFloat(setting.settingValue);
        if (rate > 0) return rate;
      }
    }
  } catch {
    // Platform settings not available - fall through
  }

  // 2. Try environment variable
  if (process.env.EXCHANGE_RATE_KSH_USD) {
    const rate = parseFloat(process.env.EXCHANGE_RATE_KSH_USD);
    if (rate > 0) return rate;
  }

  // 3. Safe default (should be updated regularly)
  const DEFAULT_RATE = 130;
  logger.warn(
    `Using default exchange rate: 1 USD = ${DEFAULT_RATE} KSH. ` +
      "Set EXCHANGE_RATE_KSH_USD env var or platform setting for accuracy.",
  );
  return DEFAULT_RATE;
}

/**
 * Convert KSH to USD using the current exchange rate
 * @param {number} amountKSH
 * @returns {Promise<{amountUSD: number, rate: number}>}
 */
async function convertKshToUsd(amountKSH) {
  const rate = await getExchangeRate();
  return {
    amountUSD: parseFloat((amountKSH / rate).toFixed(2)),
    rate,
  };
}

// Server-defined subscription plan prices (single source of truth)
const SUBSCRIPTION_PLANS = {
  premium_monthly: {
    amount: 200,
    currency: "KSH",
    durationDays: 30,
    name: "Nile Premium - 1 Month",
  },
};

/**
 * Get the server-defined price for a subscription plan
 * @param {string} planId - defaults to "premium_monthly"
 * @returns {{ amount: number, currency: string, durationDays: number, name: string } | null}
 */
function getSubscriptionPlanPrice(planId = "premium_monthly") {
  return SUBSCRIPTION_PLANS[planId] || null;
}

module.exports = {
  getProductPrice,
  getDealPrice,
  computeCartSubtotal,
  getTrustedCartItems,
  getExchangeRate,
  convertKshToUsd,
  getSubscriptionPlanPrice,
  SUBSCRIPTION_PLANS,
};
