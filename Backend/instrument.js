// instrument.js — Sentry must be initialized before any other module.
// This file is require()'d as the very first line of src/index.js.
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://e5d8425640386e579a45db2b7042a4bb@o4510430501666816.ingest.us.sentry.io/4511411695976448",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  environment: process.env.NODE_ENV || "development",
  release: process.env.APP_VERSION || "unknown",
  // Capture 10% of requests for performance tracing in production; 100% in dev
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Profile 10% of transactions in production for code-level insights
  profilesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
  // Enable Spotlight for local debugging only if explicitly requested via SENTRY_SPOTLIGHT env var
  // This prevents spurious warnings when Spotlight Sidecar is not running
  spotlight: process.env.SENTRY_SPOTLIGHT === "true" && process.env.NODE_ENV === "development",
  // Enable debug mode in development only
  debug: process.env.NODE_ENV === "development",
  // Include request body in breadcrumbs for debugging
  maxRequestBodySize: process.env.NODE_ENV === "production" ? "none" : "always",
});
