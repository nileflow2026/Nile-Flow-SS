import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import {
  BUSINESS_HOME_LIMIT,
  BUSINESS_PAGE_SIZE,
  businessDirectoryService,
} from "../../services/businessDirectoryService";
import { STALE } from "../../lib/queryClient";
import { queryKeys } from "./queryKeys";

export function useBusinessShowcaseQuery() {
  return useQuery({
    queryKey: queryKeys.businesses.directory("home"),
    queryFn: () =>
      businessDirectoryService.getBusinesses({
        page: 1,
        limit: BUSINESS_HOME_LIMIT,
      }),
    staleTime: STALE.STANDARD,
    select: (result) => result.businesses,
  });
}

export function useBusinessDirectoryQuery(category) {
  return useInfiniteQuery({
    queryKey: queryKeys.businesses.directory(category),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      businessDirectoryService.getBusinesses({
        page: pageParam,
        limit: BUSINESS_PAGE_SIZE,
        category: category || undefined,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.pagination.page < lastPage.pagination.totalPages
        ? lastPage.pagination.page + 1
        : undefined,
    staleTime: STALE.STANDARD,
  });
}

export function useBusinessProfileQuery(businessId) {
  return useQuery({
    queryKey: queryKeys.businesses.profile(businessId),
    queryFn: () => businessDirectoryService.getBusiness(businessId),
    enabled: Boolean(businessId),
    staleTime: STALE.LONG,
  });
}
