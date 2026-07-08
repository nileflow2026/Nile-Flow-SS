/**
 * RefreshScheduler
 *
 * Enterprise-grade proactive token refresh scheduler.
 *
 * Instead of waiting for API 401 errors, this scheduler proactively
 * refreshes the access token BEFORE it expires. This ensures:
 * - Users never experience token expiry
 * - No failed API calls due to expired tokens
 * - Smooth UX without visible auth transitions
 *
 * Strategy:
 * - Access Token lives 15 minutes by default
 * - Refresh triggers at ~80% of token lifetime (12 minutes)
 * - Falls back to 401-driven refresh on the interceptor if scheduler missed
 * - Single in-flight refresh per tab
 * - Cross-tab coordination via BroadcastChannel
 */

import { secureTokenManager } from './tokenManager';
import { securityLogger } from './securityLogger';

// Default: refresh when 80% of the token lifetime has passed
const DEFAULT_REFRESH_THRESHOLD = 0.8;

// Minimum interval between refresh attempts (10 seconds)
const MIN_REFRESH_INTERVAL_MS = 10000;

// Max refresh attempts before giving up
const MAX_REFRESH_ATTEMPTS = 3;

class RefreshScheduler {
  constructor() {
    this._timer = null;
    this._refreshFn = null;
    this._isRunning = false;
    this._lastRefreshTime = 0;
    this._consecutiveFailures = 0;
    this._refreshThreshold = DEFAULT_REFRESH_THRESHOLD;
    this._initialized = false;
    this._listeners = new Map();
  }

  /**
   * Initialize the scheduler.
   * @param {Function} refreshFn - Async function that performs the refresh
   * @param {Object} [options]
   * @param {number} [options.threshold] - Refresh threshold (0-1), default 0.8
   */
  initialize(refreshFn, options = {}) {
    if (this._initialized) return;
    this._initialized = true;
    this._refreshFn = refreshFn;
    this._refreshThreshold = options.threshold ?? DEFAULT_REFRESH_THRESHOLD;
  }

  /**
   * Start the scheduler after a token is set.
   * This schedules the next refresh based on token expiry.
   */
  start() {
    if (!this._refreshFn) return;

    this._isRunning = true;
    this._scheduleNextRefresh();
  }

  /**
   * Stop the scheduler.
   */
  stop() {
    this._isRunning = false;
    this._clearTimer();
  }

  /**
   * Pause the scheduler temporarily (e.g., during logout).
   */
  pause() {
    this._clearTimer();
  }

  /**
   * Resume the scheduler.
   */
  resume() {
    if (this._isRunning) {
      this._scheduleNextRefresh();
    }
  }

  /**
   * Force an immediate refresh attempt.
   * @returns {Promise<boolean>}
   */
  async refreshNow() {
    if (!this._refreshFn) return false;

    // Rate limiting
    const timeSinceLastRefresh = Date.now() - this._lastRefreshTime;
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
      // Too soon — wait for existing refresh or skip
      if (secureTokenManager.isRefreshing()) {
        return secureTokenManager.waitForRefresh();
      }
      return false;
    }

    try {
      this._lastRefreshTime = Date.now();
      const success = await secureTokenManager.refreshToken(this._refreshFn);

      if (success) {
        this._consecutiveFailures = 0;
        securityLogger.tokenRefreshed(
          secureTokenManager.getUserData()?.$id || 'unknown',
        );
        this._notifyListeners('refresh:success');
        this._scheduleNextRefresh();
        return true;
      }

      this._consecutiveFailures++;
      this._notifyListeners('refresh:failure');
      return false;
    } catch (error) {
      this._consecutiveFailures++;
      securityLogger.tokenRefreshFailed(
        secureTokenManager.getUserData()?.$id || 'unknown',
        error?.message || 'Refresh failed',
      );
      this._notifyListeners('refresh:failure');

      // Retry scheduling if we haven't exceeded max attempts
      if (this._consecutiveFailures < MAX_REFRESH_ATTEMPTS) {
        this._scheduleNextRefresh(30000); // Retry in 30 seconds
      } else {
        this._notifyListeners('refresh:exhausted');
      }

      return false;
    }
  }

  /**
   * Schedule the next refresh based on token expiry.
   */
  _scheduleNextRefresh(overrideDelay) {
    if (!this._isRunning) return;
    this._clearTimer();

    let delayMs;

    if (overrideDelay) {
      delayMs = overrideDelay;
    } else {
      const secondsUntilExpiry = secureTokenManager.getSecondsUntilExpiry();

      // If no token or already expired, check again soon
      if (secondsUntilExpiry <= 0) {
        delayMs = 15000; // Check again in 15 seconds
      } else {
        // Refresh at threshold of token lifetime
        delayMs = Math.floor(secondsUntilExpiry * 1000 * (1 - this._refreshThreshold));
        // Ensure we don't wait too long — cap at max 10 minutes
        delayMs = Math.min(delayMs, 10 * 60 * 1000);
        // Ensure minimum delay
        delayMs = Math.max(delayMs, MIN_REFRESH_INTERVAL_MS);
      }
    }

    this._timer = setTimeout(() => {
      if (this._isRunning) {
        this.refreshNow();
      }
    }, delayMs);
  }

  /**
   * Clear the scheduled timer.
   */
  _clearTimer() {
    if (this._timer) {
      clearTimeout(this._timer);
      this._timer = null;
    }
  }

  /**
   * Check if the scheduler is running.
   * @returns {boolean}
   */
  isRunning() {
    return this._isRunning;
  }

  /**
   * Get the number of consecutive refresh failures.
   * @returns {number}
   */
  getConsecutiveFailures() {
    return this._consecutiveFailures;
  }

  /**
   * Reset the consecutive failure counter.
   */
  resetFailures() {
    this._consecutiveFailures = 0;
  }

  /**
   * Register a listener for scheduler events.
   * @param {string} event - 'refresh:success' | 'refresh:failure' | 'refresh:exhausted'
   * @param {Function} callback
   * @returns {Function} Unsubscribe
   */
  on(event, callback) {
    if (!this._listeners.has(event)) {
      this._listeners.set(event, new Set());
    }
    this._listeners.get(event).add(callback);
    return () => this._listeners.get(event)?.delete(callback);
  }

  _notifyListeners(event) {
    const handlers = this._listeners.get(event);
    if (handlers) {
      handlers.forEach((cb) => {
        try { cb(); } catch { /* ignore */ }
      });
    }
  }

  /**
   * Clean up all resources.
   */
  destroy() {
    this.stop();
    this._listeners.clear();
    this._initialized = false;
    this._refreshFn = null;
  }
}

// Singleton
export const refreshScheduler = new RefreshScheduler();
export default refreshScheduler;
