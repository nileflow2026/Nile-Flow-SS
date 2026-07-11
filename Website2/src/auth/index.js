/**
 * Auth Module — Barrel Export
 *
 * Import auth features from here:
 *   import { AuthProvider, useAuth, ProtectedRoute } from '@auth'
 *
 * Architecture:
 *   src/auth/
 *     index.js            ← Barrel export (this file)
 *     AuthContext.jsx      ← React provider + context
 *     routeGuards.js       ← Route protection components
 *     authHooks.js         ← React hooks for auth
 *     authService.js       ← Auth API service layer
 *     tokenManager.js      ← Secure token storage
 *     sessionManager.js     ← Session lifecycle management
 *     refreshScheduler.js  ← Proactive token refresh
 *     permissionManager.js ← RBAC implementation
 *     authUtils.js         ← Utility functions
 *     securityLogger.js    ← Security event logging
 *     crossTabSync.js      ← Cross-tab state sync
 */

// ── React Context & Provider ─────────────────────────────────────
export { AuthProvider, useAuth } from './AuthContext';

// ── Route Guards ─────────────────────────────────────────────────
export {
  ProtectedRoute,
  GuestRoute,
  RoleRoute,
  PermissionRoute,
} from './routeGuards';

// ── Auth Hooks ───────────────────────────────────────────────────
export {
  useAuthState,
  useUser,
  useIsAuthenticated,
  useLogin,
  useSignUp,
  useLogout,
  useRole,
  usePermission,
  useIsAdmin,
  useIsVendor,
  useResourceOwner,
  useCanAccessResource,
  useTokenRefresh,
  useCrossTabSync,
  useAuthInit,
  useUserId,
} from './authHooks';

// ── Services ─────────────────────────────────────────────────────
export { authService } from './authService';

// ── OAuth Bridge ─────────────────────────────────────────────────
export { oauthBridge } from './oauthBridge';

// ── Token Management ─────────────────────────────────────────────
export { secureTokenManager } from './tokenManager';

// ── Session Management ───────────────────────────────────────────
export { sessionManager } from './sessionManager';

// ── Refresh Scheduler ────────────────────────────────────────────
export { refreshScheduler } from './refreshScheduler';

// ── Permission / RBAC ────────────────────────────────────────────
export {
  permissionManager,
  ROLES,
  PERMISSIONS,
  ROLE_HIERARCHY,
} from './permissionManager';

// ── Security Logging ─────────────────────────────────────────────
export { securityLogger } from './securityLogger';

// ── Cross-Tab Sync ───────────────────────────────────────────────
export { crossTabSync } from './crossTabSync';

// ── Utilities ────────────────────────────────────────────────────
export {
  decodeJwtSafe,
  isJwtExpired,
  secondsUntilExpiry,
  isValidJwtFormat,
  sanitizeUser,
  isAuthHttpError,
  generateCsrfToken,
  normalizeRole,
  createSecureSessionId,
} from './authUtils';
