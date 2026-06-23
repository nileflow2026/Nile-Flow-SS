/**
 * Appwrite Messaging Service
 *
 * Wraps Appwrite's Messaging SDK (Push, Email, SMS) for use across
 * the Nile Flow ecosystem. All functions are fire-and-forget — never
 * throw or block callers.
 *
 * This service automatically ensures users have the required targets
 * (email / SMS) registered before delivering messages.
 *
 * @see https://appwrite.io/docs/products/messaging
 */

const { ID, Messaging, Users, Query } = require("node-appwrite");
const { client } = require("./appwriteService");
const { env } = require("../src/env");

const messaging = new Messaging(client);
const users = new Users(client);

/**
 * Ensure a user has an email target registered in Appwrite.
 * Creates one if missing. Returns the target ID.
 * Gracefully handles all errors without retrying.
 */
async function ensureEmailTarget(userId, email) {
  try {
    // First verify user exists in Appwrite
    try {
      await users.get(userId);
    } catch (userError) {
      if (userError.message && userError.message.includes("could not be found")) {
        console.warn(
          `[AppwriteMessaging] Cannot create email target: user ${userId} not found in Appwrite`,
        );
        return null;
      }
      // Re-throw other errors
      throw userError;
    }

    // List existing email targets for this user
    const existing = await users.listTargets(userId);
    const emailTarget = existing.targets.find(
      (t) => t.type === "email" && t.identifier === email,
    );
    if (emailTarget) return emailTarget.$id;

    // Create new email target with unique ID
    try {
      const target = await users.createTarget(
        userId,
        ID.unique(),
        "email",
        email,
      );
      return target.$id;
    } catch (createError) {
      // On ANY creation error, log and skip (don't retry)
      console.warn(
        `[AppwriteMessaging] Failed to create email target for ${userId}: ${createError.message}`,
      );
      return null;
    }
  } catch (error) {
    console.warn(
      `[AppwriteMessaging] Failed to ensure email target for ${userId}:`,
      error.message,
    );
    return null;
  }
}

/**
 * Ensure a user has an SMS target registered in Appwrite.
 * Creates one if missing. Returns the target ID.
 * Gracefully handles all errors without retrying.
 */
async function ensureSmsTarget(userId, phone) {
  try {
    // First verify user exists in Appwrite
    try {
      await users.get(userId);
    } catch (userError) {
      if (userError.message && userError.message.includes("could not be found")) {
        console.warn(
          `[AppwriteMessaging] Cannot create SMS target: user ${userId} not found in Appwrite`,
        );
        return null;
      }
      throw userError;
    }

    // Normalize phone number
    let normalizedPhone = phone.replace(/[^0-9]/g, "");
    if (normalizedPhone.startsWith("0")) {
      normalizedPhone = "254" + normalizedPhone.substring(1);
    }
    if (!normalizedPhone.startsWith("+")) {
      normalizedPhone = "+" + normalizedPhone;
    }

    const existing = await users.listTargets(userId);
    const smsTarget = existing.targets.find(
      (t) => t.type === "sms" && t.identifier === normalizedPhone,
    );
    if (smsTarget) return smsTarget.$id;

    // Create new SMS target with unique ID
    try {
      const target = await users.createTarget(
        userId,
        ID.unique(),
        "sms",
        normalizedPhone,
      );
      return target.$id;
    } catch (createError) {
      // On ANY creation error, log and skip (don't retry)
      console.warn(
        `[AppwriteMessaging] Failed to create SMS target for ${userId}: ${createError.message}`,
      );
      return null;
    }
  } catch (error) {
    console.warn(
      `[AppwriteMessaging] Failed to ensure SMS target for ${userId}:`,
      error.message,
    );
    return null;
  }
}

/**
 * Send an email via Appwrite Messaging.
 *
 * @param {object} options
 * @param {string} options.userId       - Appwrite user ID to send to
 * @param {string} options.email        - Email address (used to create target if needed)
 * @param {string} options.subject      - Email subject
 * @param {string} options.content      - Email body (HTML supported)
 * @param {boolean} [options.isHtml]    - Whether content is HTML
 */
async function sendEmail({ userId, email, subject, content, isHtml = true }) {
  try {
    if (!userId || !email || !subject || !content) {
      console.warn("[AppwriteMessaging] sendEmail: missing required fields");
      return;
    }

    const targetId = await ensureEmailTarget(userId, email);
    if (!targetId) {
      console.warn(
        `[AppwriteMessaging] Cannot send email to ${userId}: no target`,
      );
      return;
    }

    await messaging.createEmail(
      ID.unique(),
      subject,
      content,
      [], // topics
      [], // users
      [targetId], // targets
      [], // cc
      [], // bcc
      false, // draft
      isHtml, // html
      "", // scheduledAt
    );
  } catch (error) {
    console.warn(
      `[AppwriteMessaging] Failed to send email to ${userId}:`,
      error.message,
    );
  }
}

/**
 * Send an SMS via Appwrite Messaging.
 *
 * @param {object} options
 * @param {string} options.userId       - Appwrite user ID to send to
 * @param {string} options.phone        - Phone number (used to create target if needed)
 * @param {string} options.content      - SMS body text
 */
async function sendSms({ userId, phone, content }) {
  try {
    if (!userId || !phone || !content) {
      console.warn("[AppwriteMessaging] sendSms: missing required fields");
      return;
    }

    const targetId = await ensureSmsTarget(userId, phone);
    if (!targetId) {
      console.warn(
        `[AppwriteMessaging] Cannot send SMS to ${userId}: no target`,
      );
      return;
    }

    await messaging.createSms(
      ID.unique(),
      content,
      [], // topics
      [], // users
      [targetId], // targets
      false, // draft
      "", // scheduledAt
    );
  } catch (error) {
    console.warn(
      `[AppwriteMessaging] Failed to send SMS to ${userId}:`,
      error.message,
    );
  }
}

/**
 * Send a push notification via Appwrite Messaging.
 * Sends to a specific user by their Appwrite user ID (requires push target).
 *
 * @param {object} options
 * @param {string} options.userId       - Appwrite user ID to send to
 * @param {string} options.title        - Push notification title
 * @param {string} options.body         - Push notification body
 * @param {object} [options.data]       - Extra payload
 * @param {string} [options.action]     - Deep link action (1-256 chars, optional)
 */
async function sendPush({ userId, title, body, data = {}, action = null }) {
  try {
    if (!userId || !title || !body) {
      console.warn("[AppwriteMessaging] sendPush: missing required fields");
      return;
    }

    // Validate and prepare action parameter
    // IMPORTANT: Appwrite rejects EMPTY strings for action.
    // Only include action if it's a non-empty, valid string (1-256 chars)
    let actionParam = null;
    if (action && typeof action === "string") {
      const trimmedAction = action.trim();
      if (trimmedAction.length > 0) {
        // Truncate to 256 chars if too long
        actionParam = trimmedAction.substring(0, 256);
      }
    }

    try {
      await messaging.createPush(
        ID.unique(),
        title,
        body,
        [], // topics
        [userId], // users — Appwrite resolves their push targets
        [], // targets
        data,
        actionParam || "", // Use empty string only as last resort (required parameter)
        "", // icon
        "default", // sound
        "", // color
        "", // tag
        1, // badge
        false, // contentAvailable
        false, // critical
        "normal", // priority
        false, // draft
        "", // scheduledAt
      );
    } catch (pushError) {
      // If user doesn't exist, log it but don't crash
      if (pushError.message && pushError.message.includes("could not be found")) {
        console.warn(
          `[AppwriteMessaging] Cannot send push: user ${userId} not found in Appwrite`,
        );
        return;
      }
      throw pushError;
    }
  } catch (error) {
    console.warn(
      `[AppwriteMessaging] Failed to send push to ${userId}:`,
      error.message,
    );
  }
}

/**
 * Send a push notification to a topic (all subscribers).
 *
 * @param {object} options
 * @param {string} options.topic        - Topic name (must exist in Appwrite)
 * @param {string} options.title        - Push notification title
 * @param {string} options.body         - Push notification body
 * @param {object} [options.data]       - Extra payload
 * @param {string} [options.action]     - Deep link action (1-256 chars, optional)
 */
async function sendPushToTopic({ topic, title, body, data = {}, action = null }) {
  try {
    if (!topic || !title || !body) {
      console.warn("[AppwriteMessaging] sendPushToTopic: missing required fields");
      return;
    }

    // Validate and prepare action parameter
    // IMPORTANT: Appwrite rejects EMPTY strings for action.
    // Only include action if it's a non-empty, valid string (1-256 chars)
    let actionParam = null;
    if (action && typeof action === "string") {
      const trimmedAction = action.trim();
      if (trimmedAction.length > 0) {
        // Truncate to 256 chars if too long
        actionParam = trimmedAction.substring(0, 256);
      }
    }

    await messaging.createPush(
      ID.unique(),
      title,
      body,
      [topic], // topics
      [], // users
      [], // targets
      data,
      actionParam || "", // Use empty string only as last resort (required parameter)
      "", // icon
      "default", // sound
      "", // color
      "", // tag
      1, // badge
      false, // contentAvailable
      false, // critical
      "normal", // priority
      false, // draft
      "", // scheduledAt
    );
  } catch (error) {
    console.warn(
      `[AppwriteMessaging] Failed to send push to topic ${topic}:`,
      error.message,
    );
  }
}

/**
 * High-level notification dispatcher.
 * Sends SMS + Email + Push to a user in one call.
 *
 * @param {object} options
 * @param {string} options.userId         - Appwrite user ID
 * @param {string} options.email          - Email address
 * @param {string} [options.phone]        - Phone number (for SMS, optional)
 * @param {string} options.emailSubject   - Email subject
 * @param {string} options.emailContent   - Email body (HTML)
 * @param {string} options.smsContent     - SMS body text (optional, requires phone)
 * @param {string} [options.pushTitle]    - Push notification title (optional)
 * @param {string} [options.pushBody]     - Push notification body (optional)
 * @param {object} [options.pushData]     - Push extra payload
 */
async function notifyUser({
  userId,
  email,
  phone,
  emailSubject,
  emailContent,
  smsContent,
  pushTitle,
  pushBody,
  pushData = {},
}) {
  await Promise.allSettled([
    sendEmail({
      userId,
      email,
      subject: emailSubject,
      content: emailContent,
      isHtml: true,
    }),
    ...(phone && smsContent
      ? [
          sendSms({
            userId,
            phone,
            content: smsContent,
          }),
        ]
      : []),
    ...(pushTitle && pushBody
      ? [
          sendPush({
            userId,
            title: pushTitle,
            body: pushBody,
            data: pushData,
          }),
        ]
      : []),
  ]);
}

module.exports = {
  sendEmail,
  sendSms,
  sendPush,
  sendPushToTopic,
  notifyUser,
};
