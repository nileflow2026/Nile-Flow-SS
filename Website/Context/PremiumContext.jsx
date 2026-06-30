/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect } from "react";
import { useCustomerAuth } from "./CustomerAuthContext";
import { premiumService } from "../utils/premiumService";

const PremiumContext = createContext();

export const usePremiumContext = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error("usePremiumContext must be used within PremiumProvider");
  }
  return context;
};

export const PremiumProvider = ({ children }) => {
  const { isLoading: authLoading, isAuthenticated } = useCustomerAuth();

  const [premiumStatus, setPremiumStatus] = useState({
    isPremium: false,
    expiresAt: null,
    loading: true,
    error: null,
  });

  // Fetch premium status on mount — but only if authenticated
  const fetchPremiumStatus = async () => {
    // Skip API call entirely if user is not authenticated
    if (!isAuthenticated) {
      setPremiumStatus({
        isPremium: false,
        expiresAt: null,
        loading: false,
        error: null,
      });
      return;
    }

    try {
      setPremiumStatus((prev) => ({ ...prev, loading: true, error: null }));
      const status = await premiumService.getStatus();
      setPremiumStatus({
        isPremium: status.isPremium,
        expiresAt: status.expiresAt,
        loading: false,
        error: null,
      });
    } catch (error) {
      // Premium API failure is non-fatal — degrade gracefully
      setPremiumStatus({
        isPremium: false,
        expiresAt: null,
        loading: false,
        error: null,
      });
    }
  };

  useEffect(() => {
    // Don't call the API until we know the auth state
    if (authLoading) return;
    fetchPremiumStatus();

    // Reset premium state on logout (no redirect)
    const handleLogout = () => {
      setPremiumStatus({
        isPremium: false,
        expiresAt: null,
        loading: false,
        error: null,
      });
    };

    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, [authLoading, isAuthenticated]);

  const value = {
    ...premiumStatus,
    refreshStatus: fetchPremiumStatus,
  };

  return (
    <PremiumContext.Provider value={value}>{children}</PremiumContext.Provider>
  );
};
