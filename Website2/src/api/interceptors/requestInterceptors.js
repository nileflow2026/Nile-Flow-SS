/**
 * Request Interceptors
 *
 * Modular request interceptors that register on the HttpClient.
 * Each interceptor has a single responsibility.
 *
 * Interceptor execution order:
 * 1. Auth interceptor (attach access token)
 * 2. Correlation ID interceptor (trace requests)
 * 3. Locale interceptor (language + currency headers)
 * 4. Device interceptor (platform identification)
 */

import { tokenManager } from '@api/auth/TokenManager';
import { createRequestId, getDeviceId, getDeviceName } from '@api/utils/helpers';
import { config } from '@api/config';

/**
 * Auth Interceptor
 *
 * Attaches the Authorization Bearer token to every outgoing request
 * if a token is available.
 */
export function authInterceptor() {
  return {
    onFulfilled: (requestConfig) => {
      const token = tokenManager.getAccessToken();
      if (token && requestConfig.headers) {
        requestConfig.headers.Authorization = `Bearer ${token}`;
      }
      return requestConfig;
    },
    onRejected: (error) => Promise.reject(error),
  };
}

/**
 * Correlation ID Interceptor
 *
 * Attaches a unique correlation ID to every request for tracing
 * requests through logs and monitoring.
 */
export function correlationIdInterceptor() {
  return {
    onFulfilled: (requestConfig) => {
      const correlationId =
        requestConfig.headers?.['X-Correlation-ID'] || createRequestId();
      if (requestConfig.headers) {
        requestConfig.headers['X-Correlation-ID'] = correlationId;
      }
      return requestConfig;
    },
    onRejected: (error) => Promise.reject(error),
  };
}

/**
 * Device & Platform Interceptor
 *
 * Attaches device and platform identification headers so the backend
 * can adapt responses (e.g., for mobile vs desktop, low-bandwidth).
 */
export function deviceInterceptor() {
  return {
    onFulfilled: (requestConfig) => {
      if (!requestConfig.headers) return requestConfig;

      requestConfig.headers['X-Platform'] = config.app.platform;
      requestConfig.headers['X-App-Version'] = config.app.version;
      requestConfig.headers['X-Device-ID'] = getDeviceId();

      if (config.features.enableDebugLogging) {
        const device = getDeviceName();
        requestConfig.headers['X-Device-Name'] = `${device.browser} on ${device.os}`;
      }

      return requestConfig;
    },
    onRejected: (error) => Promise.reject(error),
  };
}

/**
 * Locale Interceptor
 *
 * Attaches locale and currency preferences to every request.
 * Enables the backend to return localized content and pricing.
 */
export function localeInterceptor() {
  return {
    onFulfilled: (requestConfig) => {
      if (!requestConfig.headers) return requestConfig;

      const locale =
        requestConfig.headers['Accept-Language'] ||
        localStorage.getItem('nf_locale') ||
        config.app.locale;

      const currency =
        requestConfig.headers['X-Currency'] ||
        localStorage.getItem('nf_currency') ||
        config.app.currency;

      requestConfig.headers['Accept-Language'] = locale;
      requestConfig.headers['X-Currency'] = currency;

      return requestConfig;
    },
    onRejected: (error) => Promise.reject(error),
  };
}

/**
 * Timezone Interceptor
 *
 * Sends the user's IANA timezone to the backend for date/time
 * formatting and scheduling.
 */
export function timezoneInterceptor() {
  return {
    onFulfilled: (requestConfig) => {
      if (!requestConfig.headers) return requestConfig;

      try {
        requestConfig.headers['X-Timezone'] =
          Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        // Ignore — timezone is not critical
      }

      return requestConfig;
    },
    onRejected: (error) => Promise.reject(error),
  };
}
