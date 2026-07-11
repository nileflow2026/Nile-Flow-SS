/**
 * RouteGuard.jsx
 * Enterprise-grade route protection component.
 * Wraps protected routes and handles:
 * - Authentication verification (no flash of protected content)
 * - Role/permission-based authorization
 * - Loading states during session restoration
 * - Redirect to login with return URL preservation
 * - Audit logging of unauthorized access attempts
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthProvider';
import * as AuditLogger from './AuditLogger';
import { ROLES } from './SecurityPolicies';

/**
 * Loading spinner shown during auth initialization.
 * Prevents flash of login page during session restoration.
 */
function AuthLoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#FAF7F2] via-[#F5E6D3] to-[#E8D6B5] dark:from-[#1A1A1A] dark:via-[#242424] dark:to-[#2A2A2A]">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 border-4 border-[#D4A017] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <div className="space-y-2">
          <p className="text-lg font-semibold text-[#2C1810] dark:text-[#F5E6D3]">
            Verifying your session
          </p>
          <p className="text-sm text-[#8B4513]/70 dark:text-[#D4A017]/70">
            Securely connecting to Nile Flow Africa
          </p>
        </div>
      </div>
    </div>
  );
}

/**
 * RouteGuard — protects routes requiring authentication.
 *
 * Usage:
 * <Route path="/dashboard" element={<RouteGuard><Dashboard /></RouteGuard>} />
 *
 * Optionally restrict by role:
 * <RouteGuard requiredRole={ROLES.FINANCE} requiredResource="finance" requiredAction="view">
 *   <Finance />
 * </RouteGuard>
 */
export function RouteGuard({
  children,
  requiredRole,
  requiredResource,
  requiredAction = 'view',
  fallbackPath = '/login',
}) {
  const { isAuthenticated, isLoading, isRestoring, user, can } = useAuth();
  const location = useLocation();

  // === Loading state: never flash protected content ===
  if (isLoading || isRestoring) {
    return <AuthLoadingSpinner />;
  }

  // === Not authenticated: redirect to login ===
  if (!isAuthenticated) {
    AuditLogger.log(AuditLogger.EVENTS.UNAUTHORIZED_ACCESS, {
      path: location.pathname,
      requiredRole,
      requiredResource,
    });
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // === Role check: if requiredRole is specified ===
  if (requiredRole && user?.role !== requiredRole) {
    const userRole = user?.role || ROLES.ADMIN;
    // Check hierarchy: allow access if user's role is at least the required level
    if (!can('security', 'manage')) {
      AuditLogger.log(AuditLogger.EVENTS.FORBIDDEN_ACCESS, {
        path: location.pathname,
        userRole,
        requiredRole,
      });
      return <Navigate to="/dashboard" replace />;
    }
  }

  // === Resource permission check ===
  if (requiredResource && !can(requiredResource, requiredAction)) {
    AuditLogger.log(AuditLogger.EVENTS.PERMISSION_DENIED, {
      path: location.pathname,
      requiredResource,
      requiredAction,
      userRole: user?.role,
    });
    return <Navigate to="/dashboard" replace />;
  }

  // === Authorized: render children ===
  return children;
}

/**
 * PermissionGuard — wraps individual UI elements to conditionally render
 * based on permissions. Does NOT redirect — simply hides.
 *
 * Usage:
 * <PermissionGuard resource="users" action="delete">
 *   <button>Delete User</button>
 * </PermissionGuard>
 */
export function PermissionGuard({ children, resource, action, fallback = null }) {
  const { can } = useAuth();

  if (!can(resource, action)) {
    return fallback;
  }

  return children;
}

/**
 * RoleGuard — wraps UI elements to conditionally render based on role.
 *
 * Usage:
 * <RoleGuard role={ROLES.SUPER_ADMIN}>
 *   <button>Danger Zone Settings</button>
 * </RoleGuard>
 */
export function RoleGuard({ children, role, fallback = null }) {
  const { hasRole } = useAuth();

  if (!hasRole(role)) {
    return fallback;
  }

  return children;
}

export default RouteGuard;
