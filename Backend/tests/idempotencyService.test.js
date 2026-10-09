"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const servicePath = path.resolve(__dirname, "../services/idempotency.service.js");
let storedDocument = null;
let listedDocuments = [];

const stubs = {
  "./appwriteService": {
    db: {
      listDocuments: async () => ({
        total: listedDocuments.length,
        documents: listedDocuments,
      }),
      createDocument: async (_databaseId, _collectionId, _id, data) => {
        storedDocument = data;
      },
    },
  },
  "node-appwrite": {
    ID: { unique: () => "generated-id" },
    Query: {
      equal: (...args) => args,
      lessThan: (...args) => args,
    },
  },
  "../utils/logger": { error: () => {}, info: () => {}, warn: () => {} },
  "../src/env": {
    env: {
      APPWRITE_DATABASE_ID: "database",
      APPWRITE_IDEMPOTENCY_COLLECTION: "idempotency",
    },
  },
};

const originalLoad = Module._load;
Module._load = function loadWithServiceStubs(request, parent, isMain) {
  if (parent?.filename === servicePath && Object.hasOwn(stubs, request)) {
    return stubs[request];
  }
  return originalLoad.call(this, request, parent, isMain);
};

let idempotencyService;
try {
  delete require.cache[servicePath];
  idempotencyService = require(servicePath);
} finally {
  Module._load = originalLoad;
}

test("idempotency results are stored as JSON strings and parsed on read", async () => {
  storedDocument = null;
  const value = { status: "sent", logId: "log-1" };

  await idempotencyService.store("key-1", value);

  assert.equal(typeof storedDocument.result, "string");
  assert.deepEqual(JSON.parse(storedDocument.result), value);

  listedDocuments = [{ expiresAt: new Date(Date.now() + 60_000).toISOString(), result: storedDocument.result }];
  assert.deepEqual(await idempotencyService.check("key-1"), value);
});

test("idempotency reads retain support for existing plain string results", async () => {
  listedDocuments = [{
    expiresAt: new Date(Date.now() + 60_000).toISOString(),
    result: "legacy-result",
  }];

  assert.equal(await idempotencyService.check("legacy-key"), "legacy-result");
});
