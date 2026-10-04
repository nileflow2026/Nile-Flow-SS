const { ID, Query } = require("node-appwrite");
const crypto = require("crypto");
const { users, account, avatars } = require("../../src/appwrite");
const { instrumentedDb } = require("../../services/appwriteService");
const {
  getUserCached,
  invalidateUserCache,
} = require("../../services/userCacheService");
const {
  createNotificationInternal,
} = require("../../controllers/UserControllers/Clientnotification");

const { env } = require("../../src/env");
const {
  sendVerificationEmail,
  storeVerificationCode,
  sendLoginAlertEmail,
  getVerificationCodeRecord,
  getStoredVerificationCode,
  deleteVerificationCode,
  markUserAsVerified,
} = require("../../services/send-confirmation");
const { isCustomerEmailVerified } = require("../../utils/customerAuthPolicy");
const { maskEmailAddress } = require("../../utils/maskEmailAddress");
const {
  addNileMilesOnReferral,
} = require("../../controllers/AdminControllers/rewardController");
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  verifyAccessToken,
  hashToken,
  timeframeToMs,
} = require("../../utils/tokenManager");
const {
  consumeOAuthRecord,
  getOAuthRecord,
  replaceOAuthRecord,
  storeOAuthRecord,
} = require("../../services/oauthHandoffStore");

// Ensure critical env values exist
if (
  !env.APPWRITE_DATABASE_ID ||
  !env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID ||
  !env.APPWRITE_USER_COLLECTION_ID
) {
  throw new Error(
    "Missing Appwrite collection env variables. Please set APPWRITE_DATABASE_ID, APPWRITE_REFRESH_TOKEN_COLLECTION_ID, APPWRITE_USER_COLLECTION_ID.",
  );
}

// Lightweight structured logger
const log = {
  info: (...args) => console.info("[customer-auth]", ...args),
  warn: (...args) => console.warn("[customer-auth]", ...args),
  error: (...args) => console.error("[customer-auth]", ...args),
};

/**
 * Get appropriate cookie domain based on request origin
 */
function getCookieDomain(req) {
  const origin = req.get("origin") || req.get("referer");
  const host = req.headers.host;
  const protocol = req.headers["x-forwarded-proto"] || req.protocol || "http";

  console.log("[Cookie Domain Debug]", {
    origin,
    host,
    protocol,
    isSecure: protocol === "https",
  });

  // Check if backend and frontend are on different domains (cross-origin)
  const isCrossOrigin =
    origin &&
    host &&
    !origin.includes(host) &&
    !host.includes(origin.replace("https://", "").replace("http://", ""));

  if (isCrossOrigin) {
    console.log("[Cookie] Cross-origin detected - no domain restriction");
    return {
      domain: undefined, // No domain restriction for cross-origin
      secure: protocol === "https",
      sameSite: "none", // Required for cross-origin cookies
    };
  }

  function setCustomerSessionCookies(req, res, accessToken, refreshToken) {
    const cookieConfig = getCookieDomain(req);
    const cookieOptions = {
      httpOnly: true,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: "/",
    };

    if (cookieConfig.domain) {
      cookieOptions.domain = cookieConfig.domain;
    }

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  // Development - no domain restriction
  if (
    !origin ||
    origin.includes("localhost") ||
    origin.includes("127.0.0.1") ||
    (host && host.includes("localhost"))
  ) {
    console.log("[Cookie] Using localhost - no domain restriction");
    return { domain: undefined, secure: false, sameSite: "lax" };
  }

  // Same-origin production domains
  if (
    (origin && origin.includes("nileflowafrica.com")) ||
    (host && host.includes("nileflowafrica.com"))
  ) {
    console.log("[Cookie] Using nileflowafrica.com domain (same-origin)");
    return {
      domain: ".nileflowafrica.com",
      secure: protocol === "https",
      sameSite: "lax",
    };
  }

  // nileflow.co.ke domain
  if (
    (origin && origin.includes("nileflow.co.ke")) ||
    (host && host.includes("nileflow.co.ke"))
  ) {
    console.log("[Cookie] Using nileflow.co.ke domain (same-origin)");
    return {
      domain: ".nileflow.co.ke",
      secure: protocol === "https",
      sameSite: "lax",
    };
  }

  // Default - no domain restriction
  console.log("[Cookie] Using default - no domain restriction");
  return {
    domain: undefined,
    secure: protocol === "https",
    sameSite: "lax",
  };
}

/**
 * Persist refresh token (store hashed token only) into Appwrite refresh_tokens collection.
 */
async function persistRefreshToken({
  userId,
  refreshToken,
  ip = null,
  userAgent = null,
  deviceId = null,
  rotatedFrom = null,
}) {
  const hashedRefreshToken = hashToken(refreshToken);
  const expiresAt = new Date(
    Date.now() + timeframeToMs(env.JWT_REFRESH_EXPIRES_IN || "30d"),
  ).toISOString();
  const docId = ID.unique();

  return instrumentedDb.createDocument(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
    docId,
    {
      userId,
      refreshToken: hashedRefreshToken,
      expiresAt,
      revoked: false,
      createdAt: new Date().toISOString(),
      ip,
      userAgent,
      deviceId,
      rotatedFrom,
    },
  );
}

/**
 * Find persisted refresh token record by hash
 */
async function findRefreshTokenRecordByHash(refreshToken) {
  const tokenHash = hashToken(refreshToken);
  const result = await instrumentedDb.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
    [Query.equal("refreshToken", tokenHash)],
  );

  if (!result || !result.documents || result.documents.length === 0)
    return null;
  return result.documents[0];
}

/**
 * Find tokens for a user + device
 */
async function findTokensByUserAndDevice(userId, deviceId, userAgent) {
  if (deviceId) {
    const res = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
      [Query.equal("userId", userId), Query.equal("deviceId", deviceId)],
    );
    return res?.documents || [];
  }
  if (userAgent) {
    const res = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
      [Query.equal("userId", userId), Query.equal("userAgent", userAgent)],
    );
    return res?.documents || [];
  }
  const res = await instrumentedDb.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
    [Query.equal("userId", userId)],
  );
  return res?.documents || [];
}

/**
 * Revoke a refresh token by document id
 */
async function revokeRefreshTokenById(docId) {
  return instrumentedDb.updateDocument(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
    docId,
    { revoked: true, revokedAt: new Date().toISOString() },
  );
}

/**
 * Revoke all refresh tokens for a user
 */
async function revokeAllUserRefreshTokens(userId) {
  const res = await instrumentedDb.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
    [Query.equal("userId", userId)],
  );

  if (!res || !res.documents) return 0;

  let count = 0;
  for (const doc of res.documents) {
    if (!doc.revoked) {
      await instrumentedDb.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
        doc.$id,
        {
          revoked: true,
          revokedAt: new Date().toISOString(),
        },
      );
      count++;
    }
  }
  return count;
}

/**
 * Sanitize user object for client
 */
function sanitizeUser(userObj) {
  return {
    id: userObj.$id,
    email: userObj.email,
    username: userObj.name || userObj.prefs?.username || null,
    role: userObj.prefs?.role || "customer",
    avatar: userObj.prefs?.avatar || null,
    phone: userObj.prefs?.phone || userObj.phone || null,
    createdAt: userObj.$registration || null,
  };
}

/* --------------------- Controllers --------------------- */

/**
 * Signup Customer
 */
const signupcustomer = async (req, res) => {
  const { password, username, phone } = req.body;
  const email = String(req.body?.email || "").trim().toLowerCase();

  // Basic validation
  if (!email || !password || !username) {
    return res.status(400).json({
      error: "Email, password, and username are required.",
    });
  }

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    return res.status(400).json({ error: "Invalid email format" });
  }

  if (String(password).length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters",
    });
  }

  let createdUser = null;
  let profile = null;

  try {
    const existingUsers = await users.list([
      Query.equal("email", email),
      Query.limit(1),
    ]);
    const existingUser = existingUsers.users[0];
    if (existingUser) {
      if (isCustomerEmailVerified(existingUser)) {
        return res.status(409).json({
          success: false,
          code: "ACCOUNT_ALREADY_EXISTS",
          error: "An account with this email already exists. Please sign in.",
        });
      }

      const verificationRecord = await getVerificationCodeRecord(email);
      const ageInMs = verificationRecord
        ? Date.now() - new Date(verificationRecord.createdAt).getTime()
        : 60 * 1000;
      return res.status(200).json({
        success: true,
        verificationRequired: true,
        message: "Verify your email to finish creating your account.",
        resendAfterSeconds: Math.max(
          0,
          Math.ceil((60 * 1000 - ageInMs) / 1000),
        ),
        user: {
          id: existingUser.$id,
          email: existingUser.email,
          username: existingUser.name,
          role: "customer",
        },
      });
    }

    const documentId = ID.unique();
    createdUser = await users.create(
      documentId,
      email,
      null,
      password,
      username,
    );

    // 2) Get avatar initials
    const avatarUrl = avatars.getInitials(username);

    await users.updatePrefs(createdUser.$id, {
      theme: "light",
      role: "customer",
      avatar: avatarUrl,
      phone: phone || "",
      isVerified: false,
    });

    profile = await instrumentedDb.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      createdUser.$id,
      {
        email: createdUser.email,
        username: createdUser.name,
        role: "customer",
        phone: phone || null,
        isVerified: false,
        createdAt: new Date().toISOString(),
      },
    );

    await invalidateUserCache(createdUser.$id);

    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    await storeVerificationCode(email, verificationCode);

    try {
      await sendVerificationEmail({
        customerEmail: email,
        customerName: username,
        verificationCode,
      });
    } catch {
      log.error("Customer verification email delivery failed.");
      return res.status(503).json({
        success: false,
        code: "VERIFICATION_EMAIL_DELIVERY_FAILED",
        error: "Your account was created, but the verification email could not be sent. Please try again shortly.",
        verificationRequired: true,
        resendAfterSeconds: 60,
        expiresInSeconds: 15 * 60,
        user: {
          id: createdUser.$id,
          email: createdUser.email,
          username: createdUser.name,
          role: "customer",
        },
      });
    }

    try {
      await createNotificationInternal({
        message: `🎉 ${username} just signed up!`,
        type: "user",
        username: createdUser.name,
        userId: createdUser.$id,
      });
    } catch (notifErr) {
      log.warn("Failed to create notification:", notifErr?.message);
    }

    return res.status(201).json({
      success: true,
      verificationRequired: true,
      message: "Verification code sent. Verify your email to finish creating your account.",
      expiresInSeconds: 15 * 60,
      resendAfterSeconds: 60,
      user: {
        id: createdUser.$id,
        email: createdUser.email,
        username: createdUser.name,
        role: "customer",
        phone: phone || null,
        avatar: avatarUrl,
      },
      profile,
    });
  } catch (error) {
    log.error("Customer signup failed.");

    if (createdUser) {
      try {
        if (profile) {
          await instrumentedDb.deleteDocument(
            env.APPWRITE_DATABASE_ID,
            env.APPWRITE_USER_COLLECTION_ID,
            profile.$id,
          );
        }
        await users.delete(createdUser.$id);
      } catch (delErr) {
        log.error("Pending signup cleanup failed:", delErr?.message);
      }
    }

    if (error.code === 409) {
      return res.status(409).json({
        success: false,
        code: "ACCOUNT_ALREADY_EXISTS",
        error: "User with this email already exists.",
      });
    }

    return res.status(503).json({
      success: false,
      code: "SIGNUP_UNAVAILABLE",
      error: "Signup failed. Please try again.",
    });
  }
};

/**
 * Signin Customer
 */
const signincustomer = async (req, res) => {
  const { password, deviceId } = req.body;
  const email = String(req.body?.email || "").trim().toLowerCase();

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required.",
    });
  }

  let session;
  try {
    session = await account.createEmailPasswordSession(email, password);
  } catch (error) {
    log.warn("Customer sign in credentials were rejected.");
    if (
      error.code === 401 ||
      /credentials|password|authentication/i.test(String(error.message || ""))
    ) {
      return res.status(401).json({
        success: false,
        code: "INVALID_CREDENTIALS",
        error: "Invalid email or password.",
      });
    }
    log.error("Customer sign in unavailable:", error?.message || error);
    return res.status(503).json({
      success: false,
      code: "SIGNIN_UNAVAILABLE",
      error: "Sign in is temporarily unavailable. Please try again.",
    });
  }

  let user;
  try {
    user = await users.get(session.userId);
  } catch (error) {
    await users.deleteSession(session.userId, session.$id).catch((cleanupError) =>
      log.error("Could not remove an incomplete Appwrite sign in session:", cleanupError?.message),
    );
    log.error("Customer status lookup failed:", error?.message || error);
    return res.status(503).json({
      success: false,
      code: "CUSTOMER_STATUS_UNAVAILABLE",
      error: "Sign in is temporarily unavailable. Please try again.",
    });
  }

  if (!isCustomerEmailVerified(user)) {
    await users.deleteSession(session.userId, session.$id).catch((cleanupError) =>
      log.error("Could not remove an unverified Appwrite sign in session:", cleanupError?.message),
    );
    return res.status(403).json({
      success: false,
      code: "EMAIL_NOT_VERIFIED",
      error: "Verify your email before signing in.",
      verificationRequired: true,
    });
  }

  try {
    const role = user.prefs?.role || "customer";

    const accessPayload = { sub: user.$id, role };
    const accessToken = signAccessToken(accessPayload);

    const refreshPayload = { sub: user.$id };
    const refreshToken = signRefreshToken(refreshPayload);

    await persistRefreshToken({
      userId: user.$id,
      refreshToken,
      ip: req.ip || null,
      userAgent: req.headers?.["user-agent"] || null,
      deviceId: deviceId || null,
      rotatedFrom: null,
    });

    setCustomerSessionCookies(req, res, accessToken, refreshToken);
    log.info("Customer sign in successful.");

    // Send login alert email if the user has opted in (best-effort, non-blocking)
    const loginAlertsEnabled =
      user.prefs?.loginAlerts === true || user.prefs?.loginAlerts === "true";
    if (loginAlertsEnabled) {
      sendLoginAlertEmail({
        customerEmail: user.email,
        customerName: user.name || user.prefs?.username || null,
        ip: req.ip || null,
        userAgent: req.headers?.["user-agent"] || null,
        timestamp: new Date().toISOString(),
      }).catch(() => {}); // fire-and-forget
    }

    return res.status(200).json({
      success: true,
      message: "Signin successful",
      accessToken,
      user: sanitizeUser(user),
    });
  } catch (error) {
    await users.deleteSession(session.userId, session.$id).catch((cleanupError) =>
      log.error("Could not remove an incomplete customer session:", cleanupError?.message),
    );
    log.error("Customer sign in session setup failed:", error?.message || error);
    return res.status(503).json({
      success: false,
      code: "SESSION_SETUP_FAILED",
      error: "Sign in is temporarily unavailable. Please try again.",
    });
  }
};

/**
 * Handle Refresh Token for Customer
 */
const handleRefreshToken = async (req, res) => {
  try {
    const nativeRefresh = Boolean(req.body?.refreshToken);
    const refreshToken =
      req.body?.refreshToken || req.cookies?.refreshToken;
    const { deviceId } = req.body || {};

    if (!refreshToken) {
      return res.status(400).json({ error: "Missing refresh token." });
    }

    // 1) Verify signature
    let decoded;
    try {
      decoded = verifyRefreshToken(refreshToken);
    } catch (verifyErr) {
      log.warn("Refresh token verification failed:", verifyErr?.message);
      return res.status(401).json({ error: "Invalid refresh token." });
    }

    const userId = decoded.sub;
    if (!userId) {
      return res.status(401).json({ error: "Invalid refresh token payload." });
    }

    // 2) Find persisted token record
    const record = await findRefreshTokenRecordByHash(refreshToken);
    if (!record) {
      log.warn("Refresh token record not found for user:", userId);
      await revokeAllUserRefreshTokens(userId).catch((e) =>
        log.error("Error revoking all tokens:", e),
      );
      return res.status(401).json({ error: "Invalid refresh token." });
    }

    // 3) Check if revoked or expired
    if (record.revoked) {
      log.warn("Revoked refresh token used for user:", userId);
      await revokeAllUserRefreshTokens(userId).catch((e) =>
        log.error("Error revoking all tokens:", e),
      );
      return res.status(401).json({ error: "Refresh token revoked." });
    }

    if (new Date(record.expiresAt) < new Date()) {
      await revokeRefreshTokenById(record.$id).catch((e) =>
        log.error("Error revoking expired token:", e),
      );
      return res.status(401).json({ error: "Refresh token expired." });
    }

    // 4) Device scoping
    const requestDeviceId = deviceId || req.body.deviceId || null;
    const requestUserAgent = req.headers?.["user-agent"] || null;

    // 5) Find tokens for this user+device
    const deviceTokens = await findTokensByUserAndDevice(
      userId,
      requestDeviceId,
      requestUserAgent,
    );

    if (!deviceTokens || deviceTokens.length === 0) {
      log.warn("No device-scoped tokens found for user:", userId);
      await revokeAllUserRefreshTokens(userId).catch((e) =>
        log.error("Error revoking all tokens:", e),
      );
      return res.status(401).json({ error: "Invalid refresh token." });
    }

    // 6) Check for token reuse with grace period
    const presentedCreatedAt = new Date(record.createdAt).getTime();
    const GRACE_PERIOD_MS = 5000; // 5 seconds
    let foundNewer = false;

    for (const t of deviceTokens) {
      const tCreated = new Date(t.createdAt).getTime();
      const timeDiff = tCreated - presentedCreatedAt;

      if (t.$id !== record.$id && !t.revoked && timeDiff > GRACE_PERIOD_MS) {
        foundNewer = true;
        break;
      }
    }

    if (foundNewer) {
      log.warn("Refresh token reuse detected for user:", userId);
      await revokeAllUserRefreshTokens(userId).catch((e) =>
        log.error("Error revoking all tokens:", e),
      );
      return res.status(401).json({
        error: "Refresh token reuse detected. All sessions revoked.",
      });
    }

    // 7) Load user (cached)
    const user = await users.get(userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (!isCustomerEmailVerified(user)) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        error: "Verify your email before refreshing this session.",
      });
    }

    // 8) Issue new tokens
    const newAccessPayload = {
      sub: user.$id,
      role: user.prefs?.role || "customer",
    };
    const newAccessToken = signAccessToken(newAccessPayload);

    const newRefreshPayload = { sub: user.$id };
    const newRefreshToken = signRefreshToken(newRefreshPayload);

    // 9) Persist new refresh token
    let newDoc = null;
    try {
      newDoc = await persistRefreshToken({
        userId: user.$id,
        refreshToken: newRefreshToken,
        ip: req.ip || null,
        userAgent: requestUserAgent,
        deviceId: requestDeviceId,
        rotatedFrom: record.$id,
      });
    } catch (persistErr) {
      log.error(
        "Failed to persist rotated refresh token:",
        persistErr?.message,
      );

      if (nativeRefresh) {
        return res.status(503).json({
          success: false,
          code: "TOKEN_ROTATION_UNAVAILABLE",
          error: "Your session could not be renewed. Please retry.",
        });
      }

      // Return access token only for existing cookie clients.
      const cookieConfig = getCookieDomain(req);
      const cookieOptions = {
        httpOnly: true,
        secure: cookieConfig.secure,
        sameSite: cookieConfig.sameSite,
        maxAge: 15 * 60 * 1000,
        path: "/",
      };

      if (cookieConfig.domain) {
        cookieOptions.domain = cookieConfig.domain;
      }

      console.log("[Refresh Fallback] Cookie options:", cookieOptions);
      res.cookie("accessToken", newAccessToken, cookieOptions);
      return res.status(200).json({ message: "Token refreshed (partial)" });
    }

    // 10) Revoke old token
    try {
      await revokeRefreshTokenById(record.$id);
      await instrumentedDb
        .updateDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
          record.$id,
          {
            rotatedTo: newDoc.$id,
            rotatedAt: new Date().toISOString(),
          },
        )
        .catch(() => {}); // Non-fatal
    } catch (revErr) {
      log.error("Failed to revoke old refresh token:", revErr?.message);
      if (nativeRefresh) {
        await revokeRefreshTokenById(newDoc.$id).catch((cleanupError) =>
          log.error("Could not revoke incomplete native token rotation:", cleanupError?.message),
        );
        return res.status(503).json({
          success: false,
          code: "TOKEN_ROTATION_UNAVAILABLE",
          error: "Your session could not be renewed. Please retry.",
        });
      }
    }

    if (nativeRefresh) {
      return res.status(200).json({
        success: true,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        expiresIn: Math.floor(
          timeframeToMs(env.JWT_EXPIRES_IN || "15m") / 1000,
        ),
      });
    }

    // 11) Set new cookies
    const cookieConfig = getCookieDomain(req);
    const cookieOptions = {
      httpOnly: true,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: "/",
    };

    if (cookieConfig.domain) {
      cookieOptions.domain = cookieConfig.domain;
    }

    console.log("[Refresh] Cookie options:", cookieOptions);

    res.cookie("accessToken", newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000,
    });

    res.cookie("refreshToken", newRefreshToken, {
      ...cookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({ message: "Tokens refreshed" });
  } catch (error) {
    log.error("Customer token refresh failed:", error?.message || error);
    return res.status(503).json({
      success: false,
      code: "REFRESH_UNAVAILABLE",
      error: "Your session could not be checked. Please retry.",
    });
  }
};

/**
 * Logout Customer
 */
const logoutcustomer = async (req, res) => {
  try {
    const nativeRefreshToken = req.body?.refreshToken;
    if (nativeRefreshToken) {
      let decodedRefresh;
      try {
        decodedRefresh = verifyRefreshToken(nativeRefreshToken);
      } catch {
        return res.status(401).json({
          success: false,
          code: "INVALID_REFRESH_TOKEN",
          error: "The session is no longer valid.",
        });
      }
      if (decodedRefresh.sub !== req.user?.userId) {
        return res.status(401).json({
          success: false,
          code: "REFRESH_TOKEN_USER_MISMATCH",
          error: "The session does not belong to the signed in customer.",
        });
      }
      const record = await findRefreshTokenRecordByHash(nativeRefreshToken);
      if (!record || record.userId !== req.user.userId || record.revoked) {
        return res.status(401).json({
          success: false,
          code: "INVALID_REFRESH_TOKEN",
          error: "The session is no longer valid.",
        });
      }
      try {
        await revokeRefreshTokenById(record.$id);
      } catch (error) {
        log.error("Native customer logout revocation failed:", error?.message);
        return res.status(503).json({
          success: false,
          code: "LOGOUT_UNAVAILABLE",
          error: "Your session could not be revoked. Please retry.",
        });
      }
    }

    const refreshToken = nativeRefreshToken ? null : req.cookies.refreshToken;

    if (refreshToken) {
      // Try to decode to get userId
      let decoded = null;
      try {
        decoded = verifyRefreshToken(refreshToken);
      } catch (e) {
        // Invalid signature, continue anyway
      }

      const hashedRefreshToken = hashToken(refreshToken);

      const queries =
        decoded && decoded.sub
          ? [
              Query.equal("refreshToken", hashedRefreshToken),
              Query.equal("userId", decoded.sub),
            ]
          : [Query.equal("refreshToken", hashedRefreshToken)];

      const result = await db.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_REFRESH_TOKEN_COLLECTION_ID,
        queries,
      );

      if (result && result.documents && result.documents.length > 0) {
        for (const doc of result.documents) {
          if (!doc.revoked) {
            await revokeRefreshTokenById(doc.$id).catch((e) =>
              log.error("Failed to revoke token in logout:", e),
            );
          }
        }
      }
    }

    // Clear cookies
    const cookieConfig = getCookieDomain(req);
    const clearOptions = {
      httpOnly: true,
      secure: cookieConfig.secure,
      sameSite: cookieConfig.sameSite,
      path: "/",
    };

    if (cookieConfig.domain) {
      clearOptions.domain = cookieConfig.domain;
    }

    console.log("[Logout] Clear cookie options:", clearOptions);
    res.clearCookie("accessToken", clearOptions);
    res.clearCookie("refreshToken", clearOptions);

    return res.status(200).json({ message: "Logged out successfully." });
  } catch (error) {
    log.error("Customer logout failed:", error?.message || error);
    return res.status(500).json({ error: "Logout failed." });
  }
};

/**
 * Get Current Customer User
 */
const getCurrentCustomer = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await users.get(userId);

    let profile = null;
    try {
      profile = await instrumentedDb.getDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_USER_COLLECTION_ID,
        userId,
      );
    } catch {
      log.warn("Customer profile is not available.");
    }

    const userData = sanitizeUser(user);
    userData.isVerified = isCustomerEmailVerified(user);

    if (profile) {
      userData.avatarUrl = profile.avatarUrl || user.prefs?.avatar || null;
      userData.avatarFileId = profile.avatarFileId || null;
      userData.phone = profile.phone || user.prefs?.phone || null;
    } else {
      userData.avatarUrl = user.prefs?.avatar || null;
      userData.phone = user.prefs?.phone || null;
    }

    return res.status(200).json({
      user: userData,
    });
  } catch (error) {
    log.error("Get current customer failed:", error?.message || error);
    if (error.code === 404) {
      return res.status(401).json({
        success: false,
        code: "INVALID_SESSION",
        error: "Customer account is not available.",
      });
    }
    return res.status(503).json({
      success: false,
      code: "CUSTOMER_PROFILE_UNAVAILABLE",
      error: "Your account could not be checked. Please retry.",
    });
  }
};

const verifyCustomerEmail = async (req, res) => {
  const email = String(req.body?.email || "").trim().toLowerCase();
  const verificationCode = String(req.body?.verificationCode || "").trim();
  const { deviceId } = req.body || {};

  if (!/^\S+@\S+\.\S+$/.test(email) || !/^\d{6}$/.test(verificationCode)) {
    return res.status(400).json({
      success: false,
      code: "INVALID_VERIFICATION_INPUT",
      error: "A valid email and six digit verification code are required.",
    });
  }

  try {
    const storedCode = await getStoredVerificationCode(email);
    if (!storedCode || storedCode !== verificationCode) {
      return res.status(400).json({
        success: false,
        code: "INVALID_OR_EXPIRED_CODE",
        error: "Invalid or expired verification code.",
      });
    }

    await markUserAsVerified(email);
    await deleteVerificationCode(email);

    const matchingUsers = await users.list([
      Query.equal("email", email),
      Query.limit(1),
    ]);
    const user = matchingUsers.users[0];
    if (!user || !isCustomerEmailVerified(user)) {
      throw new Error("Verified customer could not be loaded.");
    }

    await invalidateUserCache(user.$id);

    const accessToken = signAccessToken({
      sub: user.$id,
      role: user.prefs?.role || "customer",
    });
    const refreshToken = signRefreshToken({ sub: user.$id });
    await persistRefreshToken({
      userId: user.$id,
      refreshToken,
      ip: req.ip || null,
      userAgent: req.headers?.["user-agent"] || null,
      deviceId: deviceId || null,
      rotatedFrom: null,
    });
    setCustomerSessionCookies(req, res, accessToken, refreshToken);

    const profile = await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      user.$id,
    );

    return res.status(200).json({
      success: true,
      message: "Email verified successfully.",
      accessToken,
      user: {
        ...sanitizeUser(user),
        isVerified: true,
      },
      profile,
    });
  } catch (error) {
    log.error("Customer email verification failed:", error?.message || error);
    return res.status(503).json({
      success: false,
      code: "VERIFICATION_UNAVAILABLE",
      error: "Verification is temporarily unavailable. Please try again.",
    });
  }
};

// controllers/customerAuthController.js

/**
 * Get customer preferences
 */
const getCustomerPreferences = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const user = await getUserCached(userId);

    // Return user preferences
    return res.status(200).json({
      preferences: user.prefs || {},
      preferredPaymentMethod: user.prefs?.preferredPaymentMethod || null,
    });
  } catch (error) {
    log.error("Get customer preferences failed:", error?.message || error);
    if (error.code === 404) {
      return res.status(401).json({
        success: false,
        code: "INVALID_SESSION",
        error: "Customer account is not available.",
      });
    }
    return res.status(503).json({
      success: false,
      code: "CUSTOMER_PREFERENCES_UNAVAILABLE",
      error: "Your preferences could not be checked. Please retry.",
    });
  }
};

/**
 * Update customer preferences
 */
const updateCustomerPreferences = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { preferredPaymentMethod, ...requestedPrefs } = req.body;
    const otherPrefs = { ...requestedPrefs };
    delete otherPrefs.isVerified;
    delete otherPrefs.role;

    // Get current prefs (cached)
    const user = await getUserCached(userId);
    const currentPrefs = user.prefs || {};

    // Update prefs
    const updatedPrefs = {
      ...currentPrefs,
      ...otherPrefs,
    };

    if (preferredPaymentMethod) {
      updatedPrefs.preferredPaymentMethod = preferredPaymentMethod;
    }

    await users.updatePrefs(userId, updatedPrefs);

    return res.status(200).json({
      message: "Preferences updated successfully",
      preferences: updatedPrefs,
    });
  } catch (error) {
    log.error("Update customer preferences failed:", error?.message || error);
    return res.status(500).json({ error: "Failed to update preferences" });
  }
};

/**
 * Update customer profile (username, phone)
 */
const updateCustomerProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const { username, phone } = req.body;

    if (
      !username ||
      typeof username !== "string" ||
      username.trim().length < 2
    ) {
      return res
        .status(400)
        .json({ error: "Username must be at least 2 characters." });
    }

    const trimmedUsername = username.trim().slice(0, 128);

    // Update Appwrite name
    await users.updateName(userId, trimmedUsername);

    // Update phone in prefs (cached)
    const user = await getUserCached(userId);
    const currentPrefs = user.prefs || {};
    await users.updatePrefs(userId, {
      ...currentPrefs,
      phone: phone ? phone.trim() : currentPrefs.phone || "",
    });

    return res.status(200).json({
      message: "Profile updated successfully",
      username: trimmedUsername,
      phone: phone ? phone.trim() : currentPrefs.phone || "",
    });
  } catch (error) {
    log.error("Update customer profile failed:", error?.message || error);
    return res.status(500).json({ error: "Failed to update profile" });
  }
};

/* ====================================================================
   OAuth Helpers
   ==================================================================== */

/**
 * Upsert user for OAuth flows using Appwrite Users and profile collection
 */
async function upsertOAuthUser({ email, name, avatarUrl, provider, subject }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const subjectField =
    provider === "google" ? "googleSubject" : "facebookSubject";
  const linkedProfiles = await instrumentedDb.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_USER_COLLECTION_ID,
    [Query.equal(subjectField, subject), Query.limit(1)],
  );
  const emailProfiles = await instrumentedDb.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_USER_COLLECTION_ID,
    [Query.equal("email", normalizedEmail), Query.limit(1)],
  );
  const profileBySubject = linkedProfiles.documents[0] || null;
  const profileByEmail = emailProfiles.documents[0] || null;

  if (
    profileByEmail?.[subjectField] &&
    profileByEmail[subjectField] !== subject
  ) {
    const error = new Error("A different provider account is already linked.");
    error.code = "OAUTH_IDENTITY_CONFLICT";
    throw error;
  }

  if (
    profileBySubject &&
    profileByEmail &&
    profileBySubject.$id !== profileByEmail.$id
  ) {
    const error = new Error("OAuth identity is already linked to another account.");
    error.code = "OAUTH_IDENTITY_CONFLICT";
    throw error;
  }

  let profile = profileBySubject || profileByEmail;
  let userId = profile?.$id;
  if (!userId) {
    const existingUsers = await users.list([
      Query.equal("email", normalizedEmail),
      Query.limit(1),
    ]);
    const existingUser = existingUsers.users[0];
    if (existingUser) {
      userId = existingUser.$id;
    } else {
      const randomPassword = `oauth-${crypto.randomBytes(24).toString("hex")}`;
      const created = await users.create(
        ID.unique(),
        normalizedEmail,
        null,
        randomPassword,
        name,
      );
      userId = created.$id;
    }
  }

  const currentUser = await users.get(userId);
  await users.updateEmailVerification(userId, true);
  await users.updatePrefs(userId, {
    ...(currentUser.prefs || {}),
    role: "customer",
    avatar:
      avatarUrl || currentUser.prefs?.avatar || avatars.getInitials(name),
    isVerified: true,
  });

  const profileValues = {
    email: profile?.email || normalizedEmail,
    username: name,
    role: "customer",
    avatarUrl: avatarUrl || profile?.avatarUrl || null,
    phone: profile?.phone || currentUser.phone || null,
    isVerified: true,
    [subjectField]: subject,
  };

  if (profile) {
    await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      profile.$id,
      profileValues,
    );
  } else {
    profile = await instrumentedDb.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      userId,
      { ...profileValues, createdAt: new Date().toISOString() },
    );
  }

  await invalidateUserCache(userId);
  return userId;
}

/* ====================================================================
   Google OAuth
   ==================================================================== */

/**
 * Generate Google OAuth authorization URL
 * Supports optional ?redirect_uri query param for mobile deep links.
 */
const MOBILE_OAUTH_REDIRECT_URI = "nileflowapp://oauth/callback";

function appendOAuthParams(redirectUri, params) {
  const separator = redirectUri.includes("?") ? "&" : "?";
  return `${redirectUri}${separator}${new URLSearchParams(params).toString()}`;
}

async function createOAuthExchangeCode(userId, provider) {
  const code = crypto.randomBytes(32).toString("base64url");
  const key = `oauth:exchange:${crypto
    .createHash("sha256")
    .update(code)
    .digest("hex")}`;
  await storeOAuthRecord(key, { userId, provider }, 60);
  return code;
}

async function createOAuthPendingHandoff({
  provider,
  subject,
  email,
  name,
  avatarUrl,
}) {
  const pendingId = crypto.randomBytes(32).toString("base64url");
  await storeOAuthRecord(
    `oauth:pending:${pendingId}`,
    { provider, subject, email: email || null, name, avatarUrl },
    15 * 60,
  );
  return pendingId;
}

async function createProviderOAuthUrl(req, res, provider) {
  try {
    const isGoogle = provider === "google";
    const clientId = isGoogle ? env.GOOGLE_CLIENT_ID : env.FACEBOOK_APP_ID;
    const providerRedirectUri = isGoogle
      ? env.GOOGLE_REDIRECT_URI
      : env.FACEBOOK_REDIRECT_URI;
    if (!clientId || !providerRedirectUri) {
      return res.status(503).json({
        success: false,
        code: "OAUTH_PROVIDER_UNAVAILABLE",
        error: `${isGoogle ? "Google" : "Facebook"} sign in is not configured.`,
      });
    }

    const requestedRedirect = String(req.query.redirect_uri || "");
    if (
      requestedRedirect &&
      requestedRedirect !== MOBILE_OAUTH_REDIRECT_URI
    ) {
      return res.status(400).json({
        success: false,
        code: "OAUTH_REDIRECT_NOT_ALLOWED",
        error: "The requested sign in return address is not allowed.",
      });
    }

    const state = crypto.randomBytes(32).toString("base64url");
    await storeOAuthRecord(
      `oauth:state:${state}`,
      { provider, redirectUri: requestedRedirect || null },
      10 * 60,
    );

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: providerRedirectUri,
      response_type: "code",
      scope: isGoogle ? "openid email profile" : "email,public_profile",
      state,
    });
    if (isGoogle) {
      params.set("access_type", "offline");
      params.set("prompt", "consent");
    }
    const authUrl = isGoogle
      ? `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
      : `https://www.facebook.com/v18.0/dialog/oauth?${params.toString()}`;
    return res.json({ authUrl });
  } catch (error) {
    log.error(`${provider} OAuth URL error:`, error?.message || error);
    const unavailable = error.code === "OAUTH_REDIS_UNAVAILABLE";
    return res.status(unavailable ? 503 : 500).json({
      success: false,
      code: unavailable ? "OAUTH_REDIS_UNAVAILABLE" : "OAUTH_URL_FAILED",
      error: unavailable
        ? "Secure sign in is temporarily unavailable. Please try again."
        : "Could not start secure sign in.",
    });
  }
}

const getGoogleOAuthUrl = (req, res) =>
  createProviderOAuthUrl(req, res, "google");

/**
 * Google OAuth callback: exchange code, upsert user, issue tokens, redirect
 * to the client-specified redirect_uri (or FRONTEND_URL by default).
 */
async function googleOAuthCallback(req, res) {
  try {
    const { code, state } = req.query;

    if (!state) {
      return res.status(400).json({ error: "Invalid OAuth state" });
    }
    const oauthState = await consumeOAuthRecord(`oauth:state:${state}`);
    if (!oauthState || oauthState.provider !== "google") {
      return res.status(400).json({ error: "Invalid or expired OAuth state" });
    }
    if (req.query.error) {
      if (oauthState.redirectUri) {
        return res.redirect(
          302,
          appendOAuthParams(oauthState.redirectUri, {
            error: String(req.query.error),
          }),
        );
      }
      return res.redirect(
        302,
        appendOAuthParams(new URL("/login", env.FRONTEND_URL).toString(), {
          error: "oauth_cancelled",
        }),
      );
    }
    if (!code) {
      return res.status(400).json({ error: "Missing authorization code" });
    }

    const tokenParams = new URLSearchParams({
      client_id: env.GOOGLE_CLIENT_ID,
      client_secret: env.GOOGLE_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
      redirect_uri: env.GOOGLE_REDIRECT_URI,
    });

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      log.warn("Google token exchange failed:", text);
      return res.status(400).json({ error: "Token exchange failed" });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const profileRes = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      },
    );

    if (!profileRes.ok) {
      const text = await profileRes.text();
      log.warn("Google userinfo fetch failed:", text);
      return res.status(400).json({ error: "Failed to fetch user profile" });
    }

    const profile = await profileRes.json();
    const email = profile.email ? String(profile.email).trim().toLowerCase() : "";
    const name = profile.name || profile.given_name || "Google User";
    const avatarUrl = profile.picture || avatars.getInitials(name);

    const subject = String(profile.id || profile.sub || "");
    if (!subject) {
      return res.status(400).json({ error: "Google account identity is missing" });
    }
    const emailVerified = profile.verified_email === true;
    if (oauthState.redirectUri) {
      if (email && emailVerified) {
        const userId = await upsertOAuthUser({
          email,
          name,
          avatarUrl,
          provider: "google",
          subject,
        });
        const exchangeCode = await createOAuthExchangeCode(userId, "google");
        return res.redirect(
          302,
          appendOAuthParams(oauthState.redirectUri, { code: exchangeCode }),
        );
      }

      const pendingId = await createOAuthPendingHandoff({
        provider: "google",
        subject,
        email,
        name,
        avatarUrl,
      });
      return res.redirect(
        302,
        appendOAuthParams(oauthState.redirectUri, {
          pendingId,
          emailRequired: String(!email),
          ...(email ? { maskedEmail: maskEmailAddress(email) } : {}),
        }),
      );
    }
    if (!email || !emailVerified) {
      return res.redirect(
        302,
        appendOAuthParams(new URL("/login", env.FRONTEND_URL).toString(), {
          error: "oauth_email_verification_required",
        }),
      );
    }

    const userId = await upsertOAuthUser({
      email,
      name,
      avatarUrl,
      provider: "google",
      subject,
    });
    const accessPayload = { sub: userId, role: "customer" };
    const accessJwt = signAccessToken(accessPayload);
    const refreshPayload = { sub: userId };
    const refreshJwt = signRefreshToken(refreshPayload);

    await persistRefreshToken({
      userId,
      refreshToken: refreshJwt,
      ip: req.ip || null,
      userAgent: req.headers?.["user-agent"] || null,
      deviceId: null,
      rotatedFrom: null,
    });

    const oauthCookieSecure =
      process.env.NODE_ENV === "production" ||
      req.headers["x-forwarded-proto"] === "https" ||
      req.secure === true;
    const oauthCookieOptions = {
      httpOnly: true,
      secure: oauthCookieSecure,
      sameSite: oauthCookieSecure ? "none" : "lax",
      path: "/",
    };

    res.cookie("accessToken", accessJwt, {
      ...oauthCookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshJwt, {
      ...oauthCookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    if (req.accepts("json")) {
      const customer = await users.get(userId);
      return res.status(200).json({
        success: true,
        accessToken: accessJwt,
        expiresIn: Math.floor(
          timeframeToMs(env.JWT_EXPIRES_IN || "15m") / 1000,
        ),
        user: { ...sanitizeUser(customer), isVerified: true },
      });
    }

    const baseRedirect = new URL("/home", env.FRONTEND_URL).toString();
    return res.redirect(302, baseRedirect);
  } catch (error) {
    log.error("Google OAuth callback error:", error?.message || error);
    return res.status(error.code === "OAUTH_REDIS_UNAVAILABLE" ? 503 : 500).json({
      success: false,
      code:
        error.code === "OAUTH_IDENTITY_CONFLICT"
          ? "OAUTH_IDENTITY_CONFLICT"
          : error.code === "OAUTH_REDIS_UNAVAILABLE"
            ? "OAUTH_REDIS_UNAVAILABLE"
            : "GOOGLE_OAUTH_FAILED",
      error:
        error.code === "OAUTH_IDENTITY_CONFLICT"
          ? "This Google account is already linked to another customer."
          : error.code === "OAUTH_REDIS_UNAVAILABLE"
            ? "Secure sign in is temporarily unavailable. Please try again."
            : "Google sign in could not be completed.",
    });
  }
}

/* ====================================================================
   Facebook OAuth
   ==================================================================== */

/**
 * Generate Facebook OAuth authorization URL
 * Supports optional ?redirect_uri query param for mobile deep links.
 */
const getFacebookOAuthUrl = (req, res) =>
  createProviderOAuthUrl(req, res, "facebook");

/**
 * Facebook OAuth callback: exchange code, upsert user, issue tokens, redirect
 * to the client-specified redirect_uri (or FRONTEND_URL by default).
 */
async function facebookOAuthCallback(req, res) {
  try {
    const { code, state } = req.query;
    if (!state) {
      return res.status(400).json({ error: "Invalid OAuth state" });
    }
    const oauthState = await consumeOAuthRecord(`oauth:state:${state}`);
    if (!oauthState || oauthState.provider !== "facebook") {
      return res.status(400).json({ error: "Invalid or expired OAuth state" });
    }
    if (req.query.error) {
      if (oauthState.redirectUri) {
        return res.redirect(
          302,
          appendOAuthParams(oauthState.redirectUri, {
            error: String(req.query.error),
          }),
        );
      }
      return res.redirect(
        302,
        appendOAuthParams(new URL("/login", env.FRONTEND_URL).toString(), {
          error: "oauth_cancelled",
        }),
      );
    }
    if (!code) {
      return res.status(400).json({ error: "Missing authorization code" });
    }

    const tokenParams = new URLSearchParams({
      client_id: env.FACEBOOK_APP_ID,
      client_secret: env.FACEBOOK_APP_SECRET,
      code,
      redirect_uri: env.FACEBOOK_REDIRECT_URI,
    });

    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?${tokenParams.toString()}`;
    const tokenRes = await fetch(tokenUrl, { method: "GET" });
    if (!tokenRes.ok) {
      const text = await tokenRes.text();
      log.warn("Facebook token exchange failed:", text);
      return res.status(400).json({ error: "Token exchange failed" });
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;

    const profileUrl =
      "https://graph.facebook.com/me?fields=id,name,email,picture.type(large)";
    const profileRes = await fetch(
      `${profileUrl}&access_token=${encodeURIComponent(accessToken)}`,
    );
    if (!profileRes.ok) {
      const text = await profileRes.text();
      log.warn("Facebook userinfo fetch failed:", text);
      return res.status(400).json({ error: "Failed to fetch user profile" });
    }

    const profile = await profileRes.json();
    const email = profile.email ? String(profile.email).trim().toLowerCase() : "";
    const name = profile.name || "Facebook User";
    const avatarUrl = profile?.picture?.data?.url || avatars.getInitials(name);

    const subject = String(profile.id || "");
    if (!subject) {
      return res.status(400).json({ error: "Facebook account identity is missing" });
    }
    const emailVerified = Boolean(email);
    if (oauthState.redirectUri) {
      if (email && emailVerified) {
        const userId = await upsertOAuthUser({
          email,
          name,
          avatarUrl,
          provider: "facebook",
          subject,
        });
        const exchangeCode = await createOAuthExchangeCode(userId, "facebook");
        return res.redirect(
          302,
          appendOAuthParams(oauthState.redirectUri, { code: exchangeCode }),
        );
      }

      const pendingId = await createOAuthPendingHandoff({
        provider: "facebook",
        subject,
        email,
        name,
        avatarUrl,
      });
      return res.redirect(
        302,
        appendOAuthParams(oauthState.redirectUri, {
          pendingId,
          emailRequired: String(!email),
          ...(email ? { maskedEmail: maskEmailAddress(email) } : {}),
        }),
      );
    }
    if (!email || !emailVerified) {
      return res.redirect(
        302,
        appendOAuthParams(new URL("/login", env.FRONTEND_URL).toString(), {
          error: "oauth_email_verification_required",
        }),
      );
    }

    const userId = await upsertOAuthUser({
      email,
      name,
      avatarUrl,
      provider: "facebook",
      subject,
    });
    const accessPayload = { sub: userId, role: "customer" };
    const accessJwt = signAccessToken(accessPayload);
    const refreshPayload = { sub: userId };
    const refreshJwt = signRefreshToken(refreshPayload);

    await persistRefreshToken({
      userId,
      refreshToken: refreshJwt,
      ip: req.ip || null,
      userAgent: req.headers?.["user-agent"] || null,
      deviceId: null,
      rotatedFrom: null,
    });

    const oauthCookieSecure =
      process.env.NODE_ENV === "production" ||
      req.headers["x-forwarded-proto"] === "https" ||
      req.secure === true;
    const oauthCookieOptions = {
      httpOnly: true,
      secure: oauthCookieSecure,
      sameSite: oauthCookieSecure ? "none" : "lax",
      path: "/",
    };

    res.cookie("accessToken", accessJwt, {
      ...oauthCookieOptions,
      maxAge: 15 * 60 * 1000,
    });
    res.cookie("refreshToken", refreshJwt, {
      ...oauthCookieOptions,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    if (req.accepts("json")) {
      const customer = await users.get(userId);
      return res.status(200).json({
        success: true,
        accessToken: accessJwt,
        expiresIn: Math.floor(
          timeframeToMs(env.JWT_EXPIRES_IN || "15m") / 1000,
        ),
        user: { ...sanitizeUser(customer), isVerified: true },
      });
    }

    const baseRedirect = new URL("/home", env.FRONTEND_URL).toString();
    return res.redirect(302, baseRedirect);
  } catch (error) {
    log.error("Facebook OAuth callback error:", error?.message || error);
    return res.status(error.code === "OAUTH_REDIS_UNAVAILABLE" ? 503 : 500).json({
      success: false,
      code:
        error.code === "OAUTH_IDENTITY_CONFLICT"
          ? "OAUTH_IDENTITY_CONFLICT"
          : error.code === "OAUTH_REDIS_UNAVAILABLE"
            ? "OAUTH_REDIS_UNAVAILABLE"
            : "FACEBOOK_OAUTH_FAILED",
      error:
        error.code === "OAUTH_IDENTITY_CONFLICT"
          ? "This Facebook account is already linked to another customer."
          : error.code === "OAUTH_REDIS_UNAVAILABLE"
            ? "Secure sign in is temporarily unavailable. Please try again."
            : "Facebook sign in could not be completed.",
    });
  }
}

const startOAuthEmailVerification = async (req, res) => {
  const pendingId = String(req.body?.pendingId || "");
  const suppliedEmail = String(req.body?.email || "").trim().toLowerCase();
  let resendAfterSeconds = 0;
  if (!pendingId) {
    return res.status(400).json({
      success: false,
      code: "OAUTH_HANDOFF_INVALID",
      error: "This sign in has expired. Please try again.",
    });
  }

  try {
    const handoff = await getOAuthRecord(`oauth:pending:${pendingId}`);
    if (!handoff) {
      return res.status(400).json({
        success: false,
        code: "OAUTH_HANDOFF_INVALID",
        error: "This sign in has expired. Please try again.",
      });
    }

    const email = suppliedEmail || String(handoff.email || "").toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return res.status(400).json({
        success: false,
        code: "OAUTH_EMAIL_REQUIRED",
        error: "Enter a valid email address to verify your account.",
      });
    }

    const existingRecord = await getVerificationCodeRecord(email);
    if (existingRecord) {
      const ageInMs = Date.now() - new Date(existingRecord.createdAt).getTime();
      const resendAfterSeconds = Math.max(
        0,
        Math.ceil((60 * 1000 - ageInMs) / 1000),
      );
      if (resendAfterSeconds > 0) {
        return res.status(429).json({
          success: false,
          code: "RESEND_TOO_SOON",
          error: "Please wait before requesting another verification code.",
          resendAfterSeconds,
        });
      }
    }

    const verificationCode = crypto.randomInt(100000, 1000000).toString();
    await storeVerificationCode(email, verificationCode);
    resendAfterSeconds = 60;
    await sendVerificationEmail({
      customerEmail: email,
      customerName: handoff.name || "Nile Flow customer",
      verificationCode,
    });
    await replaceOAuthRecord(
      `oauth:pending-email:${pendingId}`,
      { email },
      15 * 60,
    );

    return res.status(200).json({
      success: true,
      emailRequired: !handoff.email,
      maskedEmail: maskEmailAddress(email),
      expiresInSeconds: 15 * 60,
      resendAfterSeconds: 60,
    });
  } catch (error) {
    log.error("OAuth verification start failed:", error?.message || error);
    const unavailable = error.code === "OAUTH_REDIS_UNAVAILABLE";
    return res.status(503).json({
      success: false,
      code: unavailable
        ? "OAUTH_REDIS_UNAVAILABLE"
        : "OAUTH_VERIFICATION_UNAVAILABLE",
      error: "Email verification could not be started. Please try again.",
      resendAfterSeconds,
    });
  }
};

const completeOAuthEmailVerification = async (req, res) => {
  const pendingId = String(req.body?.pendingId || "");
  const suppliedEmail = String(req.body?.email || "").trim().toLowerCase();
  const verificationCode = String(req.body?.verificationCode || "").trim();
  if (
    !pendingId ||
    (suppliedEmail && !/^\S+@\S+\.\S+$/.test(suppliedEmail)) ||
    !/^\d{6}$/.test(verificationCode)
  ) {
    return res.status(400).json({
      success: false,
      code: "INVALID_VERIFICATION_INPUT",
      error: "Enter the six digit verification code and a valid email if requested.",
    });
  }

  try {
    const [handoff, emailRecord] = await Promise.all([
      getOAuthRecord(`oauth:pending:${pendingId}`),
      getOAuthRecord(`oauth:pending-email:${pendingId}`),
    ]);
    const email = suppliedEmail || String(emailRecord?.email || "").toLowerCase();
    if (
      !handoff ||
      !emailRecord ||
      !/^\S+@\S+\.\S+$/.test(email) ||
      emailRecord.email !== email
    ) {
      return res.status(400).json({
        success: false,
        code: "OAUTH_HANDOFF_INVALID",
        error: "This sign in has expired. Please try again.",
      });
    }

    const storedCode = await getStoredVerificationCode(email);
    if (!storedCode || storedCode !== verificationCode) {
      return res.status(400).json({
        success: false,
        code: "INVALID_OR_EXPIRED_CODE",
        error: "Invalid or expired verification code.",
      });
    }

    const consumedHandoff = await consumeOAuthRecord(
      `oauth:pending:${pendingId}`,
    );
    if (!consumedHandoff) {
      return res.status(400).json({
        success: false,
        code: "OAUTH_HANDOFF_INVALID",
        error: "This sign in has already been completed. Please try again.",
      });
    }

    const userId = await upsertOAuthUser({
      email,
      name: consumedHandoff.name || "Nile Flow customer",
      avatarUrl: consumedHandoff.avatarUrl,
      provider: consumedHandoff.provider,
      subject: consumedHandoff.subject,
    });
    const exchangeCode = await createOAuthExchangeCode(
      userId,
      consumedHandoff.provider,
    );
    await deleteVerificationCode(email);
    await consumeOAuthRecord(`oauth:pending-email:${pendingId}`);

    return res.status(200).json({
      success: true,
      code: exchangeCode,
      expiresInSeconds: 60,
    });
  } catch (error) {
    log.error("OAuth verification completion failed:", error?.message || error);
    const unavailable = error.code === "OAUTH_REDIS_UNAVAILABLE";
    return res.status(error.code === "OAUTH_IDENTITY_CONFLICT" ? 409 : 503).json({
      success: false,
      code:
        error.code === "OAUTH_IDENTITY_CONFLICT"
          ? "OAUTH_IDENTITY_CONFLICT"
          : unavailable
            ? "OAUTH_REDIS_UNAVAILABLE"
            : "OAUTH_VERIFICATION_UNAVAILABLE",
      error:
        error.code === "OAUTH_IDENTITY_CONFLICT"
          ? "This provider account is already linked to another customer."
          : "Email verification could not be completed. Please try again.",
    });
  }
};

const exchangeOAuthCode = async (req, res) => {
  const code = String(req.body?.code || "");
  const deviceId = String(req.body?.deviceId || "");
  if (!code || code.length > 256) {
    return res.status(400).json({
      success: false,
      code: "OAUTH_CODE_INVALID",
      error: "The sign in code is invalid or has expired.",
    });
  }

  const key = `oauth:exchange:${crypto
    .createHash("sha256")
    .update(code)
    .digest("hex")}`;
  try {
    const exchange = await consumeOAuthRecord(key);
    if (!exchange) {
      return res.status(401).json({
        success: false,
        code: "OAUTH_CODE_INVALID",
        error: "The sign in code is invalid, expired, or already used.",
      });
    }

    const user = await users.get(exchange.userId);
    if (!isCustomerEmailVerified(user)) {
      return res.status(403).json({
        success: false,
        code: "EMAIL_NOT_VERIFIED",
        error: "Verify your email before signing in.",
      });
    }

    const accessToken = signAccessToken({
      sub: user.$id,
      role: user.prefs?.role || "customer",
    });
    const refreshToken = signRefreshToken({ sub: user.$id });
    await persistRefreshToken({
      userId: user.$id,
      refreshToken,
      ip: req.ip || null,
      userAgent: req.headers?.["user-agent"] || null,
      deviceId: deviceId || null,
      rotatedFrom: null,
    });

    return res.status(200).json({
      success: true,
      accessToken,
      refreshToken,
      expiresIn: Math.floor(
        timeframeToMs(env.JWT_EXPIRES_IN || "15m") / 1000,
      ),
      user: { ...sanitizeUser(user), isVerified: true },
    });
  } catch (error) {
    log.error("OAuth code exchange failed:", error?.message || error);
    const unavailable = error.code === "OAUTH_REDIS_UNAVAILABLE";
    return res.status(unavailable ? 503 : 503).json({
      success: false,
      code: unavailable ? "OAUTH_REDIS_UNAVAILABLE" : "OAUTH_EXCHANGE_FAILED",
      error: "Secure sign in is temporarily unavailable. Please try again.",
    });
  }
};

/* ====================================================================
   Pickup Address
   ==================================================================== */

/**
 * Save customer pickup address
 */
const savePickupAddress = async (req, res) => {
  try {
    const userId = req.user?.userId;

    // Validate userId exists
    if (!userId) {
      log.error("Save pickup address: userId is missing from token");
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    log.info(`Save pickup address for user: ${userId}`);

    const { address, phone, city, state, postalCode } = req.body;

    // Validate required fields
    if (!address || !phone || !city || !state) {
      return res.status(400).json({
        error: "Address, phone, city, and state are required fields",
      });
    }

    // Validate phone number format
    if (!/^\+?[\d\s\-()]+$/.test(phone)) {
      return res.status(400).json({
        error: "Please enter a valid phone number",
      });
    }

    try {
      // Check if user already has a pickup address
      log.info(`Checking existing pickup addresses for user: ${userId}`);

      let existingAddresses;
      try {
        // Try to query with type field first
        existingAddresses = await instrumentedDb.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ADDRESS_COLLECTION_ID,
          [Query.equal("user", userId), Query.equal("type", "pickup")],
        );
      } catch (queryError) {
        log.warn(
          "Query with type field failed, trying without type field:",
          queryError.message,
        );
        // Fallback: query without type field if it doesn't exist
        existingAddresses = await instrumentedDb.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ADDRESS_COLLECTION_ID,
          [Query.equal("user", userId)],
        );
        // Filter to find pickup addresses manually if needed
        existingAddresses.documents = existingAddresses.documents.filter(
          (addr) => addr.type === "pickup" || !addr.type, // Include addresses without type
        );
      }

      let pickupAddress;

      if (existingAddresses.documents.length > 0) {
        // Update existing pickup address
        const existingAddress = existingAddresses.documents[0];
        pickupAddress = await instrumentedDb.updateDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ADDRESS_COLLECTION_ID,
          existingAddress.$id,
          {
            address,
            phone,
            city,
            state,
            zipCode: postalCode || "",
            $updatedAt: new Date().toISOString(),
          },
        );
        log.info(`Updated pickup address for user ${userId}`);
      } else {
        // Create new pickup address
        const addressId = ID.unique();
        pickupAddress = await instrumentedDb.createDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ADDRESS_COLLECTION_ID,
          addressId,
          {
            user: userId,
            type: "pickup", // Mark as pickup address
            address,
            phone,
            city,
            state,
            zipCode: postalCode || "",
            country: "Kenya", // Default country, can be made dynamic
            fullName: "", // Will be populated from user profile if needed
            $createdAt: new Date().toISOString(),
            $updatedAt: new Date().toISOString(),
          },
        );
        log.info(`Created new pickup address for user ${userId}`);
      }

      return res.status(200).json({
        success: true,
        message: "Pickup address saved successfully",
        address: {
          id: pickupAddress.$id,
          address: pickupAddress.address,
          phone: pickupAddress.phone,
          city: pickupAddress.city,
          state: pickupAddress.state,
          postalCode: pickupAddress.zipCode,
        },
      });
    } catch (dbError) {
      log.error("Database error saving pickup address:", dbError);
      return res.status(500).json({
        error: "Failed to save pickup address. Please try again.",
      });
    }
  } catch (error) {
    log.error("Save pickup address failed:", error?.message || error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

/**
 * Get customer pickup address
 */
const getPickupAddress = async (req, res) => {
  try {
    const userId = req.user?.userId;

    // Validate userId exists
    if (!userId) {
      log.error("Get pickup address: userId is missing from token");
      return res.status(401).json({ error: "Invalid authentication token" });
    }

    log.info(`Get pickup address for user: ${userId}`);

    try {
      // Get pickup address for the user
      let addresses;
      try {
        // Try to query with type field first
        addresses = await instrumentedDb.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ADDRESS_COLLECTION_ID,
          [Query.equal("user", userId), Query.equal("type", "pickup")],
        );
      } catch (queryError) {
        log.warn(
          "Query with type field failed, trying without type field:",
          queryError.message,
        );
        // Fallback: query without type field
        addresses = await instrumentedDb.listDocuments(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_ADDRESS_COLLECTION_ID,
          [Query.equal("user", userId)],
        );
        // Filter manually for pickup addresses
        addresses.documents = addresses.documents.filter(
          (addr) => addr.type === "pickup",
        );
      }

      if (addresses.documents.length === 0) {
        return res.status(404).json({
          error: "No pickup address found",
        });
      }

      const pickupAddress = addresses.documents[0];

      return res.status(200).json({
        success: true,
        address: {
          id: pickupAddress.$id,
          address: pickupAddress.address,
          phone: pickupAddress.phone,
          city: pickupAddress.city,
          state: pickupAddress.state,
          postalCode: pickupAddress.zipCode || "",
        },
      });
    } catch (dbError) {
      log.error("Database error getting pickup address:", dbError);
      return res.status(500).json({
        error: "Failed to retrieve pickup address",
      });
    }
  } catch (error) {
    log.error("Get pickup address failed:", error?.message || error);
    return res.status(500).json({
      error: "Internal server error",
    });
  }
};

module.exports = {
  signupcustomer,
  signincustomer,
  verifyCustomerEmail,
  handleRefreshToken,
  getCurrentCustomer,
  logoutcustomer,
  getCustomerPreferences,
  updateCustomerPreferences,
  updateCustomerProfile,
  getGoogleOAuthUrl,
  googleOAuthCallback,
  getFacebookOAuthUrl,
  facebookOAuthCallback,
  startOAuthEmailVerification,
  completeOAuthEmailVerification,
  exchangeOAuthCode,
  savePickupAddress,
  getPickupAddress,
};
