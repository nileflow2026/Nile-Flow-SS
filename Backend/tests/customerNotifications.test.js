"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const controllerPath = require.resolve(
  "../controllers/UserControllers/Clientnotification",
);
const originalLoad = Module._load;
const updatedNotificationIds = [];
const listQuery = [];
let userDocument = {
  $id: "customer-1",
  marketingPushEnabled: false,
  notificationPreferences: JSON.stringify({
    order: { email: false, push: true },
    support: { email: true, push: false },
  }),
};
let updatedUserDocument = null;

const instrumentedDb = {
  async getDocument() {
    return userDocument;
  },
  async listDocuments(_databaseId, _collectionId, queries) {
    listQuery.push(...queries);
    return {
      documents: [
        { $id: "general-notification", type: "userNotification" },
        { $id: "order-notification", type: "order" },
      ],
    };
  },
  async updateDocument(_databaseId, collectionId, documentId, update) {
    if (collectionId === "users") {
      updatedUserDocument = { documentId, update };
      userDocument = { ...userDocument, ...update };
      return userDocument;
    }
    updatedNotificationIds.push(documentId);
  },
};

Module._load = function (request, parent, isMain) {
  if (parent?.filename === controllerPath) {
    if (request === "node-appwrite") {
      return {
        ID: { unique: () => "unique-id" },
        Permission: { read() {}, update() {}, delete() {} },
        Query: {
          equal: (attribute, value) => ({ attribute, value }),
          orderDesc: (attribute) => ({ orderDesc: attribute }),
        },
      };
    }
    if (request === "../../services/appwriteService") {
      return { instrumentedDb };
    }
    if (request === "../../src/env") {
      return {
        env: {
          APPWRITE_DATABASE_ID: "database",
          APPWRITE_USER_COLLECTION_ID: "users",
          APPWRITE_NOTIFICATIONS_COLLECTION_ID: "notifications",
        },
      };
    }
  }
  return originalLoad.call(this, request, parent, isMain);
};

const {
  getCustomerNotificationPreferences,
  markAllNotificationsAsRead,
  updateCustomerNotificationPreferences,
} = require(controllerPath);
Module._load = originalLoad;

test("marks every unread notification for the authenticated user as read", async () => {
  const response = {
    statusCode: null,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };

  await markAllNotificationsAsRead(
    { user: { userId: "customer-1" } },
    response,
  );

  assert.deepEqual(listQuery, [
    { attribute: "userId", value: "customer-1" },
    { attribute: "read", value: false },
  ]);
  assert.deepEqual(updatedNotificationIds, [
    "general-notification",
    "order-notification",
  ]);
  assert.equal(response.statusCode, 200);
});

test("returns normalized preferences and reports whether mute was explicitly stored", async () => {
  userDocument.notificationPreferences = JSON.stringify({
    order: { email: false },
    support: { email: true },
  });
  const response = createResponse();

  await getCustomerNotificationPreferences(
    { user: { userId: "customer-1", role: "customer" } },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.marketingPushEnabled, false);
  assert.equal(response.body.soundMutedConfigured, false);
  assert.deepEqual(response.body.notificationPreferences.order, {
    push: true,
    soundId: "coreflow_1",
  });
  assert.deepEqual(JSON.parse(userDocument.notificationPreferences).support, {
    email: true,
  });
});

test("patches only allowed preferences and preserves unrelated stored fields", async () => {
  userDocument.notificationPreferences = JSON.stringify({
    order: { email: false, soundId: "coreflow_1" },
    support: { email: true, push: false },
  });
  const response = createResponse();

  await updateCustomerNotificationPreferences(
    {
      user: { userId: "customer-1", role: "customer" },
      body: {
        notificationPreferences: {
          order: { push: false },
          soundMuted: true,
        },
      },
    },
    response,
  );

  const saved = JSON.parse(updatedUserDocument.update.notificationPreferences);
  assert.equal(response.statusCode, 200);
  assert.equal(saved.order.push, false);
  assert.equal(saved.order.soundId, "coreflow_1");
  assert.equal(saved.order.email, false);
  assert.deepEqual(saved.support, { email: true, push: false });
  assert.equal(saved.soundMuted, true);
  assert.equal(response.body.soundMutedConfigured, true);
});

test("rejects a category preference that is not in the public contract", async () => {
  const response = createResponse();
  const previousUpdate = updatedUserDocument;

  await updateCustomerNotificationPreferences(
    {
      user: { userId: "customer-1", role: "customer" },
      body: {
        notificationPreferences: {
          promotion: { push: true },
        },
      },
    },
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.equal(updatedUserDocument, previousUpdate);
});

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}
