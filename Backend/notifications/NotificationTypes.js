/**
 * NotificationTypes — Canonical event types, channel definitions, and status constants
 * for the Nile Flow Notification System.
 *
 * Every module in this domain uses these as the single source of truth.
 *
 * @module notifications/NotificationTypes
 */

'use strict';

// ── Business Event Types ────────────────────────────────────────────────────
// These map 1:1 to business events that trigger notifications.
// Add new events here — no other code changes required.

const EVENT = Object.freeze({
  // Orders
  ORDER_CREATED: 'order.created',
  ORDER_CONFIRMED: 'order.confirmed',
  ORDER_PREPARING: 'order.preparing',
  ORDER_READY: 'order.ready_for_dispatch',
  ORDER_OUT_FOR_DELIVERY: 'order.out_for_delivery',
  ORDER_DELIVERED: 'order.delivered',
  ORDER_CANCELLED: 'order.cancelled',
  ORDER_CANCELLATION_REQUESTED: 'order.cancellation_requested',
  ORDER_CANCELLATION_APPROVED: 'order.cancellation_approved',
  ORDER_CANCELLATION_REJECTED: 'order.cancellation_rejected',
  ORDER_REFUND_INITIATED: 'order.refund_initiated',

  // Products
  PRODUCT_SUBMITTED: 'product.submitted',
  PRODUCT_APPROVED: 'product.approved',
  PRODUCT_REJECTED: 'product.rejected',

  // Vendor
  VENDOR_APPROVED: 'vendor.approved',
  VENDOR_REJECTED: 'vendor.rejected',
  VENDOR_WELCOME: 'vendor.welcome',

  // Account & Security
  ACCOUNT_WELCOME: 'account.welcome',
  ACCOUNT_VERIFIED: 'account.verified',
  PASSWORD_RESET: 'account.password_reset',
  PASSWORD_CHANGED: 'account.password_changed',
  EMAIL_CHANGED: 'account.email_changed',
  LOGIN_ALERT: 'account.login_alert',

  // Marketing & Promotions
  PROMOTION_CREATED: 'promotion.created',
  FLASH_SALE_STARTED: 'flash_sale.started',

  // Nile Miles / Loyalty
  MILES_EARNED: 'loyalty.miles_earned',
  REWARD_REDEEMED: 'loyalty.reward_redeemed',

  // Support
  SUPPORT_TICKET_CREATED: 'support.ticket_created',
  SUPPORT_TICKET_REPLIED: 'support.ticket_replied',

  // AI
  AI_MESSAGE: 'ai.message',
});

// ── Communication Channels ──────────────────────────────────────────────────

const CHANNEL = Object.freeze({
  EMAIL: 'email',
  SMS: 'sms',
  PUSH: 'push',
  IN_APP: 'in_app',
  WHATSAPP: 'whatsapp',
});

// ── Delivery Statuses ───────────────────────────────────────────────────────

const DELIVERY_STATUS = Object.freeze({
  PENDING: 'pending',
  SENT: 'sent',
  DELIVERED: 'delivered',
  FAILED: 'failed',
  RETRYING: 'retrying',
  SKIPPED: 'skipped',
});

// ── Default Channel Sets by Event ───────────────────────────────────────────
// Which channels fire for each event type.

const EVENT_CHANNELS = Object.freeze({
  [EVENT.ORDER_CREATED]: [CHANNEL.EMAIL, CHANNEL.SMS, CHANNEL.WHATSAPP, CHANNEL.PUSH, CHANNEL.IN_APP],
  [EVENT.ORDER_CONFIRMED]: [CHANNEL.EMAIL, CHANNEL.PUSH, CHANNEL.IN_APP],
  [EVENT.ORDER_PREPARING]: [CHANNEL.EMAIL, CHANNEL.PUSH, CHANNEL.IN_APP],
  [EVENT.ORDER_READY]: [CHANNEL.PUSH, CHANNEL.SMS, CHANNEL.IN_APP],
  [EVENT.ORDER_OUT_FOR_DELIVERY]: [CHANNEL.PUSH, CHANNEL.SMS, CHANNEL.IN_APP],
  [EVENT.ORDER_DELIVERED]: [CHANNEL.EMAIL, CHANNEL.PUSH, CHANNEL.IN_APP],
  [EVENT.ORDER_CANCELLED]: [CHANNEL.EMAIL, CHANNEL.PUSH, CHANNEL.IN_APP],
  [EVENT.ORDER_CANCELLATION_REQUESTED]: [CHANNEL.EMAIL, CHANNEL.PUSH, CHANNEL.IN_APP],
  [EVENT.ORDER_CANCELLATION_APPROVED]: [CHANNEL.EMAIL, CHANNEL.PUSH, CHANNEL.IN_APP],
  [EVENT.ORDER_CANCELLATION_REJECTED]: [CHANNEL.EMAIL, CHANNEL.PUSH, CHANNEL.IN_APP],
  [EVENT.PRODUCT_SUBMITTED]: [CHANNEL.EMAIL, CHANNEL.PUSH, CHANNEL.IN_APP],
  [EVENT.PRODUCT_APPROVED]: [CHANNEL.EMAIL, CHANNEL.PUSH, CHANNEL.IN_APP],
  [EVENT.PRODUCT_REJECTED]: [CHANNEL.EMAIL, CHANNEL.IN_APP],
  [EVENT.VENDOR_APPROVED]: [CHANNEL.EMAIL, CHANNEL.IN_APP],
  [EVENT.VENDOR_REJECTED]: [CHANNEL.EMAIL, CHANNEL.IN_APP],
  [EVENT.VENDOR_WELCOME]: [CHANNEL.EMAIL],
  [EVENT.ACCOUNT_WELCOME]: [CHANNEL.EMAIL, CHANNEL.IN_APP],
  [EVENT.ACCOUNT_VERIFIED]: [CHANNEL.EMAIL, CHANNEL.IN_APP],
  [EVENT.PASSWORD_RESET]: [CHANNEL.EMAIL],
  [EVENT.PASSWORD_CHANGED]: [CHANNEL.EMAIL, CHANNEL.PUSH, CHANNEL.IN_APP],
  [EVENT.EMAIL_CHANGED]: [CHANNEL.EMAIL, CHANNEL.PUSH, CHANNEL.IN_APP],
  [EVENT.LOGIN_ALERT]: [CHANNEL.EMAIL],
  [EVENT.PROMOTION_CREATED]: [CHANNEL.EMAIL, CHANNEL.PUSH, CHANNEL.IN_APP],
  [EVENT.FLASH_SALE_STARTED]: [CHANNEL.PUSH, CHANNEL.IN_APP],
  [EVENT.MILES_EARNED]: [CHANNEL.PUSH, CHANNEL.IN_APP],
  [EVENT.SUPPORT_TICKET_CREATED]: [CHANNEL.EMAIL, CHANNEL.IN_APP],
  [EVENT.AI_MESSAGE]: [CHANNEL.IN_APP],
});

// ── Retry Configuration ─────────────────────────────────────────────────────

const RETRY = Object.freeze({
  MAX_RETRIES: 3,
  BASE_DELAY_MS: 1000,      // 1 second
  MAX_DELAY_MS: 30000,      // 30 seconds
  BACKOFF_FACTOR: 2,        // exponential: 1s → 2s → 4s → 8s
});

// ── Notification Type (in-app categories) ───────────────────────────────────

const NOTIFICATION_TYPE = Object.freeze({
  ORDER: 'order',
  PAYMENT: 'payment',
  PRODUCT: 'product',
  VENDOR: 'vendor',
  SYSTEM: 'system',
  PROMOTION: 'promotion',
  SECURITY: 'security',
  SUPPORT: 'support',
  LOYALTY: 'loyalty',
  AI: 'ai',
});

// ── Event to Notification Type mapping ──────────────────────────────────────

const EVENT_NOTIFICATION_TYPE = Object.freeze({
  [EVENT.ORDER_CREATED]: NOTIFICATION_TYPE.ORDER,
  [EVENT.ORDER_CONFIRMED]: NOTIFICATION_TYPE.ORDER,
  [EVENT.ORDER_CANCELLED]: NOTIFICATION_TYPE.ORDER,
  [EVENT.ORDER_CANCELLATION_REQUESTED]: NOTIFICATION_TYPE.ORDER,
  [EVENT.ORDER_CANCELLATION_APPROVED]: NOTIFICATION_TYPE.ORDER,
  [EVENT.ORDER_CANCELLATION_REJECTED]: NOTIFICATION_TYPE.ORDER,
  [EVENT.PRODUCT_SUBMITTED]: NOTIFICATION_TYPE.PRODUCT,
  [EVENT.PRODUCT_APPROVED]: NOTIFICATION_TYPE.PRODUCT,
  [EVENT.VENDOR_APPROVED]: NOTIFICATION_TYPE.VENDOR,
  [EVENT.ACCOUNT_WELCOME]: NOTIFICATION_TYPE.SYSTEM,
  [EVENT.PASSWORD_CHANGED]: NOTIFICATION_TYPE.SECURITY,
  [EVENT.EMAIL_CHANGED]: NOTIFICATION_TYPE.SECURITY,
  [EVENT.LOGIN_ALERT]: NOTIFICATION_TYPE.SECURITY,
  [EVENT.PROMOTION_CREATED]: NOTIFICATION_TYPE.PROMOTION,
  [EVENT.MILES_EARNED]: NOTIFICATION_TYPE.LOYALTY,
  [EVENT.SUPPORT_TICKET_CREATED]: NOTIFICATION_TYPE.SUPPORT,
  [EVENT.AI_MESSAGE]: NOTIFICATION_TYPE.AI,
});

module.exports = {
  EVENT,
  CHANNEL,
  DELIVERY_STATUS,
  EVENT_CHANNELS,
  RETRY,
  NOTIFICATION_TYPE,
  EVENT_NOTIFICATION_TYPE,
};
