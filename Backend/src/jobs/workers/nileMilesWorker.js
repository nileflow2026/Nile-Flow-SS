/**
 * Nile Flow — Nile Miles Queue Worker
 *
 * Calculates and awards Nile Miles after an order is confirmed paid.
 * This offloads the calculation from the synchronous checkout path.
 *
 * Idempotency:
 *   The producer MUST set jobId = `miles:${orderId}` so that duplicate
 *   order-complete events (e.g. webhook retry) do not double-award miles.
 *
 * Formula (mirrors AGENTS.md spec):
 *   baseMiles = Math.floor(orderTotal / 10)
 *   if isPremium: totalMiles = baseMiles * 2
 *   else:         totalMiles = baseMiles
 */

"use strict";

const { Worker } = require("bullmq");
const { connection } = require("../queues");
const { logger, auditLogger } = require("../../lib/logger");
const { db, users } = require("../../../services/appwriteService");
const { env } = require("../../env");

const worker = new Worker(
  "nf-miles",
  async (job) => {
    const { orderId, userId, orderTotal, isPremium = false } = job.data;

    if (!orderId || !userId || orderTotal == null) {
      throw new Error(
        `nileMilesWorker: missing required fields — orderId:${orderId} userId:${userId} orderTotal:${orderTotal}`,
      );
    }

    logger.info("Processing Nile Miles award", {
      meta: { jobId: job.id, orderId, userId, orderTotal, isPremium },
    });

    const baseMiles = Math.floor(orderTotal / 10);
    const totalMiles = isPremium ? baseMiles * 2 : baseMiles;
    const bonusMiles = totalMiles - baseMiles;

    if (totalMiles <= 0) {
      logger.info("No miles to award (order total too low)", {
        meta: { orderId, orderTotal },
      });
      return { awarded: 0 };
    }

    // Fetch current preferences to get existing miles balance
    let currentPrefs = {};
    try {
      const userPrefs = await users.getPrefs(userId);
      currentPrefs = userPrefs || {};
    } catch {
      // User prefs may not exist yet — start at zero
    }

    const currentMiles = parseInt(currentPrefs.nileMiles || "0", 10);
    const newBalance = currentMiles + totalMiles;

    // Update user prefs with new miles balance
    await users.updatePrefs(userId, {
      ...currentPrefs,
      nileMiles: String(newBalance),
      lastMilesAwardedAt: new Date().toISOString(),
      lastMilesAwardedOrderId: orderId,
    });

    // Emit financial audit record
    auditLogger.info("Nile Miles awarded", {
      event: "MILES_AWARDED",
      orderId,
      userId,
      orderTotal,
      baseMiles,
      bonusMiles,
      totalMiles,
      newBalance,
      isPremium,
      timestamp: new Date().toISOString(),
    });

    logger.info("Nile Miles awarded successfully", {
      meta: { userId, orderId, totalMiles, newBalance },
    });

    return { awarded: totalMiles, balance: newBalance };
  },
  {
    connection,
    concurrency: 10,
    // Ensure idempotency: if a job with the same ID is already processing,
    // skip it. Producer sets jobId = `miles:${orderId}`.
  },
);

worker.on("failed", (job, err) => {
  logger.error("Nile Miles job failed", {
    meta: { jobId: job?.id, error: err.message, attempts: job?.attemptsMade },
  });
});

worker.on("error", (err) => {
  logger.error("Nile Miles worker error", { meta: { error: err.message } });
});

logger.info("Nile Miles worker started");

module.exports = worker;
