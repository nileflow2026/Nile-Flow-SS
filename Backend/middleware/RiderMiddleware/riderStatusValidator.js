// middleware/RiderMiddleware/riderStatusValidator.js
/**
 * Rider status validation middleware.
 * Validates that a rider's account status allows dashboard access.
 * Blocks suspended, blocked, inactive, and pending_verification riders.
 */
const { instrumentedDb } = require("../../services/appwriteService");
const { Query } = require("node-appwrite");
const { env } = require("../../src/env");

const BLOCKED_STATUSES = [
  "suspended",
  "blocked",
  "inactive",
  "pending_verification",
];

const riderStatusValidator = async (req, res, next) => {
  try {
    const riderId = req.rider?.riderId;
    if (!riderId) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
        code: "AUTH_REQUIRED",
      });
    }

    // Fetch rider from database
    const rider = await instrumentedDb.getDocument(
      env.RIDER_DATABASE_ID || env.APPWRITE_DATABASE_ID,
      env.RIDER_COLLECTION_ID,
      riderId,
    );

    if (!rider) {
      return res.status(401).json({
        success: false,
        error: "Rider account not found",
        code: "RIDER_NOT_FOUND",
      });
    }

    // Check if rider is active
    if (!rider.isActive) {
      return res.status(403).json({
        success: false,
        error: "Account is deactivated",
        code: "ACCOUNT_DEACTIVATED",
      });
    }

    // Check for blocked statuses
    const status = (rider.status || "offline").toLowerCase();
    if (BLOCKED_STATUSES.includes(status)) {
      const messages = {
        suspended: "Your account has been suspended. Please contact support.",
        blocked: "Your account has been blocked for security reasons.",
        inactive:
          "Your account is inactive. Please contact your fleet supervisor.",
        pending_verification:
          "Your account is pending verification. Please complete document verification.",
      };

      return res.status(403).json({
        success: false,
        error: messages[status] || "Account access denied",
        code: `ACCOUNT_${status.toUpperCase()}`,
        status,
      });
    }

    // Attach full rider object to request for downstream use
    req.riderProfile = rider;
    next();
  } catch (error) {
    console.error("[RiderStatusValidator] Error:", error.message);
    return res.status(500).json({
      success: false,
      error: "Failed to validate rider status",
      code: "VALIDATION_ERROR",
    });
  }
};

module.exports = riderStatusValidator;
