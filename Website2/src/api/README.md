# Nile Flow API Integration Layer

## Architecture Overview

The API layer is a clean, modular, enterprise-grade backend integration architecture for Website2. It is completely decoupled from UI components and designed for plug-and-play connectivity to the existing Nile Flow backend.

```
src/api/
├── client/          # Core HTTP client and factory
├── config/          # Environment and endpoint configuration
├── interceptors/    # Request/response interceptors
├── middleware/      # Retry, offline, cache middleware
├── auth/            # Authentication and token management
├── services/        # Domain-specific service modules
├── utils/           # Error normalization, pagination, uploads
├── types/           # Type definitions
├── hooks/           # React hooks for API consumption
├── validation/      # Input validation schemas
└── index.js         # Barrel exports
```

## Key Design Decisions

1. **Single HTTP Client**: One `HttpClient` instance serves all services. No more multiple axios clients.
2. **Token Management Isolated**: Components never touch tokens. The `TokenManager` handles everything.
3. **Domain Services**: Each business domain has its own service module. Services never call each other.
4. **Normalized Responses**: The `ResponseNormalizer` ensures all API responses have a predictable shape.
5. **Interceptor Pipeline**: Request and response interceptors are modular composable functions.
6. **Environment Driven**: All URLs, keys, and configuration come from environment variables.

## How to Connect to Backend

1. Copy `.env.example` to `.env`
2. Set `VITE_API_BASE_URL=https://nile-flow-backend-5dqm.onrender.com`
3. Set any other required env vars
4. Import services from `@api/services` in your components

## Service Usage Pattern

```js
import { productService } from '@api/services'

// In a component or hook:
const { data, error, loading } = await productService.getProducts({ category: 'electronics' })
```

## Authentication Flow

1. User signs in → `authManager.signIn()` → backend sets httpOnly cookies + returns tokens
2. `tokenManager` stores tokens securely
3. `authInterceptor` attaches Authorization header to every request
4. On 401 → `tokenRefreshInterceptor` attempts silent refresh
5. On refresh failure → `sessionManager` handles logout

## Token Lifecycle

- Access Token: Short-lived (15 min), stored in memory
- Refresh Token: Long-lived (7 days), stored in httpOnly cookie
- Device ID: Generated once per session, stored in sessionStorage

## Error Handling Strategy

All errors are normalized through `errorNormalizer` into a standard shape:
```js
{
  success: false,
  code: 'VALIDATION_ERROR',
  message: 'Human-readable message',
  details: []  // Field-level errors
}
