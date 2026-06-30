# DEPENDENCY CLEANUP REPORT

## Packages Removed from package.json

| Package | Reason | Bundle Impact | Risk Level |
|---------|--------|---------------|------------|
| `npm` (~50MB) | Tooling package — never imported in frontend code | ~50MB eliminated | Low |
| `install` | No-op package — never imported | Minimal | Low |
| `ioredis` | Server-only (Redis client) — not usable in browser | ~150KB eliminated | Low |
| `web-push` | Server-only (push notification library) | ~50KB eliminated | Low |
| `crypto` | Server-only (Node.js built-in stub) | ~15KB eliminated | Low |
| `@fortawesome/fontawesome-free` | Unused — lucide-react is the icon system | ~150KB eliminated | Low |
| `@fortawesome/fontawesome-svg-core` | FontAwesome dependency — not used | ~30KB eliminated | Low |
| `@fortawesome/free-brands-svg-icons` | FontAwesome dependency — not used | ~80KB eliminated | Low |
| `@fortawesome/free-solid-svg-icons` | FontAwesome dependency — not used | ~120KB eliminated | Low |
| `@fortawesome/react-fontawesome` | FontAwesome React wrapper — not used | ~20KB eliminated | Low |
| `react-icons` | Duplicate icon library — lucide already installed | ~80KB eliminated | Low |
| `react-slick` | Unused carousel library — react-responsive-carousel used | ~20KB eliminated | Low |
| `slick-carousel` | Unused carousel CSS — react-responsive-carousel used | ~10KB eliminated | Low |
| `react-parallax` | No imports found in any source file | ~15KB eliminated | Low |

## Total Estimated Bundle Savings: **~50.75MB+** (mostly from removing the `npm` package)

## Packages Kept (Verified Usage)

| Package | Files Using It |
|---------|---------------|
| `react`, `react-dom` | Core framework |
| `react-router-dom` | App.jsx and multiple pages |
| `axios` | api.js, context files, service files |
| `lucide-react` | Header.jsx, Footer.jsx, ProductCard.jsx, CategoryPage.jsx, etc. |
| `framer-motion` | Hero.jsx (animation on carousel text) |
| `react-toastify` | CartContext.jsx, multiple pages |
| `react-modal` | Multiple modal components |
| `react-responsive-carousel` | Hero.jsx |
| `@sentry/react` | main.jsx, App.jsx |
| `posthog-js` / `@posthog/react` | main.jsx, App.jsx |
| `@tanstack/react-query` | App.jsx, queryClient |
| `react-helmet-async` | main.jsx, SeoHead component |
| `i18n-js` | i18n.js, Header.jsx, Footer.jsx |
| `jwt-decode` | authServices.js |
| `socket.io-client` | NotificationService.js |
| `@stripe/react-stripe-js` | CheckoutPage.jsx |
| `terser` | Build minification in vite.config.js |

## main.jsx Cleanup
- Removed dynamic imports for `slick-carousel/slick/slick.css`
- Removed dynamic imports for `slick-carousel/slick/slick-theme.css`
- Removed dynamic imports for `@fortawesome/fontawesome-free`
