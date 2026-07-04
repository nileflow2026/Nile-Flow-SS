/**
 * Service Barrel Exports
 *
 * Import services from here:
 *   import { productService, cartService, authManager } from '@api/services'
 */

export { authManager } from '@api/auth/AuthManager';
export { tokenManager } from '@api/auth/TokenManager';
export { httpClient } from '@api/client/HttpClient';

export { productService } from './productService';
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

export { initializeApi, getHttpClient, getAuthManager } from '@api/client';
export { config } from '@api/config';
export { normalizeError, createError, isAuthError, isNetworkError, isRetryable } from '@api/utils/errorNormalizer';
export { getDeviceId, buildUrl, parsePaginatedResponse, retry, devLog } from '@api/utils/helpers';
