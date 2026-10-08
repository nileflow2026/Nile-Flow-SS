const { ID, Permission, Query } = require("node-appwrite");
const { instrumentedDb } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const createNotificationInternal = async (notificationData) => {
  try {
    const { message, type, username, email, userId } = notificationData;

    if (!message || !type || !userId) {
      console.error(
        "Error creating notification: Missing required fields in data",
      );
      return; // Or throw an error if you want the signup to fail
    }

    const response = await instrumentedDb.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        message,
        username,
        type,
        timestamp: new Date().toISOString(),
        read: false,
        email,
        userId,
      },
      [
        Permission.read(`user:${userId}`),
        Permission.update(`user:${userId}`),
        Permission.delete(`user:${userId}`),
      ],
    );

    console.log("Notification created:", response);

    return response;
  } catch (error) {
    console.error("❌ Internal notification creation failed:", error.message);
    // Decide if you want to re-throw this error or just log it
    // If notification creation failure should not break signup, just log.
    // throw new Error("Failed to create internal notification");
  }
};


const createNotification = async (req, res) => {
  try {
    // ✅ Handle both Express request AND direct object calls
    let notificationData;

    if (req && req.body) {
      // Case 1: Called from Express route (mobile frontend)
      notificationData = req.body;
    } else {
      // Case 2: Called directly with object (from your controller)
      notificationData = req; // 'req' is actually the notification data object
    }

    const { message, type, username, email, userId } = notificationData;

    // 🔍 Debug: Log what we received
    console.log("📝 Notification data received:", {
      message,
      type,
      username,
      email,
      userId,
    });

    // ✅ FIX: Check for res properly
    if (!userId || !type) {
      if (res && typeof res.status === "function") {
        return res.status(400).json({
          success: false,
          message: "Missing required fields: userId and type",
        });
      }
      // If called without res (from controller), throw error
      throw new Error("Missing required fields: userId and type");
    }

    const response = await instrumentedDb.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        message: message || `New ${type} notification`,
        username: username || "Customer",
        type,
        timestamp: new Date().toISOString(),
        read: false,
        email: email || "",
        userId,
      },
      [
        Permission.read(`user:${userId}`),
        Permission.update(`user:${userId}`),
        Permission.delete(`user:${userId}`),
      ],
    );

    // ✅ FIX: Only use res if it exists and has status method
    if (res && typeof res.status === "function") {
      return res.status(201).json({
        success: true,
        notification: response,
      });
    }

    // ✅ If called without res (from controller), return the response
    return {
      success: true,
      notification: response,
    };
  } catch (error) {
    console.error("❌ Notification creation failed:", error.message);

    // ✅ FIX: Only use res if it exists
    if (res && typeof res.status === "function") {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }

    // ✅ If called without res (from controller), throw error
    throw error;
  }
};

const fetchCustomerNotification = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user information found." });
    }

    const userId = req.user.userId;
    if (typeof userId !== "string" || !userId) {
      return res.status(400).json({ error: "Invalid token: Missing user ID." });
    }

    const result = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      [Query.equal("userId", userId), Query.orderDesc("$createdAt")],
    );
    res.status(200).json({ result: result.documents });
  } catch (err) {
    console.error("Failed to fetch customer notifications:", err.message);
    return res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

const markAllNotificationsAsRead = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const userId = req.user.userId;

    const result = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal("userId", userId),
        Query.equal("read", false),
      ],
    );

    for (const note of result.documents) {
      await instrumentedDb.updateDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
        note.$id,
        { read: true },
      );
    }

    return res
      .status(200)
      .json({ message: "All notifications marked as read" });
  } catch (error) {
    console.error("Failed to mark notifications as read:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

/**
 * Save or update the Expo push token for the authenticated user.
 * The token is stored on the user's document so the backend can send
 * targeted push notifications (e.g. on order status change).
 */
const registerPushToken = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { pushToken } = req.body;

    if (!pushToken || typeof pushToken !== "string") {
      return res.status(400).json({ error: "pushToken is required" });
    }

    // Validate it looks like an Expo push token
    if (
      !pushToken.startsWith("ExponentPushToken[") &&
      !pushToken.startsWith("ExpoPushToken[")
    ) {
      return res.status(400).json({ error: "Invalid Expo push token format" });
    }

    const userId = req.user.userId;
    const user = await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      userId,
    );
    const tokenData = { pushToken };
    if (!user.pushTokenFirstRegisteredAt) {
      tokenData.pushTokenFirstRegisteredAt = new Date().toISOString();
    }

    await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      userId,
      tokenData,
    );

    if (
      env.PUSH_NOTIFICATIONS_V2_ENABLED === true &&
      !user.welcomePushSentAt
    ) {
      const { createAutomaticPush } = require("../../services/automaticPushService");
      await createAutomaticPush({
        eventType: "account.welcome",
        userId,
        eventKey: `account.welcome:${userId}`,
      });
    }

    return res
      .status(200)
      .json({ message: "Push token registered successfully" });
  } catch (error) {
    console.error("Failed to register push token:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const unregisterPushToken = async (req, res) => {
  try {
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      req.user.userId,
      { pushToken: null },
    );

    return res.status(200).json({ message: "Push token removed successfully" });
  } catch (error) {
    console.error("Failed to remove push token:", error.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

const getCustomerNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (req.user.role && req.user.role !== "customer") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const user = await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      userId,
    );
    return res.status(200).json({
      marketingPushEnabled: user.marketingPushEnabled === true,
      marketingPushConsentUpdatedAt: user.marketingPushConsentUpdatedAt || null,
    });
  } catch (error) {
    console.error("Failed to read notification preferences:", error.message);
    return res.status(503).json({
      success: false,
      message: "Notification preferences are unavailable.",
    });
  }
};

const updateCustomerNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
    if (req.user.role && req.user.role !== "customer") {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    const keys = Object.keys(req.body || {});
    if (
      keys.length !== 1 ||
      typeof req.body.marketingPushEnabled !== "boolean"
    ) {
      return res.status(400).json({
        success: false,
        message: "marketingPushEnabled must be the only Boolean field.",
      });
    }

    const updatedAt = new Date().toISOString();
    await instrumentedDb.updateDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      userId,
      {
        marketingPushEnabled: req.body.marketingPushEnabled,
        marketingPushConsentUpdatedAt: updatedAt,
      },
    );
    return res.status(200).json({
      marketingPushEnabled: req.body.marketingPushEnabled,
      marketingPushConsentUpdatedAt: updatedAt,
    });
  } catch (error) {
    console.error("Failed to update notification preferences:", error.message);
    return res.status(503).json({
      success: false,
      message: "Notification preferences could not be saved.",
    });
  }
};

module.exports = {
  createNotification,
  fetchCustomerNotification,
  createNotificationInternal,
  markAllNotificationsAsRead,
  registerPushToken,
  unregisterPushToken,
  getCustomerNotificationPreferences,
  updateCustomerNotificationPreferences,
};
