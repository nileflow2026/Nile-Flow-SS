/**
 * PermissionManager.js
 * Centralized permission checking service for the Admin Dashboard.
 * All authorization decisions go through this module.
 * Never check permissions directly in UI components — use this manager.
 */

import { ROLE_PERMISSIONS, ACTIONS, ROLES, ROLE_HIERARCHY } from './SecurityPolicies';

/**
 * Check if a role has permission for a specific resource + action.
 * @param {string} role - User's role identifier
 * @param {string} resource - Resource to check (one of PERMISSIONS values)
 * @param {string} action - Action to check (one of ACTIONS values)
 * @returns {boolean}
 */
export function hasPermission(role, resource, action) {
  if (!role || !resource || !action) return false;

  const rolePermissions = ROLE_PERMISSIONS[role];
  if (!rolePermissions) return false;

  const resourceActions = rolePermissions[resource];
  if (!resourceActions) return false;

  // MANAGE action implies all other actions for that resource
  if (resourceActions.includes(ACTIONS.MANAGE)) return true;

  return resourceActions.includes(action);
}

/**
 * Check multiple permissions at once. All must pass.
 * @param {string} role - User's role identifier
 * @param {Array<{resource: string, action: string}>} checks
 * @returns {boolean}
 */
export function hasAllPermissions(role, checks) {
  if (!Array.isArray(checks)) return false;
  return checks.every(({ resource, action }) => hasPermission(role, resource, action));
}

/**
 * Check if any of the given permissions pass.
 * @param {string} role - User's role identifier
 * @param {Array<{resource: string, action: string}>} checks
 * @returns {boolean}
 */
export function hasAnyPermission(role, checks) {
  if (!Array.isArray(checks)) return false;
  return checks.some(({ resource, action }) => hasPermission(role, resource, action));
}

/**
 * Get all permissions for a given role.
 * Returns an object like: { users: ['view', 'edit'], orders: ['view'] }
 * @param {string} role
 * @returns {Object}
 */
export function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || {};
}

/**
 * Get all resources a role can access.
 * @param {string} role
 * @returns {string[]}
 */
export function getAccessibleResources(role) {
  const perms = getRolePermissions(role);
  return Object.keys(perms).filter((resource) => perms[resource]?.length > 0);
}

/**
 * Check if role A has higher or equal privilege than role B.
 * @param {string} roleA
 * @param {string} roleB
 * @returns {boolean}
 */
export function isRoleAtLeast(roleA, roleB) {
  const idxA = ROLE_HIERARCHY.indexOf(roleA);
  const idxB = ROLE_HIERARCHY.indexOf(roleB);
  if (idxA === -1 || idxB === -1) return false;
  return idxA >= idxB;
}

/**
 * Filter a list of allowed resources down to only those the role can access.
 * Useful for rendering dynamic navigation.
 * @param {string} role
 * @param {string[]} resources - Array of resource identifiers
 * @returns {string[]}
 */
export function filterAccessibleResources(role, resources) {
  const accessible = getAccessibleResources(role);
  return resources.filter((r) => accessible.includes(r));
}

/**
 * Get all actions a role can perform on a specific resource.
 * @param {string} role
 * @param {string} resource
 * @returns {string[]}
 */
export function getResourceActions(role, resource) {
  const perms = getRolePermissions(role);
  return perms[resource] || [];
}

/**
 * Check if the user can access a specific route path.
 * Maps routes to required permissions.
 * @param {string} role
 * @param {string} path - Route path (e.g., '/dashboard', '/users')
 * @returns {boolean}
 */
export function canAccessRoute(role, path) {
  const routeMap = {
    '/': PERMISSIONS.DASHBOARD,
    '/dashboard': PERMISSIONS.DASHBOARD,
    '/users': PERMISSIONS.USERS,
    '/users/': PERMISSIONS.USERS,
    '/orders': PERMISSIONS.ORDERS,
    '/products': PERMISSIONS.PRODUCTS,
    '/productapprovals': PERMISSIONS.PRODUCTS,
    '/vendors': PERMISSIONS.VENDORS,
    '/finance': PERMISSIONS.FINANCE,
    '/settings': PERMISSIONS.SETTINGS,
    '/analytics': PERMISSIONS.ANALYTICS,
    '/commission': PERMISSIONS.COMMISSION,
    '/staff': PERMISSIONS.STAFF,
    '/audit-logs': PERMISSIONS.AUDIT_LOGS,
    '/notifications': PERMISSIONS.NOTIFICATIONS,
    '/marketing': PERMISSIONS.MARKETING,
    '/group-buy': PERMISSIONS.ORDERS,
    '/language-settings': PERMISSIONS.SETTINGS,
    '/security': PERMISSIONS.SECURITY,
  };

  // Find matching route (support dynamic segments)
  const matchedResource = Object.entries(routeMap).find(([routePath, _resource]) => {
    if (routePath.endsWith('/')) {
      return path.startsWith(routePath);
    }
    return path === routePath;
  });

  if (!matchedResource) return false;
  const resource = matchedResource[1];
  return hasPermission(role, resource, ACTIONS.VIEW);
}

/**
 * Get all route paths accessible to a role.
 * @param {string} role
 * @returns {string[]}
 */
export function getAccessibleRoutes(role) {
  const routeMap = {
    '/dashboard': PERMISSIONS.DASHBOARD,
    '/users': PERMISSIONS.USERS,
    '/orders': PERMISSIONS.ORDERS,
    '/products': PERMISSIONS.PRODUCTS,
    '/productapprovals': PERMISSIONS.PRODUCTS,
    '/vendors': PERMISSIONS.VENDORS,
    '/finance': PERMISSIONS.FINANCE,
    '/settings': PERMISSIONS.SETTINGS,
    '/analytics': PERMISSIONS.ANALYTICS,
    '/commission': PERMISSIONS.COMMISSION,
    '/staff': PERMISSIONS.STAFF,
    '/audit-logs': PERMISSIONS.AUDIT_LOGS,
    '/notifications': PERMISSIONS.NOTIFICATIONS,
    '/marketing': PERMISSIONS.MARKETING,
    '/group-buy': PERMISSIONS.ORDERS,
    '/language-settings': PERMISSIONS.SETTINGS,
    '/security': PERMISSIONS.SECURITY,
  };

  return Object.entries(routeMap)
    .filter(([_, resource]) => hasPermission(role, resource, ACTIONS.VIEW))
    .map(([route]) => route);
}

export default {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getRolePermissions,
  getAccessibleResources,
  isRoleAtLeast,
  filterAccessibleResources,
  getResourceActions,
  canAccessRoute,
  getAccessibleRoutes,
};
