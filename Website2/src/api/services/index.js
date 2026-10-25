/**
 * Service Barrel Exports
 *
 * Import services from here:
 *   import { productService, cartService, httpClient } from '@api/services'
 *
 * Note: authService and secureTokenManager are now imported from @auth
 *   import { authService, secureTokenManager } from '@auth'
 */

export { httpClient } from '@api/client/HttpClient';

export { productService } from './productService';
export { vendorService } from './vendorService';
export { businessService } from './businessService';
export { categoryService } from './categoryService';
export { cartService } from './cartService';
export { orderService } from './orderService';
export { reviewService } from './reviewService';
export { searchService } from './searchService';
export { paymentService } from './paymentService';
export { notificationService } from './notificationService';
export { uploadService } from './uploadService';
export { addressService } from './addressService';
export { groupBuyService } from './groupBuyService';
export { discoveryService } from './discoveryService';
export { bannerService } from './bannerService';
export { teamMemberService } from './teamMemberService';
export { newsletterService } from './newsletterService';

export { initializeApi, getHttpClient } from '@api/client';
export { config } from '@api/config';
export { normalizeError, createError, isAuthError, isNetworkError, isRetryable } from '@api/utils/errorNormalizer';
export { getDeviceId, buildUrl, parsePaginatedResponse, retry, devLog } from '@api/utils/helpers';
