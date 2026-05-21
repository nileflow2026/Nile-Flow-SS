/**
 * Nile Flow — Mobileapp Query Client
 *
 * TanStack Query configuration for React Native / Expo.
 * Matches the backend cache TTLs to prevent over-fetching.
 *
 * Mobile-specific considerations:
 *   - refetchOnWindowFocus: false (mobile has no windows)
 *   - refetchOnAppForeground handled via NetInfo listener in AppQueryProvider
 *   - Background refetch is conservative — battery impact matters
 *   - gcTime is longer to survive background-to-foreground transitions
 */

import { QueryClient } from "@tanstack/react-query";

// StaleTime constants (milliseconds)
export const STALE = {
  STATIC: 30 * 60 * 1000, // 30 min — categories, settings
  LONG: 10 * 60 * 1000, // 10 min — vendor profiles
  STANDARD: 5 * 60 * 1000, // 5 min  — products, home feed
  USER: 2 * 60 * 1000, // 2 min  — profile, premium status
  NOTIFICATIONS: 30 * 1000, // 30 sec — notification counts
  LIVE: 15 * 1000, // 15 sec — active orders, tracking
};

const shouldRetry = (failureCount, error) => {
  // Don't retry on 4xx — user or auth errors won't resolve on retry
  if (error?.response?.status >= 400 && error?.response?.status < 500) {
    return false;
  }
  return failureCount < 3;
};

const retryDelay = (attempt) => Math.min(1000 * 2 ** attempt, 10000);

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: STALE.STANDARD,
      gcTime: 15 * 60 * 1000, // Mobile: keep data longer across background transitions
      retry: shouldRetry,
      retryDelay,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      refetchOnMount: true,
      refetchIntervalInBackground: false, // Battery conservation
    },
    mutations: {
      retry: 0,
    },
  },
});
