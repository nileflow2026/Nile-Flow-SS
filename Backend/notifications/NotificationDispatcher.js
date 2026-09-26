/**
 * NotificationDispatcher — Routes notifications through the correct channels
 * with automatic retry and exponential backoff.
 *
 * Every channel (email, SMS, push, in-app) is handled independently.
 * Failure in one channel never affects another.
 *
 * @module notifications/NotificationDispatcher
 */

'use strict';

const { CHANNEL, DELIVERY_STATUS, RETRY } = require('./NotificationTypes');
const {
  sendEmail,
  sendSms,
  sendPush,
} = require('../services/appwriteMessagingService');
const { sendPushNotification } = require('../services/pushNotificationService');
const { createNotification } = require('../controllers/UserControllers/Clientnotification');
const WhatsAppProvider = require('./WhatsAppProvider');
const NotificationLogger = require('./NotificationLogger');
const idempotencyService = require('../services/idempotency.service');
const { env } = require('../src/env');

// Idempotency dedupe only runs when a real collection is configured — otherwise every
// check/store call fails against Appwrite and floods logs for no benefit (see
// APPWRITE_IDEMPOTENCY_COLLECTION in .env.example).
const IDEMPOTENCY_ENABLED = Boolean(env.APPWRITE_IDEMPOTENCY_COLLECTION);

/**
 * Dispatch a notification to a single recipient via a single channel.
 *
 * Idempotency: when `idempotencyKey` is supplied, a duplicate dispatch for the
 * same (event + recipient + channel) is skipped rather than re-sent — this
 * protects against the same business event being processed more than once
 * (e.g. a retried request or a re-emitted event).
 *
 * @param {object} options
 * @param {string} options.event          — Business event name
 * @param {string} options.channel        — CHANNEL.* value
 * @param {string} options.recipientId    — Appwrite user ID
 * @param {string} options.recipient      — Email / phone
 * @param {object} options.template       — Rendered template { emailSubject, emailHtml, sms, whatsapp, pushTitle, pushBody, inApp }
 * @param {object} [options.pushData]     — Extra push payload data
 * @param {string} [options.source]       — Source identifier for logging
 * @param {string} [options.idempotencyKey] — Stable key identifying this business event + recipient (e.g. orderId)
 * @returns {Promise<object>} — { status, logId }
 */
async function dispatch({ event, channel, recipientId, recipient, template, pushData = {}, source = '', idempotencyKey = null }) {
  if (channel === CHANNEL.IN_APP) {
    return { status: DELIVERY_STATUS.SKIPPED, logId: null };
  }

  const dedupeKey = (IDEMPOTENCY_ENABLED && idempotencyKey) ? `notif:${idempotencyKey}:${channel}` : null;
  if (dedupeKey) {
    const alreadySent = await idempotencyService.check(dedupeKey);
    if (alreadySent) {
      return { status: DELIVERY_STATUS.SKIPPED, logId: null };
    }
  }

  const deliveryFn = getDeliveryFn(channel);
  if (!deliveryFn) {
    console.warn(`[NotificationDispatcher] Unknown channel: ${channel}`);
    return { status: DELIVERY_STATUS.SKIPPED, logId: null };
  }

  // Build template params
  const params = buildParams(channel, recipientId, recipient, template, pushData);
  if (!params) {
    const logId = await NotificationLogger.log({
      event, channel, recipientId, recipient,
      status: DELIVERY_STATUS.SKIPPED,
      error: !recipient ? 'Recipient contact detail unavailable' : 'Channel content unavailable for this event/template',
      template: event,
      source,
    });
    return { status: DELIVERY_STATUS.SKIPPED, logId };
  }

  // Log the attempt
  const logId = await NotificationLogger.log({
    event, channel, recipientId, recipient,
    status: DELIVERY_STATUS.PENDING,
    template: event,
    source,
  });

  // Attempt delivery with retry
  let lastError = null;
  for (let attempt = 0; attempt <= RETRY.MAX_RETRIES; attempt++) {
    try {
      await deliveryFn(params);
      // Success
      await NotificationLogger.update(logId, { status: DELIVERY_STATUS.SENT });
      if (dedupeKey) await idempotencyService.store(dedupeKey, { status: DELIVERY_STATUS.SENT });
      return { status: DELIVERY_STATUS.SENT, logId };
    } catch (err) {
      lastError = err;

      // Permanent conditions (no Auth target, malformed content, provider not configured)
      // are never going to succeed on retry — skip immediately instead of burning 3 attempts.
      if (err.permanent) {
        await NotificationLogger.update(logId, { status: DELIVERY_STATUS.SKIPPED, error: err.message });
        return { status: DELIVERY_STATUS.SKIPPED, logId };
      }

      if (attempt < RETRY.MAX_RETRIES) {
        const delay = Math.min(
          RETRY.BASE_DELAY_MS * Math.pow(RETRY.BACKOFF_FACTOR, attempt),
          RETRY.MAX_DELAY_MS,
        );
        await NotificationLogger.update(logId, {
          status: DELIVERY_STATUS.RETRYING,
          error: err.message,
          retryCount: attempt + 1,
        });
        await sleep(delay);
      }
    }
  }

  // All retries exhausted
  await NotificationLogger.update(logId, {
    status: DELIVERY_STATUS.FAILED,
    error: lastError ? lastError.message : 'Unknown error',
    retryCount: RETRY.MAX_RETRIES + 1,
  });

  return { status: DELIVERY_STATUS.FAILED, logId };
}

/**
 * Dispatch to ALL active channels for a recipient.
 */
async function dispatchAll({ event, channels, recipientId, recipient, recipientPhone, recipientWhatsapp, template, pushData = {}, source = '', idempotencyKey = null }) {
  const results = {};
  for (const channel of channels) {
    // In-app notifications use the database notification path below, not
    // Appwrite Messaging provider targets.
    if (channel === CHANNEL.IN_APP) continue;

    let targetRecipient = recipient;
    if (channel === CHANNEL.SMS) {
      targetRecipient = recipientPhone || recipient;
      if (!targetRecipient) {
        await NotificationLogger.log({ event, channel, recipientId, recipient: '', status: DELIVERY_STATUS.SKIPPED, error: 'No phone number on file', template: event, source });
        continue;
      }
    }
    if (channel === CHANNEL.WHATSAPP) {
      targetRecipient = recipientWhatsapp || recipientPhone || recipient;
      if (!targetRecipient) {
        await NotificationLogger.log({ event, channel, recipientId, recipient: '', status: DELIVERY_STATUS.SKIPPED, error: 'No WhatsApp-capable phone number on file', template: event, source });
        continue;
      }
    }

    results[channel] = await dispatch({
      event, channel, recipientId,
      recipient: targetRecipient,
      template, pushData, source, idempotencyKey,
    });
  }
  return results;
}

/**
 * Dispatch an in-app notification.
 */
async function dispatchInApp({ recipientId, message, type, username, email }) {
  try {
    await createNotification({
      userId: recipientId,
      message,
      type: type || 'order',
      username: username || 'Customer',
      email: email || '',
    });
  } catch (err) {
    console.warn('[NotificationDispatcher] In-app notification failed:', err.message);
  }
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getDeliveryFn(channel) {
  const map = {
    [CHANNEL.EMAIL]: sendEmailWrapper,
    [CHANNEL.SMS]: sendSmsWrapper,
    [CHANNEL.PUSH]: sendPushWrapper,
    [CHANNEL.WHATSAPP]: sendWhatsAppWrapper,
  };
  return map[channel];
}

function buildParams(channel, userId, recipient, template, pushData) {
  switch (channel) {
    case CHANNEL.EMAIL:
      if (!template.emailSubject || !template.emailHtml) return null;
      return { userId, email: recipient, subject: template.emailSubject, content: template.emailHtml, isHtml: true };
    case CHANNEL.SMS:
      if (!template.sms) return null;
      return { userId, phone: recipient, content: template.sms };
    case CHANNEL.WHATSAPP:
      if (!WhatsAppProvider.isConfigured()) return null; // Not a transient failure — skip without retrying
      if (!template.whatsapp && !template.sms) return null;
      return { userId, phone: recipient, content: template.whatsapp || template.sms };
    case CHANNEL.PUSH:
      if (!template.pushTitle || !template.pushBody) return null;
      return { userId, title: template.pushTitle, body: template.pushBody, data: pushData };
    default:
      return null;
  }
}

// Permanent (non-retryable) delivery outcome — e.g. no Auth target, provider unconfigured.
class SkippedDeliveryError extends Error {
  constructor(reason) {
    super(reason || 'Notification skipped');
    this.permanent = true;
  }
}

const PERMANENT_REASONS = new Set(['missing_fields', 'no_auth_target']);

async function sendEmailWrapper(params) {
  const result = await sendEmail(params);
  if (!result.success) {
    if (PERMANENT_REASONS.has(result.reason)) throw new SkippedDeliveryError(result.reason);
    throw new Error(result.reason || 'Email send failed');
  }
}

async function sendSmsWrapper(params) {
  const result = await sendSms(params);
  if (!result.success) {
    if (PERMANENT_REASONS.has(result.reason)) throw new SkippedDeliveryError(result.reason);
    throw new Error(result.reason || 'SMS send failed');
  }
}

async function sendPushWrapper(params) {
  const result = await sendPush(params);
  // Also send via Expo as fallback for mobile — independent of the Appwrite push outcome
  try {
    await sendPushNotification({ userId: params.userId, message: params.body, title: params.title, type: 'order', data: params.data });
  } catch (_) {}
  if (!result.success) {
    if (PERMANENT_REASONS.has(result.reason)) throw new SkippedDeliveryError(result.reason);
    throw new Error(result.reason || 'Push send failed');
  }
}

async function sendWhatsAppWrapper(params) {
  const result = await WhatsAppProvider.sendOrderNotification({ to: params.phone, message: params.content });
  if (!result.success) {
    if (result.permanent) throw new SkippedDeliveryError(result.error);
    throw new Error(result.error || 'WhatsApp send failed');
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { dispatch, dispatchAll, dispatchInApp };
