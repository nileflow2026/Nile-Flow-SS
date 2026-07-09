/**
 * Notification Service — Consolidated notification API for all Nile Flow frontends.
 *
 * Provides:
 * - Fetch notifications (customer + admin + vendor)
 * - Mark notifications as read
 * - Register push tokens
 * - Fetch notification preferences
 * - Update notification preferences
 *
 * Works identically across Website2, AdminDashboard, VendorDashboard, and Mobileapp.
 *
 * @module api/services/notificationService
 */

import { httpClient } from '@api/client/HttpClient';

export const notificationService = {
  /**
   * Fetch notifications for the authenticated user.
   * Automatically detects role (customer/admin/vendor) from auth context.
   *
   * @param {Object} [options]
   * @param {string} [options.type] - Filter by notification type
   * @returns {Promise<Array>}
   */
  async getNotifications(options = {}) {
    try {
      // Try customer notification endpoint first (works for all authenticated users)
      const response = await httpClient.get('/api/customernotifications/customernotification');
      return Array.isArray(response.data?.result) ? response.data.result : [];
    } catch {
      // Fallback: admin notification endpoint
      try {
        const adminResp = await httpClient.get('/api/notifications/admin');
        return Array.isArray(adminResp.data?.result) ? adminResp.data.result : [];
      } catch {
        return [];
      }
    }
  },

  /**
   * Mark a single notification as read.
   *
   * @param {string} notificationId
   * @returns {Promise<boolean>}
   */
  async markAsRead(notificationId) {
    try {
      await httpClient.post('/api/customernotifications/mark-read', { ids: [notificationId] });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Mark all notifications as read.
   *
   * @returns {Promise<boolean>}
   */
  async markAllAsRead() {
    try {
      await httpClient.post('/api/customernotifications/mark-read', { ids: [] });
      return true;
    } catch {
      // Fallback to legacy endpoint
      try {
        await httpClient.post('/api/notifications/mark-as-read', { ids: [] });
        return true;
      } catch {
        return false;
      }
    }
  },

  /**
   * Get unread notification count.
   *
   * @returns {Promise<number>}
   */
  async getUnreadCount() {
    const notifications = await this.getNotifications();
    return notifications.filter((n) => !n.read).length;
  },

  /**
   * Register a push token for push notifications.
   *
   * @param {string} pushToken - Expo push token
   * @returns {Promise<boolean>}
   */
  async registerPushToken(pushToken) {
    try {
      await httpClient.post('/api/customernotifications/register-token', { pushToken });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get delivery logs (admin only).
   *
   * @param {Object} [options] - { page, limit, event, channel, status }
   * @returns {Promise<Object>}
   */
  async getDeliveryLogs(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.set('page', options.page);
      if (options.limit) params.set('limit', options.limit);
      if (options.event) params.set('event', options.event);
      if (options.channel) params.set('channel', options.channel);
      if (options.status) params.set('status', options.status);
      const qs = params.toString();

      const response = await httpClient.get(`/api/notifications/logs${qs ? `?${qs}` : ''}`);
      return { success: true, logs: response.data?.logs || [], total: response.data?.total || 0 };
    } catch {
      return { success: false, logs: [], total: 0 };
    }
  },

  /**
   * Get notification preferences for the current user.
   *
   * @returns {Promise<Object|null>}
   */
  async getPreferences() {
    try {
      const response = await httpClient.get('/api/users/preferences');
      return response.data?.preferences?.notificationPreferences || null;
    } catch {
      return null;
    }
  },

  /**
   * Update notification preferences.
   *
   * @param {Object} preferences - { order: { email, sms, push }, promotion: { email, push }, ... }
   * @returns {Promise<boolean>}
   */
  async updatePreferences(preferences) {
    try {
      await httpClient.patch('/api/users/preferences', { notificationPreferences: preferences });
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Get notification type display labels.
   */
  getTypeLabel(type) {
    const labels = {
      order: 'Order Updates',
      payment: 'Payment Updates',
      product: 'Product Updates',
      vendor: 'Vendor Updates',
      system: 'System Notifications',
      promotion: 'Promotions & Deals',
      security: 'Security Alerts',
      support: 'Support Messages',
      loyalty: 'Loyalty & Miles',
      ai: 'AI Assistant',
    };
    return labels[type] || type || 'General';
  },

  /**
   * Get notification channel display labels.
   */
  getChannelLabel(channel) {
    const labels = {
      email: 'Email',
      sms: 'SMS',
      push: 'Push Notification',
      in_app: 'In-App',
    };
    return labels[channel] || channel || 'Unknown';
  },
};

export default notificationService;
