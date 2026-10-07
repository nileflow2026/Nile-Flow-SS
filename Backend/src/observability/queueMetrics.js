"use strict";

/**
 * Nile Flow — Queue Metrics Collector
 *
 * Periodically polls BullMQ queue stats and updates Prometheus gauges.
 * This runs as a background poller — not middleware.
 *
 * Usage:
 *   const { startQueueMetricsPoller } = require('./queueMetrics');
 *   startQueueMetricsPoller(); // call once at server startup
 *
 * Metrics updated:
 *   - nf_queue_depth (per queue) — waiting jobs
 *   - nf_queue_jobs_* counters are updated by workers directly
 */

const { metrics } = require("./metrics");

// Lazy import — queues may not be available if BullMQ isn't installed
let queues;
const getQueues = () => {
  if (!queues) {
    try {
      queues = require("../jobs/queues/index");
    } catch {
      queues = null;
    }
  }
  return queues;
};

const QUEUE_NAMES = [
  "nf-notifications",
  "nf-emails",
  "nf-miles",
  "nf-analytics",
  "nf-ai-logging",
  "nf-order-events",
  "nf-payment-reconciliation",
  "nf-webhook-retry",
  "nf-fraud-check",
  "nf-recommendations",
];

const pollQueueMetrics = async () => {
  const qs = getQueues();
  if (!qs) return;

  await Promise.allSettled(
    QUEUE_NAMES.map(async (name) => {
      try {
        const q = qs.queues[name];
        if (!q) return;
        const waiting = await q.getWaitingCount();
        metrics.queueDepth.set({ queue: name }, waiting);
      } catch {
        // Non-critical — metrics gap is acceptable
      }
    }),
  );
};

let pollInterval = null;

const startQueueMetricsPoller = (intervalMs = 15000) => {
  if (pollInterval) return; // Already started
  pollInterval = setInterval(pollQueueMetrics, intervalMs);
  pollInterval.unref(); // Don't keep process alive just for metrics
  console.log(
    `✅ Queue metrics poller started (interval: ${intervalMs / 1000}s)`,
  );
};

const stopQueueMetricsPoller = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
};

/**
 * Helpers for workers to call directly — increment job lifecycle counters.
 */
const recordJobEnqueued = (queueName) => {
  metrics.queueJobsEnqueued.inc({ queue: queueName });
};

const recordJobCompleted = (queueName, durationSec, jobType = "default") => {
  metrics.queueJobsCompleted.inc({ queue: queueName });
  metrics.queueJobProcessingDuration.observe(
    { queue: queueName, job_type: jobType },
    durationSec,
  );
};

const recordJobFailed = (queueName) => {
  metrics.queueJobsFailed.inc({ queue: queueName });
};

module.exports = {
  startQueueMetricsPoller,
  stopQueueMetricsPoller,
  recordJobEnqueued,
  recordJobCompleted,
  recordJobFailed,
};
