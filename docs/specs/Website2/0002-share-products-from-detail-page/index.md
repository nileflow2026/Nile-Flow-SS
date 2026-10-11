# 0002. Share products from detail pages

**Date**: 2026-10-11
**Status**: In Progress

## Summary

Shoppers can share products from the product detail page without adding more buttons beside the purchase actions. A compact Share control sits over the product image and opens the existing sharing choices. Branded product links show a social preview and then open the product page, while sharing continues to use the product data already in Appwrite.

Decision background is recorded in [rationale.md](./rationale.md).

## Requirements

**User stories**:

* As a shopper, I want to share a product from its detail page so that other people can see the product and open its page.
* As a shopper, I want the share message and preview to use the product name, price, and image so that the shared link is clear and appealing.

**Acceptance criteria**:

* **AC-1**: Add a compact, labeled Share control over the top right of the product image area on `ProductDetailPage`. Give it an accessible name and button role. It must not add another button beside Add to cart or Buy now. The action is available for in stock and out of stock products. Do not add sharing controls to product listing cards. If the product is an active deal, retain its existing deal specific share message and branded deal link rather than treating it as an ordinary product.
* **AC-2**: The ordinary product message uses this order and structure: `✨ *Check out {productName}*`, `💰 Price: *{currentPrice}*`, an optional `🏷️ Was: {originalPrice}` line, a blank line, then `🛒 *Shop now:* {shareUrl}`. The name uses the product detail page name sources, `productName`, `name`, then `title`, with `Product` as the fallback. The current price must match the string already shown on ProductDetailPage, using `displayPrice` first and otherwise the page's existing price formatting. Catalog `price` and `originalPrice` numeric amounts are stored in KES, as assumed by the existing currency converter. The `currency` field on the product document does not determine the currency of these amounts. The numeric catalog price is `product.price.basePrice` when `product.price` is an object, otherwise a finite numeric `product.price`. A shareable product must have both a finite numeric catalog price and a nonempty current display price. If the product ID is missing, disable ordinary product sharing and show `This product link is unavailable and cannot be shared.` If the current price is missing or invalid, disable ordinary product sharing and show `This product does not have a valid price and cannot be shared.` Include the original price only when the existing product record has a finite numeric `originalPrice` greater than the numeric catalog price and the currency enrichment supplies `originalPriceDisplayValue`. Derive it from the KES `originalPrice` with the same KES to target currency rate, rounding mode, psychological pricing setting, and `formatCurrency` call used for the current `price`. Omit it if the value or formatted field is unavailable. Do not show a mixed currency amount. Add no discount percentage, expiry, or scarcity claim. WhatsApp may emphasize text with `*...*`; other services may show the markers literally. The share URL is `https://share.nileflowafrica.com/share/product/{encodedProductId}`.
* **AC-3**: Reuse the current share choices: device sharing, WhatsApp, Facebook, X, Telegram, and Copy link. Device sharing passes the offer text without the final call to action, the branded URL in its URL field, and the product image file when supported. WhatsApp passes the actual prepared image file and the full message through the device share sheet when `navigator.canShare({ files })` allows it. It must not open a text only WhatsApp composer. If WhatsApp image sharing is unavailable or fails after preparation, offer image download when a valid image was prepared, and keep Copy link available. If image preparation fails, explain the image could not be prepared and keep Copy link available. Cancellation is silent. X opens `https://twitter.com/intent/tweet?text={encodedOfferText}&url={encodedShareUrl}`. Telegram opens `https://t.me/share/url?url={encodedShareUrl}&text={encodedOfferText}`. For both, offer text excludes the final call to action and the branded URL is passed separately. Facebook opens `https://www.facebook.com/sharer/sharer.php?u={encodedShareUrl}`. Encode each dynamic query value. Platform availability is best effort.
* **AC-4**: Resolve an image using `product.image`, then `product.imageUrl`, then the first valid value in `product.images`. Apply the existing Appwrite image normalization and accept only HTTPS URLs from `fra.cloud.appwrite.io` or `cloud.appwrite.io`. Prepare the image through the existing Website2 image proxy at 2000 pixels wide and quality 95, with a 15 second timeout and no retry. Accept only MIME types in `config.upload.allowedImageTypes`. Name the file `product-{productId}.{extension}`, mapping JPEG to `jpg`, PNG to `png`, WebP to `webp`, and GIF to `gif`. If no public image is available, the branded link and text sharing remain usable, but image metadata and image download are omitted. WhatsApp must still avoid a text only composer.
* **AC-5**: Copy link copies the absolute branded product URL and shows success feedback. If clipboard access fails, show the full share message in a focusable, selectable, read only field and show clear failure feedback. Device sharing is disabled with an accessible explanation when `navigator.share` is unavailable. Other platform links and Copy link remain available. Revoke temporary object URLs after image downloads and clean them up when the chooser closes or the component unmounts.
* **AC-6**: Add the public `GET https://share.nileflowafrica.com/share/product/{productId}` route to the existing Backend service. It returns crawler readable HTML metadata in the first response, `Content-Type: text/html; charset=utf-8`, and `Cache-Control: no-store`. Use Open Graph and Twitter title and description metadata, `twitter:card=summary_large_image`, and include the public product image when valid. Set `og:url` to the branded product URL. The title is `{productName} on Nile Flow`, using `Product` when the name is absent. The description is `Shop {productName} on Nile Flow for {catalogPrice}.`; when the original catalog price is valid and higher, append `Original price: {originalCatalogPrice}.` after a space. Treat the raw numeric `price` and `originalPrice` from Appwrite as KES, consistent with product currency enrichment, and format both with the existing `formatCurrency` helper using KES. Do not use the product document's `currency` field to interpret these raw amounts. Set a canonical Website2 URL at `/products/{encodedProductId}`, set `noindex,follow`, and redirect to that fixed canonical URL with a visible link fallback if JavaScript is unavailable. Never accept a redirect destination from the request.
* **AC-7**: The public preview uses the Backend's existing Appwrite product collection and centralized product visibility rules. It returns the same not found response for a missing product, a product that is not shopper visible, or a product with no valid catalog price. This excludes inactive, suspended, archived, hidden, draft, pending, and rejected products, but does not exclude out of stock products. When product approval is required, a product must also have `isApproved === true`. A temporary Appwrite lookup failure returns a server error and is logged without exposing private product data. Limit the route to 60 requests per minute per IP, reusing the existing share preview rate limit behavior. The response contains only data needed for its title, description, image, canonical link, and redirect.
* **AC-8**: Do not create a share record, analytics event, or stored product field for this feature. Use the existing share origin configuration and Website2 canonical URL configuration. No new service, package, secret, or database migration is required.

## Feature design

**Data model sketch**:

| Entity | Key and values used | Nullability and relationship |
|---|---|---|
| Existing Appwrite Product document | `$id`; `productName`, `name`, or `title`; numeric `price` and optional numeric `originalPrice` in KES; optional display fields and `currency` metadata; `image`, `imageUrl`, and `images`; `isActive`, `isApproved`, and `status` for visibility | No new entity or stored field. The numeric catalog amounts use KES regardless of the separate `currency` metadata field. The share URL uses the document `$id`. |
| Share record | None | No share record is created. |

**State transitions**: None. Sharing does not change product state.

**API surface**:

| Endpoint or action | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| Product share preview | `GET /share/product/:productId` | Encoded Appwrite product document ID in the path | `200` HTML with social metadata, no store cache policy, canonical Website2 redirect, and visible link fallback | Public, no sign in | `404` for missing, unshareable, or not shopper visible product; `429` when rate limited; `500` for unexpected Appwrite lookup failure |
| Load product detail | Existing `GET /api/customerprofile/fetch-product?productId=...` | Product ID and target currency resolved by existing currency middleware | Product detail record, including the existing KES based enriched current price and transient `originalPriceDisplayValue` when a valid KES original price is present | Existing public customer product read | Existing product lookup errors |
| Open share chooser | Browser action on ProductDetailPage | Existing product detail record | Accessible chooser with device, WhatsApp, Facebook, X, Telegram, and Copy link actions | None | Missing product image uses text and link fallbacks |
| Copy product link | Browser clipboard action | Absolute branded product URL | Clipboard success feedback | None | Selectable full message and failure feedback |
| Share product image | Browser file share or download | Prepared image file and share message | Device share sheet or user initiated download | None | No text only WhatsApp fallback; user cancellation is silent |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Show the Share control | Product identity and whether the ordinary product share action is eligible | The record loaded by `productService.getProduct(productId)` and the `ProductDetailPage` route. Active deals use the existing deal flow. |
| Build ordinary product message | Product name | First nonempty value from `product.productName`, `product.name`, and `product.title`; otherwise `Product` |
| Build ordinary product message | Current price | The exact `priceStr` already computed for ProductDetailPage, which uses `product.displayPrice`, `product.price.displayValue`, or the page's existing numeric or string fallback |
| Build ordinary product message | Optional original price | Finite numeric `product.originalPrice` greater than the KES catalog price. Extend existing `enrichProductWithCurrency` to convert it from KES with the same target currency, rate, rounding mode, psychological pricing setting, and `formatCurrency` behavior as `product.price`, exposing it as transient `originalPriceDisplayValue`. Omit it if the value or formatted field is unavailable. |
| Build branded product URL | Absolute share URL | First nonempty trimmed ID from `product.$id`, `product.productId`, then `product.id`, encoded in `/share/product/{productId}` on Website2 `config.sharing.dealShareOrigin`; the Backend resolves that ID as the Appwrite document ID |
| Prepare image file | Public image URL | First valid normalized value from `product.image`, `product.imageUrl`, and `product.images`, using the existing Appwrite image URL rules |
| Prepare image file | File bytes and MIME type | `imageProxyUrl` at 2000 pixels wide and quality 95; response MIME must be in `config.upload.allowedImageTypes` |
| Device share | Offer text, URL, and optional image file | Fixed message template in AC-2; omit the final call to action from text, pass the branded link in the URL field, and attach the prepared image only when file sharing is supported |
| WhatsApp share | Full message and image | Fixed message template and prepared image file from AC-2 and AC-4, passed through `navigator.share` only when `navigator.canShare({ files })` is true |
| Social share links | Encoded destination values | Branded product URL and offer text from AC-2 and the destination query rules in AC-3 |
| Copy link and recovery message | URL and full selectable share message | The branded URL and the message template from AC-2; clipboard result determines success or failure feedback |
| Product preview title | Product name | Appwrite product document `productName`, `name`, or `title`, with `Product` fallback |
| Product preview description | Catalog price and optional original catalog price | Raw numeric Appwrite `price` and `originalPrice`, both treated as KES; format both with `formatCurrency(amount, "KES")`. Ignore product `currency` metadata for these catalog amounts. |
| Product preview image | Public social image URL | Appwrite product `image`, `imageUrl`, then `images`, normalized and allowlisted by the existing Backend Appwrite image helper |
| Product preview canonical URL and redirect | Fixed Website2 product detail URL | Backend `WEBSITE2_URL` and encoded Appwrite product document `$id` |
| Product preview visibility | Whether the public HTML is returned | Existing `productPublishingService.isVisible(product)` rule, plus `productPublishingService.isApprovalRequired()` and `product.isApproved` when approval is enabled; a finite catalog price is also required |
| Rate limit response | Request allowance | Existing share preview limit behavior, 60 requests per minute per IP |

**Key invariants**:

* The share control appears only on ProductDetailPage, apart from existing deal share controls. It is disabled with the exact accessible explanation `This product link is unavailable and cannot be shared.` when the product ID is missing, and `This product does not have a valid price and cannot be shared.` when the current price is missing or invalid.
* Shared current price matches the text shown on ProductDetailPage. Raw catalog `price` and `originalPrice` values are KES, matching the existing currency converter. The product document's separate `currency` field is not authoritative for those amounts.
* Deal products retain the existing deal message and preview route.
* Share URLs use the branded share origin and a fixed canonical destination. Request input cannot set a redirect target.
* Public product previews expose only fields needed to create the metadata and redirect.
* The product visibility rule does not depend on stock, so out of stock products remain shareable. When product approval is enabled, only records with `isApproved === true` are shareable.
* A WhatsApp image share never degrades into a text only composer.
* No share analytics or user data is stored.

**Security model**:

The product preview is public because social crawlers and recipients do not have a Nile Flow session. The Backend reads the product using its existing Appwrite service credentials and returns only safe display values. It checks the centralized shopper visibility rule and active approval requirement, validates the path ID, normalizes and allowlists Appwrite image URLs, escapes values in HTML and script output, uses a fixed canonical destination, and applies the existing share route rate limit. No payment, health, or account data is involved.

**Configuration required**:

None. Reuse `DEAL_SHARE_URL`, `WEBSITE2_URL`, and the existing Website2 share origin setting. No new secret or credential is introduced.

**Critical test scenarios**:

* Happy path: open the product detail page, share an in stock product, and confirm the overlay action, chooser options, branded URL, expected message, and product image behavior. Verifies **AC-1**, **AC-2**, **AC-3**, and **AC-4**.
* Out of stock product: confirm Share remains available and the preview is returned for a shopper visible product. Verifies **AC-1** and **AC-7**.
* Deal product: confirm the new product share flow does not replace the existing deal message or branded deal URL. Verifies **AC-1** and **AC-8**.
* Price values: test `displayPrice`, numeric price, price object, and string fallbacks. Test missing or invalid current price, and absent, equal, lower, invalid, and valid `originalPrice` values. Verify that a valid original price is enriched from KES using the same rate and rounding configuration as the current price, regardless of the product `currency` metadata. Verify the public preview formats both raw amounts as KES and the exact accessible explanation when sharing is disabled. Verifies **AC-2**, **AC-6**, and **AC-8**.
* Image sharing: test each allowed image source, invalid or unavailable image URLs, unsupported MIME types, proxy timeout, file sharing support, file sharing rejection, image download, and temporary URL cleanup. Verifies **AC-3** and **AC-4**.
* Copy failure: deny clipboard access and confirm the complete selectable message and failure feedback remain available. Verifies **AC-5**.
* Social preview: request the branded route as a crawler without authentication and confirm first response HTML contains the expected metadata, public image when valid, noindex directive, canonical Website2 URL, and fixed redirect. Verifies **AC-6**.
* Visibility and server errors: confirm missing, inactive, hidden, pending, suspended, archived, draft, rejected, and explicitly unapproved products return not found when approval is enabled; out of stock visible products return a preview; unexpected Appwrite errors are logged and return a server error; and excessive requests are rate limited. Verifies **AC-7**.
* Persistence and configuration: confirm no share record or product field is written and no new environment setting is required. Verifies **AC-8**.

## Build plan

The Website2 project uses a Tracer Bullet approach, so build one complete product share path across the Backend and Website2 first, then tighten image and failure handling.

1. [x] Add the public Backend product preview route using Appwrite product data, centralized visibility, safe HTML metadata, and the fixed Website2 redirect. Reuse the current share host configuration and limiter. Satisfies **AC-6**, **AC-7**, and **AC-8**.
2. [x] Add the product share message builder and chooser behavior, including the branded URL, supported destinations, clipboard feedback, and explicit deal flow separation. Satisfies **AC-1**, **AC-2**, **AC-3**, and **AC-5**.
3. [x] Add the compact accessible Share control to the product image area, then connect it to the chooser without changing product listing cards or purchase controls. Satisfies **AC-1**, **AC-2**, and **AC-3**.
4. [x] Add high quality image preparation, actual file sharing, download recovery, and cleanup. Extend `enrichProductWithCurrency` to provide a transient `originalPriceDisplayValue` from the KES original amount using the same conversion settings as the current price. Satisfies **AC-2**, **AC-3**, and **AC-4**.
5. [x] Add focused tests for the preview route, visibility, message values, sharing fallbacks, and deal separation, then run the Website2 production build and relevant Backend tests. Satisfies **AC-1** through **AC-8**.

## Consequences

**Positive**:

* Shoppers can share ordinary products from the page where they review product details.
* Social apps can read product metadata and a public image before the page redirects.
* Existing deal sharing, product records, share domain, and browser capabilities remain in use.

**Negative / tradeoffs**:

* The Backend serves another public preview route and must keep its product visibility and HTML escaping behavior correct.
* Product image sharing still depends on browser file sharing and the public image being available. Some recipients may see only the link preview.
* Product sharing follows the existing KES catalog price model even though product creation also stores a `currency` metadata field. That field does not currently control product price enrichment.

**Neutral**:

* No product migration, new service, analytics record, or new secret is introduced.
* The branded preview is not indexed by search engines, but social crawlers can still read its metadata.
