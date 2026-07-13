// src/auth/RoleManager.js
/**
 * Centralized Role-Based Access Control (RBAC) definitions.
 * Defines roles, permissions, and role-to-permission mappings.
 *
 * Roles hierarchy (lowest to highest):
 *   rider < senior_rider < fleet_supervisor < dispatch_manager < logistics_admin
 */

export const ROLES = {
  RIDER: "rider",
  SENIOR_RIDER: "senior_rider",
  FLEET_SUPERVISOR: "fleet_supervisor",
  DISPATCH_MANAGER: "dispatch_manager",
  LOGISTICS_ADMIN: "logistics_admin",
};

/**
 * Granular permission definitions covering all rider dashboard resources.
 */
export const PERMISSIONS = {
  // Profile
  PROFILE_VIEW: "profile:view",
  PROFILE_UPDATE: "profile:update",
  PROFILE_STATUS: "profile:status",

  // Deliveries
  DELIVERIES_VIEW_OWN: "deliveries:view_own",
  DELIVERIES_ACCEPT: "deliveries:accept",
  DELIVERIES_UPDATE_STATUS: "deliveries:update_status",
  DELIVERIES_VIEW_ALL: "deliveries:view_all",
  DELIVERIES_ASSIGN: "deliveries:assign",
  DELIVERIES_REASSIGN: "deliveries:reassign",

  // Earnings
  EARNINGS_VIEW_OWN: "earnings:view_own",
  EARNINGS_VIEW_ALL: "earnings:view_all",

  // Routes
  ROUTES_VIEW_OWN: "routes:view_own",
  ROUTES_OPTIMIZE: "routes:optimize",

  // Notifications
  NOTIFICATIONS_VIEW: "notifications:view",
  NOTIFICATIONS_SEND: "notifications:send",

  // Riders (fleet management)
  RIDERS_VIEW: "riders:view",
  RIDERS_MANAGE: "riders:manage",
  RIDERS_SUSPEND: "riders:suspend",

  // Analytics
  ANALYTICS_VIEW_OWN: "analytics:view_own",
  ANALYTICS_VIEW_FLEET: "analytics:view_fleet",

  // Admin
  SETTINGS_VIEW: "settings:view",
  SETTINGS_MANAGE: "settings:manage",
  AUDIT_LOGS_VIEW: "audit_logs:view",

  // Maps
  MAPS_VIEW: "maps:view",
  MAPS_LIVE_TRACKING: "maps:live_tracking",
};

/**
 * Role-to-permission mapping.
 * Each role inherits permissions from all roles below it.
 */
const ROLE_PERMISSIONS = {
  [ROLES.RIDER]: [
    PERMISSIONS.PROFILE_VIEW,
    PERMISSIONS.PROFILE_UPDATE,
    PERMISSIONS.PROFILE_STATUS,
    PERMISSIONS.DELIVERIES_VIEW_OWN,
    PERMISSIONS.DELIVERIES_ACCEPT,
    PERMISSIONS.DELIVERIES_UPDATE_STATUS,
    PERMISSIONS.EARNINGS_VIEW_OWN,
    PERMISSIONS.ROUTES_VIEW_OWN,
    PERMISSIONS.NOTIFICATIONS_VIEW,
    PERMISSIONS.ANALYTICS_VIEW_OWN,
    PERMISSIONS.MAPS_VIEW,
  ],

  [ROLES.SENIOR_RIDER]: [
    // Inherits all RIDER permissions
    PERMISSIONS.ROUTES_OPTIMIZE,
    PERMISSIONS.MAPS_LIVE_TRACKING,
  ],

  [ROLES.FLEET_SUPERVISOR]: [
    // Inherits all SENIOR_RIDER permissions
    PERMISSIONS.DELIVERIES_VIEW_ALL,
    PERMISSIONS.DELIVERIES_REASSIGN,
    PERMISSIONS.EARNINGS_VIEW_ALL,
    PERMISSIONS.RIDERS_VIEW,
    PERMISSIONS.NOTIFICATIONS_SEND,
    PERMISSIONS.ANALYTICS_VIEW_FLEET,
    PERMISSIONS.MAPS_LIVE_TRACKING,
  ],

  [ROLES.DISPATCH_MANAGER]: [
    // Inherits all FLEET_SUPERVISOR permissions
    PERMISSIONS.DELIVERIES_ASSIGN,
    PERMISSIONS.DELIVERIES_REASSIGN,
    PERMISSIONS.RIDERS_MANAGE,
    PERMISSIONS.SETTINGS_VIEW,
  ],

  [ROLES.LOGISTICS_ADMIN]: [
    // Inherits all permissions
    PERMISSIONS.DELIVERIES_VIEW_ALL,
    PERMISSIONS.DELIVERIES_ASSIGN,
    PERMISSIONS.DELIVERIES_REASSIGN,
    PERMISSIONS.EARNINGS_VIEW_ALL,
    PERMISSIONS.RIDERS_VIEW,
    PERMISSIONS.RIDERS_MANAGE,
    PERMISSIONS.RIDERS_SUSPEND,
    PERMISSIONS.NOTIFICATIONS_SEND,
    PERMISSIONS.ANALYTICS_VIEW_FLEET,
    PERMISSIONS.SETTINGS_VIEW,
    PERMISSIONS.SETTINGS_MANAGE,
    PERMISSIONS.AUDIT_LOGS_VIEW,
    PERMISSIONS.MAPS_LIVE_TRACKING,
  ],
};

/**
 * Role hierarchy order (lower number = lower rank)
 */
const ROLE_HIERARCHY = {
  [ROLES.RIDER]: 0,
  [ROLES.SENIOR_RIDER]: 1,
  [ROLES.FLEET_SUPERVISOR]: 2,
  [ROLES.DISPATCH_MANAGER]: 3,
  [ROLES.LOGISTICS_ADMIN]: 4,
};

class RoleManager {
  /**
   * Get all permissions for a given role (including inherited)
   */
  getPermissionsForRole(role) {
    const userLevel = ROLE_HIERARCHY[role];

    if (userLevel === undefined) {
      // Default to basic rider
      return [...ROLE_PERMISSIONS[ROLES.RIDER]];
    }

    // Collect permissions from all roles at or below this level
    const permissions = new Set();
    for (const [r, level] of Object.entries(ROLE_HIERARCHY)) {
      if (level <= userLevel) {
        const rolePerms = ROLE_PERMISSIONS[r] || [];
        rolePerms.forEach((p) => permissions.add(p));
      }
    }

    return [...permissions];
  }

  /**
   * Check if a role has a specific permission
   */
  hasPermission(role, permission) {
    const permissions = this.getPermissionsForRole(role);
    return permissions.includes(permission);
  }

  /**
   * Check if a role has all of the specified permissions
   */
  hasAllPermissions(role, permissions) {
    return permissions.every((p) => this.hasPermission(role, p));
  }

  /**
   * Check if a role has any of the specified permissions
   */
  hasAnyPermission(role, permissions) {
    return permissions.some((p) => this.hasPermission(role, p));
  }

  /**
   * Get role hierarchy level
   */
  getRoleLevel(role) {
    return ROLE_HIERARCHY[role] ?? -1;
  }

  /**
   * Check if role A has higher or equal rank than role B
   */
  isAtLeast(role, minimumRole) {
    const userLevel = this.getRoleLevel(role);
    const minLevel = this.getRoleLevel(minimumRole);
    return userLevel >= minLevel;
  }

  /**
   * Get all available roles
   */
  getAllRoles() {
    return Object.values(ROLES);
  }

  /**
   * Validate that a role string is a known role
   */
  isValidRole(role) {
    return Object.values(ROLES).includes(role);
  }

  /**
   * Get display name for a role
   */
  getRoleDisplayName(role) {
    const names = {
      [ROLES.RIDER]: "Rider",
      [ROLES.SENIOR_RIDER]: "Senior Rider",
      [ROLES.FLEET_SUPERVISOR]: "Fleet Supervisor",
      [ROLES.DISPATCH_MANAGER]: "Dispatch Manager",
      [ROLES.LOGISTICS_ADMIN]: "Logistics Administrator",
    };
    return names[role] || "Rider";
  }
}

// Singleton
const roleManager = new RoleManager();
export default roleManager;
