/**
 * Security Logger
 *
 * Enterprise-grade security event logging.
 * Logs all auth-related security events for audit trails.
 * In production, these should be sent to a SIEM/Security Information service.
 */

const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
};

const EVENT_TYPES = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  TOKEN_REFRESH_FAILURE: 'TOKEN_REFRESH_FAILURE',
  TOKEN_REUSE_DETECTED: 'TOKEN_REUSE_DETECTED',
  SESSION_REVOKED: 'SESSION_REVOKED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  CSRF_VIOLATION: 'CSRF_VIOLATION',
  SESSION_FIXATION: 'SESSION_FIXATION',
  BRUTE_FORCE_ATTEMPT: 'BRUTE_FORCE_ATTEMPT',
  DEVICE_CHANGED: 'DEVICE_CHANGED',
  ACCOUNT_DISABLED: 'ACCOUNT_DISABLED',
  SIGNUP_SUCCESS: 'SIGNUP_SUCCESS',
  EMAIL_VERIFIED: 'EMAIL_VERIFIED',
};

class SecurityLogger {
  constructor() {
    this._logQueue = [];
    this._flushInterval = null;
    this._sessionId = this._generateSessionId();
    this._initialized = false;
  }

  _generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Initialize the logger — starts periodic flush.
   */
  initialize() {
    if (this._initialized) return;
    this._initialized = true;

    // Flush every 30 seconds in production
    if (typeof window !== 'undefined') {
      const flushMs = 30000;
      this._flushInterval = setInterval(() => this.flush(), flushMs);

      // Flush on page unload
      window.addEventListener('beforeunload', () => this.flush());
    }
  }

  /**
   * Log a security event.
   */
  log(eventType, data = {}, level = LOG_LEVELS.INFO) {
    const entry = {
      timestamp: new Date().toISOString(),
      sessionId: this._sessionId,
      eventType,
      level,
      data: {
        ...data,
        url: typeof window !== 'undefined' ? window.location.href : '',
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent?.substring(0, 200) : '',
      },
    };

    // Always log to console in dev
    if (import.meta.env.DEV) {
      const prefix = `[Security][${level}][${eventType}]`;
      switch (level) {
        case LOG_LEVELS.CRITICAL:
          console.error(prefix, entry.data);
          break;
        case LOG_LEVELS.ERROR:
          console.error(prefix, entry.data);
          break;
        case LOG_LEVELS.WARN:
          console.warn(prefix, entry.data);
          break;
        default:
          console.log(prefix, entry.data);
      }
    }

    this._logQueue.push(entry);

    // If critical, flush immediately
    if (level === LOG_LEVELS.CRITICAL) {
      this.flush();
    }
  }

  /**
   * Flush queued logs to the backend.
   * In production, sends to a dedicated security logging endpoint.
   */
  async flush() {
    if (this._logQueue.length === 0) return;

    const batch = this._logQueue.splice(0);

    try {
      // Send to security logging endpoint
      // This is a fire-and-forget — we don't want logging to block the app
      const payload = { events: batch };

      if (import.meta.env.DEV) {
        // In dev, just log the count
        console.debug(`[SecurityLogger] Flushed ${batch.length} events`);
        return;
      }

      // In production, use sendBeacon for reliability on page unload
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
        navigator.sendBeacon('/api/security/logs', blob);
      } else {
        // Fallback to fetch (fire-and-forget)
        fetch('/api/security/logs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        }).catch(() => { /* Ignore logging errors */ });
      }
    } catch {
      // Never let logging failures affect the app
    }
  }

  /**
   * Convenience methods for common events.
   */

  loginSuccess(userId, metadata = {}) {
    this.log(EVENT_TYPES.LOGIN_SUCCESS, { userId, ...metadata });
  }

  loginFailure(email, reason, metadata = {}) {
    this.log(EVENT_TYPES.LOGIN_FAILURE, { email, reason, ...metadata }, LOG_LEVELS.WARN);
  }

  logout(userId, metadata = {}) {
    this.log(EVENT_TYPES.LOGOUT, { userId, ...metadata });
  }

  tokenRefreshed(userId, metadata = {}) {
    this.log(EVENT_TYPES.TOKEN_REFRESH, { userId, ...metadata });
  }

  tokenRefreshFailed(userId, reason, metadata = {}) {
    this.log(EVENT_TYPES.TOKEN_REFRESH_FAILURE, { userId, reason, ...metadata }, LOG_LEVELS.ERROR);
  }

  tokenReuseDetected(userId, metadata = {}) {
    this.log(EVENT_TYPES.TOKEN_REUSE_DETECTED, { userId, ...metadata }, LOG_LEVELS.CRITICAL);
  }

  sessionRevoked(userId, reason, metadata = {}) {
    this.log(EVENT_TYPES.SESSION_REVOKED, { userId, reason, ...metadata }, LOG_LEVELS.WARN);
  }

  permissionDenied(userId, resource, requiredRole) {
    this.log(EVENT_TYPES.PERMISSION_DENIED, { userId, resource, requiredRole }, LOG_LEVELS.WARN);
  }

  passwordChanged(userId, metadata = {}) {
    this.log(EVENT_TYPES.PASSWORD_CHANGE, { userId, ...metadata });
  }

  suspiciousActivity(userId, reason, metadata = {}) {
    this.log(EVENT_TYPES.SUSPICIOUS_ACTIVITY, { userId, reason, ...metadata }, LOG_LEVELS.CRITICAL);
  }

  csrfViolation(metadata = {}) {
    this.log(EVENT_TYPES.CSRF_VIOLATION, metadata, LOG_LEVELS.CRITICAL);
  }

  bruteForceAttempt(email, ip, metadata = {}) {
    this.log(EVENT_TYPES.BRUTE_FORCE_ATTEMPT, { email, ip, ...metadata }, LOG_LEVELS.WARN);
  }

  deviceChanged(userId, oldDeviceId, newDeviceId) {
    this.log(EVENT_TYPES.DEVICE_CHANGED, { userId, oldDeviceId, newDeviceId }, LOG_LEVELS.WARN);
  }

  /**
   * Clean up the logger.
   */
  destroy() {
    this.flush();
    if (this._flushInterval) {
      clearInterval(this._flushInterval);
      this._flushInterval = null;
    }
    this._initialized = false;
  }
}

// Singleton
export const securityLogger = new SecurityLogger();
export default securityLogger;
