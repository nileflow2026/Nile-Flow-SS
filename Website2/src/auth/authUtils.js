/**
 * Auth Utilities
 *
 * Shared utility functions for the authentication system.
 * Pure functions — no side effects.
 */

/**
 * Extract and decode a JWT payload without validation.
 * Safe to use for display/debug purposes only.
 * Never use the decoded payload for auth decisions.
 * @param {string} token
 * @returns {Object|null}
 */
export function decodeJwtSafe(token) {
  if (!token || typeof token !== 'string') return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired based on its exp claim.
 * @param {string} token
 * @param {number} [bufferSeconds=5] - Buffer time in seconds
 * @returns {boolean}
 */
export function isJwtExpired(token, bufferSeconds = 5) {
  const payload = decodeJwtSafe(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= (payload.exp - bufferSeconds) * 1000;
}

/**
 * Calculate seconds until a JWT expires.
 * @param {string} token
 * @returns {number} 0 if expired or invalid
 */
export function secondsUntilExpiry(token) {
  const payload = decodeJwtSafe(token);
  if (!payload || !payload.exp) return 0;
  return Math.max(0, payload.exp - Math.floor(Date.now() / 1000));
}

/**
 * Validate that a string looks like a JWT (three base64url parts).
 * Does NOT verify the signature.
 * @param {string} token
 * @returns {boolean}
 */
export function isValidJwtFormat(token) {
  if (!token || typeof token !== 'string') return false;
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}

/**
 * Sanitize user data to remove sensitive fields before storing/caching.
 * @param {Object} user
 * @returns {Object}
 */
export function sanitizeUser(user) {
  if (!user) return null;
  const safe = { ...user };
  const sensitiveFields = ['password', 'token', 'secret', 'otp', 'twoFactorSecret',
    'pin', 'ssn', 'taxId', 'bankAccount', 'creditCard', 'cvv'];
  sensitiveFields.forEach((field) => delete safe[field]);
  return safe;
}

/**
 * Determine if an HTTP status code indicates an auth error.
 * @param {number} status
 * @returns {boolean}
 */
export function isAuthHttpError(status) {
  return [401, 403].includes(status);
}

/**
 * Generate a cryptographically-random token for CSRF protection.
 * @returns {string}
 */
export function generateCsrfToken() {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Extract client IP from request headers (server-side use).
 * @param {Object} headers
 * @returns {string}
 */
export function extractClientIp(headers) {
  return headers['x-forwarded-for']?.split(',')[0]?.trim()
    || headers['x-real-ip']
    || headers['cf-connecting-ip']
    || 'unknown';
}

/**
 * Normalize a role string to lowercase, safe format.
 * @param {string} role
 * @returns {string}
 */
export function normalizeRole(role) {
  if (!role) return 'guest';
  return role.toLowerCase().replace(/[^a-z_]/g, '');
}

/**
 * Check if two device IDs match (for device binding verification).
 * @param {string} storedDeviceId
 * @param {string} currentDeviceId
 * @returns {boolean}
 */
export function deviceMatches(storedDeviceId, currentDeviceId) {
  if (!storedDeviceId || !currentDeviceId) return false;
  return storedDeviceId === currentDeviceId;
}

/**
 * Create a secure random session ID.
 * @returns {string}
 */
export function createSecureSessionId() {
  const array = new Uint8Array(20);
  crypto.getRandomValues(array);
  return `sess_${Array.from(array, (b) => b.toString(36).padStart(2, '0')).join('')}`;
}
