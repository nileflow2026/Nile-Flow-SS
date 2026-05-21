/**
 * Nile Flow — Admin Dashboard Query Hook
 *
 * Covers the main admin dashboard summary and metrics.
 */

import { useQuery } from "@tanstack/react-query";
import axiosClient from "../../../axiosClient";
import { queryKeys } from "./queryKeys";
import { STALE } from "../../lib/queryClient";

const fetchDashboardSummary = async () => {
  const { data } = await axiosClient.get("/admin/dashboard");
  return data;
};

export const useAdminDashboardQuery = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.summary(),
    queryFn: fetchDashboardSummary,
    staleTime: STALE.STANDARD,
    refetchInterval: 2 * 60 * 1000, // Auto-refresh every 2min (admin monitors live)
  });
};
