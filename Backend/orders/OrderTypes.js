/**
 * OrderTypes — Shared constants, enums, and type definitions for the
 * Nile Flow Order Management System.
 *
 * Every module in the orders/ domain uses these as the single source of truth.
 * Never hardcode status strings elsewhere.
 *
 * @module orders/OrderTypes
 */

'use strict';

// ── Order States ─────────────────────────────────────────────────────────────
// These are the canonical list of all possible order statuses.

const ORDER_STATUS = Object.freeze({
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  READY_FOR_DISPATCH: 'ready_for_dispatch',
  OUT_FOR_DELIVERY: 'out_for_delivery',
  DELIVERED: 'delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
  FAILED: 'failed',
});

// ── Order Status Display Labels ──────────────────────────────────────────────
// User-facing labels shown on invoices, tracking, emails.

const ORDER_STATUS_LABELS = Object.freeze({
  [ORDER_STATUS.PENDING]: 'Order Placed',
  [ORDER_STATUS.CONFIRMED]: 'Confirmed',
  [ORDER_STATUS.PREPARING]: 'Preparing',
  [ORDER_STATUS.READY_FOR_DISPATCH]: 'Ready for Dispatch',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'Out for Delivery',
  [ORDER_STATUS.DELIVERED]: 'Delivered',
  [ORDER_STATUS.COMPLETED]: 'Completed',
  [ORDER_STATUS.CANCELLED]: 'Cancelled',
  [ORDER_STATUS.REJECTED]: 'Rejected',
  [ORDER_STATUS.FAILED]: 'Failed',
});

// ── Payment Methods ──────────────────────────────────────────────────────────
// Currently only COD is active. Add new methods here as they are enabled.

const PAYMENT_METHOD = Object.freeze({
  CASH_ON_DELIVERY: 'Cash on Delivery',
  // FUTURE: STRIPE: 'stripe',
  // FUTURE: PAYPAL: 'paypal',
  // FUTURE: MPESA: 'M-Pesa',
  // FUTURE: MOBILE_MONEY: 'mobile_money',
  // FUTURE: WALLET: 'wallet',
});

// ── Payment Statuses ─────────────────────────────────────────────────────────

const PAYMENT_STATUS = Object.freeze({
  PENDING: 'pending',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
});

// ── Cancellation Reasons (curated) ──────────────────────────────────────────

const CANCELLATION_REASONS = Object.freeze([
  'Changed my mind',
  'Ordered by mistake',
  'Found a better price elsewhere',
  'Delivery takes too long',
  'Item no longer needed',
  'Duplicate order',
  'Payment issue',
  'Other',
]);

// ── Order History Event Types ────────────────────────────────────────────────

const ORDER_EVENT_TYPE = Object.freeze({
  CREATED: 'order.created',
  STATUS_CHANGED: 'order.status_changed',
  CANCELLATION_REQUESTED: 'order.cancellation_requested',
  CANCELLATION_APPROVED: 'order.cancellation_approved',
  CANCELLATION_REJECTED: 'order.cancellation_rejected',
  PAYMENT_UPDATED: 'order.payment_updated',
  VENDOR_ACCEPTED: 'order.vendor_accepted',
  VENDOR_REJECTED: 'order.vendor_rejected',
  RIDER_ASSIGNED: 'order.rider_assigned',
  INVENTORY_UPDATED: 'order.inventory_updated',
  ADMIN_MODIFIED: 'order.admin_modified',
  NOTE_ADDED: 'order.note_added',
});

// ── Status Colours for Frontend Badges ───────────────────────────────────────
// Mirrors the frontend's statusColors mapping — kept here for consistency.

const ORDER_STATUS_COLORS = Object.freeze({
  [ORDER_STATUS.PENDING]: 'default',
  [ORDER_STATUS.CONFIRMED]: 'primary',
  [ORDER_STATUS.PREPARING]: 'primary',
  [ORDER_STATUS.READY_FOR_DISPATCH]: 'primary',
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 'primary',
  [ORDER_STATUS.DELIVERED]: 'success',
  [ORDER_STATUS.COMPLETED]: 'success',
  [ORDER_STATUS.CANCELLED]: 'warning',
  [ORDER_STATUS.REJECTED]: 'warning',
  [ORDER_STATUS.FAILED]: 'warning',
});

// ── Order Number Prefix ─────────────────────────────────────────────────────

const ORDER_NUMBER_PREFIX = 'NF';

// ── Eligibility Windows (milliseconds) ──────────────────────────────────────

const CANCELLATION_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Valid cancellation targets (statuses that can be cancelled) ──────────────

const CANCELLABLE_STATUSES = Object.freeze([
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
]);

module.exports = {
  ORDER_STATUS,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_COLORS,
  PAYMENT_METHOD,
  PAYMENT_STATUS,
  CANCELLATION_REASONS,
  ORDER_EVENT_TYPE,
  ORDER_NUMBER_PREFIX,
  CANCELLATION_WINDOW_MS,
  CANCELLABLE_STATUSES,
};
