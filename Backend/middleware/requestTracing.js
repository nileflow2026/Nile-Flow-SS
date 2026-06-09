/**
 * Nile Flow — Request Tracing Middleware
 *
 * Attaches a correlation ID to every incoming request and stores it in
 * AsyncLocalStorage so all log calls within that request's async chain
 * automatically include the ID — without passing it as a parameter.
 *
 * Headers:
 *   X-Correlation-ID  — if provided by the client/gateway, reused.
 *                        otherwise a new UUID is generated.
 *   X-Request-ID      — alias accepted for compatibility with gateways.
 *
 * The correlation ID is also echoed back in the response header so that
 * clients can correlate their requests to backend logs.
 *
 * Usage (in index.js, before routes):
 *   const requestTracing = require('./middleware/requestTracing');
 *   app.use(requestTracing);
 */

"use strict";

const crypto = require("crypto");
const { correlationStore, logger } = require("../src/lib/logger");

/**
 * Generate a short, URL-safe correlation ID.
 * Format: <timestamp_hex>-<4 random bytes hex>
 * Example: "193a2f1b-a4c3e7f8"
 */
function generateCorrelationId() {
  const ts = Date.now().toString(16);
  const rand = crypto.randomBytes(4).toString("hex");
  return `${ts}-${rand}`;
}

/**
 * Express middleware — must be mounted before all route handlers.
 */
function requestTracing(req, res, next) {
  const correlationId =
    req.headers["x-correlation-id"] ||
    req.headers["x-request-id"] ||
    generateCorrelationId();

  // Sanitize: accept only alphanumeric, hyphens, underscores (max 64 chars)
  const safeId = String(correlationId)
    .replace(/[^a-zA-Z0-9\-_]/g, "")
    .slice(0, 64);

  // Store in AsyncLocalStorage — available to all async code in this request
  correlationStore.run({ correlationId: safeId }, () => {
    // Echo back to client
    res.setHeader("X-Correlation-ID", safeId);

    // Attach to request object for direct access in controllers
    req.correlationId = safeId;

    // Record request start time for latency logging
    req._startTime = Date.now();

    // Log incoming request
    logger.info("Incoming request", {
      meta: {
        method: req.method,
        path: req.path,
        ip: req.ip,
        userAgent: req.headers["user-agent"]?.slice(0, 100),
        contentLength: req.headers["content-length"],
      },
    });

    // Log response when it completes
    const originalEnd = res.end.bind(res);
    res.end = function (...args) {
      const duration = Date.now() - req._startTime;
      const logFn =
        res.statusCode >= 500
          ? logger.error.bind(logger)
          : res.statusCode >= 400
            ? logger.warn.bind(logger)
            : logger.info.bind(logger);

      logFn("Request completed", {
        meta: {
          method: req.method,
          path: req.path,
          status: res.statusCode,
          durationMs: duration,
        },
      });

      return originalEnd(...args);
    };

    next();
  });
}

module.exports = requestTracing;
