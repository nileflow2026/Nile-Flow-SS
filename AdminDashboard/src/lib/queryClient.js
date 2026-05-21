/**
 * Nile Flow — AdminDashboard Query Client
 *
 * TanStack Query configuration for the Admin Dashboard.
 * Admin data is relatively fresh-sensitive — lower stale times than customer-facing.
 *
 * Admin-specific considerations:
 *   - refetchOnWindowFocus: true — admins switch tabs frequently; fresh data matters
 *   - Shorter gcTime — admins don't browse for hours between page visits
 *   - No background polling by default (use explicit refetchInterval where needed)
 */

import { QueryClient } from "@tanstack/react-query";

export const STALE = {
  STATIC: 10 * 60 * 1000, // 10 min — settings, config
  LONG: 5 * 60 * 1000, // 5 min  — vendor profiles, user details
  STANDARD: 2 * 60 * 1000, // 2 min  — dashboard summaries
  SHORT: 30 * 1000, // 30 sec — order lists, cancellation requests
  LIVE: 10 * 1000, // 10 sec — real-time queues, active deliveries
};

const shouldRetry = (failureCount, error) => {
  if (error?.response?.status >= 400 && error?.response?.status < 500) {
    return false;
  }
  return failureCount < 2;
};

const retryDelay = (attempt) => Math.min(1000 * 2 ** attempt, 5000);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE.STANDARD,
      gcTime: 5 * 60 * 1000,
      retry: shouldRetry,
      retryDelay,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
