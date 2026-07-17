/**
 * Product Service
 *
 * All product-related API operations.
 * Components use this service — never call httpClient directly.
 */

import { httpClient } from '@api/client/HttpClient';
import { parsePaginatedResponse } from '@api/utils/helpers';

const BASE = '/api/customerprofile';

export const productService = {
  /**
   * Fetch all products with optional filters and cursor-based pagination.
   *
   * @param {Object} [options]
   * @param {string} [options.category] - Category slug or ID
   * @param {string} [options.search] - Search query
   * @param {string} [options.cursor] - Pagination cursor
   * @param {number} [options.limit] - Items per page
   * @returns {Promise<{products: Array, nextCursor: string|null}>}
   */
  async getProducts(options = {}) {
    const { category, search, cursor, limit } = options;
    const params = {};

    if (category && category !== 'all') params.category = category;
    if (search) params.search = search;
    if (cursor) params.cursor = cursor;
    if (limit) params.limit = limit;

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
 
  /**
   * Fetch all products (simplified, for non-paginated views).
   * @returns {Promise<Array>}
   */
  async getAllProducts() {
    const response = await httpClient.get(`${BASE}/fetch-products`);
    return Array.isArray(response.data?.products) ? response.data.products : [];
  },

  /**
   * Fetch a single product by ID.
   *
   * @param {string} productId
   * @returns {Promise<Object|null>}
   */
  async getProduct(productId) {
    const response = await httpClient.get(`${BASE}/fetch-product`, {
      productId,
    });
    return response.data?.product || response.data || null;
  },

  /**
   * Check product stock availability.
   *
   * @param {string} productId
   * @param {number} [quantity=1]
   * @returns {Promise<{available: boolean, stock: number}>}
   */
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

  /**
   * Get featured products.
   * @returns {Promise<Array>}
   */
  async getFeaturedProducts() {
    const response = await httpClient.get(`${BASE}/fetch-product`, {
      featured: true,
    });
    return Array.isArray(response.data?.products) ? response.data.products : [];
  },
};

export default productService;
