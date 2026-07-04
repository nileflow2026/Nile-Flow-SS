/**
 * Response Interceptors
 *
 * Modular response interceptors for the HttpClient pipeline.
 * Each interceptor handles one cross-cutting concern.
 */

import { tokenManager } from '@api/auth/TokenManager';
import { httpClient } from '@api/client/HttpClient';
import { config } from '@api/config';
import { normalizeError } from '@api/utils/errorNormalizer';
import { devLog, getDeviceId } from '@api/utils/helpers';

// ── Token Refresh Queue ──────────────────────────────────────────
// Deduplicates concurrent 401-driven refresh attempts.
let isRefreshing = false;
let failedQueue = [];

function processQueue(error, success = false) {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(success);
    }
  });
  failedQueue = [];
}

/**
 * Token Refresh Interceptor
 *
 * Catches 401 responses and attempts a silent token refresh.
 * Queues concurrent requests so they all wait for the single refresh.
 * On refresh failure, dispatches a logout event.
 */
export function tokenRefreshInterceptor() {
  return {
    onFulfilled: (response) => response,
    onRejected: async (error) => {
      const originalRequest = error.config;
      const status = error.response?.status;

      // Only handle 401
      if (status !== 401 || originalRequest?._retry) {
        return Promise.reject(error);
      }

      // If a refresh is already in progress, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => httpClient.getAxiosInstance().request(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt silent refresh
        const deviceId = getDeviceId();
        const refreshResponse = await httpClient.post(
          config.auth.tokenRefreshEndpoint,
          { deviceId },
          { _retryCount: 0 }, // Don't retry the refresh itself
        );

        // If the backend returns new tokens, store them
        if (refreshResponse?.data?.accessToken) {
          tokenManager.setAccessToken(refreshResponse.data.accessToken);
        }
        if (refreshResponse?.data?.refreshToken) {
          tokenManager.setRefreshToken(refreshResponse.data.refreshToken);
        }

        // Process queued requests
        processQueue(null, true);
        isRefreshing = false;

        // Retry the original request
        return httpClient.getAxiosInstance().request(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, false);

        // Clear tokens
        tokenManager.clearTokens();

        // Dispatch logout event (only once)
        if (!window.__nf_auth_logout_triggered) {
          window.__nf_auth_logout_triggered = true;
          window.dispatchEvent(new CustomEvent('auth:logout'));
          setTimeout(() => {
            window.__nf_auth_logout_triggered = false;
          }, 1000);
        }

        return Promise.reject(refreshError);
      }
    },
  };
}

/**
 * Maintenance Mode Interceptor
 *
 * Checks if the backend is in maintenance mode (503 with specific header)
 * and dispatches an event for the app to handle gracefully.
 */
export function maintenanceModeInterceptor() {
  return {
    onFulfilled: (response) => {
      if (response.headers?.['X-Maintenance-Mode'] === 'true') {
        window.dispatchEvent(
          new CustomEvent('backend:maintenance', {
            detail: { message: response.data?.message || 'Under maintenance' },
          }),
        );
      }
      return response;
    },
    onRejected: (error) => {
      if (error.response?.headers?.['X-Maintenance-Mode'] === 'true') {
        window.dispatchEvent(
          new CustomEvent('backend:maintenance', {
            detail: {
              message: error.response.data?.message || 'Under maintenance',
            },
          }),
        );
      }
      return Promise.reject(error);
    },
  };
}

/**
 * Logging Interceptor
 *
 * Logs API request timing and errors in development mode.
 * Useful for debugging and performance monitoring.
 */
export function loggingInterceptor() {
  const startTimes = new Map();

  return {
    onFulfilled: (response) => {
      if (config.features.enableDebugLogging) {
        const key = response.config?.url || '';
        const startTime = startTimes.get(key);
        const duration = startTime ? Date.now() - startTime : '?';
        devLog(`Response: ${response.status} ${response.config?.url} (${duration}ms)`);
        startTimes.delete(key);
      }
      return response;
    },
    onRejected: (error) => {
      if (config.features.enableDebugLogging) {
        const key = error.config?.url || '';
        const startTime = startTimes.get(key);
        const duration = startTime ? Date.now() - startTime : '?';
        devLog(
          `Error: ${error.response?.status || 'NETWORK'} ${error.config?.url} (${duration}ms)`,
          normalizeError(error),
        );
        startTimes.delete(key);
      }
      return Promise.reject(error);
    },
  };
}

/**
 * Normalize the raw axios response into a predictable shape.
 */
export function responseNormalizerInterceptor() {
  return {
    onFulfilled: (response) => response,
    onRejected: (error) => error,
  };
}
