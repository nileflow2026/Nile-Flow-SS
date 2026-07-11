/**
 * AuditLogger.js
 * Client-side audit logging for all security-sensitive events.
 * Logs are sent to the backend audit log endpoint for centralized storage.
 * Also maintains an in-memory buffer for the current session for quick inspection.
 */

import axiosClient from '../../../api.js';

// In-memory audit trail for the current session
const _auditBuffer = [];
const MAX_BUFFER_SIZE = 200;

/**
 * Log a security event.
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

  // Send to backend (fire-and-forget)
  sendToBackend(entry).catch(() => {
    // Queue failed logs for retry
    queueFailedLog(entry);
  });

  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    const prefix = level === 'critical' ? '🔴' : level === 'error' ? '❌' : level === 'warn' ? '⚠️' : '📋';
    console.log(`${prefix} [Audit] ${action}`, details);
  }
}

/**
 * Convenience: Log a critical security event.
 * @param {string} action
 * @param {object} [details={}]
 */
export function logCritical(action, details = {}) {
  log(action, details, 'critical');
}

/**
 * Convenience: Log an error event.
 * @param {string} action
 * @param {object} [details={}]
 */
export function logError(action, details = {}) {
  log(action, details, 'error');
}

/**
 * Convenience: Log a warning event.
 * @param {string} action
 * @param {object} [details={}]
 */
export function logWarn(action, details = {}) {
  log(action, details, 'warn');
}

/**
 * Send an audit entry to the backend.
 * @param {object} entry
 * @returns {Promise<void>}
 */
async function sendToBackend(entry) {
  try {
    await axiosClient.post('/api/audit-logs/log', {
      action: entry.action,
      details: entry.details,
      timestamp: entry.timestamp,
      level: entry.level,
    });
  } catch {
    throw new Error('Failed to send audit log');
  }
}

// Queue for logs that failed to send
const _failedQueue = [];
const QUEUE_RETRY_INTERVAL = 30000; // 30 seconds

function queueFailedLog(entry) {
  _failedQueue.push({ ...entry, queuedAt: Date.now() });
  if (_failedQueue.length === 1) {
    // Start retry processor if not already running
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
        await sendToBackend(entry);
        _failedQueue.shift();
      } catch {
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
 * @returns {Array}
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
 * @returns {number}
 */
export function getPendingFailedCount() {
  return _failedQueue.length;
}

/**
 * Audit event type constants — use these for consistency.
 */
export const EVENTS = {
  // Authentication events
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SESSION_RESTORED: 'SESSION_RESTORED',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  TOKEN_REFRESHED: 'TOKEN_REFRESHED',
  TOKEN_REFRESH_FAILED: 'TOKEN_REFRESH_FAILED',
  SESSIONS_REVOKED: 'SESSIONS_REVOKED',

  // Account events
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  PASSWORD_RESET_REQUESTED: 'PASSWORD_RESET_REQUESTED',
  PASSWORD_RESET_COMPLETED: 'PASSWORD_RESET_COMPLETED',
  MFA_ENABLED: 'MFA_ENABLED',
  MFA_DISABLED: 'MFA_DISABLED',
  MFA_VERIFIED: 'MFA_VERIFIED',

  // Authorization events
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  FORBIDDEN_ACCESS: 'FORBIDDEN_ACCESS',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  ROLE_CHANGED: 'ROLE_CHANGED',
  PERMISSIONS_CHANGED: 'PERMISSIONS_CHANGED',

  // Account management
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  ACCOUNT_ENABLED: 'ACCOUNT_ENABLED',
  ACCOUNT_DELETED: 'ACCOUNT_DELETED',

  // Suspicious activity
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
