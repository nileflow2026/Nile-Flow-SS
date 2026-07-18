// src/auth/RiderAuthorization.js
/**
 * Centralized authorization layer for rider dashboard.
 * Enforces RBAC, ownership validation, and status checks.
 * All authorization decisions should go through this module.
 */
import roleManager, { PERMISSIONS } from "./RoleManager";
import auditLogger from "./AuditLogger";

/**
 * Rider statuses that are allowed to access the dashboard.
 */
const ALLOWED_STATUSES = ["online", "offline", "busy"];
const BLOCKED_STATUSES = [
  "suspended",
  "blocked",
  "inactive",
  "pending_verification",
];

class RiderAuthorization {
  /**
   * Verify a rider has permission to perform an action.
   * Logs forbidden access attempts for audit.
   */
  authorize(role, permission, context = {}) {
    const hasPermission = roleManager.hasPermission(role, permission);
    if (!hasPermission) {
      auditLogger.forbiddenAccess(context.route || "unknown", role, permission);
    }
    return hasPermission;
  }

  /**
   * Check if a rider owns a specific resource (ownership validation).
   * Prevents IDOR attacks by ensuring riders can only access their own resources.
   */
  verifyOwnership(riderId, resourceOwnerId, resourceType = "resource") {
    if (!riderId || !resourceOwnerId) {
      auditLogger.unauthorizedAccess(
        `ownership_check:${resourceType}`,
        "missing_ids",
      );
      return false;
    }

    const owns = String(riderId) === String(resourceOwnerId);
    if (!owns) {
      auditLogger.suspiciousActivity("ownership_violation", {
        riderId,
        resourceOwnerId,
        resourceType,
      });
    }
    return owns;
  }

  /**
   * Check if a rider's status allows dashboard access.
   * Returns { allowed, reason }.
   */
  checkRiderStatus(rider, checkOnlineOnly = false) {
    if (!rider) {
      return { allowed: false, reason: "no_rider_data" };
    }

    const status = (rider.status || "offline").toLowerCase();

    if (BLOCKED_STATUSES.includes(status)) {
      auditLogger.unauthorizedAccess("dashboard", `blocked_status:${status}`);
      return {
        allowed: false,
        reason: `account_${status}`,
        message: this._getStatusMessage(status),
      };
    }

    if (checkOnlineOnly && status !== "online") {
      return {
        allowed: false,
        reason: "not_online",
        message: "You must be online to access this feature.",
      };
    }

    if (!ALLOWED_STATUSES.includes(status)) {
      return {
        allowed: false,
        reason: "invalid_status",
        message: "Your account status is not valid for this action.",
      };
    }

    return { allowed: true, reason: "ok" };
  }

  /**
   * Check if a rider can view a specific delivery.
   * Enforces backend-mirrored ownership check.
   */
  canViewDelivery(riderId, delivery, role = "rider") {
    // Fleet supervisors and above can view all deliveries
    if (roleManager.isAtLeast(role, "fleet_supervisor")) {
      return true;
    }

    // Regular riders can only view their assigned deliveries
    return this.verifyOwnership(
      riderId,
      delivery.riderId || delivery.rider,
      "delivery",
    );
  }

  /**
   * Check if a rider can update a delivery's status.
   */
  canUpdateDeliveryStatus(riderId, delivery, role = "rider") {
    // Must own the delivery AND have the permission
    const owns = this.verifyOwnership(
      riderId,
      delivery.riderId || delivery.rider,
      "delivery_status_update",
    );
    const hasPerm = this.authorize(role, PERMISSIONS.DELIVERIES_UPDATE_STATUS);
    return owns && hasPerm;
  }

  /**
   * Check if a rider can view their earnings.
   */
  canViewEarnings(riderId, earningsRiderId, role = "rider") {
    if (roleManager.isAtLeast(role, "fleet_supervisor")) {
      return this.authorize(role, PERMISSIONS.EARNINGS_VIEW_ALL);
    }
    return this.verifyOwnership(riderId, earningsRiderId, "earnings");
  }

  /**
   * Check if a rider can access maps/live tracking.
   */
  canAccessLiveTracking(role = "rider") {
    return this.authorize(role, PERMISSIONS.MAPS_LIVE_TRACKING);
  }

  /**
   * Get user-friendly status message
   */
  _getStatusMessage(status) {
    const messages = {
      suspended:
        "Your account has been suspended. Please contact support for assistance.",
      blocked:
        "Your account has been blocked due to security reasons. Please contact support.",
      inactive:
        "Your account is inactive. Please contact your fleet supervisor.",
      pending_verification:
        "Your account is pending verification. Please complete document verification.",
    };
    return messages[status] || "Your account is not eligible for this action.";
  }
}

// Singleton
const riderAuthorization = new RiderAuthorization();
export default riderAuthorization;
