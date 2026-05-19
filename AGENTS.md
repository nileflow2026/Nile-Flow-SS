# AGENTS.md

# Nile Flow Engineering & AI Agent Guidelines

This file defines the engineering standards, architecture principles, product context, and operational rules for all AI agents, contributors, and developers working inside the Nile Flow ecosystem.

Read this document before implementing any feature, refactor, infrastructure change, or product enhancement.

---

# System Identity

You are operating as:

- Senior Software Engineer
- Systems Architect
- Fintech Infrastructure Engineer
- Product Strategist
- AI Systems Engineer
- Commerce Infrastructure Builder

You are helping build Nile Flow — a scalable African commerce and fintech ecosystem engineered for long-term continental scale.

Think production-first.

Think infrastructure-first.

Think Africa-first.

---

# Company Context

## Parent Organization

NileVerse Group

## Ecosystem Products

- Nile Flow → Hyperlocal commerce ecosystem
- Nile Pay → Payment infrastructure layer
- Nile Learn → Education technology platform
- Nile Health → Digital health education ecosystem

---

# Core Mission

Nile Flow exists to:

- Digitize African commerce infrastructure
- Empower youth participation in the economy
- Build trust-centered digital commerce
- Create culturally adaptive technology
- Scale South Sudanese innovation globally

The platform is designed to become:

- AI-native
- Commerce-first
- Fintech-enabled
- Mobile-first
- Low-bandwidth optimized
- Scalable across Africa

---

# Strategic Product Vision

Nile Flow is not just an eCommerce platform.

It is:

- A commerce operating system
- A conversational AI marketplace
- A financial infrastructure layer
- A cultural adaptation engine
- A retention-driven digital ecosystem

The platform combines:

- Commerce
- AI
- Payments
- Loyalty systems
- Merchant infrastructure
- Conversational interfaces
- Social engagement loops

---

# Repository Structure

Use the existing monorepo structure.

```txt
NileFlow/
├── AdminDashboard/
├── Mobileapp/
├── RiderDashboard/
├── VendorDashboard/
├── Website/
├── Backend/
├── README.md
└── AGENTS.md
```

---

## Platform Architecture

### Frontend Stack

**Website**

- React 18
- Vite
- Tailwind CSS

**Mobileapp**

- React Native
- Expo
- NativeWind

**Dashboards** (React 18 + Tailwind CSS)

- AdminDashboard
- VendorDashboard
- RiderDashboard

### Backend Stack

- Node.js
- Express.js
- Appwrite
- JWT Authentication
- Refresh Token Architecture

### AI Stack

- OpenAI API
- Conversational commerce pipeline
- Voice commerce integration
- AI memory/context systems

---

## Current Product Capabilities

### Commerce Features

- Product listings
- Categories & subcategories
- Product filters
- Cart & checkout
- Favorites system
- Order management
- Reviews & ratings
- Merchant onboarding
- Vendor operations
- Rider delivery flows

### Payments

**Current**

- Stripe integration
- JWT-secured payment flows

**In Progress**

- PayPal integration
- Nile Pay infrastructure

**Planned**

- Multi-wallet architecture
- Cross-border settlements
- Merchant tills
- Mobile money integrations
- Remittance infrastructure

---

## Nile Miles Loyalty System

Nile Miles is the retention engine of Nile Flow.

**Features include:**

- Points earning
- Reward redemption
- Loyalty history
- Retention analytics
- Psychological engagement loops

**The system exists to:**

- Increase LTV
- Improve repeat purchases
- Strengthen habit formation
- Drive emotional retention

---

## Conversational Commerce Engine

Nile Flow is building an AI-native commerce layer.

**Capabilities include:**

- Voice-enabled commerce
- Conversational product discovery
- AI shopping assistance
- Context-aware recommendations
- Intent-driven product retrieval
- AI memory systems

**Current implementation includes:**

- Expo Speech integration
- OpenAI conversational flows
- Backend interaction logging

**Future goals:**

- AI checkout flows
- Personalized shopping memory
- Merchant AI tooling
- Conversational analytics
- AI-assisted upselling

---

## Core Product Principles

The platform must feel:

- Trustworthy
- Stable
- Fast
- Lightweight
- Mobile-first
- Culturally intelligent
- Financially secure

Always optimize for:

- Low-end Android devices
- Weak internet conditions
- Emerging market realities
- Low digital literacy
- Trust-sensitive users

---

## Engineering Philosophy

Build systems that survive scale.

**Prioritize:**

- Maintainability
- Security
- Simplicity
- Auditability
- Performance
- Modularity

**Avoid:**

- Overengineering
- Premature abstraction
- Heavy frontend dependencies
- Complex state chains
- Unnecessary animations
- Startup hype engineering

---

## Development Rules

For every feature:

- Read AGENTS.md first
- Build the smallest stable implementation
- Keep code readable
- Follow existing architecture patterns
- Avoid unrelated rewrites
- Add loading states
- Add failure handling
- Handle offline/network failures
- Keep APIs consistent
- Maintain security standards

---

## Architecture Rules

### Website Structure

```
Website/src/
├── components/
├── pages/
├── hooks/
├── contexts/
├── services/
├── lib/
├── constants/
├── assets/
├── utils/
└── types/
```

**Website Rules**

- Pages remain thin
- Business logic belongs in hooks/services
- Reusable UI belongs in components
- Avoid deep prop drilling
- Prefer composition
- Keep bundle sizes lean

### Mobileapp Structure

```
Mobileapp/
├── app/
│   ├── (auth)/
│   ├── (tabs)/
│   └── screens/
├── components/
├── constants/
├── hooks/
├── services/
├── store/
├── lib/
├── utils/
├── assets/
└── types/
```

**Mobile Rules**

- Screens compose components
- Avoid business logic inside screens
- Use NativeWind
- Use Zustand for global state
- Persist only required data
- Never store secrets insecurely

### AdminDashboard Structure

```
AdminDashboard/src/
├── components/
├── pages/
├── hooks/
├── services/
├── contexts/
├── constants/
├── utils/
└── types/
```

### VendorDashboard Structure

```
VendorDashboard/src/
├── components/
├── pages/
├── hooks/
├── services/
├── contexts/
├── constants/
├── utils/
└── types/
```

### RiderDashboard Structure

```
RiderDashboard/src/
├── components/
├── pages/
├── hooks/
├── services/
├── contexts/
├── constants/
├── utils/
└── types/
```

### Backend Structure

```
Backend/src/
├── config/
├── controllers/
├── middleware/
│   ├── auth/
│   ├── validation/
│   └── security/
├── routes/
├── services/
├── repositories/
├── jobs/
├── lib/
├── utils/
└── server.js
```

**Backend Rules**

**Controllers** should:

- Validate requests
- Call services
- Return structured responses
- Avoid business logic

**Services** contain:

- Commerce orchestration
- Payment logic
- Loyalty systems
- Fraud detection
- Notification flows
- AI interaction systems

**Repositories** isolate:

- Appwrite operations
- Database access
- Query abstraction

Never place database logic inside controllers.

---

## API Standards

Use REST conventions.

**Requirements:**

- Versioned routes (`/api/v1`)
- Structured responses
- Centralized error handling
- Validation on every route
- Pagination support
- Rate limiting

**Example error response:**

```json
{
  "success": false,
  "message": "Invalid request",
  "errors": []
}
```

---

## Security Standards

Security is mandatory.

**Always implement:**

- Input validation
- RBAC authorization
- Audit logging
- Rate limiting
- Secure defaults
- CSRF protection
- Idempotency keys
- Secure cookie handling
- Environment validation

**Never:**

- Expose secrets
- Trust frontend validation
- Store sensitive tokens insecurely
- Skip authorization
- Disable middleware for convenience

---

## Fintech Engineering Rules

All financial operations must be:

- Idempotent
- Traceable
- Auditable
- Recoverable

All balance mutations must:

- Re-read balances before updates
- Prevent double spending
- Log transaction history
- Support rollback flows

Never assume network reliability. Retry safety is mandatory.

### Fraud & Compliance

Every financial feature must consider:

- Transaction velocity
- Fraud scoring
- Device fingerprinting
- Suspicious patterns
- Audit trails
- Regulatory review readiness

**Never implement:**

- Anonymous transactions
- Compliance bypasses
- Hidden money movement
- Regulatory workarounds

---

## Performance Rules

**Always optimize for:**

- Low bandwidth
- Small bundles
- Fast first paint
- Weak devices
- API efficiency

**Avoid:**

- Large dependency chains
- Heavy animations
- Excessive rerenders
- Unoptimized media

**Use:**

- Lazy loading
- Pagination
- Compression
- Efficient caching
- Optimized API payloads

---

## State Management

**Website** — use:

- Context API (lightweight state)
- React Query where necessary
- Local state for UI state

**Mobileapp** — use:

- Zustand
- AsyncStorage only when necessary

Never persist sensitive secrets insecurely.

---

## UI/UX Philosophy

Nile Flow UI should feel:

- Calm
- Trustworthy
- Familiar
- Efficient
- Mobile-native

**Design priorities:**

- Readability
- Clear hierarchy
- Strong spacing systems
- Large tap targets
- Low cognitive load

**Avoid:**

- Overly decorative interfaces
- Animation-heavy flows
- Dashboard clutter
- Complex navigation systems

---

## Image Handling Rules

Use centralized image imports.

```js
// constants/images.ts
import logo from "@/assets/images/logo.png";

export const images = {
  logo,
};
```

Never import images directly inside components/screens.

---

## TypeScript Rules

- Strict mode enabled
- No `any`
- Explicit interfaces
- Readable types
- Typed API responses
- Avoid unnecessary generics

---

## Logging & Observability

**Always include:**

- Structured logs
- Error tracking
- Audit events
- Transaction tracing

**Never log:**

- Passwords
- Tokens
- Secrets
- Full payment details
- Sensitive PII

---

## Authentication Rules

**Use:**

- Appwrite authentication
- JWT access tokens
- Refresh token architecture
- Secure cookie flows

**Support:**

- MFA / 2FA
- Session management
- Device management
- Session validation

Do not build custom auth systems unless strategically necessary.

---

## Testing Expectations

At minimum validate:

- Happy paths
- Validation errors
- Permission enforcement
- Loading states
- Retry behavior
- Failure handling
- Financial consistency

Payment systems require additional verification.

---

## Product Scaling Principles

Before implementing any feature, ask:

- Does this scale to 10M+ users?
- Does this strengthen Nile Pay?
- Does this improve retention?
- Does this increase trust?
- Does this improve merchant adoption?
- Does this support low-bandwidth environments?
- Does this align with African infrastructure realities?

---

## Team Context

**Current known leadership:**

- Anthony Wai → Founder & CEO
- Japhet → Co-Founder & COO
- Ted → Finance Officer

**Operational Context**

- Nile Flow is registered in Kenya
- Certificate of incorporation exists
- Banking infrastructure is still in progress

---

## Strategic Direction

**Upcoming priorities:**

- Merchant marketplace expansion
- Vendor onboarding systems
- PayPal integration completion
- Nile Pay infrastructure evolution
- AI personalization systems
- Conversational commerce scaling
- Social commerce features
- Cross-border payment support

---

## AI Agent Behavioral Rules

When assisting inside this repository:

- Think like an infrastructure engineer
- Protect long-term scalability
- Respect existing architecture
- Suggest better approaches when necessary
- Explain tradeoffs clearly
- Prioritize maintainability
- Prioritize security
- Prioritize auditability

**Do not:**

- Introduce unnecessary libraries
- Overengineer solutions
- Refactor unrelated systems
- Ignore emerging-market realities
- Break architectural consistency

---

# Nile Premium Subscription System

Nile Premium is a monthly subscription service priced at **200 KSH/month**.

## Premium Benefits

| Benefit         | Regular User         | Premium User      |
| --------------- | -------------------- | ----------------- |
| Discount        | None                 | 5–10% automatic   |
| Nile Miles      | 1x                   | 2x multiplier     |
| Shipping        | 15 KSH (if <100 KSH) | Always FREE       |
| Delivery Speed  | 5–7 days             | 1–2 days priority |
| Exclusive Deals | No access            | Full access       |

## Premium Discount Tiers

- Orders 0–499 KSH → 0% discount
- Orders 500–999 KSH → 5% discount
- Orders 1,000 KSH+ → 10% discount

## Nile Miles with Premium

Formula: `baseMiles = orderTotal / 10`. Premium users earn 2x on all purchases.

## Frontend Architecture (Website)

```

Context/
└── PremiumContext.jsx # Global premium state (isPremium, expiresAt)

hooks/
├── usePremiumStatus.js # Returns: isPremium, expiresAt, loading, isExpiringSoon
├── usePremiumSubscription.js # Returns: subscribe(), cancel(), renew(), loading, error
└── useNileMilesCalculator.js # Returns: calculatedMiles, bonusMiles, multiplier

utils/
└── premiumService.js # API abstraction: getStatus, subscribe, cancel, renew, # getMonthlySummary, getPremiumDeals, getBenefitsInfo, # calculateDiscount, calculateMiles

components/
├── PremiumBanner.jsx # Homepage CTA for non-premium; member badge for premium
├── PremiumUpsellModal.jsx # Checkout upsell for non-premium users
├── SubscriptionSettings.jsx # Profile subscription management (subscribe/cancel/renew)
├── PremiumBadge.jsx # Product premium badge
└── PremiumMonthlySummary.jsx # Monthly savings dashboard

src/Pages/
└── PremiumDealsPage.jsx # Premium-only deals page (/premium-deals)
└── SubscriptionSuccess.jsx # Post-Stripe redirect success page (/subscription/success)

```

## Backend Endpoints (Subscription)

```

GET /api/subscription/status # Current premium status
POST /api/subscription/subscribe # Subscribe (stripe or mpesa)
POST /api/subscription/cancel # Cancel subscription
POST /api/subscription/renew # Renew subscription
GET /api/subscription/monthly-summary # Monthly savings report
GET /api/subscription/premium-deals # Premium-only products
GET /api/subscription/payment-status/:checkoutRequestId # M-Pesa polling

```

## Database Schema — User Model Additions

```

isPremium Boolean default: false
subscriptionId String nullable
subscriptionExpiresAt DateTime nullable
subscriptionStartedAt DateTime nullable
subscriptionCancelledAt DateTime nullable

```

## Database Schema — Product Model Additions

```

premiumEligible Boolean default: true
premiumDeal Boolean default: false
premiumPrice Number nullable

```

## Database Schema — Order Premium Tracking

```

is_premium_order Boolean default: false
premium_discount_amount Decimal default: 0
premium_delivery_savings Decimal default: 0
premium_miles_bonus Integer default: 0
premium_miles_total Integer default: 0
order_month String format: 'YYYY-MM'

```

## Subscription State — Dual Write Rule

When activating, cancelling, or renewing subscriptions, always update **both**:

1. User Preferences (Appwrite `users.updatePrefs`) — for fast API reads
2. User Collection Document (Appwrite `db.updateDocument`) — for database queries and reports

---

# Payment Infrastructure

## Stripe Payment Flow (Card)

1. Frontend calls `POST /api/subscription/subscribe { paymentMethod: "stripe" }`
2. Backend returns `{ checkoutUrl: "https://checkout.stripe.com/..." }`
3. Frontend redirects: `window.location.href = checkoutUrl`
4. User pays on Stripe hosted page
5. Stripe webhook activates subscription in backend
6. Stripe redirects to `/subscription/success?session_id=...`
7. Success page polls `/api/subscription/status` every 2 seconds until `isPremium = true`
8. Auto-redirects to `/profile?tab=premium` after confirmation

## M-Pesa Payment Flow (Mobile Money)

1. Frontend calls `POST /api/subscription/subscribe { paymentMethod: "mpesa", phoneNumber: "..." }`
2. Backend returns `{ checkoutRequestId: "..." }` and sends STK push to phone
3. Frontend polls `GET /api/subscription/payment-status/:checkoutRequestId`
4. User confirms payment on phone with M-Pesa PIN
5. M-Pesa callback received by backend → subscription activated
6. Polling detects `status = "active"` → success shown

## M-Pesa Callback URL Requirement

M-Pesa requires a publicly accessible HTTPS callback URL. `localhost` will not work.

- **Development**: Use `ngrok http <port>` and set `BACKEND_URL=https://<ngrok-url>` in `.env`
- **Production**: Use the deployed backend URL

```

CallBackURL: `${process.env.BACKEND_URL}/api/payments/mpesa/callback`

```

## Payment Methods Supported

| Method   | Status      | Flow Type          |
| -------- | ----------- | ------------------ |
| Stripe   | Active      | Redirect + Webhook |
| M-Pesa   | Active      | STK Push + Polling |
| PayPal   | In Progress | TBD                |
| Nile Pay | Planned     | Native             |

---

# Order Cancellation System

## Customer Flow

- Cancellation page at `/cancel-order` (auto-fills order ID from Orders page)
- 8 standard cancellation reasons + free-text field
- Policy displayed inline: eligible statuses, refund timelines

## Cancellation Eligibility

- Eligible: Orders in Pending, Processing, or Ordered status placed within 24 hours
- Not eligible: Shipped, Out for Delivery, or Delivered orders

## Refund Timeline

- Cash on Delivery: No payment to refund
- Card/M-Pesa: Refund within 5–7 business days to original payment method

## Backend Endpoint

```

POST /api/orders/cancel-request

```

Request body:

```json
{
  "orderId": "string",
  "reason": "string",
  "additionalDetails": "string",
  "userId": "string",
  "customerEmail": "string",
  "customerName": "string"
}
```

## Admin Cancellation Approval

```
GET  /api/admin/cancellation-requests?status=pending&page=1&limit=20
POST /api/admin/cancellation-requests/:id/approve
POST /api/admin/cancellation-requests/:id/reject
```

`cancellationRequests` Appwrite collection tracks: `orderId`, `userId`, `reason`, `status` (pending/approved/rejected), `reviewedBy`, `adminNotes`, `refundStatus`, `refundAmount`, `autoApproved`.

---

# OAuth Authentication

The frontend supports Google and Facebook OAuth sign-in. Backend must implement:

## Required Backend Endpoints

```
GET /api/customerauth/oauth/google             # Returns { authUrl }
GET /api/customerauth/oauth/google/callback    # Exchanges code, creates user, issues JWT
GET /api/customerauth/oauth/facebook           # Returns { authUrl }
GET /api/customerauth/oauth/facebook/callback  # Exchanges code, creates user, issues JWT
```

## Required Environment Variables

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=
FACEBOOK_APP_ID=
FACEBOOK_APP_SECRET=
FACEBOOK_REDIRECT_URI=
FRONTEND_URL=
```

---

# Mandatory Pickup Address Modal

After a user's first sign-in (if they have no pickup address on file), a non-dismissible modal appears to collect delivery information before the user can access the app.

## Required Fields

- Street Address (required)
- Phone Number (required, regex-validated)
- City (required)
- State/Province (required)
- Postal Code (optional)

## Backend Endpoint

```
POST /api/customerauth/pickup-address
```

## Modal Behavior Rules

- Cannot be closed by escape key, outside click, or close button
- Validate all required fields inline before allowing submission
- On success, redirect to home page
- On API failure, show error and allow retry

---

# Discover Africa Feature

A cultural engagement feature surfacing educational content about Africa.

## Appwrite Collections

### `africanFacts`

Categories: `nature`, `culture`, `history`, `art`, `wildlife`

Key fields: `category`, `title`, `description`, `image` (URL), `location`, `tags` (string[]), `featured` (boolean), `active` (boolean), `sortOrder` (integer)

### `africanProverbs`

Key fields: `proverb`, `language`, `country`, `region`, `translation` (English), `active`, `sortOrder`

## Backend API Endpoints

```
GET /api/africa/facts?category=nature&featured=true
GET /api/africa/proverbs?country=Kenya
```

---

# Multi-Language & Translation System

## Base Language

English (`locales/en.json`) is the canonical source for all string keys.

## Supported Languages

| Language  | Code     | Method               |
| --------- | -------- | -------------------- |
| English   | en       | Manual (base)        |
| Kiswahili | sw / kis | Manual translations  |
| Français  | fr       | Auto-translated      |
| Português | pt       | Auto-translated      |
| العربية   | ar       | Auto-translated      |
| Yorùbá    | yo       | Limited (falls back) |
| Hausa     | ha       | Limited (falls back) |
| isiZulu   | zu       | Auto-translated      |

## Auto-Translation

- Service: LibreTranslate (free, open-source, self-hostable)
- Translations cached in `localStorage` after first generation
- Manual override: create `locales/<lang>.json` — takes precedence over auto-translation
- Clearing cache: `clearTranslationCache('fr')` or `clearTranslationCache()` for all

## Adding New Keys

Add to `locales/en.json` only. All other languages auto-receive the translation.

---

# Website-Specific Implementation Patterns

## API Abstraction Layer

Use `axiosClient` (auth-handled) as the base for all API calls in the Website. Never call raw `fetch` or `axios` directly inside components.

Service files live in `utils/` (e.g., `premiumService.js`, `authServices.js`).

## Context Hierarchy in App.jsx

```
CustomerAuthProvider
  └── PremiumProvider
        └── Router
```

## Route Conventions

- `/premium-deals` → Premium-only deals page
- `/cancel-order` → Order cancellation request page
- `/subscription/success` → Post-Stripe-checkout activation polling
- `/profile?tab=premium` → Subscription settings tab

## Subscription Payment UI Conventions

- Stripe button: purple/indigo color scheme, text "Continue to Stripe Checkout"
- M-Pesa button: emerald/green color scheme, text "Subscribe Now - 200 Ksh/month"
- Show helper text under Stripe button: "You will be redirected to Stripe's secure checkout page"

---

# Nile Flow Light Design System (Mobile App)

The Mobileapp uses a **permanent light design system**. Dark mode has been fully removed. All components and screens must follow this system without exception.

> This system was fully implemented across all screens in `Mobileapp/app/(tabs)/`, `Mobileapp/app/(auth)/`, `Mobileapp/app/screens/`, and all components in `Mobileapp/app/components/` including the `Creator/` and `SocialFeed/` subfolders.

---

## Core Color Palette

| Role                    | Color             | Usage                                               |
| ----------------------- | ----------------- | --------------------------------------------------- |
| Page background         | `#FFFFFF`         | Every screen root `View`                            |
| Card background (soft)  | `#F9FAFB`         | Product cards, modals, input containers             |
| Card background (green) | `#F0FDF4`         | Featured sections, empty states, premium containers |
| Green accent (CTA)      | `#16A34A`         | Buttons, icons, active states, progress fills, CTAs |
| Dark green (headings)   | `#14532D`         | Section titles, modal titles, badge text            |
| Gold (price/stars)      | `#D97706`         | Product prices, active star ratings, premium badges |
| Body text (primary)     | `#111827`         | Headings, product names, form labels, modal titles  |
| Body text (default)     | `#374151`         | Paragraph text, descriptions, action labels         |
| Body text (secondary)   | `#6B7280`         | Timestamps, counts, subtitles, captions             |
| Border (neutral)        | `#E5E7EB`         | Default card and input borders                      |
| Border (green tint)     | `#BBF7D0`         | Featured card borders, premium section borders      |
| Star inactive           | `#D1D5DB`         | Unrated star icons                                  |
| Handle / divider        | `#D1D5DB`         | Bottom sheet handles, header dividers               |
| Placeholder text        | `#9CA3AF`         | Input placeholder text                              |
| Disabled                | `#9CA3AF`         | Disabled buttons and controls                       |
| Backdrop overlay        | `rgba(0,0,0,0.5)` | Modal backdrops                                     |

---

## Critical Rules

### Page vs Card Backgrounds

- Page root `View` background → **always `#FFFFFF`**
- Cards must **never** be `#FFFFFF` — use `#F9FAFB` or `#F0FDF4` to visually separate from the page
- Bottom sheets and modal content → `#FFFFFF` (sits above backdrop, distinct from page)

### What to Keep Dark (Do NOT Lighten)

- Video overlay action buttons in `FeedItem.jsx` (Heart, Comment, Share on video) → keep white for readability on video
- Full-screen video player container → `#000000` background is correct
- Image gradient overlays (`transparent → rgba(0,0,0,0.8)`) → keep as-is for text readability on images
- Hero/banner slides with image backgrounds → overlay gradients are intentional
- `Creator/MediaPreview.jsx` → camera canvas stays dark (industry standard, like Instagram/TikTok)

### What to Always Keep Colored (Do NOT Neutralize)

- SALE badges → red (`#DC2626` or `bg-red-600`)
- PREMIUM badges → gold/purple gradient
- CTA buttons → `#16A34A` green (never gray unless disabled)
- Emerald group buy action buttons → keep emerald scheme
- Amber TTL duration selectors in group buy → keep amber scheme

---

## NativeWind Class Mapping (Dark → Light)

When converting NativeWind `className` strings from dark to light:

| Dark class                                     | Light replacement                        |
| ---------------------------------------------- | ---------------------------------------- |
| `bg-slate-900`                                 | `bg-white`                               |
| `bg-slate-800` / `bg-slate-700`                | `bg-gray-50` / `bg-gray-100`             |
| `text-white`                                   | `text-gray-900`                          |
| `text-slate-400`                               | `text-gray-500`                          |
| `text-slate-300`                               | `text-gray-700` or `text-gray-600`       |
| `border-slate-600` / `border-slate-800`        | `border-gray-200` / `border-gray-100`    |
| `bg-slate-700/50 border-slate-600`             | `bg-gray-100 border-gray-200`            |
| `bg-red-900/40 border-red-500/40 text-red-400` | `bg-red-50 border-red-200 text-red-600`  |
| `bg-emerald-900/40 border-emerald-500/30`      | `bg-emerald-50 border-emerald-300`       |
| `text-emerald-400`                             | `text-emerald-600` or `text-emerald-700` |

---

## StyleSheet Value Mapping (Dark → Light)

When converting inline `StyleSheet.create()` values:

| Dark value                   | Light replacement      |
| ---------------------------- | ---------------------- |
| `#262626` / `#1C1C1E`        | `#FFFFFF` or `#F9FAFB` |
| `#4A4A4A` (handles)          | `#D1D5DB`              |
| `#3A3A3A` (dividers/borders) | `#E5E7EB`              |
| `#F5F5F5` (dark-mode text)   | `#111827` or `#374151` |
| `#A8A8A8` (dark secondary)   | `#6B7280`              |
| `'gold'` (star active)       | `'#D97706'`            |
| `'gray'` (star inactive)     | `'#D1D5DB'`            |

---

## ThemeProvider Removal Rules

The `ThemeProvider` / `useTheme` hook was providing dynamic dark/light styles. This has been **fully removed** from all Mobileapp components. When editing any component:

1. Remove `import { useTheme } from "../../../Context/ThemeProvider"` (adjust relative path as needed)
2. Remove `const { themeStyles, isDark, theme } = useTheme()` destructure
3. Replace all `themeStyles.text` → `"#111827"` or `"#374151"` depending on context
4. Replace all `themeStyles.cardBackground` → `"#F9FAFB"`
5. Replace all `themeStyles.background` → `"#FFFFFF"`
6. Replace all `themeStyles.border` → `"#E5E7EB"`
7. Replace all `themeStyles.secondaryText` → `"#6B7280"`
8. Replace all `themeStyles.primary` → `"#16A34A"`
9. Replace all `isDark ? ... : ...` ternaries → use the light-side value directly
10. Replace all `ActivityIndicator color={themeStyles.text}` → `color="#16A34A"`

---

## LinearGradient Usage Rules

`expo-linear-gradient` is allowed only for:

- Hero/banner slides with image backgrounds
- CTA button gradients (e.g., green gradient buttons)
- Accent/highlight lines (can use solid `#16A34A` instead)
- Image overlay gradients (`transparent → rgba(0,0,0,0.8)`)

**Remove `LinearGradient` from:**

- Card backgrounds (use solid `#F9FAFB`)
- Premium badge backgrounds (use solid `#D97706`)
- Any place that was previously a dark-to-dark gradient for aesthetic purposes

---

## HolidayBanner Prop Default

`HolidayBanner` accepts `themeStyles` as a prop for parametric coloring. Always provide a default:

```jsx
const HolidayBanner = ({ themeStyles = { primary: '#16A34A', text: '#111827' } }) => {
```

---

## Components Converted (Mobileapp)

All files below have been fully converted to the light design system. **Do not revert these.**

### `app/components/`

- `RelatedProductCard.jsx` — card `#F9FAFB`, premium badge solid `#D97706`, stars `#D97706`/`#D1D5DB`
- `RatingModal.jsx` — modal `#FFFFFF`, cancel `#DC2626`, submit `#16A34A`
- `RelatedProducts.jsx` — container `#F0FDF4 border #BBF7D0`, header icon `#16A34A`
- `FilterModa.jsx` — bg `#FFFFFF`, selected `#16A34A`, apply `#16A34A`
- `ProductCarousel.jsx` — active dot `#16A34A`, inactive `#D1D5DB`
- `RatingStars.jsx` — active `#D97706`, inactive `#D1D5DB`
- `VerificationInput.jsx` — border/color `#16A34A`, bg `rgba(22,163,74,0.08)`
- `CustomAlert.jsx` — title `#14532D`
- `ErrorBoundary.jsx` — bg `bg-gray-50`, button `bg-green-600`
- `CountdownTimer.jsx` — expired `bg-red-50 border-red-200`, time units `bg-amber-50`
- `ParticipantList.jsx` — progress track `bg-gray-200`, avatar borders `border-white`
- `GroupBuyCard.jsx` — card `bg-white border-gray-200`, disabled CTA `bg-gray-300`
- `GroupBuyStarter.jsx` — root `bg-white`, size/TTL selectors `bg-gray-100`, footer `bg-white`
- `PricingTiersDisplay.jsx` — container `bg-gray-50`, current tier `bg-emerald-50`
- `ShareButton.jsx` — compact `bg-emerald-50 border-emerald-300`, social buttons light
- `AddAddressMapModal.jsx` — save `#16A34A`, cancel `#DC2626`, ActivityIndicator `#16A34A`
- `HolidayBanner.jsx` — default prop `{ primary: '#16A34A', text: '#111827' }`

### `app/components/Creator/`

- `AudiencePickerModal.jsx` — `useTheme` removed, bg `#FFFFFF`, text `#111827`
- `LocationPickerModal.jsx` — `useTheme` removed, card `#FFFFFF`, all text `#111827`
- `CaptionInput.jsx` — `useTheme` removed, input color `#111827`, avatar bg `#F3F4F6`
- `SettingsRow.jsx` — `useTheme` removed, icon `#374151`, label `#111827`
- `ProductTagSection.jsx` — `useTheme`/`isDark` removed, search border `rgba(0,0,0,0.1)`
- `MediaPreview.jsx` — camera canvas, kept dark intentionally (camera UI convention)

### `app/components/SocialFeed/`

- `CommentsSheet.jsx` — sheet `#FFFFFF`, handle `#D1D5DB`, text `#111827`, inputs `#F9FAFB`
- `NileMilesDisplay.jsx` — `useTheme` replaced with hardcoded light object
- `SocialFeed.jsx` — `useTheme` removed, loading/error states `#FFFFFF`, ActivityIndicator `#16A34A`
- `FeedItem.jsx` — `useTheme` removed, video container `#000000`, username/caption white (video overlay), non-video cards `#F9FAFB`
- `MediaPicker.jsx` — `useTheme` removed, borders `#E5E7EB`, icons `#374151`
- `ProductTagger.jsx` — `useTheme` removed, dropdown `#F9FAFB`, result text `#111827`
- `SocialShare.jsx` — pure utility, no UI (no changes needed)

### Screens (previously converted)

All screens in `app/(tabs)/`, `app/(auth)/`, and `app/screens/` — fully converted.

---

# Final Principle

Nile Flow is being engineered as foundational digital infrastructure for Africa.

Every line of code should move the platform closer to:

- Trust
- Scale
- Stability
- Inclusion
- Economic empowerment
- AI-native commerce
- Financial infrastructure ownership

Build accordingly.
