/* eslint-disable react-refresh/only-export-components */
/* eslint-disable no-unused-vars */
// src/rider/contexts/RiderAuthContext.jsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import * as authAPI from "../auth/authService";
import sessionManager from "../auth/SessionManager";
import auditLogger from "../auth/AuditLogger";

const RiderAuthContext = createContext(null);

export const RiderAuthProvider = ({ children }) => {
  const [rider, setRider] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const destroyInProgressRef = useRef(false);

  // Initialize auth state — runs once on mount
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    const initAuth = async () => {
      try {
        const publicRoutes = ["/rider/login", "/rider/register"];
        const isPublicRoute = publicRoutes.some((route) =>
          window.location.pathname.startsWith(route),
        );

        if (isPublicRoute) {
          setLoading(false);
          return;
        }

        sessionManager.initialize();
        const result = await authAPI.getCurrentRider();

        if (result.success && result.data?.rider) {
          setRider(result.data.rider);
          setIsAuthenticated(true);
        } else {
          setRider(null);
          setIsAuthenticated(false);
        }
      } catch {
        setRider(null);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  // Listen for session destroyed events (multi-tab logout, etc.)
  useEffect(() => {
    const unsub = sessionManager.on("session_destroyed", ({ reason }) => {
      if (destroyInProgressRef.current) return;
      destroyInProgressRef.current = true;
      setRider(null);
      setIsAuthenticated(false);

      const publicRoutes = ["/rider/login", "/rider/register"];
      const isPublicRoute = publicRoutes.some((route) =>
        window.location.pathname.startsWith(route),
      );

      if (!isPublicRoute) {
        window.location.href = "/rider/login";
      }

      setTimeout(() => {
        destroyInProgressRef.current = false;
      }, 500);
    });

    return unsub;
  }, []);

  // Listen for legacy custom logout events
  useEffect(() => {
    const handleLogout = () => {
      if (destroyInProgressRef.current) return;
      destroyInProgressRef.current = true;
      setRider(null);
      setIsAuthenticated(false);
      sessionManager.destroySession("forced_logout");

      const publicRoutes = ["/rider/login", "/rider/register"];
      const isPublicRoute = publicRoutes.some((route) =>
        window.location.pathname.startsWith(route),
      );

      if (!isPublicRoute) {
        window.location.href = "/rider/login";
      }

      setTimeout(() => {
        destroyInProgressRef.current = false;
      }, 500);
    };

    window.addEventListener("rider:logout", handleLogout);
    return () => window.removeEventListener("rider:logout", handleLogout);
  }, []);

  const register = useCallback(async (riderData) => {
    const result = await authAPI.registerRider(riderData);

    if (result.success && result.data?.rider) {
      setRider(result.data.rider);
      setIsAuthenticated(true);
      auditLogger.log("REGISTRATION_SUCCESS", { email: riderData.email });
    }

    return result;
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authAPI.loginRider(email, password);

    if (result.success && result.data?.rider) {
      setRider(result.data.rider);
      setIsAuthenticated(true);
    }

    return result;
  }, []);

  const logout = useCallback(async () => {
    setRider(null);
    setIsAuthenticated(false);
    sessionManager.destroySession("user_logout");
    try {
      await authAPI.logoutRider();
    } catch {
      // Already cleaned up locally
    }
    return { success: true };
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    const result = await authAPI.updateRiderProfile(profileData);

    if (result.success && result.data?.rider) {
      setRider(result.data.rider);
    }

    return result;
  }, []);

  const updateStatus = useCallback(async (status) => {
    const result = await authAPI.updateRiderStatus(status);

    if (result.success) {
      setRider((prev) => ({ ...prev, status: result.data.status || status }));
    }

    return result;
  }, []);

  const value = {
    rider,
    isAuthenticated,
    loading,
    register,
    login,
    logout,
    updateProfile,
    updateStatus,
    setRider,
  };

  return (
    <RiderAuthContext.Provider value={value}>
      {children}
    </RiderAuthContext.Provider>
  );
};

export const useRiderAuth = () => {
  const context = useContext(RiderAuthContext);
  if (!context) {
    throw new Error("useRiderAuth must be used within RiderAuthProvider");
  }
  return context;
};

export default RiderAuthProvider;
