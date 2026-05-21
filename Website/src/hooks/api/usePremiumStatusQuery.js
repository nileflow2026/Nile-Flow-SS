/**
 * Nile Flow — Premium Status Query Hook (Website)
 *
 * Replaces direct Appwrite/API calls for premium subscription status.
 * Integrates with existing PremiumContext for backward compatibility.
 *
 * Usage:
 *   const { data: premium, isLoading } = usePremiumStatusQuery();
 *   // data: { isPremium, expiresAt, isExpiringSoon }
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axiosClient from "../../../axiosClient";
import { queryKeys } from "./queryKeys";
import { STALE } from "../../lib/queryClient";

const fetchPremiumStatus = async () => {
  const { data } = await axiosClient.get("/api/subscription/status");
  return data;
};

const isWithinDays = (dateString, days) => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const now = new Date();
  const diffDays = (date - now) / (1000 * 60 * 60 * 24);
  return diffDays > 0 && diffDays <= days;
};

export const usePremiumStatusQuery = () => {
  return useQuery({
    queryKey: queryKeys.premium.status(),
    queryFn: fetchPremiumStatus,
    staleTime: STALE.USER,
    select: (data) => ({
      isPremium: data?.isPremium ?? false,
      expiresAt: data?.expiresAt ?? null,
      isExpiringSoon: isWithinDays(data?.expiresAt, 7),
      subscriptionId: data?.subscriptionId ?? null,
    }),
  });
};

// ── Premium Deals ─────────────────────────────────────────────────────────────

const fetchPremiumDeals = async ({ page = 1, limit = 20 } = {}) => {
  const { data } = await axiosClient.get("/api/subscription/premium-deals", {
    params: { page, limit },
  });
  return data;
};

export const usePremiumDealsQuery = ({
  page = 1,
  limit = 20,
  enabled = true,
} = {}) => {
  return useQuery({
    queryKey: queryKeys.premium.deals(),
    queryFn: () => fetchPremiumDeals({ page, limit }),
    staleTime: STALE.STANDARD,
    enabled,
  });
};

// ── Monthly Summary ───────────────────────────────────────────────────────────

const fetchMonthlySummary = async (month) => {
  const { data } = await axiosClient.get("/api/subscription/monthly-summary", {
    params: { month },
  });
  return data;
};

export const useMonthlySummaryQuery = (month) => {
  return useQuery({
    queryKey: queryKeys.premium.monthlySummary(month),
    queryFn: () => fetchMonthlySummary(month),
    staleTime: STALE.LONG,
    enabled: !!month,
  });
};

// ── Subscription Mutation ─────────────────────────────────────────────────────

export const useSubscribeMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ paymentMethod, phoneNumber }) =>
      axiosClient
        .post("/api/subscription/subscribe", { paymentMethod, phoneNumber })
        .then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.premium.all() });
    },
  });
};

export const useCancelSubscriptionMutation = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      axiosClient.post("/api/subscription/cancel").then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.premium.all() });
    },
  });
};
