/**
 * Route Guards
 *
 * Enterprise-grade route protection components.
 * Uses the new auth context with proper state hydration.
 *
 * Features:
 * - Prevents unauthorized access to protected routes
 * - Prevents authenticated users from accessing guest-only routes
 * - Shows loading spinner during auth initialization (no flickering)
 * - Role-based access control
 * - Permission-based access control
 * - Single navigation decision (no duplicate Navigate calls)
 */

import { useRef, useMemo } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { permissionManager, ROLES } from './permissionManager';
import Loader from '@shared/ui/loader/Loader';

/**
 * ProtectedRoute — Requires authentication.
 * If not authenticated, redirects to login.
 */
export function ProtectedRoute({
  children,
  redirectTo = '/login',
  requiredRole,
  requiredPermission,
  fallback,
}) {
  const { isAuthenticated, isLoading, isReady, user } = useAuth();
  const location = useLocation();
  const decidedRef = useRef(false);

  // Auth still loading — show spinner
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <Loader label="Verifying session…" />
      </div>
    );
  }

  // Not authenticated — redirect (once)
  if (!decidedRef.current && !isAuthenticated) {
    decidedRef.current = true;
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  // Role check
  if (requiredRole && isAuthenticated) {
    if (!permissionManager.hasRole(requiredRole)) {
      if (fallback) return fallback;
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // Permission check
  if (requiredPermission && isAuthenticated) {
    if (!permissionManager.hasPermission(requiredPermission)) {
      if (fallback) return fallback;
      return <Navigate to="/unauthorized" replace />;
    }
  }

  // If both conditions passed or we're past the decision — render children
  if (isAuthenticated || (!decidedRef.current && !isAuthenticated)) {
    decidedRef.current = true;
  }

  return children;
}

/**
 * GuestRoute — Only accessible to unauthenticated users.
 * If authenticated, redirects to home.
 */
export function GuestRoute({
  children,
  redirectTo = '/home',
  fallback,
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const decidedRef = useRef(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <Loader label="Loading…" />
      </div>
    );
  }

  if (!decidedRef.current && isAuthenticated) {
    decidedRef.current = true;
    return <Navigate to={redirectTo} replace />;
  }

  return children;
}

/**
 * RoleRoute — Only accessible to users with a specific role or higher.
 */
export function RoleRoute({
  children,
  role,
  redirectTo = '/login',
  fallback,
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const decidedRef = useRef(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <Loader label="Verifying access…" />
      </div>
    );
  }

  if (!decidedRef.current && !isAuthenticated) {
    decidedRef.current = true;
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  if (!decidedRef.current && !permissionManager.hasRole(role)) {
    decidedRef.current = true;
    if (fallback) return fallback;
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

/**
 * PermissionRoute — Only accessible to users with a specific permission.
 */
export function PermissionRoute({
  children,
  permission,
  redirectTo = '/login',
  fallback,
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const decidedRef = useRef(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)]">
        <Loader label="Verifying access…" />
      </div>
    );
  }

  if (!decidedRef.current && !isAuthenticated) {
    decidedRef.current = true;
    return (
      <Navigate
        to={redirectTo}
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  if (!decidedRef.current && !permissionManager.hasPermission(permission)) {
    decidedRef.current = true;
    if (fallback) return fallback;
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
}
