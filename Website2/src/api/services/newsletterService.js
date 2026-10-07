import { httpClient } from '@api/client/HttpClient';

export const newsletterService = {
  async subscribe(email) {
    try {
      const response = await httpClient.post('/api/admin/newsletter/subscribe', {
        email: email.trim(),
      });
      return {
        success: true,
        message: response.data?.message || 'Thank you for subscribing!',
      };
    } catch (error) {
      return {
        success: false,
        error: error.message || 'Unable to subscribe. Please try again.',
      };
    }
  },
};

export default newsletterService;
