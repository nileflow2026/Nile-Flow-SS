/**
 * Nile Flow — BullMQ Queue Definitions
 *
 * All queues in one place. Each queue is backed by the same Redis connection.
 * Workers live in ../workers/ — one file per queue.
 *
 * Queue naming convention:
 *   nf:<domain>  e.g.  nf:notifications, nf:miles, nf:emails
 *
 * Default job options enforce:
 *   - Exponential back-off retry (up to 3 attempts)
 *   - 30-second job timeout (prevents hung jobs)
 *   - Completed jobs removed after 100 kept (prevents Redis bloat)
 *   - Failed jobs kept for 500 for audit / debugging
 */

"use strict";

const { Queue, QueueEvents } = require("bullmq");
const { logger } = require("../../lib/logger");

// ── Shared Redis connection config ───────────────────────────────────────────

const redisUrl = process.env.REDIS_URL;
const nodeEnv = process.env.NODE_ENV || "development";

// BullMQ requires a separate connection from the cache client
// because it sets blocking commands that conflict with regular key ops.
let connection;
if (redisUrl) {
  const IORedis = require("ioredis");
  connection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    tls: redisUrl.startsWith("rediss://") ? {} : undefined,
  });
} else {
  // In-memory stub — queues will process but not survive restarts.
  // Acceptable for development; real Redis REQUIRED in production.
  const warningMsg = nodeEnv === "production" 
    ? "⚠️  CRITICAL: REDIS_URL not set in production! BullMQ using in-memory mode. Queues will NOT survive restarts. Set REDIS_URL=redis://... in production .env"
    : "⚠️  REDIS_URL not set — BullMQ using in-memory mode. Queues will not survive restarts. For production, set REDIS_URL in .env";
  
  logger.warn(warningMsg);
  
  const IORedis = require("ioredis");
  connection = new IORedis({
    host: "127.0.0.1",
    port: 6379,
    maxRetriesPerRequest: null,
    enableReadyCheck: false,
    lazyConnect: true,
  });
}

// ── Default job options ──────────────────────────────────────────────────────

const DEFAULT_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential", delay: 2000 },
  removeOnComplete: { count: 100 },
  removeOnFail: { count: 500 },
};

// ── Queue factory ────────────────────────────────────────────────────────────

function makeQueue(name, overrides = {}) {
  return new Queue(name, {
    connection,
    defaultJobOptions: { ...DEFAULT_JOB_OPTIONS, ...overrides },
  });
}

// ── Queue definitions ────────────────────────────────────────────────────────

/**
 * Notification dispatch — in-app, push, and realtime events.
 * Priority: high (users expect near-instant delivery).
 */
const notificationsQueue = makeQueue("nf:notifications", {
  attempts: 5,
  backoff: { type: "exponential", delay: 1000 },
});

/**
 * Email dispatch — order confirmations, subscription receipts, password reset.
 * Priority: medium (seconds to minutes acceptable).
 */
const emailQueue = makeQueue("nf:emails", {
  attempts: 5,
  backoff: { type: "exponential", delay: 3000 },
});

/**
 * Nile Miles calculation — runs after order completion.
 * Idempotency required: processing the same order twice must not double-award.
 */
const nileMilesQueue = makeQueue("nf:miles");

/**
 * Analytics event aggregation — non-critical, can be slow.
 * Low priority, high throughput.
 */
const analyticsQueue = makeQueue("nf:analytics", {
  attempts: 2,
  removeOnComplete: { count: 50 },
});

/**
 * AI interaction logging — stores conversation context for recommendation
 * system and future personalization.
 */
const aiLoggingQueue = makeQueue("nf:ai-logging", {
  attempts: 2,
  removeOnComplete: { count: 50 },
});

/**
 * Order event processing — status changes, inventory updates, vendor
 * notifications.  Runs serially per order (concurrency = 1 per worker).
 */
const orderEventsQueue = makeQueue("nf:order-events", {
  attempts: 5,
  backoff: { type: "exponential", delay: 2000 },
});

/**
 * Payment reconciliation — matches Stripe/M-Pesa webhook events to orders.
 * Financial operation: idempotency enforced by job ID = payment reference.
 */
const paymentReconciliationQueue = makeQueue("nf:payment-reconciliation", {
  attempts: 10,
  backoff: { type: "exponential", delay: 5000 },
  removeOnFail: { count: 1000 }, // keep failed payment jobs longer for audit
});

/**
 * Webhook retry — re-sends failed outbound webhooks to vendor/partner systems.
 */
const webhookRetryQueue = makeQueue("nf:webhook-retry", {
  attempts: 7,
  backoff: { type: "exponential", delay: 10000 },
});

/**
 * Fraud check — async risk scoring for new orders and payment events.
 */
const fraudCheckQueue = makeQueue("nf:fraud-check");

/**
 * Recommendation generation — periodic re-scoring of user affinity models.
 */
const recommendationsQueue = makeQueue("nf:recommendations", {
  attempts: 2,
  removeOnComplete: { count: 20 },
});

// ── Queue events for observability ──────────────────────────────────────────

function wireQueueEvents(queueName) {
  const events = new QueueEvents(queueName, { connection });

  events.on("completed", ({ jobId }) => {
    logger.debug("Job completed", { meta: { queue: queueName, jobId } });
  });

  events.on("failed", ({ jobId, failedReason }) => {
    logger.error("Job failed", {
      meta: { queue: queueName, jobId, failedReason },
    });
  });

  events.on("stalled", ({ jobId }) => {
    logger.warn("Job stalled", { meta: { queue: queueName, jobId } });
  });

  return events;
}

// Wire events only if not in test environment to avoid open handles
if (process.env.NODE_ENV !== "test") {
  wireQueueEvents("nf:notifications");
  wireQueueEvents("nf:emails");
  wireQueueEvents("nf:order-events");
  wireQueueEvents("nf:payment-reconciliation");
}

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  connection,
  notificationsQueue,
  emailQueue,
  nileMilesQueue,
  analyticsQueue,
  aiLoggingQueue,
  orderEventsQueue,
  paymentReconciliationQueue,
  webhookRetryQueue,
  fraudCheckQueue,
  recommendationsQueue,
};
