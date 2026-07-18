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
import { useNavigate, useLocation } from "react-router-dom";
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
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to login without full page reload
  const redirectToLogin = useCallback(
    (extraState = {}) => {
      if (destroyInProgressRef.current) return;
      destroyInProgressRef.current = true;

      const publicRoutes = ["/rider/login", "/rider/register"];
      const isPublicRoute = publicRoutes.some((route) =>
        location.pathname.startsWith(route),
      );

      if (!isPublicRoute) {
        navigate("/rider/login", {
          replace: true,
          state: { from: location, ...extraState },
        });
      }

      setTimeout(() => {
        destroyInProgressRef.current = false;
      }, 300);
    },
    [navigate, location],
  );

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

    // Small delay to ensure React Router is mounted before auth runs
    const timer = setTimeout(initAuth, 0);
    return () => clearTimeout(timer);
  }, []);

  // Listen for session destroyed events (multi-tab logout, etc.)
  useEffect(() => {
    const unsub = sessionManager.on("session_destroyed", () => {
      if (destroyInProgressRef.current) return;
      setRider(null);
      setIsAuthenticated(false);
      redirectToLogin();
    });

    return unsub;
  }, [redirectToLogin]);

  // Listen for legacy custom logout events from Axios interceptor
  useEffect(() => {
    const handleLogout = () => {
      if (destroyInProgressRef.current) return;
      setRider(null);
      setIsAuthenticated(false);
      sessionManager.destroySession("forced_logout");
      // Navigate will be handled by session_destroyed event above
    };

    window.addEventListener("rider:logout", handleLogout);
    return () => window.removeEventListener("rider:logout", handleLogout);
  }, []);

  const register = useCallback(async (riderData) => {
    const result = await authAPI.registerRider(riderData);

    const rider = result.data?.rider;
    if (result.success && rider) {
      setRider(rider);
      setIsAuthenticated(true);
      auditLogger.log("REGISTRATION_SUCCESS", { email: riderData.email });
    } else {
      setRider(null);
      setIsAuthenticated(false);
    }

    return result;
  }, []);

  const login = useCallback(async (email, password) => {
    const result = await authAPI.loginRider(email, password);

    const rider = result.data?.rider;
    if (result.success && rider) {
      setRider(rider);
      setIsAuthenticated(true);
    } else {
      setRider(null);
      setIsAuthenticated(false);
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
    redirectToLogin();
    return { success: true };
  }, [redirectToLogin]);

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
