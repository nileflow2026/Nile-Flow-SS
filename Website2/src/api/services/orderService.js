/**
 * Order Service
 *
 * All order-related API operations including fetching, tracking, and cancellations.
 */

import { httpClient } from '@api/client/HttpClient';

export const orderService = {
  /**
   * Fetch all orders for the current user.
   * @returns {Promise<Array>}
   */
  async getOrders() {
    const response = await httpClient.get('/api/orders/orders');
    return Array.isArray(response.data?.response)
      ? response.data.response
      : Array.isArray(response.data?.orders)
        ? response.data.orders
        : [];
  },

  /**
   * Fetch customer-specific orders from profile endpoint.
   * @returns {Promise<Array>}
   */
  async getCustomerOrders() {
    const response = await httpClient.get('/api/customerprofile/customer-orders');
    return Array.isArray(response.data?.orders) ? response.data.orders : [];
  },

  /**
   * Get a single order by ID.
   * @param {string} orderId
   * @returns {Promise<Object|null>}
   */
  async getOrder(orderId) {
    try {
      const response = await httpClient.get(`/api/orders/orders/${orderId}`);
      return response.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Request an order cancellation.
   *
   * @param {Object} cancelData
   * @param {string} cancelData.orderId
   * @param {string} cancelData.reason
   * @param {string} [cancelData.additionalDetails]
   * @param {string} cancelData.userId
   * @param {string} [cancelData.customerEmail]
   * @param {string} [cancelData.customerName]
   * @returns {Promise<{success: boolean, data?: *, error?: string}>}
   */
  async cancelOrder(cancelData) {
    try {
      const response = await httpClient.post('/api/orders/cancel-request', cancelData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to cancel order' };
    }
  },

  /**
   * Track an order's delivery status.
   *
   * @param {string} orderId
   * @returns {Promise<Object|null>}
   */
  async trackOrder(orderId) {
    try {
      const response = await httpClient.get(`/api/orders/track/${orderId}`);
      return response.data || null;
    } catch {
      return null;
    }
  },
};

export default orderService;
