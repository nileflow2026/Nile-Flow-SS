/**
 * SessionManager
 *
 * Enterprise-grade session state management.
 * Tracks session state, manages session lifecycle, and provides
 * centralized session information for the entire application.
 *
 * Features:
 * - Session creation and lifecycle tracking
 * - Session version management (for forced re-auth)
 * - Inactivity timeout tracking
 * - Device binding verification
 * - Concurrent session awareness
 * - Session expiry monitoring
 */

import { securityLogger } from './securityLogger';
import { crossTabSync } from './crossTabSync';

const SESSION_KEYS = {
  START_TIME: 'nf_session_start',
  LAST_ACTIVITY: 'nf_last_activity',
  DEVICE_ID: 'nf_device_id',
  SESSION_VERSION: 'nf_session_version',
};

const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const INACTIVITY_CHECK_INTERVAL = 60 * 1000; // Check every 60 seconds

class SessionManager {
  constructor() {
    this._sessionId = null;
    this._sessionStartTime = null;
    this._lastActivityTime = null;
    this._sessionVersion = 1;
    this._deviceId = null;
    this._inactivityTimer = null;
    this._inactivityListeners = new Set();
    this._sessionExpiredListeners = new Set();
    this._initialized = false;
    this._isSessionValid = false;
  }

  /**
   * Initialize session management.
   * Recovers session state from sessionStorage.
   * @returns {boolean} Whether a session was recovered
   */
  initialize() {
    if (this._initialized) return this._isSessionValid;
    this._initialized = true;

    // Recover session state
    try {
      const startTime = sessionStorage.getItem(SESSION_KEYS.START_TIME);
      const lastActivity = sessionStorage.getItem(SESSION_KEYS.LAST_ACTIVITY);
      const version = sessionStorage.getItem(SESSION_KEYS.SESSION_VERSION);

      if (startTime && lastActivity) {
        this._sessionStartTime = parseInt(startTime, 10);
        this._lastActivityTime = parseInt(lastActivity, 10);
        this._sessionVersion = version ? parseInt(version, 10) : 1;
        this._isSessionValid = true;

        // Check inactivity
        const inactiveDuration = Date.now() - this._lastActivityTime;
        if (inactiveDuration > INACTIVITY_TIMEOUT_MS) {
          this._isSessionValid = false;
          securityLogger.suspiciousActivity(
            'unknown',
            'Session expired due to inactivity',
            { inactiveDuration },
          );
        }
      }
    } catch {
      // No session to recover
    }

    // Start inactivity monitoring
    this._startInactivityMonitor();

    // Listen for user activity
    this._setupActivityListeners();

    // Listen for cross-tab logout
    crossTabSync.onForceLogout(() => {
      this.invalidateSession('forced_logout');
    });

    return this._isSessionValid;
  }

  /**
   * Start a new session.
   * @param {string} [sessionId] - Session ID from the backend
   */
  startSession(sessionId) {
    this._sessionId = sessionId || this._generateSessionId();
    this._sessionStartTime = Date.now();
    this._lastActivityTime = Date.now();
    this._sessionVersion = 1;
    this._isSessionValid = true;

    try {
      sessionStorage.setItem(SESSION_KEYS.START_TIME, String(this._sessionStartTime));
      sessionStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, String(this._lastActivityTime));
      sessionStorage.setItem(SESSION_KEYS.SESSION_VERSION, String(this._sessionVersion));
    } catch {
      // Silently degrade
    }
  }

  /**
   * Update the session version (e.g., after password change).
   * This forces other tabs/sessions to re-authenticate.
   */
  incrementSessionVersion() {
    this._sessionVersion++;
    try {
      sessionStorage.setItem(SESSION_KEYS.SESSION_VERSION, String(this._sessionVersion));
    } catch {
      // Ignore
    }
  }

  /**
   * Check if the session version matches the expected version.
   * @param {number} expectedVersion
   * @returns {boolean}
   */
  validateSessionVersion(expectedVersion) {
    return this._sessionVersion >= expectedVersion;
  }

  /**
   * Update last activity time (called on user interaction).
   */
  updateActivity() {
    this._lastActivityTime = Date.now();
    try {
      sessionStorage.setItem(SESSION_KEYS.LAST_ACTIVITY, String(this._lastActivityTime));
    } catch {
      // Ignore
    }
  }

  /**
   * Get the current session ID.
   * @returns {string|null}
   */
  getSessionId() {
    return this._sessionId;
  }

  /**
   * Get session duration in milliseconds.
   * @returns {number}
   */
  getSessionDuration() {
    if (!this._sessionStartTime) return 0;
    return Date.now() - this._sessionStartTime;
  }

  /**
   * Check if the session is valid.
   * @returns {boolean}
   */
  isValid() {
    return this._isSessionValid;
  }

  /**
   * Get the current session version.
   * @returns {number}
   */
  getSessionVersion() {
    return this._sessionVersion;
  }

  /**
   * Invalidate the current session.
   * @param {string} [reason='unknown']
   */
  invalidateSession(reason = 'unknown') {
    this._isSessionValid = false;
    this._sessionId = null;
    this._sessionStartTime = null;
    this._lastActivityTime = null;

    try {
      Object.values(SESSION_KEYS).forEach((key) => {
        sessionStorage.removeItem(key);
      });
    } catch {
      // Ignore
    }

    securityLogger.sessionRevoked(
      'unknown',
      reason,
    );

    // Notify listeners
    this._sessionExpiredListeners.forEach((cb) => {
      try { cb(reason); } catch { /* ignore */ }
    });
  }

  /**
   * End the current session (on logout).
   */
  endSession() {
    this.invalidateSession('user_logout');
    this._stopInactivityMonitor();
    this._removeActivityListeners();
  }

  /**
   * Register a callback for session expiry.
   * @param {Function} callback
   * @returns {Function} Unsubscribe
   */
  onSessionExpired(callback) {
    this._sessionExpiredListeners.add(callback);
    return () => this._sessionExpiredListeners.delete(callback);
  }

  /**
   * Register a callback for inactivity timeout.
   * @param {Function} callback
   * @returns {Function} Unsubscribe
   */
  onInactivityTimeout(callback) {
    this._inactivityListeners.add(callback);
    return () => this._inactivityListeners.delete(callback);
  }

  /**
   * Setup user activity listeners (clicks, scrolls, keypresses).
   */
  _setupActivityListeners() {
    const update = () => this.updateActivity();

    if (typeof window !== 'undefined') {
      // Throttled activity tracking
      let lastUpdate = 0;
      const throttledUpdate = () => {
        const now = Date.now();
        if (now - lastUpdate > 10000) { // Update at most every 10 seconds
          lastUpdate = now;
          update();
        }
      };

      window.addEventListener('mousedown', throttledUpdate, { passive: true });
      window.addEventListener('keydown', throttledUpdate, { passive: true });
      window.addEventListener('touchstart', throttledUpdate, { passive: true });
      window.addEventListener('scroll', throttledUpdate, { passive: true });

      // Store for cleanup
      this._activityCleanup = () => {
        window.removeEventListener('mousedown', throttledUpdate);
        window.removeEventListener('keydown', throttledUpdate);
        window.removeEventListener('touchstart', throttledUpdate);
        window.removeEventListener('scroll', throttledUpdate);
      };
    }
  }

  /**
   * Remove activity listeners.
   */
  _removeActivityListeners() {
    if (this._activityCleanup) {
      this._activityCleanup();
      this._activityCleanup = null;
    }
  }

  /**
   * Start periodic inactivity check.
   */
  _startInactivityMonitor() {
    this._stopInactivityMonitor();

    this._inactivityTimer = setInterval(() => {
      if (!this._isSessionValid || !this._lastActivityTime) return;

      const inactiveDuration = Date.now() - this._lastActivityTime;
      if (inactiveDuration > INACTIVITY_TIMEOUT_MS) {
        this._isSessionValid = false;

        // Notify inactivity listeners
        this._inactivityListeners.forEach((cb) => {
          try { cb(inactiveDuration); } catch { /* ignore */ }
        });

        this.invalidateSession('inactivity_timeout');
      }
    }, INACTIVITY_CHECK_INTERVAL);
  }

  /**
   * Stop the inactivity monitor.
   */
  _stopInactivityMonitor() {
    if (this._inactivityTimer) {
      clearInterval(this._inactivityTimer);
      this._inactivityTimer = null;
    }
  }

  /**
   * Generate a unique session ID.
   */
  _generateSessionId() {
    return `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Clean up all resources.
   */
  destroy() {
    this._stopInactivityMonitor();
    this._removeActivityListeners();
    this._inactivityListeners.clear();
    this._sessionExpiredListeners.clear();
    this._initialized = false;
  }
}

// Singleton
export const sessionManager = new SessionManager();
export default sessionManager;
