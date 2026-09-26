/**
 * WhatsAppProvider — Clean, provider-independent abstraction for sending
 * WhatsApp notifications.
 *
 * Appwrite Messaging does not support WhatsApp, so this module talks to the
 * WhatsApp Business (Cloud API) provider directly. The provider can be swapped
 * later (e.g. Twilio, 360dialog) without touching the Order/Notification
 * services — they only ever call `sendOrderNotification()` below.
 *
 * Required environment variables (documented, never hardcoded):
 *   WHATSAPP_API_URL        — Graph API base, e.g. https://graph.facebook.com/v20.0
 *   WHATSAPP_PHONE_NUMBER_ID — Sender's registered WhatsApp phone number ID
 *   WHATSAPP_ACCESS_TOKEN   — Permanent/system-user access token
 *
 * If any of these are missing, sends are skipped with a clear log line —
 * they never throw and never block order creation.
 *
 * @module notifications/WhatsAppProvider
 */

'use strict';

const { env } = require('../src/env');
const { normalizePhone } = require('../utils/phoneNormalizer');

function isConfigured() {
  return Boolean(env.WHATSAPP_API_URL && env.WHATSAPP_PHONE_NUMBER_ID && env.WHATSAPP_ACCESS_TOKEN);
}

/**
 * Send a plain-text WhatsApp message for a business notification.
 *
 * @param {object} options
 * @param {string} options.to           — Recipient phone number (local or E.164)
 * @param {string} options.message      — Message body
 * @param {string} [options.countryHint] — ISO2 country code for local-number normalization
 * @returns {Promise<{ success: boolean, permanent?: boolean, providerMessageId?: string, error?: string }>}
 *   `permanent: true` means retrying will never help (bad number, not configured) — the
 *   caller should skip rather than retry. Omitted/false means the failure may be transient.
 */
async function sendOrderNotification({ to, message, countryHint }) {
  if (!isConfigured()) {
    return { success: false, permanent: true, error: 'WhatsApp provider not configured (missing WHATSAPP_* env vars)' };
  }

  const normalized = normalizePhone(to, countryHint);
  if (!normalized) {
    return { success: false, permanent: true, error: `Invalid/unnormalizable phone number: ${to}` };
  }
  if (!message) {
    return { success: false, permanent: true, error: 'Missing message content' };
  }

  const url = `${env.WHATSAPP_API_URL.replace(/\/$/, '')}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: normalized.replace('+', ''),
        type: 'text',
        text: { body: message },
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const providerError = data?.error?.message || `HTTP ${response.status}`;
      // 4xx (bad request/auth/permission) won't fix itself on retry; 5xx/network might.
      const permanent = response.status >= 400 && response.status < 500;
      return { success: false, permanent, error: providerError };
    }

    return { success: true, providerMessageId: data?.messages?.[0]?.id };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { sendOrderNotification, isConfigured };
