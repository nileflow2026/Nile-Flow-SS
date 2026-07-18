/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable react-refresh/only-export-components */
// src/auth/RouteGuards.jsx
/**
 * Route protection components and hooks.
 * Ensures protected content never renders before authorization completes.
 * Redirects unauthorized users without flash of protected content.
 */
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRiderAuth } from "../Context/RiderAuthContext";
import roleManager from "./RoleManager";
import riderAuthorization from "./RiderAuthorization";
import auditLogger from "./AuditLogger";

/**
 * Loading spinner shown during auth initialization
 */
const AuthLoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gray-900">
    <div className="relative">
      <div className="w-20 h-20 border-4 border-blue-900/30 border-t-blue-500 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <svg
          className="w-10 h-10 text-blue-500 animate-pulse"
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12z" />
        </svg>
      </div>
    </div>
  </div>
);

/**
 * Primary route guard for all protected rider pages.
 * - Shows loading state while auth initializes
 * - Redirects to login if not authenticated
 * - Checks rider status (suspended/blocked riders are redirected)
 * - Optionally checks minimum role level
 * - Optionally checks specific permission
 */
export const RiderProtectedRoute = ({
  children,
  requiredRole,
  requiredPermission,
  fallbackPath = "/rider/login",
}) => {
  const { rider, isAuthenticated, loading } = useRiderAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (!isAuthenticated || !rider) {
    auditLogger.unauthorizedAccess(location.pathname, "not_authenticated");
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check rider status
  const statusCheck = riderAuthorization.checkRiderStatus(rider);
  if (!statusCheck.allowed) {
    auditLogger.unauthorizedAccess(location.pathname, statusCheck.reason);
    return (
      <Navigate
        to="/rider/login"
        state={{
          blocked: true,
          reason: statusCheck.reason,
          message: statusCheck.message,
        }}
        replace
      />
    );
  }

  // Check minimum role
  if (
    requiredRole &&
    !roleManager.isAtLeast(rider.role || "rider", requiredRole)
  ) {
    auditLogger.forbiddenAccess(location.pathname, rider.role, requiredRole);
    // Redirect to dashboard with access denied
    return (
      <Navigate to="/rider/dashboard" state={{ accessDenied: true }} replace />
    );
  }

  // Check specific permission
  if (requiredPermission) {
    const hasPermission = roleManager.hasPermission(
      rider.role || "rider",
      requiredPermission,
    );
    if (!hasPermission) {
      auditLogger.forbiddenAccess(
        location.pathname,
        rider.role,
        requiredPermission,
      );
      return (
        <Navigate
          to="/rider/dashboard"
          state={{ accessDenied: true }}
          replace
        />
      );
    }
  }

  return children;
};

/**
 * Public-only route guard — redirects authenticated riders to dashboard.
 * Prevents login/register pages from flashing before redirect.
 */
export const PublicOnlyRoute = ({ children }) => {
  const { isAuthenticated, loading } = useRiderAuth();
  const location = useLocation();

  if (loading) {
    return <AuthLoadingScreen />;
  }

  if (isAuthenticated) {
    const from = location.state?.from?.pathname || "/rider/dashboard";
    return <Navigate to={from} replace />;
  }

  return children;
};

/**
 * Higher-order component for checking permissions within components.
 * Use this when you need conditionally render UI based on permissions.
 */
export const usePermission = (permission) => {
  const { rider } = useRiderAuth();
  const [hasPermission, setHasPermission] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (rider) {
      const result = roleManager.hasPermission(
        rider.role || "rider",
        permission,
      );
      setHasPermission(result);
    } else {
      setHasPermission(false);
    }
    setChecking(false);
  }, [rider, permission]);

  return { hasPermission, checking };
};

/**
 * Conditionally render children based on permission.
 * Useful for showing/hiding UI elements based on role.
 */
export const PermissionGate = ({ children, permission, fallback = null }) => {
  const { hasPermission, checking } = usePermission(permission);

  if (checking) return null;
  if (!hasPermission) return fallback;
  return children;
};

/**
 * Check if the current rider has a minimum role level.
 */
export const useMinimumRole = (minimumRole) => {
  const { rider } = useRiderAuth();
  const [hasRole, setHasRole] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (rider) {
      const result = roleManager.isAtLeast(rider.role || "rider", minimumRole);
      setHasRole(result);
    } else {
      setHasRole(false);
    }
    setChecking(false);
  }, [rider, minimumRole]);

  return { hasRole, checking };
};

export default RiderProtectedRoute;
