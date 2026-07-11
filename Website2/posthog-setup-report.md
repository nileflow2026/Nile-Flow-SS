# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into the Nile Flow marketplace. PostHog is initialized in `src/app/providers/AppProviders.jsx` with the `PostHogProvider` and `PostHogErrorBoundary` wrapping the entire app. Environment variables `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` are set in `.env`. Users are identified on login, Google OAuth (popup and redirect), and signup — and `posthog.reset()` is called on logout to unlink future sessions.

| Event | Description | File |
|---|---|---|
| `user_signed_up` | User successfully created a new account on Nile Flow. | `src/features/auth/pages/SignupPage.jsx` |
| `user_logged_in` | User successfully signed in with email and password. | `src/features/auth/pages/LoginPage.jsx` |
| `user_logged_in_with_google` | User successfully signed in using Google OAuth popup flow. | `src/features/auth/pages/LoginPage.jsx` |
| `oauth_signin_completed` | User completed OAuth sign-in via the redirect callback flow. | `src/features/auth/pages/OAuthCallbackPage.jsx` |
| `user_signed_out` | User signed out from their account. | `src/shared/ui/header/AppHeader.jsx` |
| `add_to_cart` | User added a product to their shopping cart. | `src/features/products/pages/ProductDetailPage.jsx` |
| `checkout_started` | User clicked 'Continue to checkout' from their cart. | `src/features/cart/pages/CartPage.jsx` |
| `remove_from_cart` | User removed an individual item from their cart. | `src/features/cart/pages/CartPage.jsx` |
| `cart_cleared` | User cleared all items from their shopping cart. | `src/features/cart/pages/CartPage.jsx` |
| `order_placed` | User successfully placed an order at checkout. | `src/features/checkout/pages/CheckoutPage.jsx` |
| `order_placement_failed` | Order placement at checkout failed with an error. | `src/features/checkout/pages/CheckoutPage.jsx` |
| `group_buy_joined` | User clicked to join an existing group buy. | `src/features/group-buy/pages/GroupBuyPage.jsx` |
| `group_buy_started` | User clicked to start a new group buy. | `src/features/group-buy/pages/GroupBuyPage.jsx` |
| `search_performed` | User submitted a product search query. | `src/features/products/pages/SearchPage.jsx` |

## Next steps

We've built some insights and a dashboard for you to keep an eye on user behavior, based on the events we just instrumented:

- [Analytics basics (wizard) — Dashboard](https://us.posthog.com/project/437252/dashboard/1831784)
- [Purchase funnel (wizard)](https://us.posthog.com/project/437252/insights/0xLvUatf)
- [New user signups (wizard)](https://us.posthog.com/project/437252/insights/xLLlnCmY)
- [Orders placed over time (wizard)](https://us.posthog.com/project/437252/insights/Eogxsnzj)
- [Login methods breakdown (wizard)](https://us.posthog.com/project/437252/insights/pHQoVQiM)
- [Cart events over time (wizard)](https://us.posthog.com/project/437252/insights/i2lYg4vx)

## Verify before merging

- [ ] Run a full production build (the wizard only verified the files it touched) and fix any lint or type errors introduced by the generated code.
- [ ] Run the test suite — call sites that were rewritten or instrumented may need updated mocks or fixtures.
- [ ] Add `VITE_PUBLIC_POSTHOG_PROJECT_TOKEN` and `VITE_PUBLIC_POSTHOG_HOST` to `.env.example` and any monorepo/bootstrap scripts so collaborators know what to set.
- [ ] Wire source-map upload (`posthog-cli sourcemap` or your bundler's upload step) into CI so production stack traces de-minify.
- [ ] Confirm the returning-visitor path also calls `identify` — a handler that only identifies on fresh login can leave returning sessions on anonymous distinct IDs. Consider calling `posthog.identify()` in `AuthContext.jsx` when `initState` transitions to `READY` and a user session is found.

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.
