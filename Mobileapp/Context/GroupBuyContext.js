/**
 * GroupBuyContext.js
 *
 * Global state management for the Group Buying system.
 * Provides:
 *  - createGroupBuy(productId, options)
 *  - joinGroupBuy(groupId)
 *  - leaveGroupBuy(groupId)
 *  - fetchGroup(groupId)
 *  - fetchActiveGroups(productId)
 *  - Real-time updates via Appwrite Realtime subscription
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import axiosClient from "../api";
import { useGlobalContext } from "./GlobalProvider";

const GroupBuyContext = createContext(null);

export function GroupBuyProvider({ children }) {
  const { user } = useGlobalContext();
  const currentUserId = user?.$id || user?.userId || user?.id || null;

  // Active group being viewed / tracked
  const [activeGroup, setActiveGroup] = useState(null);
  // Groups available for a product (shown on product page)
  const [productGroups, setProductGroups] = useState([]);
  // Loading / error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // ── API helpers ────────────────────────────────────────────────────────────

  const fetchGroup = useCallback(async (groupId) => {
    try {
      setLoading(true);
      const res = await axiosClient.get(`/api/group-orders/${groupId}`);
      setActiveGroup(res.data);
      return res.data;
    } catch (error) {
      const msg = error?.response?.data?.error || "Failed to load group deal.";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveGroups = useCallback(async (productId, limit = 5) => {
    try {
      const res = await axiosClient.get(
        `/api/group-orders/active?productId=${productId}&limit=${limit}`,
      );
      setProductGroups(res.data.documents || []);
      return res.data.documents || [];
    } catch (err) {
      console.error("fetchActiveGroups error:", err);
      return [];
    }
  }, []);

  const createGroupBuy = useCallback(
    async (productId, options = {}) => {
      if (!currentUserId) return { error: "You must be logged in." };
      try {
        setLoading(true);
        const payload = {
          productId,
          creatorId: currentUserId,
          maxParticipants: options.maxParticipants ?? 5,
          basePrice: options.basePrice,
          priceStrategy: options.priceStrategy ?? "tiered",
          tiers: options.tiers ?? null,
          ttlHours: options.ttlHours ?? 24,
          productName: options.productName ?? "",
          productImage: options.productImage ?? "",
        };
        console.log("=== CREATE GROUP BUY REQUEST ===");
        console.log("Payload:", JSON.stringify(payload, null, 2));
        const res = await axiosClient.post("/api/group-orders/create", payload);
        console.log("=== CREATE GROUP BUY RESPONSE ===");
        console.log("Response:", JSON.stringify(res.data, null, 2));
        setActiveGroup(res.data);
        return { data: res.data, error: null };
      } catch (err) {
        const msg =
          err?.response?.data?.error || "Failed to create group deal.";
        setError(msg);
        return { error: msg };
      } finally {
        setLoading(false);
      }
    },
    [currentUserId],
  );

  const joinGroupBuy = useCallback(
    async (groupId) => {
      if (!currentUserId) return { error: "You must be logged in." };
      try {
        setLoading(true);
        const res = await axiosClient.post(
          `/api/group-orders/${groupId}/join`,
          {
            userId: currentUserId,
          },
        );
        setActiveGroup(res.data);
        return { data: res.data, error: null };
      } catch (err) {
        const msg = err?.response?.data?.error || "Failed to join group deal.";
        setError(msg);
        return { error: msg };
      } finally {
        setLoading(false);
      }
    },
    [currentUserId],
  );

  const leaveGroupBuy = useCallback(
    async (groupId) => {
      if (!currentUserId) return { error: "You must be logged in." };
      try {
        const res = await axiosClient.post(
          `/api/group-orders/${groupId}/leave`,
          { userId: currentUserId },
        );
        setActiveGroup(res.data);
        return { data: res.data, error: null };
      } catch (err) {
        const msg = err?.response?.data?.error || "Failed to leave group.";
        setError(msg);
        return { error: msg };
      }
    },
    [currentUserId],
  );

  const getShareData = useCallback(async (groupId) => {
    try {
      const res = await axiosClient.get(`/api/group-orders/${groupId}/share`);
      return { data: res.data, error: null };
    } catch (err) {
      return { error: "Failed to get share data." };
    }
  }, []);

  // ── Backend Polling (replaces Appwrite Realtime) ─────────────────────────

  const POLL_INTERVAL_MS = 10000; // 10 seconds
  const pollTimers = useRef(new Map());

  const unsubscribeFromGroup = useCallback((groupId) => {
    const timerId = pollTimers.current.get(groupId);
    if (timerId) {
      clearInterval(timerId);
      pollTimers.current.delete(groupId);
    }
  }, []);

  const subscribeToGroup = useCallback(
    (groupId) => {
      if (pollTimers.current.has(groupId)) return;

      // Initial fetch
      fetchGroup(groupId);

      // Poll for updates
      const timerId = setInterval(async () => {
        try {
          const res = await axiosClient.get(`/api/group-orders/${groupId}`);
          const updated = res.data;
          if (!updated) {
            setActiveGroup(null);
            unsubscribeFromGroup(groupId);
            return;
          }
          setActiveGroup((prev) => {
            if (prev?.$id === groupId) return updated;
            return prev;
          });
        } catch (err) {
          console.error("GroupBuy poll error:", err);
        }
      }, POLL_INTERVAL_MS);

      pollTimers.current.set(groupId, timerId);
    },
    [fetchGroup, unsubscribeFromGroup],
  );

  // Clean up all poll timers on unmount
  useEffect(() => {
    const timers = pollTimers.current;
    return () => {
      timers.forEach((timerId) => clearInterval(timerId));
      timers.clear();
    };
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = {
    activeGroup,
    productGroups,
    loading,
    error,
    currentUserId,
    fetchGroup,
    fetchActiveGroups,
    createGroupBuy,
    joinGroupBuy,
    leaveGroupBuy,
    getShareData,
    subscribeToGroup,
    unsubscribeFromGroup,
    clearError,
  };

  return (
    <GroupBuyContext.Provider value={value}>
      {children}
    </GroupBuyContext.Provider>
  );
}

export function useGroupBuy() {
  const ctx = useContext(GroupBuyContext);
  if (!ctx) {
    throw new Error("useGroupBuy must be used inside <GroupBuyProvider>");
  }
  return ctx;
}

export default GroupBuyContext;
