/**
 * Nile Flow — Order Events Queue Worker
 *
 * Handles asynchronous side-effects triggered by order status changes:
 *   - order.created    → fraud check, inventory reserve, notify vendor
 *   - order.paid       → award miles, vendor payout queue, notify buyer
 *   - order.shipped    → notify buyer, update tracking
 *   - order.delivered  → award miles confirmation, request review
 *   - order.cancelled  → release inventory, initiate refund flow
 *
 * The synchronous request path only persists the order and returns.
 * Everything else flows through this worker.
 */

"use strict";

const { Worker } = require("bullmq");
const {
  connection,
  nileMilesQueue,
  notificationsQueue,
  fraudCheckQueue,
} = require("../queues");
const { logger, auditLogger } = require("../../lib/logger");

const CONCURRENCY = 3; // Low: order operations must be carefully serialised

const worker = new Worker(
  "nf:order-events",
  async (job) => {
    const { event, order } = job.data;

    if (!event || !order) {
      throw new Error("orderEventsWorker: missing event or order payload");
    }

    logger.info("Processing order event", {
      meta: { jobId: job.id, event, orderId: order.orderId || order.$id },
    });

    switch (event) {
      case "order.created": {
        // 1. Queue fraud check (non-blocking to checkout)
        await fraudCheckQueue.add(
          `fraud:${order.$id}`,
          { orderId: order.$id, userId: order.userId, amount: order.total },
          { jobId: `fraud:${order.$id}` },
        );

        // 2. Notify vendor of new order
        if (order.vendorId) {
          await notificationsQueue.add(
            "vendor-new-order",
            {
              type: "in-app",
              payload: {
                userId: order.vendorId,
                title: "New Order Received",
                message: `Order #${order.orderId} received — KSH ${order.total}`,
                notificationType: "order_received",
                metadata: { orderId: order.$id },
              },
            },
            { jobId: `notify:vendor:${order.$id}:created` },
          );
        }

        auditLogger.info("Order created event processed", {
          event: "ORDER_CREATED",
          orderId: order.$id,
          userId: order.userId,
          amount: order.total,
          timestamp: new Date().toISOString(),
        });
        break;
      }

      case "order.paid": {
        // 1. Award Nile Miles
        await nileMilesQueue.add(
          `miles:${order.$id}`,
          {
            orderId: order.$id,
            userId: order.userId,
            orderTotal: order.total,
            isPremium: order.isPremiumOrder || false,
          },
          { jobId: `miles:${order.$id}` }, // idempotent
        );

        // 2. Notify buyer
        await notificationsQueue.add(
          "buyer-payment-confirmed",
          {
            type: "in-app",
            payload: {
              userId: order.userId,
              title: "Payment Confirmed",
              message: `Your order #${order.orderId} has been paid successfully.`,
              notificationType: "payment_processed",
              metadata: { orderId: order.$id },
            },
          },
          { jobId: `notify:buyer:${order.$id}:paid` },
        );

        auditLogger.info("Order paid event processed", {
          event: "ORDER_PAID",
          orderId: order.$id,
          userId: order.userId,
          amount: order.total,
          isPremium: order.isPremiumOrder,
          timestamp: new Date().toISOString(),
        });
        break;
      }

      case "order.shipped": {
        await notificationsQueue.add(
          "buyer-order-shipped",
          {
            type: "in-app",
            payload: {
              userId: order.userId,
              title: "Order Shipped",
              message: `Your order #${order.orderId} is on its way!`,
              notificationType: "order_shipped",
              metadata: { orderId: order.$id, trackingId: order.trackingId },
            },
          },
          { jobId: `notify:buyer:${order.$id}:shipped` },
        );
        break;
      }

      case "order.delivered": {
        // Request review 1 hour after delivery (via delayed job)
        await notificationsQueue.add(
          "buyer-review-request",
          {
            type: "in-app",
            payload: {
              userId: order.userId,
              title: "How was your order?",
              message: `Rate your experience with order #${order.orderId}`,
              notificationType: "review_request",
              metadata: { orderId: order.$id },
            },
          },
          {
            jobId: `notify:buyer:${order.$id}:review`,
            delay: 60 * 60 * 1000, // 1 hour delay
          },
        );
        break;
      }

      case "order.cancelled": {
        auditLogger.info("Order cancellation event processed", {
          event: "ORDER_CANCELLED",
          orderId: order.$id,
          userId: order.userId,
          reason: order.cancelReason,
          timestamp: new Date().toISOString(),
        });

        // Notify buyer
        await notificationsQueue.add(
          "buyer-order-cancelled",
          {
            type: "in-app",
            payload: {
              userId: order.userId,
              title: "Order Cancelled",
              message: `Your order #${order.orderId} has been cancelled.`,
              notificationType: "order_cancelled",
              metadata: { orderId: order.$id },
            },
          },
          { jobId: `notify:buyer:${order.$id}:cancelled` },
        );
        break;
      }

      default:
        logger.warn("Unknown order event type", { meta: { event } });
    }
  },
  {
    connection,
    concurrency: CONCURRENCY,
  },
);

worker.on("failed", (job, err) => {
  logger.error("Order event job failed", {
    meta: { jobId: job?.id, error: err.message, attempts: job?.attemptsMade },
  });
});

worker.on("error", (err) => {
  logger.error("Order events worker error", { meta: { error: err.message } });
});

logger.info("Order events worker started", {
  meta: { concurrency: CONCURRENCY },
});

module.exports = worker;
