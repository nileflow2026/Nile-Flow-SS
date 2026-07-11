# Website2 Full Responsiveness Enhancement Plan

## Issues Identified & Fixes Required

### Global
1. **Add xs breakpoint support** for 320px screens (Tailwind v4 CSS-first config)
2. **Add horizontal overflow protection** at the root level

### HomePage
- Highlights grid `grid-cols-2` → `grid-cols-1 sm:grid-cols-2 md:grid-cols-3` (text cramped at 320px)

### ProductListingPage
- Bottom CTA section `flex-col sm:flex-row` → already handled

### ProductDetailPage
- Already responsive but needs minor padding/breakpoint polish

### CartPage / CheckoutPage
- Already responsive, minor polish

### ProfilePage
- Stats grid `grid-cols-2` → already fine

### AddressesPage
- `max-w-2xl` centered → fine

### SettingsPage
- `max-w-2xl` centered → fine

### AccountDeletionPage
- **OTP input overflow**: 6 × 48px + 5 × 8px gaps = 328px > 320px viewport. Fix needed.

### VerifyEmailPage
- OTP input size → already fine with `gap-2` and `w-12`

### Info Pages (About, Contact, HelpCenter, Privacy, ReturnPolicy)
- Pillar grids `md:grid-cols-3` → change to `grid-cols-1 sm:grid-cols-2 md:grid-cols-3`

### AppHeader
- Logo img has `h-15 w-32` (non-standard) → fix dimensions

### PageShell Footer
- Already responsive, fine

### PaymentPage
- Payment method buttons, card form → responsive, fine

### CareersPage culture section
- `grid-cols-2 sm:grid-cols-2 lg:grid-cols-4` → fine

### NotificationPage
- `max-w-2xl` → fine

### TrackOrderPage
- Already responsive

### DealsPage
- Already responsive

### PremiumDealsPage
- Benefits grid `grid-cols-2 gap-4` → fine

### GroupBuyPage
- Already responsive

### SearchPage
- Already responsive
