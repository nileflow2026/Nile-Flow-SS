/**
 * Nile Flow API Client
 *
 * Single axios instance for all backend communication.
 * - Cookie-based auth (httpOnly refresh token)
 * - Automatic 401 refresh via response interceptor
 * - No commented code, no console.log, no duplicate instances
 */

import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";

const API_BASE_URL =
  (typeof process !== "undefined" &&
    (process.env as Record<string, string>)?.VITE_API_URL) ||
  "https://nile-flow-backend.onrender.com";

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, success = false): void {
  for (const prom of failedQueue) {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(success);
    }
  }
  failedQueue = [];
}

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  timeout: 30000,
  withCredentials: true,
});

// Attach Bearer token from storage if present
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token =
    localStorage.getItem("accessToken") ||
    sessionStorage.getItem("accessToken");
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 → refresh, and 502/503/504 → retry with backoff
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
      _retryCount?: number;
    };
    const status = error.response?.status;

    // Server cold-start / temporary outage — retry up to 3 times
    if (status === 502 || status === 503 || status === 504) {
      originalRequest._retryCount = (originalRequest._retryCount ?? 0) + 1;
      if (originalRequest._retryCount <= 3) {
        const delay = Math.pow(2, originalRequest._retryCount - 1) * 1000;
        await new Promise((r) => setTimeout(r, delay));
        return api(originalRequest);
      }
      return Promise.reject(error);
    }

    // 401 — attempt token refresh
    if (status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then(() => api(originalRequest));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const deviceId = sessionStorage.getItem("customerDeviceId");
      await axios.post(
        `${API_BASE_URL}/api/customerauth/refresh`,
        { deviceId },
        { withCredentials: true, headers: { "Content-Type": "application/json" } }
      );
      processQueue(null, true);
      isRefreshing = false;
      return api(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, false);
      isRefreshing = false;
      window.dispatchEvent(new CustomEvent("auth:logout"));
      return Promise.reject(refreshError);
    }
  }
);

export default api;
