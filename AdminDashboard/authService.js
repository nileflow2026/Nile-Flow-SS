import axiosClient, {
  markAuthInitializationComplete,
  markSessionActive,
  markSessionInactive,
} from "./api";

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

    markSessionActive();
    return { success: true, data: response.data };
  } catch (error) {
    markSessionInactive();
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
    markSessionActive();
    return { success: true, data: response.data };
  } catch (error) {
    markSessionInactive();
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
    markSessionInactive();
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
      markSessionActive();
      markAuthInitializationComplete();
      const result = { success: true, data: response.data };
      currentUserCache = result;
      currentUserCacheTime = Date.now();
      return result;
    } catch (error) {
      markSessionInactive();
      markAuthInitializationComplete();
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
  signinAdmin,
  refreshTokens,
  signoutAdmin,
  getCurrentUser,
};
