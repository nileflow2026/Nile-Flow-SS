/**
 * Nile Flow — Notification Queue Worker
 *
 * Processes jobs from the nf-notifications queue.
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
const { sendQueuedPush } = require("../../../services/pushNotificationService");
const {
  processAutomaticPush,
  recoverPendingReceipts,
} = require("../../../services/automaticPushService");
const {
  processCampaignDelivery,
  processCampaignPage,
  pruneExpiredPushDetails,
  recoverCampaigns,
} = require("../../../services/pushBroadcastService");

const CONCURRENCY = 5;

const notificationRepository = new NotificationRepository(instrumentedDb);

const worker = new Worker(
  "nf-notifications",
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

      case "expo-push": {
        const outcome = await sendQueuedPush(payload);
        logger.info("Expo push processed", {
          meta: {
            userId: payload.userId,
            status: outcome.status,
            reason: outcome.reason,
          },
        });
        return outcome;
      }

      case "automatic-event-push": {
        const outcome = await processAutomaticPush(
          payload.receiptId,
          sendQueuedPush,
        );
        logger.info("Automatic event push processed", {
          meta: {
            receiptId: payload.receiptId,
            status: outcome.status,
            reason: outcome.reason,
          },
        });
        return outcome;
      }

      case "recover-automatic-pushes": {
        const recovered = await recoverPendingReceipts();
        logger.info("Automatic push recovery scan completed", {
          meta: { recovered },
        });
        return { recovered };
      }

      case "push-broadcast-page": {
        const outcome = await processCampaignPage(payload.campaignId);
        logger.info("Push broadcast audience page processed", {
          meta: { campaignId: payload.campaignId, status: outcome.status },
        });
        return outcome;
      }

      case "push-broadcast-delivery": {
        const outcome = await processCampaignDelivery(
          payload.deliveryId,
          job.attemptsMade,
        );
        logger.info("Push broadcast delivery processed", {
          meta: { deliveryId: payload.deliveryId, status: outcome?.status },
        });
        return outcome;
      }

      case "recover-push-broadcasts": {
        const recovered = await recoverCampaigns();
        logger.info("Push broadcast recovery scan completed", {
          meta: { recovered },
        });
        return { recovered };
      }

      case "prune-push-details": {
        const deleted = await pruneExpiredPushDetails();
        logger.info("Expired push details pruned", { meta: deleted });
        return deleted;
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

if (env.PUSH_NOTIFICATIONS_V2_ENABLED === true) {
  const { notificationsQueue } = require("../queues");
  notificationsQueue
    .upsertJobScheduler(
      "automatic-push-recovery",
      { every: 30000 },
      {
        name: "recover-automatic-pushes",
        data: { type: "recover-automatic-pushes", payload: {} },
        opts: {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: { count: 10 },
          removeOnFail: { count: 50 },
        },
      },
    )
    .catch((error) => {
      logger.error("Could not schedule automatic push recovery", {
        meta: { error: error.message },
      });
    });
  notificationsQueue
    .upsertJobScheduler(
      "push-broadcast-recovery",
      { every: 30000 },
      {
        name: "recover-push-broadcasts",
        data: { type: "recover-push-broadcasts", payload: {} },
        opts: {
          attempts: 3,
          backoff: { type: "exponential", delay: 1000 },
          removeOnComplete: { count: 10 },
          removeOnFail: { count: 50 },
        },
      },
    )
    .catch((error) => {
      logger.error("Could not schedule push broadcast recovery", {
        meta: { error: error.message },
      });
    });
  notificationsQueue
    .upsertJobScheduler(
      "push-detail-retention",
      { every: 24 * 60 * 60 * 1000 },
      {
        name: "prune-push-details",
        data: { type: "prune-push-details", payload: {} },
        opts: {
          attempts: 3,
          backoff: { type: "exponential", delay: 60000 },
          removeOnComplete: { count: 10 },
          removeOnFail: { count: 50 },
        },
      },
    )
    .catch((error) => {
      logger.error("Could not schedule push detail retention", {
        meta: { error: error.message },
      });
    });
}

module.exports = worker;
