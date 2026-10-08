"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const orderEventsPath = path.resolve(__dirname, "../orders/OrderEvents.js");
const calls = [];
let notificationServiceReady;

const originalLoad = Module._load;
Module._load = function loadOrderEventDependencies(request, parent, isMain) {
  if (parent?.filename === orderEventsPath) {
    if (request === "../utils/auditLogger") {
      return { logAudit: async () => {} };
    }
    if (request === "../src/env") {
      return { env: { PUSH_NOTIFICATIONS_V2_ENABLED: true } };
    }
  }
  if (
    parent?.filename === orderEventsPath &&
    request === "../notifications/NotificationService"
  ) {
    return {
      orderCreated: async (...args) => {
        calls.push(args);
        notificationServiceReady?.();
      },
    };
  }
  return originalLoad.call(this, request, parent, isMain);
};

let dispatch;
try {
  delete require.cache[orderEventsPath];
  ({ dispatch } = require(orderEventsPath));
} catch (error) {
  Module._load = originalLoad;
  throw error;
}

test.after(() => {
  Module._load = originalLoad;
});

test("pending order creation notifies the customer through the durable push path", async () => {
  calls.length = 0;
  const handled = new Promise((resolve) => {
    notificationServiceReady = resolve;
  });

  dispatch("order.created", {
    orderId: "order-1",
    orderNumber: "NF-1001",
    userId: "customer-1",
    paymentStatus: "pending",
    cartItems: [],
    metadata: {},
  });
  await handled;
  notificationServiceReady = null;

  assert.equal(calls.length, 1);
  assert.equal(calls[0][2].notifyCustomer, true);
  assert.equal(calls[0][2].suppressCustomerPush, undefined);
});
