"use strict";

/**
 * Nile Flow — HTTP Request Metrics Middleware
 *
 * Tracks:
 *   - Request duration histogram (per route + method + status)
 *   - Request throughput counter
 *   - Error counter (4xx/5xx)
 *   - In-flight request gauge
 *
 * Route normalization: strips dynamic segments (:id, UUIDs, numbers)
 * so cardinality stays bounded. E.g.:
 *   /api/orders/abc123 → /api/orders/:id
 *   /api/products/456  → /api/products/:id
 *
 * Mount BEFORE all routes in index.js:
 *   app.use(requestMetricsMiddleware);
 */

const { metrics } = require("./metrics");

// Normalize a route path — collapse dynamic segments to :id
const normalizeRoute = (path) => {
  if (!path || typeof path !== "string") return "unknown";

  return (
    path
      // UUID pattern
      .replace(
        /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi,
        ":id",
      )
      // Appwrite document IDs (alphanumeric, ~20 chars)
      .replace(/\/[a-zA-Z0-9]{20,}\b/g, "/:id")
      // Pure numbers in path segments
      .replace(/\/\d+\b/g, "/:id")
      // Stripe session IDs, M-Pesa request IDs
      .replace(/\/cs_[a-zA-Z0-9_]+/g, "/:session_id")
      .replace(/\/ck[a-zA-Z0-9_]*/g, "/:checkout_id")
      // Truncate to 100 chars to stay within Prometheus label limits
      .substring(0, 100)
  );
};

const requestMetricsMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();
  metrics.httpRequestsInFlight.inc();

  const cleanup = () => {
    metrics.httpRequestsInFlight.dec();

    const durationNs = process.hrtime.bigint() - start;
    const durationSec = Number(durationNs) / 1e9;

    const route = normalizeRoute(req.path);
    const method = req.method;
    const statusCode = String(res.statusCode);

    metrics.httpRequestDuration.observe(
      { method, route, status_code: statusCode },
      durationSec,
    );

    metrics.httpRequestTotal.inc({ method, route, status_code: statusCode });

    if (res.statusCode >= 400) {
      metrics.httpErrorsTotal.inc({ method, route, status_code: statusCode });
    }
  };

  // Hook into response completion — works for all response types
  res.on("finish", cleanup);
  res.on("close", () => {
    // Connection closed before response finished (client disconnect)
    metrics.httpRequestsInFlight.dec();
  });

  next();
};

module.exports = { requestMetricsMiddleware, normalizeRoute };
