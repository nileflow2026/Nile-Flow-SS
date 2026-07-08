/**
 * OrderStateMachine — Validated, deterministic state transitions for orders.
 *
 * Every status change must pass through this module. Invalid transitions
 * throw an error so the caller cannot silently corrupt order state.
 *
 * @module orders/OrderStateMachine
 */

'use strict';

const { ORDER_STATUS, ORDER_EVENT_TYPE } = require('./OrderTypes');

// ── Transition Graph ─────────────────────────────────────────────────────────
// Map of current status → set of allowed next statuses.
// Frozen to prevent runtime tampering.

const TRANSITIONS = Object.freeze({
  [ORDER_STATUS.PENDING]: Object.freeze([
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REJECTED,
    ORDER_STATUS.FAILED,
  ]),

  [ORDER_STATUS.CONFIRMED]: Object.freeze([
    ORDER_STATUS.PREPARING,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.REJECTED,
    ORDER_STATUS.FAILED,
  ]),

  [ORDER_STATUS.PREPARING]: Object.freeze([
    ORDER_STATUS.READY_FOR_DISPATCH,
    ORDER_STATUS.CANCELLED,
    ORDER_STATUS.FAILED,
  ]),

  [ORDER_STATUS.READY_FOR_DISPATCH]: Object.freeze([
    ORDER_STATUS.OUT_FOR_DELIVERY,
    ORDER_STATUS.CANCELLED,
  ]),

  [ORDER_STATUS.OUT_FOR_DELIVERY]: Object.freeze([
    ORDER_STATUS.DELIVERED,
    ORDER_STATUS.FAILED, // delivery failed
  ]),

  [ORDER_STATUS.DELIVERED]: Object.freeze([
    ORDER_STATUS.COMPLETED,
  ]),

  [ORDER_STATUS.COMPLETED]: Object.freeze([]), // terminal

  [ORDER_STATUS.CANCELLED]: Object.freeze([]), // terminal
  [ORDER_STATUS.REJECTED]: Object.freeze([]),  // terminal
  [ORDER_STATUS.FAILED]: Object.freeze([]),    // terminal — but may be retried
});

// ── Event mappings (what event type fires for each transition) ───────────────

const TRANSITION_EVENTS = Object.freeze({
  [`${ORDER_STATUS.PENDING}→${ORDER_STATUS.CONFIRMED}`]: ORDER_EVENT_TYPE.STATUS_CHANGED,
  [`${ORDER_STATUS.PENDING}→${ORDER_STATUS.CANCELLED}`]: ORDER_EVENT_TYPE.CANCELLATION_APPROVED,
  [`${ORDER_STATUS.CONFIRMED}→${ORDER_STATUS.PREPARING}`]: ORDER_EVENT_TYPE.STATUS_CHANGED,
  [`${ORDER_STATUS.PREPARING}→${ORDER_STATUS.READY_FOR_DISPATCH}`]: ORDER_EVENT_TYPE.STATUS_CHANGED,
  [`${ORDER_STATUS.READY_FOR_DISPATCH}→${ORDER_STATUS.OUT_FOR_DELIVERY}`]: ORDER_EVENT_TYPE.STATUS_CHANGED,
  [`${ORDER_STATUS.OUT_FOR_DELIVERY}→${ORDER_STATUS.DELIVERED}`]: ORDER_EVENT_TYPE.STATUS_CHANGED,
  [`${ORDER_STATUS.DELIVERED}→${ORDER_STATUS.COMPLETED}`]: ORDER_EVENT_TYPE.STATUS_CHANGED,
});

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Check whether a transition from `current` to `next` is valid.
 *
 * @param {string} current  — The order's current status (must be in ORDER_STATUS)
 * @param {string} next     — The desired new status (must be in ORDER_STATUS)
 * @returns {boolean}
 */
function canTransition(current, next) {
  const allowed = TRANSITIONS[current];
  if (!allowed) return false;
  return allowed.includes(next);
}

/**
 * Attempt to transition. Throws on invalid; returns the target status on success.
 *
 * @param {string} current
 * @param {string} next
 * @param {object} [context]  — Optional metadata (actor, reason) for the error message
 * @returns {string} — The `next` status on success
 * @throws {Error} — If transition is invalid
 */
function transition(current, next, context = {}) {
  if (!canTransition(current, next)) {
    const actor = context.actor || 'unknown';
    const reason = context.reason || '';
    throw new Error(
      `Invalid order state transition: "${current}" → "${next}" ` +
      `(initiated by ${actor}${reason ? `, reason: ${reason}` : ''})`,
    );
  }
  return next;
}

/**
 * Returns the event type that should be emitted for a given transition.
 *
 * @param {string} current
 * @param {string} next
 * @returns {string|undefined}
 */
function getEventForTransition(current, next) {
  return TRANSITION_EVENTS[`${current}→${next}`] || ORDER_EVENT_TYPE.STATUS_CHANGED;
}

/**
 * Return every valid target status reachable from `current`.
 *
 * @param {string} current
 * @returns {string[]}
 */
function validTargets(current) {
  return TRANSITIONS[current] || [];
}

/**
 * Returns true if the status is terminal (no outgoing transitions).
 *
 * @param {string} status
 * @returns {boolean}
 */
function isTerminal(status) {
  const targets = TRANSITIONS[status];
  return Array.isArray(targets) && targets.length === 0;
}

/**
 * Returns true if the status allows the order to be cancelled.
 *
 * @param {string} status
 * @returns {boolean}
 */
function isCancellable(status) {
  // An order can be cancelled from pending or confirmed
  return (
    status === ORDER_STATUS.PENDING ||
    status === ORDER_STATUS.CONFIRMED
  );
}

module.exports = {
  TRANSITIONS,
  canTransition,
  transition,
  getEventForTransition,
  validTargets,
  isTerminal,
  isCancellable,
};
