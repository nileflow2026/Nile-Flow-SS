/**
 * Client Initialization
 *
 * Call `initializeApi()` once at app startup to:
 * 1. Initialize the HttpClient with interceptors
 * 2. Restore any persisted auth session
 *
 * Import this in your app's entry point.
 */

import { httpClient } from '@api/client/HttpClient';
import { authManager } from '@api/auth/AuthManager';
import { authInterceptor, correlationIdInterceptor, deviceInterceptor, localeInterceptor, timezoneInterceptor } from '@api/interceptors/requestInterceptors';
import { tokenRefreshInterceptor, maintenanceModeInterceptor, loggingInterceptor } from '@api/interceptors/responseInterceptors';
import { config } from '@api/config';

/**
 * Initialize the API layer.
 * Call this once in the app bootstrap before any components mount.
 *
 * @param {Object} [options]
 * @param {boolean} [options.validateSession=true] - Whether to check auth on init
 * @returns {Promise<{isAuthenticated: boolean, user: Object|null}>}
 */
export async function initializeApi(options = {}) {
  const { validateSession = true } = options;

  // Register request interceptors (order matters)
  httpClient.addRequestInterceptor(...Object.values(authInterceptor()));
  httpClient.addRequestInterceptor(...Object.values(correlationIdInterceptor()));
  httpClient.addRequestInterceptor(...Object.values(deviceInterceptor()));
  httpClient.addRequestInterceptor(...Object.values(localeInterceptor()));
  httpClient.addRequestInterceptor(...Object.values(timezoneInterceptor()));

  // Register response interceptors
  httpClient.addResponseInterceptor(...Object.values(tokenRefreshInterceptor()));
  httpClient.addResponseInterceptor(...Object.values(maintenanceModeInterceptor()));
  httpClient.addResponseInterceptor(...Object.values(loggingInterceptor()));

  // Initialize the Axios instance
  httpClient.initialize();

  // Check for an access token in localStorage (session recovery)
  if (config.tokens.storage !== 'memory') {
    // TokenManager already handles this through its backend
  } else {
    // If memory mode, check localStorage for a persisted token on first load
    try {
      const persistedToken = localStorage.getItem(config.tokens.accessTokenKey);
      if (persistedToken) {
        const { tokenManager } = await import('@api/auth/TokenManager');
        tokenManager.setAccessToken(persistedToken);
      }
    } catch {
      // Ignore
    }
  }

  // Validate existing session
  if (validateSession) {
    const session = await authManager.validateSession();
    return session;
  }

  return { isAuthenticated: false, user: null };
}

/**
 * Get the HttpClient instance.
 * @returns {import('@api/client/HttpClient').HttpClient}
 */
export function getHttpClient() {
  return httpClient;
}

/**
 * Get the AuthManager instance.
 * @returns {import('@api/auth/AuthManager').AuthManager}
 */
export function getAuthManager() {
  return authManager;
}

export { httpClient, authManager };
