/**
 * AuthService
 *
 * Enterprise-grade authentication service layer.
 * All communication with the backend auth API goes through this service.
 *
 * This replaces the previous AuthManager with a more secure, modular design.
 * Key differences:
 * - Never stores tokens in localStorage
 * - Uses HttpOnly cookies for refresh tokens (backend responsibility)
 * - Proactive token refresh
 * - Proper error handling
 * - Security event logging
 */

import { httpClient } from '@api/client/HttpClient';
import { secureTokenManager } from './tokenManager';
import { sessionManager } from './sessionManager';
import { refreshScheduler } from './refreshScheduler';
import { securityLogger } from './securityLogger';
import { getDeviceId } from '@api/utils/helpers';
import { normalizeError } from '@api/utils/errorNormalizer';

class AuthService {
  constructor() {
    this._initialized = false;
    this._sessionCheckPromise = null;
    this._onLoginCallbacks = new Set();
    this._onLogoutCallbacks = new Set();
  }

  /**
   * Initialize the auth service.
   * Must be called once on app startup.
   * @returns {Promise<{isAuthenticated: boolean, user: Object|null}>}
   */
  async initialize() {
    if (this._initialized) {
      return {
        isAuthenticated: secureTokenManager.hasAccessToken(),
        user: secureTokenManager.getUserData(),
      };
    }
    this._initialized = true;

    // Initialize sub-systems
    secureTokenManager.initialize();
    sessionManager.initialize();
    securityLogger.initialize();

    // Wire the refresh scheduler with the refresh function
    refreshScheduler.initialize(() => this._performRefresh(), {
      threshold: 0.8,
    });

    // Auth uses HttpOnly cookies, so a valid session cannot be detected from
    // client-side token storage after an OAuth redirect or page refresh.
    return this.validateSession();
  }

  // ── Sign Up ──────────────────────────────────────────────────

  /**
   * Register a new customer account.
   */
  async signUp({ email, password, username, phone }) {
    try {
      const deviceId = getDeviceId();
      const response = await httpClient.post('/api/customerauth/signup/customer', {
        email,
        password,
        username,
        phone,
        deviceId,
      });

      // If backend returns an access token (e.g., auto-login after signup)
      if (response.data?.accessToken) {
        secureTokenManager.setAccessToken(
          response.data.accessToken,
          response.data.expiresIn,
        );
      }
      if (response.data?.user) {
        secureTokenManager.setUserData(response.data.user);
        sessionManager.startSession(response.data.sessionId);
        securityLogger.loginSuccess(response.data.user.$id, { method: 'signup' });
        this._notifyLogin(response.data.user);
      }

      return {
        success: true,
        data: response.data,
        verificationNeeded: !response.data?.user?.emailVerified,
      };
    } catch (error) {
      const normalized = normalizeError(error);
      securityLogger.loginFailure(email, 'signup_failed', { reason: normalized.message });
      return { success: false, error: normalized.message, verificationNeeded: false };
    }
  }

  // ── Sign In ──────────────────────────────────────────────────

  /**
   * Authenticate a customer.
   */
  async signIn({ email, password }) {
    try {
      const deviceId = getDeviceId();

      const response = await httpClient.post('/api/customerauth/signin/customer', {
        email,
        password,
        deviceId,
      });

      // Store tokens securely (in memory)
      if (response.data?.accessToken) {
        secureTokenManager.setAccessToken(
          response.data.accessToken,
          response.data.expiresIn,
        );
      }

      // Store user data
      if (response.data?.user) {
        secureTokenManager.setUserData(response.data.user);
        sessionManager.startSession(response.data.sessionId);
        securityLogger.loginSuccess(response.data.user.$id, { method: 'password' });
        this._notifyLogin(response.data.user);
      }

      // Start proactive refresh scheduler
      refreshScheduler.start();

      // Clear guest status
      try { localStorage.removeItem('isGuest'); } catch { /* ignore */ }

      return { success: true, data: response.data };
    } catch (error) {
      const normalized = normalizeError(error);
      securityLogger.loginFailure(email, 'invalid_credentials', {
        reason: normalized.message,
        code: normalized.code,
      });
      return { success: false, error: normalized.message };
    }
  }

  // ── Sign Out ─────────────────────────────────────────────────

  /**
   * Sign out the current user.
   */
  async signOut() {
    // Stop the refresh scheduler
    refreshScheduler.stop();

    try {
      await httpClient.post(
        '/api/customerauth/logoutCustomer',
        {},
        { _retryCount: 0 },
      );
    } catch {
      // Logout API failure is non-fatal — clear local state anyway
    }

    const userId = secureTokenManager.getUserData()?.$id;

    // Clear all auth state
    secureTokenManager.reset();
    sessionManager.endSession();

    securityLogger.logout(userId);

    try {
      localStorage.removeItem('isGuest');
    } catch { /* ignore */ }

    this._notifyLogout();

    return { success: true, message: 'Signed out successfully' };
  }

  // ── Session Validation ───────────────────────────────────────

  /**
   * Validate the current session by fetching the user profile.
   * Used on app initialization to restore auth state after page refresh.
   */
  async validateSession() {
    // Deduplicate concurrent calls
    if (this._sessionCheckPromise) {
      return this._sessionCheckPromise;
    }

    this._sessionCheckPromise = (async () => {
      try {
        // The backend validates our session via HttpOnly cookie
        // (set by the backend on login). The cookie is automatically
        // sent with the request.
        const response = await httpClient.get(
          '/api/customerauth/getCustomerProfile',
          { _: Date.now() },
          {
            headers: { 'Cache-Control': 'no-cache' },
            _retryCount: 1,
          },
        );

        const user = response.data?.user || response.data;
        if (user) {
          secureTokenManager.setUserData(user);

          // If there's a new access token in the response, store it
          if (response.data?.accessToken) {
            secureTokenManager.setAccessToken(
              response.data.accessToken,
              response.data.expiresIn,
            );
          }

          sessionManager.startSession(response.data?.sessionId);
          securityLogger.loginSuccess(user.$id, { method: 'session_restore' });
          this._notifyLogin(user);

          // Start proactive refresh
          refreshScheduler.start();

          return { isAuthenticated: true, user };
        }

        return { isAuthenticated: false, user: null };
      } catch {
        // Session invalid or expired
        secureTokenManager.clearTokens();
        sessionManager.invalidateSession('validation_failed');
        return { isAuthenticated: false, user: null };
      } finally {
        this._sessionCheckPromise = null;
      }
    })();

    return this._sessionCheckPromise;
  }

  // ── Token Refresh ────────────────────────────────────────────

  /**
   * Perform a token refresh by calling the refresh endpoint.
   * The backend uses the HttpOnly refresh cookie to issue new tokens.
   * @returns {Promise<{accessToken: string, expiresIn: number}|null>}
   */
  async _performRefresh() {
    try {
      const deviceId = getDeviceId();
      const response = await httpClient.post(
        '/api/customerauth/refresh',
        { deviceId },
        { _retryCount: 0 },
      );

      if (response.data?.accessToken) {
        return {
          accessToken: response.data.accessToken,
          expiresIn: response.data.expiresIn,
        };
      }

      return null;
    } catch {
      return null;
    }
  }

  // ── Email Verification ───────────────────────────────────────

  async verifyEmail(email, verificationCode) {
    try {
      const deviceId = getDeviceId();
      const response = await httpClient.post('/api/customerauth/verify', {
        email,
        verificationCode,
        deviceId,
      });

      if (response.data?.accessToken) {
        secureTokenManager.setAccessToken(response.data.accessToken, response.data.expiresIn);
      }
      if (response.data?.user) {
        secureTokenManager.setUserData(response.data.user);
      }

      securityLogger.loginSuccess(response.data?.user?.$id || 'unknown', { method: 'email_verify' });

      return { success: true, data: response.data, message: 'Account verified successfully!' };
    } catch (error) {
      return { success: false, message: normalizeError(error).message };
    }
  }

  async resendVerificationCode(email) {
    try {
      const response = await httpClient.post('/api/customerauth/resend-code', { email });
      return { success: true, message: response.data?.message || 'Verification code sent.' };
    } catch (error) {
      return { success: false, message: normalizeError(error).message };
    }
  }

  // ── Password Management ──────────────────────────────────────

  async forgotPassword(email) {
    try {
      const response = await httpClient.post('/api/nileflowafrica/passwordchange/forgot-password', { email });
      return { success: true, message: response.data?.message || 'Password reset email sent.' };
    } catch (error) {
      return { success: false, message: normalizeError(error).message };
    }
  }

  async resetPassword(email, token, newPassword) {
    try {
      const response = await httpClient.post('/api/nileflowafrica/passwordchange/reset-password', {
        email, token, newPassword,
      });
      securityLogger.passwordChanged('unknown', { method: 'reset' });
      return { success: true, message: response.data?.message || 'Password has been reset.' };
    } catch (error) {
      return { success: false, message: normalizeError(error).message };
    }
  }

  // ── Pickup Address ───────────────────────────────────────────

  async getPickupAddress() {
    try {
      const response = await httpClient.get('/api/customerauth/pickup-address', { type: 'pickup' });
      const hasAddress = response.data
        ? (Array.isArray(response.data) ? response.data.length > 0 : true)
        : false;
      return { success: true, data: response.data, hasAddress };
    } catch (error) {
      if (error.status === 404) return { success: true, data: null, hasAddress: false };
      return { success: false, data: null, hasAddress: false };
    }
  }

  async savePickupAddress(addressData) {
    try {
      const user = secureTokenManager.getUserData();
      const fullName = user?.fullName || user?.username || user?.name || '';
      const response = await httpClient.post('/api/customerauth/pickup-address', {
        ...addressData,
        type: 'pickup',
        fullName,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: normalizeError(error).message };
    }
  }

  // ── OAuth ────────────────────────────────────────────────────

  async signInWithGoogle() {
    try {
      const response = await httpClient.get('/api/customerauth/oauth/google');
      if (response.data?.authUrl) window.location.href = response.data.authUrl;
      return { success: true };
    } catch (error) {
      return { success: false, error: normalizeError(error).message };
    }
  }

  async signInWithFacebook() {
    try {
      const response = await httpClient.get('/api/customerauth/oauth/facebook');
      if (response.data?.authUrl) window.location.href = response.data.authUrl;
      return { success: true };
    } catch (error) {
      return { success: false, error: normalizeError(error).message };
    }
  }

  async handleOAuthCallback(provider, code, state, pkceVerifier) {
    try {
      const response = await httpClient.get(`/api/customerauth/oauth/${provider}/callback`, {
        code,
        state,
        code_verifier: pkceVerifier,
      });
      if (response.data?.accessToken) {
        secureTokenManager.setAccessToken(response.data.accessToken, response.data.expiresIn);
      }
      if (response.data?.user) {
        secureTokenManager.setUserData(response.data.user);
        sessionManager.startSession(response.data.sessionId);
        refreshScheduler.start();
        securityLogger.loginSuccess(response.data.user.$id, {
          method: `oauth_${provider}`,
          isNewUser: !!response.data.isNewUser,
          accountLinked: !!response.data.accountLinked,
        });
        this._notifyLogin(response.data.user);
        return { success: true, user: response.data.user };
      }
      return { success: false, user: null };
    } catch (error) {
      securityLogger.loginFailure('unknown', `oauth_callback_${provider}`, {
        reason: error?.message || 'Callback failed',
      });
      return { success: false, user: null, error: normalizeError(error).message };
    }
  }

  // ── Auth State Checks ────────────────────────────────────────

  isLoggedIn() {
    return secureTokenManager.hasAccessToken() && sessionManager.isValid();
  }

  getCurrentUser() {
    return secureTokenManager.getUserData();
  }

  // ── Callbacks ────────────────────────────────────────────────

  onLogin(callback) {
    this._onLoginCallbacks.add(callback);
    return () => this._onLoginCallbacks.delete(callback);
  }

  onLogout(callback) {
    this._onLogoutCallbacks.add(callback);
    return () => this._onLogoutCallbacks.delete(callback);
  }

  _notifyLogin(user) {
    this._onLoginCallbacks.forEach((cb) => {
      try { cb(user); } catch { /* ignore */ }
    });
  }

  _notifyLogout() {
    this._onLogoutCallbacks.forEach((cb) => {
      try { cb(); } catch { /* ignore */ }
    });
  }
}

// Singleton
export const authService = new AuthService();
export default authService;
