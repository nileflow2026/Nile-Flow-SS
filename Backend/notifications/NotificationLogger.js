/**
 * NotificationLogger — Persists delivery logs and provides auditability.
 *
 * Every notification sent through the system is logged here.
 * Logs are immutable — never updated, only appended.
 *
 * @module notifications/NotificationLogger
 */

'use strict';

const { ID, Query } = require('node-appwrite');
const { instrumentedDb } = require('../services/appwriteService');
const { env } = require('../src/env');
const { DELIVERY_STATUS } = require('./NotificationTypes');

const LOG_COLLECTION_ID = env.APPWRITE_NOTIFICATION_LOGS_COLLECTION_ID || 'notification_logs';

/**
 * Record a notification delivery attempt.
 *
 * @param {object} entry
 * @param {string} entry.event        — Business event that triggered this
 * @param {string} entry.channel      — email | sms | push | in_app
 * @param {string} entry.recipientId  — Appwrite user ID
 * @param {string} entry.recipient    — Email address / phone number
 * @param {string} entry.status       — pending | sent | delivered | failed | skipped
 * @param {string} [entry.template]   — Template name used
 * @param {string} [entry.error]      — Error message if failed
 * @param {number} [entry.retryCount] — How many times this has been retried
 * @param {string} [entry.messageId]  — External message ID (e.g. Appwrite message ID)
 * @returns {Promise<string|null>} — The log document ID
 */
async function log(entry) {
  try {
    const doc = await instrumentedDb.createDocument(
      env.APPWRITE_DATABASE_ID,
      LOG_COLLECTION_ID,
      ID.unique(),
      {
        event: entry.event || 'unknown',
        channel: entry.channel || 'unknown',
        recipientId: entry.recipientId || '',
        recipient: entry.recipient || '',
        status: entry.status || DELIVERY_STATUS.PENDING,
        template: entry.template || '',
        error: entry.error || '',
        retryCount: entry.retryCount || 0,
        messageId: entry.messageId || '',
        source: entry.source || '',
        createdAt: new Date().toISOString(),
      },
    );
    return doc.$id;
  } catch (err) {
    console.warn('[NotificationLogger] Failed to log:', err.message);
    return null;
  }
}

/**
 * Update an existing log entry (e.g. mark as delivered after callback).
 *
 * @param {string} logId
 * @param {object} updates — { status, error?, messageId?, retryCount? }
 */
async function update(logId, updates) {
  try {
    await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      LOG_COLLECTION_ID,
      logId,
      { ...updates, updatedAt: new Date().toISOString() },
    );
  } catch (err) {
    console.warn('[NotificationLogger] Failed to update log:', err.message);
  }
}

/**
 * Query logs with pagination and filtering.
 *
 * @param {object} [options]
 * @returns {Promise<{logs: object[], total: number}>}
 */
async function query(options = {}) {
  const page = Math.max(1, parseInt(options.page) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(options.limit) || 25));
  const offset = (page - 1) * limit;

  const q = [Query.orderDesc('$createdAt'), Query.limit(limit), Query.offset(offset)];
  if (options.event) q.push(Query.equal('event', options.event));
  if (options.channel) q.push(Query.equal('channel', options.channel));
  if (options.status) q.push(Query.equal('status', options.status));
  if (options.recipientId) q.push(Query.equal('recipientId', options.recipientId));

  try {
    const response = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      LOG_COLLECTION_ID,
      q,
    );
    return { logs: response.documents, total: response.total };
  } catch (err) {
    console.warn('[NotificationLogger] Query failed:', err.message);
    return { logs: [], total: 0 };
  }
}

module.exports = { log, update, query };
