/**
 * OAuthBridge
 *
 * Enterprise-grade OAuth bridge for Google & Facebook authentication.
 * Handles popup AND redirect flows, state validation, popup-blocked
 * detection, and seamless integration with the existing auth system.
 *
 * Architecture decision: Google OAuth uses the OAuth 2.0 Authorization
 * Code flow with PKCE (Proof Key for Code Exchange) for maximum security.
 * The popup flow avoids redirect-away-from-app issues, and the redirect
 * flow serves as a graceful fallback.
 *
 * Security properties:
 * - State parameter with PKCE challenge (CSRF protection)
 * - Nonce generation for replay attack prevention
 * - Popup origin validation (prevents rogue window interception)
 * - No tokens in URL fragments (prevents history/leakage)
 * - Strict origin checks on postMessage
 */

import { securityLogger } from './securityLogger';
import { generateCsrfToken } from './authUtils';
import { authService } from './authService';
import { httpClient } from '@api/client/HttpClient';
import { config } from '@api/config';

// ── Constants ─────────────────────────────────────────────────

const OAUTH_PROVIDERS = {
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
};

const POPUP_WIDTH = 600;
const POPUP_HEIGHT = 700;
const POPUP_CHECK_INTERVAL = 500; // ms between popup close checks
const POPUP_TIMEOUT = 120000; // 2 minutes max wait
const OAUTH_STATE_KEY = 'nf_oauth_state';
const OAUTH_NONCE_KEY = 'nf_oauth_nonce';
const OAUTH_POPUP_FEATURES = `width=${POPUP_WIDTH},height=${POPUP_HEIGHT},menubar=no,toolbar=no,location=no,status=no,scrollbars=yes`;

/**
 * Generate PKCE challenge verifier and code challenge.
 */
function generatePkceChallenge() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = btoa(String.fromCharCode(...array))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return verifier;
}

/**
 * Hash the PKCE verifier to create the code challenge.
 */
async function createCodeChallenge(verifier) {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const challenge = btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return challenge;
}

/**
 * OAuthBridge — handles popup and redirect OAuth flows.
 */
class OAuthBridge {
  constructor() {
    this._popupWindow = null;
    this._popupCheckTimer = null;
    this._popupTimeoutTimer = null;
    this._currentProvider = null;
    this._pendingResolve = null;
    this._pendingReject = null;
    this._messageHandler = null;
    this._pkceVerifier = null;
  }

  /**
   * Initiate Google OAuth sign-in via popup (primary) with redirect fallback.
   * @param {Object} [options]
   * @param {boolean} [options.usePopup=true] - Try popup first
   * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
   */
  async signInWithGoogle(options = {}) {
    const { usePopup = true } = options;
    this._currentProvider = OAUTH_PROVIDERS.GOOGLE;
    return this._initiateOAuth(usePopup);
  }

  /**
   * Initiate Facebook OAuth sign-in via popup (primary) with redirect fallback.
   */
  async signInWithFacebook(options = {}) {
    const { usePopup = true } = options;
    this._currentProvider = OAUTH_PROVIDERS.FACEBOOK;
    return this._initiateOAuth(usePopup);
  }

  /**
   * Core OAuth initiation — popup first, fall back to redirect.
   */
  async _initiateOAuth(usePopup) {
    try {
      // Generate PKCE verifier + store for callback
      this._pkceVerifier = generatePkceChallenge();
      const codeChallenge = await createCodeChallenge(this._pkceVerifier);

      // Generate and store CSRF state + nonce
      const state = generateCsrfToken();
      const nonce = generateCsrfToken();
      this._persistOAuthState(state, nonce);
      try {
        sessionStorage.setItem('nf_oauth_pending_provider', this._currentProvider);
      } catch { /* ignore unavailable session storage */ }

      // Fetch the backend OAuth URL (which includes state, nonce, PKCE)
      const endpoint = `/api/customerauth/oauth/${this._currentProvider}`;
      const response = await httpClient.get(endpoint, {
        state,
        nonce,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
      }, {
        baseURL: config.api.baseURL || import.meta.env.VITE_API_BASE_URL,
      });

      if (!response?.data?.authUrl) {
        throw new Error('Failed to get OAuth URL from backend');
      }

      const authUrl = response.data.authUrl;
      const issuedState = new URL(authUrl).searchParams.get('state');
      if (!issuedState) throw new Error('OAuth state is missing from the provider URL');
      this._persistOAuthState(issuedState, nonce);

      if (usePopup) {
        return await this._tryPopupFlow(authUrl);
      }

      // Fall back to redirect flow
      this._redirectFlow(authUrl);
      return { success: true, redirecting: true };
    } catch (error) {
      securityLogger.suspiciousActivity(
        'unknown',
        `OAuth initiation failed: ${error?.message}`,
        { provider: this._currentProvider },
      );
      return { success: false, error: error?.message || 'OAuth initiation failed' };
    }
  }

  /**
   * Try popup flow. If popup is blocked, fall back to redirect.
   */
  async _tryPopupFlow(authUrl) {
    // Try popup
    this._popupWindow = window.open(authUrl, 'oauthPopup', OAUTH_POPUP_FEATURES);

    if (!this._popupWindow || this._popupWindow.closed) {
      // Popup was blocked — fall back to redirect
      securityLogger.log('POPUP_BLOCKED', { provider: this._currentProvider });
      this._redirectFlow(authUrl);
      return { success: true, redirecting: true };
    }

    // Popup opened successfully — wait for callback via postMessage or close detection
    return new Promise((resolve, reject) => {
      this._pendingResolve = resolve;
      this._pendingReject = reject;

      // Listen for postMessage from the popup
      this._messageHandler = (event) => {
        // Validate origin — only accept messages from our own origin
        if (event.origin !== window.location.origin) return;

        // Validate the message structure
        if (!event.data || event.data.type !== 'oauth:callback') return;

        this._cleanupPopup();
        const { success, user, error } = event.data;

        if (success) {
          securityLogger.loginSuccess(user?.$id || 'unknown', {
            method: `oauth_popup_${this._currentProvider}`,
          });
          resolve({ success: true, user });
        } else {
          resolve({ success: false, error: error || 'OAuth failed' });
        }
      };
      window.addEventListener('message', this._messageHandler);

      // Poll for popup close (user cancelled)
      let elapsed = 0;
      this._popupCheckTimer = setInterval(() => {
        elapsed += POPUP_CHECK_INTERVAL;

        if (this._popupWindow.closed) {
          // Popup closed without completing
          this._cleanupPopup();
          securityLogger.log('OAUTH_POPUP_CLOSED', { provider: this._currentProvider });
          resolve({
            success: false,
            error: 'Sign-in window was closed. Please try again.',
          });
        }

        if (elapsed >= POPUP_TIMEOUT) {
          // Popup timed out
          this._popupWindow.close();
          this._cleanupPopup();
          securityLogger.log('OAUTH_TIMEOUT', { provider: this._currentProvider });
          resolve({
            success: false,
            error: 'Sign-in timed out. Please try again.',
          });
        }
      }, POPUP_CHECK_INTERVAL);

      // Timeout the whole operation
      this._popupTimeoutTimer = setTimeout(() => {
        if (this._popupWindow && !this._popupWindow.closed) {
          this._popupWindow.close();
        }
        this._cleanupPopup();
        resolve({ success: false, error: 'Sign-in timed out.' });
      }, POPUP_TIMEOUT);
    });
  }

  /**
   * Redirect flow lets the Backend establish its cookie session before
   * returning the browser to the Website2 home route.
   */
  _redirectFlow(authUrl) {
    // Store the pending provider and PKCE verifier for the callback page
    try {
      sessionStorage.setItem('nf_oauth_pending_provider', this._currentProvider);
      sessionStorage.setItem('nf_oauth_pkce_verifier', this._pkceVerifier);
    } catch { /* ignore */ }
    window.location.href = authUrl;
  }

  /**
   * Handle OAuth callback after redirect back to the app.
   * Used by OAuthCallbackPage.
   *
   * @param {string} code - Authorization code from OAuth provider
   * @param {string} state - State parameter for CSRF validation
   * @param {string} provider - 'google' | 'facebook'
   * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
   */
  async handleCallback(code, state, provider) {
    try {
      // Validate state (CSRF protection)
      const storedState = this._retrieveOAuthState();
      if (state && storedState && state !== storedState) {
        securityLogger.csrfViolation({
          provider,
          expectedState: storedState,
          receivedState: state,
        });
        throw new Error('Security validation failed. Please try again.');
      }

      // Retrieve PKCE verifier for redirect flow
      let pkceVerifier = this._pkceVerifier;
      if (!pkceVerifier) {
        try {
          pkceVerifier = sessionStorage.getItem('nf_oauth_pkce_verifier');
          sessionStorage.removeItem('nf_oauth_pkce_verifier');
        } catch { /* ignore */ }
      }

      // Send the auth code + PKCE verifier to the backend
      // The backend will exchange the code for tokens
      const result = await authService.handleOAuthCallback(
        provider,
        code,
        state,
        pkceVerifier,
      );

      // Clear stored OAuth state
      this._clearOAuthState();
      try { sessionStorage.removeItem('nf_oauth_pending_provider'); } catch { /* ignore */ }

      return result;
    } catch (error) {
      this._clearOAuthState();
      securityLogger.loginFailure('unknown', `oauth_callback_${provider}`, {
        reason: error?.message,
      });
      return {
        success: false,
        error: error?.message || `${provider} sign-in failed. Please try again.`,
      };
    }
  }

  /**
   * Persist OAuth state and nonce for CSRF validation.
   */
  _persistOAuthState(state, nonce) {
    try {
      sessionStorage.setItem(OAUTH_STATE_KEY, state);
      sessionStorage.setItem(OAUTH_NONCE_KEY, nonce);
    } catch { /* ignore */ }
  }

  /**
   * Retrieve stored OAuth state.
   */
  _retrieveOAuthState() {
    try {
      return sessionStorage.getItem(OAUTH_STATE_KEY);
    } catch {
      return null;
    }
  }

  /**
   * Clear stored OAuth state.
   */
  _clearOAuthState() {
    try {
      sessionStorage.removeItem(OAUTH_STATE_KEY);
      sessionStorage.removeItem(OAUTH_NONCE_KEY);
    } catch { /* ignore */ }
  }

  /**
   * Clean up popup resources.
   */
  _cleanupPopup() {
    if (this._messageHandler) {
      window.removeEventListener('message', this._messageHandler);
      this._messageHandler = null;
    }
    if (this._popupCheckTimer) {
      clearInterval(this._popupCheckTimer);
      this._popupCheckTimer = null;
    }
    if (this._popupTimeoutTimer) {
      clearTimeout(this._popupTimeoutTimer);
      this._popupTimeoutTimer = null;
    }
    this._popupWindow = null;
    this._pendingResolve = null;
    this._pendingReject = null;
    this._pkceVerifier = null;
  }

  /**
   * Clean up all resources.
   */
  destroy() {
    this._cleanupPopup();
    this._clearOAuthState();
    this._currentProvider = null;
  }

  /**
   * Check if currently in an OAuth redirect callback flow
   * (the page loaded with OAuth params in the URL).
   */
  static detectOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');
    const error = params.get('error');

    if (error) {
      return { isCallback: true, error, provider: 'google' };
    }
    if (code) {
      // Detect provider from URL pattern
      const provider = params.get('provider') || 'google';
      return { isCallback: true, code, state, provider };
    }
    return { isCallback: false };
  }
}

// Singleton
export const oauthBridge = new OAuthBridge();
export default oauthBridge;
