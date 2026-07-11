/**
 * Order Service — Consolidated order API operations.
 *
 * All order-related API calls go through this service.
 * Uses the new consolidated /api/orders/* endpoints.
 * Falls back to legacy endpoints for backward compatibility
 * during migration.
 *
 * @module api/services/orderService
 */

import { httpClient } from '@api/client/HttpClient';

export const orderService = {
  /**
   * Fetch all orders for the current user (with pagination).
   * Uses the new consolidated endpoint first, falls back to legacy.
   *
   * @param {Object} [options] - { page, limit, status }
   * @returns {Promise<Array>}
   */
  async getOrders(options = {}) {
    const params = new URLSearchParams();
    if (options.page) params.set('page', options.page);
    if (options.limit) params.set('limit', options.limit);
    if (options.status) params.set('status', options.status);
    const qs = params.toString();

    try {
      // Try the new consolidated endpoint
      const response = await httpClient.get(`/api/orders/mine${qs ? `?${qs}` : ''}`);
      return Array.isArray(response.data?.orders)
        ? response.data.orders
        : Array.isArray(response.data?.response)
          ? response.data.response
          : [];
    } catch {
      // Fallback to legacy endpoints
      try {
        const legacy = await httpClient.get('/api/orders/orders');
        const orders =
          Array.isArray(legacy.data?.response)
            ? legacy.data.response
            : Array.isArray(legacy.data?.orders)
              ? legacy.data.orders
              : [];

        if (orders.length === 0) {
          const customerOrders = await httpClient.get('/api/customerprofile/customer-orders');
          return Array.isArray(customerOrders.data?.orders) ? customerOrders.data.orders : [];
        }

        return orders;
      } catch {
        return [];
      }
    }
  },

  /**
   * Fetch customer-specific orders from profile endpoint.
   * @returns {Promise<Array>}
   */
  async getCustomerOrders() {
    try {
      const response = await httpClient.get('/api/customerprofile/customer-orders');
      return Array.isArray(response.data?.orders) ? response.data.orders : [];
    } catch {
      return [];
    }
  },

  /**
   * Get a single order by ID or order number.
   *
   * @param {string} orderId - Document ID or NF-YYYY order number
   * @returns {Promise<Object|null>}
   */
  async getOrder(orderId) {
    try {
      // Try the new consolidated endpoint
      const response = await httpClient.get(`/api/orders/${orderId}`);
      return response.data?.data || response.data || null;
    } catch {
      // Fallback to legacy endpoint
      try {
        const legacy = await httpClient.get(`/api/orders/orders/${orderId}`);
        return legacy.data || null;
      } catch {
        return null;
      }
    }
  },

  /**
   * Create a new Cash-on-Delivery order.
   *
   * @param {Object} orderData - { cart, userId, customerEmail, username, totalAmount, currency }
   * @returns {Promise<Object>} - { success, orderId, orderNumber, message }
   */
  async createOrder(orderData) {
    try {
      const response = await httpClient.post('/api/orders', orderData);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to create order',
        data: error.data || null,
      };
    }
  },

  /**
   * Request an order cancellation.
   *
   * @param {Object} cancelData
   * @param {string} cancelData.orderId
   * @param {string} cancelData.reason
   * @param {string} [cancelData.additionalDetails]
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
   * Directly cancel a COD order.
   *
   * @param {string} orderId
   * @returns {Promise<{success: boolean, data?: *, error?: string}>}
   */
  async cancelCodOrder(orderId) {
    try {
      const response = await httpClient.post('/api/orders/cancel', { orderId });
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
      const response = await httpClient.get(`/api/orders/tracking/${orderId}`);
      return response.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Get order status with full details (replaces old getOrder for tracking).
   *
   * @param {string} orderId
   * @returns {Promise<Object|null>}
   */
  async getOrderStatus(orderId) {
    try {
      const response = await httpClient.get(`/api/orders/tracking/${orderId}`);
      return response.data?.data || response.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Get the status colour for a given order status.
   *
   * @param {string} status
   * @returns {string} - Badge variant name
   */
  getStatusColor(status) {
    const colors = {
      Delivered: 'success',
      delivered: 'success',
      completed: 'success',
      Processing: 'default',
      processing: 'primary',
      preparing: 'primary',
      Shipped: 'primary',
      shipped: 'primary',
      ready_for_dispatch: 'primary',
      out_for_delivery: 'primary',
      Cancelled: 'warning',
      cancelled: 'warning',
      rejected: 'warning',
      failed: 'warning',
      Pending: 'default',
      pending: 'default',
      confirmed: 'primary',
      Ordered: 'primary',
      ordered: 'primary',
      refunded: 'warning',
    };
    return colors[status] || 'default';
  },

  /**
   * Get the human-readable label for an order status.
   *
   * @param {string} status
   * @returns {string}
   */
  getStatusLabel(status) {
    const labels = {
      pending: 'Order Placed',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready_for_dispatch: 'Ready for Dispatch',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered',
      completed: 'Completed',
      cancelled: 'Cancelled',
      rejected: 'Rejected',
      failed: 'Failed',
    };
    return labels[status] || status;
  },
};

export default orderService;
