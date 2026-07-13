/* eslint-disable no-unused-vars */
// src/rider/api/riderAxiosClient.js
import axios from "axios";
import tokenManager from "../auth/TokenManager";
import auditLogger from "../auth/AuditLogger";

const API_BASE_URL = "https://nile-flow-backend-5dqm.onrender.com";

const riderAxiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000,
  withCredentials: true,
});

/**
 * Response interceptor — handles 401 errors with silent token refresh.
 * Uses TokenManager to coordinate refresh across concurrent requests.
 * Prevents duplicate refresh storms and unnecessary auth API calls.
 */
riderAxiosClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip retry on auth endpoints or if _skipAuthRefresh flag is set
    const isAuthEndpoint =
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/register") ||
      originalRequest.url?.includes("/auth/refresh");

    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      isAuthEndpoint ||
      originalRequest._skipAuthRefresh
    ) {
      return Promise.reject(error);
    }

    // Skip refresh if on public routes
    const publicRoutes = ["/rider/login", "/rider/register"];
    const isPublicRoute = publicRoutes.some((route) =>
      window.location.pathname.startsWith(route),
    );

    if (isPublicRoute) {
      return Promise.reject(error);
    }

    // If another request is already refreshing, queue this one
    if (tokenManager.isRefreshing || tokenManager.isOtherTabRefreshing()) {
      return new Promise((resolve, reject) => {
        tokenManager.enqueueRequest(resolve, reject);
      })
        .then(() => riderAxiosClient(originalRequest))
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;

    try {
      const deviceId = tokenManager.getDeviceId();

      await axios.post(
        `${API_BASE_URL}/api/rider/auth/refresh`,
        { deviceId },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" },
        },
      );

      tokenManager.touchActivity();
      return riderAxiosClient(originalRequest);
    } catch (refreshError) {
      // Only trigger logout if not on public route and not already logout
      if (!isPublicRoute && !window.__rider_auth_logout_triggered) {
        window.__rider_auth_logout_triggered = true;
        window.dispatchEvent(new CustomEvent("rider:logout"));

        setTimeout(() => {
          window.__rider_auth_logout_triggered = false;
        }, 1000);
      }

      return Promise.reject(refreshError);
    }
  },
);

export default riderAxiosClient;
