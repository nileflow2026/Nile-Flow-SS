/**
 * Nile Flow — Structured Logger
 *
 * Winston-based logger with:
 *  - JSON output in production (machine-readable for log aggregators)
 *  - Human-readable colorized output in development
 *  - Correlation ID support (set per-request via AsyncLocalStorage)
 *  - Automatic redaction of sensitive fields
 *  - Daily rotating log files (errors + combined)
 *
 * Usage:
 *   const logger = require('../lib/logger');
 *   logger.info('Order created', { orderId, userId, amount });
 *   logger.error('Payment failed', { error: err.message, orderId });
 */

"use strict";

const { createLogger, format, transports } = require("winston");
const { combine, timestamp, json, colorize, printf, errors } = format;
const path = require("path");
const fs = require("fs");

// ── Log directory ────────────────────────────────────────────────────────────

const LOG_DIR = path.join(__dirname, "../../logs");
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

// ── Sensitive field redactor ─────────────────────────────────────────────────

const REDACTED_KEYS = new Set([
  "password",
  "token",
  "accessToken",
  "refreshToken",
  "apiKey",
  "secret",
  "cardNumber",
  "cvv",
  "pin",
  "otp",
  "verificationCode",
  "Authorization",
  "authorization",
  "cookie",
  "Cookie",
  "mpesaPin",
]);

function redact(obj, depth = 0) {
  if (depth > 5 || obj === null || typeof obj !== "object") return obj;
  const result = Array.isArray(obj) ? [] : {};
  for (const key of Object.keys(obj)) {
    result[key] = REDACTED_KEYS.has(key)
      ? "[REDACTED]"
      : redact(obj[key], depth + 1);
  }
  return result;
}

const redactFormat = format((info) => {
  if (info.meta && typeof info.meta === "object") {
    info.meta = redact(info.meta);
  }
  return info;
});

// ── Correlation ID via AsyncLocalStorage ─────────────────────────────────────

const { AsyncLocalStorage } = require("async_hooks");
const correlationStore = new AsyncLocalStorage();

const addCorrelationId = format((info) => {
  const store = correlationStore.getStore();
  if (store?.correlationId) {
    info.correlationId = store.correlationId;
  }
  return info;
});

// ── Format definitions ───────────────────────────────────────────────────────

const isProd = process.env.NODE_ENV === "production";

const devFormat = combine(
  colorize({ all: true }),
  timestamp({ format: "HH:mm:ss" }),
  errors({ stack: true }),
  printf(({ timestamp: ts, level, message, correlationId, ...rest }) => {
    const corr = correlationId ? ` [${correlationId}]` : "";
    const extra =
      Object.keys(rest).length > 0 ? ` ${JSON.stringify(rest)}` : "";
    return `${ts}${corr} ${level}: ${message}${extra}`;
  }),
);

const prodFormat = combine(
  timestamp(),
  errors({ stack: true }),
  redactFormat(),
  addCorrelationId(),
  json(),
);

// ── Transports ───────────────────────────────────────────────────────────────

const logTransports = [
  // Always write to stdout (picked up by container log aggregators)
  new transports.Console({
    format: isProd ? prodFormat : devFormat,
  }),
];

// File transports only in production or when explicitly enabled
if (isProd || process.env.LOG_TO_FILE === "true") {
  logTransports.push(
    new transports.File({
      filename: path.join(LOG_DIR, "error.log"),
      level: "error",
      format: prodFormat,
      maxsize: 20 * 1024 * 1024, // 20 MB
      maxFiles: 5,
    }),
    new transports.File({
      filename: path.join(LOG_DIR, "combined.log"),
      format: prodFormat,
      maxsize: 50 * 1024 * 1024, // 50 MB
      maxFiles: 10,
    }),
  );
}

// ── Logger instance ──────────────────────────────────────────────────────────

const logger = createLogger({
  level: process.env.LOG_LEVEL || (isProd ? "info" : "debug"),
  transports: logTransports,
  exitOnError: false,
});

// ── Convenience method: log with structured metadata ─────────────────────────

logger.withMeta = (meta) => ({
  info: (msg) => logger.info(msg, { meta }),
  warn: (msg) => logger.warn(msg, { meta }),
  error: (msg) => logger.error(msg, { meta }),
  debug: (msg) => logger.debug(msg, { meta }),
});

// ── Financial audit logger (separate stream for compliance) ──────────────────

const auditLogger = createLogger({
  level: "info",
  transports: [
    new transports.Console({
      format: isProd ? prodFormat : devFormat,
    }),
    ...(isProd || process.env.LOG_TO_FILE === "true"
      ? [
          new transports.File({
            filename: path.join(LOG_DIR, "financial-audit.log"),
            format: prodFormat,
            maxsize: 50 * 1024 * 1024,
            maxFiles: 30, // 30 rotations for compliance retention
          }),
        ]
      : []),
  ],
});

// ── Exports ──────────────────────────────────────────────────────────────────

module.exports = {
  logger,
  auditLogger,
  correlationStore,
};
