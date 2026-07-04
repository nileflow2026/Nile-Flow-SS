/**
 * Error Normalizer
 *
 * Normalizes all API errors into a predictable structure.
 * Components never need to parse raw axios errors or HTTP status codes.
 */

import { config } from '@api/config';

/**
 * Map HTTP status codes to domain error codes.
 */
const STATUS_CODE_MAP = {
  400: 'VALIDATION_ERROR',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'RATE_LIMITED',
  500: 'INTERNAL_SERVER_ERROR',
  502: 'BAD_GATEWAY',
  503: 'SERVICE_UNAVAILABLE',
  504: 'GATEWAY_TIMEOUT',
};

/**
 * User-friendly fallback messages per status.
 */
const FALLBACK_MESSAGES = {
  400: 'The request was invalid. Please check your input.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested resource was not found.',
  409: 'A conflict occurred. The resource may have been modified.',
  422: 'Unable to process the request. Please check your input.',
  429: 'Too many requests. Please try again shortly.',
  500: 'An unexpected server error occurred. Please try again.',
  502: 'The server is temporarily unavailable. Please try again.',
  503: 'Service is temporarily unavailable. Please try again.',
  504: 'The server took too long to respond. Please try again.',
};

/**
 * Extract field-level validation errors from the response.
 * Backends may return them in different shapes.
 */
function extractDetails(error) {
  const responseData = error?.response?.data;

  // Array of field errors
  if (Array.isArray(responseData?.errors)) {
    return responseData.errors.map((err) => ({
      field: err.field || err.path || err.param || null,
      message: err.message || err.msg || 'Invalid value',
    }));
  }

  // Object map of field → message[]
  if (responseData?.errors && typeof responseData.errors === 'object') {
    return Object.entries(responseData.errors).flatMap(([field, messages]) => {
      const msgs = Array.isArray(messages) ? messages : [messages];
      return msgs.map((m) => ({ field, message: m }));
    });
  }

  // Single error string
  if (typeof responseData?.error === 'string') {
    return [{ field: null, message: responseData.error }];
  }

  if (typeof responseData?.message === 'string') {
    return [{ field: null, message: responseData.message }];
  }

  return [];
}

/**
 * Extract the primary error message from a failed request.
 */
function extractMessage(error) {
  const responseData = error?.response?.data;
  const status = error?.response?.status;

  // Prefer explicit error messages from the backend
  if (typeof responseData?.error === 'string') return responseData.error;
  if (typeof responseData?.message === 'string') return responseData.message;

  // Network-level errors
  if (error.code === 'ECONNABORTED') return 'Request timed out. Please try again.';
  if (error.code === 'ERR_NETWORK') return 'Network error. Please check your connection.';
  if (!error.response) return 'Unable to reach the server. Please check your connection.';

  // Fallback by status
  return FALLBACK_MESSAGES[status] || 'An unexpected error occurred.';
}

/**
 * Normalize any error from an API call into a structured ApiError.
 *
 * @param {Error|*} error - The original error (axios error, network error, etc.)
 * @returns {import('@api/types').ApiError}
 */
export function normalizeError(error) {
  // Already normalized
  if (error && error.code && error.message && error._normalized) {
    return error;
  }

  const status = error?.response?.status || 0;
  const code = STATUS_CODE_MAP[status] || 'UNKNOWN_ERROR';

  const normalized = {
    _normalized: true,
    code,
    message: extractMessage(error),
    status,
    details: extractDetails(error),
    originalError: config.features.enableDebugLogging ? error : undefined,
  };

  return normalized;
}

/**
 * Create a normalized error manually (for non-API errors like offline).
 *
 * @param {string} code
 * @param {string} message
 * @param {Object} [options]
 * @returns {import('@api/types').ApiError}
 */
export function createError(code, message, options = {}) {
  return {
    _normalized: true,
    code,
    message,
    status: options.status || 0,
    details: options.details || [],
  };
}

/**
 * Check if an error is a rate-limit response.
 * @param {import('@api/types').ApiError} error
 * @returns {boolean}
 */
export function isRateLimited(error) {
  return error?.code === 'RATE_LIMITED';
}

/**
 * Check if an error is a network/connectivity error.
 * @param {import('@api/types').ApiError} error
 * @returns {boolean}
 */
export function isNetworkError(error) {
  return (
    error?.code === 'UNKNOWN_ERROR' &&
    (error?.status === 0 ||
      error?.originalError?.code === 'ERR_NETWORK' ||
      error?.originalError?.code === 'ECONNABORTED')
  );
}

/**
 * Check if an error is authentication-related.
 * @param {import('@api/types').ApiError} error
 * @returns {boolean}
 */
export function isAuthError(error) {
  return ['UNAUTHORIZED', 'FORBIDDEN'].includes(error?.code);
}

/**
 * Check if an error should trigger a retry.
 * @param {import('@api/types').ApiError} error
 * @returns {boolean}
 */
export function isRetryable(error) {
  const retryableStatuses = [408, 429, 500, 502, 503, 504];
  return retryableStatuses.includes(error?.status);
}

export default normalizeError;
