"use strict";

const crypto = require("crypto");
const {
  readStoredPreferences,
  resolvePushSettings,
} = require("../notifications/CustomerNotificationPreferences");

const CAMPAIGN_ROUTES = new Set([
  "/(tabs)/BottomTabs",
  "/(Screens)/MyNotificationsScreen",
  "/(Screens)/OrdersScreen",
  "/(Screens)/Deals",
  "/(Screens)/Settings",
  "/(Screens)/Profile",
]);

const CATEGORIES = Object.freeze({
  promotion: { expiresMs: 24 * 60 * 60 * 1000, type: "promotion" },
  app_update: { expiresMs: 30 * 24 * 60 * 60 * 1000, type: "appUpdate" },
  service_announcement: { expiresMs: 7 * 24 * 60 * 60 * 1000, type: "policy" },
});

class PushBroadcastError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

function normalizePayload(input) {
  const title = typeof input?.title === "string" ? input.title.trim() : "";
  const body = typeof input?.body === "string" ? input.body.trim() : "";
  const category = input?.category;
  const destinationRoute =
    typeof input?.destinationRoute === "string" && input.destinationRoute.trim()
      ? input.destinationRoute.trim()
      : null;

  if (!title || title.length > 80) {
    throw new PushBroadcastError(400, "Title is required and must be at most 80 characters.");
  }
  if (!body || body.length > 240) {
    throw new PushBroadcastError(400, "Message is required and must be at most 240 characters.");
  }
  if (!Object.hasOwn(CATEGORIES, category)) {
    throw new PushBroadcastError(400, "Choose a supported campaign category.");
  }
  if (destinationRoute && !CAMPAIGN_ROUTES.has(destinationRoute)) {
    throw new PushBroadcastError(400, "Choose a supported in app destination.");
  }

  return { title, body, category, destinationRoute };
}

function payloadHash(payload) {
  return crypto.createHash("sha256").update(JSON.stringify(payload)).digest("hex");
}

function idempotencyKey(value) {
  if (
    typeof value !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  ) {
    throw new PushBroadcastError(400, "Idempotency-Key must be a UUID v4.");
  }
  return value.toLowerCase();
}

function userEligible(user, category, snapshotAt) {
  if (!user.pushToken) return false;
  if (
    category === "promotion" &&
    (user.marketingPushEnabled !== true ||
      typeof user.marketingPushConsentUpdatedAt !== "string" ||
      user.marketingPushConsentUpdatedAt > snapshotAt)
  ) {
    return false;
  }
  const notificationPreferences = readStoredPreferences(
    user.notificationPreferences,
  );
  return resolvePushSettings(
    CATEGORIES[category].type,
    notificationPreferences,
    user.marketingPushEnabled,
  ).enabled;
}

module.exports = {
  CAMPAIGN_ROUTES,
  CATEGORIES,
  PushBroadcastError,
  idempotencyKey,
  normalizePayload,
  payloadHash,
  userEligible,
};
