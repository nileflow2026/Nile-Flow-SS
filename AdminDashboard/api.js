/* eslint-disable no-unused-vars */

import axios from "axios";

// Use Vite env `VITE_API_BASE_URL` when available (local testing), fallback to localhost
const API_BASE_URL = "https://nile-flow-backend-5dqm.onrender.com";

const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true, // Important: send cookies with requests
});

// Track if refresh is in progress to avoid multiple simultaneous refresh attempts
let isRefreshing = false;
let failedQueue = [];
let hasSession = false;
let authInitialized = false;
let lastRefreshAttemptAt = 0;
const REFRESH_COOLDOWN_MS = 5000;

export const markSessionActive = () => {
  authInitialized = true;
  hasSession = true;
  lastRefreshAttemptAt = 0;
};

export const markSessionInactive = () => {
  hasSession = false;
  authInitialized = true;
  isRefreshing = false;
  failedQueue = [];
  lastRefreshAttemptAt = 0;
};

export const markAuthInitializationComplete = () => {
  authInitialized = true;
};

const processQueue = (error, success = false) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(success);
    }
  });
  failedQueue = [];
};

// Response interceptor - handle token refresh on 401
axiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Ignore non-auth failures or requests already retried.
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Prevent refresh attempts before the initial auth check has completed.
    if (!authInitialized || !hasSession) {
      return Promise.reject(error);
    }

    // Prevent refresh storms for repeated failures in a short window.
    const now = Date.now();
    if (isRefreshing || now - lastRefreshAttemptAt < REFRESH_COOLDOWN_MS) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => axiosClient(originalRequest))
          .catch((err) => Promise.reject(err));
      }
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => axiosClient(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;
    lastRefreshAttemptAt = Date.now();

    try {
      // Refresh token is sent via httpOnly cookie automatically
      await axios.post(
        `${axiosClient.defaults.baseURL}/api/admin/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      markSessionActive();

      // Process queued requests
      processQueue(null, true);

      // Retry original request
      return axiosClient(originalRequest);
    } catch (refreshError) {
      markSessionInactive();
      processQueue(refreshError, false);

      // Trigger logout event once to avoid repeated navigation loops
      try {
        if (!window.__nileflow_logout_dispatched) {
          window.__nileflow_logout_dispatched = true;
          window.dispatchEvent(new CustomEvent("auth:logout"));
        }
      } catch (e) {
        // swallow errors from env/readonly window
        void e;
      }

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);

export default axiosClient;
