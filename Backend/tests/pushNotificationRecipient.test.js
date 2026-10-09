"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const servicePath = path.resolve(__dirname, "../services/pushNotificationService.js");
const lookups = [];
let documentsByCollection = {};

const stubs = {
  "../src/jobs/queues": { notificationsQueue: { add: async () => ({ id: "job-1" }) } },
  "./appwriteService": {
    instrumentedDb: {
      getDocument: async (databaseId, collectionId, userId) => {
        lookups.push({ databaseId, collectionId, userId });
        const document = documentsByCollection[collectionId];
        if (!document) {
          const error = new Error("Document not found");
          error.code = 404;
          throw error;
        }
        return document;
      },
      updateDocument: async (databaseId, collectionId, userId, data) => {
        documentsByCollection[collectionId] = {
          ...documentsByCollection[collectionId],
          ...data,
        };
      },
    },
  },
  "../src/env": {
    env: {
      APPWRITE_DATABASE_ID: "database",
      APPWRITE_USER_COLLECTION_ID: "users",
      APPWRITE_ADMIN_COLLECTION_ID: "admins",
      VENDOR_DATABASE_ID: "vendor-database",
      VENDOR_COLLECTION_ID: "vendors",
    },
  },
  "./pushNotificationJobIds": { pushNotificationJobId: () => "push-job-1" },
  "../notifications/CustomerNotificationPreferences": {
    readStoredPreferences: () => ({}),
    resolvePushSettings: () => ({
      enabled: true,
      sound: "coreflow_1.wav",
      channelId: "order",
    }),
  },
};

const originalLoad = Module._load;
Module._load = function loadWithServiceStubs(request, parent, isMain) {
  if (parent?.filename === servicePath && Object.hasOwn(stubs, request)) {
    return stubs[request];
  }
  return originalLoad.call(this, request, parent, isMain);
};

let pushNotificationService;
try {
  delete require.cache[servicePath];
  pushNotificationService = require(servicePath);
} finally {
  Module._load = originalLoad;
}

test("push recipient lookup falls back to the admin profile collection", async () => {
  documentsByCollection = {
    admins: { $id: "admin-1", pushToken: "ExponentPushToken[admin]" },
  };
  lookups.length = 0;

  const recipient = await pushNotificationService.getPushRecipient("admin-1");

  assert.equal(recipient.collectionId, "admins");
  assert.equal(recipient.document.pushToken, "ExponentPushToken[admin]");
  assert.deepEqual(lookups.map(({ collectionId }) => collectionId), ["users", "admins"]);
});

test("missing recipient documents are skipped instead of retried as job failures", async () => {
  documentsByCollection = {};
  lookups.length = 0;

  const result = await pushNotificationService.sendQueuedPush({
    userId: "deleted-recipient",
    message: "Order update",
    type: "order",
  });

  assert.deepEqual(result, { status: "skipped", reason: "recipient_not_found" });
  assert.deepEqual(lookups.map(({ collectionId }) => collectionId), ["users", "admins", "vendors"]);
});
