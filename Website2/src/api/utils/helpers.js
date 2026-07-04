/**
 * API Utility Helpers
 *
 * Shared utilities for the API integration layer.
 * Single-responsibility functions, no God objects.
 */

import { config } from '@api/config';

/**
 * Generate a unique request ID for tracing and deduplication.
 * @returns {string}
 */
export function createRequestId() {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Generate or retrieve a persistent device ID for this browser session.
 * Stored in sessionStorage for tab consistency.
 * @returns {string}
 */
export function getDeviceId() {
  const key = config.auth.deviceIdStorageKey;
  try {
    let deviceId = sessionStorage.getItem(key);
    if (!deviceId) {
      deviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
      sessionStorage.setItem(key, deviceId);
    }
    return deviceId;
  } catch {
    return `fallback-${Date.now()}`;
  }
}

/**
 * Detect browser and OS for device fingerprinting.
 * @returns {{ browser: string, os: string }}
 */
export function getDeviceName() {
  const ua = navigator.userAgent;
  let browser = 'Unknown';
  let os = 'Unknown';

  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';
  else if (ua.includes('Edge')) browser = 'Edge';

  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iOS')) os = 'iOS';

  return { browser, os };
}

/**
 * Build a query string from an object, filtering out undefined/null values.
 * @param {Object} params
 * @returns {string}
 */
export function buildQueryString(params) {
  if (!params || Object.keys(params).length === 0) return '';

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const qs = searchParams.toString();
  return qs ? `?${qs}` : '';
}

/**
 * Build a full API URL from a path and optional params.
 * @param {string} path
 * @param {Object} [params]
 * @returns {string}
 */
export function buildUrl(path, params = {}) {
  const base = config.api.baseURL.replace(/\/+$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const qs = buildQueryString(params);
  return `${base}${cleanPath}${qs}`;
}

/**
 * Sleep for a given duration.
 * @param {number} ms
 * @returns {Promise<void>}
 */
export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Retry an async function with exponential backoff.
 *
 * @param {Function} fn - Async function to retry
 * @param {Object} [options]
 * @param {number} [options.maxRetries=3]
 * @param {number} [options.baseDelay=1000]
 * @param {Function} [options.shouldRetry] - Predicate(error) => boolean
 * @returns {Promise<*>}
 */
export async function retry(fn, options = {}) {
  const { maxRetries = 3, baseDelay = 1000, shouldRetry = () => true } = options;
  let lastError;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn(attempt);
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries && shouldRetry(error)) {
        const delay = baseDelay * Math.pow(2, attempt);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }

  throw lastError;
}

/**
 * Parse a paginated API response into standard shape.
 *
 * @param {Object} response - Raw API response
 * @param {import('@api/types').PaginatedResponse}
 */
export function parsePaginatedResponse(response) {
  const data = response?.data || response || {};
  const items = data.data || data.documents || data.products || data.orders || data.results || data.items || [];

  return {
    success: true,
    data: Array.isArray(items) ? items : [],
    meta: {
      total: data.total || 0,
      page: data.page || 1,
      limit: data.limit || config.pagination.defaultPageSize,
      totalPages: data.totalPages || 0,
      hasNextPage: data.hasNextPage || !!data.nextCursor,
      hasPrevPage: data.hasPrevPage || false,
    },
    nextCursor: data.nextCursor || null,
  };
}

/**
 * Get the current timestamp in ISO format.
 * @returns {string}
 */
export function now() {
  return new Date().toISOString();
}

/**
 * Detect if the current environment is development.
 * @returns {boolean}
 */
export function isDevelopment() {
  try {
    return import.meta.env.MODE === 'development' || import.meta.env.DEV === true;
  } catch {
    return false;
  }
}

/**
 * Log a message only in development mode, with an optional prefix.
 * @param {string} message
 * @param {*} [data]
 */
export function devLog(message, data) {
  if (isDevelopment() || config.features.enableDebugLogging) {
    if (data !== undefined) {
      console.log(`[API] ${message}`, data);
    } else {
      console.log(`[API] ${message}`);
    }
  }
}
