# Rationale: 0002 · share products from detail pages

## Context

Website2 product detail pages show the product name, price, images, and availability, but do not offer a general share action. The existing deal sharing flow already supports a branded link, a public social preview, browser file sharing, and recovery actions when image sharing is unavailable. Ordinary products need the same useful sharing path without being treated as expiring deals.

Website2 is a React and Vite client application. Social crawlers may read only the first HTML response and may not run its JavaScript, so the client rendered product page cannot reliably provide social preview metadata by itself. The existing Express Backend reads the Appwrite product collection and serves the branded deal preview.

## Options considered

### Option 1: Share the canonical product page directly

Use the existing Website2 product URL for all sharing and attach an image only through browser file sharing.

**Pros**:

* No Backend route is needed.
* The shared URL always points directly to the product detail page.

**Cons**:

* Social crawlers may not receive product metadata or the image because Website2 renders them in the browser.
* Destinations that rely on link previews cannot reliably show the image.

### Option 2: Add a branded product preview route

Add a separate public Backend route on the existing share subdomain. It returns product metadata for crawlers and redirects shoppers to the canonical product page.

**Pros**:

* Social crawlers receive title, price, and public image metadata in the first response.
* The existing share domain, Appwrite access, image handling, and rate limit can be reused.
* Deal sharing stays unchanged.

**Cons**:

* The Backend must apply current product visibility rules and safely escape product values.
* A public route adds another endpoint to maintain and monitor.

### Option 3: Extend the deal preview route to support ordinary products

Change the existing deal route and controller to handle both deals and ordinary products.

**Pros**:

* Both product types could share one preview host and controller.
* Some metadata and redirect code could be shared.

**Cons**:

* Ordinary products and deals have different validity rules and message content.
* Changes to the deal flow could break existing offer sharing.

## Decision

**Chosen option**: Option 2: Add a branded product preview route.

Add a product preview route to the existing Backend and connect it to a Share control on ProductDetailPage. Reuse the existing sharing choices, branded host, image proxy, and browser fallbacks. Keep deal products on their current deal share flow.

**Implementation skills**: None. The feature uses the existing Website2 and Backend patterns.

## Rationale

The product detail page is the right place for this action because shoppers already view the product image and details there. An overlay keeps sharing discoverable without crowding the purchase controls. A public Backend preview is needed because social crawlers may not run Website2 JavaScript, and the branded host already serves the deal preview. Reusing its infrastructure avoids a new service or domain.

Ordinary products do not have deal expiry or discount requirements. Keeping a separate route and message avoids weakening the deal validation rules or making ordinary product messages look like time limited offers. The existing product record remains the source of truth, and existing product visibility rules prevent a public preview from exposing products that shoppers cannot see.

## References

**Project sources**:

* `Website2/src/features/products/pages/ProductDetailPage.jsx`, product name and price display, product image selection, and page route.
* `Website2/src/features/deals/pages/DealsPage.jsx` and `Website2/src/features/deals/utils/dealShareContent.js`, current share chooser and message handling patterns.
* `Website2/src/api/config/index.js`, existing share origin configuration.
* `Backend/controllers/v1/dealShareController.js`, public crawler metadata, safe redirect, and rate limit patterns.
* `Backend/services/productPublishingService.js`, centralized product visibility rule.
* `Backend/utils/appwriteImages.js`, public Appwrite image normalization.
* `Backend/utils/currencyConverter.js`, catalog currency and display price enrichment.
* `docs/specs/Website2/0001-share-deal-products/index.md`, established deal sharing behavior.
* `docs/scope/Website2/scope.md`, Website2 Tracer Bullet and Beta workflow.

**Practices & standards**:

* Open Graph and Twitter metadata for social link previews.
* Fixed redirect destinations, output escaping, and least data exposure for public HTML routes.
