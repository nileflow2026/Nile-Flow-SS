/**
 * AuditLogger.js
 * Client-side audit logging for all security-sensitive events.
 * Logs are sent to the backend audit log endpoint for centralized storage.
 * Also maintains an in-memory buffer for the current session for quick inspection.
 *
 * CRITICAL: Backend audit log HTTP requests are ONLY sent when the user has
 * a confirmed authenticated session. Events logged before auth is established
 * are stored in-memory and silently discarded from backend delivery.
 * This prevents 401 errors in the browser console during login/auth restoration.
 */

import axiosClient from '../../../api';

// In-memory audit trail for the current session
const _auditBuffer = [];
const MAX_BUFFER_SIZE = 200;

// Whether we have a confirmed authenticated session.
// When false, NO backend HTTP requests are fired — only in-memory buffering.
let _authenticated = false;
const SENSITIVE_KEY_PATTERN = /password|token|authorization|cookie|secret|api[_-]?key|clientsecret|privatekey|cardnumber|cvv|paymenttoken|email|phone|address/i;

function sanitizeDetails(details) {
  if (!details || typeof details !== 'object') return {};
  return Object.fromEntries(
    Object.entries(details).map(([key, value]) => [
      key,
      SENSITIVE_KEY_PATTERN.test(key) ? '[REDACTED]' : value,
    ]),
  );
}

/**
 * Mark the audit logger as ready to send to backend (authenticated).
 * Until this is called, all events are stored in-memory only.
 */
export function markAuthenticated() {
  _authenticated = true;
}

/**
 * Mark the audit logger as not authenticated.
 * Backend requests will stop until markAuthenticated() is called again.
 */
export function markUnauthenticated() {
  _authenticated = false;
}

/**
 * Check if backend delivery is active.
 */
export function isBackendDeliveryActive() {
  return _authenticated;
}

/**
 * Log a security event.
 * Fire-and-forget — never throws, never blocks.
 * When not authenticated, only stores in-memory (no HTTP request).
 * @param {string} action - The action being logged (e.g., 'LOGIN_SUCCESS', 'SESSION_RESTORED')
 * @param {object} [details={}] - Additional context about the event
 * @param {string} [level='info'] - Severity level: 'info', 'warn', 'error', 'critical'
 */
export function log(action, details = {}, level = 'info') {
  const safeDetails = sanitizeDetails(details);
  const entry = {
    action,
    level,
    timestamp: new Date().toISOString(),
    details: JSON.stringify(safeDetails),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Add to in-memory buffer
  _auditBuffer.unshift(entry);
  if (_auditBuffer.length > MAX_BUFFER_SIZE) {
    _auditBuffer.pop();
  }

  // Only send HTTP request if we have a confirmed authenticated session.
  // httpOnly cookies are NOT visible to document.cookie, so we cannot
  // check for them here — we rely entirely on the _authenticated flag
  // which is managed by AuthProvider and SessionManager.
  // This prevents 401 errors in browser DevTools during login/auth restoration
  // because _authenticated starts false and is only set to true after
  // a successful login or session restore.
  if (_authenticated) {
    sendToBackend(entry);
  }

}

/**
 * Convenience: Log a critical security event.
 */
export function logCritical(action, details = {}) {
  log(action, details, 'critical');
}

/**
 * Convenience: Log an error event.
 */
export function logError(action, details = {}) {
  log(action, details, 'error');
}

/**
 * Convenience: Log a warning event.
 */
export function logWarn(action, details = {}) {
  log(action, details, 'warn');
}

/**
 * Send an audit entry to the backend using navigator.sendBeacon.
 * This is truly fire-and-forget — the browser sends the request in the
 * background and never surfaces errors (including 401) in the console.
 * This is the recommended approach for analytics and audit logging.
 */
function sendToBackend(entry) {
  try {
    const payload = JSON.stringify({
      action: entry.action,
      details: entry.details,
      timestamp: entry.timestamp,
      level: entry.level,
    });
    const url = `${axiosClient.defaults.baseURL}/api/audit-logs/log`;
    navigator.sendBeacon(url, new Blob([payload], { type: 'application/json' }));
  } catch {
    // navigator.sendBeacon can fail in very old browsers — silently ignore
  }
}

/**
 * Get all audit entries for the current session.
 */
export function getSessionAuditLog() {
  return [..._auditBuffer];
}

/**
 * Clear the in-memory audit buffer.
 */
export function clearSessionAuditLog() {
  _auditBuffer.length = 0;
}

/**
 * Audit event type constants — use these for consistency.
 */
export const EVENTS = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SESSION_RESTORED: 'SESSION_RESTORED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
  SESSIONS_REVOKED: 'SESSIONS_REVOKED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  MFA_ENABLED: 'MFA_ENABLED',
  MFA_DISABLED: 'MFA_DISABLED',
  MFA_VERIFIED: 'MFA_VERIFIED',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  FORBIDDEN_ACCESS: 'FORBIDDEN_ACCESS',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  PERMISSIONS_CHANGED: 'PERMISSIONS_CHANGED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  ACCOUNT_ENABLED: 'ACCOUNT_ENABLED',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED',
  SUSPICIOUS_LOGIN: 'SUSPICIOUS_LOGIN',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  BRUTE_FORCE_DETECTED: 'BRUTE_FORCE_DETECTED',
  TOKEN_REUSE_DETECTED: 'TOKEN_REUSE_DETECTED',
  DEVICE_CHANGED: 'DEVICE_CHANGED',
  LOCATION_CHANGED: 'LOCATION_CHANGED',
};

export default {
  log,
  logCritical,
  logError,
  logWarn,
  getSessionAuditLog,
  clearSessionAuditLog,
  EVENTS,
};
