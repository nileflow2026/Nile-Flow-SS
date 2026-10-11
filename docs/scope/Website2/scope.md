# Scope: Nile Flow Website2

This scope tracks customer facing work in the Website2 workspace.

**Build approach:** Tracer Bullet (build one complete share flow using existing product data and browser actions).
**Workflow:** Beta (verify the feature and test its important paths).

## At a glance

| # | Feature | Phase | Status |
|---|---|---|---|
| 1 | Website2 deal sharing | Deals | in-progress |
| 2 | Website2 product detail sharing | Products | in-progress |

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

## Products

### 2. Website2 product detail sharing · in-progress

Shoppers share ordinary products from their detail pages using a branded preview link and an image when browser sharing supports it.
**Done when:** a compact accessible Share control appears over the product image on detail pages; the chooser shares the displayed product name and price through device sharing, WhatsApp, Facebook, X, Telegram, or Copy link; the public preview returns safe crawler metadata and redirects to the canonical product page; image and clipboard failures have clear fallbacks; active deals keep their existing share flow.
Code in `Website2/src/features/products/` and the existing Backend share preview area.
- [x] Design it (spec): `/architect Website2 product detail sharing`
  Spec [0002](../../specs/Website2/0002-share-products-from-detail-page/index.md)
- [x] Build it: `/develop Website2 product detail sharing`
  - [x] Add the public product preview route with visibility checks, safe metadata, and the fixed product page redirect (AC-6, AC-7, AC-8).
  - [x] Add the ordinary product message and share chooser, preserving the existing deal flow (AC-1, AC-2, AC-3, AC-5).
  - [x] Place the accessible Share control on the product detail image only (AC-1, AC-2, AC-3).
  - [x] Prepare product images for file sharing and implement image and currency fallbacks (AC-2, AC-3, AC-4).
- [ ] Verify it: `/check verify Website2 product detail sharing`
- [ ] Test it: `/test Website2 product detail sharing`
