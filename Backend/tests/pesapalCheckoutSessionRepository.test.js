"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const repositoryPath = require.resolve(
  "../repositories/pesapalCheckoutSessionRepository",
);
const originalLoad = Module._load;
const documents = new Map();
const calls = [];
const db = {
  async getDocument(databaseId, collectionId, documentId) {
    calls.push(["get", databaseId, collectionId, documentId]);
    const document = documents.get(documentId);
    if (!document) {
      const error = new Error("Document not found");
      error.code = 404;
      throw error;
    }
    return document;
  },
  async createDocument(databaseId, collectionId, documentId, data) {
    calls.push(["create", databaseId, collectionId, documentId, data]);
    const document = { $id: documentId, ...data };
    documents.set(documentId, document);
    return document;
  },
  async updateDocument(databaseId, collectionId, documentId, data) {
    calls.push(["update", databaseId, collectionId, documentId, data]);
    const document = { ...documents.get(documentId), ...data };
    documents.set(documentId, document);
    return document;
  },
};

Module._load = function loadWithRepositoryDependencies(request, parent, isMain) {
  if (parent?.filename === repositoryPath) {
    if (request === "../src/appwrite") return { db };
    if (request === "../src/env") {
      return {
        env: {
          APPWRITE_DATABASE_ID: "database",
          APPWRITE_PESAPAL_CHECKOUT_COLLECTION_ID:
            "pesapal_checkout_sessions",
        },
      };
    }
  }

  return originalLoad.call(this, request, parent, isMain);
};

let repository;
try {
  repository = require(repositoryPath);
} finally {
  Module._load = originalLoad;
}

const attemptId = "00000000-0000-4000-8000-000000000002";
const session = {
  orderId: "order-1",
  redirectUrl: "https://pay.pesapal.com/checkout/123",
  trackingId: "tracking-1",
};

test("stores a session using the checkout attempt as its document ID", async () => {
  documents.clear();
  calls.length = 0;

  const stored = await repository.save(attemptId, session);

  assert.equal(stored.$id, attemptId);
  assert.deepEqual(stored, { $id: attemptId, ...session });
  assert.equal(
    calls.some(
      ([method, , collectionId, documentId]) =>
        method === "create" &&
        collectionId === "pesapal_checkout_sessions" &&
        documentId === attemptId,
    ),
    true,
  );
});

test("reuses the existing session for an idempotent save", async () => {
  documents.clear();
  calls.length = 0;
  documents.set(attemptId, { $id: attemptId, ...session });

  const stored = await repository.save(attemptId, {
    ...session,
    redirectUrl: "https://pay.pesapal.com/checkout/replacement",
  });

  assert.equal(stored.redirectUrl, session.redirectUrl);
  assert.equal(calls.some(([method]) => method === "create"), false);
  assert.equal(calls.some(([method]) => method === "update"), false);
});

test("replaces a session only when retrying a known failed payment", async () => {
  documents.clear();
  calls.length = 0;
  documents.set(attemptId, { $id: attemptId, ...session });
  const replacement = {
    ...session,
    redirectUrl: "https://pay.pesapal.com/checkout/retry",
    trackingId: "tracking-2",
  };

  const stored = await repository.save(attemptId, replacement, {
    replaceExisting: true,
  });

  assert.equal(stored.redirectUrl, replacement.redirectUrl);
  assert.equal(stored.trackingId, replacement.trackingId);
  assert.equal(calls.some(([method]) => method === "update"), true);
});

test("does not reuse a session that belongs to a different order", async () => {
  documents.clear();
  documents.set(attemptId, {
    $id: attemptId,
    ...session,
    orderId: "another-order",
  });

  await assert.rejects(
    repository.save(attemptId, session),
    /bound to a different order/,
  );
});
