/**
 * Group Buy Service
 *
 * Group buying and social commerce operations.
 */

import { httpClient } from '@api/client/HttpClient';

const BASE = '/api/group-orders';

export const groupBuyService = {
  /**
   * Fetch a specific group deal by ID.
   *
   * @param {string} groupId
   * @returns {Promise<Object|null>}
   */
  async getGroup(groupId) {
    try {
      const response = await httpClient.get(`${BASE}/${groupId}`);
      return response.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Fetch active group deals for a product.
   *
   * @param {string} productId
   * @param {number} [limit=5]
   * @returns {Promise<Array>}
   */
  async getActiveGroups(productId, limit = 5) {
    try {
      const response = await httpClient.get(`${BASE}/active`, {
        productId,
        limit,
      });
      return Array.isArray(response.data?.documents) ? response.data.documents : [];
    } catch {
      return [];
    }
  },

  /**
   * Create a new group deal.
   *
   * @param {Object} groupData
   * @param {string} groupData.productId
   * @param {string} groupData.creatorId
   * @param {number} [groupData.maxParticipants=5]
   * @param {number} [groupData.basePrice]
   * @param {string} [groupData.priceStrategy='tiered']
   * @param {Array} [groupData.tiers]
   * @param {number} [groupData.ttlHours=24]
   * @param {string} [groupData.productName]
   * @param {string} [groupData.productImage]
   * @returns {Promise<{success: boolean, data?: *, error?: string}>}
   */
  async createGroup(groupData) {
    try {
      const response = await httpClient.post(`${BASE}/create`, {
        productId: groupData.productId,
        creatorId: groupData.creatorId,
        maxParticipants: groupData.maxParticipants ?? 5,
        basePrice: groupData.basePrice,
        priceStrategy: groupData.priceStrategy ?? 'tiered',
        tiers: groupData.tiers ?? null,
        ttlHours: groupData.ttlHours ?? 24,
        productName: groupData.productName ?? '',
        productImage: groupData.productImage ?? '',
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to create group deal' };
    }
  },

  /**
   * Join an existing group deal.
   *
   * @param {string} groupId
   * @param {string} userId
   * @returns {Promise<{success: boolean, data?: *, error?: string}>}
   */
  async joinGroup(groupId, userId) {
    try {
      const response = await httpClient.post(`${BASE}/${groupId}/join`, { userId });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to join group' };
    }
  },

  /**
   * Leave a group deal.
   *
   * @param {string} groupId
   * @param {string} userId
   * @returns {Promise<{success: boolean, data?: *, error?: string}>}
   */
  async leaveGroup(groupId, userId) {
    try {
      const response = await httpClient.post(`${BASE}/${groupId}/leave`, { userId });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to leave group' };
    }
  },

  /**
   * Get share data for a group deal.
   *
   * @param {string} groupId
   * @returns {Promise<{data?: *, error?: string}>}
   */
  async getShareData(groupId) {
    try {
      const response = await httpClient.get(`${BASE}/${groupId}/share`);
      return { data: response.data };
    } catch {
      return { error: 'Failed to get share data' };
    }
  },
};

export default groupBuyService;
