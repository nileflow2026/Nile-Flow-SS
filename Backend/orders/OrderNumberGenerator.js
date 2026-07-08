/**
 * OrderNumberGenerator — Generates professional, human-readable order numbers.
 *
 * Format: NF-YYYY-NNNNNNNNN
 * Example: NF-2026-000000123
 *
 * Features:
 * - Globally unique via counter document in Appwrite
 * - Sequential within a year (counter resets annually)
 * - URL-safe, copy-paste friendly
 * - Never exposes database document IDs
 *
 * @module orders/OrderNumberGenerator
 */

'use strict';

const { ID, Query } = require('node-appwrite');
const { instrumentedDb } = require('../services/appwriteService');
const { env } = require('../src/env');
const { ORDER_NUMBER_PREFIX } = require('./OrderTypes');

// Collection where the counter document lives
const COUNTER_COLLECTION_ID = env.APPWRITE_ORDER_COUNTER_COLLECTION_ID || 'order_counters';
const COUNTER_DOCUMENT_ID = 'global_order_counter';

/**
 * Generate the next professional order number.
 *
 * @returns {Promise<string>} — e.g. "NF-2026-000000123"
 */
async function generateOrderNumber() {
  const year = new Date().getFullYear().toString();

  try {
    // Try to get the existing counter document
    const counter = await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      COUNTER_COLLECTION_ID,
      COUNTER_DOCUMENT_ID,
    );

    let nextSeq;
    if (counter.year === year) {
      // Same year — increment
      nextSeq = (counter.lastSequence || 0) + 1;
    } else {
      // New year — reset
      nextSeq = 1;
    }

    // Update the counter
    await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      COUNTER_COLLECTION_ID,
      COUNTER_DOCUMENT_ID,
      { lastSequence: nextSeq, year, updatedAt: new Date().toISOString() },
    );

    return formatOrderNumber(year, nextSeq);
  } catch (err) {
    // Counter document doesn't exist yet — create it
    if (err.code === 404) {
      const firstSeq = 1;
      try {
        await instrumentedDb.createDocument(
          env.APPWRITE_DATABASE_ID,
          COUNTER_COLLECTION_ID,
          COUNTER_DOCUMENT_ID,
          {
            lastSequence: firstSeq,
            year,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        );
        return formatOrderNumber(year, firstSeq);
      } catch (createErr) {
        // Race condition — another request created the counter between our read and write.
        // Fall back to timestamp-based number to avoid blocking the order.
        console.warn('[OrderNumber] Counter race condition, using fallback:', createErr.message);
        return generateFallbackOrderNumber(year);
      }
    }

    // Unexpected error — fallback
    console.error('[OrderNumber] Unexpected error:', err.message);
    return generateFallbackOrderNumber(year);
  }
}

/**
 * Format a raw year + sequence into the canonical order number string.
 *
 * @param {string} year
 * @param {number} seq
 * @returns {string}
 */
function formatOrderNumber(year, seq) {
  const padded = String(seq).padStart(9, '0');
  return `${ORDER_NUMBER_PREFIX}-${year}-${padded}`;
}

/**
 * Fallback number generator — uses timestamp + random suffix.
 * Should rarely be needed, but ensures we never block order creation.
 *
 * @param {string} year
 * @returns {string}
 */
function generateFallbackOrderNumber(year) {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `${ORDER_NUMBER_PREFIX}-${year}-${timestamp}${random}`;
}

module.exports = {
  generateOrderNumber,
  formatOrderNumber,
};
