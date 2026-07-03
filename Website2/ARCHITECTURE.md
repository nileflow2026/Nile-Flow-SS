# Nile Flow Website2 Architecture

This document defines the target filesystem architecture for Website2. It is designed for long-term growth from a commerce web app into a multi-product ecosystem spanning commerce, AI, loyalty, payments, education, health, and digital identity.

## 1. Architectural Goals

- Feature-first and domain-driven
- Scalable from 50 pages to 500+ pages
- Clear ownership boundaries
- Strong shared design system
- API-first integration
- AI-ready foundation
- Mobile and web alignment
- Testability and maintainability

## 2. Problems in the Current Website Structure

The current Website app is useful, but it shows several architectural weaknesses:

- A flat structure with mixed responsibilities under components, hooks, Pages, core, and utilities
- Shared and feature-specific concerns are not clearly separated
- API call logic is scattered instead of centralized
- Routing and layout responsibilities are not isolated enough for large-scale growth
- Business domains such as payments, premium, loyalty, and marketplace are not first-class modules
- A single app shell is likely to become difficult to evolve as the product expands

The new Website2 architecture avoids those problems by dividing the app into clear layers and domains.

## 3. Target Folder Tree

```txt
Website2/
├── README.md
├── ARCHITECTURE.md
├── CONTRIBUTING.md
├── index.html
├── package.json
├── vite.config.js
├── public/
├── src/
│   ├── app/
│   │   ├── bootstrap/
│   │   ├── router/
│   │   │   ├── public/
│   │   │   ├── authenticated/
│   │   │   ├── customer/
│   │   │   ├── vendor/
│   │   │   └── admin/
│   │   ├── providers/
│   │   ├── config/
│   │   ├── theme/
│   │   ├── store/
│   │   ├── analytics/
│   │   ├── error-boundary/
│   │   └── seo/
│   ├── shared/
│   │   ├── ui/
│   │   │   ├── button/
│   │   │   ├── card/
│   │   │   ├── input/
│   │   │   ├── badge/
│   │   │   ├── modal/
│   │   │   ├── drawer/
│   │   │   ├── tabs/
│   │   │   ├── table/
│   │   │   ├── dropdown/
│   │   │   ├── avatar/
│   │   │   ├── toast/
│   │   │   └── skeleton/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── constants/
│   │   ├── styles/
│   │   ├── types/
│   │   ├── validators/
│   │   ├── icons/
│   │   └── lib/
│   ├── features/
│   │   ├── home/
│   │   ├── auth/
│   │   ├── products/
│   │   ├── search/
│   │   ├── catalog/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── orders/
│   │   ├── wishlist/
│   │   ├── reviews/
│   │   ├── vendors/
│   │   ├── profile/
│   │   ├── notifications/
│   │   ├── support/
│   │   ├── premium/
│   │   ├── loyalty/
│   │   ├── payments/
│   │   └── content/
│   ├── commerce/
│   │   ├── cart/
│   │   ├── checkout/
│   │   ├── pricing/
│   │   ├── discounts/
│   │   ├── inventory/
│   │   ├── fulfillment/
│   │   └── returns/
│   ├── platform/
│   │   ├── identity/
│   │   ├── nile-pay/
│   │   ├── nile-miles/
│   │   ├── marketplace/
│   │   ├── analytics/
│   │   ├── admin-portal/
│   │   └── vendor-portal/
│   ├── ai/
│   │   ├── assistant/
│   │   ├── memory/
│   │   ├── recommendations/
│   │   ├── voice/
│   │   ├── chat/
│   │   └── prompts/
│   ├── api/
│   │   ├── client/
│   │   ├── auth/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── vendors/
│   │   ├── search/
│   │   ├── recommendations/
│   │   ├── notifications/
│   │   └── analytics/
│   ├── assets/
│   │   ├── images/
│   │   ├── illustrations/
│   │   ├── icons/
│   │   ├── logos/
│   │   ├── animations/
│   │   └── fonts/
│   ├── layouts/
│   │   ├── main/
│   │   ├── auth/
│   │   ├── checkout/
│   │   ├── admin/
│   │   ├── vendor/
│   │   └── minimal/
│   ├── tests/
│   │   ├── unit/
│   │   ├── integration/
│   │   └── e2e/
│   └── styles/
│       ├── tokens/
│       ├── themes/
│       └── utilities/
└── docs/
    ├── architecture/
    ├── runbooks/
    └── api/
```

## 4. Purpose of Each Top-Level Folder

### src/app
Owns application bootstrapping, providers, routing, global configuration, analytics, error handling, and state setup.

### src/shared
Contains reusable UI, hooks, utilities, design-system primitives, constants, and cross-cutting infrastructure that is not tied to one business feature.

### src/features
Contains business-facing modules such as auth, products, cart, checkout, premium, loyalty, and profile. Each feature owns its own pages, components, hooks, services, and types.

### src/commerce
Contains commerce infrastructure that is shared across multiple features, including pricing, discounts, inventory, fulfillment, and returns.

### src/platform
Contains platform-level capabilities that represent Nile Flow as a broader ecosystem: identity, payments, marketplace, analytics, admin, and vendor portals.

### src/ai
Prepares the product for AI-first commerce experiences such as search assistance, chat, recommendations, voice commerce, and memory.

### src/api
Centralizes all API contracts, request clients, and domain-specific service adapters. No feature should call Appwrite or backend endpoints directly from components.

### src/assets
Holds images, icons, illustrations, logos, animations, and fonts. All asset imports should be centralized here.

### src/layouts
Defines shell layouts for main app, auth, checkout, admin, vendor, and minimal experiences.

### src/tests
Contains unit, integration, and end-to-end testing structure for future automation.

### src/styles
Stores design tokens, themes, utilities, and global styling primitives.

## 5. Why This Architecture Is Better Than the Current Website Structure

This model is superior because it:

- separates business domains from shared infrastructure
- prevents the app from turning into a single giant folder of components
- makes ownership clear for teams and features
- supports lazy loading and route-based code splitting naturally
- helps scale to 500+ pages without creating a maintenance burden
- provides a clean foundation for AI, fintech, and multi-product expansion
- aligns with the long-term vision of Nile Flow as a platform rather than a simple storefront

## 6. Scaling Strategy for 10, 50, and 100 Developers

### 10 developers
A feature-first layout is enough for fast delivery. Teams can own feature folders independently while sharing the design system and platform layer.

### 50 developers
Domain ownership becomes critical. Each major domain such as commerce, payments, loyalty, marketplace, and platform services should have its own team and clear boundaries.

### 100 developers
The architecture becomes a true platform structure. Shared infrastructure, platform services, and contract boundaries must be standardized, and the app layer should enforce clear governance around shared modules and public APIs.

## 7. Recommended Path Aliases

Use aliases to avoid deep relative imports.

```js
{
  "@": "/src",
  "@app": "/src/app",
  "@shared": "/src/shared",
  "@features": "/src/features",
  "@commerce": "/src/commerce",
  "@platform": "/src/platform",
  "@ai": "/src/ai",
  "@api": "/src/api",
  "@assets": "/src/assets",
  "@layouts": "/src/layouts",
  "@styles": "/src/styles"
}
```

## 8. Naming Conventions

### Folders
- lowercase
- singular where appropriate
- descriptive
- no vague names such as misc, common, utils-only, or shared-old

### Files
- Feature modules: use descriptive names such as product-listing, checkout-summary, premium-banner
- React components: PascalCase
- Hooks: useFeatureName
- Services: featureService or featureApi
- Types: feature.types.ts
- Constants: feature.constants.ts

## 9. File Organization Conventions

Each feature should follow a predictable shape:

```txt
feature-name/
  components/
  hooks/
  pages/
  services/
  api/
  types/
  constants/
  utils/
  routes/
  index.ts
```

This consistency keeps the codebase easy to scan and easy to extend.

## 10. Import Conventions

- Prefer aliases over relative imports
- Keep imports from the nearest public boundary
- Do not import from deep internal implementation paths across domains
- Use barrel exports for stable feature entry points
- Avoid circular dependencies

## 11. Expansion Strategy for Future Nile Flow Ecosystem Capabilities

### Nile Pay
Add a dedicated platform module under src/platform/nile-pay with its own payments, wallets, settlement, and compliance boundaries.

### Nile Miles
Create dedicated loyalty modules under src/platform/nile-miles and src/features/loyalty.

### AI Commerce Assistant
Use src/ai/assistant and src/ai/recommendations for conversational commerce, product discovery, and shopping support.

### Spatial Commerce
Introduce future modules under src/features/spatial or src/platform/commerce-experience without disturbing the core commerce structure.

### Marketplace
Use src/platform/marketplace alongside feature-specific marketplace modules such as vendor discovery, listings, and onboarding.

### Vendor Portal
Use src/platform/vendor-portal and feature modules such as inventory, orders, payouts, and analytics.

### Admin Dashboard
Use src/platform/admin-portal with dedicated routes and feature modules for operations, moderation, and reporting.

### Analytics
Use src/platform/analytics and src/api/analytics as the canonical location for observability, business metrics, and experimentation.

### Loyalty
Use src/features/loyalty and src/platform/nile-miles for membership, rewards, retention, and engagement loops.

### Fintech
Use src/platform/nile-pay and src/commerce/pricing for financial primitives, settlement logic, and transaction orchestration.

### Health and Education
Add new product domains under src/features/content, src/platform/identity, and src/features/education or src/features/health without restructuring the whole app.

## 12. Final Direction

This architecture is designed to make Website2 feel like the foundation of a modern multi-product technology platform, not a single-page storefront. It gives Nile Flow the structure to grow into a continental digital infrastructure layer with strong product boundaries, clear ownership, and long-term maintainability.
