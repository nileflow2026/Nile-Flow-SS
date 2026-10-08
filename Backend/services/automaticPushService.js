"use strict";

const crypto = require("crypto");
const { ID, Permission, Query, Role } = require("node-appwrite");
const { env } = require("../src/env");
const { instrumentedDb } = require("./appwriteService");
const { notificationsQueue, connection } = require("../src/jobs/queues");
const { eventPushJobId, eventPushRecoveryJobId } = require("./automaticPushJobIds");

const TEMPLATES = Object.freeze({
  "order.created": {
    title: "Order received",
    body: "We received your order. You can follow its progress in your orders.",
    type: "order",
    route: "/(Screens)/OrdersScreen",
  },
  "order.confirmed": {
    title: "Order confirmed",
    body: "Your order is confirmed. We will prepare it soon.",
    type: "order",
    route: "/(Screens)/OrdersScreen",
  },
  "order.preparing": {
    title: "Order update",
    body: "Your order is being prepared. Check your orders for the latest update.",
    type: "order",
    route: "/(Screens)/OrdersScreen",
  },
  "order.ready_for_dispatch": {
    title: "Order update",
    body: "Your order is ready to be sent. Check your orders for the latest update.",
    type: "order",
    route: "/(Screens)/OrdersScreen",
  },
  "order.out_for_delivery": {
    title: "Order on the way",
    body: "Your order is out for delivery. Check your orders for the latest update.",
    type: "order",
    route: "/(Screens)/OrdersScreen",
  },
  "order.shipped": {
    title: "Order on the way",
    body: "Your order is on the way. Check your orders for the latest update.",
    type: "order",
    route: "/(Screens)/OrdersScreen",
  },
  "order.delivered": {
    title: "Order delivered",
    body: "Your order has been delivered. Thank you for shopping with Nile Flow.",
    type: "order",
    route: "/(Screens)/OrdersScreen",
  },
  "order.cancelled": {
    title: "Order cancelled",
    body: "Your order was cancelled. View your orders for details.",
    type: "order",
    route: "/(Screens)/OrdersScreen",
  },
  "order.cancellation_requested": {
    title: "Cancellation request received",
    body: "We received your cancellation request. We will update you when it is reviewed.",
    type: "order",
    route: "/(Screens)/OrdersScreen",
  },
  "order.cancellation_approved": {
    title: "Cancellation approved",
    body: "Your cancellation request was approved. View your orders for details.",
    type: "order",
    route: "/(Screens)/OrdersScreen",
  },
  "order.cancellation_rejected": {
    title: "Cancellation not approved",
    body: "Your cancellation request was not approved. View your orders for details.",
    type: "order",
    route: "/(Screens)/OrdersScreen",
  },
  "account.welcome": {
    title: "Welcome to Nile Flow",
    body: "Your account is ready. Explore Nile Flow to get started.",
    type: "welcome",
    route: "/(tabs)/BottomTabs",
  },
  "account.password_changed": {
    title: "Account security alert",
    body: "Your password was changed. If this was not you, secure your account.",
    type: "security",
    route: "/(Screens)/Settings",
  },
  "account.email_changed": {
    title: "Account security alert",
    body: "The email on your account was changed. If this was not you, secure your account.",
    type: "security",
    route: "/(Screens)/Settings",
  },
});

const EVENT_ALIASES = Object.freeze({
  "order.paid": "order.confirmed",
  "order.ready": "order.ready_for_dispatch",
  "order.out_for_delivery": "order.out_for_delivery",
});

const collectionId = () => {
  if (!env.APPWRITE_PUSH_EVENT_RECEIPTS_COLLECTION_ID) {
    throw new Error("Push event receipt collection is not configured.");
  }
  return env.APPWRITE_PUSH_EVENT_RECEIPTS_COLLECTION_ID;
};

const withReceiptIndexAliases = (document) => ({
  ...document,
  ...(Object.hasOwn(document, "eventKeyHash")
    ? { eventKeyHashLookup: document.eventKeyHash }
    : {}),
  ...(Object.hasOwn(document, "status")
    ? { statusIndex: document.status }
    : {}),
  ...(Object.hasOwn(document, "createdAt")
    ? { createdAtIndex: document.createdAt }
    : {}),
});

const digest = (value, length = 64) =>
  crypto.createHash("sha256").update(value).digest("hex").slice(0, length);

const notificationIdFor = (eventKey, userId) =>
  digest(`notification:${eventKey}:${userId}`, 32);

const receiptIdFor = (eventKey, userId) =>
  digest(`receipt:${eventKey}:${userId}`, 32);

function getTemplate(eventType, templateVersion = "v1") {
  if (templateVersion !== "v1") return null;
  return TEMPLATES[EVENT_ALIASES[eventType] || eventType] || null;
}

function supportsEvent(eventType) {
  return Boolean(getTemplate(eventType));
}

async function ensureInAppNotice(receipt, template) {
  try {
    await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      receipt.inAppNotificationId,
    );
    return;
  } catch (error) {
    if (error.code !== 404) throw error;
  }

  await instrumentedDb.createDocument(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
    receipt.inAppNotificationId,
    {
      userId: receipt.recipientUserId,
      message: template.body,
      title: template.title,
      type: template.type,
      timestamp: receipt.createdAt,
      createdAt: receipt.createdAt,
      read: false,
      metadata: JSON.stringify({ route: template.route }),
    },
    [
      Permission.read(Role.user(receipt.recipientUserId)),
      Permission.update(Role.user(receipt.recipientUserId)),
      Permission.delete(Role.user(receipt.recipientUserId)),
    ],
  );
}

async function createAutomaticPush({ eventType, userId, eventKey }) {
  if (env.PUSH_NOTIFICATIONS_V2_ENABLED !== true) return { status: "disabled" };
  if (!eventType || !userId || !eventKey) {
    throw new Error("Automatic push requires an event type, user ID, and stable event key.");
  }

  const templateVersion = "v1";
  const template = getTemplate(eventType, templateVersion);
  if (!template) {
    throw new Error(`Automatic push template is not defined for ${eventType}.`);
  }

  const id = receiptIdFor(eventKey, userId);
  const eventKeyHash = digest(`${eventKey}:${userId}`);
  const now = new Date();
  let receipt;

  try {
    receipt = await instrumentedDb.createDocument(
      env.APPWRITE_DATABASE_ID,
      collectionId(),
      id,
      withReceiptIndexAliases({
        eventKeyHash,
        eventType,
        templateVersion,
        recipientUserId: userId,
        inAppNotificationId: notificationIdFor(eventKey, userId),
        status: "pending",
        attemptCount: 0,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
        expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      }),
    );
  } catch (error) {
    if (error.code !== 409) {
      throw new Error(
        `Could not create push event receipt in Appwrite project ${env.APPWRITE_PROJECT_ID}, database ${env.APPWRITE_DATABASE_ID}, collection ${collectionId()}: ${error.message}`,
        { cause: error },
      );
    }
    receipt = await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      collectionId(),
      id,
    );
    if (receipt.eventKeyHash !== eventKeyHash) {
      throw new Error("Automatic push receipt key collision.");
    }
  }

  if (receipt.status !== "pending") return { status: receipt.status, receiptId: id };

  await ensureInAppNotice(receipt, template);
  await notificationsQueue.add(
    "automatic-event-push",
    { type: "automatic-event-push", payload: { receiptId: id } },
    {
      jobId: eventPushJobId(id),
      attempts: 5,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  );
  return { status: "pending", receiptId: id };
}

async function processAutomaticPush(receiptId, sendQueuedPush) {
  const lockKey = `nf:push-event:${receiptId}`;
  const lockToken = crypto.randomUUID();
  const locked = await connection.set(lockKey, lockToken, "EX", 60, "NX");
  if (locked !== "OK") return { status: "pending", reason: "already_processing" };

  try {
    return await processLockedAutomaticPush(receiptId, sendQueuedPush);
  } finally {
    await connection.eval(
      "if redis.call('get', KEYS[1]) == ARGV[1] then return redis.call('del', KEYS[1]) else return 0 end",
      1,
      lockKey,
      lockToken,
    );
  }
}

async function processLockedAutomaticPush(receiptId, sendQueuedPush) {
  const receipt = await instrumentedDb.getDocument(
    env.APPWRITE_DATABASE_ID,
    collectionId(),
    receiptId,
  );
  if (receipt.status !== "pending") return { status: receipt.status };

  const template = getTemplate(receipt.eventType, receipt.templateVersion);
  if (!template) {
    await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      collectionId(),
      receiptId,
      withReceiptIndexAliases({ status: "unresolved", errorCategory: "unsupported_template", updatedAt: new Date().toISOString() }),
    );
    return { status: "unresolved" };
  }

  const remainingSeconds = Math.floor(
    (new Date(receipt.expiresAt).getTime() - Date.now()) / 1000,
  );
  if (remainingSeconds <= 0) {
    await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      collectionId(),
      receiptId,
      withReceiptIndexAliases({ status: "skipped", errorCategory: "expired", updatedAt: new Date().toISOString() }),
    );
    return { status: "skipped" };
  }

  await ensureInAppNotice(receipt, template);
  const outcome = await sendQueuedPush({
    userId: receipt.recipientUserId,
    title: template.title,
    message: template.body,
    type: template.type,
    data: { route: template.route },
    expiresAfter: remainingSeconds,
  });
  const updatedAt = new Date().toISOString();
  await instrumentedDb.updateDocument(
    env.APPWRITE_DATABASE_ID,
    collectionId(),
    receiptId,
    withReceiptIndexAliases({
      status:
        outcome.status === "accepted"
          ? "accepted"
          : outcome.status === "skipped"
            ? "skipped"
            : "rejected",
      ticketId: outcome.ticketId || "",
      errorCategory: outcome.reason || "",
      attemptCount: (receipt.attemptCount || 0) + 1,
      updatedAt,
    }),
  );

  if (outcome.status === "accepted" && receipt.eventType === "account.welcome") {
    await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      receipt.recipientUserId,
      { welcomePushSentAt: updatedAt },
    );
  }
  return outcome;
}

async function recoverPendingReceipts() {
  if (env.PUSH_NOTIFICATIONS_V2_ENABLED !== true) return 0;
  let cursor = null;
  let recovered = 0;
  while (true) {
    const queries = [
      Query.equal("statusIndex", "pending"),
      Query.orderAsc("$id"),
      Query.limit(100),
    ];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const page = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      collectionId(),
      queries,
    );
    if (!page.documents.length) break;

    for (const receipt of page.documents) {
      const template = getTemplate(receipt.eventType, receipt.templateVersion);
      if (!template) {
        await instrumentedDb.updateDocument(
          env.APPWRITE_DATABASE_ID,
          collectionId(),
          receipt.$id,
          withReceiptIndexAliases({ status: "unresolved", errorCategory: "unsupported_template", updatedAt: new Date().toISOString() }),
        );
        continue;
      }
      await ensureInAppNotice(receipt, template);
      await notificationsQueue.add(
        "automatic-event-push",
        { type: "automatic-event-push", payload: { receiptId: receipt.$id } },
        {
          jobId: eventPushRecoveryJobId(receipt.$id),
          attempts: 5,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 500 },
        },
      );
      recovered += 1;
    }
    cursor = page.documents[page.documents.length - 1].$id;
    if (page.documents.length < 100) break;
  }
  return recovered;
}

module.exports = {
  createAutomaticPush,
  getTemplate,
  processAutomaticPush,
  recoverPendingReceipts,
  supportsEvent,
};
