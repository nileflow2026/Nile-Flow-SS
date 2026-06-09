/* eslint-disable react-refresh/only-export-components */
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getCurrentUser,
  logoutCustomer,
  signInCustomer,
  signUpCustomer,
} from "../authServices";

const AuthContext = createContext(null);

// Generate device ID in memory (persisted in sessionStorage for tab consistency)
const getDeviceId = () => {
  let deviceId = sessionStorage.getItem("customerDeviceId");
  if (!deviceId) {
    deviceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem("customerDeviceId", deviceId);
  }
  return deviceId;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const result = await getCurrentUser();
        if (result.success) {
          setUser(result.data.user);
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error("Customer auth initialization failed:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  // Listen for logout events from axios interceptor
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
      setIsAuthenticated(false);
      window.location.href = "/signin";
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  const signUp = useCallback(async (email, password, username, phone) => {
    const deviceId = getDeviceId();
    const result = await signUpCustomer(
      email,
      password,
      username,
      phone,
      deviceId,
    );

    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);
    }

    return result;
  }, []);

  const signIn = useCallback(async (email, password) => {
    const deviceId = getDeviceId();
    const result = await signInCustomer(email, password, deviceId);

    if (result.success) {
      setUser(result.data.user);
      setIsAuthenticated(true);

      // Clear guest status
      localStorage.removeItem("isGuest");
    }

    return result;
  }, []);

  const logout = useCallback(async () => {
    const result = await logoutCustomer();
    setUser(null);
    setIsAuthenticated(false);
    sessionStorage.removeItem("customerDeviceId");
    localStorage.removeItem("isGuest");
    return result;
  }, []);

  const updateUser = useCallback((userData) => {
    setUser((prev) => ({ ...prev, ...userData }));
  }, []);

  const value = {
    user,
    isAuthenticated,
    isLoading,
    signUp,
    signIn,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within CustomerAuthProvider");
  }
  return context;
};
