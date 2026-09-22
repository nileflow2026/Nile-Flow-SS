/**
 * Product Service
 *
 * All product-related API operations.
 * Components use this service — never call httpClient directly.
 */

import { httpClient } from '@api/client/HttpClient';

const BASE = '/api/customerprofile';

export const productService = {
  /**
   * Fetch all products with optional filters and cursor-based pagination.
   */
  async getProducts(options = {}) {
    const { category, search, cursor, limit, vendorId } = options;
    const params = {};
    if (category && category !== 'all') params.category = category;
    if (search) params.search = search;
    if (cursor) params.cursor = cursor;
    if (limit) params.limit = limit;
    if (vendorId) params.vendorId = vendorId;

    const response = await httpClient.get(`${BASE}/fetch-product`, params);
    const products = Array.isArray(response.data?.products)
      ? response.data.products
      : [];
    return {
      products,
      nextCursor: response.data?.nextCursor || null,
      total: response.data?.total || products.length,
    };
  },

  async getSubcategoryProducts(subcategoryId, options = {}) {
    if (!subcategoryId) return [];
    const response = await httpClient.get(`${BASE}/mobile-products`, {
      subcategoryId,
      limit: options.limit || 100,
    });
    return Array.isArray(response.data?.products) ? response.data.products : [];
  },

  async getAllProducts() {
    const response = await httpClient.get(`${BASE}/fetch-products`);
    return Array.isArray(response.data?.products) ? response.data.products : [];
  },

  async getProduct(productId) {
    const response = await httpClient.get(`${BASE}/fetch-product`, {
      productId,
    });

    const payload = response.data ?? {};

    if (payload?.product) return payload.product;
    if (Array.isArray(payload)) {
      return payload.find((product) => (product?.productId || product?.$id || product?.id) === productId) || null;
    }
    if (Array.isArray(payload?.products)) {
      return payload.products.find((product) => (product?.productId || product?.$id || product?.id) === productId) || null;
    }

    return null;
  },

  async checkStock(productId, quantity = 1) {
    try {
      const response = await httpClient.get(
        `/api/admin/products/products/${productId}/stock`,
      );
      return {
        available: response.data?.available ?? false,
        stock: response.data?.stock ?? 0,
      };
    } catch {
      return { available: false, stock: 0 };
    }
  },

  async getFeaturedProducts(all = false) {
    const response = await httpClient.get(`${BASE}/featured-products`, {
      params: all ? { showAll: 'true' } : {},
    });
    return Array.isArray(response.data) ? response.data : [];
  },

  /**
   * Fetch all active deal products with discounts, time left, and premium flags.
   * Backend returns enriched deal objects directly (not wrapped in products array).
   */
  async getDealProducts() {
    const response = await httpClient.get(`${BASE}/deal-products`);
    return Array.isArray(response.data) ? response.data : [];
  },

  async getHeroProducts() {
    const response = await httpClient.get(`${BASE}/hero-products`);
    const data = response.data ?? {};
    const payload = Array.isArray(data.featured) || Array.isArray(data.products)
      ? data
      : data.data ?? {};
    return Array.isArray(payload.products)
      ? payload.products
      : Array.isArray(payload.featured)
        ? payload.featured
        : [];
  },

  async getFlashSales() {
    const response = await httpClient.get(`${BASE}/flash-sales`);
    return Array.isArray(response.data) ? response.data : [];
  },
};

export default productService;
