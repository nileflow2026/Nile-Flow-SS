/**
 * Nile Flow — Home Feed Query Hook (Mobileapp)
 *
 * Replaces individual API calls in Home.jsx with a single orchestrated request.
 * Returns featured products, categories, Africa fact, settings in one fetch.
 */

import { useQuery } from "@tanstack/react-query";
import axiosClient from "../../api";
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
  });
};

// Granular selectors — use in components to subscribe only to the data slice needed
export const useCategories = () => {
  return useQuery({
    queryKey: queryKeys.homeFeed.feed(),
    queryFn: fetchHomeFeed,
    staleTime: STALE.STATIC,
    select: (data) => data?.categories ?? [],
  });
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: queryKeys.homeFeed.feed(),
    queryFn: fetchHomeFeed,
    staleTime: STALE.STANDARD,
    select: (data) => data?.featuredProducts ?? [],
  });
};

export const useAfricanFact = () => {
  return useQuery({
    queryKey: queryKeys.homeFeed.feed(),
    queryFn: fetchHomeFeed,
    staleTime: STALE.LONG,
    select: (data) => data?.africanFact ?? null,
  });
};
