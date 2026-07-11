/**
 * AuditLogger.js
 * Client-side audit logging for all security-sensitive events.
 * Logs are sent to the backend audit log endpoint for centralized storage.
 * Also maintains an in-memory buffer for the current session for quick inspection.
 *
 * CRITICAL: 401 errors are silently dropped — audit logging must never
 * interrupt the user experience, especially during login/auth restoration.
 */

import axiosClient from '../../../api';

// In-memory audit trail for the current session
const _auditBuffer = [];
const MAX_BUFFER_SIZE = 200;

/**
 * Log a security event.
 * Fire-and-forget — never throws, never blocks.
 * @param {string} action - The action being logged (e.g., 'LOGIN_SUCCESS', 'SESSION_RESTORED')
 * @param {object} [details={}] - Additional context about the event
 * @param {string} [level='info'] - Severity level: 'info', 'warn', 'error', 'critical'
 */
export function log(action, details = {}, level = 'info') {
  const entry = {
    action,
    level,
    timestamp: new Date().toISOString(),
    details: JSON.stringify(details),
    url: window.location.href,
    userAgent: navigator.userAgent,
  };

  // Add to in-memory buffer
  _auditBuffer.unshift(entry);
  if (_auditBuffer.length > MAX_BUFFER_SIZE) {
    _auditBuffer.pop();
  }

  // Send to backend (fire-and-forget, silently handles errors)
  sendToBackend(entry);

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const prefix = level === 'critical' ? '🔴' : level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '📋';
    console.log(`${prefix} [Audit] ${action}`, details);
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
 * Send an audit entry to the backend.
 * Firebase-and-forget — silently suppresses all errors including 401.
 * 401s are expected when logging events during login/auth restoration
 * (the cookie may not be present yet).
 */
function sendToBackend(entry) {
  axiosClient
    .post('/api/audit-logs/log', {
      action: entry.action,
      details: entry.details,
      timestamp: entry.timestamp,
      level: entry.level,
    })
    .catch((err) => {
      // Silently suppress 401 — expected during auth initialization
      if (err?.response?.status === 401) {
        return;
      }
      // For network errors or 5xx, queue for retry
      queueFailedLog(entry);
    });
}

// Queue for logs that failed to send (non-401 errors only)
const _failedQueue = [];
const QUEUE_RETRY_INTERVAL = 30000; // 30 seconds

function queueFailedLog(entry) {
  // Don't queue duplicates
  if (_failedQueue.some((e) => e.action === entry.action && e.timestamp === entry.timestamp)) {
    return;
  }
  _failedQueue.push({ ...entry, queuedAt: Date.now() });
  if (_failedQueue.length === 1) {
    scheduleRetry();
  }
}

function scheduleRetry() {
  setTimeout(async () => {
    while (_failedQueue.length > 0) {
      const entry = _failedQueue[0];
      // Skip entries older than 1 hour
      if (Date.now() - entry.queuedAt > 3600000) {
        _failedQueue.shift();
        continue;
      }
      try {
        await axiosClient.post('/api/audit-logs/log', {
          action: entry.action,
          details: entry.details,
          timestamp: entry.timestamp,
          level: entry.level,
        });
        _failedQueue.shift();
      } catch (err) {
        // 401 during retry = still not authenticated, drop permanently
        if (err?.response?.status === 401) {
          _failedQueue.shift();
          continue;
        }
        break; // Stop retrying until next interval
      }
    }
    if (_failedQueue.length > 0) {
      scheduleRetry();
    }
  }, QUEUE_RETRY_INTERVAL);
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
 * Check if there are pending failed logs awaiting retry.
 */
export function getPendingFailedCount() {
  return _failedQueue.length;
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
  getPendingFailedCount,
  EVENTS,
};
