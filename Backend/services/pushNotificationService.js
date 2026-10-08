/**
 * Expo Push Notification Service.
 *
 * Callers enqueue these sends on nf-notifications. This module only performs
 * the provider request and returns its ticket outcome to the queue worker.
 */

const { notificationsQueue } = require("../src/jobs/queues");
const { instrumentedDb } = require("./appwriteService");
const { env } = require("../src/env");
const { pushNotificationJobId } = require("./pushNotificationJobIds");
const {
  readStoredPreferences,
  resolvePushSettings,
} = require("../notifications/CustomerNotificationPreferences");

const EXPO_PUSH_API = "https://exp.host/--/api/v2/push/send";

// Human-readable title map for each notification type
const TYPE_TITLES = {
  order: "Order Update",
  orderUpdate: "Order Update",
  payment: "Payment Update",
  promotion: "New Promotion",
  deal: "New Deal",
  flash_sale: "Flash Sale",
  appUpdate: "App Update",
  policy: "Policy Update",
  news: "NileFlow News",
  referral: "Referral Reward",
  reward: "Rewards",
  welcome: "Welcome to NileFlow",
  userNotification: "Notification",
  default: "NileFlow",
};

function getTitleForType(type) {
  if (!type) return TYPE_TITLES.default;
  // Direct match
  if (TYPE_TITLES[type]) return TYPE_TITLES[type];
  // Partial match (e.g. "orderStatus" → "Order Update")
  const key = Object.keys(TYPE_TITLES).find((k) =>
    type.toLowerCase().includes(k.toLowerCase()),
  );
  return key ? TYPE_TITLES[key] : TYPE_TITLES.default;
}

/**
 * Fetch a user's Expo push token from Appwrite.
 * Returns null if not found or not registered.
 */
/**
 * Enqueue a push for delivery by the notification worker.
 */
async function enqueuePushNotification({
  userId,
  message,
  type,
  title,
  data = {},
  idempotencyKey,
  expiresAfter,
}) {
  if (!userId || !message) {
    throw new Error("Push notification requires userId and message.");
  }

  return notificationsQueue.add(
    "expo-push",
    {
      type: "expo-push",
      payload: {
        userId,
        message,
        type,
        title: title || getTitleForType(type),
        data,
        expiresAfter,
      },
    },
    {
      jobId: idempotencyKey ? pushNotificationJobId(idempotencyKey) : undefined,
      attempts: 5,
      backoff: { type: "exponential", delay: 1000 },
      removeOnComplete: { count: 100 },
      removeOnFail: { count: 500 },
    },
  );
}

/**
 * Send one already-queued push to Expo and return its ticket outcome.
 */
async function sendQueuedPush({ userId, message, type, title, data = {}, expiresAfter }) {
  if (!userId || !message) {
    throw new Error("Queued push is missing userId or message.");
  }

  const userDoc = await instrumentedDb.getDocument(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_USER_COLLECTION_ID,
    userId,
  );
  const pushToken = userDoc?.pushToken;
  if (!pushToken) return { status: "skipped", reason: "missing_token" };
  const preferences = readStoredPreferences(userDoc.notificationPreferences);
  const pushSettings = resolvePushSettings(
    data.event || type,
    preferences,
    userDoc.marketingPushEnabled,
  );
  if (!pushSettings.enabled) {
    return { status: "skipped", reason: "category_disabled" };
  }

  const payload = {
    to: pushToken,
    title: title || getTitleForType(type),
    body: message,
    sound: pushSettings.sound,
    badge: 1,
    data: { type, ...data },
    channelId: pushSettings.channelId,
  };
  if (Number.isInteger(expiresAfter) && expiresAfter > 0) {
    payload.ttl = expiresAfter;
  }

  const response = await fetch(EXPO_PUSH_API, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-Encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  let result;
  try {
    result = await response.json();
  } catch (error) {
    const parseError = new Error("Expo returned an unreadable push response.");
    parseError.retryable = response.status === 429 || response.status >= 500;
    parseError.errorCategory =
      response.status === 429
        ? "http_429"
        : response.status >= 500
          ? "http_5xx"
          : "http_4xx";
    throw parseError;
  }
  if (!response.ok) {
    const error = new Error(`Expo Push API returned HTTP ${response.status}.`);
    error.statusCode = response.status;
    error.retryable = response.status === 429 || response.status >= 500;
    error.errorCategory =
      response.status === 429
        ? "http_429"
        : response.status >= 500
          ? "http_5xx"
          : "http_4xx";
    throw error;
  }

  const ticket = Array.isArray(result?.data) ? result.data[0] : result?.data;
  if (ticket?.status === "error") {
    const providerCode = ticket.details?.error;
    if (providerCode === "DeviceNotRegistered") {
      await clearInvalidToken(userId, pushToken);
      return { status: "rejected", reason: providerCode };
    }
    if (
      ["MessageRateExceeded", "MessageServerUnavailable", "InternalServerError"].includes(
        providerCode,
      )
    ) {
      const error = new Error(ticket.message || "Expo temporarily rejected the push.");
      error.providerCode = providerCode;
      error.retryable = true;
      error.errorCategory = providerCode;
      throw error;
    }

    return { status: "rejected", reason: providerCode || "provider_rejected" };
  }
  if (ticket?.status !== "ok") {
    const error = new Error("Expo returned a response without a valid push ticket.");
    error.errorCategory = "ambiguous_provider_result";
    throw error;
  }

  return { status: "accepted", ticketId: ticket.id || null };
}

async function clearInvalidToken(userId, invalidToken) {
  const user = await instrumentedDb.getDocument(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_USER_COLLECTION_ID,
    userId,
  );
  if (user?.pushToken !== invalidToken) return;
  await instrumentedDb.updateDocument(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_USER_COLLECTION_ID,
    userId,
    { pushToken: null },
  );
}

module.exports = {
  enqueuePushNotification,
  sendQueuedPush,
};
