/**
 * Nile Flow — Notifications Query Hook (Website)
 *
 * Replaces Appwrite realtime-only notification fetching with:
 *   - Initial fetch via React Query (paginated)
 *   - Controlled polling (30s) for new notification counts
 *   - Realtime remains ONLY for real-time count badge updates
 *
 * Rule: Components must NOT subscribe to Appwrite realtime directly.
 * The NotificationContext manages the single shared realtime subscription.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../../axiosClient";
import { queryKeys } from "./queryKeys";
import { STALE } from "../../lib/queryClient";

const fetchNotifications = async ({ page = 1, limit = 20 } = {}) => {
  const { data } = await axiosClient.get("/api/customernotifications", {
    params: { page, limit },
  });
  return data;
};

// ── Notifications List ────────────────────────────────────────────────────────

export const useNotificationsQuery = ({ page = 1, limit = 20 } = {}) => {
  return useQuery({
    queryKey: queryKeys.notifications.list(page),
    queryFn: () => fetchNotifications({ page, limit }),
    staleTime: STALE.NOTIFICATIONS,
    // Poll every 30s as a fallback if realtime misses an event
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
  });
};

// ── Notification Count (badge) ────────────────────────────────────────────────

export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: queryKeys.notifications.count(),
    queryFn: () => fetchNotifications({ page: 1, limit: 1 }),
    staleTime: STALE.NOTIFICATIONS,
    refetchInterval: 30 * 1000,
    refetchIntervalInBackground: false,
    select: (data) => data?.total ?? 0,
  });
};

// ── Mark Read Mutation ────────────────────────────────────────────────────────

export const useMarkNotificationReadMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (notificationId) =>
      axiosClient
        .patch(`/api/customernotifications/${notificationId}/read`)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
  });
};

export const useMarkAllReadMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      axiosClient
        .post("/api/customernotifications/mark-all-read")
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.notifications.all() });
    },
  });
};
