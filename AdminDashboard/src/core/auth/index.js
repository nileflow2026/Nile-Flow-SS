/**
 * @auth — Nile Flow Admin Dashboard Authentication & Authorization Module
 *
 * Enterprise-grade authentication system.
 * All security-sensitive imports should come through this barrel file.
 *
 * Architecture:
 *   SecurityPolicies.js   → Centralized config (roles, permissions, security params)
 *   PermissionManager.js  → RBAC + fine-grained permission checks
 *   TokenManager.js       → Token state, refresh coordination, multi-tab sync
 *   SessionManager.js     → Session lifecycle, silent refresh, proactive renewal
 *   AuditLogger.js        → Client-side security audit events
 *   RouteGuard.jsx        → Route/component protection components
 *
 * Usage:
 *   import { AuthProvider, useAuth } from './core/auth';
 *   import { RouteGuard, PermissionGuard } from './core/auth';
 *   import { hasPermission } from './core/auth';
 */

// Provider & Hooks
export { AuthProvider, useAuth, usePermission, useRouteAccess } from '../../context/AuthProvider';

// Route & Component Guards
export { RouteGuard, PermissionGuard, RoleGuard } from './RouteGuard';

// Authorization
export { hasPermission, canAccessRoute, isRoleAtLeast, getAccessibleRoutes, getResourceActions } from './PermissionManager';

// Security Configuration
export { SECURITY_POLICIES, ROLES, PERMISSIONS, ACTIONS, ROLE_PERMISSIONS, ROLE_HIERARCHY } from './SecurityPolicies';

// Session Management
export { initializeSession, silentRefresh, startSessionMonitoring, stopSessionMonitoring, getDeviceId } from './SessionManager';

// Token Management
export { subscribe as subscribeToAuthEvents, broadcast as broadcastAuthEvent, isAuthenticated as tokenIsAuthenticated } from './TokenManager';

// Audit Logging
export { log as logAuditEvent, EVENTS as AuditEvents, getSessionAuditLog } from './AuditLogger';
