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

Shoppers share active deal details and product images using a preview link that opens the Website2 deal page.
**Done when:** each active deal card has a general Share button and an accessible chooser for device sharing, WhatsApp, Facebook, X, Telegram, and Copy link; device sharing attaches the product image when supported; social and copied links use a crawler readable backend preview that opens the Website2 deal; expired or invalid deals, browser limits, cancellation, and copy or image failures have clear accessible fallbacks.
Code in `Website2/src/features/deals/`.
- [x] Design it (spec): `/architect Website2 deal sharing`
  Spec [0001](../../specs/Website2/0001-share-deal-products/index.md)
- [x] Build it: `/develop Website2 deal sharing`
  - [x] Add the public backend preview page, origin setting, and shared deal eligibility behavior (AC-5, AC-7).
  - [x] Switch Website2 share links and chooser payloads to the backend preview URL (AC-1, AC-2, AC-3, AC-4, AC-5).
  - [x] Attach product image files when supported, with safe image validation and text plus link fallback (AC-5, AC-6).
- [ ] Verify it: `/check verify Website2 deal sharing`
- [ ] Test it: `/test Website2 deal sharing`
