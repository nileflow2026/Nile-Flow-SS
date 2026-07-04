/**
 * Payment Service
 *
 * Payment-related API operations including Stripe, M-Pesa, and subscription payments.
 */

import { httpClient } from '@api/client/HttpClient';

export const paymentService = {
  /**
   * Initiate a subscription payment.
   *
   * @param {string} paymentMethod - 'stripe' | 'mpesa'
   * @param {string} [phoneNumber] - Required for M-Pesa
   * @returns {Promise<{success: boolean, checkoutUrl?: string, checkoutRequestId?: string, requiresPolling?: boolean, error?: string}>}
   */
  async subscribe(paymentMethod, phoneNumber = null) {
    try {
      const payload = { paymentMethod };
      if (phoneNumber) payload.phoneNumber = phoneNumber;

      const response = await httpClient.post('/api/subscription/subscribe', payload);

      if (paymentMethod === 'stripe' && response.data?.checkoutUrl) {
        return { success: true, checkoutUrl: response.data.checkoutUrl };
      }

      if (paymentMethod === 'mpesa' && response.data?.checkoutRequestId) {
        return {
          success: true,
          checkoutRequestId: response.data.checkoutRequestId,
          requiresPolling: true,
        };
      }

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message || 'Subscription failed' };
    }
  },

  /**
   * Get the current subscription status.
   * @returns {Promise<{isPremium: boolean, expiresAt: string|null, subscriptionId?: string}>}
   */
  async getSubscriptionStatus() {
    try {
      const response = await httpClient.get('/api/subscription/status');
      return {
        isPremium: response.data?.isPremium ?? response.data?.isSubscribed ?? false,
        expiresAt: response.data?.expiresAt ?? response.data?.endDate ?? null,
        subscriptionId: response.data?.subscriptionId || null,
      };
    } catch {
      return { isPremium: false, expiresAt: null, subscriptionId: null };
    }
  },

  /**
   * Cancel the current subscription.
   * @returns {Promise<{success: boolean, data?: *, error?: string}>}
   */
  async cancelSubscription() {
    try {
      const response = await httpClient.post('/api/subscription/cancel');
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message || 'Cancellation failed' };
    }
  },

  /**
   * Renew an expired subscription.
   *
   * @param {string} paymentMethod
   * @param {string|null} phoneNumber
   * @returns {Promise<{success: boolean, checkoutRequestId?: string, requiresPolling?: boolean, error?: string}>}
   */
  async renewSubscription(paymentMethod, phoneNumber = null) {
    try {
      const payload = { paymentMethod };
      if (phoneNumber) payload.phoneNumber = phoneNumber;

      const response = await httpClient.post('/api/subscription/renew', payload);

      if (paymentMethod === 'mpesa' && response.data?.checkoutRequestId) {
        return {
          success: true,
          checkoutRequestId: response.data.checkoutRequestId,
          requiresPolling: true,
        };
      }

      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message || 'Renewal failed' };
    }
  },

  /**
   * Poll M-Pesa payment status.
   *
   * @param {string} checkoutRequestId
   * @returns {Promise<{status: string, isPremium?: boolean}>}
   */
  async checkPaymentStatus(checkoutRequestId) {
    try {
      const response = await httpClient.get(
        `/api/subscription/payment-status/${checkoutRequestId}`,
      );
      return {
        status: response.data?.status || 'pending',
        isPremium: response.data?.isPremium || false,
      };
    } catch {
      return { status: 'pending', isPremium: false };
    }
  },

  /**
   * Get monthly subscription summary for premium dashboard.
   * @returns {Promise<Object|null>}
   */
  async getMonthlySummary() {
    try {
      const response = await httpClient.get('/api/subscription/monthly-summary');
      return response.data || null;
    } catch {
      return null;
    }
  },

  /**
   * Get premium-exclusive deals.
   * @returns {Promise<{deals: Array}>}
   */
  async getPremiumDeals() {
    try {
      const response = await httpClient.get('/api/subscription/premium-deals');
      return {
        deals: Array.isArray(response.data?.deals) ? response.data.deals : [],
      };
    } catch {
      return { deals: [] };
    }
  },

  /**
   * Calculate premium discount for an order total.
   *
   * @param {number} orderTotal
   * @returns {Promise<Object>}
   */
  async calculateDiscount(orderTotal) {
    try {
      const response = await httpClient.post('/api/premium/calculate-discount', {
        orderTotal,
      });
      return response.data || { originalTotal: orderTotal, discountAmount: 0, newTotal: orderTotal };
    } catch {
      return { originalTotal: orderTotal, discountAmount: 0, newTotal: orderTotal };
    }
  },
};

export default paymentService;
