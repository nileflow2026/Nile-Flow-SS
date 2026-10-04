"use strict";

const DEAL_FAILURES = {
  NOT_FOUND: {
    code: "DEAL_UNAVAILABLE",
    message: "This deal is no longer available. Refresh the deals and try again.",
  },
  PRODUCT_MISMATCH: {
    code: "DEAL_UNAVAILABLE",
    message: "This deal is no longer available for this product.",
  },
  INACTIVE: {
    code: "DEAL_UNAVAILABLE",
    message: "This deal is no longer active.",
  },
  EXPIRED: {
    code: "DEAL_EXPIRED",
    message: "This deal has ended. Refresh the deals and try again.",
  },
  INVALID: {
    code: "DEAL_UNAVAILABLE",
    message: "This deal has invalid pricing and cannot be purchased.",
  },
  PRICE_CHANGED: {
    code: "DEAL_PRICE_CHANGED",
    message: "The deal price changed. Refresh your cart and review the new price.",
  },
  PREMIUM_REQUIRED: {
    code: "PREMIUM_REQUIRED",
    message: "This offer is available to active Nile Premium members.",
  },
};

function evaluateDeal(deal, productId, now = Date.now()) {
  if (!deal) return { valid: false, reason: "NOT_FOUND" };
  if (String(deal.productId) !== String(productId)) {
    return { valid: false, reason: "PRODUCT_MISMATCH" };
  }
  if (!(deal.isDeal || deal.isFlash) || deal.active === false) {
    return { valid: false, reason: "INACTIVE" };
  }

  const endTime = Date.parse(deal.dealEndTime);
  if (!Number.isFinite(endTime)) {
    return { valid: false, reason: "INVALID" };
  }
  if (endTime <= now) return { valid: false, reason: "EXPIRED" };

  const price = Number(deal.dealPrice);
  if (!Number.isFinite(price) || price <= 0) {
    return { valid: false, reason: "INVALID" };
  }

  const originalPrice = Number(deal.price);
  return {
    valid: true,
    price,
    originalPrice:
      Number.isFinite(originalPrice) && originalPrice > 0
        ? originalPrice
        : null,
    requiresPremium: Boolean(deal.premiumDeal),
  };
}

function getDealFailure(reason) {
  return DEAL_FAILURES[reason] || DEAL_FAILURES.NOT_FOUND;
}

module.exports = { evaluateDeal, getDealFailure };
