// src/auth/TokenManager.js
/**
 * Enterprise-grade token management.
 * Handles JWT access tokens and refresh tokens with rotation, silent refresh,
 * and concurrent request queuing — preventing duplicate refresh storms.
 */
import riderAxiosClient from "../api/riderAxiosClient";
import auditLogger from "./AuditLogger";

// Keys for storage
const REFRESH_LOCK_KEY = "rider:refreshLock";
const SESSION_VERSION_KEY = "rider:sessionVersion";
const LAST_ACTIVITY_KEY = "rider:lastActivity";

class TokenManager {
  constructor() {
    this._isRefreshing = false;
    this._failedQueue = [];
    this._refreshPromise = null;
    this._riderId = null;
  }

  setRiderId(id) {
    this._riderId = id;
  }

  clearRiderId() {
    this._riderId = null;
  }

  /**
   * Check if a token refresh is currently in progress
   */
  get isRefreshing() {
    return this._isRefreshing;
  }

  /**
   * Get session version — incremented on password change / account revocation
   */
  getSessionVersion() {
    try {
      return parseInt(sessionStorage.getItem(SESSION_VERSION_KEY) || "0", 10);
    } catch {
      return 0;
    }
  }

  setSessionVersion(version) {
    try {
      sessionStorage.setItem(SESSION_VERSION_KEY, String(version));
    } catch {
      // non-critical
    }
  }

  /**
   * Update last activity timestamp for sliding expiration
   */
  touchActivity() {
    try {
      sessionStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } catch {
      // non-critical
    }
  }

  getLastActivity() {
    try {
      return parseInt(sessionStorage.getItem(LAST_ACTIVITY_KEY) || "0", 10);
    } catch {
      return 0;
    }
  }

  /**
   * Process the queue of failed requests after a successful refresh
   */
  _processQueue(error, token = null) {
    this._failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token);
      }
    });
    this._failedQueue = [];
  }

  /**
   * Attempt to silently refresh the access token.
   * Returns a boolean indicating success.
   * Uses a shared promise to prevent duplicate refresh requests.
   */
  async refreshTokens(riderId) {
    // If already refreshing, return the existing promise
    if (this._refreshPromise) {
      return this._refreshPromise;
    }

    this._isRefreshing = true;
    this._riderId = riderId;

    // Set a lock in sessionStorage to coordinate across tabs
    try {
      sessionStorage.setItem(REFRESH_LOCK_KEY, Date.now().toString());
    } catch {
      // non-critical
    }

    this._refreshPromise = this._executeRefresh(riderId)
      .then((result) => {
        this._processQueue(null, result);
        return result;
      })
      .catch((error) => {
        this._processQueue(error);
        throw error;
      })
      .finally(() => {
        this._isRefreshing = false;
        this._refreshPromise = null;
        try {
          sessionStorage.removeItem(REFRESH_LOCK_KEY);
        } catch {
          // non-critical
        }
      });

    return this._refreshPromise;
  }

  async _executeRefresh(riderId) {
    try {
      const deviceId = this._getDeviceId();

      await riderAxiosClient.post(
        "/api/rider/auth/refresh",
        { deviceId },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
          _skipAuthRefresh: true, // Prevent interceptor loop
        },
      );

      auditLogger.tokenRefreshed(riderId);
      this.touchActivity();
      return { success: true };
    } catch (error) {
      auditLogger.tokenRefreshFailed(riderId, error.message);
      throw error;
    }
  }

  /**
   * Get or generate a persistent device ID stored in sessionStorage
   */
  _getDeviceId() {
    try {
      let deviceId = sessionStorage.getItem("riderDeviceId");
      if (!deviceId) {
        deviceId = `rider-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
        sessionStorage.setItem("riderDeviceId", deviceId);
      }
      return deviceId;
    } catch {
      return `rider-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }
  }

  /**
   * Get current device ID
   */
  getDeviceId() {
    return this._getDeviceId();
  }

  /**
   * Queue a request to be retried after token refresh
   */
  enqueueRequest(resolve, reject) {
    this._failedQueue.push({ resolve, reject });
  }

  /**
   * Check if another tab is currently refreshing
   */
  isOtherTabRefreshing() {
    try {
      const lockTime = parseInt(
        sessionStorage.getItem(REFRESH_LOCK_KEY) || "0",
        10,
      );
      if (lockTime === 0) return false;
      // Lock older than 10 seconds is stale
      return Date.now() - lockTime < 10000;
    } catch {
      return false;
    }
  }

  /**
   * Listen for storage events (multi-tab sync)
   */
  onStorageEvent(callback) {
    const handler = (e) => {
      if (e.key === REFRESH_LOCK_KEY || e.key === SESSION_VERSION_KEY) {
        callback(e);
      }
    };
    window.addEventListener("storage", handler);
    return () => window.removeEventListener("storage", handler);
  }

  /**
   * Clear all stored auth data
   */
  clear() {
    this._isRefreshing = false;
    this._failedQueue = [];
    this._refreshPromise = null;
    this._riderId = null;
    try {
      sessionStorage.removeItem("riderDeviceId");
      sessionStorage.removeItem(REFRESH_LOCK_KEY);
      sessionStorage.removeItem(LAST_ACTIVITY_KEY);
    } catch {
      // non-critical
    }
  }
}

// Singleton
const tokenManager = new TokenManager();
export default tokenManager;
