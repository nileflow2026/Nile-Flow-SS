/**
 * Vendor Service
 *
 * Public vendor API operations for the customer-facing storefront.
 * Components use this service — never call httpClient directly.
 */

import { httpClient } from '@api/client/HttpClient';

const BASE = '/api/customerprofile';

export const vendorService = {
  /**
   * Fetch public vendor information by vendor ID.
   *
   * @param {string} vendorId - The vendor's document ID
   * @returns {Promise<Object|null>}
   */
  async getVendorInfo(vendorId) {
    if (!vendorId) return null;
    const response = await httpClient.get(`${BASE}/vendor/${vendorId}`);
    return response.data?.vendor || null;
  },
};

export default vendorService;
