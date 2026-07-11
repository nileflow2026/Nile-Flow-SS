/**
 * Search Service
 *
 * Product search and recent/popular search tracking.
 */

import { httpClient } from '@api/client/HttpClient';

const BASE = '/api/customerprofile';

export const searchService = {
  /**
   * Search products by query.
   *
   * @param {string} query - Search term
   * @param {Object} [options]
   * @param {string} [options.category] - Filter by category
   * @param {string} [options.cursor] - Pagination cursor
   * @param {number} [options.limit] - Results per page
   * @returns {Promise<{products: Array, nextCursor: string|null, total: number}>}
   */
  async search(query, options = {}) {
    const { category, cursor, limit } = options;
    const params = { search: query };
    if (category) params.category = category;
    if (cursor) params.cursor = cursor;
    if (limit) params.limit = limit;

    const response = await httpClient.get(`${BASE}/fetch-product`, params);
    return {
      products: Array.isArray(response.data?.products) ? response.data.products : [],
      nextCursor: response.data?.nextCursor || null,
      total: response.data?.total || 0,
    };
  },

  /**
   * Save a recent search query for the authenticated user.
   *
   * @param {string} query
   * @returns {Promise<void>}
   */
  async saveRecentSearch(query) {
    try {
      const { secureTokenManager } = await import('@auth/tokenManager');
      const user = secureTokenManager.getUserData();
      const userId = user?.$id || user?.id;
      if (!userId) return;

      await httpClient.post(`${BASE}/customer-searches`, {
        userId,
        query,
      });
    } catch {
      // Silent fail — search tracking is non-critical
    }
  },

  /**
   * Get recent searches for the authenticated user.
   * @returns {Promise<Array>}
   */
  async getRecentSearches() {
    try {
      const response = await httpClient.get(`${BASE}/customer-recent-search`);
      return Array.isArray(response.data?.searches) ? response.data.searches : [];
    } catch {
      return [];
    }
  },

  /**
   * Get popular searches across all users.
   *
   * @param {number} [limit=6]
   * @returns {Promise<Array>}
   */
  async getPopularSearches(limit = 6) {
    try {
      const response = await httpClient.get(`${BASE}/popular-searches`, { limit });
      return Array.isArray(response.data?.searches) ? response.data.searches : [];
    } catch {
      return [];
    }
  },

  /**
   * Clear all recent searches for the authenticated user.
   * @returns {Promise<boolean>}
   */
  async clearRecentSearches() {
    try {
      await httpClient.delete(`${BASE}/clear-recent-search`);
      return true;
    } catch {
      return false;
    }
  },
};

export default searchService;
