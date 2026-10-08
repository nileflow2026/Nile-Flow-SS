# Scope: Nile Flow shared work

Nile Flow connects customers, merchants, and delivery teams through commerce and payment services. This shared scope tracks work that crosses the Mobileapp and Backend.

**Build approach:** Tracer Bullet (prove one complete payment path, then extend it).
**Workflow:** Beta (verify the feature and test its important paths).

## At a glance

| # | Feature | Phase | Status |
|---|---|---|---|
| 1 | Checkout address confirmation | Checkout | in-progress |
| 2 | Mobile customer onboarding authentication | Onboarding | in-progress |
| 3 | Shared mobile push notifications and admin broadcasts | Notifications | in-progress |
| 4 | Nile Miles explainer screen | Loyalty | in-progress |

## Checkout

### 1. Checkout address confirmation · in-progress

Customers confirm a saved or newly completed delivery address before choosing a payment method. The Mobileapp and Backend use an owner checked address snapshot for each order.
**Done when:** customers can confirm an address before payment, every supported payment path stores the verified snapshot and safely handles retries, and older clients keep their current behavior.
- [x] Design it (spec): `/architect Mobileapp checkout address confirmation`
- [ ] Build it: `/develop Mobileapp checkout address confirmation`
  - [ ] Add order and callback inbox schema, secure address APIs, and owner only address permissions (AC-4, AC-5, AC-6, AC-7, AC-13, AC-14, AC-15, AC-16, AC-19, AC-25).
  - [ ] Add checkout lookup, shared Redis coordination, rollout gate, and idempotent cash on delivery (AC-12, AC-17, AC-18, AC-19, AC-20, AC-23, AC-24, AC-26).
  - [ ] Build Cart address confirmation, account scoped attempt storage, and Payments restart recovery (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-18, AC-20, AC-21, AC-22, AC-23).
  - [ ] Extend M Pesa and Pesapal payment status and durable callback processing, including the worker, scanner, and replay script (AC-12, AC-13, AC-14, AC-20, AC-23, AC-24, AC-25, AC-26).
  - [ ] Complete the card order path after its Appwrite Function source is available (AC-12, AC-13, AC-20, AC-24).
- [ ] Verify it: `/check verify Mobileapp checkout address confirmation`
- [ ] Test it: `/test Mobileapp checkout address confirmation`

Spec [0002](../../specs/Mobileapp/0002-mobile-checkout-address-confirmation.md)

## Customer onboarding

### 2. Mobile customer onboarding authentication · in-progress

New and returning customers use verified sessions, and Mobileapp customers save a pickup address before marketplace access. Website2 follows the shared verification rules while keeping its cookie session behavior.
**Done when:** Mobileapp customers can sign in or create an account, verify email when required, restore valid sessions, save a pickup address, and enter protected screens only after Backend authorization; Google and Facebook use a secure one time exchange; Website2 retains cookie sessions and honors verification.
Code in `Backend/`, `Mobileapp/`, and `Website2/`.
- [x] Design it (spec): `/architect Mobileapp customer onboarding authentication`
- [ ] Build it: `/develop Mobileapp customer onboarding authentication`
  - [x] Enforce email verification in versioned and legacy Backend auth routes, then wire Mobileapp signup, verification, session restore, and route guards (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-17, AC-18).
  - [x] Gate marketplace access on the authenticated customer's saved pickup address, with owner checked writes and retry states (AC-10, AC-11).
  - [x] Add provider identity links, verified OAuth email handling, one time Redis state and exchange, SecureStore token rotation, and safe logout (AC-12, AC-13, AC-14, AC-15, AC-19).
  - [x] Align Website2 signup and sign in with pending verification and existing cookie sessions (AC-16).
  - [ ] Verify production Redis readiness and run onboarding and compatibility scenarios across Mobileapp, Backend, and Website2 (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18, AC-19).
- [ ] Verify it: `/check verify Mobileapp customer onboarding authentication`
- [ ] Test it: `/test Mobileapp customer onboarding authentication`

Spec [0003](../../specs/Mobileapp/0003-mobile-onboarding-authentication/index.md)

## Notifications

### 3. Shared mobile push notifications and admin broadcasts · in-progress

Customers receive reliable order and account pushes, and admins can send mobile broadcasts with clear promotional consent and aggregate delivery reporting.
**Done when:** automatic push events use one reliable Expo path, customers control promotional consent, admins can preview and send authorized campaigns, and delivery outcomes are reported without exposing recipients.
Code in `Backend/`, `AdminDashboard/`, and `Mobileapp/`.
- [x] Design it (spec): `/architect shared mobile push notifications and admin broadcasts`
- [ ] Build it: `/develop shared mobile push notifications and admin broadcasts`
  - [ ] Add consent and token timestamp fields, campaign and event receipt collections, indexes, retention, and safe migration (AC-1, AC-3, AC-4, AC-7, AC-8, AC-9, AC-10, AC-15, AC-17).
  - [ ] Centralize Expo delivery and route payment, order, cancellation, welcome, and security events through stable receipts and server owned templates (AC-1, AC-2, AC-3, AC-13, AC-15, AC-16, AC-17).
  - [ ] Add customer consent APIs and Mobileapp settings, including permission revocation, logout cleanup, loading, and failure states (AC-4, AC-6, AC-14).
  - [ ] Add secure campaign preview and idempotent send, then build a fixed audience snapshot with cursor recovery and durable queue checks (AC-5, AC-6, AC-7, AC-8, AC-9, AC-11, AC-14).
  - [ ] Add the Broadcasts tab, paginated aggregate reporting, active refresh, bounded retry, lock protected cancellation, and verify category expiry of 24 hours for promotions, 30 days for app updates, and 7 days for service announcements, plus privacy, retention, template recovery, and physical device delivery (AC-5, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17).
- [ ] Verify it: `/check verify shared mobile push notifications and admin broadcasts`
- [ ] Test it: `/test shared mobile push notifications and admin broadcasts`

Spec [0001](../../specs/_root/0001-shared-push-notifications/index.md)

## Loyalty

### 4. Nile Miles explainer screen · in-progress

Customers learn how Nile Miles work, see their current balance, and continue to the rewards catalogue from Settings.
**Done when:** Settings opens a dedicated explainer with the authenticated current balance, accurate earning and redemption guidance, and clear loading, error, retry, and focus refresh behavior.
Code in `Mobileapp/`.
- [x] Design it (spec): `/architect Mobileapp Nile Miles explainer screen`
  Spec [0004](../../specs/Mobileapp/0004-nile-miles-explainer.md)
- [ ] Build it: `/develop Mobileapp Nile Miles explainer screen`
  - [x] Replace the Settings Saved items row and build the explainer route with authenticated balance loading, retry, and focus refresh (AC-1, AC-2, AC-7).
  - [x] Add the approved earning, eligibility, Premium, redemption, and terms content with a neutral Redeem link and localization (AC-3, AC-4, AC-5, AC-6, AC-8).
  - [ ] Verify route behavior, balance success and failure, stale request handling, session scope, and approved copy (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8).
- [ ] Verify it: `/check verify Mobileapp Nile Miles explainer screen`
- [ ] Test it: `/test Mobileapp Nile Miles explainer screen`

## Deferred

- MFA support (from spec 0003): design separately.
- Nile Miles purchase and referral award consistency (from spec 0004): align award timing, amounts, and Premium handling across backend paths.
- Backend verified redemption options in the Mobileapp (from spec 0004): load active rewards from the backend instead of the local list.
