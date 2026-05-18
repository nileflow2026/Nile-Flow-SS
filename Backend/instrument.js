// instrument.js — Sentry must be initialized before any other module.
// This file is require()'d as the very first line of src/index.js.
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "https://e5d8425640386e579a45db2b7042a4bb@o4510430501666816.ingest.us.sentry.io/4511411695976448",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true,
  environment: process.env.NODE_ENV || "development",
  release: process.env.APP_VERSION,
  // Capture 10% of requests for performance tracing in production; 100% in dev
  tracesSampleRate: process.env.NODE_ENV === "production" ? 0.1 : 1.0,
});
