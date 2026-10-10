# Nile Flow Website  — API Integration Architecture

## Overview

This document describes the complete frontend integration layer for Website. The architecture is an enterprise-grade, clean, modular, and scalable backend integration designed for plug-and-play connectivity with the existing Nile Flow backend.

**Design Principles:**
- Zero API logic in React components
- Single HTTP client for all services
- Completely decoupled from UI
- Environment-driven configuration
- Normalized error handling everywhere
- Token management isolated from components
- Ready for future services (Nile Pay, Nile Miles, AI, etc.)

---

## Directory Structure

```
src/api/
├── client/
│   ├── HttpClient.js          # Core HTTP client (singleton)
│   └── index.js               # initializeApi() — register interceptors, bootstrap auth
├── config/
│   └── index.js               # Environment configuration (all from env vars)
├── interceptors/
│   ├── requestInterceptors.js  # Auth, Correlation ID, Device, Locale, Timezone
│   └── responseInterceptors.js # Token refresh, Maintenance mode, Logging
├── middleware/
│   └── (future)               # Retry dedup, offline queue, caching
├── auth/
│   ├── AuthManager.js          # Authentication orchestration (signin, signup, OAuth, etc.)
│   └── TokenManager.js         # Token storage & lifecycle (memory/localStorage/sessionStorage)
├── services/
│   ├── index.js                # Barrel exports
│   ├── productService.js       # Products
│   ├── categoryService.js      # Categories
│   ├── cartService.js          # Shopping cart
│   ├── orderService.js         # Orders & cancellations
│   ├── reviewService.js        # Product reviews & ratings
│   ├── searchService.js        # Product search, recent/popular searches
│   ├── paymentService.js       # Stripe, M-Pesa, subscriptions
│   ├── notificationService.js  # Customer notifications
│   ├── uploadService.js        # File uploads
│   ├── addressService.js       # User addresses
│   ├── groupBuyService.js      # Group buying
│   └── discoveryService.js     # African facts & proverbs
├── utils/
│   ├── errorNormalizer.js      # Error normalization & classification
│   └── helpers.js              # Device ID, URL builder, retry, etc.
├── types/
│   └── index.js                # JSDoc type definitions
├── hooks/
│   └── useAsync.js             # Generic async state hook
├── validation/
│   └── (future)                # Input validation schemas
└── README.md                   # Expanded documentation
```

## File Responsibilities

| File | Responsibility |
|------|---------------|
| `client/HttpClient.js` | Single axios-based HTTP client with retry, dedup, upload, download, offline detection |
| `client/index.js` | `initializeApi()` — registers all interceptors, bootstraps auth session validation |
| `config/index.js` | All env vars centralized. Never hardcode URLs/keys elsewhere |
| `interceptors/requestInterceptors.js` | 5 modular request interceptors: auth, correlation ID, device, locale, timezone |
| `interceptors/responseInterceptors.js` | 3 modular response interceptors: token refresh, maintenance mode, logging |
| `auth/AuthManager.js` | Orchestrates signup, signin, signout, OAuth, password reset, email verification, pickup address |
| `auth/TokenManager.js` | In-memory (default) or persistent token storage. JWT decode. Refresh dedup |
| `services/*.js` | One service per domain. Each returns normalized data. Components never call httpClient |
| `utils/errorNormalizer.js` | Normalizes all errors to `{ code, message, status, details }`. Classifies errors |
| `utils/helpers.js` | Device ID, URL builder, pagination parser, sleep, retry, dev logging |
| `hooks/useAsync.js` | `useReducer`-based hook: `{ status, data, error, loading, execute, reset }` |

## Service Responsibilities

| Service | Backend Endpoints Used |
|---------|----------------------|
| `productService` | `/api/customerprofile/fetch-product`, `/api/customerprofile/fetch-products`, `/api/admin/products/products/:id/stock` |
| `categoryService` | `/api/customerprofile/categories`, `/api/customerprofile/fetch-product` (with category) |
| `cartService` | `/cart/fetch/:userId`, `/cart/load/:userId`, `/cart/add`, `/cart/remove/:id`, `/cart/update/:id`, `/cart/clear/:userId`, `/cart/validate-stock` |
| `orderService` | `/api/orders/orders`, `/api/customerprofile/customer-orders`, `/api/orders/cancel-request`, `/api/orders/track/:id` |
| `reviewService` | `/api/customerprofile/fetch-reviews/:id`, `/api/customerprofile/submit-review`, `/api/customerprofile/increment-rating` |
| `searchService` | `/api/customerprofile/fetch-product` (with search), `/api/customerprofile/customer-searches`, `/api/customerprofile/customer-recent-search`, `/api/customerprofile/popular-searches`, `/api/customerprofile/clear-recent-search` |
| `paymentService` | `/api/subscription/subscribe`, `/api/subscription/status`, `/api/subscription/cancel`, `/api/subscription/renew`, `/api/subscription/payment-status/:id`, `/api/subscription/monthly-summary`, `/api/subscription/premium-deals`, `/api/premium/calculate-discount` |
| `notificationService` | `/api/customernotifications/customernotification`, `/api/customernotifications/createnotification` |
| `uploadService` | `/api/admin/upload-image` |
| `addressService` | `/api/addresses`, `/api/add/address`, `/api/addresses/:id` |
| `groupBuyService` | `/api/group-orders/:id`, `/api/group-orders/active`, `/api/group-orders/create`, `/api/group-orders/:id/join`, `/api/group-orders/:id/leave`, `/api/group-orders/:id/share` |
| `discoveryService` | `/api/africa/facts`, `/api/africa/proverbs` |

## Authentication Flow

```
User submits credentials
        │
        v
AuthManager.signIn({ email, password, rememberMe })
        │
        v
httpClient.post('/api/customerauth/signin/customer', { email, password, deviceId })
        │
        ├── Backend validates credentials
        ├── Backend sets httpOnly cookies (refresh token)
        ├── Backend returns JSON { accessToken, user }
        │
        v
TokenManager stores accessToken (memory / localStorage)
AuthManager caches user data
AuthManager notifies login listeners
AuthManager returns { success: true, data }

--- On subsequent requests ---

Request Interceptor automatically attaches:
    Authorization: Bearer <accessToken>
    X-Correlation-ID: <uuid>
    X-Platform: web
    X-Device-ID: <deviceId>
    Accept-Language: en
    X-Currency: KES
    X-Timezone: Africa/Nairobi

--- On 401 response ---

Token Refresh Interceptor:
    1. Queue the failed request
    2. POST /api/customerauth/refresh { deviceId }
    3. If success: store new tokens, retry all queued requests
    4. If failure: clear tokens, dispatch 'auth:logout' event
```

## Token Lifecycle

```
┌─────────────────────────────────────────────────┐
│                  TokenManager                    │
│  ┌─────────────┐  ┌──────────┐  ┌───────────┐  │
│  │ Access Token │  │Refresh   │  │ User Data │  │
│  │ (memory/    │  │Token     │  │ (cached)  │  │
│  │  storage)   │  │(storage) │  │           │  │
│  └─────────────┘  └──────────┘  └───────────┘  │
│                                                   │
│  Methods:                                         │
│  getAccessToken()   setAccessToken(token)         │
│  hasAccessToken()   isTokenExpired()              │
│  refreshToken(fn)   clearTokens()                 │
│  decodeToken()      reset()                       │
└─────────────────────────────────────────────────┘

Storage backends (configurable via VITE_TOKEN_STORAGE):
  memory (default)    → Map in JS memory. Lost on page refresh. Most XSS-safe.
  localStorage         → Persists across sessions. Use with "remember me".
  sessionStorage       → Persists within a tab session.
```

## Request Lifecycle

```
Component / Hook
        │
        v
Service method (e.g., productService.getProducts())
        │
        v
HttpClient.get('/api/customerprofile/fetch-product', { category, search })
        │
        ├── Offline check → reject with OFFLINE error
        ├── Deduplication check (GET only) → return in-flight promise
        │
        v
Request Interceptors (in order):
    1. Auth interceptor → attach Bearer token
    2. Correlation ID → attach X-Correlation-ID
    3. Device interceptor → attach X-Platform, X-App-Version, X-Device-ID
    4. Locale interceptor → attach Accept-Language, X-Currency
    5. Timezone interceptor → attach X-Timezone
        │
        v
Axios instance → send request
        │
        v
Response Interceptors (in order):
    1. Token refresh → catch 401, attempt refresh, retry
    2. Maintenance mode → check X-Maintenance-Mode header
    3. Logging → log timing in dev mode
        │
        ├── Success → HttpClient normalizes response shape
        ├── Error → HttpClient normalizes via errorNormalizer
        │
        v
Service method returns cleaned data
        │
        v
Component receives { success, data, message }
```

## Error Handling Strategy

All errors flow through `errorNormalizer.normalizeError()` which produces:

```js
{
  code: 'VALIDATION_ERROR',     // Domain error code
  message: 'Human-readable message',
  status: 400,                  // HTTP status (0 for network)
  details: [                    // Field-level errors
    { field: 'email', message: 'Email is required' }
  ],
  _normalized: true             // Prevents double-normalization
}
```

### Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | VALIDATION_ERROR | Invalid input |
| 401 | UNAUTHORIZED | Expired/missing token |
| 403 | FORBIDDEN | Insufficient permissions |
| 404 | NOT_FOUND | Resource not found |
| 409 | CONFLICT | Resource conflict |
| 422 | UNPROCESSABLE_ENTITY | Semantic validation failure |
| 429 | RATE_LIMITED | Too many requests |
| 500 | INTERNAL_SERVER_ERROR | Server error |
| 502-504 | BAD_GATEWAY / SERVICE_UNAVAILABLE / GATEWAY_TIMEOUT | Server unavailable |
| 0 | UNKNOWN_ERROR | Network failure / offline |

### Error Classification Helpers

```js
import { isAuthError, isNetworkError, isRetryable, isRateLimited } from '@api/utils/errorNormalizer'

if (isAuthError(error)) → redirect to login
if (isNetworkError(error)) → show "check connection" UI
if (isRetryable(error)) → auto-retry with backoff
if (isRateLimited(error)) → show "try later" message
```

## Retry Logic

The HttpClient has built-in retry with exponential backoff:

- Default: 3 retries, 1s base delay
- Retry only on: 408, 429, 500, 502, 503, 504
- Does NOT retry: 400, 401, 403, 404, 409, 422
- Access token refreshes are excluded from retry
- Per-request override via `_retryCount` and `_retryDelay` options

## Environment Configuration Guide

Copy `.env.example` to `.env` and configure:

```env
# Required
VITE_API_BASE_URL=https://nile-flow-backend-5dqm.onrender.com

# Optional defaults
VITE_API_TIMEOUT=30000
VITE_API_RETRY_COUNT=3
VITE_TOKEN_STORAGE=memory     # memory | localStorage | sessionStorage
VITE_LOCALE=en
VITE_CURRENCY=KES
```

All configuration is read in `src/api/config/index.js` via `import.meta.env`. Never use `process.env` or hardcoded URLs anywhere else.

## Integration Guide for Future Developers

### How to Add a New Service

1. Create `src/api/services/yourService.js`
2. Use `httpClient` for all API calls
3. Normalize errors with `normalizeError()`
4. Return clean data — never raw axios responses
5. Export from `src/api/services/index.js`

Example:
```js
// src/api/services/exampleService.js
import { httpClient } from '@api/client/HttpClient'

export const exampleService = {
  async getData(params) {
    const response = await httpClient.get('/api/v1/data', params)
    return response.data
  }
}
```

### How to Consume a Service in a Component

```jsx
// Option 1: useAsync hook
import { useAsync } from '@api/hooks/useAsync'
import { productService } from '@api/services'

function ProductList() {
  const { data, loading, error, execute } = useAsync(
    () => productService.getProducts({ category: 'electronics' }),
  )

  useEffect(() => { execute() }, [])

  if (loading) return <Loader />
  if (error) return <Error message={error.message} />
  return <Grid>{data?.products.map(p => <ProductCard key={p.$id} product={p} />)}</Grid>
}
```

### How to Add a New Interceptor

1. Add the interceptor function in `interceptors/requestInterceptors.js` or `responseInterceptors.js`
2. Register it in `client/index.js` inside `initializeApi()`

```js
// In client/index.js
httpClient.addRequestInterceptor(...Object.values(yourNewInterceptor()));
```

### How to Add a New Auth Method

Add it to `auth/AuthManager.js`. Follow the existing pattern:
- Use `httpClient` for API calls
- Use `tokenManager` for token operations
- Return `{ success, data, error }` shape
- Call `this._notifyLogin(user)` on successful authentication

## Future-Proofing

The architecture is designed to support:

- **Nile Pay**: Add `paymentService.nilePay()` method
- **Nile Miles**: Add `milesService.js` with loyalty operations
- **AI Commerce**: Add `aiService.js` for conversational flows
- **Vendor Portal**: Add `vendorService.js` for marketplace operations
- **Streaming**: HttpClient already supports `responseType: 'stream'`
- **Redux/Zustand**: Services remain unchanged — state management sits above them
- **React Query**: Wrap services in useQuery hooks — services don't change

The architecture scales horizontally: new domains = new service files. No existing code needs to change.
