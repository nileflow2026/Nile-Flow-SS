/**
 * OrderIdempotency — Prevents duplicate order creation.
 *
 * Uses an in-memory Set with TTL-based eviction.
 * In production, replace with Redis for distributed idempotency.
 *
 * Each order request should include an idempotency key
 * (generated client-side via crypto.randomUUID()).
 * If the same key is reused within the TTL window, the request
 * is rejected as a duplicate.
 *
 * @module orders/OrderIdempotency
 */

'use strict';

const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours — covers the cancellation window

// In-process store. Replace with Redis in clustered deployments.
const store = new Map();

// Periodic cleanup every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, expiry] of store.entries()) {
    if (now > expiry) store.delete(key);
  }
}, 10 * 60 * 1000);

/**
 * Check and consume an idempotency key.
 *
 * @param {string} key — The idempotency key from X-Idempotency-Key header
 * @returns {{ isDuplicate: boolean, message: string|null }}
 */
function checkKey(key) {
  if (!key) {
    return { isDuplicate: false, message: null };
  }

  if (store.has(key)) {
    return { isDuplicate: true, message: 'Duplicate request detected. This order has already been placed.' };
  }

  // Store the key
  store.set(key, Date.now() + TTL_MS);
  return { isDuplicate: false, message: null };
}

/**
 * Middleware to check idempotency key on POST /api/orders.
 *
 * @param {object} req
 * @param {object} res
 * @param {Function} next
 */
function idempotencyMiddleware(req, res, next) {
  // Only apply to mutating requests
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  const key = req.headers['x-idempotency-key'];
  if (!key) {
    return next(); // No key provided — allow through (best-effort dedup)
  }

  const result = checkKey(key);
  if (result.isDuplicate) {
    return res.status(409).json({
      success: false,
      message: result.message,
      code: 'DUPLICATE_REQUEST',
    });
  }

  next();
}

/**
 * Get current store size (for monitoring/metrics).
 */
function getStoreSize() {
  return store.size;
}

/**
 * Clear all keys (for testing only).
 */
function _clearForTest() {
  store.clear();
}

module.exports = {
  checkKey,
  idempotencyMiddleware,
  getStoreSize,
  _clearForTest,
};
