"use strict";

const assert = require("node:assert/strict");
const { evaluateDeal } = require("../utils/dealPricingRules");

const now = Date.parse("2026-10-04T11:00:00.000Z");
const currentDeal = {
  productId: "product-1",
  isDeal: true,
  active: true,
  dealEndTime: "2026-10-04T12:00:00.000Z",
  dealPrice: 75,
  price: 100,
};

assert.deepEqual(evaluateDeal(currentDeal, "product-1", now), {
  valid: true,
  price: 75,
  originalPrice: 100,
  requiresPremium: false,
});
assert.equal(
  evaluateDeal({ ...currentDeal, dealEndTime: "2026-10-04T10:59:59.000Z" }, "product-1", now)
    .reason,
  "EXPIRED",
);
assert.equal(
  evaluateDeal({ ...currentDeal, active: false }, "product-1", now).reason,
  "INACTIVE",
);
assert.equal(
  evaluateDeal(currentDeal, "different-product", now).reason,
  "PRODUCT_MISMATCH",
);
assert.equal(
  evaluateDeal({ ...currentDeal, dealPrice: 0 }, "product-1", now).reason,
  "INVALID",
);
assert.equal(
  evaluateDeal({ ...currentDeal, dealEndTime: undefined }, "product-1", now)
    .reason,
  "INVALID",
);
assert.equal(
  evaluateDeal({ ...currentDeal, premiumDeal: true }, "product-1", now)
    .requiresPremium,
  true,
);

console.log("Deal pricing rules tests passed.");
