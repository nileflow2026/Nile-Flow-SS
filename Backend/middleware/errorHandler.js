/**
 * Centralized Express error handler.
 *
 * Place this AFTER Sentry.setupExpressErrorHandler(app) and BEFORE
 * any other catch-all middleware so that:
 *   1. Sentry already captured the error.
 *   2. This handler formats a consistent JSON response.
 *
 * Usage in index.js:
 *   const errorHandler = require("../middleware/errorHandler");
 *   ...
 *   app.use(errorHandler);
 */

const logger = require("../utils/logger");
const TRUSTED_CORS_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:3000",
  "https://admin.nileflowafrica.com",
  "https://vendor.nileflowafrica.com",
  "https://nileflowafrica.com",
  "https://www.nileflowafrica.com",
  "https://nile-flow-adminpanel.onrender.com",
  "https://nile-flow-website.onrender.com",
  "https://nile-flow-website2.onrender.com",
]);

// Known operational error codes that should NOT be treated as unexpected crashes
const OPERATIONAL_CODES = new Set([
  "LIMIT_FILE_SIZE",
  "NOT_ALLOWED_BY_CORS",
  "VALIDATION_ERROR",
  "UNAUTHORIZED",
  "FORBIDDEN",
  "NOT_FOUND",
]);

// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const isOperational = OPERATIONAL_CODES.has(err.code) || status < 500;

  // Always log; use warn for expected errors, error for unexpected ones
  const logMeta = {
    method: req.method,
    url: req.originalUrl,
    status,
    userId: req.user?.id || req.user?.$id || "anonymous",
    errorCode: err.code,
  };

  if (isOperational) {
    logger.warn(err.message, logMeta);
  } else {
    logger.error(err.message || "Internal server error", {
      ...logMeta,
      stack: err.stack,
    });
  }

  // Set CORS headers even on errors so browser clients see the response
  const origin = req.headers.origin;
  if (origin && TRUSTED_CORS_ORIGINS.has(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,X-Requested-With,Accept,X-CSRF-Token,Cache-Control,Pragma",
    );
  }

  // Never leak internal details in production
  const isProd = process.env.NODE_ENV === "production";

  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(413).json({
      error: "File too large",
      code: "FILE_TOO_LARGE",
      maxSize: "50MB",
    });
  }

  if (err.message === "Not allowed by CORS") {
    return res.status(403).json({
      error: "CORS policy violation",
      code: "NOT_ALLOWED_BY_CORS",
    });
  }

  return res.status(status).json({
    error: isProd && !isOperational ? "Internal server error" : err.message,
    code: err.code || "INTERNAL_ERROR",
    ...(isProd ? {} : { stack: err.stack }),
  });
}

module.exports = errorHandler;
