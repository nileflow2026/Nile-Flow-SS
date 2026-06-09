/**
 * Nile Flow — Website Query Client
 *
 * TanStack Query configuration for the public-facing Website.
 * Website reads are mostly cached, static content (products, categories, facts).
 * Stale times are generous to minimize backend load.
 */

import { QueryClient } from "@tanstack/react-query";

export const STALE = {
  STATIC: 15 * 60 * 1000, // 15 min — settings, config, static content
  LONG: 10 * 60 * 1000, // 10 min — categories, currencies
  STANDARD: 5 * 60 * 1000, // 5 min  — product lists, featured
  SHORT: 60 * 1000, // 1 min  — cart, user profile
  LIVE: 30 * 1000, // 30 sec — active searches
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
      gcTime: 10 * 60 * 1000,
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
