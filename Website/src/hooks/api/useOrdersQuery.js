/**
 * Nile Flow — Orders Query Hooks (Website)
 *
 * Replaces direct axios calls in Order-related components.
 * All order fetching and mutations route through these hooks.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../../axiosClient";
import { queryKeys } from "./queryKeys";
import { STALE } from "../../lib/queryClient";

// ── Query Fetchers ─────────────────────────────────────────────────────────────

const fetchOrders = async ({ page = 1, limit = 10 } = {}) => {
  const { data } = await axiosClient.get("/api/customerprofile/orders", {
    params: { page, limit },
  });
  return data;
};

const fetchOrderDetail = async (orderId) => {
  const { data } = await axiosClient.get(
    `/api/customerprofile/orders/${orderId}`,
  );
  return data;
};

const fetchOrderTracking = async (orderId) => {
  const { data } = await axiosClient.get(`/api/orders/track/${orderId}`);
  return data;
};

// ── Query Hooks ────────────────────────────────────────────────────────────────

export const useOrdersQuery = ({ page = 1, limit = 10 } = {}) => {
  return useQuery({
    queryKey: queryKeys.orders.list(page),
    queryFn: () => fetchOrders({ page, limit }),
    staleTime: STALE.LIVE,
    placeholderData: (prev) => prev, // Keep previous page visible while fetching next
  });
};

export const useOrderDetailQuery = (orderId) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => fetchOrderDetail(orderId),
    staleTime: STALE.LIVE,
    enabled: !!orderId,
  });
};

export const useOrderTrackingQuery = (orderId, { enabled = true } = {}) => {
  return useQuery({
    queryKey: queryKeys.orders.tracking(orderId),
    queryFn: () => fetchOrderTracking(orderId),
    staleTime: STALE.LIVE,
    refetchInterval: enabled ? 30 * 1000 : false, // Poll every 30s only when tracking is active
    enabled: !!orderId && enabled,
  });
};

// ── Mutations ──────────────────────────────────────────────────────────────────

export const useCancelOrderMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      orderId,
      reason,
      additionalDetails,
      userId,
      customerEmail,
      customerName,
    }) =>
      axiosClient.post("/api/orders/cancel-request", {
        orderId,
        reason,
        additionalDetails,
        userId,
        customerEmail,
        customerName,
      }),
    onSuccess: () => {
      // Invalidate all order queries so list reflects cancellation
      qc.invalidateQueries({ queryKey: queryKeys.orders.all() });
    },
  });
};
