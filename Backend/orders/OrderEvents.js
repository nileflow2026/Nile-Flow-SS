/**
 * OrderEvents — Event-driven notification and audit dispatch system.
 *
 * Every significant order action emits typed events that can trigger:
 * - In-app notifications
 * - Email notifications (via Resend / Appwrite Messaging)
 * - SMS notifications
 * - Push notifications
 * - Audit log entries
 *
 * This is the ONLY module that should call notification and audit services.
 * Adding a new channel (e.g. Slack, webhook) requires only a new handler here.
 *
 * @module orders/OrderEvents
 */

'use strict';

const { logAudit } = require('../utils/auditLogger');
const { env } = require('../src/env');
const { getOrderNotificationEvent } = require('../notifications/orderNotificationMapping');

// ── Handlers registry — extend by adding new channel handlers here ──────────

const handlers = {
  /**
   * Log to the audit trail.
   */
  audit: async (event, payload) => {
    try {
      await logAudit({
        action: event,
        performedBy: payload.actor || 'system',
        entityType: 'Order',
        entityId: payload.orderId || payload.orderNumber,
        details: {
          ...payload.metadata,
          event,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (err) {
      console.warn(`[OrderEvents] Audit log failed for ${event}:`, err.message);
    }
  },

  /**
   * Create an in-app notification for the user.
   */
  inApp: async (event, payload) => {
    const isHandledByNotificationService =
      env.PUSH_NOTIFICATIONS_V2_ENABLED === true &&
      Boolean(getOrderNotificationEvent(event, payload));
    if (isHandledByNotificationService) {
      return;
    }

    try {
      const { createNotification } = require('../controllers/UserControllers/Clientnotification');
      await createNotification({
        userId: payload.userId,
        message: payload.message || `Order event: ${event}`,
        type: 'order',
        username: payload.username || 'Customer',
        email: payload.email || '',
      });
    } catch (err) {
      console.warn(`[OrderEvents] In-app notification failed for ${event}:`, err.message);
    }
  },

  /**
   * Centralized Notification Service handler.
   * Replaces the old fragmented notification calls.
   * Dispatches customer, admin, and vendor notifications via NotificationService.
   */
  notificationService: async (event, payload) => {
    try {
      const NotificationService = require('../notifications/NotificationService');
      const notifEvent = getOrderNotificationEvent(event, payload);
      if (!notifEvent) return;

      if (
        event === 'order.cancellation_requested' ||
        event === 'order.cancellation_approved' ||
        event === 'order.cancellation_rejected'
      ) {
        const requestId = payload.metadata?.requestId || payload.orderId;
        await NotificationService.notifyUser(
          notifEvent,
          {
            orderId: payload.orderId,
            orderNumber: payload.orderNumber,
          },
          {
            userId: payload.userId,
            email: payload.email,
            username: payload.username,
          },
          `${requestId}:${event}:${payload.userId}`,
        );
        return;
      }

      // Build a minimal order-like object for NotificationService
      const order = {
        $id: payload.orderId,
        orderNumber: payload.orderNumber,
        username: payload.username,
        customerEmail: payload.email,
        customerPhone: payload.phone || '',
        userId: payload.userId,
        amount: payload.amount,
        paymentMethod: payload.paymentMethod,
        paymentStatus: payload.paymentStatus,
      };

      if (event === 'order.status_changed' || event === 'order.cancelled') {
        await NotificationService.notifyUser(
          notifEvent,
          order,
          {
            userId: payload.userId,
            email: payload.email,
            username: payload.username,
          },
          `${payload.orderId}:customer:${payload.userId}:${notifEvent}`,
        );
        return;
      }

      if (event === 'order.created') {
        const isPushV2Enabled = env.PUSH_NOTIFICATIONS_V2_ENABLED === true;
        await NotificationService.orderCreated(order, payload.cartItems || [], {
          notifyCustomer:
            !isPushV2Enabled || payload.paymentStatus !== 'succeeded',
        });
        if (isPushV2Enabled && payload.paymentStatus === 'succeeded') {
          await NotificationService.orderConfirmed(order);
        }
        return;
      }

      await NotificationService.orderCreated(order, payload.cartItems || []);
    } catch (err) {
      console.warn(`[OrderEvents] NotificationService handler error for ${event}:`, err.message);
    }
  },
};

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Dispatch an order event to all registered handlers.
 *
 * Handlers run asynchronously and independently — a failure in one handler
 * never blocks another or throws to the caller.
 *
 * @param {string} event   — One of ORDER_EVENT_TYPE values
 * @param {object} payload — Contextual data (orderId, userId, actor, etc.)
 */
function dispatch(event, payload) {
  if (!event || !payload) {
    console.warn('[OrderEvents] dispatch called without event or payload');
    return;
  }

  // Run all handlers asynchronously (fire-and-forget)
  Object.values(handlers).forEach((handler) => {
    setImmediate(() => {
      handler(event, payload).catch((err) => {
        console.warn(`[OrderEvents] Handler error for ${event}:`, err.message);
      });
    });
  });
}

/**
 * Register a custom handler function.
 * Useful for third-party integrations or channel-specific logic.
 *
 * @param {string} name    — Handler identifier
 * @param {Function} fn    — Async function (event, payload) => void
 */
function registerHandler(name, fn) {
  if (typeof fn !== 'function') throw new Error('Handler must be a function');
  handlers[name] = fn;
}

module.exports = {
  dispatch,
  registerHandler,
};
