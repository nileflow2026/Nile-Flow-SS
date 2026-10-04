const test = require("node:test");
const assert = require("node:assert/strict");
const { isCustomerEmailVerified } = require("../utils/customerAuthPolicy");

test("customer access requires an explicit verified preference", () => {
  assert.equal(isCustomerEmailVerified({ prefs: { isVerified: true } }), true);
  assert.equal(isCustomerEmailVerified({ prefs: { isVerified: false } }), false);
  assert.equal(isCustomerEmailVerified({ prefs: { isVerified: "true" } }), false);
  assert.equal(isCustomerEmailVerified({ prefs: {} }), false);
  assert.equal(isCustomerEmailVerified(null), false);
});
