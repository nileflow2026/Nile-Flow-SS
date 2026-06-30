/**
 * Nile Flow Authentication Service
 *
 * Single source of truth for all auth operations.
 * - No commented-out code
 * - No console.log
 * - Clean error responses
 */

import api from "./api";

function getDeviceId(): string {
  let deviceId = sessionStorage.getItem("customerDeviceId");
  if (!deviceId) {
    deviceId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem("customerDeviceId", deviceId);
  }
  return deviceId;
}

function clearStorage(): void {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("isGuest");
  localStorage.removeItem("userData");
  localStorage.removeItem("userAvatarUrl");
  sessionStorage.removeItem("customerDeviceId");
}

export interface AuthResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export async function signUp(
  email: string,
  password: string,
  username: string,
  phone?: string
): Promise<AuthResponse> {
  try {
    const deviceId = getDeviceId();
    const { data } = await api.post("/api/customerauth/signup/customer", {
      email,
      password,
      username,
      phone,
      deviceId,
    });
    return { success: true, data };
  } catch (err: unknown) {
    const message =
      (err as { response?: { data?: { error?: string } } })?.response?.data
        ?.error || "Signup failed. Please try again.";
    return { success: false, error: message };
  }
}

export async function signIn(
  email: string,
  password: string,
  rememberMe = false
): Promise<AuthResponse> {
  try {
    const deviceId = getDeviceId();
    const { data } = await api.post("/api/customerauth/signin/customer", {
      email,
      password,
      deviceId,
    });
    const storage = rememberMe ? localStorage : sessionStorage;
    if (data.accessToken) storage.setItem("accessToken", data.accessToken);
    if (data.refreshToken) storage.setItem("refreshToken", data.refreshToken);
    localStorage.removeItem("isGuest");
    return { success: true, data };
  } catch (err: unknown) {
    const message =
      (err as { response?: { data?: { error?: string } } })?.response?.data
        ?.error || "Sign in failed. Check your credentials.";
    return { success: false, error: message };
  }
}

export async function signOut(): Promise<AuthResponse> {
  try {
    await api.post("/api/customerauth/logoutCustomer", {});
  } catch {
    // Clear local data regardless of server response
  }
  clearStorage();
  return { success: true };
}

export async function getProfile(): Promise<AuthResponse> {
  try {
    const { data } = await api.get("/api/customerauth/getCustomerProfile");
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to get profile.",
    };
  }
}

export async function forgotPassword(email: string): Promise<AuthResponse> {
  try {
    const { data } = await api.post(
      "/api/nileflowafrica/passwordchange/forgot-password",
      { email }
    );
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to send reset email.",
    };
  }
}

export async function resetPassword(
  email: string,
  token: string,
  newPassword: string
): Promise<AuthResponse> {
  try {
    const { data } = await api.post(
      "/api/nileflowafrica/passwordchange/reset-password",
      { email, token, newPassword }
    );
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message || "Failed to reset password.",
    };
  }
}
