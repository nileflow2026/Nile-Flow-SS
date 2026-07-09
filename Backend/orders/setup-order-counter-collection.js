/**
 * Setup Script: Order Counter Collection
 *
 * Creates the `order_counters` collection in Appwrite for sequential
 * order number generation (NF-2026-000000042).
 *
 * Run this once during initial deployment:
 *   node orders/setup-order-counter-collection.js
 *
 * @module orders/setup-order-counter-collection
 */

'use strict';

const { Databases, ID } = require('node-appwrite');
const { client } = require('../services/appwriteService');
const { env } = require('../src/env');

const COLLECTION_ID = 'order_counters';
const DATABASE_ID = env.APPWRITE_DATABASE_ID;

async function setupOrderCounterCollection() {
  console.log('=== Setting up order_counters collection ===');
  const db = new Databases(client);

  try {
    // Check if collection already exists
    try {
      const existing = await db.getCollection(DATABASE_ID, COLLECTION_ID);
      console.log(`✅ Collection "${COLLECTION_ID}" already exists (${existing.$id})`);
      return existing;
    } catch {
      // Collection doesn't exist — create it
    }

    const collection = await db.createCollection(
      DATABASE_ID,
      COLLECTION_ID,
      'Order Counters',
    );

    console.log(`✅ Collection created: ${collection.$id}`);

    // Create attributes
    await db.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'year', 4, true);
    await db.createIntegerAttribute(DATABASE_ID, COLLECTION_ID, 'lastSequence', true);
    await db.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'createdAt', 24, false);
    await db.createStringAttribute(DATABASE_ID, COLLECTION_ID, 'updatedAt', 24, false);
    console.log('✅ Attributes created');

    // Create indexes
    await db.createIndex(
      DATABASE_ID, COLLECTION_ID,
      'idx_year', 'key', ['year'],
    );
    console.log('✅ Indexes created');

    // Seed the initial counter document with proper user-defined fields
    const currentYear = new Date().getFullYear().toString();
    const now = new Date().toISOString();
    await db.createDocument(
      DATABASE_ID, COLLECTION_ID,
      'global_order_counter',
      {
        year: currentYear,
        lastSequence: 0,
        createdAt: now,
        updatedAt: now,
      },
    );
    console.log(`✅ Counter seeded for year ${currentYear}`);

    console.log('=== Setup complete ===');
    return collection;
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
    throw err;
  }
}

// Run if called directly
if (require.main === module) {
  setupOrderCounterCollection()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { setupOrderCounterCollection };
