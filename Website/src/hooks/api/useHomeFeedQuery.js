/**
 * Nile Flow — Home Feed Query Hook (Website)
 *
 * Single hook that replaces 4-6 parallel API calls on the homepage.
 * The backend /api/v1/home-feed endpoint returns:
 *   - featuredProducts
 *   - categories
 *   - africanFact
 *   - settings
 *   - premiumDeals (authenticated premium users only)
 *   - isPremium (if authenticated)
 *
 * Usage:
 *   const { data, isLoading, error } = useHomeFeedQuery();
 */

import { useQuery } from "@tanstack/react-query";
import axiosClient from "../../../axiosClient";
import { queryKeys } from "./queryKeys";
import { STALE } from "../../lib/queryClient";

const fetchHomeFeed = async () => {
  const { data } = await axiosClient.get("/api/v1/home-feed");
  return data.data;
};

export const useHomeFeedQuery = () => {
  return useQuery({
    queryKey: queryKeys.homeFeed.feed(),
    queryFn: fetchHomeFeed,
    staleTime: STALE.STANDARD,
    // Select specific slices to prevent unnecessary renders in consuming components
    select: (data) => data,
  });
};

// Granular selectors — use these to avoid prop drilling full feed objects
export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: queryKeys.homeFeed.feed(),
    queryFn: fetchHomeFeed,
    staleTime: STALE.STANDARD,
    select: (data) => data?.featuredProducts ?? [],
  });
};

export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.homeFeed.feed(),
    queryFn: fetchHomeFeed,
    staleTime: STALE.STATIC,
    select: (data) => data?.categories ?? [],
  });
};

export const usePremiumDealsFromFeed = () => {
  return useQuery({
    queryKey: queryKeys.homeFeed.feed(),
    queryFn: fetchHomeFeed,
    staleTime: STALE.STANDARD,
    select: (data) => data?.premiumDeals ?? [],
  });
};
