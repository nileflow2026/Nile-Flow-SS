/**
 * HttpClient
 *
 * The single HTTP client used by every service in the integration layer.
 * Supports GET, POST, PUT, PATCH, DELETE, file upload, and streaming.
 *
 * Features:
 * - Centralized base URL, headers, timeout from config
 * - Pluggable interceptor pipeline (request & response)
 * - Built-in retry with exponential backoff
 * - File upload with progress
 * - Request deduplication for concurrent identical requests
 * - Structured error normalization
 * - Offline detection
 */

import axios from 'axios';
import { config } from '@api/config';
import { normalizeError, isRetryable } from '@api/utils/errorNormalizer';
import { createRequestId } from '@api/utils/helpers';

class HttpClient {
  constructor() {
    this.instance = null;
    this._requestInterceptors = [];
    this._responseInterceptors = [];
    this._pendingRequests = new Map();
    this._pendingUploads = new Map();
    this._isOffline = !navigator.onLine;
    this._initialized = false;

    // Track online/offline status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this._isOffline = false;
        this._retryFailedQueue();
      });
      window.addEventListener('offline', () => {
        this._isOffline = true;
      });
    }
  }

  /**
   * Initialize the Axios instance with base config.
   * Called once on app startup. Registers interceptors.
   */
  initialize() {
    if (this._initialized) return this;
    this._initialized = true;

    this.instance = axios.create({
      baseURL: config.api.baseURL,
      timeout: config.api.timeout,
      withCredentials: config.api.withCredentials,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });

    // Register all queued interceptors
    this._requestInterceptors.forEach(({ onFulfilled, onRejected }) => {
      this.instance.interceptors.request.use(onFulfilled, onRejected);
    });

    this._responseInterceptors.forEach(({ onFulfilled, onRejected }) => {
      this.instance.interceptors.response.use(onFulfilled, onRejected);
    });

    return this;
  }

  /**
   * Register a request interceptor.
   * Interceptors run in the order they are registered.
   *
   * @param {Function} onFulfilled
   * @param {Function} [onRejected]
   */
  addRequestInterceptor(onFulfilled, onRejected) {
    const handler = { onFulfilled, onRejected };
    if (this.instance) {
      this.instance.interceptors.request.use(onFulfilled, onRejected);
    }
    this._requestInterceptors.push(handler);
  }

  /**
   * Register a response interceptor.
   *
   * @param {Function} onFulfilled
   * @param {Function} [onRejected]
   */
  addResponseInterceptor(onFulfilled, onRejected) {
    const handler = { onFulfilled, onRejected };
    if (this.instance) {
      this.instance.interceptors.response.use(onFulfilled, onRejected);
    }
    this._responseInterceptors.push(handler);
  }

  // ── HTTP Methods ────────────────────────────────────────────────

  /**
   * Perform a GET request.
   *
   * @param {string} url
   * @param {Object} [params] - Query parameters
   * @param {Object} [options] - Axios request config overrides
   * @returns {Promise<import('@api/types').ApiResponse>}
   */
  async get(url, params = {}, options = {}) {
    return this._request('GET', url, { params, ...options });
  }

  /**
   * Perform a POST request.
   *
   * @param {string} url
   * @param {Object} [data] - Request body
   * @param {Object} [options] - Axios request config overrides
   * @returns {Promise<import('@api/types').ApiResponse>}
   */
  async post(url, data = {}, options = {}) {
    return this._request('POST', url, { data, ...options });
  }

  /**
   * Perform a PUT request.
   *
   * @param {string} url
   * @param {Object} [data] - Request body
   * @param {Object} [options]
   * @returns {Promise<import('@api/types').ApiResponse>}
   */
  async put(url, data = {}, options = {}) {
    return this._request('PUT', url, { data, ...options });
  }

  /**
   * Perform a PATCH request.
   *
   * @param {string} url
   * @param {Object} [data] - Request body
   * @param {Object} [options]
   * @returns {Promise<import('@api/types').ApiResponse>}
   */
  async patch(url, data = {}, options = {}) {
    return this._request('PATCH', url, { data, ...options });
  }

  /**
   * Perform a DELETE request.
   *
   * @param {string} url
   * @param {Object} [options]
   * @returns {Promise<import('@api/types').ApiResponse>}
   */
  async delete(url, options = {}) {
    return this._request('DELETE', url, options);
  }

  // ── Specialized Methods ─────────────────────────────────────────

  /**
   * Upload one or more files with progress tracking.
   *
   * @param {string} url
   * @param {FormData} formData
   * @param {Function} [onProgress] - Callback(percentComplete: number)
   * @param {Object} [options]
   * @returns {Promise<import('@api/types').ApiResponse>}
   */
  async upload(url, formData, onProgress, options = {}) {
    const uploadId = createRequestId();

    return this._request('POST', url, {
      data: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
        ...options.headers,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          onProgress(percent);
        }
      },
      _uploadId: uploadId,
      ...options,
    });
  }

  /**
   * Download a file as a Blob.
   *
   * @param {string} url
   * @param {Object} [params]
   * @param {Object} [options]
   * @returns {Promise<Blob>}
   */
  async download(url, params = {}, options = {}) {
    const response = await this._request('GET', url, {
      params,
      responseType: 'blob',
      ...options,
    });

    return response.data;
  }

  // ── Internal ────────────────────────────────────────────────────

  /**
   * Core request method with retry logic and error normalization.
   */
  async _request(method, url, options = {}) {
    // Ensure initialized
    if (!this.instance) {
      this.initialize();
    }

    // Deduplication key: use _dedupKey or generate one
    const dedupKey = options._dedupKey || `${method}:${url}:${JSON.stringify(options.params || {})}`;

    // Check for in-flight identical request (GET only)
    if (method === 'GET' && this._pendingRequests.has(dedupKey)) {
      return this._pendingRequests.get(dedupKey);
    }

    // Offline guard
    if (this._isOffline && method !== 'GET') {
      const { createError } = await import('@api/utils/errorNormalizer');
      return Promise.reject(
        createError('OFFLINE', 'You are offline. Please check your connection.'),
      );
    }

    // Retry config
    const maxRetries = options._retryCount ?? config.api.retryCount;
    const retryDelay = options._retryDelay ?? config.api.retryDelay;
    let lastError = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const requestConfig = {
          method,
          url,
          ...options,
          headers: {
            ...this.instance.defaults.headers.common,
            ...options.headers,
          },
        };

        // Clean up internal keys
        delete requestConfig._dedupKey;
        delete requestConfig._retryCount;
        delete requestConfig._retryDelay;
        delete requestConfig._uploadId;
        delete requestConfig.skipAuth;

        const request = this.instance.request(requestConfig);

        // Track for deduplication
        if (method === 'GET') {
          this._pendingRequests.set(dedupKey, request);
        }

        const response = await request;

        // Normalize success response
        const normalized = this._normalizeSuccess(response);

        return normalized;
      } catch (error) {
        lastError = normalizeError(error);

        // Don't retry if unauthorized (refresh interceptor handles it)
        if (lastError.code === 'UNAUTHORIZED') {
          break;
        }

        // Don't retry client errors (4xx except retryable)
        if (lastError.status >= 400 && lastError.status < 500 && !isRetryable(lastError)) {
          break;
        }

        // Don't retry if offline
        if (this._isOffline) {
          break;
        }

        // Retry with exponential backoff
        if (attempt < maxRetries && isRetryable(lastError)) {
          const delay = retryDelay * Math.pow(2, attempt);
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        break;
      }
    }

    // Clean up dedup
    this._pendingRequests.delete(dedupKey);

    // Reject with normalized error
    return Promise.reject(lastError);
  }

  /**
   * Normalize a successful axios response into ApiResponse shape.
   */
  _normalizeSuccess(response) {
    const responseData = response.data;

    // Backend already returns structured { success, data, message }
    if (responseData && typeof responseData === 'object' && 'success' in responseData) {
      return {
        success: responseData.success,
        data: responseData.data || responseData.result || responseData,
        message: responseData.message || '',
        status: response.status,
        meta: responseData.meta || responseData.pagination || null,
      };
    }

    // Generic success — wrap in standard shape
    return {
      success: true,
      data: responseData,
      message: '',
      status: response.status,
      meta: null,
    };
  }

  /**
   * Get the base Axios instance (for direct access if needed).
   * Prefer using the HTTP methods above.
   */
  getAxiosInstance() {
    if (!this.instance) this.initialize();
    return this.instance;
  }

  /**
   * Update the base URL at runtime (e.g., for environment switching).
   * @param {string} baseURL
   */
  setBaseURL(baseURL) {
    if (this.instance) {
      this.instance.defaults.baseURL = baseURL;
    }
  }

  /**
   * Get current online status.
   * @returns {boolean}
   */
  isOnline() {
    return !this._isOffline;
  }
}

// Singleton — one HttpClient for the entire application
export const httpClient = new HttpClient();
export default httpClient;
