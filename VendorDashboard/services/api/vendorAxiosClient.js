// src/vendor/api/vendorAxiosClient.js
import axios from "axios";

// Read base URL from Vite env `VITE_API_BASE_URL` for local testing, fallback to localhost
const API_BASE_URL = "https://nile-flow-backend-5dqm.onrender.com";

const vendorAxiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
  withCredentials: true, // CRITICAL: Send cookies with requests
});

// Track if refresh is in progress
let isRefreshing = false;
let failedQueue = [];

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


// Response interceptor - FIXED VERSION
vendorAxiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only handle 401 errors for specific endpoints
    // Matches both /api/vendor/ (auth routes) and /api/vendors/ (data routes)
    const isVendorRoute =
      originalRequest.url?.includes("/api/vendor/") ||
      originalRequest.url?.includes("/api/vendors/");
    const isAuthRoute =
      originalRequest.url?.includes("/api/vendor/auth/refresh") ||
      originalRequest.url?.includes("/api/vendor/auth/login") ||
      originalRequest.url?.includes("/api/vendor/auth/register");
    const shouldHandleRefresh =
      error.response?.status === 401 &&
      isVendorRoute &&
      !isAuthRoute &&
      !originalRequest._skipAuthRetry;

    if (!shouldHandleRefresh || originalRequest._retry) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then(() => vendorAxiosClient(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      console.log("[Vendor Axios] Attempting token refresh...");

      const response = await axios.post(
        `${API_BASE_URL}/api/vendor/auth/refresh`,
        {},
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      console.log("[Vendor Axios] Token refreshed successfully");
      isRefreshing = false;
      processQueue(null, response.data.token);

      return vendorAxiosClient(originalRequest);
    } catch (refreshError) {
      isRefreshing = false;
      processQueue(refreshError, null);

      console.log(
        "[Vendor Axios] Refresh token failed (likely no session):",
        refreshError.response?.status,
      );

      // IMPORTANT: Only dispatch logout for specific errors
      // If refresh returns 401, it means no valid session - this is normal for non-logged users
      if (refreshError.response?.status === 401) {
        console.log(
          "[Vendor Axios] No valid session - continuing without logout",
        );
        // Don't trigger logout - just reject the original request
        return Promise.reject(error);
      }

      // Only trigger logout for server errors (500, network errors, etc.)
      if (refreshError.response?.status >= 500 || !refreshError.response) {
        console.error("[Vendor Axios] Server error during refresh");
        if (!window.__vendor_auth_logout_triggered) {
          window.__vendor_auth_logout_triggered = true;
          window.dispatchEvent(new CustomEvent("vendor:logout"));
          setTimeout(() => {
            window.__vendor_auth_logout_triggered = false;
          }, 1000);
        }
      }

      return Promise.reject(refreshError);
    }
  },
);

export default vendorAxiosClient;
