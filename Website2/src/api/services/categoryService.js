/**
 * Category Service
 *
 * All category and discovery-related API operations.
 */

import { httpClient } from '@api/client/HttpClient';

const BASE = '/api/customerprofile';

export const categoryService = {
  /**
   * Fetch all product categories.
   * @returns {Promise<Array>}
   */
  async getCategories() {
    const response = await httpClient.get(`${BASE}/categories`);
    const data = response.data;
    // Handle both array and wrapped responses
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.categories)) return data.categories;
    if (Array.isArray(data?.data)) return data.data;
    return [];
  },

  /**
   * Fetch products within a specific category.
   *
   * @param {string} categorySlug - Category identifier
   * @param {Object} [options]
   * @param {string} [options.cursor]
   * @param {number} [options.limit]
   * @returns {Promise<{products: Array, nextCursor: string|null}>}
   */
  async getCategoryProducts(categorySlug, options = {}) {
    const { cursor, limit } = options;
    const response = await httpClient.get(`${BASE}/fetch-product`, {
      category: categorySlug,
      cursor,
      limit,
    });
    return {
      products: Array.isArray(response.data?.products) ? response.data.products : [],
      nextCursor: response.data?.nextCursor || null,
    };
  },
};

export default categoryService;
