/**
 * Notification Service
 *
 * Fetching and managing customer notifications.
 * Push notification subscription is handled separately.
 */

import { httpClient } from '@api/client/HttpClient';

const BASE = '/api/customernotifications';

export const notificationService = {
  /**
   * Fetch all notifications for the authenticated user.
   * @returns {Promise<Array>}
   */
  async getNotifications() {
    try {
      const response = await httpClient.get(`${BASE}/customernotification`);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.result)) return data.result;
      if (Array.isArray(data?.notifications)) return data.notifications;
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Create a new notification.
   *
   * @param {Object} notification
   * @param {string} notification.message
   * @param {string} [notification.type]
   * @param {string} [notification.username]
   * @param {string} [notification.email]
   * @param {string} [notification.userId]
   * @returns {Promise<Object|null>}
   */
  async createNotification(notification) {
    try {
      const response = await httpClient.post(`${BASE}/createnotification`, {
        message: notification.message,
        type: notification.type || 'info',
        username: notification.username,
        email: notification.email,
        userId: notification.userId,
      });
      return response.data?.notification || null;
    } catch {
      return null;
    }
  },

  /**
   * Mark a notification as read (local state update).
   * @param {string} _notificationId
   */
  markAsRead(_notificationId) {
    // Local state management is handled by the context layer.
    // This method exists for API-based read tracking in the future.
  },

  /**
   * Mark all notifications as read (local state update).
   */
  markAllAsRead() {
    // Local state management is handled by the context layer.
  },

  /**
   * Clear all notifications (local state update).
   */
  clearAll() {
    // Local state management is handled by the context layer.
  },
};

export default notificationService;
