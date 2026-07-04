/**
 * Cart Service
 *
 * All cart-related API operations.
 * Handles adding, removing, updating quantities, and clearing cart.
 */

import { httpClient } from '@api/client/HttpClient';

const BASE = '/cart';

export const cartService = {
  /**
   * Fetch the current user's cart items.
   *
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async getCart(userId) {
    if (!userId) return [];
    try {
      const response = await httpClient.get(`${BASE}/fetch/${userId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  /**
   * Load cart from server by user ID.
   *
   * @param {string} userId
   * @returns {Promise<Array>}
   */
  async loadCart(userId) {
    if (!userId) return [];
    try {
      const response = await httpClient.get(`${BASE}/load/${userId}`);
      return Array.isArray(response.data) ? response.data : [];
    } catch {
      return [];
    }
  },

  /**
   * Add a product to the cart.
   *
   * @param {Object} item
   * @param {string} item.userId
   * @param {string} item.productId
   * @param {string} item.productName
   * @param {number} item.price
   * @param {string} [item.image]
   * @param {string} [item.userName]
   * @returns {Promise<{success: boolean, data?: *, error?: string}>}
   */
  async addToCart(item) {
    try {
      const response = await httpClient.post(`${BASE}/add`, item);
      return {
        success: response.success,
        data: response.data,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to add item to cart',
      };
    }
  },

  /**
   * Remove an item from the cart.
   *
   * @param {string} cartItemId
   * @returns {Promise<boolean>}
   */
  async removeFromCart(cartItemId) {
    try {
      await httpClient.delete(`${BASE}/remove/${cartItemId}`);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Update the quantity of a cart item.
   *
   * @param {string} cartItemId
   * @param {number} quantity
   * @returns {Promise<{success: boolean, quantity?: number, error?: string}>}
   */
  async updateQuantity(cartItemId, quantity) {
    try {
      const response = await httpClient.put(`${BASE}/update/${cartItemId}`, {
        quantity,
      });
      return {
        success: true,
        quantity: response.data?.quantity || quantity,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Failed to update quantity',
      };
    }
  },

  /**
   * Clear the entire cart for a user.
   *
   * @param {string} userId
   * @returns {Promise<boolean>}
   */
  async clearCart(userId) {
    try {
      await httpClient.delete(`${BASE}/clear/${userId}`);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validate stock availability for all items in cart.
   *
   * @param {Array} cart - Array of cart items
   * @param {string} userId
   * @returns {Promise<{isValid: boolean, errors: Array}>}
   */
  async validateStock(cart, userId) {
    try {
      const response = await httpClient.post(`${BASE}/validate-stock`, {
        cart,
        userId,
      });
      return {
        isValid: response.data?.isValid ?? true,
        errors: response.data?.errors || [],
      };
    } catch {
      return { isValid: false, errors: ['Failed to validate stock'] };
    }
  },
};

export default cartService;
