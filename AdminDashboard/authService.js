import axiosClient from "./api";

let currentUserRequest = null;
let currentUserCache = null;
let currentUserCacheTime = 0;
const CURRENT_USER_CACHE_TTL_MS = 10000;

const clearCurrentUserCache = () => {
  currentUserRequest = null;
  currentUserCache = null;
  currentUserCacheTime = 0;
};

/**
 * Get device name (browser + OS info)
 */
const getDeviceName = () => {
  const ua = navigator.userAgent;
  let browser = "Unknown";
  let os = "Unknown";

  // Browser detection
  if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Chrome")) browser = "Chrome";
  else if (ua.includes("Safari")) browser = "Safari";
  else if (ua.includes("Edge")) browser = "Edge";

  // OS detection
  if (ua.includes("Windows")) os = "Windows";
  else if (ua.includes("Mac")) os = "macOS";
  else if (ua.includes("Linux")) os = "Linux";
  else if (ua.includes("Android")) os = "Android";
  else if (ua.includes("iOS")) os = "iOS";

  return `${browser} on ${os}`;
};

/**
 * Signup - Create new admin account
 * Tokens are set as httpOnly cookies by backend
 */
export const signupAdmin = async (email, password, username, deviceId) => {
  try {
    const deviceName = getDeviceName();

    const response = await axiosClient.post("/api/admin/auth/signup/admin", {
      email,
      password,
      username,
      deviceId,
      deviceName,
    });

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || "Signup failed. Please try again.",
    };
  }
};

/**
 * Signin - Authenticate user
 * Tokens are set as httpOnly cookies by backend
 */
export const signinAdmin = async (email, password, deviceId) => {
  try {
    const response = await axiosClient.post("/api/admin/auth/signin/admin", {
      email,
      password,
      deviceId,
    });

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || "Signin failed. Please try again.",
    };
  }
};

/**
 * Refresh tokens - Get new access token
 * Tokens are automatically sent via httpOnly cookies
 */
export const refreshTokens = async () => {
  try {
    const response = await axiosClient.post("/api/admin/auth/refresh", {});
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || "Token refresh failed.",
    };
  }
};

/**
 * Logout - Revoke refresh token
 * Backend will clear httpOnly cookies
 */
export const signoutAdmin = async () => {
  try {
    await axiosClient.post("/auth/logout", {});
    clearCurrentUserCache();
    return { success: true };
  } catch (error) {
    clearCurrentUserCache();
    return {
      success: false,
      error: error.response?.data?.error || "Logout failed.",
    };
  }
};

/**
 * Get current user from backend
 * Validates session via cookies
 */
export const getCurrentUser = async () => {
  const now = Date.now();

  if (currentUserCache && now - currentUserCacheTime < CURRENT_USER_CACHE_TTL_MS) {
    return currentUserCache;
  }

  if (currentUserRequest) {
    return currentUserRequest;
  }

  currentUserRequest = (async () => {
    try {
      const response = await axiosClient.get("/api/admin/auth/getcurrentuser");
      const result = { success: true, data: response.data };
      currentUserCache = result;
      currentUserCacheTime = Date.now();
      return result;
    } catch (error) {
      const result = {
        success: false,
        error: error.response?.data?.error || "Failed to get user data.",
      };
      clearCurrentUserCache();
      return result;
    } finally {
      currentUserRequest = null;
    }
  })();

  return currentUserRequest;
};

export default {
  signupAdmin,
  signinAdmin,
  refreshTokens,
  signoutAdmin,
  getCurrentUser,
};
