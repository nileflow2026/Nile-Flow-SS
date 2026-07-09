/**
 * Appwrite Messaging Service
 *
 * Wraps Appwrite's Messaging SDK (Push, Email, SMS) for use across
 * the Nile Flow ecosystem. All functions are fire-and-forget — never
 * throw or block callers.
 *
 * ## Bug Fixes Applied (2026-07-09)
 *
 * 1. Push `action` param: Appwrite 1.9.x rejects empty strings for the `action`
 *    parameter. The old code passed `""` when no action was provided, causing
 *    "Invalid `action` param: Value must be a valid string and at least 1 chars".
 *    FIX: Pass `undefined` instead of `""` when no action is given.
 *
 * 2. Email target creation race: When two requests create an email target for
 *    the same user simultaneously, the second one gets 409 "already exists".
 *    The old code didn't catch this, causing "no target" on the second request.
 *    FIX: Handle 409 gracefully by listing targets and finding the existing one.
 *
 * 3. "No enabled provider": Appwrite Messaging requires at least one provider
 *    configured per channel (email, SMS, push) in the Appwrite Console under
 *    Messaging > Providers. Added a startup check and clear error guidance.
 *
 * @see https://appwrite.io/docs/products/messaging
 */

const { ID, Messaging, Users, Query } = require("node-appwrite");
const { client } = require("./appwriteService");
const { env } = require("../src/env");

const messaging = new Messaging(client);
const users = new Users(client);

// In-memory cache of known target IDs to avoid redundant lookups
const targetCache = new Map();

/**
 * Check if a provider is configured for the given channel type.
 * Logs a clear message if missing so admins can fix it in the Console.
 */
async function checkProvider(channelType) {
  try {
    const providers = await messaging.listProviders();
    const hasProvider = providers.providers.some((p) => p.type === channelType && p.enabled);
    if (!hasProvider) {
      console.warn(
        `[AppwriteMessaging] ⚠️ No enabled ${channelType} provider found. ` +
        `Go to Appwrite Console → Messaging → Providers and add one. ` +
        `${channelType} notifications will be silently skipped.`,
      );
    }
    return hasProvider;
  } catch {
    return false;
  }
}

// Run provider check once on startup
setTimeout(() => {
  checkProvider("email");
  checkProvider("sms");
  checkProvider("push");
}, 5000);

/**
 * Ensure a user has an email target registered in Appwrite.
 * Creates one if missing. Returns the target ID.
 * Handles race conditions where two requests create the same target.
 */
async function ensureEmailTarget(userId, email) {
  // Check cache first
  const cacheKey = `email:${userId}:${email}`;
  if (targetCache.has(cacheKey)) return targetCache.get(cacheKey);

  try {
    // Verify user exists
    try {
      await users.get(userId);
    } catch (userError) {
      if (userError.message && userError.message.includes("could not be found")) {
        console.warn(`[AppwriteMessaging] Cannot create email target: user ${userId} not found`);
        return null;
      }
      throw userError;
    }

    // List existing targets
    const existing = await users.listTargets(userId);
    const emailTarget = existing.targets.find(
      (t) => t.type === "email" && t.identifier === email,
    );
    if (emailTarget) {
      targetCache.set(cacheKey, emailTarget.$id);
      return emailTarget.$id;
    }

    // Create new target — handle 409 if another request created it first
    try {
      const target = await users.createTarget(userId, ID.unique(), "email", email);
      targetCache.set(cacheKey, target.$id);
      return target.$id;
    } catch (createError) {
      if (createError.code === 409 && createError.message?.includes("already exists")) {
        // Race condition — another request created it between our list and create.
        // Retry the list to get the existing target ID.
        const retry = await users.listTargets(userId);
        const existingTarget = retry.targets.find(
          (t) => t.type === "email" && t.identifier === email,
        );
        if (existingTarget) {
          targetCache.set(cacheKey, existingTarget.$id);
          return existingTarget.$id;
        }
      }
      console.warn(`[AppwriteMessaging] Failed to create email target for ${userId}: ${createError.message}`);
      return null;
    }
  } catch (error) {
    console.warn(`[AppwriteMessaging] Failed to ensure email target for ${userId}:`, error.message);
    return null;
  }
}

/**
 * Ensure a user has an SMS target registered. Handles 409 race conditions.
 */
async function ensureSmsTarget(userId, phone) {
  const cacheKey = `sms:${userId}:${phone}`;
  if (targetCache.has(cacheKey)) return targetCache.get(cacheKey);

  try {
    try {
      await users.get(userId);
    } catch (userError) {
      if (userError.message?.includes("could not be found")) {
        console.warn(`[AppwriteMessaging] Cannot create SMS target: user ${userId} not found`);
        return null;
      }
      throw userError;
    }

    let normalizedPhone = phone.replace(/[^0-9]/g, "");
    if (normalizedPhone.startsWith("0")) normalizedPhone = "254" + normalizedPhone.substring(1);
    if (!normalizedPhone.startsWith("+")) normalizedPhone = "+" + normalizedPhone;

    const existing = await users.listTargets(userId);
    const smsTarget = existing.targets.find(
      (t) => t.type === "sms" && t.identifier === normalizedPhone,
    );
    if (smsTarget) {
      targetCache.set(cacheKey, smsTarget.$id);
      return smsTarget.$id;
    }

    try {
      const target = await users.createTarget(userId, ID.unique(), "sms", normalizedPhone);
      targetCache.set(cacheKey, target.$id);
      return target.$id;
    } catch (createError) {
      if (createError.code === 409 && createError.message?.includes("already exists")) {
        const retry = await users.listTargets(userId);
        const existingTarget = retry.targets.find(
          (t) => t.type === "sms" && t.identifier === normalizedPhone,
        );
        if (existingTarget) {
          targetCache.set(cacheKey, existingTarget.$id);
          return existingTarget.$id;
        }
      }
      console.warn(`[AppwriteMessaging] Failed to create SMS target for ${userId}: ${createError.message}`);
      return null;
    }
  } catch (error) {
    console.warn(`[AppwriteMessaging] Failed to ensure SMS target for ${userId}:`, error.message);
    return null;
  }
}

/**
 * Send an email via Appwrite Messaging.
 */
async function sendEmail({ userId, email, subject, content, isHtml = true }) {
  try {
    if (!userId || !email || !subject || !content) {
      console.warn("[AppwriteMessaging] sendEmail: missing required fields");
      return;
    }

    const targetId = await ensureEmailTarget(userId, email);
    if (!targetId) {
      console.warn(`[AppwriteMessaging] Cannot send email to ${userId}: no target`);
      return;
    }

    await messaging.createEmail(
      ID.unique(), subject, content,
      [], [], [targetId], [], [],
      false, isHtml, "",
    );
  } catch (error) {
    console.warn(`[AppwriteMessaging] Failed to send email to ${userId}:`, error.message);
  }
}

/**
 * Send an SMS via Appwrite Messaging.
 */
async function sendSms({ userId, phone, content }) {
  try {
    if (!userId || !phone || !content) {
      console.warn("[AppwriteMessaging] sendSms: missing required fields");
      return;
    }

    const targetId = await ensureSmsTarget(userId, phone);
    if (!targetId) {
      console.warn(`[AppwriteMessaging] Cannot send SMS to ${userId}: no target`);
      return;
    }

    await messaging.createSms(
      ID.unique(), content,
      [], [], [targetId],
      false, "",
    );
  } catch (error) {
    console.warn(`[AppwriteMessaging] Failed to send SMS to ${userId}:`, error.message);
  }
}

/**
 * Send a push notification via Appwrite Messaging.
 *
 * CRITICAL BUG FIX: Appwrite 1.9.x rejects empty strings for the `action` param.
 * The old code passed `""` when no action was provided, causing:
 *   "Invalid `action` param: Value must be a valid string and at least 1 chars"
 *
 * FIX: Only pass `action` when we have a real non-empty value. Otherwise pass
 * `undefined` so Appwrite skips the parameter entirely.
 */
async function sendPush({ userId, title, body, data = {}, action = null }) {
  try {
    if (!userId || !title || !body) {
      console.warn("[AppwriteMessaging] sendPush: missing required fields");
      return;
    }

    // BUG FIX: Only set actionParam when we have a real value (1-256 chars).
    // undefined = don't send the param at all. NEVER send empty string.
    let actionParam = undefined;
    if (action && typeof action === "string") {
      const trimmedAction = action.trim();
      if (trimmedAction.length > 0) {
        actionParam = trimmedAction.substring(0, 256);
      }
    }

    try {
      await messaging.createPush(
        ID.unique(), title, body,
        [], [userId], [],
        data,
        actionParam, // FIXED: undefined instead of ""
        "", "default", "", "",
        1, false, false, "normal", false, "",
      );
    } catch (pushError) {
      if (pushError.message && pushError.message.includes("could not be found")) {
        console.warn(`[AppwriteMessaging] Cannot send push: user ${userId} not found in Appwrite`);
        return;
      }
      throw pushError;
    }
  } catch (error) {
    console.warn(`[AppwriteMessaging] Failed to send push to ${userId}:`, error.message);
  }
}

/**
 * Send a push notification to a topic.
 * Same action param fix applied.
 */
async function sendPushToTopic({ topic, title, body, data = {}, action = null }) {
  try {
    if (!topic || !title || !body) {
      console.warn("[AppwriteMessaging] sendPushToTopic: missing required fields");
      return;
    }

    let actionParam = undefined;
    if (action && typeof action === "string") {
      const trimmedAction = action.trim();
      if (trimmedAction.length > 0) {
        actionParam = trimmedAction.substring(0, 256);
      }
    }

    await messaging.createPush(
      ID.unique(), title, body,
      [topic], [], [],
      data,
      actionParam, // FIXED: undefined instead of ""
      "", "default", "", "",
      1, false, false, "normal", false, "",
    );
  } catch (error) {
    console.warn(`[AppwriteMessaging] Failed to send push to topic ${topic}:`, error.message);
  }
}

/**
 * High-level notification dispatcher — all channels at once.
 */
async function notifyUser({
  userId, email, phone,
  emailSubject, emailContent,
  smsContent,
  pushTitle, pushBody,
  pushData = {},
}) {
  await Promise.allSettled([
    sendEmail({ userId, email, subject: emailSubject, content: emailContent, isHtml: true }),
    ...(phone && smsContent ? [sendSms({ userId, phone, content: smsContent })] : []),
    ...(pushTitle && pushBody ? [sendPush({ userId, title: pushTitle, body: pushBody, data: pushData })] : []),
  ]);
}

module.exports = {
  sendEmail, sendSms, sendPush, sendPushToTopic, notifyUser,
  checkProvider,
};
