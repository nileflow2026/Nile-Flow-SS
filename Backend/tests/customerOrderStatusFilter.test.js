"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const repositoryPath = require.resolve("../orders/OrderRepository");
const originalLoad = Module._load;
const capturedQueries = [];

const query = {
  equal: (attribute, value) => ({ equal: [attribute, value] }),
  or: (queries) => ({ or: queries }),
  orderDesc: (attribute) => ({ orderDesc: attribute }),
  limit: (value) => ({ limit: value }),
  offset: (value) => ({ offset: value }),
};

const instrumentedDb = {
  async listDocuments(_databaseId, _collectionId, queries) {
    capturedQueries.push(...queries);
    return { documents: [{ $id: "order-1" }], total: 1 };
  },
};

Module._load = function (request, parent, isMain) {
  if (parent?.filename === repositoryPath) {
    if (request === "node-appwrite") {
      return {
        ID: {},
        Query: query,
        Permission: {},
        Role: {},
      };
    }
    if (request === "../services/appwriteService") {
      return { instrumentedDb };
    }
    if (request === "../src/env") {
      return {
        env: {
          APPWRITE_DATABASE_ID: "database",
          APPWRITE_ORDERS_COLLECTION: "orders",
        },
      };
    }
  }
  return originalLoad.call(this, request, parent, isMain);
};

const OrderRepository = require("../orders/OrderRepository");
Module._load = originalLoad;

test("customer status filter matches both current and legacy status fields", async () => {
  const result = await OrderRepository.listByUser("customer-1", {
    status: "shipped",
    limit: 50,
  });

  assert.deepEqual(capturedQueries, [
    { equal: ["userId", "customer-1"] },
    { orderDesc: "$createdAt" },
    { limit: 50 },
    { offset: 0 },
    {
      or: [
        { equal: ["orderStatus", "shipped"] },
        { equal: ["status", "shipped"] },
      ],
    },
  ]);
  assert.deepEqual(result, {
    orders: [{ $id: "order-1" }],
    total: 1,
  });
});
