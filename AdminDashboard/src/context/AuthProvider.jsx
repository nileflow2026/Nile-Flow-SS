/**
 * AuthProvider.jsx
 * Enterprise-grade authentication provider.
 * Integrates TokenManager, SessionManager, PermissionManager, and AuditLogger.
 * Replaces the legacy AuthContext with a robust, secure implementation.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import * as SessionManager from '../core/auth/SessionManager';
import * as TokenManager from '../core/auth/TokenManager';
import * as AuditLogger from '../core/auth/AuditLogger';
import * as PermissionManager from '../core/auth/PermissionManager';
import { SECURITY_POLICIES, ROLES } from '../core/auth/SecurityPolicies';
import { signinAdmin, signoutAdmin } from '../../authService';

const AuthContext = createContext(null);

/**
 * Hook to consume auth context.
 * Throws if used outside AuthProvider.
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

/**
 * Hook to check a specific permission.
 * Used by components that need fine-grained access control.
 */
export const usePermission = (resource, action) => {
  const { user } = useAuth();
  const role = user?.role || ROLES.ADMIN;
  return PermissionManager.hasPermission(role, resource, action);
};

/**
 * Hook to check route access.
 */
export const useRouteAccess = (path) => {
  const { user } = useAuth();
  const role = user?.role || ROLES.ADMIN;
  return PermissionManager.canAccessRoute(role, path);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [isRestoring, setIsRestoring] = useState(true);
  const initRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  // ============================================================
  // INITIALIZATION — restore session on mount
  // ============================================================
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    let cancelled = false;

    const init = async () => {
      setIsLoading(true);
      setIsRestoring(true);

      try {
        const result = await SessionManager.initializeSession();
        
        if (cancelled) return;

        if (result.authenticated && result.user) {
          setUser(result.user);
          setIsAuthenticated(true);
          AuditLogger.log(AuditLogger.EVENTS.SESSION_RESTORED, {
            userId: result.user.id || result.user.$id,
          });
        } else if (result.authenticated && !result.user) {
          // Session is valid but no user data yet — get current user
          // The /me call will happen via the axios interceptor's silent refresh
          setIsAuthenticated(true);
        } else {
          setUser(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        if (!cancelled) {
          console.error('[AuthProvider] Initialization error:', error);
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
          setIsRestoring(false);
        }
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, []);

  // ============================================================
  // MULTI-TAB SYNC — listen for auth events from other tabs
  // ============================================================
  useEffect(() => {
    const handleAuthSync = (event) => {
      const { type } = event.data || {};
      switch (type) {
        case 'auth:logged-out':
        case 'auth:session-revoked':
          setUser(null);
          setIsAuthenticated(false);
          setAuthError('Your session has been terminated from another tab.');
          AuditLogger.log(AuditLogger.EVENTS.SESSION_EXPIRED, {
            reason: 'multi-tab-sync',
            type,
          });
          break;
        case 'auth:permissions-changed':
          // Re-fetch current user to get updated permissions
          SessionManager.checkSessionHealth().then((healthy) => {
            if (!healthy) {
              setUser(null);
              setIsAuthenticated(false);
            }
          });
          break;
      }
    };

    // Listen for BroadcastChannel events (handled via TokenManager)
    const unsubscribe = TokenManager.subscribe(handleAuthSync);
    return () => unsubscribe();
  }, []);

  // ============================================================
  // LISTEN for forced logout events from axios interceptor
  // ============================================================
  useEffect(() => {
    const handleForcedLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
      TokenManager.markUnauthenticated();
      AuditLogger.log(AuditLogger.EVENTS.LOGOUT, { reason: 'forced' });
    };

    window.addEventListener('auth:logout', handleForcedLogout);
    window.addEventListener('nileflow:forced-logout', handleForcedLogout);
    return () => {
      window.removeEventListener('auth:logout', handleForcedLogout);
      window.removeEventListener('nileflow:forced-logout', handleForcedLogout);
    };
  }, []);

  // ============================================================
  // REDIRECT unauthenticated users to login
  // ============================================================
  useEffect(() => {
    if (isRestoring || isLoading) return;
    if (isAuthenticated) return;

    const publicPaths = ['/login', '/register', '/'];
    const isPublicPath = publicPaths.some(
      (path) => location.pathname === path || location.pathname.startsWith(path)
    );

    if (!isPublicPath) {
      AuditLogger.log(AuditLogger.EVENTS.UNAUTHORIZED_ACCESS, {
        path: location.pathname,
      });
    }
  }, [isAuthenticated, isLoading, isRestoring, location.pathname]);

  // ============================================================
  // SIGN IN
  // ============================================================
  const signin = useCallback(async (email, password) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const deviceId = SessionManager.getDeviceId();
      const result = await signinAdmin(email, password, deviceId);

      if (result.success && result.data?.user) {
        const userData = result.data.user;
        setUser(userData);
        setIsAuthenticated(true);
        TokenManager.markAuthenticated(userData.id || userData.$id);
        SessionManager.startSessionMonitoring();
        AuditLogger.log(AuditLogger.EVENTS.LOGIN_SUCCESS, {
          email,
          userId: userData.id || userData.$id,
        });
        return { success: true };
      } else if (result.success) {
        // Backend may set cookies without returning user data — try to fetch it
        setIsAuthenticated(true);
        TokenManager.markAuthenticated('pending');
        SessionManager.startSessionMonitoring();
        AuditLogger.log(AuditLogger.EVENTS.LOGIN_SUCCESS, { email });
        return { success: true };
      }

      const errorMsg = result.error || 'Login failed. Please check your credentials.';
      setAuthError(errorMsg);
      AuditLogger.log(AuditLogger.EVENTS.LOGIN_FAILURE, { email, error: errorMsg });
      return { success: false, error: errorMsg };
    } catch (error) {
      const errorMsg = error.message || 'An unexpected error occurred during login.';
      setAuthError(errorMsg);
      AuditLogger.log(AuditLogger.EVENTS.LOGIN_FAILURE, { email, error: errorMsg });
      return { success: false, error: errorMsg };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ============================================================
  // LOGOUT
  // ============================================================
  const logout = useCallback(async () => {
    try {
      AuditLogger.log(AuditLogger.EVENTS.LOGOUT, {
        userId: user?.id || user?.$id,
      });
      await signoutAdmin();
    } catch {
      // Proceed with local cleanup even if server request fails
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      TokenManager.markUnauthenticated();
      TokenManager.broadcast('auth:logged-out');
      SessionManager.stopSessionMonitoring();
      navigate('/login');
    }
  }, [navigate, user]);

  // ============================================================
  // UPDATE USER (e.g., after profile update)
  // ============================================================
  const updateUser = useCallback((userData) => {
    setUser((prev) => {
      const updated = { ...prev, ...userData };
      return updated;
    });
  }, []);

  // ============================================================
  // REFRESH USER DATA (re-fetch from backend)
  // ============================================================
  const refreshUser = useCallback(async () => {
    try {
      const { axiosClient } = await import('../../api');
      const response = await axiosClient.get('/api/admin/auth/getcurrentuser');
      if (response.data?.user) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        TokenManager.markAuthenticated(response.data.user.id || response.data.user.$id);
      }
    } catch {
      // Silently fail — may not be authenticated
    }
  }, []);

  // ============================================================
  // PERMISSION HELPERS (exposed via context)
  // ============================================================
  const can = useCallback(
    (resource, action) => {
      const role = user?.role || ROLES.ADMIN;
      return PermissionManager.hasPermission(role, resource, action);
    },
    [user]
  );

  const canAccess = useCallback(
    (path) => {
      const role = user?.role || ROLES.ADMIN;
      return PermissionManager.canAccessRoute(role, path);
    },
    [user]
  );

  const hasRole = useCallback(
    (role) => {
      return user?.role === role;
    },
    [user]
  );

  const isAtLeast = useCallback(
    (role) => {
      const currentRole = user?.role || ROLES.ADMIN;
      return PermissionManager.isRoleAtLeast(currentRole, role);
    },
    [user]
  );

  // ============================================================
  // VALUE
  // ============================================================
  const value = {
    // State
    user,
    isAuthenticated,
    isLoading,
    isRestoring,
    authError,

    // Auth actions
    signin,
    logout,
    updateUser,
    refreshUser,

    // Permission helpers
    can,
    canAccess,
    hasRole,
    isAtLeast,

    // Exposed modules for advanced use
    _permissionManager: PermissionManager,
    _sessionManager: SessionManager,
    _tokenManager: TokenManager,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;
