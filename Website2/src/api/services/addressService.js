/**
 * Address Service
 *
 * User address management — fetch, add, update, delete addresses.
 */

import { httpClient } from '@api/client/HttpClient';

export const addressService = {
  /**
   * Fetch all saved addresses for the authenticated user.
   * @returns {Promise<Array>}
   */
  async getAddresses() {
    try {
      const response = await httpClient.get('/api/nilemart/addresses');
      const data = response.data;
      const addresses = Array.isArray(data)
        ? data
        : data?.addresses || data?.result || data?.data;
      if (!Array.isArray(addresses)) return [];

      return addresses.map((address) => ({
        ...address,
        id: address.id || address.$id,
        label: address.label || address.type || 'Delivery address',
        street: address.street || address.address || '',
        city: address.city || '',
        phone: address.phone || '',
        default: address.default === true || address.isDefault === true,
      }));
    } catch {
      return [];
    }
  },

  /**
   * Add a new address.
   *
   * @param {Object} addressData
   * @returns {Promise<{success: boolean, data?: *, error?: string}>}
   */
  async addAddress(addressData) {
    try {
      const response = await httpClient.post('/api/nilemart/add/address', {
        ...addressData,
        address: addressData.address || addressData.street,
        fullName: addressData.fullName || addressData.label,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to add address' };
    }
  },

  /**
   * Update an existing address.
   *
   * @param {string} addressId
   * @param {Object} addressData
   * @returns {Promise<{success: boolean, data?: *, error?: string}>}
   */
  async updateAddress(addressId, addressData) {
    try {
      const response = await httpClient.put(`/api/nilemart/addresses/${addressId}`, addressData);
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to update address' };
    }
  },

  /**
   * Delete an address.
   *
   * @param {string} addressId
   * @returns {Promise<boolean>}
   */
  async deleteAddress(addressId) {
    try {
      await httpClient.delete(`/api/nilemart/addresses/${addressId}`);
      return true;
    } catch {
      return false;
    }
  },
};

export default addressService;
