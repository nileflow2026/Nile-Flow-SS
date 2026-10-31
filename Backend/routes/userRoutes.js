const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/auth");
const { apiLimiter } = require("../middleware/rate-limiter");
const {
  getAdminProfile,
  getUsers,
} = require("../controllers/AdminControllers/userController");
const {
  getAuditLogs,
  logAuditEntry,
} = require("../controllers/AdminControllers/auditLoggerController");
const { users } = require("../src/appwrite");

const defaultPreferences = {
  preferredPaymentMethod: "Credit Card",
  preferredShippingMethod: "Standard Shipping",
  emailNotifications: true,
  smsNotifications: true,
  marketingEmails: false,
  orderNotifications: true,
  promotionalNotifications: false,
  currency: "KSh",
  language: "en",
  timezone: "Africa/Nairobi",
  theme: "light",
};

const isAllowedPreferenceObject = (preferences) =>
  preferences &&
  typeof preferences === "object" &&
  !Array.isArray(preferences) &&
  Object.entries(preferences).every(
    ([key, value]) =>
      Object.hasOwn(defaultPreferences, key) &&
      typeof value === typeof defaultPreferences[key],
  );

const pickAllowedPreferences = (preferences = {}) => {
  if (
    !preferences ||
    typeof preferences !== "object" ||
    Array.isArray(preferences)
  ) {
    return {};
  }

  return Object.fromEntries(
    Object.keys(defaultPreferences)
      .filter((key) => Object.hasOwn(preferences, key))
      .map((key) => [key, preferences[key]]),
  );
};

const canAccessPreferences = (req) =>
  req.user?.userId && req.user.userId === req.params.userId;

// Protected route
router.get("/admin/profile", apiLimiter, authenticateToken, adminOnly, getAdminProfile);
router.get("/audit-logs", apiLimiter, authenticateToken, adminOnly, getAuditLogs);
router.post("/log", apiLimiter, authenticateToken, logAuditEntry);
router.get("/users", apiLimiter, authenticateToken, adminOnly, getUsers);
router.get(
  "/users/:userId/preferences",
  apiLimiter,
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;

      if (!canAccessPreferences(req)) {
        return res.status(403).json({
          success: false,
          error: "You can only access your own preferences",
        });
      }

      try {
        const userPreferences = await users.getPrefs(userId);
        const preferences = {
          ...defaultPreferences,
          ...pickAllowedPreferences(userPreferences),
        };

        return res.status(200).json({
          success: true,
          preferences,
          message: "User preferences retrieved successfully",
        });
      } catch (appwriteError) {
        console.error("Appwrite Users API error:", appwriteError);

        if (appwriteError.code === 404) {
          return res.status(404).json({
            success: false,
            error: "User not found",
            message: "The specified user does not exist",
          });
        }

        throw appwriteError;
      }
    } catch (error) {
      console.error("Error fetching user preferences:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch user preferences",
      });
    }
  }
);
/**
 * PUT /api/users/:userId/preferences
 * Update all user preferences using Appwrite Users API
 */
router.put(
  "/users/:userId/preferences",
  apiLimiter,
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { preferences } = req.body;

      if (!canAccessPreferences(req)) {
        return res.status(403).json({
          success: false,
          error: "You can only update your own preferences",
        });
      }

      if (!isAllowedPreferenceObject(preferences)) {
        return res.status(400).json({
          success: false,
          error: "Preferences contain invalid or unsupported values",
        });
      }

      try {
        const currentPreferences = await users.getPrefs(userId);
        const updatedPreferences = await users.updatePrefs(userId, {
          ...currentPreferences,
          ...preferences,
        });

        return res.status(200).json({
          success: true,
          preferences: {
            ...defaultPreferences,
            ...pickAllowedPreferences(updatedPreferences),
          },
          message: "User preferences updated successfully",
        });
      } catch (appwriteError) {
        console.error("Appwrite Users API error:", appwriteError);

        if (appwriteError.code === 404) {
          return res.status(404).json({
            success: false,
            error: "User not found",
            message: "The specified user does not exist",
          });
        }

        throw appwriteError;
      }
    } catch (error) {
      console.error("Error updating user preferences:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update user preferences",
      });
    }
  }
);

/**
 * PATCH /api/users/:userId/preferences
 * Partially update user preferences using Appwrite Users API
 */
router.patch(
  "/api/users/:userId/preferences",
  apiLimiter,
  authenticateToken,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const updates = req.body;

      if (!canAccessPreferences(req)) {
        return res.status(403).json({
          success: false,
          error: "You can only update your own preferences",
        });
      }

      if (!isAllowedPreferenceObject(updates)) {
        return res.status(400).json({
          success: false,
          error: "Preferences contain invalid or unsupported values",
        });
      }

      try {
        const currentPreferences = await users.getPrefs(userId);
        const updatedPreferences = await users.updatePrefs(userId, {
          ...currentPreferences,
          ...updates,
        });

        return res.status(200).json({
          success: true,
          preferences: {
            ...defaultPreferences,
            ...pickAllowedPreferences(updatedPreferences),
          },
          message: "User preferences partially updated successfully",
        });
      } catch (appwriteError) {
        console.error("Appwrite Users API error:", appwriteError);

        if (appwriteError.code === 404) {
          return res.status(404).json({
            success: false,
            error: "User not found",
            message: "The specified user does not exist",
          });
        }

        throw appwriteError;
      }
    } catch (error) {
      console.error("Error partially updating user preferences:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update user preferences",
      });
    }
  }
);

module.exports = router;
