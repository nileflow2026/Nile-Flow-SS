/**
 * PermissionManager
 *
 * Enterprise-grade role-based access control (RBAC).
 * Defines roles, permissions, and authorization checks.
 *
 * Roles hierarchy:
 *   super_admin > admin > support > finance > operations > developer > vendor > customer
 *
 * Each role has a set of permissions. Higher roles inherit
 * permissions from lower roles.
 */

const ROLES = {
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  SUPPORT: 'support',
  FINANCE: 'finance',
  OPERATIONS: 'operations',
  DEVELOPER: 'developer',
  VENDOR: 'vendor',
  CUSTOMER: 'customer',
  GUEST: 'guest',
};

const ROLE_HIERARCHY = {
  [ROLES.SUPER_ADMIN]: 100,
  [ROLES.ADMIN]: 90,
  [ROLES.SUPPORT]: 70,
  [ROLES.FINANCE]: 65,
  [ROLES.OPERATIONS]: 60,
  [ROLES.DEVELOPER]: 50,
  [ROLES.VENDOR]: 30,
  [ROLES.CUSTOMER]: 20,
  [ROLES.GUEST]: 10,
};

const PERMISSIONS = {
  // ── User Management ──────────────────────────────────────────
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  USER_IMPERSONATE: 'user:impersonate',

  // ── Product Management ───────────────────────────────────────
  PRODUCT_READ: 'product:read',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  PRODUCT_APPROVE: 'product:approve',

  // ── Order Management ─────────────────────────────────────────
  ORDER_READ: 'order:read',
  ORDER_CREATE: 'order:create',
  ORDER_UPDATE: 'order:update',
  ORDER_DELETE: 'order:delete',
  ORDER_REFUND: 'order:refund',
  ORDER_CANCEL: 'order:cancel',

  // ── Payment Management ───────────────────────────────────────
  PAYMENT_READ: 'payment:read',
  PAYMENT_REFUND: 'payment:refund',
  PAYMENT_CONFIGURE: 'payment:configure',

  // ── Vendor Management ────────────────────────────────────────
  VENDOR_READ: 'vendor:read',
  VENDOR_APPROVE: 'vendor:approve',
  VENDOR_SUSPEND: 'vendor:suspend',

  // ── Admin ────────────────────────────────────────────────────
  ADMIN_READ: 'admin:read',
  ADMIN_WRITE: 'admin:write',
  SYSTEM_CONFIG: 'system:config',
  AUDIT_LOG_READ: 'audit:read',

  // ── Content Management ───────────────────────────────────────
  CONTENT_READ: 'content:read',
  CONTENT_CREATE: 'content:create',
  CONTENT_UPDATE: 'content:update',
  CONTENT_DELETE: 'content:delete',
  CONTENT_MODERATE: 'content:moderate',

  // ── Analytics ────────────────────────────────────────────────
  ANALYTICS_READ: 'analytics:read',
  ANALYTICS_EXPORT: 'analytics:export',
  REPORTS_READ: 'reports:read',

  // ── Subscription / Premium ───────────────────────────────────
  PREMIUM_READ: 'premium:read',
  PREMIUM_MANAGE: 'premium:manage',
  SUBSCRIPTION_READ: 'subscription:read',
  SUBSCRIPTION_MANAGE: 'subscription:manage',

  // ── Support ──────────────────────────────────────────────────
  TICKET_READ: 'ticket:read',
  TICKET_CREATE: 'ticket:create',
  TICKET_UPDATE: 'ticket:update',
  TICKET_RESOLVE: 'ticket:resolve',
  TICKET_ASSIGN: 'ticket:assign',

  // ── Finance ──────────────────────────────────────────────────
  FINANCE_READ: 'finance:read',
  FINANCE_EXPORT: 'finance:export',
  FINANCE_CONFIGURE: 'finance:configure',
  DISPUTE_RESOLVE: 'dispute:resolve',
};

// ── Role → Permission Mapping ─────────────────────────────────
// Higher roles inherit all permissions from lower roles.
const ROLE_PERMISSIONS = {
  [ROLES.GUEST]: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.CONTENT_READ,
    PERMISSIONS.USER_CREATE,
  ],

  [ROLES.CUSTOMER]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_CREATE,
    PERMISSIONS.ORDER_CANCEL,
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.TICKET_CREATE,
    'review:create',
    'review:read',
    'favorite:manage',
    'address:manage',
    PERMISSIONS.PREMIUM_READ,
    PERMISSIONS.SUBSCRIPTION_READ,
  ],

  [ROLES.VENDOR]: [
    PERMISSIONS.PRODUCT_CREATE,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.PRODUCT_DELETE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.VENDOR_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.REPORTS_READ,
  ],

  [ROLES.DEVELOPER]: [
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.AUDIT_LOG_READ,
    PERMISSIONS.ANALYTICS_READ,
    PERMISSIONS.ANALYTICS_EXPORT,
  ],

  [ROLES.OPERATIONS]: [
    PERMISSIONS.ORDER_UPDATE,
    PERMISSIONS.ORDER_REFUND,
    PERMISSIONS.VENDOR_READ,
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.TICKET_UPDATE,
    PERMISSIONS.TICKET_ASSIGN,
    PERMISSIONS.REPORTS_READ,
  ],

  [ROLES.FINANCE]: [
    PERMISSIONS.PAYMENT_READ,
    PERMISSIONS.PAYMENT_REFUND,
    PERMISSIONS.FINANCE_READ,
    PERMISSIONS.FINANCE_EXPORT,
    PERMISSIONS.FINANCE_CONFIGURE,
    PERMISSIONS.DISPUTE_RESOLVE,
    PERMISSIONS.ORDER_REFUND,
    PERMISSIONS.REPORTS_READ,
    PERMISSIONS.AUDIT_LOG_READ,
  ],

  [ROLES.SUPPORT]: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.USER_UPDATE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.TICKET_READ,
    PERMISSIONS.TICKET_UPDATE,
    PERMISSIONS.TICKET_RESOLVE,
    PERMISSIONS.TICKET_ASSIGN,
    PERMISSIONS.CONTENT_MODERATE,
    PERMISSIONS.PRODUCT_APPROVE,
    PERMISSIONS.VENDOR_READ,
  ],

  [ROLES.ADMIN]: [
    PERMISSIONS.ADMIN_READ,
    PERMISSIONS.ADMIN_WRITE,
    PERMISSIONS.USER_CREATE,
    PERMISSIONS.USER_DELETE,
    PERMISSIONS.VENDOR_APPROVE,
    PERMISSIONS.VENDOR_SUSPEND,
    PERMISSIONS.SUBSCRIPTION_MANAGE,
    PERMISSIONS.PREMIUM_MANAGE,
    PERMISSIONS.AUDIT_LOG_READ,
  ],

  [ROLES.SUPER_ADMIN]: [
    PERMISSIONS.USER_IMPERSONATE,
    PERMISSIONS.SYSTEM_CONFIG,
    PERMISSIONS.AUDIT_LOG_READ,
    PERMISSIONS.FINANCE_CONFIGURE,
    PERMISSIONS.PAYMENT_CONFIGURE,
  ],
};

class PermissionManager {
  constructor() {
    this._currentRole = ROLES.GUEST;
    this._cachedPermissions = new Set();
    this._initialized = false;
  }

  /**
   * Initialize with a user's role.
   * @param {string} role
   */
  initialize(role) {
    this._currentRole = role || ROLES.GUEST;
    this._buildPermissionCache();
    this._initialized = true;
  }

  /**
   * Build the cached set of all permissions for the current role,
   * including inherited permissions from lower roles.
   */
  _buildPermissionCache() {
    this._cachedPermissions = new Set();

    const currentLevel = ROLE_HIERARCHY[this._currentRole] || 0;

    // Collect all roles at or below the current level
    Object.entries(ROLE_HIERARCHY).forEach(([role, level]) => {
      if (level <= currentLevel) {
        const perms = ROLE_PERMISSIONS[role] || [];
        perms.forEach((perm) => this._cachedPermissions.add(perm));
      }
    });
  }

  /**
   * Check if the current user has a specific permission.
   * @param {string} permission
   * @returns {boolean}
   */
  hasPermission(permission) {
    if (!this._initialized) return false;
    return this._cachedPermissions.has(permission);
  }

  /**
   * Check if the current user has ALL of the specified permissions.
   * @param {string[]} permissions
   * @returns {boolean}
   */
  hasAllPermissions(permissions) {
    if (!this._initialized) return false;
    return permissions.every((perm) => this._cachedPermissions.has(perm));
  }

  /**
   * Check if the current user has ANY of the specified permissions.
   * @param {string[]} permissions
   * @returns {boolean}
   */
  hasAnyPermission(permissions) {
    if (!this._initialized) return false;
    return permissions.some((perm) => this._cachedPermissions.has(perm));
  }

  /**
   * Check if the user has at least the given role level.
   * @param {string} requiredRole
   * @returns {boolean}
   */
  hasRole(requiredRole) {
    const userLevel = ROLE_HIERARCHY[this._currentRole] || 0;
    const requiredLevel = ROLE_HIERARCHY[requiredRole] || 0;
    return userLevel >= requiredLevel;
  }

  /**
   * Get the current user's role.
   * @returns {string}
   */
  getRole() {
    return this._currentRole;
  }

  /**
   * Get all permissions for the current role.
   * @returns {string[]}
   */
  getPermissions() {
    return Array.from(this._cachedPermissions);
  }

  /**
   * Check if the user can access a resource owned by a specific user.
   * @param {Object} user - The current user
   * @param {string} resourceOwnerId - The owner of the resource
   * @returns {boolean}
   */
  canAccessResource(user, resourceOwnerId) {
    if (!user || !resourceOwnerId) return false;

    // Admin/super_admin can access any resource
    if (this.hasRole(ROLES.ADMIN)) return true;

    // Users can access their own resources
    return user.$id === resourceOwnerId || user.id === resourceOwnerId;
  }

  /**
   * Update the user's role (e.g., role changed).
   * @param {string} newRole
   */
  updateRole(newRole) {
    this._currentRole = newRole || ROLES.GUEST;
    this._buildPermissionCache();
  }

  /**
   * Reset to guest.
   */
  reset() {
    this._currentRole = ROLES.GUEST;
    this._cachedPermissions = new Set();
    this._initialized = false;
  }

  /**
   * Check if initialized.
   * @returns {boolean}
   */
  isInitialized() {
    return this._initialized;
  }
}

// Singleton
export const permissionManager = new PermissionManager();
export {
  ROLES,
  PERMISSIONS,
  ROLE_HIERARCHY,
};
export default permissionManager;
