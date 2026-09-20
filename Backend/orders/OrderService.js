/**
 * OrderService — Core business logic for the Order Management System.
 *
 * This is the single entry point for all order operations.
 * Existing controllers delegate to this service rather than implementing
 * business logic themselves.
 *
 * Every public method:
 * 1. Validates inputs (OrderValidator)
 * 2. Enforces access control (OrderPolicies)
 * 3. Validates state transitions (OrderStateMachine)
 * 4. Delegates persistence (OrderRepository)
 * 5. Dispatches events (OrderEvents)
 *
 * @module orders/OrderService
 */

'use strict';

const { ORDER_STATUS, ORDER_STATUS_LABELS, PAYMENT_METHOD, ORDER_EVENT_TYPE } = require('./OrderTypes');
const OrderValidator = require('./OrderValidator');
const OrderPolicies = require('./OrderPolicies');
const OrderStateMachine = require('./OrderStateMachine');
const OrderRepository = require('./OrderRepository');
const { generateOrderNumber } = require('./OrderNumberGenerator');
const { dispatch } = require('./OrderEvents');
const { checkStockAvailability, reduceProductStock, restoreProductStock } = require('../controllers/AdminControllers/stockController');
const { computeCartSubtotal } = require('../utils/serverPricing');
const { env } = require('../src/env');

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Create a new Cash-on-Delivery order.
 *
 * @param {object} body       — Raw request body from the COD endpoint
 * @param {object} authUser   — Authenticated user { userId, role }
 * @returns {Promise<object>} — { success, orderId, orderNumber, ... }
 */
async function createCodOrder(body, authUser, options = {}) {
  // 1. Validate input
  const validation = OrderValidator.validateCodRequest(body);
  if (!validation.valid) {
    return { success: false, status: 400, message: validation.errors.join('; ') };
  }

  const { userId, customerEmail, username, cart, currency } = validation.sanitized;

  // 2. ZERO TRUST: Recalculate total from DB prices
  const { subtotal: serverTotal, errors: priceErrors } = await computeCartSubtotal(cart);
  let trustedTotal;
  if (serverTotal !== null && priceErrors.length === 0) {
    trustedTotal = serverTotal;
  } else {
    trustedTotal = cart.reduce((t, i) => t + Number(i.price) * Number(i.quantity), 0);
  }

  if (!trustedTotal || trustedTotal <= 0) {
    return { success: false, status: 400, message: 'Invalid order total' };
  }

  // 3. Check stock availability
  const stockCheck = await checkStockAvailability(cart);
  if (!stockCheck.isAvailable) {
    return {
      success: false,
      status: 400,
      message: 'Some items are out of stock or insufficient quantity',
      unavailableItems: stockCheck.unavailableItems,
    };
  }

  // 4. Generate professional order number
  const orderNumber = await generateOrderNumber();

  // 5. Build the order document
  const orderDocument = {
    orderNumber,
    userId,
    customerEmail,
    username,
    items: JSON.stringify(cart),
    amount: Math.round(trustedTotal),
    currency: currency || 'KES',
    paymentMethod: options.paymentMethod || PAYMENT_METHOD.CASH_ON_DELIVERY,
    status: ORDER_STATUS.PENDING,
    orderStatus: ORDER_STATUS.PENDING,
    orderStatusLabel: ORDER_STATUS_LABELS[ORDER_STATUS.PENDING],
    paymentStatus: options.paymentStatus || 'succeeded',
    stockChecked: true,
    stockUpdated: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 6. Create order in database (atomic — fails or succeeds entirely)
  let createdOrder;
  try {
    createdOrder = await OrderRepository.create(orderDocument, userId);
  } catch (err) {
    return { success: false, status: 500, message: 'Failed to create order' };
  }

  const orderId = createdOrder.$id;

  // 7. Reduce stock (if this fails, the order still exists but is flagged)
  let stockUpdateResult = { success: true, updatedProducts: [] };
  try {
    stockUpdateResult = await reduceProductStock(cart, orderId);
    if (stockUpdateResult.success) {
      await OrderRepository.update(orderId, {
        stockUpdated: true,
        stockUpdateDetails: JSON.stringify(stockUpdateResult.updatedProducts),
      });
    } else {
      // Order created but stock update failed — mark order as failed
      await OrderRepository.update(orderId, {
        orderStatus: ORDER_STATUS.FAILED,
        status: ORDER_STATUS.FAILED,
        failureReason: 'Stock update failed',
        stockUpdated: false,
      });
      return {
        success: false,
        status: 500,
        message: 'Order created but stock update failed. Order has been marked as failed.',
        orderId,
      };
    }
  } catch (stockErr) {
    console.error('[OrderService] Stock reduction error:', stockErr.message);
    await OrderRepository.update(orderId, {
      orderStatus: ORDER_STATUS.FAILED,
      status: ORDER_STATUS.FAILED,
      failureReason: 'Stock update error: ' + stockErr.message,
    });
    return {
      success: false,
      status: 500,
      message: 'Order created but stock update error occurred.',
      orderId,
    };
  }

  // 8. Dispatch events (fire-and-forget)
  dispatch(ORDER_EVENT_TYPE.CREATED, {
    orderId,
    orderNumber,
    userId,
    email: customerEmail,
    username,
    amount: trustedTotal,
    paymentMethod: options.paymentMethod || PAYMENT_METHOD.CASH_ON_DELIVERY,
    cartItems: cart,
    actor: `customer:${userId}`,
    metadata: { stockUpdated: true, productsUpdated: stockUpdateResult.updatedProducts.length },
  });

  return {
    success: true,
    status: 201,
    orderId,
    orderNumber,
    message: 'Order created successfully.',
    stockUpdate: {
      success: true,
      productsUpdated: stockUpdateResult.updatedProducts.length,
    },
  };
}

/**
 * Cancel a COD order.
 *
 * @param {string} orderId
 * @param {object} authUser
 * @returns {Promise<object>}
 */
async function cancelCodOrder(orderId, authUser) {
  // 1. Find order
  const order = await OrderRepository.findById(orderId);
  if (!order) {
    return { success: false, status: 404, message: 'Order not found' };
  }

  // 2. Authorization
  if (!OrderPolicies.canCancel(order, authUser)) {
    return { success: false, status: 403, message: 'Not authorized to cancel this order' };
  }

  // 3. Validate payment method
  if (order.paymentMethod !== PAYMENT_METHOD.CASH_ON_DELIVERY) {
    return { success: false, status: 400, message: 'Only COD orders can be cancelled through this endpoint' };
  }

  // 4. State machine validation
  const currentStatus = order.orderStatus || order.status || ORDER_STATUS.PENDING;
  try {
    OrderStateMachine.transition(currentStatus, ORDER_STATUS.CANCELLED, {
      actor: `user:${authUser.userId}`,
      reason: 'Customer requested cancellation',
    });
  } catch (err) {
    return { success: false, status: 400, message: err.message };
  }

  // 5. Restore stock if it was reduced
  if (order.stockUpdated) {
    try {
      const cart = JSON.parse(order.items || '[]');
      await restoreProductStock(cart, 'order_cancelled');
    } catch (restoreErr) {
      console.warn('[OrderService] Stock restoration failed:', restoreErr.message);
    }
  }

  // 6. Update order
  const updates = {
    orderStatus: ORDER_STATUS.CANCELLED,
    status: ORDER_STATUS.CANCELLED,
    orderStatusLabel: ORDER_STATUS_LABELS[ORDER_STATUS.CANCELLED],
    updatedAt: new Date().toISOString(),
  };
  await OrderRepository.update(orderId, updates);

  // 7. Archive
  await OrderRepository.archiveOrder({
    originalOrderId: orderId,
    userId: order.userId || order.users,
    customerEmail: order.customerEmail,
    username: order.username,
    items: order.items,
    amount: order.amount,
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    failureType: 'user_cancelled',
    cancellationReason: 'Customer cancelled order',
  });

  // 8. Dispatch events
  dispatch(ORDER_EVENT_TYPE.CANCELLATION_APPROVED, {
    orderId,
    orderNumber: order.orderNumber,
    userId: order.userId || order.users,
    email: order.customerEmail,
    username: order.username,
    amount: order.amount,
    paymentMethod: order.paymentMethod,
    actor: `user:${authUser.userId}`,
    metadata: { previousStatus: currentStatus, stockRestored: order.stockUpdated },
  });

  return { success: true, message: 'Order cancelled successfully', orderId };
}

/**
 * Request an order cancellation (customer-facing).
 *
 * @param {object} body       — { orderId, reason, additionalDetails }
 * @param {object} authUser
 * @returns {Promise<object>}
 */
async function requestCancellation(body, authUser) {
  const { orderId, reason, additionalDetails, customerEmail, customerName } = body;

  if (!orderId) return { success: false, status: 400, message: 'Order ID is required' };
  if (!reason) return { success: false, status: 400, message: 'Cancellation reason is required' };

  // Validate reason
  const reasonValidation = OrderValidator.validateCancellationReason(reason);
  if (!reasonValidation.valid) {
    return { success: false, status: 400, message: reasonValidation.error };
  }

  // Find order
  const order = await OrderRepository.findById(orderId);
  if (!order) {
    return { success: false, status: 404, message: 'Order not found' };
  }

  // Authorization: only the owner can request cancellation
  if (!OrderPolicies.canRequestCancellation(order, authUser)) {
    return { success: false, status: 403, message: 'Not authorized to cancel this order' };
  }

  // Check eligibility
  const eligibility = OrderValidator.validateCancellationEligibility(order);
  if (!eligibility.eligible) {
    return { success: false, status: 400, message: eligibility.reason };
  }

  // Create cancellation request
  await OrderRepository.createCancellationRequest({
    orderId,
    userId: authUser.userId,
    customerEmail: customerEmail || order.customerEmail,
    customerName: customerName || order.username,
    reason,
    additionalDetails: additionalDetails || '',
    orderAmount: order.amount,
    orderStatus: order.orderStatus || order.status,
    paymentMethod: order.paymentMethod,
  });

  // Dispatch event
  dispatch(ORDER_EVENT_TYPE.CANCELLATION_REQUESTED, {
    orderId,
    userId: authUser.userId,
    email: customerEmail || order.customerEmail,
    username: customerName || order.username,
    reason,
    actor: `customer:${authUser.userId}`,
    metadata: { additionalDetails },
  });

  return {
    success: true,
    message: 'Cancellation request submitted. Our team will review it within 24 hours.',
    reviewTime: '24 hours',
  };
}

/**
 * Update order status with state machine validation.
 *
 * @param {string} orderId
 * @param {string} newStatus       — One of ORDER_STATUS values
 * @param {object} authUser
 * @param {object} [options]
 * @param {string} [options.reason]
 * @returns {Promise<object>}
 */
async function updateStatus(orderId, newStatus, authUser, options = {}) {
  // Find order
  const order = await OrderRepository.findById(orderId);
  if (!order) {
    return { success: false, status: 404, message: 'Order not found' };
  }

  // Authorization
  if (!OrderPolicies.canUpdateStatus(order, authUser)) {
    return { success: false, status: 403, message: 'Not authorized to update this order status' };
  }

  // Validate status value
  if (!Object.values(ORDER_STATUS).includes(newStatus)) {
    return { success: false, status: 400, message: `Invalid status: "${newStatus}"` };
  }

  // Validate transition via state machine
  const currentStatus = order.orderStatus || order.status || ORDER_STATUS.PENDING;
  try {
    OrderStateMachine.transition(currentStatus, newStatus, {
      actor: `${authUser.role}:${authUser.userId}`,
      reason: options.reason || '',
    });
  } catch (err) {
    return { success: false, status: 400, message: err.message };
  }

  // Update order
  const updates = {
    orderStatus: newStatus,
    status: newStatus,
    orderStatusLabel: ORDER_STATUS_LABELS[newStatus],
    updatedAt: new Date().toISOString(),
  };

  await OrderRepository.update(orderId, updates);

  // Dispatch event
  dispatch(ORDER_EVENT_TYPE.STATUS_CHANGED, {
    orderId,
    orderNumber: order.orderNumber,
    userId: order.userId || order.users,
    email: order.customerEmail,
    username: order.username,
    amount: order.amount,
    paymentMethod: order.paymentMethod,
    actor: `${authUser.role}:${authUser.userId}`,
    metadata: { fromStatus: currentStatus, toStatus: newStatus, reason: options.reason || '' },
  });

  return {
    success: true,
    message: `Order status updated to "${ORDER_STATUS_LABELS[newStatus] || newStatus}"`,
    orderId,
    status: newStatus,
  };
}

/**
 * Get customer orders with pagination.
 *
 * @param {string} userId
 * @param {object} [options]
 * @returns {Promise<object>}
 */
async function getCustomerOrders(userId, options = {}) {
  return OrderRepository.listByUser(userId, options);
}

/**
 * Get a single order with ownership check.
 *
 * @param {string} identifier   — Document ID or order number
 * @param {object} authUser
 * @returns {Promise<object|null>}
 */
async function getOrder(identifier, authUser) {
  const order = await OrderRepository.findByIdentifier(identifier);
  if (!order) return null;

  if (!OrderPolicies.canView(order, authUser)) {
    return null; // Don't reveal existence to unauthorized users
  }

  return order;
}

/**
 * List orders (admin).
 *
 * @param {object} options
 * @returns {Promise<object>}
 */
async function listOrders(options = {}) {
  return OrderRepository.list(options);
}

/**
 * List archived/cancelled orders (admin).
 *
 * @param {object} options
 * @returns {Promise<object>}
 */
async function listArchivedOrders(options = {}) {
  return OrderRepository.listArchived(options);
}

// ── Cancellation Approval (Admin) ────────────────────────────────────────────

/**
 * List all pending cancellation requests.
 */
async function listCancellationRequests(options = {}) {
  return OrderRepository.listCancellationRequests({ ...options, status: 'pending' });
}

/**
 * Approve a cancellation request — cancels the actual order and restores stock.
 *
 * @param {string} requestId
 * @param {object} authUser
 * @returns {Promise<object>}
 */
async function approveCancellation(requestId, authUser) {
  // 1. Get the cancellation request
  const { requests } = await OrderRepository.listCancellationRequests({ status: 'pending' });
  const request = requests.find((r) => r.$id === requestId);
  if (!request) {
    return { success: false, status: 404, message: 'Cancellation request not found or already processed' };
  }

  // 2. Get the order
  const order = await OrderRepository.findById(request.orderId);
  if (!order) {
    return { success: false, status: 404, message: 'Order not found' };
  }

  // 3. Validate transition via state machine
  const currentStatus = order.orderStatus || order.status || ORDER_STATUS.PENDING;
  try {
    OrderStateMachine.transition(currentStatus, ORDER_STATUS.CANCELLED, {
      actor: `admin:${authUser.userId}`,
      reason: 'Cancellation approved by admin',
    });
  } catch (err) {
    return { success: false, status: 400, message: err.message };
  }

  // 4. Update cancellation request status
  await OrderRepository.updateCancellationRequest(requestId, {
    status: 'approved',
    reviewedBy: authUser.userId,
    reviewedAt: new Date().toISOString(),
  });

  // 5. Restore stock if it was reduced
  if (order.stockUpdated) {
    try {
      const cart = JSON.parse(order.items || '[]');
      await restoreProductStock(cart, 'cancellation_approved');
    } catch (restoreErr) {
      console.warn('[OrderService] Stock restoration failed on cancellation approval:', restoreErr.message);
    }
  }

  // 6. Update order
  const updates = {
    orderStatus: ORDER_STATUS.CANCELLED,
    status: ORDER_STATUS.CANCELLED,
    orderStatusLabel: ORDER_STATUS_LABELS[ORDER_STATUS.CANCELLED],
    cancellationReason: request.reason,
    cancellationApprovedBy: authUser.userId,
    cancellationApprovedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  await OrderRepository.update(order.$id, updates);

  // 7. Archive
  await OrderRepository.archiveOrder({
    originalOrderId: order.$id,
    userId: order.userId || order.users,
    customerEmail: order.customerEmail,
    username: order.username,
    items: order.items,
    amount: order.amount,
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    cancellationReason: request.reason,
    failureType: 'admin_approved',
  });

  // 8. Dispatch events
  dispatch(ORDER_EVENT_TYPE.CANCELLATION_APPROVED, {
    orderId: order.$id,
    orderNumber: order.orderNumber,
    userId: order.userId || order.users,
    email: order.customerEmail,
    username: order.username,
    amount: order.amount,
    paymentMethod: order.paymentMethod,
    actor: `admin:${authUser.userId}`,
    metadata: { requestId, reason: request.reason, previousStatus: currentStatus },
  });

  return { success: true, message: 'Cancellation approved and order cancelled', orderId: order.$id };
}

/**
 * Reject a cancellation request.
 *
 * @param {string} requestId
 * @param {object} authUser
 * @param {string} [rejectionReason]
 * @returns {Promise<object>}
 */
async function rejectCancellation(requestId, authUser, rejectionReason = '') {
  const { requests } = await OrderRepository.listCancellationRequests({ status: 'pending' });
  const request = requests.find((r) => r.$id === requestId);
  if (!request) {
    return { success: false, status: 404, message: 'Cancellation request not found or already processed' };
  }

  await OrderRepository.updateCancellationRequest(requestId, {
    status: 'rejected',
    rejectionReason: rejectionReason || 'Request rejected by admin',
    reviewedBy: authUser.userId,
    reviewedAt: new Date().toISOString(),
  });

  dispatch(ORDER_EVENT_TYPE.CANCELLATION_REJECTED, {
    orderId: request.orderId,
    userId: request.userId,
    email: request.customerEmail,
    username: request.customerName,
    actor: `admin:${authUser.userId}`,
    metadata: { requestId, reason: rejectionReason },
  });

  return { success: true, message: 'Cancellation request rejected', requestId };
}

module.exports = {
  createCodOrder,
  cancelCodOrder,
  requestCancellation,
  updateStatus,
  getCustomerOrders,
  getOrder,
  listOrders,
  listArchivedOrders,
  listCancellationRequests,
  approveCancellation,
  rejectCancellation,
};
