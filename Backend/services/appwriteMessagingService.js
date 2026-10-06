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
const { normalizePhone } = require("../utils/phoneNormalizer");
const { applyEmailTheme } = require("./emailTheme");

const messaging = new Messaging(client);
const users = new Users(client);
const db = new Databases(client);

// In-memory cache of known target IDs to avoid redundant lookups
const targetCache = new Map();

console.log("[AppwriteMessaging] target manager v3: Appwrite-generated target IDs");

function normalizeEmailValue(email) {
  return String(email || "").trim().toLowerCase();
}

// Africa-first E.164 normalization (Kenya default, honours a country hint when supplied).
function normalizePhoneValue(phone, countryHint) {
  return normalizePhone(phone, countryHint);
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
    { collectionId: env.APPWRITE_ADMIN_COLLECTION_ID },
    { collectionId: env.VENDOR_COLLECTION_ID },
  ].filter(c => c.collectionId);

  for (const { collectionId } of collectionsToTry) {
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
      console.debug(`[AppwriteMessaging] DB scan failed for collection ${collectionId}: ${err.message}`);
    }
  }
  return null;
}

async function resolveAuthUserById(userId) {
  if (!userId) return null;

  // Direct Auth check (fastest path)
  try {
    await users.get(userId);
    return userId;
  } catch {}

  // Search DB collections by ID to find the record, then get its email
  const collectionsToTry = [
    { collectionId: env.APPWRITE_ADMIN_COLLECTION_ID },
    { collectionId: env.VENDOR_COLLECTION_ID },
  ].filter(c => c.collectionId);

  for (const { collectionId } of collectionsToTry) {
    try {
      const doc = await db.getDocument(env.APPWRITE_DATABASE_ID, collectionId, userId);
      if (!doc) continue;

      // Document found — try its $id as Auth user ID (usually the same)
      try {
        await users.get(doc.$id);
        return doc.$id;
      } catch {}

      // No Auth account for this ID — try to find Auth user by the doc's email
      const adminEmail = normalizeEmailValue(doc.email);
      if (adminEmail) {
        try {
          const authResult = await users.list([
            Query.equal("email", adminEmail),
            Query.limit(1),
          ]);
          if (authResult.users?.[0]?.$id) return authResult.users[0].$id;
        } catch {}
      }
    } catch {
      // Not in this collection, try next
    }
  }
  return null;
}

async function resolveAppwriteUserId(userId, email) {
  if (!userId) return null;

  // Fast path: userId is already a valid Auth user ID
  try {
    await users.get(userId);
    return userId;
  } catch {}

  // Try email-based Auth lookup first
  const normalizedEmail = normalizeEmailValue(email);
  if (normalizedEmail) {
    try {
      const result = await users.list([
        Query.equal("email", normalizedEmail),
        Query.limit(1),
      ]);
      if (result.users?.[0]?.$id) return result.users[0].$id;
    } catch {}

    // DB scan by email
    const dbResult = await resolveUserIdFromDbCollection(normalizedEmail);
    if (dbResult) return dbResult;
  }

  // Last resort: search DB collections by userId to find the record's email
  const byId = await resolveAuthUserById(userId);
  if (byId) return byId;

  console.debug(
    `[AppwriteMessaging] No Auth user found for userId=${userId} email=${email}`,
  );
  return null;
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
  if (!userId || !normalizedPhone) {
    if (phone) {
      console.debug(`[AppwriteMessaging] Skipping SMS: phone number could not be normalized for user ${userId}`);
    }
    return null;
  }

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
 *
 * @returns {Promise<{success: boolean, reason?: string}>} — never throws; callers that need to
 * distinguish a real send from a silent skip (e.g. NotificationDispatcher) should check `success`.
 */
async function sendEmail({ userId, email, subject, content, isHtml = true }) {
  try {
    if (!userId || !email || !subject || !content) {
      console.debug("[AppwriteMessaging] sendEmail: missing required fields");
      return { success: false, reason: "missing_fields" };
    }

    const targetId = await ensureEmailTarget(userId, email);
    if (!targetId) {
      console.debug(`[AppwriteMessaging] Skipping email to ${userId}: no Auth target`);
      return { success: false, reason: "no_auth_target" };
    }

    await messaging.createEmail({
      messageId: ID.unique(),
      subject,
      content: isHtml ? applyEmailTheme(content) : content,
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
    return { success: true };
  } catch (error) {
    console.warn(`[AppwriteMessaging] Failed to send email to ${userId}:`, error.message);
    return { success: false, reason: error.message };
  }
}

/**
 * Send an SMS via Appwrite Messaging.
 *
 * @returns {Promise<{success: boolean, reason?: string}>} — never throws.
 */
async function sendSms({ userId, phone, content }) {
  try {
    if (!userId || !phone || !content) {
      console.debug("[AppwriteMessaging] sendSms: missing required fields");
      return { success: false, reason: "missing_fields" };
    }

    const targetId = await ensureSmsTarget(userId, phone);
    if (!targetId) {
      console.debug(`[AppwriteMessaging] Skipping SMS to ${userId}: no Auth target`);
      return { success: false, reason: "no_auth_target" };
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
    return { success: true };
  } catch (error) {
    console.warn(`[AppwriteMessaging] Failed to send SMS to ${userId}:`, error.message);
    return { success: false, reason: error.message };
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
      return { success: false, reason: "missing_fields" };
    }

    const resolveResult = await resolveAppwriteUserId(userId, null);
    if (!resolveResult) {
      console.debug(`[AppwriteMessaging] Cannot send push: user ${userId} not found in Auth`);
      return { success: false, reason: "no_auth_target" };
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
      return { success: true };
    } catch (pushError) {
      if (pushError.message && pushError.message.includes("could not be found")) {
        console.debug(`[AppwriteMessaging] Cannot send push: user ${userId} not found in Appwrite`);
        return { success: false, reason: "no_auth_target" };
      }
      throw pushError;
    }
  } catch (error) {
    console.warn(`[AppwriteMessaging] Failed to send push to ${userId}:`, error.message);
    return { success: false, reason: error.message };
  }
}

/**
 * Send email, SMS, and/or push to a single user.
 * Uses userId + email/phone to resolve the correct Auth target.
 * All channels are attempted independently — failures in one don't block others.
 */
async function notifyUser({ userId, email, phone, emailSubject, emailContent, smsContent, pushTitle, pushBody, pushData, pushAction }) {
  // Send email if we have email subject/content
  if (emailSubject && emailContent) {
    await sendEmail({ userId, email, subject: emailSubject, content: emailContent });
  }
  // Send SMS if we have phone and content
  if (phone && smsContent) {
    await sendSms({ userId, phone, content: smsContent });
  }
  // Send push if we have title/body
  if (pushTitle && pushBody) {
    await sendPush({ userId, title: pushTitle, body: pushBody, data: pushData, action: pushAction });
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
  notifyUser,
  resolveAppwriteUserId,
};
