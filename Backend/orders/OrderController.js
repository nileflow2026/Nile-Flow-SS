/**
 * OrderController — Thin HTTP adapter for the Order Management System.
 *
 * Every method follows a consistent pattern:
 * 1. Extract authenticated user from req.user
 * 2. Call OrderService (never implements business logic)
 * 3. Send the response back
 *
 * These routes replace and consolidate functionality from:
 * - PaymentController.cashonDelivery
 * - PaymentController.cancelCodOrder
 * - admin.js (getOrders, updateOrderStatus, getCancelledOrders)
 * - orderController.js (handleCancelRequest)
 * - orderTrackingController.js (getUserOrders, getOrderStatus)
 *
 * @module orders/OrderController
 */

'use strict';

const OrderService = require('./OrderService');

// ── Customer-facing endpoints ────────────────────────────────────────────────

/**
 * POST /api/orders
 * Create a new Cash-on-Delivery order.
 */
async function createOrder(req, res) {
  const result = await OrderService.createCodOrder(req.body, req.user);
  return res.status(result.status || 200).json(result);
}

/**
 * GET /api/orders/mine
 * Get the authenticated customer's orders with pagination.
 */
async function getMyOrders(req, res) {
  const { page, limit, status } = req.query;
  const result = await OrderService.getCustomerOrders(req.user.userId, { page, limit, status });

  // Wrap in the format the frontend expects (OrdersPage.jsx uses response.data?.response or response.data?.orders)
  return res.json({
    success: true,
    response: result.orders,
    orders: result.orders,
    total: result.total,
    page: parseInt(page) || 1,
    limit: parseInt(limit) || 25,
  });
}

/**
 * GET /api/orders/:orderId
 * Get a single order by ID or order number.
 */
async function getOrderById(req, res) {
  const result = await OrderService.getOrder(req.params.orderId, req.user);
  if (!result) {
    return res.status(404).json({ success: false, message: 'Order not found' });
  }
  return res.json({ success: true, data: result });
}

/**
 * POST /api/orders/cancel-request
 * Submit a cancellation request.
 */
async function cancelRequest(req, res) {
  const result = await OrderService.requestCancellation(req.body, req.user);
  return res.status(result.status || 200).json(result);
}

/**
 * POST /api/orders/cancel
 * Cancel a COD order directly.
 */
async function cancelOrder(req, res) {
  const { orderId } = req.body;
  if (!orderId) return res.status(400).json({ success: false, message: 'Order ID is required' });

  const result = await OrderService.cancelCodOrder(orderId, req.user);
  return res.status(result.status || 200).json(result);
}

// ── Admin endpoints ──────────────────────────────────────────────────────────

/**
 * GET /api/orders/admin
 * List all orders with pagination and filtering (admin).
 */
async function adminListOrders(req, res) {
  const { page, limit, status, paymentStatus, paymentMethod, dateFrom, dateTo } = req.query;
  const result = await OrderService.listOrders({ page, limit, status, paymentMethod, paymentStatus, dateFrom, dateTo });
  return res.json({
    response: result.orders,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
}

/**
 * GET /api/orders/admin/cancelled
 * List archived/cancelled orders (admin).
 */
async function adminListArchived(req, res) {
  const { page, limit } = req.query;
  const result = await OrderService.listArchivedOrders({ page, limit });
  return res.json({
    response: result.orders,
    total: result.total,
    page: result.page,
    limit: result.limit,
    totalPages: result.totalPages,
  });
}

/**
 * PATCH /api/orders/admin/:orderId/status
 * Update order status (admin).
 */
async function adminUpdateStatus(req, res) {
  const { orderId } = req.params;
  const { status, reason } = req.body;
  if (!status) return res.status(400).json({ success: false, message: 'Status is required' });

  const result = await OrderService.updateStatus(orderId, status, req.user, { reason });
  return res.status(result.status || 200).json(result);
}

/**
 * GET /api/orders/admin/cancellation-requests
 * List pending cancellation requests (admin).
 */
async function adminListCancellationRequests(req, res) {
  const { page, limit } = req.query;
  const result = await OrderService.listCancellationRequests({ page, limit });
  return res.json({
    success: true,
    requests: result.requests,
    total: result.total,
  });
}

/**
 * POST /api/orders/admin/cancellation-requests/:requestId/approve
 * Approve a cancellation request (admin).
 */
async function adminApproveCancellation(req, res) {
  const { requestId } = req.params;
  const result = await OrderService.approveCancellation(requestId, req.user);
  return res.status(result.status || 200).json(result);
}

/**
 * POST /api/orders/admin/cancellation-requests/:requestId/reject
 * Reject a cancellation request (admin).
 */
async function adminRejectCancellation(req, res) {
  const { requestId } = req.params;
  const { reason } = req.body;
  const result = await OrderService.rejectCancellation(requestId, req.user, reason);
  return res.status(result.status || 200).json(result);
}

module.exports = {
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
};
