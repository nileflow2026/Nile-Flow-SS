/**
 * Nile Flow — Website Query Client
 *
 * Centralized TanStack Query configuration for the Website.
 * All data fetching goes through this client — never raw fetch/axios in components.
 *
 * StaleTime governance:
 *   STATIC (categories, settings): 30 minutes
 *   STANDARD (featured products): 5 minutes
 *   USER (profile, premium status): 2 minutes
 *   LIVE (notifications, orders): 30 seconds
 *
 * Retry policy:
 *   - Network errors: retry up to 3x with exponential backoff
 *   - 4xx errors (auth, validation): DO NOT retry (immediate failure)
 *   - 5xx errors: retry up to 2x
 */

import { QueryClient } from "@tanstack/react-query";

// StaleTime constants (milliseconds) — match backend cache TTLs
export const STALE = {
  STATIC: 30 * 60 * 1000, // 30 min — categories, settings, africa facts
  LONG: 10 * 60 * 1000, // 10 min — vendor profiles, featured vendors
  STANDARD: 5 * 60 * 1000, // 5 min  — featured products, home feed
  USER: 2 * 60 * 1000, // 2 min  — profile, premium status
  NOTIFICATIONS: 30 * 1000, // 30 sec — notification counts
  LIVE: 15 * 1000, // 15 sec — orders, delivery tracking
};

// Determine if an error should prevent retries
const shouldRetry = (failureCount, error) => {
  // Don't retry on client errors — they won't resolve by retrying
  if (error?.response?.status >= 400 && error?.response?.status < 500) {
    return false;
  }
  return failureCount < 3;
};

// Exponential backoff: 1s, 2s, 4s
const retryDelay = (attempt) => Math.min(1000 * 2 ** attempt, 10000);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE.STANDARD,
      gcTime: 10 * 60 * 1000, // Keep unused data in cache for 10 min
      retry: shouldRetry,
      retryDelay,
      refetchOnWindowFocus: false, // Prevents re-fetches on every tab switch
      refetchOnReconnect: true, // Re-fetch when network recovers
      refetchOnMount: true,
    },
    mutations: {
      retry: 0, // Mutations should not retry automatically — user intent is explicit
    },
  },
});
