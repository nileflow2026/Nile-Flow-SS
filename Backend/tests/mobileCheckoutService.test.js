"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const { Query } = require("node-appwrite");

const servicePath = require.resolve("../services/mobileCheckoutService");
const originalLoad = Module._load;
const calls = [];
const db = {
  async listDocuments(...args) {
    calls.push(args);
    return { documents: [] };
  },
};
const addressService = {
  async getOwnedAddress() {
    return null;
  },
};

Module._load = function loadWithCheckoutDependencies(request, parent, isMain) {
  if (parent?.filename === servicePath) {
    if (request === "../src/appwrite") return { db };
    if (request === "../src/env") {
      return {
        env: {
          APPWRITE_DATABASE_ID: "database",
          APPWRITE_ORDERS_COLLECTION: "orders",
        },
      };
    }
    if (request === "./AddressService") return addressService;
  }

  return originalLoad.call(this, request, parent, isMain);
};

let checkoutService;
try {
  checkoutService = require(servicePath);
} finally {
  Module._load = originalLoad;
}

const checkoutAttemptId = "00000000-0000-4000-8000-000000000001";

test("looks up new checkout attempts using the indexed key", async () => {
  calls.length = 0;
  const order = { $id: "order-1" };
  db.listDocuments = async (...args) => {
    calls.push(args);
    return { documents: [order] };
  };

  assert.equal(
    await checkoutService.findOrderByAttempt(checkoutAttemptId),
    order,
  );
  assert.deepEqual(calls[0][2], [
    Query.equal("checkoutAttemptKey", checkoutAttemptId),
    Query.limit(2),
  ]);
  assert.equal(calls.length, 1);
});

test("falls back to the legacy attempt field for existing orders", async () => {
  calls.length = 0;
  const order = { $id: "legacy-order" };
  db.listDocuments = async (...args) => {
    calls.push(args);
    return { documents: calls.length === 1 ? [] : [order] };
  };

  assert.equal(
    await checkoutService.findOrderByAttempt(checkoutAttemptId),
    order,
  );
  assert.deepEqual(calls[1][2], [
    Query.equal("checkoutAttemptId", checkoutAttemptId),
    Query.limit(2),
  ]);
});

test("writes both attempt fields for new confirmed-address checkouts", async () => {
  calls.length = 0;
  db.listDocuments = async (...args) => {
    calls.push(args);
    return { documents: [] };
  };
  addressService.getOwnedAddress = async () => ({
    $id: "address-1",
    fullName: "Customer",
    address: "1 Example Road",
    phone: "+254700000000",
    city: "Nairobi",
    state: "Nairobi",
  });

  const checkout = await checkoutService.prepareMobileCheckout(
    {
      addressConfirmationVersion: 1,
      checkoutAttemptId,
      deliveryAddressId: "address-1",
      cart: [{ productId: "product-1", quantity: 1 }],
    },
    { userId: "user-1" },
  );

  assert.equal(checkout.orderFields.checkoutAttemptId, checkoutAttemptId);
  assert.equal(checkout.orderFields.checkoutAttemptKey, checkoutAttemptId);
});

test("returns the saved redirect URL when a pending Pesapal attempt is retried", () => {
  const recovery = checkoutService.getReusablePesapalCheckoutResponse(
    {
      $id: "order-2",
      orderNumber: "NF-2026-0002",
      paymentMethod: "Pesapal",
      paymentStatus: "pending",
    },
    checkoutService.CHECKOUT_RECOVERY_STATES.PAYMENT_PENDING,
    {
      orderId: "order-2",
      redirectUrl: "https://pay.pesapal.com/checkout/123",
    },
  );

  assert.equal(recovery.status, 200);
  assert.equal(recovery.body.success, true);
  assert.equal(
    recovery.body.redirectUrl,
    "https://pay.pesapal.com/checkout/123",
  );
});

test("does not report pending attempts as successful without a redirect URL", () => {
  const recovery = checkoutService.getReusablePesapalCheckoutResponse(
    {
      $id: "order-3",
      paymentMethod: "Pesapal",
      paymentStatus: "pending",
    },
    checkoutService.CHECKOUT_RECOVERY_STATES.PAYMENT_PENDING,
  );

  assert.equal(recovery.status, 409);
  assert.equal(recovery.body.success, false);
  assert.equal(recovery.body.code, "PESAPAL_CHECKOUT_LINK_UNAVAILABLE");
  assert.match(recovery.body.message, /before trying again/);
});

test("does not restart an attempt with an unknown payment status", () => {
  const recovery = checkoutService.getReusablePesapalCheckoutResponse(
    {
      $id: "order-4",
      paymentMethod: "Pesapal",
      paymentStatus: "unknown",
    },
    checkoutService.CHECKOUT_RECOVERY_STATES.PAYMENT_UNKNOWN,
  );

  assert.equal(recovery.status, 409);
  assert.equal(recovery.body.success, false);
  assert.equal(recovery.body.code, "PESAPAL_PAYMENT_STATUS_UNKNOWN");
});

test("resumes an unknown attempt when its provider session was saved", () => {
  const recovery = checkoutService.getReusablePesapalCheckoutResponse(
    {
      $id: "order-5",
      orderNumber: "NF-2026-0005",
      paymentMethod: "Pesapal",
      paymentStatus: "unknown",
    },
    checkoutService.CHECKOUT_RECOVERY_STATES.PAYMENT_UNKNOWN,
    {
      orderId: "order-5",
      redirectUrl: "https://pay.pesapal.com/checkout/456",
    },
  );

  assert.equal(recovery.status, 200);
  assert.equal(recovery.body.success, true);
  assert.equal(
    recovery.body.redirectUrl,
    "https://pay.pesapal.com/checkout/456",
  );
});
