const { Query, ID, Permission } = require("node-appwrite");
const { instrumentedDb } = require("../../services/appwriteService");
const { env } = require("../../src/env");

const getNotifications = async (req, res) => {
  try {
    const query = [Query.orderDesc("$createdAt")];
    const notificationType = req.query.type;

    if (
      notificationType &&
      [
        "user",
        "system",
        "order",
        "product_submission",
        "product_published",
        "delivery_update",
      ].includes(notificationType)
    ) {
      query.unshift(Query.equal("type", notificationType));
    }
    const notifications = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      query,
    );
    console.log("Fetched notifications:", notifications.documents);

    res.status(200).json({ notifications: notifications.documents });
  } catch (error) {
    console.error("Fetching notifications failed:", error.message);
    res.status(500).json({ error: "Failed to fetch notifications." });
  }
};

const fetchAdminNotifications = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user information found." });
    }

    const userId = req.user.userId;
    console.log("userId:", userId);

    if (!userId) {
      return res.status(400).json({ error: "Invalid token: Missing user ID." });
    }

    const result = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      [
        Query.equal("type", [
          "order",
          "user",
          "product_submission",
          "product_published",
          "delivery_update",
        ]),
        Query.orderDesc("$createdAt"),
      ],
    );
    res.status(200).json({ result: result.documents });
  } catch (err) {
    console.error("Failed to fetch admin notifications:", err.message);
  }
};

const clearAllNotifications = async (req, res) => {
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user information found." });
    }

    const userId = req.user.userId;
    console.log("userId:", userId);

    if (!userId) {
      return res.status(400).json({ error: "Invalid token: Missing user ID." });
    }

    const response = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
    );

    const deletions = response.documents.map((doc) =>
      instrumentedDb.deleteDocument(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
        doc.$id,
      ),
    );

    await Promise.all(deletions);
    res.status(200).json({ notifications: response.documents });
  } catch (error) {
    console.error("Failed to delete notifications :", error.message);
    res.status(500).json({ error: "Failed to delete notifications." });
  }
};

const markNotificationsAsRead = async (req, res) => {
  const { ids = [] } = req.body;
  try {
    if (!req.user) {
      return res
        .status(401)
        .json({ error: "Unauthorized: No user information found." });
    }

    const userId = req.user.userId;
    console.log("userId:", userId);

    if (!userId) {
      return res.status(400).json({ error: "Invalid token: Missing user ID." });
    }

    await Promise.all(
      ids.map((id) =>
        instrumentedDb.updateDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
          id,
          { read: true },
        ),
      ),
    );
    res.json({ updated: ids.length });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/**
 * Create a product approval notification (legacy — used when approval feature flag is ON).
 * Sent to admins when a vendor submits a product for review.
 * Sent to vendors to confirm their product is under review.
 */
const CreateProductApprovalNotification = async (req, res) => {
  try {
    let notificationData;

    if (req && req.body) {
      notificationData = req.body;
    } else {
      notificationData = req;
    }

    const {
      message,
      type,
      username,
      email,
      userId,
      metadata,
    } = notificationData;

    console.log("📝 Approval notification with metadata:", {
      message,
      type,
      username,
      metadata,
    });

    if (!userId || !type) {
      if (res && typeof res.status === "function") {
        return res.status(400).json({
          success: false,
          message: "Missing required fields",
        });
      }
      throw new Error("Missing required fields");
    }

    const response = await instrumentedDb.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        message: message || `New ${type} notification`,
        username: username || "User",
        type,
        timestamp: new Date().toISOString(),
        read: false,
        email: email || "",
        userId,
        metadata: metadata || {},
      },
      [
        Permission.read(`user:${userId}`),
        Permission.update(`user:${userId}`),
        Permission.delete(`user:${userId}`),
      ],
    );

    if (res && typeof res.status === "function") {
      return res.status(201).json({
        success: true,
        notification: response,
      });
    }

    return {
      success: true,
      notification: response,
    };
  } catch (error) {
    console.error("❌ Notification creation failed:", error.message);

    if (res && typeof res.status === "function") {
      return res.status(500).json({
        success: false,
        error: "Internal server error",
        details: error.message,
      });
    }
    throw error;
  }
};

/**
 * Create a product published notification (new — used when approval feature flag is OFF).
 * Sent to admins for informational awareness when a vendor publishes a product.
 * Sent to vendors to confirm their product is live.
 *
 * This is the default behavior for the current stage of Nile Flow.
 */
const CreateProductPublishedNotification = async (notificationData) => {
  try {
    const {
      message,
      type = "product_published",
      username,
      email,
      userId,
      metadata,
    } = notificationData;

    console.log("📢 Published notification:", {
      message,
      type,
      username,
      userId,
    });

    if (!userId || !type) {
      throw new Error("Missing required fields for published notification");
    }

    const response = await instrumentedDb.createDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
      ID.unique(),
      {
        message: message || "New product published",
        username: username || "User",
        type,
        timestamp: new Date().toISOString(),
        read: false,
        email: email || "",
        userId,
        metadata: metadata || {},
      },
      [
        Permission.read(`user:${userId}`),
        Permission.update(`user:${userId}`),
        Permission.delete(`user:${userId}`),
      ],
    );

    return {
      success: true,
      notification: response,
    };
  } catch (error) {
    console.error("❌ Published notification creation failed:", error.message);
    // Don't throw — notifications should never block the main flow
    return { success: false, error: error.message };
  }
};

module.exports = {
  getNotifications,
  clearAllNotifications,
  fetchAdminNotifications,
  markNotificationsAsRead,
  CreateProductApprovalNotification,
  CreateProductPublishedNotification,
};
