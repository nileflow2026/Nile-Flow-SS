# Scope: Nile Flow shared work

Nile Flow connects customers, merchants, and delivery teams through commerce and payment services. This shared scope tracks work that crosses the Mobileapp and Backend.

**Build approach:** Tracer Bullet (prove one complete payment path, then extend it).
**Workflow:** Beta (verify the feature and test its important paths).

## At a glance

| # | Feature | Phase | Status |
|---|---|---|---|
| 1 | Checkout address confirmation | Checkout | in-progress |
| 2 | Mobile customer onboarding authentication | Onboarding | in-progress |

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
- [x] Design it (spec): `/architect Mobileapp customer onboarding authentication`
- [ ] Build it: `/develop Mobileapp customer onboarding authentication`
  - [ ] Enforce email verification in versioned and legacy Backend auth routes, then wire Mobileapp signup, verification, session restore, and route guards (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-17, AC-18).
  - [ ] Gate marketplace access on the authenticated customer's saved pickup address, with owner checked writes and retry states (AC-10, AC-11).
  - [ ] Add provider identity links, verified OAuth email handling, one time Redis state and exchange, SecureStore token rotation, and safe logout (AC-12, AC-13, AC-14, AC-15, AC-19).
  - [ ] Align Website2 signup and sign in with pending verification and existing cookie sessions (AC-16).
  - [ ] Verify production Redis readiness and run onboarding and compatibility scenarios across Mobileapp, Backend, and Website2 (AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-10, AC-11, AC-12, AC-13, AC-14, AC-15, AC-16, AC-17, AC-18, AC-19).
- [ ] Verify it: `/check verify Mobileapp customer onboarding authentication`
- [ ] Test it: `/test Mobileapp customer onboarding authentication`

Spec [0003](../../specs/Mobileapp/0003-mobile-onboarding-authentication.md)

## Deferred

- MFA support (from spec 0003): design separately.
