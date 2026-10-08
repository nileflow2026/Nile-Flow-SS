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
