/**
 * Appwrite Messaging Service
 *
 * Wraps Appwrite's Messaging SDK (Push, Email, SMS) for use across
 * the Nile Flow ecosystem. All functions are fire-and-forget — never
 * throw or block callers.
 *
 * ## How It Works
 *
 * 1. resolveAppwriteUserId() tries to find the caller's identity:
 *    a. Direct Auth user lookup (for users with Auth accounts)
 *    b. DB collection scan — vendors collection first (most common),
 *       then admins collection — using email as the matching key
 *
 * 2. ensureEmailTarget() creates an Appwrite Messaging target linked
 *    to the resolved Auth user ID. If no Auth user exists, the
 *    notification is silently skipped with a debug log.
 *
 * 3. Notifications that use `admin.$id` from the DB collection will
 *    automatically resolve to the matching Auth user (by email lookup)
 *    before the email target is created and the message is sent.
 */

const { ID, Messaging, Users, Databases, Query } = require("node-appwrite");
const { client } = require("./appwriteService");
const { env } = require("../src/env");

const messaging = new Messaging(client);
const users = new Users(client);
const db = new Databases(client);

// In-memory cache of known target IDs to avoid redundant lookups
const targetCache = new Map();

console.log("[AppwriteMessaging] target manager v3: Appwrite-generated target IDs");

function normalizeEmailValue(email) {
  return String(email || "").trim().toLowerCase();
}

function normalizePhoneValue(phone) {
  const digits = String(phone || "").replace(/\D/g, "");
  if (!digits) return "";

  let sanitized = digits;
  if (sanitized.startsWith("0")) sanitized = `254${sanitized.slice(1)}`;
  if (!sanitized.startsWith("+")) sanitized = `+${sanitized}`;
  return sanitized;
}

// ── DB collection scan (primary auth fallback) ────────────────────
// Searches user records in DB collections by email and returns the
// matching Auth user ID (or null if not found).
//
// Why this matters:
//   - Vendors created via /api/vendor/auth/register get an Auth user
//     AND a DB record — the IDs match, so direct Auth lookup works.
//   - Admins live only in the DB collection — they have NO Auth account,
//     so we must fall back to a DB search to find the right user.

async function resolveUserIdFromDbCollection(email) {
  const normalizedEmail = normalizeEmailValue(email);
  if (!normalizedEmail) return null;

  const collectionsToTry = [
    { collectionId: env.APPWRITE_ADMIN_COLLECTION_ID, label: "admin" },
    { collectionId: env.VENDOR_COLLECTION_ID,              label: "vendor" },
  ].filter(c => c.collectionId);

  for (const { collectionId, label } of collectionsToTry) {
    try {
      const result = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        collectionId,
        [Query.equal("email", normalizedEmail), Query.limit(1)],
      );
      const doc = result.documents[0];
      if (!doc) continue;

      // Most DB records use their own $id as the userId reference.
      // Try to resolve it as an Auth user.
      const candidateId = doc.$id;

      try {
        await users.get(candidateId);
        return candidateId;
      } catch {}

      // Fallback: look up by email in Auth itself
      const authResult = await users.list([
        Query.equal("email", normalizedEmail),
        Query.limit(1),
      ]);
      if (authResult.users?.[0]?.$id) {
        return authResult.users[0].$id;
      }

      // If we found a DB record but no Auth user, return the DB document ID
      // so that DB-based targets (see below) can still be resolved.
      return candidateId;
    } catch (err) {
      console.debug(`[AppwriteMessaging] DB scan failed for ${label} collection: ${err.message}`);
    }
  }
  return null;
}

async function resolveAppwriteUserId(userId, email) {
  if (!userId) return null;

  try {
    await users.get(userId);
    return userId;
  } catch (userError) {
    const normalizedEmail = normalizeEmailValue(email);

    // Try direct email-to-Auth lookup
    if (normalizedEmail) {
      try {
        const result = await users.list([
          Query.equal("email", normalizedEmail),
          Query.limit(1),
        ]);
        if (result.users?.[0]?.$id) return result.users[0].$id;
      } catch {}
    }

    // Fallback: search DB collections (admin, vendor) to find the user
    const dbResult = await resolveUserIdFromDbCollection(normalizedEmail);
    if (dbResult) return dbResult;

    console.debug(
      `[AppwriteMessaging] No Auth user found for userId=${userId} email=${normalizedEmail}`,
    );
    return null;
  }
}

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
  const normalizedEmail = normalizeEmailValue(email);
  if (!userId || !normalizedEmail) return null;

  const appwriteUserId = await resolveAppwriteUserId(userId, normalizedEmail);
  if (!appwriteUserId) {
    console.debug(`[AppwriteMessaging] No Auth user for userId=${userId} email=${normalizedEmail} — skipping email`);
    return null;
  }

  const cacheKey = `email:${appwriteUserId}:${normalizedEmail}`;
  if (targetCache.has(cacheKey)) return targetCache.get(cacheKey);

  try {
    const existing = await users.listTargets(appwriteUserId);
    const emailTarget = (existing.targets || []).find((t) => {
      const targetIdentifier = String(t.identifier || "").trim().toLowerCase();
      return t.type === "email" && targetIdentifier === normalizedEmail;
    });
    if (emailTarget) {
      targetCache.set(cacheKey, emailTarget.$id);
      return emailTarget.$id;
    }

    try {
      const target = await users.createTarget({
        userId: appwriteUserId,
        targetId: ID.unique(),
        providerType: "email",
        identifier: normalizedEmail,
      });
      targetCache.set(cacheKey, target.$id);
      return target.$id;
    } catch (createError) {
      const isDuplicate =
        createError.type === "target_already_exists" ||
        (createError.message && createError.message.includes("already exists")) ||
        createError.code === 409;

      if (isDuplicate) {
        try {
          const retry = await users.listTargets(appwriteUserId);
          const existingTarget = (retry.targets || []).find((t) => {
            const targetIdentifier = String(t.identifier || "").trim().toLowerCase();
            return t.type === "email" && targetIdentifier === normalizedEmail;
          });
          if (existingTarget) {
            targetCache.set(cacheKey, existingTarget.$id);
            return existingTarget.$id;
          }
        } catch (retryErr) {
          console.debug(`[AppwriteMessaging] Failed to retry email target lookup for ${userId}: ${retryErr.message}`);
        }
        return null;
      }

      console.warn(`[AppwriteMessaging] Failed to create email target for ${userId}: ${createError.message}`);
      return null;
    }
  } catch (error) {
    console.debug(`[AppwriteMessaging] Failed to ensure email target for ${userId}: ${error.message}`);
    return null;
  }
}

/**
 * Ensure a user has an SMS target registered. Handles 409 race conditions.
 */
async function ensureSmsTarget(userId, phone) {
  const normalizedPhone = normalizePhoneValue(phone);
  if (!userId || !normalizedPhone) return null;

  const appwriteUserId = await resolveAppwriteUserId(userId, normalizedPhone);
  if (!appwriteUserId) {
    console.debug(`[AppwriteMessaging] No Auth user for userId=${userId} phone=${normalizedPhone} — skipping SMS`);
    return null;
  }

  const cacheKey = `sms:${appwriteUserId}:${normalizedPhone}`;
  if (targetCache.has(cacheKey)) return targetCache.get(cacheKey);

  try {
    const existing = await users.listTargets(appwriteUserId);
    const smsTarget = (existing.targets || []).find((t) => {
      const targetIdentifier = String(t.identifier || "").trim();
      return t.type === "sms" && targetIdentifier === normalizedPhone;
    });
    if (smsTarget) {
      targetCache.set(cacheKey, smsTarget.$id);
      return smsTarget.$id;
    }

    try {
      const target = await users.createTarget({
        userId: appwriteUserId,
        targetId: ID.unique(),
        providerType: "sms",
        identifier: normalizedPhone,
      });
      targetCache.set(cacheKey, target.$id);
      return target.$id;
    } catch (createError) {
      const isDuplicate =
        createError.type === "target_already_exists" ||
        (createError.message && createError.message.includes("already exists")) ||
        createError.code === 409;

      if (isDuplicate) {
        try {
          const retry = await users.listTargets(appwriteUserId);
          const existingTarget = (retry.targets || []).find((t) => {
            const targetIdentifier = String(t.identifier || "").trim();
            return t.type === "sms" && targetIdentifier === normalizedPhone;
          });
          if (existingTarget) {
            targetCache.set(cacheKey, existingTarget.$id);
            return existingTarget.$id;
          }
        } catch (retryErr) {
          console.debug(`[AppwriteMessaging] Failed to retry SMS target lookup for ${userId}: ${retryErr.message}`);
        }
        return null;
      }
      console.warn(`[AppwriteMessaging] Failed to create SMS target for ${userId}: ${createError.message}`);
      return null;
    }
  } catch (error) {
    console.debug(`[AppwriteMessaging] Failed to ensure SMS target for ${userId}: ${error.message}`);
    return null;
  }
}

/**
 * Send an email via Appwrite Messaging.
 */
async function sendEmail({ userId, email, subject, content, isHtml = true }) {
  try {
    if (!userId || !email || !subject || !content) {
      console.debug("[AppwriteMessaging] sendEmail: missing required fields");
      return;
    }

    const targetId = await ensureEmailTarget(userId, email);
    if (!targetId) {
      console.debug(`[AppwriteMessaging] Skipping email to ${userId}: no Auth target`);
      return;
    }

    await messaging.createEmail({
      messageId: ID.unique(),
      subject,
      content,
      topics: [],
      users: [],
      targets: [targetId],
      cc: [],
      bcc: [],
      attachments: [],
      draft: false,
      html: isHtml,
      scheduledAt: null,
    });
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
      console.debug("[AppwriteMessaging] sendSms: missing required fields");
      return;
    }

    const targetId = await ensureSmsTarget(userId, phone);
    if (!targetId) {
      console.debug(`[AppwriteMessaging] Skipping SMS to ${userId}: no Auth target`);
      return;
    }

    await messaging.createSms({
      messageId: ID.unique(),
      content,
      topics: [],
      users: [],
      targets: [targetId],
      draft: false,
      scheduledAt: null,
    });
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
      console.debug("[AppwriteMessaging] sendPush: missing required fields");
      return;
    }

    const resolveResult = await resolveAppwriteUserId(userId, null);
    if (!resolveResult) {
      console.debug(`[AppwriteMessaging] Cannot send push: user ${userId} not found in Auth`);
      return;
    }

    const config = {
      messageId: ID.unique(),
      title,
      body,
      topics: [],
      users: [resolveResult],
      targets: [],
      draft: false,
      scheduledAt: null,
    };

    // Only include data/action if they have values (avoid Appwrite rejections)
    if (Object.keys(data).length > 0) config.data = data;
    if (action) config.action = action;

    try {
      await messaging.createPush(config);
    } catch (pushError) {
      if (pushError.message && pushError.message.includes("could not be found")) {
        console.debug(`[AppwriteMessaging] Cannot send push: user ${userId} not found in Appwrite`);
        return;
      }
      throw pushError;
    }
  } catch (error) {
    console.warn(`[AppwriteMessaging] Failed to send push to ${userId}:`, error.message);
  }
}

/**
 * Send a notification to a topic (e.g., all vendors, all admins).
 */
async function sendPushToTopic({ topic, title, body, data = {}, action = null }) {
  try {
    if (!topic || !title || !body) {
      console.debug("[AppwriteMessaging] sendPushToTopic: missing required fields");
      return;
    }

    const config = {
      messageId: ID.unique(),
      title,
      body,
      topics: [topic],
      users: [],
      targets: [],
      draft: false,
      scheduledAt: null,
    };

    if (Object.keys(data).length > 0) config.data = data;
    if (action) config.action = action;

    await messaging.createPush(config);
  } catch (error) {
    console.warn(`[AppwriteMessaging] Failed to send push to topic ${topic}:`, error.message);
  }
}

// ── Public exports ────────────────────────────────────────────────

module.exports = {
  sendEmail,
  sendSms,
  sendPush,
  sendPushToTopic,
  resolveAppwriteUserId,
};
