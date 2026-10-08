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

const instrumentedDb = {
  async listDocuments(_databaseId, _collectionId, queries) {
    listQuery.push(...queries);
    return {
      documents: [
        { $id: "general-notification", type: "userNotification" },
        { $id: "order-notification", type: "order" },
      ],
    };
  },
  async updateDocument(_databaseId, _collectionId, notificationId) {
    updatedNotificationIds.push(notificationId);
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
          APPWRITE_NOTIFICATIONS_COLLECTION_ID: "notifications",
        },
      };
    }
  }
  return originalLoad.call(this, request, parent, isMain);
};

const { markAllNotificationsAsRead } = require(controllerPath);
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
