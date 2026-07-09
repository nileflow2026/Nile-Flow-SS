/**
 * Setup Script: Notification Infrastructure Collections
 *
 * Creates the required Appwrite collections for the centralized notification system.
 *
 * NOTE: Appwrite v1.9.5 does NOT support setting default values on required attributes.
 * All attributes with defaults must be optional (required=false).
 *
 * Run once during deployment:
 *   node notifications/setup-notification-collections.js
 */

'use strict';

const { Databases, ID } = require('node-appwrite');
const { client } = require('../services/appwriteService');
const { env } = require('../src/env');

const DB = env.APPWRITE_DATABASE_ID;

/**
 * Helper: create a string attribute safely.
 * Appwrite 1.9.x cannot set default on required attributes.
 */
async function stringAttr(db, col, key, size, required = false, def) {
  try {
    // If a default is provided, the attribute MUST be optional (required=false)
    const isRequired = def !== undefined ? false : required;
    await db.createStringAttribute(DB, col, key, size, isRequired, def);
  } catch (err) {
    // If attribute already exists, skip
    if (err.code === 409) return;
    throw err;
  }
}

async function intAttr(db, col, key, required = false, min, max, def) {
  try {
    const isRequired = def !== undefined ? false : required;
    await db.createIntegerAttribute(DB, col, key, isRequired, min, max, def);
  } catch (err) {
    if (err.code === 409) return;
    throw err;
  }
}

async function boolAttr(db, col, key, required = false, def) {
  try {
    const isRequired = def !== undefined ? false : required;
    await db.createBooleanAttribute(DB, col, key, isRequired, def);
  } catch (err) {
    if (err.code === 409) return;
    throw err;
  }
}

async function createIndexSafe(db, col, id, type, attributes) {
  try {
    await db.createIndex(DB, col, id, type, attributes);
  } catch (err) {
    if (err.code === 409) return;
    throw err;
  }
}

async function setupNotificationCollections() {
  console.log('=== Setting up Notification Infrastructure ===\n');
  const db = new Databases(client);
  const COLLECTION_ID =  ID.unique();
  const WebhooksCollectionId = env.APPWRITE_NOTIFICATION_WEBHOOKS_COLLECTION_ID || ID.unique();

  // ── 1. notification_logs collection ──────────────────────────────────
  try {
    const existing = await db.getCollection(DB, COLLECTION_ID);
    console.log(`✅ notification_logs already exists (${existing.$id})`);
  } catch {
    console.log('Creating notification_logs collection...');
    const col = await db.createCollection(DB, COLLECTION_ID, 'Notification Delivery Logs');
    console.log(`✅ Collection created: ${col.$id}`);

    // Core required fields (no defaults)
    await stringAttr(db, COLLECTION_ID, 'event', 64, true);
    await stringAttr(db, COLLECTION_ID, 'channel', 16, true);
    await stringAttr(db, COLLECTION_ID, 'recipientId', 36, true);
    await stringAttr(db, COLLECTION_ID, 'status', 16, true);
    await stringAttr(db, COLLECTION_ID, 'createdAt', 24, true);

    // Optional fields (with defaults)
    await stringAttr(db, COLLECTION_ID, 'recipient', 256, false, '');
    await stringAttr(db, COLLECTION_ID, 'template', 64);
    await stringAttr(db, COLLECTION_ID, 'error', 512);
    await intAttr(db, COLLECTION_ID, 'retryCount', false, 0, 10, 0);
    await stringAttr(db, COLLECTION_ID, 'messageId', 64);
    await stringAttr(db, COLLECTION_ID, 'source', 64);
    await stringAttr(db, COLLECTION_ID, 'updatedAt', 24);

    // Indexes
    await createIndexSafe(db, COLLECTION_ID, 'idx_event', 'key', ['event']);
    await createIndexSafe(db, COLLECTION_ID, 'idx_status', 'key', ['status']);
    await createIndexSafe(db, COLLECTION_ID, 'idx_recipient', 'key', ['recipientId']);
    await createIndexSafe(db, COLLECTION_ID, 'idx_created', 'key', ['createdAt']);
    console.log('✅ notification_logs attributes and indexes created');
  }

  // ── 2. notification_webhooks collection ──────────────────────────────
  try {
    const existing = await db.getCollection(DB, WebhooksCollectionId);
    console.log(`✅ notification_webhooks already exists (${existing.$id})`);
  } catch {
    console.log('Creating notification_webhooks collection...');
    const col = await db.createCollection(DB, WebhooksCollectionId, 'Notification Webhooks');
    console.log(`✅ Collection created: ${col.$id}`);

    // Required fields
    await stringAttr(db, WebhooksCollectionId, 'name', 64, true);
    await stringAttr(db, WebhooksCollectionId, 'url', 512, true);
    await stringAttr(db, WebhooksCollectionId, 'events', 1024, true);
    await stringAttr(db, WebhooksCollectionId, 'secret', 128, true);
    await stringAttr(db, WebhooksCollectionId, 'createdAt', 24, true);

    // Optional with defaults
    await boolAttr(db, WebhooksCollectionId, 'active', false, true);
    await stringAttr(db, WebhooksCollectionId, 'updatedAt', 24);

    await db.createIndex(DB, WebhooksCollectionId, 'idx_active', 'key', ['active']);
    console.log('✅ notification_webhooks attributes and indexes created');
  }

  console.log('\n=== Setup Complete ===');
  console.log('📋 Add to .env if not present:');
  console.log('  APPWRITE_NOTIFICATION_LOGS_COLLECTION_ID=notification_logs');
  console.log('  APPWRITE_NOTIFICATION_WEBHOOKS_COLLECTION_ID=notification_webhooks');
}

if (require.main === module) {
  setupNotificationCollections()
    .then(() => process.exit(0))
    .catch((err) => { console.error(err.message); process.exit(1); });
}

module.exports = { setupNotificationCollections };
