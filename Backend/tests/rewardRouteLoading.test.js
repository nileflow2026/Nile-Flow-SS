const test = require("node:test");
const assert = require("node:assert/strict");

test("payment and Nile Miles routers load during additional route initialization", () => {
  const paymentRouter = require("../routes/paymentrouter");
  const nileMilesRouter = require("../routes/reward");

  assert.equal(typeof paymentRouter, "function");
  assert.equal(typeof nileMilesRouter, "function");
});
