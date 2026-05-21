/**
 * Nile Flow — Orders Query Hooks (Mobileapp)
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../api";
import { queryKeys } from "./queryKeys";
import { STALE } from "../../lib/queryClient";

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

export const useOrdersQuery = ({ page = 1, limit = 10 } = {}) => {
  return useQuery({
    queryKey: queryKeys.orders.list(page),
    queryFn: () => fetchOrders({ page, limit }),
    staleTime: STALE.LIVE,
    placeholderData: (prev) => prev,
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

/**
 * Active order tracking — polls every 30s while screen is in foreground.
 * Set enabled=false when navigating away to stop polling.
 */
export const useOrderTrackingQuery = (orderId, { enabled = true } = {}) => {
  return useQuery({
    queryKey: queryKeys.orders.tracking(orderId),
    queryFn: () => fetchOrderTracking(orderId),
    staleTime: STALE.LIVE,
    refetchInterval: enabled ? 30 * 1000 : false,
    enabled: !!orderId && enabled,
  });
};

export const useCancelOrderMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) =>
      axiosClient
        .post("/api/orders/cancel-request", payload)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all() });
    },
  });
};
