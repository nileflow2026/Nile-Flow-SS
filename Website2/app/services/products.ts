/**
 * Nile Flow Products Service
 *
 * Single source for all product-related API calls.
 * - No commented code
 * - Clean error responses
 */

import api from "./api";
import type { AuthResponse } from "./auth";

export async function getProducts(params?: {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
  sort?: string;
}): Promise<AuthResponse> {
  try {
    const { data } = await api.get("/api/products", { params });
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to fetch products.",
    };
  }
}

export async function getProduct(id: string): Promise<AuthResponse> {
  try {
    const { data } = await api.get(`/api/products/${id}`);
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to fetch product.",
    };
  }
}

export async function getCategories(): Promise<AuthResponse> {
  try {
    const { data } = await api.get("/api/products/categories");
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to fetch categories.",
    };
  }
}

export async function getFeatured(): Promise<AuthResponse> {
  try {
    const { data } = await api.get("/api/products/featured");
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to fetch featured products.",
    };
  }
}

export async function getDeals(): Promise<AuthResponse> {
  try {
    const { data } = await api.get("/api/products/deals");
    return { success: true, data };
  } catch (err: unknown) {
    return {
      success: false,
      error:
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error || "Failed to fetch deals.",
    };
  }
}
