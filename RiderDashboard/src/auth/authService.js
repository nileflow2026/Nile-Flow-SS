// src/auth/authService.js
/**
 * Enterprise-grade authentication service.
 * Centralizes all auth API calls with consistent error handling,
 * audit logging, and security policy enforcement.
 */
import riderAxiosClient from "../api/riderAxiosClient";
import tokenManager from "./TokenManager";
import sessionManager from "./SessionManager";
import securityPolicies from "./SecurityPolicies";
import auditLogger from "./AuditLogger";

/**
 * Generate or retrieve device ID
 */
function getDeviceId() {
  return tokenManager.getDeviceId();
}

/**
 * Register a new rider account.
 */
export async function registerRider(riderData) {
  try {
    const deviceId = getDeviceId();
    const response = await riderAxiosClient.post("/api/rider/auth/register", {
      ...riderData,
      deviceId,
    });

    if (response.data?.success && response.data?.rider) {
      sessionManager.createSession(response.data.rider);
    }

    return { success: true, data: response.data };
  } catch (error) {
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Registration failed";
    auditLogger.log("REGISTRATION_FAILURE", { email: riderData.email }, "warn");
    return {
      success: false,
      error: securityPolicies.sanitizeErrorMessage(message),
    };
  }
}

/**
 * Authenticate a rider with email and password.
 */
export async function loginRider(email, password) {
  try {
    // Check client-side lockout
    if (securityPolicies.isLockedOut(email)) {
      const remaining = securityPolicies.getLockoutTimeRemaining(email);
      auditLogger.loginFailure(email, "client_lockout");
      return {
        success: false,
        error: `Too many login attempts. Please try again in ${Math.ceil(
          remaining / 60,
        )} minutes.`,
        lockedOut: true,
        lockoutRemaining: remaining,
      };
    }

    const deviceId = getDeviceId();
    const response = await riderAxiosClient.post("/api/rider/auth/login", {
      email,
      password,
      deviceId,
    });

    if (response.data?.success && response.data?.rider) {
      securityPolicies.recordLoginAttempt(email, true);
      sessionManager.createSession(response.data.rider);
      auditLogger.loginSuccess(
        response.data.rider.id || response.data.rider.$id,
        email,
      );
    }

    return { success: true, data: response.data };
  } catch (error) {
    securityPolicies.recordLoginAttempt(email, false);
    auditLogger.loginFailure(
      email,
      error.response?.status === 401 ? "invalid_credentials" : "server_error",
    );

    const remaining = securityPolicies.getRemainingAttempts(email);
    const message =
      error.response?.data?.error ||
      error.response?.data?.message ||
      "Login failed";

    return {
      success: false,
      error: securityPolicies.sanitizeErrorMessage(message),
      remainingAttempts: remaining,
      isLockedOut: remaining <= 0,
    };
  }
}

/**
 * Fetch the currently authenticated rider's profile.
 * Used during app initialization and session restoration.
 */
export async function getCurrentRider() {
  try {
    const response = await riderAxiosClient.get("/api/rider/profile", {
      _skipAuthRedirect: true,
    });

    if (response.data?.success && response.data?.rider) {
      sessionManager.restoreSession(response.data.rider);
      return { success: true, data: response.data };
    }

    sessionManager.destroySession("session_expired");
    return { success: false, error: "Not authenticated" };
  } catch (error) {
    if (error.response?.status === 401) {
      auditLogger.sessionExpired(null);
      sessionManager.destroySession("token_expired");
    }
    return { success: false, error: "Failed to load rider data" };
  }
}

/**
 * End the current rider session.
 */
export async function logoutRider() {
  try {
    await riderAxiosClient.post(
      "/api/rider/auth/logout",
      {},
      { _skipAuthRedirect: true },
    );
  } catch {
    // Continue with local cleanup even if server call fails
  }

  sessionManager.destroySession("user_logout");
  return { success: true };
}

/**
 * Refresh the access token (silent refresh).
 */
export async function refreshTokens() {
  const session = sessionManager.getSession();
  if (!session?.riderId) {
    return { success: false, error: "No active session" };
  }

  try {
    await tokenManager.refreshTokens(session.riderId);
    return { success: true };
  } catch {
    sessionManager.destroySession("refresh_failed");
    return { success: false, error: "Session expired" };
  }
}

/**
 * Update rider profile.
 */
export async function updateRiderProfile(profileData) {
  try {
    const response = await riderAxiosClient.patch(
      "/api/rider/profile",
      profileData,
    );
    if (response.data?.success) {
      sessionManager.updateSession(profileData);
    }
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || "Failed to update profile",
    };
  }
}

/**
 * Update rider online/offline/busy status.
 */
export async function updateRiderStatus(status) {
  try {
    const response = await riderAxiosClient.patch("/api/rider/status", {
      status,
    });
    if (response.data?.success) {
      sessionManager.updateSession({ status: response.data.status || status });
      auditLogger.riderStatusChanged(
        sessionManager.getSession()?.riderId,
        null,
        status,
      );
    }
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || "Failed to update status",
    };
  }
}

/**
 * Fetch rider deliveries.
 */
export async function getRiderDeliveries(filters = {}) {
  try {
    const params = new URLSearchParams(filters);
    const response = await riderAxiosClient.get(
      `/api/rider/deliveries?${params}`,
    );
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || "Failed to fetch deliveries",
    };
  }
}

/**
 * Fetch rider earnings.
 */
export async function getRiderEarnings(startDate, endDate) {
  try {
    const params = new URLSearchParams();
    if (startDate) params.append("startDate", startDate);
    if (endDate) params.append("endDate", endDate);
    const response = await riderAxiosClient.get(
      `/api/rider/earnings?${params}`,
    );
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || "Failed to fetch earnings",
    };
  }
}

/**
 * Update delivery status.
 */
export async function updateDeliveryStatus(deliveryId, status, notes) {
  try {
    const response = await riderAxiosClient.patch(
      `/api/rider/deliveries/${deliveryId}/status`,
      { status, notes },
    );
    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data?.error || "Failed to update delivery status",
    };
  }
}
