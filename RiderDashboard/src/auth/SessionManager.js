// src/auth/SessionManager.js
/**
 * Enterprise-grade session management.
 * Handles session persistence, restoration, multi-tab synchronization,
 * sliding expiration, and session revocation detection.
 */
import auditLogger from "./AuditLogger";
import tokenManager from "./TokenManager";

const SESSION_KEY = "rider:session";
const SESSION_CREATED_KEY = "rider:sessionCreated";
const TAB_ID_KEY = "rider:tabId";
const LOGOUT_CHANNEL = "rider:logoutChannel";

class SessionManager {
  constructor() {
    this._session = null;
    this._tabId = this._getOrCreateTabId();
    this._broadcastChannel = null;
    this._listeners = new Map();
  }

  _getOrCreateTabId() {
    try {
      let tabId = sessionStorage.getItem(TAB_ID_KEY);
      if (!tabId) {
        tabId = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem(TAB_ID_KEY, tabId);
      }
      return tabId;
    } catch {
      return `tab-${Date.now()}`;
    }
  }

  get tabId() {
    return this._tabId;
  }

  /**
   * Initialize the session from stored data (called on app start)
   */
  initialize() {
    try {
      const stored = sessionStorage.getItem(SESSION_KEY);
      if (stored) {
        this._session = JSON.parse(stored);
        return this._session;
      }
    } catch {
      this._session = null;
    }
    return null;
  }

  /**
   * Create a new session after successful authentication
   */
  createSession(rider) {
    this._session = {
      riderId: rider.id || rider.$id,
      email: rider.email,
      name: rider.name,
      role: rider.role || "rider",
      status: rider.status || "offline",
      lastActivity: Date.now(),
      createdAt: Date.now(),
      tabId: this._tabId,
    };

    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(this._session));
      sessionStorage.setItem(SESSION_CREATED_KEY, Date.now().toString());
    } catch {
      // non-critical
    }

    tokenManager.setRiderId(this._session.riderId);
    tokenManager.touchActivity();

    // Set up broadcast channel for multi-tab sync
    this._setupBroadcastChannel();

    return this._session;
  }

  /**
   * Restore session from existing data (e.g., after page refresh)
   */
  restoreSession(rider) {
    if (!rider) {
      this.destroySession();
      return null;
    }

    this._session = {
      riderId: rider.id || rider.$id,
      email: rider.email,
      name: rider.name,
      role: rider.role || "rider",
      status: rider.status || "offline",
      lastActivity: Date.now(),
      createdAt: this._session?.createdAt || Date.now(),
      tabId: this._tabId,
    };

    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(this._session));
    } catch {
      // non-critical
    }

    tokenManager.setRiderId(this._session.riderId);
    tokenManager.touchActivity();
    this._setupBroadcastChannel();

    auditLogger.sessionRestored(this._session.riderId);

    return this._session;
  }

  /**
   * Update the session with new rider data
   */
  updateSession(riderData) {
    if (!this._session) return null;

    this._session = {
      ...this._session,
      name: riderData.name || this._session.name,
      email: riderData.email || this._session.email,
      status: riderData.status || this._session.status,
      lastActivity: Date.now(),
    };

    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(this._session));
    } catch {
      // non-critical
    }

    return this._session;
  }

  /**
   * Destroy the session (on logout, token expiry, etc.)
   */
  destroySession(reason = "logout") {
    const riderId = this._session?.riderId;

    // Notify other tabs before clearing
    this._broadcastLogout(reason);

    this._session = null;

    try {
      sessionStorage.removeItem(SESSION_KEY);
      sessionStorage.removeItem(SESSION_CREATED_KEY);
    } catch {
      // non-critical
    }

    tokenManager.clear();

    if (riderId) {
      auditLogger.logout(riderId, reason);
    }

    this._cleanupBroadcastChannel();
    this._emit("session_destroyed", { reason });
  }

  /**
   * Get the current session
   */
  getSession() {
    return this._session;
  }

  /**
   * Check if a session exists
   */
  hasSession() {
    return this._session !== null;
  }

  /**
   * Check session validity — returns true if session is still valid
   */
  isValid() {
    if (!this._session) return false;
    return true; // Server validates token; we assume valid until 401
  }

  /**
   * Get session age in milliseconds
   */
  getSessionAge() {
    if (!this._session?.createdAt) return 0;
    return Date.now() - this._session.createdAt;
  }

  /**
   * Check if session is stale (older than 24 hours, needs re-auth)
   */
  isStale() {
    return this.getSessionAge() > 24 * 60 * 60 * 1000;
  }

  /**
   * Set up BroadcastChannel API for multi-tab logout sync
   */
  _setupBroadcastChannel() {
    try {
      if (this._broadcastChannel) return;

      if (typeof BroadcastChannel !== "undefined") {
        this._broadcastChannel = new BroadcastChannel(LOGOUT_CHANNEL);
        this._broadcastChannel.onmessage = (event) => {
          const { type, tabId, reason } = event.data || {};

          // Ignore messages from self
          if (tabId === this._tabId) return;

          if (type === "logout" || type === "session_revoked") {
            auditLogger.multiTabLogout();
            this._session = null;
            try {
              sessionStorage.removeItem(SESSION_KEY);
              sessionStorage.removeItem(SESSION_CREATED_KEY);
            } catch {
              // non-critical
            }
            tokenManager.clear();
            this._emit("session_destroyed", {
              reason: reason || "multi_tab",
              fromTab: tabId,
            });
          }

          if (type === "session_updated") {
            // Another tab updated the session — notify listeners to re-fetch
            this._emit("session_updated", event.data);
          }
        };
      }
    } catch {
      // BroadcastChannel not supported — fall back to storage events
    }

    // Also listen for storage events as fallback
    this._storageHandler = (e) => {
      if (e.key === SESSION_KEY && !e.newValue) {
        // Session was cleared in another tab
        this._session = null;
        tokenManager.clear();
        this._emit("session_destroyed", { reason: "multi_tab_storage" });
      }
    };
    window.addEventListener("storage", this._storageHandler);
  }

  _cleanupBroadcastChannel() {
    try {
      if (this._broadcastChannel) {
        this._broadcastChannel.close();
        this._broadcastChannel = null;
      }
    } catch {
      // non-critical
    }
    if (this._storageHandler) {
      window.removeEventListener("storage", this._storageHandler);
      this._storageHandler = null;
    }
  }

  /**
   * Broadcast logout to other tabs
   */
  _broadcastLogout(reason) {
    try {
      if (this._broadcastChannel) {
        this._broadcastChannel.postMessage({
          type: "logout",
          tabId: this._tabId,
          reason,
          timestamp: Date.now(),
        });
      }
    } catch {
      // non-critical
    }
  }

  /**
   * Broadcast session update to other tabs
   */
  broadcastUpdate(data) {
    try {
      if (this._broadcastChannel) {
        this._broadcastChannel.postMessage({
          type: "session_updated",
          tabId: this._tabId,
          ...data,
          timestamp: Date.now(),
        });
      }
    } catch {
      // non-critical
    }
  }

  /**
   * Event emitter for session events
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return () => this._listeners.get(event)?.delete(callback);
  }

  _emit(event, data) {
    const listeners = this._listeners.get(event);
    if (listeners) {
      listeners.forEach((cb) => {
        try {
          cb(data);
        } catch (err) {
          console.error("[SessionManager] Listener error:", err);
        }
      });
    }
  }
}

// Singleton
const sessionManager = new SessionManager();
export default sessionManager;
