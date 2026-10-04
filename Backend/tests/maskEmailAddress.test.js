const test = require("node:test");
const assert = require("node:assert/strict");
const { maskEmailAddress } = require("../utils/maskEmailAddress");

test("masks provider emails including a one character local part", () => {
  assert.equal(maskEmailAddress("a@example.com"), "a***@example.com");
  assert.equal(maskEmailAddress("alice@example.com"), "a***@example.com");
});

test("does not return an unmasked value for malformed email input", () => {
  assert.equal(maskEmailAddress("not-an-email"), "***");
});
