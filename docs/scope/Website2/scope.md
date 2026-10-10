# Scope: Nile Flow Website2

This scope tracks customer facing work in the Website2 workspace.

**Build approach:** Tracer Bullet (build one complete share flow using existing product data and browser actions).
**Workflow:** Beta (verify the feature and test its important paths).

## At a glance

| # | Feature | Phase | Status |
|---|---|---|---|
| 1 | Website2 deal sharing | Deals | in-progress |

## Deals

### 1. Website2 deal sharing · in-progress

Shoppers share an active deal's offer details and direct Website2 product link from its card.
**Done when:** each active deal card has a general Share button and an accessible chooser for device sharing, WhatsApp, Facebook, X, Telegram, and Copy link; platform content uses the specified offer and URL formats; expired or invalid deals, browser limits, cancellation, and copy failures are clearly handled.
Code in `Website2/src/features/deals/`.
- [x] Design it (spec): `/architect Website2 deal sharing`
  Spec [0001](../../specs/Website2/0001-share-deal-products/index.md)
- [x] Build it: `/develop Website2 deal sharing`
  - [x] Complete the canonical offer message, deal URL, and invalid data behavior (AC-2, AC-5).
  - [x] Add the accessible chooser and device, WhatsApp, Facebook, X, Telegram, and copy actions (AC-1, AC-3, AC-4).
  - [x] Handle expiry, unavailable sharing, cancellation, and copy failure, then verify the platform payloads (AC-3, AC-4, AC-5).
- [ ] Verify it: `/check verify Website2 deal sharing`
- [ ] Test it: `/test Website2 deal sharing`
