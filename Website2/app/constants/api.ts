export const API = {
  BASE_URL: import.meta.env.VITE_API_URL || "https://nile-flow-backend.onrender.com",
  TIMEOUT: 15000,
  RETRY_ATTEMPTS: 3,
  ENDPOINTS: {
    AUTH: {
      SIGN_IN: "/api/auth/sign-in",
      SIGN_UP: "/api/auth/sign-up",
      FORGOT_PASSWORD: "/api/auth/forgot-password",
      RESET_PASSWORD: "/api/auth/reset-password",
      REFRESH: "/api/auth/refresh",
      OAUTH: "/api/auth/oauth",
    },
    PRODUCTS: {
      LIST: "/api/products",
      DETAIL: (id: string) => `/api/products/${id}`,
      CATEGORIES: "/api/products/categories",
      FEATURED: "/api/products/featured",
      DEALS: "/api/products/deals",
      SEARCH: "/api/products/search",
    },
    CART: {
      GET: "/api/cart",
      ADD: "/api/cart/add",
      UPDATE: "/api/cart/update",
      REMOVE: "/api/cart/remove",
    },
    ORDERS: {
      LIST: "/api/orders",
      DETAIL: (id: string) => `/api/orders/${id}`,
      CREATE: "/api/orders",
      CANCEL: (id: string) => `/api/orders/${id}/cancel`,
      TRACK: (id: string) => `/api/orders/${id}/track`,
    },
    PREMIUM: {
      SUBSCRIBE: "/api/premium/subscribe",
      CANCEL: "/api/premium/cancel",
      STATUS: "/api/premium/status",
    },
    MILES: {
      BALANCE: "/api/miles/balance",
      HISTORY: "/api/miles/history",
      REDEEM: "/api/miles/redeem",
    },
    GROUP_BUYING: "/api/group-buying",
    NOTIFICATIONS: {
      LIST: "/api/notifications",
      MARK_READ: (id: string) => `/api/notifications/${id}/read`,
      SETTINGS: "/api/notifications/settings",
    },
    ADDRESSES: {
      LIST: "/api/addresses",
      CREATE: "/api/addresses",
      UPDATE: (id: string) => `/api/addresses/${id}`,
      DELETE: (id: string) => `/api/addresses/${id}`,
    },
    USER: {
      PROFILE: "/api/user/profile",
      UPDATE: "/api/user/update",
    },
    PAYMENT: {
      CREATE_INTENT: "/api/payment/create-intent",
      CONFIRM: "/api/payment/confirm",
    },
  },
} as const;
