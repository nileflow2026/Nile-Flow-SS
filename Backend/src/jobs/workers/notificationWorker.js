/**
 * Nile Flow — Notification Queue Worker
 *
 * Processes jobs from the nf:notifications queue.
 *
 * Job types:
 *   - in-app       Store notification document in Appwrite
 *   - push         Send FCM push via notificationService
 *   - batch        Multiple recipients (e.g. order shipped → vendor + buyer)
 *
 * Idempotency: job IDs should be set by the producer when the notification
 * is tied to a specific event (e.g. `order:${orderId}:shipped`) to prevent
 * duplicate delivery on retries.
 */

"use strict";

const { Worker } = require("bullmq");
const { connection } = require("../queues");
const { logger } = require("../../lib/logger");
const { instrumentedDb } = require("../../../services/appwriteService");
const { env } = require("../../env");
const NotificationRepository = require("../../data/repositories/notificationRepository");

const CONCURRENCY = 5;

const notificationRepository = new NotificationRepository(instrumentedDb);

const worker = new Worker(
  "nf:notifications",
  async (job) => {
    const { type, payload } = job.data;

    logger.info("Processing notification job", {
      meta: { jobId: job.id, type, jobName: job.name },
    });

    switch (type) {
      case "in-app": {
        const {
          userId,
          message,
          title,
          notificationType,
          metadata = {},
        } = payload;
        if (!userId || !message) {
          throw new Error("in-app notification missing userId or message");
        }

        await notificationRepository.createNotification({
          userId,
          message,
          title,
          notificationType,
          metadata,
        });

        logger.info("In-app notification created", {
          meta: { userId, notificationType },
        });
        break;
      }

      case "batch": {
        const { recipients, message, title, notificationType } = payload;
        if (!Array.isArray(recipients) || recipients.length === 0) {
          throw new Error("batch notification missing recipients");
        }

        // Process recipients in parallel (up to 10 at a time)
        const chunks = [];
        for (let i = 0; i < recipients.length; i += 10) {
          chunks.push(recipients.slice(i, i + 10));
        }

        for (const chunk of chunks) {
          await Promise.allSettled(
            chunk.map((userId) =>
            notificationRepository.createNotification({
              userId,
              message,
              title,
              notificationType,
              metadata: {},
            }),
          ),
          );
        }

        logger.info("Batch notifications created", {
          meta: { count: recipients.length, notificationType },
        });
        break;
      }

      default:
        logger.warn("Unknown notification job type", { meta: { type } });
    }
  },
  {
    connection,
    concurrency: CONCURRENCY,
  },
);

worker.on("failed", (job, err) => {
  logger.error("Notification job failed", {
    meta: { jobId: job?.id, error: err.message, attempts: job?.attemptsMade },
  });
});

worker.on("error", (err) => {
  logger.error("Notification worker error", { meta: { error: err.message } });
});

logger.info("Notification worker started", {
  meta: { concurrency: CONCURRENCY },
});

module.exports = worker;
