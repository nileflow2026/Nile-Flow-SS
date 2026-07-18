/**
 * TokenManager.js
 * Enterprise-grade token management.
 * Handles token storage, retrieval, refresh coordination, and multi-tab sync.
 * All tokens remain in httpOnly cookies — this only tracks presence and manages refresh logic.
 */

import { SECURITY_POLICIES } from './SecurityPolicies';

// In-memory state — never store actual token values in JS
let _isAuthenticated = false;
let _lastRefreshTime = 0;
let _pendingRefresh = null;
let _refreshCount = 0;
let _sessionId = null;

// Multi-tab sync channel
const _syncChannel = typeof BroadcastChannel !== 'undefined'
  ? new BroadcastChannel('nileflow:auth-sync')
  : null;

// Listeners for auth state changes
const _listeners = new Set();

/**
 * Subscribe to auth state changes.
 * @param {Function} listener - Called with ({ type: string, payload?: any })
 * @returns {Function} unsubscribe function
 */
export function subscribe(listener) {
  _listeners.add(listener);
  return () => _listeners.delete(listener);
}

function _notify(event) {
  _listeners.forEach((fn) => {
    try {
      fn(event);
    } catch (e) {
      // Swallow listener errors
    }
  });
}

// Listen for broadcasts from other tabs
if (_syncChannel) {
  _syncChannel.onmessage = (event) => {
    const { type } = event.data || {};
    switch (type) {
      case 'auth:logged-out':
      case 'auth:session-revoked':
        _isAuthenticated = false;
        _sessionId = null;
        _clearInMemory();
        _notify(event.data);
        break;
      case 'auth:token-refreshed':
        _lastRefreshTime = Date.now();
        break;
      case 'auth:permissions-changed':
        _notify(event.data);
        break;
    }
  };
}

function _clearInMemory() {
  _isAuthenticated = false;
  _sessionId = null;
  _lastRefreshTime = 0;
  _refreshCount = 0;
}

/**
 * Broadcast an event to all tabs.
 * @param {string} type
 * @param {*} [payload]
 */
export function broadcast(type, payload) {
  if (_syncChannel) {
    _syncChannel.postMessage({ type, payload, timestamp: Date.now() });
  }
}

/**
 * Check if a refresh is currently in progress.
 * @returns {boolean}
 */
export function isRefreshPending() {
  return _pendingRefresh !== null;
}

/**
 * Get the pending refresh promise for deduplication.
 * @returns {Promise|null}
 */
export function getPendingRefresh() {
  return _pendingRefresh;
}

/**
 * Set the pending refresh promise.
 * @param {Promise|null} promise
 */
export function setPendingRefresh(promise) {
  _pendingRefresh = promise;
  if (!promise) {
    _lastRefreshTime = Date.now();
  }
}

/**
 * Get the time since last successful refresh.
 * @returns {number} ms since last refresh
 */
export function getTimeSinceLastRefresh() {
  return _lastRefreshTime ? Date.now() - _lastRefreshTime : Infinity;
}

/**
 * Mark as authenticated.
 * @param {string} sessionId
 */
export function markAuthenticated(sessionId) {
  _isAuthenticated = true;
  _sessionId = sessionId;
  _lastRefreshTime = Date.now();
}

/**
 * Mark as unauthenticated (logout, session expired, etc.)
 */
export function markUnauthenticated() {
  _isAuthenticated = false;
  _sessionId = null;
  _clearInMemory();
}

/**
 * Check if currently marked as authenticated.
 * @returns {boolean}
 */
export function isAuthenticated() {
  return _isAuthenticated;
}

/**
 * Get the current session ID.
 * @returns {string|null}
 */
export function getSessionId() {
  return _sessionId;
}

/**
 * Get refresh count (for monitoring).
 * @returns {number}
 */
export function getRefreshCount() {
  return _refreshCount;
}

/**
 * Increment refresh counter.
 */
export function incrementRefreshCount() {
  _refreshCount++;
}

/**
 * Check if a refresh is needed based on time since last refresh.
 * @returns {boolean}
 */
export function shouldRefresh() {
  if (!_isAuthenticated) return false;
  const timeSince = getTimeSinceLastRefresh();
  // Refresh if more than half the access token lifetime has passed
  return timeSince > SECURITY_POLICIES.ACCESS_TOKEN_EXPIRY_MS * 0.5;
}

export default {
  subscribe,
  broadcast,
  isRefreshPending,
  getPendingRefresh,
  setPendingRefresh,
  getTimeSinceLastRefresh,
  markAuthenticated,
  markUnauthenticated,
  isAuthenticated,
  getSessionId,
  getRefreshCount,
  incrementRefreshCount,
  shouldRefresh,
};
