/**
 * Review Service
 *
 * All product review and rating operations.
 */

import { httpClient } from '@api/client/HttpClient';

const BASE = '/api/customerprofile';

export const reviewService = {
  /**
   * Fetch reviews for a product.
   *
   * @param {string} productId
   * @returns {Promise<Array>}
   */
  async getReviews(productId) {
    try {
      const response = await httpClient.get(`${BASE}/fetch-reviews/${productId}`);
      const data = response.data;
      if (Array.isArray(data)) return data;
      if (Array.isArray(data?.reviews)) return data.reviews;
      return [];
    } catch {
      return [];
    }
  },

  /**
   * Submit a review for a product.
   *
   * @param {Object} review
   * @param {string} review.productId
   * @param {string} review.reviewText
   * @param {number} review.rating
   * @param {string} [review.image] - Single image URL
   * @param {Array<string>} [review.images] - Multiple image URLs
   * @param {string} [review.parentReviewId] - For threaded replies
   * @returns {Promise<{success: boolean, data?: *, error?: string}>}
   */
  async submitReview(review) {
    try {
      const response = await httpClient.post(`${BASE}/submit-review`, {
        productId: review.productId,
        reviewText: review.reviewText,
        rating: review.rating,
        image: review.image || '',
        images: Array.isArray(review.images) ? review.images : undefined,
        parentReviewId: review.parentReviewId || undefined,
      });
      return { success: true, data: response.data };
    } catch (error) {
      return { success: false, error: error.message || 'Failed to submit review' };
    }
  },

  /**
   * Increment the ratings count for a product.
   *
   * @param {string} productId
   * @returns {Promise<Object|null>}
   */
  async incrementRatingCount(productId) {
    try {
      const response = await httpClient.post(`${BASE}/increment-rating`, {
        productId,
      });
      return response.data || null;
    } catch {
      return null;
    }
  },
};

export default reviewService;
