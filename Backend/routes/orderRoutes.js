/**
 * Order Routes — Consolidated, versioned order API.
 *
 * All order-related endpoints are defined here. This is the canonical router.
 * Existing routes in other files (adminRouter, paymentrouter, etc.) continue
 * to work for backward compatibility, but internally delegate to OrderService.
 *
 * Mount in index.js:
 *   const orderRoutes = require('./routes/orderRoutes');
 *   app.use('/api/orders', orderRoutes);
 *
 * @module routes/orderRoutes
 */

'use strict';

const { Router } = require('express');
const router = Router();
const authenticateToken = require('../middleware/authMiddleware');
const { idempotencyMiddleware } = require('../orders/OrderIdempotency');
const rateLimit = require('express-rate-limit');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelRequest,
  cancelOrder,
  adminListOrders,
  adminListArchived,
  adminUpdateStatus,
  adminListCancellationRequests,
  adminApproveCancellation,
  adminRejectCancellation,
} = require('../orders/OrderController');
const { adminOnly } = require('../middleware/auth');

// Rate limiters
const orderCreateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 orders per minute per IP
  message: { success: false, message: 'Too many orders created. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const cancelLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { success: false, message: 'Too many cancellation requests. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ── Customer-facing routes (authentication required) ─────────────────────────

router.post('/', authenticateToken, orderCreateLimiter, idempotencyMiddleware, createOrder);
router.get('/mine', authenticateToken, getMyOrders);
router.get('/:orderId', authenticateToken, getOrderById);
router.post('/cancel-request', authenticateToken, cancelLimiter, cancelRequest);
router.post('/cancel', authenticateToken, cancelOrder);

// ── Admin routes ─────────────────────────────────────────────────────────────

// Order listing and management
router.get('/admin/all', authenticateToken, adminOnly, adminListOrders);
router.get('/admin/archived', authenticateToken, adminOnly, adminListArchived);
router.patch('/admin/:orderId/status', authenticateToken, adminOnly, adminUpdateStatus);

// Cancellation request management
router.get('/admin/cancellation-requests', authenticateToken, adminOnly, adminListCancellationRequests);
router.post('/admin/cancellation-requests/:requestId/approve', authenticateToken, adminOnly, adminApproveCancellation);
router.post('/admin/cancellation-requests/:requestId/reject', authenticateToken, adminOnly, adminRejectCancellation);

module.exports = router;
