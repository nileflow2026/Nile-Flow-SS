/**
 * CrossTabSync
 *
 * Enterprise-grade cross-tab/window session synchronization.
 * Uses BroadcastChannel API for modern browsers, falls back to localStorage events.
 *
 * Synchronizes:
 * - Login state across tabs
 * - Logout across tabs
 * - Token refresh across tabs
 * - Session revocation across tabs
 * - Password changes across tabs
 */

const SYNC_EVENTS = {
  LOGIN: 'auth:login',
  LOGOUT: 'auth:logout',
  TOKEN_REFRESHED: 'auth:tokenRefreshed',
  SESSION_REVOKED: 'auth:sessionRevoked',
  PASSWORD_CHANGED: 'auth:passwordChanged',
  FORCE_LOGOUT: 'auth:forceLogout',
  HEARTBEAT: 'auth:heartbeat',
};

class CrossTabSync {
  constructor() {
    this._channel = null;
    this._channelName = 'nileflow:auth';
    this._listeners = new Map();
    this._tabId = this._generateTabId();
    this._heartbeatInterval = null;
    this._initialized = false;
    this._storageListener = null;
  }

  _generateTabId() {
    return `tab_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  /**
   * Initialize cross-tab synchronization.
   * Sets up BroadcastChannel and localStorage fallback.
   */
  initialize() {
    if (this._initialized) return;
    this._initialized = true;

    // Primary: BroadcastChannel API
    try {
      this._channel = new BroadcastChannel(this._channelName);
      this._channel.onmessage = (event) => {
        this._handleEvent(event.data);
      };
    } catch {
      // BroadcastChannel not supported — use localStorage fallback
      this._setupStorageFallback();
    }

    // Start sending heartbeats so other tabs know this tab is alive
    this._heartbeatInterval = setInterval(() => {
      this._broadcast({ type: SYNC_EVENTS.HEARTBEAT, tabId: this._tabId });
    }, 30000);

    // Broadcast our presence
    this._broadcast({ type: SYNC_EVENTS.HEARTBEAT, tabId: this._tabId });
  }

  /**
   * Fallback for browsers that don't support BroadcastChannel.
   * Uses localStorage 'storage' event which fires across tabs.
   */
  _setupStorageFallback() {
    this._storageListener = (event) => {
      if (event.key && event.key.startsWith('nf_sync_') && event.newValue) {
        try {
          const data = JSON.parse(event.newValue);
          if (data.tabId !== this._tabId) {
            this._handleEvent(data);
          }
        } catch {
          // Ignore invalid JSON
        }
      }
    };

    window.addEventListener('storage', this._storageListener);
  }

  /**
   * Broadcast an event to all other tabs.
   */
  _broadcast(data) {
    const payload = { ...data, tabId: this._tabId, timestamp: Date.now() };

    try {
      if (this._channel) {
        this._channel.postMessage(payload);
      } else {
        // localStorage fallback
        const key = `nf_sync_${Date.now()}`;
        localStorage.setItem(key, JSON.stringify(payload));
        // Clean up after a short delay so other tabs can read it
        setTimeout(() => {
          try { localStorage.removeItem(key); } catch { /* ignore */ }
        }, 1000);
      }
    } catch {
      // Silently fail — cross-tab sync is best-effort
    }
  }

  /**
   * Handle an incoming event from another tab.
   */
  _handleEvent(data) {
    if (data.tabId === this._tabId) return; // Ignore our own messages

    const { type, ...payload } = data;
    const handlers = this._listeners.get(type) || [];

    handlers.forEach((handler) => {
      try {
        handler(payload);
      } catch {
        // Ignore handler errors
      }
    });
  }

  // ── Event Dispatch Methods ────────────────────────────────────

  notifyLogin(userData) {
    this._broadcast({
      type: SYNC_EVENTS.LOGIN,
      userId: userData?.$id || userData?.id,
      email: userData?.email,
    });
  }

  notifyLogout() {
    this._broadcast({ type: SYNC_EVENTS.LOGOUT });
  }

  notifyTokenRefreshed() {
    this._broadcast({ type: SYNC_EVENTS.TOKEN_REFRESHED });
  }

  notifySessionRevoked(userId) {
    this._broadcast({ type: SYNC_EVENTS.SESSION_REVOKED, userId });
  }

  notifyPasswordChanged(userId) {
    this._broadcast({ type: SYNC_EVENTS.PASSWORD_CHANGED, userId });
  }

  forceLogoutAllTabs() {
    this._broadcast({ type: SYNC_EVENTS.FORCE_LOGOUT });
  }

  // ── Event Listeners ───────────────────────────────────────────

  onLogin(handler) {
    this._addListener(SYNC_EVENTS.LOGIN, handler);
  }

  onLogout(handler) {
    this._addListener(SYNC_EVENTS.LOGOUT, handler);
  }

  onTokenRefreshed(handler) {
    this._addListener(SYNC_EVENTS.TOKEN_REFRESHED, handler);
  }

  onSessionRevoked(handler) {
    this._addListener(SYNC_EVENTS.SESSION_REVOKED, handler);
  }

  onPasswordChanged(handler) {
    this._addListener(SYNC_EVENTS.PASSWORD_CHANGED, handler);
  }

  onForceLogout(handler) {
    this._addListener(SYNC_EVENTS.FORCE_LOGOUT, handler);
  }

  _addListener(type, handler) {
    if (!this._listeners.has(type)) {
      this._listeners.set(type, []);
    }
    this._listeners.get(type).push(handler);

    // Return unsubscribe function
    return () => {
      const handlers = this._listeners.get(type);
      if (handlers) {
        const idx = handlers.indexOf(handler);
        if (idx !== -1) handlers.splice(idx, 1);
      }
    };
  }

  /**
   * Get all active tab IDs from recent heartbeats.
   * Useful for detecting multi-tab sessions.
   * @returns {number} Number of active tabs (including this one)
   */
  getActiveTabCount() {
    // This is an approximation — we track heartbeats
    return 1; // For now, just return 1 for this tab
  }

  /**
   * Clean up all listeners and intervals.
   */
  destroy() {
    if (this._channel) {
      this._channel.close();
      this._channel = null;
    }

    if (this._heartbeatInterval) {
      clearInterval(this._heartbeatInterval);
      this._heartbeatInterval = null;
    }

    if (this._storageListener) {
      window.removeEventListener('storage', this._storageListener);
      this._storageListener = null;
    }

    this._listeners.clear();
    this._initialized = false;
  }
}

// Singleton
export const crossTabSync = new CrossTabSync();
export default crossTabSync;
