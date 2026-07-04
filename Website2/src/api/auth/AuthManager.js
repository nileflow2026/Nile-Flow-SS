/**
 * AuthManager
 *
 * Authentication orchestration layer.
 * Handles all auth flows: signup, signin, signout, OAuth, password reset.
 * Components call these methods — they never call the HTTP client directly.
 */

import { httpClient } from '@api/client/HttpClient';
import { tokenManager } from '@api/auth/TokenManager';
import { getDeviceId } from '@api/utils/helpers';
import { normalizeError } from '@api/utils/errorNormalizer';
import { config } from '@api/config';

class AuthManager {
  constructor() {
    this._sessionCheckPromise = null;
    this._onLogoutCallbacks = new Set();
    this._onLoginCallbacks = new Set();
    this._isAuthenticated = false;

    // Listen for forced logout from response interceptors
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', () => {
        this._handleForcedLogout();
      });
    }
  }

  // ── Authentication Flow ─────────────────────────────────────────

  /**
   * Sign up a new customer account.
   *
   * @param {Object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   * @param {string} [credentials.username]
   * @param {string} [credentials.phone]
   * @returns {Promise<{success: boolean, data: *, verificationNeeded: boolean, error: string|null}>}
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

      // Store tokens if returned
      if (response.data?.accessToken) {
        tokenManager.setAccessToken(response.data.accessToken);
      }
      if (response.data?.user) {
        tokenManager.setUserData(response.data.user);
        this._isAuthenticated = true;
        this._notifyLogin(response.data.user);
      }

      return {
        success: true,
        data: response.data,
        verificationNeeded: true,
      };
    } catch (error) {
      const normalized = normalizeError(error);
      return {
        success: false,
        error: normalized.message,
        verificationNeeded: false,
      };
    }
  }

  /**
   * Sign in an existing customer.
   *
   * @param {Object} credentials
   * @param {string} credentials.email
   * @param {string} credentials.password
   * @param {boolean} [rememberMe=false]
   * @returns {Promise<{success: boolean, data: *, error: string|null}>}
   */
  async signIn({ email, password, rememberMe = false }) {
    try {
      const deviceId = getDeviceId();

      // Temporarily switch storage backend if "remember me" is selected
      const originalStorage = config.tokens.storage;
      if (rememberMe && config.tokens.storage === 'memory') {
        // We'll handle this by writing to localStorage directly
      }

      const response = await httpClient.post('/api/customerauth/signin/customer', {
        email,
        password,
        deviceId,
      });

      // Store tokens
      if (response.data?.accessToken) {
        tokenManager.setAccessToken(response.data.accessToken);
        if (rememberMe) {
          // Also persist to localStorage for session recovery
          try {
            localStorage.setItem(config.tokens.accessTokenKey, response.data.accessToken);
          } catch {
            // Ignore
          }
        }
      }
      if (response.data?.refreshToken && rememberMe) {
        tokenManager.setRefreshToken(response.data.refreshToken);
      }

      // Store user data
      if (response.data?.user) {
        tokenManager.setUserData(response.data.user);
        this._isAuthenticated = true;
        this._notifyLogin(response.data.user);
      }

      // Clear guest status
      try {
        localStorage.removeItem('isGuest');
      } catch {
        // Ignore
      }

      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      const normalized = normalizeError(error);
      return {
        success: false,
        error: normalized.message,
      };
    }
  }

  /**
   * Sign out the current user.
   *
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async signOut() {
    try {
      await httpClient.post(
        '/api/customerauth/logoutCustomer',
        {},
        {
          withCredentials: true,
          _retryCount: 0,
        },
      );
    } catch (error) {
      // Logout API failure is non-fatal — clear local state anyway
      if (config.features.enableDebugLogging) {
        console.warn('[AuthManager] Logout API call failed, clearing local state:', error);
      }
    }

    // Clear all local auth state
    tokenManager.reset();

    try {
      localStorage.removeItem('isGuest');
      localStorage.removeItem('nf_user_data');
      sessionStorage.removeItem('nf_device_id');
    } catch {
      // Ignore
    }

    this._isAuthenticated = false;
    this._notifyLogout();

    return { success: true, message: 'Signed out successfully' };
  }

  // ── Session Management ──────────────────────────────────────────

  /**
   * Validate the current session by fetching the user profile.
   * Used on app initialization to restore auth state.
   *
   * @returns {Promise<{isAuthenticated: boolean, user: Object|null}>}
   */
  async validateSession() {
    // Deduplicate concurrent session validation calls
    if (this._sessionCheckPromise) {
      return this._sessionCheckPromise;
    }

    this._sessionCheckPromise = (async () => {
      // First check if we have a cached token
      if (!tokenManager.hasAccessToken()) {
        this._isAuthenticated = false;
        return { isAuthenticated: false, user: null };
      }

      try {
        const response = await httpClient.get(
          '/api/customerauth/getCustomerProfile',
          { _retryCount: 1 },
        );

        const user = response.data?.user || response.data;
        if (user) {
          tokenManager.setUserData(user);
          this._isAuthenticated = true;
          this._notifyLogin(user);
          return { isAuthenticated: true, user };
        }

        this._isAuthenticated = false;
        return { isAuthenticated: false, user: null };
      } catch {
        // Session invalid or expired — clear tokens
        tokenManager.clearTokens();
        this._isAuthenticated = false;
        return { isAuthenticated: false, user: null };
      } finally {
        this._sessionCheckPromise = null;
      }
    })();

    return this._sessionCheckPromise;
  }

  /**
   * Check authentication status without making an API call.
   * @returns {boolean}
   */
  isLoggedIn() {
    return this._isAuthenticated && tokenManager.hasAccessToken();
  }

  /**
   * Get the currently cached user data.
   * @returns {Object|null}
   */
  getCurrentUser() {
    return tokenManager.getUserData();
  }

  // ── OAuth ───────────────────────────────────────────────────────

  /**
   * Initiate Google OAuth sign-in.
   * Redirects the browser to Google's OAuth page.
   */
  async signInWithGoogle() {
    try {
      const response = await httpClient.get('/api/customerauth/oauth/google');
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: normalizeError(error).message };
    }
  }

  /**
   * Initiate Facebook OAuth sign-in.
   */
  async signInWithFacebook() {
    try {
      const response = await httpClient.get('/api/customerauth/oauth/facebook');
      if (response.data?.authUrl) {
        window.location.href = response.data.authUrl;
      }
      return { success: true };
    } catch (error) {
      return { success: false, error: normalizeError(error).message };
    }
  }

  /**
   * Handle OAuth callback by exchanging the code for a session.
   * @param {string} provider - 'google' | 'facebook'
   * @param {string} code - Authorization code from OAuth redirect
   * @param {string} [state] - State parameter for CSRF validation
   * @returns {Promise<{success: boolean, user: Object|null}>}
   */
  async handleOAuthCallback(provider, code, state) {
    try {
      const response = await httpClient.get(
        `/api/customerauth/oauth/${provider}/callback`,
        { code, state },
      );

      if (response.data?.accessToken) {
        tokenManager.setAccessToken(response.data.accessToken);
      }
      if (response.data?.user) {
        tokenManager.setUserData(response.data.user);
        this._isAuthenticated = true;
        this._notifyLogin(response.data.user);
        return { success: true, user: response.data.user };
      }

      return { success: false, user: null };
    } catch (error) {
      return { success: false, user: null, error: normalizeError(error).message };
    }
  }

  // ── Password Management ─────────────────────────────────────────

  /**
   * Send a password reset email.
   *
   * @param {string} email
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async forgotPassword(email) {
    try {
      const response = await httpClient.post(
        '/api/nileflowafrica/passwordchange/forgot-password',
        { email },
      );
      return {
        success: true,
        message: response.data?.message || 'Password reset email sent.',
      };
    } catch (error) {
      return { success: false, message: normalizeError(error).message };
    }
  }

  /**
   * Reset password using token from email.
   *
   * @param {string} email
   * @param {string} token
   * @param {string} newPassword
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async resetPassword(email, token, newPassword) {
    try {
      const response = await httpClient.post(
        '/api/nileflowafrica/passwordchange/reset-password',
        { email, token, newPassword },
      );
      return {
        success: true,
        message: response.data?.message || 'Password has been reset.',
      };
    } catch (error) {
      return { success: false, message: normalizeError(error).message };
    }
  }

  // ── Email Verification ──────────────────────────────────────────

  /**
   * Verify a customer's email with a verification code.
   *
   * @param {string} email
   * @param {string} verificationCode
   * @returns {Promise<{success: boolean, data: *, message: string}>}
   */
  async verifyEmail(email, verificationCode) {
    try {
      const deviceId = getDeviceId();
      const response = await httpClient.post('/api/customerauth/verify', {
        email,
        verificationCode,
        deviceId,
      });

      if (response.data?.accessToken) {
        tokenManager.setAccessToken(response.data.accessToken);
      }

      return {
        success: true,
        data: response.data,
        message: 'Account verified successfully!',
      };
    } catch (error) {
      return { success: false, message: normalizeError(error).message };
    }
  }

  /**
   * Resend the email verification code.
   *
   * @param {string} email
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async resendVerificationCode(email) {
    try {
      const response = await httpClient.post('/api/customerauth/resend-code', { email });
      return {
        success: true,
        message: response.data?.message || 'Verification code sent.',
      };
    } catch (error) {
      return { success: false, message: normalizeError(error).message };
    }
  }

  // ── Pickup Address ──────────────────────────────────────────────

  /**
   * Fetch the user's pickup/shipping address.
   * @returns {Promise<{success: boolean, data: *, hasAddress: boolean}>}
   */
  async getPickupAddress() {
    try {
      const response = await httpClient.get('/api/customerauth/pickup-address', {
        type: 'pickup',
      });

      const hasAddress = response.data
        ? (Array.isArray(response.data) ? response.data.length > 0 : true)
        : false;

      return { success: true, data: response.data, hasAddress };
    } catch (error) {
      if (error.status === 404) {
        return { success: true, data: null, hasAddress: false };
      }
      return { success: false, data: null, hasAddress: false };
    }
  }

  /**
   * Save a pickup address.
   *
   * @param {Object} addressData
   * @param {string} addressData.address
   * @param {string} addressData.phone
   * @param {string} addressData.city
   * @param {string} [addressData.state]
   * @param {string} [addressData.postalCode]
   * @returns {Promise<{success: boolean, data: *}>}
   */
  async savePickupAddress(addressData) {
    try {
      const user = tokenManager.getUserData();
      const fullName =
        user?.fullName || user?.username || user?.name || '';

      const response = await httpClient.post('/api/customerauth/pickup-address', {
        address: addressData.address,
        phone: addressData.phone,
        city: addressData.city,
        state: addressData.state,
        postalCode: addressData.postalCode,
        type: 'pickup',
        fullName,
      });

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: normalizeError(error).message };
    }
  }

  // ── Callbacks ───────────────────────────────────────────────────

  /**
   * Register a callback for when the user logs in.
   * @param {Function} callback - Receives user data
   * @returns {Function} Unsubscribe function
   */
  onLogin(callback) {
    this._onLoginCallbacks.add(callback);
    return () => this._onLoginCallbacks.delete(callback);
  }

  /**
   * Register a callback for when the user logs out.
   * @param {Function} callback
   * @returns {Function} Unsubscribe function
   */
  onLogout(callback) {
    this._onLogoutCallbacks.add(callback);
    return () => this._onLogoutCallbacks.delete(callback);
  }

  _notifyLogin(user) {
    this._onLoginCallbacks.forEach((cb) => {
      try {
        cb(user);
      } catch {
        // Ignore callback errors
      }
    });
  }

  _notifyLogout() {
    this._onLogoutCallbacks.forEach((cb) => {
      try {
        cb();
      } catch {
        // Ignore
      }
    });
  }

  _handleForcedLogout() {
    tokenManager.reset();
    this._isAuthenticated = false;
    this._notifyLogout();
  }
}

// Singleton instance
export const authManager = new AuthManager();
export default authManager;
