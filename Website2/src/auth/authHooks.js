/**
 * Auth Hooks
 *
 * Custom React hooks for authentication operations.
 * Provides convenient, reusable hooks for common auth patterns.
 */

import { useCallback, useState, useEffect, useRef } from 'react';
import { useAuth } from './AuthContext';
import { authService } from './authService';
import { permissionManager, ROLES, PERMISSIONS } from './permissionManager';
import { refreshScheduler } from './refreshScheduler';

/**
 * Hook to get current auth state with loading/error states.
 * @returns {Object} Auth state
 */
export function useAuthState() {
  const { user, isAuthenticated, isLoading, isReady, initializationError } = useAuth();
  return { user, isAuthenticated, isLoading, isReady, initializationError };
}

/**
 * Hook to get the current user with guaranteed non-null after auth.
 * @returns {Object|null}
 */
export function useUser() {
  const { user } = useAuth();
  return user;
}

/**
 * Hook for checking authentication status.
 * @returns {boolean}
 */
export function useIsAuthenticated() {
  const { isAuthenticated } = useAuth();
  return isAuthenticated;
}

/**
 * Hook for login with loading/error state.
 * @returns {Object} { login, isLoading, error }
 */
export function useLogin() {
  const { signIn } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signIn(email, password);
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      setError(err?.message || 'Login failed');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [signIn]);

  return { login, isLoading, error };
}

/**
 * Hook for signup with loading/error state.
 * @returns {Object} { signup, isLoading, error }
 */
export function useSignUp() {
  const { signUp } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const signup = useCallback(async (email, password, username, phone) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await signUp(email, password, username, phone);
      if (!result.success) {
        setError(result.error);
      }
      return result;
    } catch (err) {
      setError(err?.message || 'Signup failed');
      return { success: false, error: err?.message };
    } finally {
      setIsLoading(false);
    }
  }, [signUp]);

  return { signup, isLoading, error };
}

/**
 * Hook for logout with loading state.
 * @returns {Object} { logout, isLoading }
 */
export function useLogout() {
  const { signOut } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await signOut();
    } finally {
      setIsLoading(false);
    }
  }, [signOut]);

  return { logout, isLoading };
}

/**
 * Hook for checking role-based access.
 * @param {string} requiredRole
 * @returns {boolean}
 */
export function useRole(requiredRole) {
  // Use state that updates when auth state changes
  const { isAuthenticated } = useAuth();
  return isAuthenticated && permissionManager.hasRole(requiredRole);
}

/**
 * Hook for checking permission-based access.
 * @param {string} requiredPermission
 * @returns {boolean}
 */
export function usePermission(requiredPermission) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated && permissionManager.hasPermission(requiredPermission);
}

/**
 * Hook to check if user is an admin.
 * @returns {boolean}
 */
export function useIsAdmin() {
  return useRole(ROLES.ADMIN);
}

/**
 * Hook to check if user is a vendor.
 * @returns {boolean}
 */
export function useIsVendor() {
  return useRole(ROLES.VENDOR);
}

/**
 * Hook to check if user owns a specific resource.
 * @param {string} resourceOwnerId
 * @returns {boolean}
 */
export function useResourceOwner(resourceOwnerId) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user || !resourceOwnerId) return false;
  return user.$id === resourceOwnerId || user.id === resourceOwnerId;
}

/**
 * Hook to check if a user can access a specific resource.
 * @param {string} resourceOwnerId
 * @returns {boolean}
 */
export function useCanAccessResource(resourceOwnerId) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated || !user || !resourceOwnerId) return false;
  if (permissionManager.hasRole(ROLES.ADMIN)) return true;
  return user.$id === resourceOwnerId || user.id === resourceOwnerId;
}

/**
 * Hook to trigger a manual token refresh.
 * @returns {Object} { refresh, isRefreshing, lastResult }
 */
export function useTokenRefresh() {
  const { refreshNow, isRefreshing } = useAuth();
  const [lastResult, setLastResult] = useState(null);

  const refresh = useCallback(async () => {
    const result = await refreshNow();
    setLastResult(result);
    return result;
  }, [refreshNow]);

  return { refresh, isRefreshing, lastResult };
}

/**
 * Hook that syncs cross-tab auth state.
 * @param {Function} onUpdate - Called when auth state changes from another tab
 */
export function useCrossTabSync(onUpdate) {
  const ref = useRef(onUpdate);
  ref.current = onUpdate;

  useEffect(() => {
    const { crossTabSync } = require('./crossTabSync');
    const unsubLogin = crossTabSync.onLogin((data) => ref.current?.('login', data));
    const unsubLogout = crossTabSync.onLogout(() => ref.current?.('logout'));
    const unsubForce = crossTabSync.onForceLogout(() => ref.current?.('force_logout'));

    return () => {
      unsubLogin();
      unsubLogout();
      unsubForce();
    };
  }, []);
}

/**
 * Hook to check if the auth system is initializing (for splash screens).
 * @returns {boolean}
 */
export function useAuthInit() {
  const { isLoading } = useAuth();
  return isLoading;
}

/**
 * Hook that provides a stable reference to the current user's ID.
 * Returns null if not authenticated.
 * @returns {string|null}
 */
export function useUserId() {
  const { user } = useAuth();
  return user?.$id || user?.id || null;
}
