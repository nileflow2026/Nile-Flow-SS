/**
 * NotificationPreferences — User notification preference resolution.
 *
 * Determines which channels a user has enabled/disabled for each notification type.
 * Not yet exposed in the UI, but the architecture supports it.
 * Default: all channels enabled for all types.
 *
 * @module notifications/NotificationPreferences
 */

'use strict';

const { Query } = require('node-appwrite');
const { instrumentedDb } = require('../services/appwriteService');
const { env } = require('../src/env');
const { CHANNEL, EVENT_CHANNELS, EVENT_NOTIFICATION_TYPE } = require('./NotificationTypes');

// Default: all channels always enabled
const DEFAULT_ENABLED = { [CHANNEL.EMAIL]: true, [CHANNEL.SMS]: true, [CHANNEL.PUSH]: true, [CHANNEL.IN_APP]: true, [CHANNEL.WHATSAPP]: true };

/**
 * Get the list of active channels for a given user and event.
 *
 * Checks user preferences stored on the user document.
 * Falls back to default (all channels enabled) if no preferences exist.
 *
 * @param {string} userId    — Appwrite user ID
 * @param {string} event     — EVENT.* value
 * @returns {Promise<string[]>} — Array of channel names to send on
 */
async function resolveChannels(userId, event) {
  // 1. Get the default channels for this event
  const defaults = EVENT_CHANNELS[event];
  if (!defaults) return [];

  // 2. Get user preferences (if any)
  const prefs = await getUserPreferences(userId);
  if (!prefs) return defaults; // No preferences → use defaults

  // 3. Filter channels by user preferences
  const notifType = EVENT_NOTIFICATION_TYPE[event] || 'order';
  const typePrefs = prefs[notifType] || DEFAULT_ENABLED;

  return defaults.filter((ch) => typePrefs[ch] !== false);
}

/**
 * Get user notification preferences from Appwrite user document.
 */
async function getUserPreferences(userId) {
  try {
    const userDoc = await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      userId,
    );
    return userDoc?.notificationPreferences || null;
  } catch {
    return null;
  }
}

/**
 * Default preference template for new users.
 * Used when seeding initial preferences.
 */
const DEFAULT_PREFERENCES = {
  order: { email: true, sms: true, push: true, in_app: true, whatsapp: true },
  payment: { email: true, sms: true, push: true, in_app: true, whatsapp: true },
  product: { email: true, sms: false, push: true, in_app: true, whatsapp: false },
  vendor: { email: true, sms: true, push: true, in_app: true, whatsapp: true },
  system: { email: true, sms: false, push: true, in_app: true, whatsapp: false },
  promotion: { email: false, sms: false, push: true, in_app: true, whatsapp: false },
  security: { email: true, sms: true, push: true, in_app: true, whatsapp: false },
  support: { email: true, sms: false, push: true, in_app: true, whatsapp: false },
  loyalty: { email: false, sms: false, push: true, in_app: true, whatsapp: false },
  ai: { email: false, sms: false, push: false, in_app: true, whatsapp: false },
};

module.exports = { resolveChannels, getUserPreferences, DEFAULT_PREFERENCES };
