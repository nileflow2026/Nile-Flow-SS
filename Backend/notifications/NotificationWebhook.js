/**
 * NotificationWebhook — Delivers notifications to registered external webhooks.
 *
 * Allows third-party services (Slack, Discord, custom dashboards) to receive
 * real-time notification events. Webhooks are stored in the notification_webhooks
 * collection and filtered by event type.
 *
 * @module notifications/NotificationWebhook
 */

'use strict';

const crypto = require('crypto');
const { Query } = require('node-appwrite');
const { instrumentedDb } = require('../services/appwriteService');
const { env } = require('../src/env');
const NotificationLogger = require('./NotificationLogger');

const WEBHOOKS_COL = env.APPWRITE_NOTIFICATION_WEBHOOKS_COLLECTION_ID || 'notification_webhooks';

/**
 * Deliver a notification event to all registered webhooks that subscribe to it.
 *
 * @param {string} event    — Business event name (e.g. "order.created")
 * @param {object} payload  — Event payload data
 */
async function deliverToWebhooks(event, payload) {
  try {
    const webhooks = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      WEBHOOKS_COL,
      [Query.equal('active', true)],
    );

    for (const webhook of webhooks.documents) {
      const subscribedEvents = JSON.parse(webhook.events || '[]');
      if (!subscribedEvents.includes('*') && !subscribedEvents.includes(event)) continue;

      // Fire-and-forget each webhook delivery
      setImmediate(() => sendToWebhook(webhook, event, payload));
    }
  } catch (err) {
    console.warn('[NotificationWebhook] Failed to query webhooks:', err.message);
  }
}

/**
 * Send a signed payload to a single webhook URL.
 */
async function sendToWebhook(webhook, event, payload) {
  const body = JSON.stringify({
    event,
    timestamp: new Date().toISOString(),
    data: payload,
  });

  const signature = crypto
    .createHmac('sha256', webhook.secret)
    .update(body)
    .digest('hex');

  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-NileFlow-Event': event,
        'X-NileFlow-Signature': signature,
        'X-NileFlow-Timestamp': new Date().toISOString(),
      },
      body,
    });

    if (response.ok) {
      console.log(`[NotificationWebhook] Delivered ${event} to ${webhook.name} (${webhook.url})`);
    } else {
      console.warn(`[NotificationWebhook] ${webhook.name} returned ${response.status}`);
    }
  } catch (err) {
    console.warn(`[NotificationWebhook] Failed to deliver to ${webhook.name}:`, err.message);
  }
}

/**
 * Register a new webhook.
 */
async function registerWebhook({ name, url, events, secret }) {
  const { ID } = require('node-appwrite');
  const doc = await instrumentedDb.createDocument(
    env.APPWRITE_DATABASE_ID,
    WEBHOOKS_COL,
    ID.unique(),
    {
      name,
      url,
      events: JSON.stringify(events || ['*']),
      secret: secret || crypto.randomBytes(32).toString('hex'),
      active: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  );
  return doc;
}

/**
 * List all registered webhooks.
 */
async function listWebhooks() {
  const result = await instrumentedDb.listDocuments(
    env.APPWRITE_DATABASE_ID,
    WEBHOOKS_COL,
    [Query.orderDesc('$createdAt')],
  );
  return result.documents;
}

/**
 * Delete a webhook by ID.
 */
async function deleteWebhook(webhookId) {
  await instrumentedDb.deleteDocument(
    env.APPWRITE_DATABASE_ID,
    WEBHOOKS_COL,
    webhookId,
  );
}

module.exports = { deliverToWebhooks, registerWebhook, listWebhooks, deleteWebhook };
