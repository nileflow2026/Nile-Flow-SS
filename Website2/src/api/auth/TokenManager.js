/**
 * TokenManager
 *
 * Centralized token storage and lifecycle management.
 * Components never manipulate tokens directly — they use this manager.
 *
 * Supports three storage backends:
 * - memory (default): safest for XSS, tokens lost on page refresh
 * - localStorage: persists across sessions (for "remember me")
 * - sessionStorage: persists within a tab session
 */

import { config } from '@api/config';

const STORAGE_BACKENDS = {
  memory: new Map(),
  localStorage,
  sessionStorage,
};

class TokenManager {
  constructor() {
    this.backend = this._resolveBackend();
    this._refreshPromise = null;
    this._accessToken = null;
  }

  /**
   * Resolve the storage backend from configuration.
   */
  _resolveBackend() {
    const mode = config.tokens.storage;
    if (mode === 'localStorage' || mode === 'sessionStorage') {
      return STORAGE_BACKENDS[mode];
    }
    // Default to memory-based storage
    return STORAGE_BACKENDS.memory;
  }

  /**
   * Store an access token.
   * Always persists to localStorage for session recovery across page refreshes.
   * @param {string} token
   */
  setAccessToken(token) {
    if (!token) return;
    this._accessToken = token;
    // Always persist to localStorage for session survival across page refresh
    try {
      localStorage.setItem(config.tokens.accessTokenKey, token);
    } catch {
      // Storage quota or private browsing — silently degrade
    }
    if (this.backend !== STORAGE_BACKENDS.memory && this.backend !== localStorage) {
      try {
        this.backend.setItem(config.tokens.accessTokenKey, token);
      } catch {
        // Silent degrade
      }
    }
  }

  /**
   * Retrieve the current access token.
   * Checks memory first, then falls back to localStorage for cross-refresh recovery.
   * @returns {string|null}
   */
  getAccessToken() {
    if (this._accessToken) return this._accessToken;
    // Always check localStorage for session recovery after page refresh
    try {
      const stored = localStorage.getItem(config.tokens.accessTokenKey);
      if (stored) {
        this._accessToken = stored;
        return stored;
      }
    } catch {
      // Silent degrade
    }
    if (this.backend !== STORAGE_BACKENDS.memory && this.backend !== localStorage) {
      try {
        return this.backend.getItem(config.tokens.accessTokenKey);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Store a refresh token.
   * @param {string} token
   */
  setRefreshToken(token) {
    if (!token) return;
    if (this.backend !== STORAGE_BACKENDS.memory) {
      try {
        this.backend.setItem(config.tokens.refreshTokenKey, token);
      } catch {
        // Silent degrade
      }
    }
  }

  /**
   * Retrieve the refresh token.
   * @returns {string|null}
   */
  getRefreshToken() {
    if (this.backend !== STORAGE_BACKENDS.memory) {
      try {
        return this.backend.getItem(config.tokens.refreshTokenKey);
      } catch {
        return null;
      }
    }
    return null;
  }

  /**
   * Store user profile data for quick access.
   * Persists to localStorage for cross-refresh availability.
   * @param {Object} userData
   */
  setUserData(userData) {
    if (!userData) return;
    // Always persist to localStorage so user data is available on refresh
    try {
      localStorage.setItem(config.tokens.userDataKey, JSON.stringify(userData));
    } catch {
      // Silent degrade
    }
    if (this.backend !== STORAGE_BACKENDS.memory && this.backend !== localStorage) {
      try {
        this.backend.setItem(config.tokens.userDataKey, JSON.stringify(userData));
      } catch {
        // Silent degrade
      }
    }
  }

  /**
   * Retrieve cached user profile data.
   * Checks localStorage first for cross-refresh recovery.
   * @returns {Object|null}
   */
  getUserData() {
    // Always check localStorage first for recovery after page refresh
    try {
      const stored = localStorage.getItem(config.tokens.userDataKey);
      if (stored) return JSON.parse(stored);
    } catch {
      // Silent degrade
    }
    try {
      const raw = this.backend.getItem(config.tokens.userDataKey);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  /**
   * Check whether an access token exists.
   * @returns {boolean}
   */
  hasAccessToken() {
    return !!this.getAccessToken();
  }

  /**
   * Check whether the token is likely expired (client-side heuristic).
   * Does NOT make an API call — just checks the JWT exp claim.
   * @returns {boolean}
   */
  isTokenExpired() {
    const token = this.getAccessToken();
    if (!token) return true;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return Date.now() >= payload.exp * 1000;
    } catch {
      return true;
    }
  }

  /**
   * Decode the JWT payload without validation.
   * @returns {Object|null}
   */
  decodeToken() {
    const token = this.getAccessToken();
    if (!token) return null;

    try {
      return JSON.parse(atob(token.split('.')[1]));
    } catch {
      return null;
    }
  }

  /**
   * Run a token refresh operation, ensuring only one refresh runs at a time.
   * Deduplicates concurrent refresh requests.
   * @param {Function} refreshFn - Async function that returns new tokens
   * @returns {Promise<boolean>} Whether refresh succeeded
   */
  async refreshToken(refreshFn) {
    // If a refresh is already in progress, wait for it
    if (this._refreshPromise) {
      return this._refreshPromise;
    }

    this._refreshPromise = (async () => {
      try {
        const result = await refreshFn();
        if (result?.accessToken) {
          this.setAccessToken(result.accessToken);
        }
        return true;
      } catch {
        this.clearTokens();
        return false;
      } finally {
        this._refreshPromise = null;
      }
    })();

    return this._refreshPromise;
  }

  /**
   * Clear all tokens and user data.
   */
  clearTokens() {
    this._accessToken = null;
    this._refreshPromise = null;

    const keys = [
      config.tokens.accessTokenKey,
      config.tokens.refreshTokenKey,
      config.tokens.userDataKey,
    ];

    keys.forEach((key) => {
      try {
        localStorage.removeItem(key);
        sessionStorage.removeItem(key);
      } catch {
        // Ignore
      }
    });
  }

  /**
   * Reset the manager entirely (for logout).
   */
  reset() {
    this.clearTokens();
    if (this.backend === STORAGE_BACKENDS.memory) {
      this.backend.clear();
    }
  }
}

// Singleton instance — one TokenManager for the entire app
export const tokenManager = new TokenManager();
export default tokenManager;
