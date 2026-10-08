"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const servicePath = path.resolve(
  __dirname,
  "../services/automaticPushService.js",
);
const documents = new Map();
const queuedJobs = [];
const pushDeliveries = [];

const appwriteError = (code) => Object.assign(new Error("Document not found"), { code });
const stubs = {
  "../src/env": {
    env: {
      PUSH_NOTIFICATIONS_V2_ENABLED: true,
      APPWRITE_PUSH_EVENT_RECEIPTS_COLLECTION_ID: "push-receipts",
      APPWRITE_DATABASE_ID: "database",
      APPWRITE_NOTIFICATIONS_COLLECTION_ID: "notifications",
    },
  },
  "./appwriteService": {
    instrumentedDb: {
      createDocument: async (_databaseId, collectionId, id, data) => {
        const document = { $id: id, ...data };
        documents.set(`${collectionId}:${id}`, document);
        return document;
      },
      getDocument: async (_databaseId, collectionId, id) => {
        const document = documents.get(`${collectionId}:${id}`);
        if (!document) throw appwriteError(404);
        return document;
      },
      updateDocument: async (_databaseId, collectionId, id, data) => {
        const key = `${collectionId}:${id}`;
        const document = { ...documents.get(key), ...data };
        documents.set(key, document);
        return document;
      },
    },
  },
  "../src/jobs/queues": {
    notificationsQueue: {
      add: async (name, data, options) => {
        const job = { name, data, options };
        queuedJobs.push(job);
        return job;
      },
    },
    connection: {
      set: async () => "OK",
      eval: async () => 1,
    },
  },
  "./automaticPushJobIds": {
    eventPushJobId: (receiptId) => `push-event-${receiptId}`,
    eventPushRecoveryJobId: () => "unused",
  },
};

const originalLoad = Module._load;
Module._load = function loadAutomaticPushDependencies(request, parent, isMain) {
  if (parent?.filename === servicePath && Object.hasOwn(stubs, request)) {
    return stubs[request];
  }
  return originalLoad.call(this, request, parent, isMain);
};

let createAutomaticPush;
let processAutomaticPush;
try {
  delete require.cache[servicePath];
  ({ createAutomaticPush, processAutomaticPush } = require(servicePath));
} finally {
  Module._load = originalLoad;
}

test("order creation stores a MyNotifications entry and queues a push worker job", async () => {
  documents.clear();
  queuedJobs.length = 0;
  pushDeliveries.length = 0;

  const result = await createAutomaticPush({
    eventType: "order.created",
    userId: "customer-1",
    eventKey: "order-1:customer:customer-1:order.created",
  });

  assert.equal(result.status, "pending");
  assert.equal(queuedJobs.length, 1);
  assert.equal(queuedJobs[0].name, "automatic-event-push");
  assert.equal(queuedJobs[0].data.type, "automatic-event-push");
  assert.equal(queuedJobs[0].data.payload.receiptId, result.receiptId);

  const receipt = documents.get(`push-receipts:${result.receiptId}`);
  const notice = documents.get(`notifications:${receipt.inAppNotificationId}`);
  assert.equal(receipt.eventType, "order.created");
  assert.equal(notice.userId, "customer-1");
  assert.equal(notice.title, "Order received");
  assert.equal(notice.type, "order");
  assert.equal(notice.read, false);

  const outcome = await processAutomaticPush(
    result.receiptId,
    async (payload) => {
      pushDeliveries.push(payload);
      return { status: "accepted", ticketId: "ticket-1" };
    },
  );
  assert.equal(outcome.status, "accepted");
  assert.equal(pushDeliveries.length, 1);
  assert.equal(pushDeliveries[0].userId, "customer-1");
  assert.equal(pushDeliveries[0].title, "Order received");
  assert.equal(
    documents.get(`push-receipts:${result.receiptId}`).status,
    "accepted",
  );
});
