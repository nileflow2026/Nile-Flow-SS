import axiosClient from "../api";
import { normalizeBusiness } from "../utils/businessDirectory";

export const BUSINESS_PAGE_SIZE = 24;
export const BUSINESS_HOME_LIMIT = 6;

function normalizePage(responseData) {
  const page = responseData?.data;
  if (
    !Array.isArray(page?.businesses) ||
    !Array.isArray(page?.categories) ||
    !page?.pagination
  ) {
    throw new Error("The business directory response is incomplete.");
  }

  const { page: pageNumber, totalPages } = page.pagination;
  if (!Number.isInteger(pageNumber) || !Number.isInteger(totalPages)) {
    throw new Error("The business directory pagination is invalid.");
  }
  if (!page.categories.every((category) => typeof category === "string")) {
    throw new Error("The business category response is invalid.");
  }

  return {
    businesses: page.businesses.map(normalizeBusiness),
    categories: page.categories,
    pagination: page.pagination,
  };
}

export const businessDirectoryService = {
  async getBusinesses({ page = 1, limit = BUSINESS_PAGE_SIZE, category } = {}) {
    const params = { page, limit };
    if (category) params.category = category;

    const response = await axiosClient.get(
      "/api/customerprofile/businesses",
      { params },
    );
    return normalizePage(response.data);
  },

  async getBusiness(businessId) {
    if (!businessId) {
      throw new Error("A business ID is required.");
    }

    const response = await axiosClient.get(
      `/api/customerprofile/businesses/${encodeURIComponent(businessId)}`,
    );
    const business = response.data?.data?.business;
    if (!business) {
      throw new Error("The business profile response is incomplete.");
    }
    return normalizeBusiness(business);
  },
};

export default businessDirectoryService;
