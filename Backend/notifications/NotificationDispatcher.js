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
const NotificationLogger = require('./NotificationLogger');

/**
 * Dispatch a notification to a single recipient via a single channel.
 *
 * @param {object} options
 * @param {string} options.event          — Business event name
 * @param {string} options.channel        — CHANNEL.* value
 * @param {string} options.recipientId    — Appwrite user ID
 * @param {string} options.recipient      — Email / phone
 * @param {object} options.template       — Rendered template { emailSubject, emailHtml, sms, pushTitle, pushBody, inApp }
 * @param {object} [options.pushData]     — Extra push payload data
 * @param {string} [options.source]       — Source identifier for logging
 * @returns {Promise<object>} — { status, logId }
 */
async function dispatch({ event, channel, recipientId, recipient, template, pushData = {}, source = '' }) {
  const deliveryFn = getDeliveryFn(channel);
  if (!deliveryFn) {
    console.warn(`[NotificationDispatcher] Unknown channel: ${channel}`);
    return { status: DELIVERY_STATUS.SKIPPED, logId: null };
  }

  // Build template params
  const params = buildParams(channel, recipientId, recipient, template, pushData);
  if (!params) {
    return { status: DELIVERY_STATUS.SKIPPED, logId: null };
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
      return { status: DELIVERY_STATUS.SENT, logId };
    } catch (err) {
      lastError = err;
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
async function dispatchAll({ event, channels, recipientId, recipient, recipientPhone, template, pushData = {}, source = '' }) {
  const results = {};
  for (const channel of channels) {
    let targetRecipient = recipient;
    if (channel === CHANNEL.SMS) {
      targetRecipient = recipientPhone || recipient;
      if (!targetRecipient) continue;
    }

    results[channel] = await dispatch({
      event, channel, recipientId,
      recipient: targetRecipient,
      template, pushData, source,
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
    case CHANNEL.PUSH:
      if (!template.pushTitle || !template.pushBody) return null;
      return { userId, title: template.pushTitle, body: template.pushBody, data: pushData };
    default:
      return null;
  }
}

async function sendEmailWrapper(params) {
  await sendEmail(params);
}

async function sendSmsWrapper(params) {
  await sendSms(params);
}

async function sendPushWrapper(params) {
  await sendPush(params);
  // Also send via Expo as fallback for mobile
  try {
    await sendPushNotification({ userId: params.userId, message: params.body, title: params.title, type: 'order', data: params.data });
  } catch (_) {}
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = { dispatch, dispatchAll, dispatchInApp };
