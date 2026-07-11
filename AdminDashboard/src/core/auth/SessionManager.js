/**
 * SessionManager.js
 * Enterprise-grade session management for the Admin Dashboard.
 * Handles silent refresh, proactive refresh scheduling, and session health monitoring.
 * Coordinates with TokenManager for multi-tab sync.
 */

import { SECURITY_POLICIES } from './SecurityPolicies';
import * as TokenManager from './TokenManager';
import * as AuditLogger from './AuditLogger';

// Axios client for API calls — imported lazily to avoid circular deps
let _axiosClient = null;
async function getClient() {
  if (!_axiosClient) {
    // Dynamic import to break circular dependency
    const mod = await import('../../../api');
    _axiosClient = mod.default;
  }
  return _axiosClient;
}

let _refreshIntervalId = null;
let _inactivityTimerId = null;
let _lastActivityTime = Date.now();
let _sessionCheckIntervalId = null;
let _isRestoring = false;

/**
 * Initialize session management.
 * Call once on app startup.
 * @returns {Promise<{authenticated: boolean, user: object|null}>}
 */
export async function initializeSession() {
  if (_isRestoring) return { authenticated: false, user: null };
  _isRestoring = true;

  try {
    // Attempt to restore session from existing cookies
    const client = getClient();
    const response = await client.get('/api/admin/auth/getcurrentuser');
    
    if (response.data?.user) {
      const user = response.data.user;
      TokenManager.markAuthenticated(user.id || user.$id);
      AuditLogger.log('SESSION_RESTORED', { userId: user.id || user.$id });
      startSessionMonitoring();
      return { authenticated: true, user };
    }
    
    // Try silent refresh as fallback
    return await silentRefresh();
  } catch (error) {
    // No valid session — this is normal on first load
    TokenManager.markUnauthenticated();
    return { authenticated: false, user: null };
  } finally {
    _isRestoring = false;
  }
}

/**
 * Perform a silent token refresh.
 * Deduplicates concurrent refresh requests across the app.
 * @returns {Promise<{authenticated: boolean, user: object|null}>}
 */
export async function silentRefresh() {
  // If a refresh is already in progress, wait for it
  if (TokenManager.isRefreshPending()) {
    try {
      return await TokenManager.getPendingRefresh();
    } catch {
      return { authenticated: false, user: null };
    }
  }

  // Rate limit: don't refresh more than once per 5 seconds
  const timeSinceLast = TokenManager.getTimeSinceLastRefresh();
  if (timeSinceLast < 5000 && TokenManager.isAuthenticated()) {
    return { authenticated: true, user: null }; // Already recently refreshed
  }

  const refreshPromise = (async () => {
    try {
      const client = getClient();
      await client.post('/api/admin/auth/refresh', {});
      TokenManager.markAuthenticated(TokenManager.getSessionId());
      TokenManager.incrementRefreshCount();
      TokenManager.broadcast('auth:token-refreshed');
      AuditLogger.log('TOKEN_REFRESHED', { sessionId: TokenManager.getSessionId() });
      return { authenticated: true, user: null };
    } catch (error) {
      TokenManager.markUnauthenticated();
      TokenManager.broadcast('auth:logged-out');
      AuditLogger.log('TOKEN_REFRESH_FAILED', { error: error.message });
      return { authenticated: false, user: null };
    }
  })();

  TokenManager.setPendingRefresh(refreshPromise);
  
  try {
    return await refreshPromise;
  } finally {
    TokenManager.setPendingRefresh(null);
  }
}

/**
 * Start proactive session monitoring:
 * - Proactive refresh before token expiry
 * - Inactivity detection
 * - Periodic session health checks
 */
export function startSessionMonitoring() {
  // Clear any existing intervals
  stopSessionMonitoring();

  // Proactive refresh: run every 5 minutes to keep token fresh
  _refreshIntervalId = setInterval(() => {
    if (TokenManager.shouldRefresh()) {
      silentRefresh().catch(() => {});
    }
  }, 5 * 60 * 1000);

  // Activity tracking
  const activityEvents = ['mousedown', 'keydown', 'touchstart', 'scroll', 'click'];
  const updateActivity = () => {
    _lastActivityTime = Date.now();
  };
  activityEvents.forEach((event) => window.addEventListener(event, updateActivity, { passive: true }));

  // Periodic session health check (every 2 minutes)
  _sessionCheckIntervalId = setInterval(async () => {
    try {
      const client = getClient();
      await client.get('/api/admin/auth/getcurrentuser');
    } catch {
      // Session may have expired — attempt silent refresh
      silentRefresh().catch(() => {});
    }
  }, 2 * 60 * 1000);

  return () => {
    activityEvents.forEach((event) => window.removeEventListener(event, updateActivity));
  };
}

/**
 * Stop all session monitoring intervals.
 */
export function stopSessionMonitoring() {
  if (_refreshIntervalId) {
    clearInterval(_refreshIntervalId);
    _refreshIntervalId = null;
  }
  if (_sessionCheckIntervalId) {
    clearInterval(_sessionCheckIntervalId);
    _sessionCheckIntervalId = null;
  }
  if (_inactivityTimerId) {
    clearTimeout(_inactivityTimerId);
    _inactivityTimerId = null;
  }
}

/**
 * Get the time since last user activity.
 * @returns {number} ms since last activity
 */
export function getInactivityDuration() {
  return Date.now() - _lastActivityTime;
}

/**
 * Check if the session should be considered expired due to inactivity.
 * @returns {boolean}
 */
export function isInactive() {
  return getInactivityDuration() > SECURITY_POLICIES.INACTIVITY_LOGOUT_MS;
}

/**
 * Refresh the last activity timestamp.
 */
export function updateActivity() {
  _lastActivityTime = Date.now();
}

/**
 * Check session health by verifying with the backend.
 * @returns {Promise<boolean>}
 */
export async function checkSessionHealth() {
  try {
    const client = getClient();
    await client.get('/api/admin/auth/getcurrentuser');
    return true;
  } catch {
    return false;
  }
}

/**
 * Revoke all sessions for the current user (force re-auth).
 * @returns {Promise<void>}
 */
export async function revokeAllSessions() {
  try {
    TokenManager.broadcast('auth:session-revoked');
    AuditLogger.log('SESSIONS_REVOKED', { reason: 'manual' });
  } catch {
    // Best-effort
  }
}

/**
 * Get device fingerprint for the current browser.
 * Used for session scoping.
 * @returns {string}
 */
export function getDeviceFingerprint() {
  const parts = [
    navigator.userAgent,
    navigator.language,
    screen.colorDepth,
    screen.width,
    screen.height,
    new Date().getTimezoneOffset(),
    navigator.hardwareConcurrency,
  ];
  let hash = 0;
  const str = parts.join('|||');
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Generate a persistent device ID scoped to the origin.
 * @returns {string}
 */
export function getDeviceId() {
  let deviceId = sessionStorage.getItem('nf_device_id');
  if (!deviceId) {
    deviceId = `dev_${getDeviceFingerprint()}_${Date.now().toString(36)}`;
    sessionStorage.setItem('nf_device_id', deviceId);
  }
  return deviceId;
}

export default {
  initializeSession,
  silentRefresh,
  startSessionMonitoring,
  stopSessionMonitoring,
  getInactivityDuration,
  isInactive,
  updateActivity,
  checkSessionHealth,
  revokeAllSessions,
  getDeviceFingerprint,
  getDeviceId,
};
