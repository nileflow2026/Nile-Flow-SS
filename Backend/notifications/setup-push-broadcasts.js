"use strict";

const { Databases, ID, Query } = require("node-appwrite");
const { client } = require("../services/appwriteService");
const { env } = require("../src/env");

const databaseId = env.APPWRITE_DATABASE_ID;
const attributeWaitMs = 1000;
const attributeWaitAttempts = 60;

async function waitForIndex(db, collectionId, key) {
  for (let attempt = 0; attempt < attributeWaitAttempts; attempt += 1) {
    const index = await db.getIndex(databaseId, collectionId, key);
    if (index.status === "available") return;
    if (index.status === "failed") {
      throw new Error(`Appwrite failed to create index ${collectionId}.${key}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, attributeWaitMs));
  }
  throw new Error(`Timed out waiting for index ${collectionId}.${key}.`);
}

async function createAttribute(db, method, collectionId, key, ...args) {
  try {
    await db[method](databaseId, collectionId, key, ...args);
  } catch (error) {
    if (error.code !== 409) throw error;
  }

  for (let attempt = 0; attempt < attributeWaitAttempts; attempt += 1) {
    const attribute = await db.getAttribute(databaseId, collectionId, key);
    if (attribute.status === "available") return;
    if (attribute.status === "failed") {
      throw new Error(`Appwrite failed to create ${collectionId}.${key}.`);
    }
    await new Promise((resolve) => setTimeout(resolve, attributeWaitMs));
  }
  throw new Error(`Timed out waiting for ${collectionId}.${key}.`);
}

async function createCollection(db, collectionId, name) {
  try {
    await db.createCollection(databaseId, collectionId, name, [], false);
  } catch (error) {
    if (error.code !== 409) throw error;
  }
}

async function createIndex(db, collectionId, key, type, attributes) {
  try {
    await db.createIndex(databaseId, collectionId, key, type, attributes);
  } catch (error) {
    if (error.code !== 409) throw error;
  }
  await waitForIndex(db, collectionId, key);
}

async function addString(db, collectionId, key, size) {
  await createAttribute(db, "createStringAttribute", collectionId, key, size, false);
}

async function addInteger(db, collectionId, key) {
  await createAttribute(db, "createIntegerAttribute", collectionId, key, false, 0, 2147483647);
}

async function addBoolean(db, collectionId, key) {
  await createAttribute(db, "createBooleanAttribute", collectionId, key, false);
}

async function backfillUsers(db) {
  let cursor = null;
  let scanned = 0;
  const now = new Date().toISOString();

  while (true) {
    const queries = [Query.orderAsc("$id"), Query.limit(100)];
    if (cursor) queries.push(Query.cursorAfter(cursor));
    const page = await db.listDocuments(databaseId, env.APPWRITE_USER_COLLECTION_ID, [
      ...queries,
    ]);
    if (page.documents.length === 0) break;

    for (const user of page.documents) {
      const patch = {};
      if (user.pushToken && !user.pushTokenFirstRegisteredAt) {
        patch.pushTokenFirstRegisteredAt = user.$createdAt || now;
      }
      if (!user.welcomePushSentAt) {
        patch.welcomePushSentAt = user.$createdAt || now;
      }
      if (Object.keys(patch).length > 0) {
        await db.updateDocument(databaseId, env.APPWRITE_USER_COLLECTION_ID, user.$id, patch);
      }
    }

    scanned += page.documents.length;
    cursor = page.documents[page.documents.length - 1].$id;
    if (page.documents.length < 100) break;
  }

  return scanned;
}

async function setupPushBroadcasts() {
  const collectionIds = {
    campaigns: env.APPWRITE_PUSH_BROADCASTS_COLLECTION_ID,
    deliveries: env.APPWRITE_PUSH_BROADCAST_DELIVERIES_COLLECTION_ID,
    receipts: env.APPWRITE_PUSH_EVENT_RECEIPTS_COLLECTION_ID,
  };
  for (const [name, id] of Object.entries(collectionIds)) {
    if (!id) throw new Error(`APPWRITE_PUSH_${name.toUpperCase()}_COLLECTION_ID is required.`);
  }

  const db = new Databases(client);
  const userCollectionId = env.APPWRITE_USER_COLLECTION_ID;
  await addString(db, userCollectionId, "pushTokenFirstRegisteredAt", 32);
  await addString(db, userCollectionId, "notificationPreferences", 4096);
  await addBoolean(db, userCollectionId, "marketingPushEnabled");
  await addString(db, userCollectionId, "marketingPushConsentUpdatedAt", 32);
  await addString(db, userCollectionId, "welcomePushSentAt", 32);
  await createIndex(db, userCollectionId, "idx_push_registered_at", "key", ["pushTokenFirstRegisteredAt"]);
  await createIndex(db, userCollectionId, "idx_marketing_push_enabled", "key", ["marketingPushEnabled"]);
  await createIndex(db, userCollectionId, "idx_marketing_consent_updated", "key", ["marketingPushConsentUpdatedAt"]);

  const campaign = collectionIds.campaigns;
  await createCollection(db, campaign, "Push Broadcasts");
  for (const [key, size] of [
    ["title", 80], ["body", 240], ["category", 32], ["destinationRoute", 80],
    ["createdBy", 36], ["idempotencyKey", 36], ["payloadHash", 64],
    ["status", 32], ["expiresAt", 32], ["recipientSnapshotAt", 32], ["lastProcessedUserId", 36],
    ["createdAt", 32], ["startedAt", 32], ["completedAt", 32], ["cancelledAt", 32],
  ]) await addString(db, campaign, key, size);
  for (const key of [
    "estimatedRecipientCount", "targetedCount", "acceptedCount",
    "rejectedCount", "unresolvedCount", "skippedCount",
  ]) await addInteger(db, campaign, key);
  await addBoolean(db, campaign, "recipientPreparationComplete");
  await createIndex(db, campaign, "idx_admin_idempotency", "unique", ["createdBy", "idempotencyKey"]);
  await createIndex(db, campaign, "idx_campaign_status", "key", ["status"]);
  await createIndex(db, campaign, "idx_campaign_created", "key", ["createdAt"]);

  const delivery = collectionIds.deliveries;
  await createCollection(db, delivery, "Push Broadcast Deliveries");
  for (const [key, size] of [
    ["campaignId", 36], ["userId", 36], ["status", 32], ["ticketId", 64],
    ["errorCategory", 64], ["inAppNotificationId", 36], ["createdAt", 32], ["updatedAt", 32],
    ["lastAttemptAt", 32],
  ]) await addString(db, delivery, key, size);
  for (const key of ["attemptCount", "manualRetryCount"]) await addInteger(db, delivery, key);
  await createIndex(db, delivery, "idx_campaign_user", "unique", ["campaignId", "userId"]);
  await createIndex(db, delivery, "idx_campaign_delivery_status", "key", ["campaignId", "status"]);
  await createIndex(db, delivery, "idx_delivery_created", "key", ["createdAt"]);

  const receipt = collectionIds.receipts;
  await createCollection(db, receipt, "Push Event Receipts");
  for (const [key, size] of [
    ["eventKeyHash", 64], ["eventType", 64], ["templateVersion", 32], ["recipientUserId", 36],
    ["inAppNotificationId", 36], ["status", 32], ["ticketId", 64],
    ["errorCategory", 64], ["createdAt", 32], ["updatedAt", 32], ["expiresAt", 32],
  ]) await addString(db, receipt, key, size);
  await addInteger(db, receipt, "attemptCount");
  await createIndex(db, receipt, "idx_event_receipt_hash", "unique", ["eventKeyHash"]);
  await createIndex(db, receipt, "idx_event_receipt_status", "key", ["status"]);
  await createIndex(db, receipt, "idx_receipt_created", "key", ["createdAt"]);

  await addString(db, env.APPWRITE_NOTIFICATIONS_COLLECTION_ID, "title", 80);
  await addString(db, env.APPWRITE_NOTIFICATIONS_COLLECTION_ID, "metadata", 512);

  const scannedUsers = await backfillUsers(db);
  console.log(`Push broadcast schema is ready. Existing users scanned: ${scannedUsers}.`);
  return { scannedUsers, collectionIds, setupId: ID.unique() };
}

function describeError(error) {
  const details = [];
  let current = error;
  while (current && details.length < 5) {
    const code = current.code ? ` (${current.code})` : "";
    details.push(`${current.name || "Error"}: ${current.message || "Unknown error"}${code}`);
    current = current.cause;
  }
  return details.join(" caused by ");
}

if (require.main === module) {
  setupPushBroadcasts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error("Push broadcast schema setup failed:", describeError(error));
      process.exit(1);
    });
}

module.exports = { describeError, setupPushBroadcasts };
