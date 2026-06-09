/**
 * Nile Flow — VendorDashboard Query Client
 *
 * TanStack Query configuration for the Vendor Dashboard.
 * Vendors need reasonably fresh data but slightly more relaxed than admin.
 *
 * Vendor-specific considerations:
 *   - refetchOnWindowFocus: true — vendors switch tabs; fresh data matters
 *   - Standard stale times — vendor data changes gradually (products, inventory)
 *   - No background polling by default (use explicit refetchInterval where needed)
 */

import { QueryClient } from "@tanstack/react-query";

export const STALE = {
  STATIC: 15 * 60 * 1000,   // 15 min — settings, config
  LONG: 8 * 60 * 1000,      // 8 min  — vendor profiles, user details
  STANDARD: 3 * 60 * 1000,  // 3 min  — product lists, dashboard summaries
  SHORT: 60 * 1000,         // 1 min  — order lists, recent activity
  LIVE: 30 * 1000,          // 30 sec — active deliveries, real-time queues
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