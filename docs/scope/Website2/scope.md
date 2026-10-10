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

Shoppers share active deal details and product images using a branded preview link that opens the Website2 deal page.
**Done when:** each active deal card has a general Share button and an accessible chooser for device sharing, WhatsApp, Facebook, X, Telegram, and Copy link; the offer message uses clear spacing, relevant emojis, and WhatsApp emphasis markers around key details, with urgency based only on the real discount and optional expiry; device sharing attaches the product image when supported; social and copied links use the Render hosted `share.nileflowafrica.com` preview; WhatsApp shares the prepared image file or offers image download and Copy link without opening a text only composer; expired or invalid deals, browser limits, cancellation, and copy or image failures have clear accessible fallbacks.
Code in `Website2/src/features/deals/`.
- [x] Design it (spec): `/architect Website2 deal sharing`
  Spec [0001](../../specs/Website2/0001-share-deal-products/index.md)
- [ ] Build it: `/develop Website2 deal sharing`
  - [ ] Add the public Backend preview route, configure the Render subdomain and trusted origins, and verify crawler metadata and public image access before switching links (AC-5, AC-7).
  - [x] Align deal validation, formatted offer message, and social and copied links with the branded preview URL (AC-1, AC-2, AC-4, AC-5).
  - [x] Prepare product image files for device sharing and implement WhatsApp image download and Copy link fallbacks (AC-3, AC-6).
- [ ] Verify it: `/check verify Website2 deal sharing`
- [ ] Test it: `/test Website2 deal sharing`
