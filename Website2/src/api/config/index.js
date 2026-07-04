/**
 * API Configuration
 *
 * Central environment configuration for the backend integration layer.
 * All URLs, keys, and runtime settings come from environment variables.
 * Never hardcode API URLs, secrets, or environment values anywhere else.
 */

const getEnv = (key, fallback = '') => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] ?? fallback;
  }
  return fallback;
};

// Detect dev mode safely
function isDev() {
  try {
    return import.meta.env.DEV === true;
  } catch {
    return false;
  }
}

export const config = {
  // ── Backend API ───────────────────────────────────────────────────
  api: {
    // In dev mode, use relative URLs so the Vite proxy handles them (avoid CORS).
    // In production, use the absolute backend URL.
    baseURL: isDev() ? '' : getEnv('VITE_API_BASE_URL', 'https://nile-flow-backend-5dqm.onrender.com'),
    timeout: parseInt(getEnv('VITE_API_TIMEOUT', 30000), 10),
    retryCount: parseInt(getEnv('VITE_API_RETRY_COUNT', 3), 10),
    retryDelay: parseInt(getEnv('VITE_API_RETRY_DELAY', 1000), 10),
    withCredentials: false,
  },

  // ── Authentication ────────────────────────────────────────────────
  auth: {
    tokenRefreshEndpoint: '/api/customerauth/refresh',
    tokenRefreshRetries: 2,
    sessionValidationEndpoint: '/api/customerauth/validate-session',
    deviceIdStorageKey: 'nf_device_id',
  },

  // ── Token Management ──────────────────────────────────────────────
  tokens: {
    accessTokenKey: 'nf_access_token',
    refreshTokenKey: 'nf_refresh_token',
    userDataKey: 'nf_user_data',
    storage: getEnv('VITE_TOKEN_STORAGE', 'memory'), // 'memory' | 'localStorage' | 'sessionStorage'
  },

  // ── Cache ─────────────────────────────────────────────────────────
  cache: {
    staleTime: parseInt(getEnv('VITE_CACHE_STALE_TIME', 300000), 10), // 5 min
    gcTime: parseInt(getEnv('VITE_CACHE_GC_TIME', 600000), 10), // 10 min
  },

  // ── Application ───────────────────────────────────────────────────
  app: {
    name: 'Nile Flow',
    version: '1.0.0',
    platform: 'web',
    locale: getEnv('VITE_LOCALE', 'en'),
    currency: getEnv('VITE_CURRENCY', 'KES'),
  },

  // ── Currency API ──────────────────────────────────────────────────
  currency: {
    ratesEndpoint: '/api/currency/rates',
    detectEndpoint: '/api/currency/detect',
    baseCurrency: 'KES',
    ratesCacheTTL: 4 * 60 * 60 * 1000, // 4 hours
  },

  // ── Feature Flags ─────────────────────────────────────────────────
  features: {
    enableOAuth: getEnv('VITE_ENABLE_OAUTH', 'true') === 'true',
    enablePushNotifications:
      getEnv('VITE_ENABLE_PUSH_NOTIFICATIONS', 'false') === 'true',
    enableWebSockets: getEnv('VITE_ENABLE_WEBSOCKETS', 'false') === 'true',
    enableDebugLogging:
      getEnv('VITE_ENABLE_DEBUG_LOGGING', 'false') === 'true',
  },

  // ── Monitoring ────────────────────────────────────────────────────
  monitoring: {
    sentryDSN: getEnv('VITE_SENTRY_DSN', ''),
    posthogKey: getEnv('VITE_POSTHOG_KEY', ''),
    logLevel: getEnv('VITE_LOG_LEVEL', 'warn'),
  },

  // ── OAuth ─────────────────────────────────────────────────────────
  oauth: {
    googleRedirectUri: getEnv('VITE_GOOGLE_REDIRECT_URI', ''),
    facebookRedirectUri: getEnv('VITE_FACEBOOK_REDIRECT_URI', ''),
  },

  // ── Payments ──────────────────────────────────────────────────────
  payments: {
    stripePublishableKey: getEnv('VITE_STRIPE_PUBLISHABLE_KEY', ''),
    mpesaPollInterval: parseInt(getEnv('VITE_MPESA_POLL_INTERVAL', 3000), 10),
    mpesaPollMaxDuration: parseInt(
      getEnv('VITE_MPESA_POLL_MAX_DURATION', 120000),
      10,
    ),
  },

  // ── WebSocket ─────────────────────────────────────────────────────
  websocket: {
    url: getEnv('VITE_WS_URL', ''),
    reconnectAttempts: 5,
    reconnectDelay: 1000,
  },

  // ── Pagination ────────────────────────────────────────────────────
  pagination: {
    defaultPageSize: parseInt(getEnv('VITE_DEFAULT_PAGE_SIZE', 20), 10),
    maxPageSize: 100,
  },

  // ── Upload ────────────────────────────────────────────────────────
  upload: {
    maxFileSize: parseInt(getEnv('VITE_MAX_UPLOAD_SIZE', 5242880), 10), // 5MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  },
};

export default config;
