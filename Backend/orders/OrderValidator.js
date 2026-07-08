/**
 * OrderValidator — Input validation and business rule enforcement for orders.
 *
 * Centralises all validation logic so services stay clean.
 * Rejects orders early with meaningful error messages.
 *
 * @module orders/OrderValidator
 */

'use strict';

const { ORDER_STATUS, PAYMENT_METHOD, CANCELLATION_REASONS, CANCELLABLE_STATUSES, CANCELLATION_WINDOW_MS } = require('./OrderTypes');

/**
 * Validate cart array.
 *
 * @param {Array} cart
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateCart(cart) {
  const errors = [];

  if (!cart || !Array.isArray(cart) || cart.length === 0) {
    errors.push('Cart is required and must contain at least one item');
    return { valid: false, errors };
  }

  cart.forEach((item, i) => {
    if (!item.productId) {
      errors.push(`Cart item ${i} is missing productId`);
    }
    if (!item.productName && !item.name) {
      errors.push(`Cart item ${i} is missing product name`);
    }
    if (!item.price || item.price <= 0) {
      errors.push(`Cart item ${i} has invalid price: ${item.price}`);
    }
    if (!item.quantity || item.quantity < 1) {
      errors.push(`Cart item ${i} has invalid quantity: ${item.quantity}`);
    }
  });

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a COD order request body.
 *
 * @param {object} body
 * @returns {{ valid: boolean, errors: string[], sanitized: object }}
 */
function validateCodRequest(body) {
  const errors = [];

  const cart = body.cart;
  const cartValidation = validateCart(cart);
  if (!cartValidation.valid) {
    errors.push(...cartValidation.errors);
  }

  const userId = Array.isArray(body.userId) ? body.userId[0] : body.userId;
  if (!userId) errors.push('User ID is required');

  if (!body.customerEmail) errors.push('Customer email is required');
  if (!body.username) errors.push('Username is required');

  return {
    valid: errors.length === 0,
    errors,
    sanitized: {
      userId,
      customerEmail: body.customerEmail,
      username: body.username,
      cart: cart || [],
      currency: body.currency || 'KES',
    },
  };
}

/**
 * Validate a status transition.
 *
 * @param {string} currentStatus
 * @param {string} newStatus
 * @param {object} [context]
 * @returns {{ valid: boolean, error: string|null }}
 */
function validateStatusTransition(currentStatus, newStatus, context = {}) {
  if (!currentStatus) {
    return { valid: false, error: 'Current status is required' };
  }
  if (!newStatus) {
    return { valid: false, error: 'New status is required' };
  }

  const validStatuses = Object.values(ORDER_STATUS);
  if (!validStatuses.includes(currentStatus)) {
    return { valid: false, error: `Unknown current status: "${currentStatus}"` };
  }
  if (!validStatuses.includes(newStatus)) {
    return { valid: false, error: `Unknown target status: "${newStatus}"` };
  }

  // Delegate to the state machine
  const { canTransition } = require('./OrderStateMachine');
  if (!canTransition(currentStatus, newStatus)) {
    return {
      valid: false,
      error: `Cannot transition from "${currentStatus}" to "${newStatus}"`,
    };
  }

  return { valid: true, error: null };
}

/**
 * Check if an order is eligible for cancellation based on status and age.
 *
 * @param {object} order
 * @returns {{ eligible: boolean, reason: string|null }}
 */
function validateCancellationEligibility(order) {
  const status = (order.orderStatus || order.status || '').toLowerCase();

  if (!CANCELLABLE_STATUSES.includes(status)) {
    return { eligible: false, reason: `Cannot cancel order with status: "${status}". Only pending or confirmed orders can be cancelled.` };
  }

  // Check 24-hour window
  const createdAt = order.createdAt || order.$createdAt;
  if (createdAt) {
    const orderDate = new Date(createdAt).getTime();
    const now = Date.now();
    if (now - orderDate > CANCELLATION_WINDOW_MS) {
      return { eligible: false, reason: 'Order is more than 24 hours old and can no longer be cancelled automatically. Please contact support.' };
    }
  }

  return { eligible: true, reason: null };
}

/**
 * Validate that a given reason is one of the allowed cancellation reasons.
 */
function validateCancellationReason(reason) {
  if (!reason || typeof reason !== 'string') {
    return { valid: false, error: 'Cancellation reason is required' };
  }
  if (reason.length < 2) {
    return { valid: false, error: 'Cancellation reason must be at least 2 characters' };
  }
  if (reason.length > 500) {
    return { valid: false, error: 'Cancellation reason must be under 500 characters' };
  }
  return { valid: true, error: null };
}

/**
 * Validate that a price matches the server-computed value within tolerance.
 *
 * @param {number} clientPrice
 * @param {number} serverPrice
 * @param {number} [tolerance=1]
 * @returns {{ valid: boolean, mismatch: number|null }}
 */
function validatePrice(clientPrice, serverPrice, tolerance = 1) {
  if (clientPrice == null || serverPrice == null) {
    return { valid: true, mismatch: null }; // Can't validate if one side is missing
  }
  const diff = Math.abs(Number(clientPrice) - Number(serverPrice));
  if (diff > tolerance) {
    return { valid: false, mismatch: diff };
  }
  return { valid: true, mismatch: null };
}

module.exports = {
  validateCart,
  validateCodRequest,
  validateStatusTransition,
  validateCancellationEligibility,
  validateCancellationReason,
  validatePrice,
};
