/**
 * Nile Flow — Admin Orders Query Hooks
 *
 * Handles the paginated admin order list and cancellation requests.
 * Response format from API: { response, total, page, limit, totalPages }
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../../axiosClient";
import { queryKeys } from "./queryKeys";
import { STALE } from "../../lib/queryClient";

// ── Fetchers ───────────────────────────────────────────────────────────────────

const fetchOrders = async ({ page = 1, limit = 20, status } = {}) => {
  const params = { page, limit };
  if (status) params.status = status;
  const { data } = await axiosClient.get("/admin/orders", { params });
  return data;
};

const fetchCancelledOrders = async ({ page = 1, limit = 20 } = {}) => {
  const { data } = await axiosClient.get("/admin/orders/cancelled", {
    params: { page, limit },
  });
  return data;
};

const fetchCancellationRequests = async ({ page = 1, limit = 20 } = {}) => {
  const { data } = await axiosClient.get(
    "/admin/orders/cancellation-requests",
    {
      params: { page, limit },
    },
  );
  return data;
};

const fetchOrderDetail = async (orderId) => {
  const { data } = await axiosClient.get(`/admin/orders/${orderId}`);
  return data;
};

// ── Hooks ──────────────────────────────────────────────────────────────────────

export const useAdminOrdersQuery = ({ page = 1, limit = 20, status } = {}) => {
  return useQuery({
    queryKey: queryKeys.orders.list(page, status),
    queryFn: () => fetchOrders({ page, limit, status }),
    staleTime: STALE.SHORT,
    placeholderData: (prev) => prev, // Keep previous page visible during navigation
  });
};

export const useAdminCancelledOrdersQuery = ({ page = 1, limit = 20 } = {}) => {
  return useQuery({
    queryKey: queryKeys.orders.cancelled(page),
    queryFn: () => fetchCancelledOrders({ page, limit }),
    staleTime: STALE.SHORT,
    placeholderData: (prev) => prev,
  });
};

export const useCancellationRequestsQuery = ({ page = 1, limit = 20 } = {}) => {
  return useQuery({
    queryKey: queryKeys.orders.cancellationRequests(page),
    queryFn: () => fetchCancellationRequests({ page, limit }),
    staleTime: STALE.SHORT,
    refetchInterval: 60 * 1000, // Cancellation queue: refresh every 1min
  });
};

export const useAdminOrderDetailQuery = (orderId) => {
  return useQuery({
    queryKey: queryKeys.orders.detail(orderId),
    queryFn: () => fetchOrderDetail(orderId),
    staleTime: STALE.SHORT,
    enabled: !!orderId,
  });
};

// ── Order Action Mutations ────────────────────────────────────────────────────

export const useApproveCancellationMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderId) =>
      axiosClient
        .post(`/admin/orders/${orderId}/approve-cancellation`)
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all() });
    },
  });
};

export const useRejectCancellationMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, reason }) =>
      axiosClient
        .post(`/admin/orders/${orderId}/reject-cancellation`, { reason })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.orders.all() });
    },
  });
};
