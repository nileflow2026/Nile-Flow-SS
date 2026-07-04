/**
 * Discovery Service
 *
 * African facts, proverbs, and cultural content.
 */

import { httpClient } from '@api/client/HttpClient';

export const discoveryService = {
  /**
   * Fetch African facts with optional category filter.
   *
   * @param {Object} [options]
   * @param {string} [options.category] - 'nature' | 'culture' | 'history' | 'art' | 'wildlife'
   * @param {boolean} [options.featured]
   * @returns {Promise<Array>}
   */
  async getFacts(options = {}) {
    const { category, featured } = options;
    const params = {};
    if (category && category !== 'all') params.category = category;
    if (featured) params.featured = true;

    try {
      const response = await httpClient.get('/api/africa/facts', params);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.facts)) return data.facts;
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Fetch African proverbs with optional country filter.
   *
   * @param {Object} [options]
   * @param {string} [options.country]
   * @returns {Promise<Array>}
   */
  async getProverbs(options = {}) {
    const { country } = options;
    const params = {};
    if (country) params.country = country;

    try {
      const response = await httpClient.get('/api/africa/proverbs', params);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.proverbs)) return data.proverbs;
      return [];
    } catch {
      return [];
    }
  },
};

export default discoveryService;
