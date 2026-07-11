/**
 * Client Initialization
 *
 * Call `initializeApi()` once at app startup to:
 * 1. Initialize the HttpClient with interceptors
 * 2. Register the HTTP interceptor pipeline
 *
 * Session validation is now handled by AuthService/AuthProvider.
 * This function only sets up HTTP infrastructure.
 */

import { httpClient } from '@api/client/HttpClient';
import { authInterceptor, correlationIdInterceptor, deviceInterceptor, localeInterceptor, timezoneInterceptor } from '@api/interceptors/requestInterceptors';
import { tokenRefreshInterceptor, maintenanceModeInterceptor, loggingInterceptor } from '@api/interceptors/responseInterceptors';

/**
 * Initialize the API layer (HTTP interceptors only).
 * Call this once in the app bootstrap before any components mount.
 *
 * Session validation is done by the AuthService — not here.
 * This separation ensures the HTTP layer and auth layer are independent.
 *
 * @returns {void}
 */
export function initializeApi() {
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

  // Initialize the Axios instance with all interceptors
  httpClient.initialize();

  // NOTE: Token recovery from storage is intentionally REMOVED.
  // Previously, this code block read JWT tokens from localStorage (CRITICAL XSS vulnerability).
  // Refresh tokens are handled by the backend via HttpOnly cookies.
  // Access tokens are managed by the SecureTokenManager in memory only.
}

/**
 * Get the HttpClient instance.
 * @returns {import('@api/client/HttpClient').HttpClient}
 */
export function getHttpClient() {
  return httpClient;
}

/**
 * Get the HttpClient instance (alias).
 */
export { httpClient };
