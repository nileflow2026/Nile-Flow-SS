"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { getRequestedOrderStatus } = require("../utils/orderStatusRequest");

test("reads the orderStatus field sent by the dashboard", () => {
  assert.equal(
    getRequestedOrderStatus({ orderStatus: "Shipped" }),
    "Shipped",
  );
});

test("continues to accept the legacy status field", () => {
  assert.equal(getRequestedOrderStatus({ status: "Delivered" }), "Delivered");
});

test("rejects missing and blank order statuses", () => {
  assert.equal(getRequestedOrderStatus({}), "");
  assert.equal(getRequestedOrderStatus({ orderStatus: "  " }), "");
});
