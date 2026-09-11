/**
 * Banner Service
 *
 * Fetches and manages promotional banners for the homepage carousel.
 * GET /api/v1/banners — public, returns all banners
 * POST /api/v1/banners — admin only, creates a banner
 * PATCH /api/v1/banners/:bannerId — admin only, updates a banner
 * DELETE /api/v1/banners/:bannerId — admin only, deletes a banner
 */

import { httpClient } from '@api/client/HttpClient';

export const bannerService = {
  /**
   * Fetch all banners for the homepage carousel.
   * @returns {Promise<Array>} Array of banner objects
   */
  async getBanners() {
    const response = await httpClient.get('/api/v1/banners');
    return Array.isArray(response.data?.data)
      ? response.data.data
      : [];
  },

  /**
   * Create a new banner.
   * @param {Object} payload - Banner data (title, subtitle, cta, ctaHref, gradient, order, isActive)
   * @param {File} imageFile - Optional image file to upload
   * @returns {Promise<Object>} Response from the API
   */
  async createBanner(payload, imageFile = null) {
    const formData = new FormData();
    Object.keys(payload).forEach(key => {
      if (payload[key] !== null && payload[key] !== undefined) {
        formData.append(key, payload[key]);
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const response = await httpClient.post('/api/v1/banners', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Update an existing banner.
   * @param {string} bannerId - The ID of the banner to update
   * @param {Object} payload - Banner data to update
   * @param {File} imageFile - Optional image file to upload (replaces existing)
   * @returns {Promise<Object>} Response from the API
   */
  async updateBanner(bannerId, payload, imageFile = null) {
    const formData = new FormData();
    Object.keys(payload).forEach(key => {
      if (payload[key] !== null && payload[key] !== undefined) {
        formData.append(key, payload[key]);
      }
    });
    if (imageFile) {
      formData.append('image', imageFile);
    }

    const response = await httpClient.patch(`/api/v1/banners/${bannerId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  /**
   * Delete a banner.
   * @param {string} bannerId - The ID of the banner to delete
   * @returns {Promise<Object>} Response from the API
   */
  async deleteBanner(bannerId) {
    const response = await httpClient.delete(`/api/v1/banners/${bannerId}`);
    return response.data;
  },
};

export default bannerService;