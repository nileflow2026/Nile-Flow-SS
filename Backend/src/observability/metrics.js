"use strict";

/**
 * Nile Flow — Prometheus Metrics Registry
 *
 * Central Prometheus registry. All metrics across the backend are defined
 * here so they appear in a single /metrics scrape endpoint.
 *
 * Metrics are grouped by domain:
 *   - HTTP requests (latency, throughput, errors)
 *   - Appwrite operations (read/write amplification tracking)
 *   - Cache (hit/miss/error)
 *   - Queue (enqueued, completed, failed, processing time)
 *   - Payment (success, failure, latency)
 *   - AI (requests, latency, cost estimation)
 *   - Realtime (subscription counts)
 */

const client = require("prom-client");

// ── Registry ─────────────────────────────────────────────────────────────────

const registry = new client.Registry();

// Collect default Node.js process metrics (CPU, memory, event loop lag, etc.)
client.collectDefaultMetrics({ register: registry, prefix: "nf_node_" });

// ── HTTP Metrics ──────────────────────────────────────────────────────────────

const httpRequestDuration = new client.Histogram({
  name: "nf_http_request_duration_seconds",
  help: "HTTP request duration in seconds",
  labelNames: ["method", "route", "status_code"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
  registers: [registry],
});

const httpRequestTotal = new client.Counter({
  name: "nf_http_requests_total",
  help: "Total number of HTTP requests",
  labelNames: ["method", "route", "status_code"],
  registers: [registry],
});

const httpErrorsTotal = new client.Counter({
  name: "nf_http_errors_total",
  help: "Total number of HTTP errors (4xx/5xx)",
  labelNames: ["method", "route", "status_code"],
  registers: [registry],
});

const httpRequestsInFlight = new client.Gauge({
  name: "nf_http_requests_in_flight",
  help: "Number of HTTP requests currently being processed",
  registers: [registry],
});

// ── Appwrite Metrics ──────────────────────────────────────────────────────────

const appwriteReadsTotal = new client.Counter({
  name: "nf_appwrite_reads_total",
  help: "Total Appwrite listDocuments/getDocument calls",
  labelNames: ["collection", "operation"],
  registers: [registry],
});

const appwriteWritesTotal = new client.Counter({
  name: "nf_appwrite_writes_total",
  help: "Total Appwrite createDocument/updateDocument calls",
  labelNames: ["collection", "operation"],
  registers: [registry],
});

const appwriteErrorsTotal = new client.Counter({
  name: "nf_appwrite_errors_total",
  help: "Total Appwrite operation errors",
  labelNames: ["collection", "operation"],
  registers: [registry],
});

const appwriteOperationDuration = new client.Histogram({
  name: "nf_appwrite_operation_duration_seconds",
  help: "Appwrite operation duration in seconds",
  labelNames: ["collection", "operation"],
  buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
  registers: [registry],
});

const appwriteRealtimeSubscriptions = new client.Gauge({
  name: "nf_appwrite_realtime_subscriptions",
  help: "Current number of active Appwrite realtime subscriptions",
  registers: [registry],
});

// ── Cache Metrics ─────────────────────────────────────────────────────────────

const cacheHitsTotal = new client.Counter({
  name: "nf_cache_hits_total",
  help: "Total Redis cache hits",
  labelNames: ["key_prefix"],
  registers: [registry],
});

const cacheMissesTotal = new client.Counter({
  name: "nf_cache_misses_total",
  help: "Total Redis cache misses",
  labelNames: ["key_prefix"],
  registers: [registry],
});

const cacheErrorsTotal = new client.Counter({
  name: "nf_cache_errors_total",
  help: "Total Redis cache operation errors",
  registers: [registry],
});

const cacheOperationDuration = new client.Histogram({
  name: "nf_cache_operation_duration_seconds",
  help: "Redis operation duration in seconds",
  labelNames: ["operation"],
  buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25],
  registers: [registry],
});

// ── Queue Metrics ─────────────────────────────────────────────────────────────

const queueJobsEnqueued = new client.Counter({
  name: "nf_queue_jobs_enqueued_total",
  help: "Total jobs enqueued",
  labelNames: ["queue"],
  registers: [registry],
});

const queueJobsCompleted = new client.Counter({
  name: "nf_queue_jobs_completed_total",
  help: "Total jobs completed successfully",
  labelNames: ["queue"],
  registers: [registry],
});

const queueJobsFailed = new client.Counter({
  name: "nf_queue_jobs_failed_total",
  help: "Total jobs failed",
  labelNames: ["queue"],
  registers: [registry],
});

const queueJobProcessingDuration = new client.Histogram({
  name: "nf_queue_job_processing_seconds",
  help: "Queue job processing duration in seconds",
  labelNames: ["queue", "job_type"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30, 60],
  registers: [registry],
});

const queueDepth = new client.Gauge({
  name: "nf_queue_depth",
  help: "Current number of waiting jobs in queue",
  labelNames: ["queue"],
  registers: [registry],
});

// ── Payment Metrics ───────────────────────────────────────────────────────────

const paymentAttemptsTotal = new client.Counter({
  name: "nf_payment_attempts_total",
  help: "Total payment attempts",
  labelNames: ["provider", "status"],
  registers: [registry],
});

const paymentProcessingDuration = new client.Histogram({
  name: "nf_payment_processing_seconds",
  help: "Payment processing duration in seconds",
  labelNames: ["provider"],
  buckets: [0.5, 1, 2, 5, 10, 30, 60],
  registers: [registry],
});

const paymentAmountTotal = new client.Counter({
  name: "nf_payment_amount_kes_total",
  help: "Total payment volume in KES",
  labelNames: ["provider"],
  registers: [registry],
});

// ── AI Commerce Metrics ───────────────────────────────────────────────────────

const aiRequestsTotal = new client.Counter({
  name: "nf_ai_requests_total",
  help: "Total AI API requests",
  labelNames: ["operation"],
  registers: [registry],
});

const aiRequestDuration = new client.Histogram({
  name: "nf_ai_request_duration_seconds",
  help: "AI API request duration in seconds",
  labelNames: ["operation"],
  buckets: [0.5, 1, 2, 5, 10, 30],
  registers: [registry],
});

const aiTokensUsed = new client.Counter({
  name: "nf_ai_tokens_used_total",
  help: "Total OpenAI tokens consumed",
  labelNames: ["model", "operation"],
  registers: [registry],
});

// ── Loyalty Metrics ───────────────────────────────────────────────────────────

const nileMilesAwarded = new client.Counter({
  name: "nf_nile_miles_awarded_total",
  help: "Total Nile Miles awarded",
  registers: [registry],
});

const nileMilesRedeemed = new client.Counter({
  name: "nf_nile_miles_redeemed_total",
  help: "Total Nile Miles redeemed",
  registers: [registry],
});

// ── Commerce Metrics ──────────────────────────────────────────────────────────

const ordersTotal = new client.Counter({
  name: "nf_orders_total",
  help: "Total orders created",
  labelNames: ["status"],
  registers: [registry],
});

const cartCheckoutsTotal = new client.Counter({
  name: "nf_cart_checkouts_total",
  help: "Total checkout attempts",
  registers: [registry],
});

const premiumSubscriptionsActive = new client.Gauge({
  name: "nf_premium_subscriptions_active",
  help: "Current number of active premium subscriptions",
  registers: [registry],
});

// ── Release Intelligence Metrics ──────────────────────────────────────────────

const releaseInfo = new client.Gauge({
  name: "nf_release_info",
  help: "Release deployment metadata (set to timestamp when deployed)",
  labelNames: ["sha", "branch", "channel", "runtime_version"],
  registers: [registry],
});

// ── Rate Limiting Metrics ─────────────────────────────────────────────────────

const rateLimitHitsTotal = new client.Counter({
  name: "nf_rate_limit_hits_total",
  help: "Total requests blocked by rate limiting",
  labelNames: ["route_group"],
  registers: [registry],
});

// ── Exports ───────────────────────────────────────────────────────────────────

module.exports = {
  registry,
  metrics: {
    // HTTP
    httpRequestDuration,
    httpRequestTotal,
    httpErrorsTotal,
    httpRequestsInFlight,
    // Appwrite
    appwriteReadsTotal,
    appwriteWritesTotal,
    appwriteErrorsTotal,
    appwriteOperationDuration,
    appwriteRealtimeSubscriptions,
    // Cache
    cacheHitsTotal,
    cacheMissesTotal,
    cacheErrorsTotal,
    cacheOperationDuration,
    // Queue
    queueJobsEnqueued,
    queueJobsCompleted,
    queueJobsFailed,
    queueJobProcessingDuration,
    queueDepth,
    // Payment
    paymentAttemptsTotal,
    paymentProcessingDuration,
    paymentAmountTotal,
    // AI
    aiRequestsTotal,
    aiRequestDuration,
    aiTokensUsed,
    // Loyalty
    nileMilesAwarded,
    nileMilesRedeemed,
    // Commerce
    ordersTotal,
    cartCheckoutsTotal,
    premiumSubscriptionsActive,
    // Release
    releaseInfo,
    // Load
    rateLimitHitsTotal,
  },
};
