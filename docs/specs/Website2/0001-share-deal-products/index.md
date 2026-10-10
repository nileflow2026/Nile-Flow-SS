# 0001. Share deal products from Website2

**Date**: 2026-10-10
**Status**: In Progress

## Summary

Each active deal card lets shoppers share the offer details and product image. The chooser offers device sharing, WhatsApp, Facebook, X, Telegram, and copying a link. Social links use `www.nileflowafrica.com/share/deal/{dealId}` so platforms can read the product image and offer details without showing the Backend address.

## Requirements

**User stories**:
- As a shopper, I want to share a deal's price, discount, product image, and link through the device share sheet or my preferred social platform so that other people can view the offer.
- As a shopper, I want to know when a deal cannot be shared because it has expired.

**Acceptance criteria**:
- **AC-1**: Each active deal card shows a clearly labeled Share button with a general share icon, not a WhatsApp icon. Selecting it opens an accessible chooser with options for the device share sheet, WhatsApp, Facebook, X, Telegram, and copying the deal link. Use the existing `lucide-react` icons and inline platform marks; do not add an icon dependency.
- **AC-2**: The share content uses these lines in order: `Check out {productName} on Nile Flow!`, `Deal price: KES {dealPrice}`, `Original price: KES {originalPrice}`, `Save {discount}%`, optional `Offer ends: {expiry}`, and `Shop now: {shareUrl}`. Replace each placeholder with its sourced value. Prices use the same `KES ${value.toLocaleString()}` format as the deal card. Product name falls back to `this deal`; if the product ID, either price, or discount is missing or invalid, sharing is disabled with an accessible explanation. When an expiry time exists, format it with `Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })` in the shopper's local timezone. The share URL is `https://www.nileflowafrica.com/share/deal/{dealId}` and does not expose the Backend host or an API path.
- **AC-3**: The device share sheet receives the offer lines as text and the share URL as its URL. WhatsApp opens `https://wa.me/?text={encodedFullMessage}`. X opens `https://twitter.com/intent/tweet?text={encodedOfferText}&url={encodedShareUrl}`. Telegram opens `https://t.me/share/url?url={encodedShareUrl}&text={encodedOfferText}`. Facebook opens `https://www.facebook.com/sharer/sharer.php?u={encodedShareUrl}`. Encode each dynamic query value with `encodeURIComponent`. The shopper completes any post or status in the selected platform. Platform availability is best effort and controlled by the platform.
- **AC-4**: Choosing Copy link copies the absolute branded share URL and shows clear success feedback. If copying fails, the full share message remains visible in a focusable, read only text area that can be selected and copied, with clear failure feedback.
- **AC-5**: A deal is shareable only when its document exists, `isDeal === true`, its Appwrite `$id` is a nonempty string, its `dealPrice`, `price`, and `discount` are finite numbers, and its `dealEndTime` is null or absent, or a valid time later than the current clock. The deal products API preserves `dealEndTime` as `endTime` and returns null when no expiry is stored. It does not invent a 24 hour expiry. Hide the countdown row when the deal has no expiry. A present but invalid expiry is not shareable. The frontend compares parsed timestamps with `Date.now()` and the backend compares them with its `Date.now()`; both use this same predicate. An expired deal keeps its Share button visible but disabled, with the accessible message `This deal has expired and cannot be shared.` An invalid expiry or required field also disables sharing with the exact accessible messages in the feedback table. If `navigator.share` is unavailable, its chooser action is disabled with `Device sharing is not available in this browser.` while the four direct social options and Copy link remain available. If file sharing is unavailable, use text and URL sharing as described in AC-6. Closing the device share sheet without sharing is treated as cancellation and does not show an error.
- **AC-6**: Resolve an image from the deal's `image` field first, then the first valid entry in `images`. Normalize file IDs and URLs with the existing Appwrite public image normalization. Accept only HTTPS URLs whose host is `fra.cloud.appwrite.io` or `cloud.appwrite.io`. While the chooser is open, fetch the image through `imageProxyUrl` with a 15 second abort timeout and no retry. Attach a `File` only when the response has a MIME type in `config.upload.allowedImageTypes` and `navigator.canShare({ files })` returns true. Name the file `deal-{dealId}.{extension}`, using the Appwrite `$id` and mapping `image/jpeg` to `jpg`, `image/png` to `png`, `image/webp` to `webp`, and `image/gif` to `gif`. If file sharing is unsupported, the image is missing or invalid, the fetch fails or times out, or the returned MIME type is not allowed, device sharing still sends the offer text and share URL. After successful text and URL sharing, tell the shopper that the product image was not included. Disable the device share action while the image is being prepared and show `Preparing product image for device sharing.` Other share options remain available.
- **AC-7**: The public `GET https://www.nileflowafrica.com/share/deal/{dealId}` route returns `200` HTML with `Content-Type: text/html; charset=utf-8` and `Cache-Control: no-store`. A Cloudflare Worker handles only `GET /share/deal/{dealId}` on the Website2 host and forwards the encoded deal ID to the fixed Backend origin at `/api/v1/deal-shares/{dealId}`, returning its HTML response without exposing the Backend host in the shared link or metadata. The Worker does not accept a caller supplied upstream host or redirect destination, and other paths are not proxied. The first HTML response contains crawler readable Open Graph and Twitter metadata before client side navigation. The title is `{productName} on Nile Flow`, using `This Nile Flow deal` when the name is missing. The description is `Save {discount}% on {productName}. Deal price: KES {dealPrice}. Original price: KES {originalPrice}.`, using `this deal` when the name is missing and the raw numeric deal fields. Include `og:title`, `og:description`, `og:url` set to `DEAL_SHARE_URL/share/deal/{dealId}`, `og:image` when an image exists, and Twitter title, description, image, and `summary_large_image` card metadata. Build `og:url` only from the validated `DEAL_SHARE_URL` setting, never from the request host or forwarded headers. The image uses the normalized HTTPS Appwrite image URL allowed in AC-6, and image metadata is omitted when neither field has a valid image. A crawler without a session must be able to fetch the image successfully with an image content type. The canonical link is `WEBSITE2_URL/deal/{dealId}`. The page uses `window.location.replace` to send shoppers to that canonical deal page and includes a visible `Continue to this deal` link inside a `noscript` fallback. The Backend endpoint rejects a missing, inactive, expired, or invalid deal with a not found response. It does not require authentication and escapes product supplied values before inserting them into HTML. Lookup failures return a server error response. `WEBSITE2_URL` and `DEAL_SHARE_URL` are validated as absolute origins at startup and use HTTPS in production. The old `/api/v1/deal-shares/{dealId}` route continues serving its current preview response for existing links, but Website2 never generates or copies it.

## Decision

**Chosen option**: Option 2: Extend the chooser with image sharing and a branded preview page.

Keep the existing chooser and serve social previews at `/share/deal/{dealId}` on the existing Website2 domain. A Cloudflare Worker forwards only that path to the existing Backend preview endpoint and returns its HTML response. Social crawlers can read the deal image metadata, while shoppers see a Nile Flow domain and are redirected to the canonical Website2 deal page. Device sharing attaches the product image when supported, and falls back to text and the branded share URL when it is not. No generated image, social account access, automatic posting, or analytics tracking is included. (basis: existing Website2 static site, Backend Appwrite access, Cloudflare proxy routing)

## Feature design

**Data model sketch**:

No persistent data model is needed. The chooser's open or closed state and any prepared image file are temporary interface state. Product and offer values come from the existing Appwrite deal document.

**State transitions**:

The chooser has temporary states only: closed, preparing an image, ready to share with the image, and ready to share text only. Opening the chooser starts one image preparation attempt when an eligible image and device share API are available. A successful supported image moves to ready with image; a missing or unsupported image, failed request, or timeout moves to ready with text only. Closing while preparation is in progress aborts that request. Reopening starts a new attempt. No state is persisted.

**API surface**:

The browser uses existing product data, browser sharing and clipboard actions, and one public backend endpoint for crawler readable metadata.

| Action | Endpoint or inputs | Outputs | Authentication | Key errors |
|---|---|---|---|---|
| Resolve a share page | `GET https://www.nileflowafrica.com/share/deal/:dealId` | `200` HTML with social metadata, no store cache policy, JavaScript redirect, and no JavaScript link | None | `404` for missing or unshareable deals; `500` for an unexpected lookup failure or proxy failure |
| Open deal share chooser | Deal product object | Chooser with supported actions | None | Expired deal leaves the button visible and disabled |
| Share with device | Offer text, share URL, and optionally a product image `File` | Browser or device share sheet | None | Unsupported file sharing or image fetch failure falls back to text and URL; dismissal is a normal cancellation |
| Share with WhatsApp | Full share message, URL encoded in the `text` query parameter | WhatsApp share composer | None | Browser or WhatsApp availability is outside Website2 control |
| Share with Facebook | Branded share URL encoded in the `u` query parameter | Facebook share dialog with crawler readable deal preview | None | Browser or Facebook availability is outside Website2 control |
| Share with X | Offer text and branded share URL, each URL encoded in its own query parameter | X post composer with crawler readable deal preview | None | Browser or X availability is outside Website2 control |
| Share with Telegram | Offer text and branded share URL, each URL encoded in its own query parameter | Telegram share composer with crawler readable deal preview | None | Browser or Telegram availability is outside Website2 control |
| Copy deal link | Absolute branded share URL | Clipboard write and success feedback | None | On failure, show the complete selectable message and failure feedback |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Build share message | Product name | `product.productName`, falling back to `this deal` when absent |
| Build share message | Deal price | Finite numeric `product.dealPrice`, formatted with the deal card's `KES ${value.toLocaleString()}` format |
| Build share message | Original price | Finite numeric `product.price`, formatted with the deal card's `KES ${value.toLocaleString()}` format |
| Build share message | Discount percentage | Finite numeric `discount` passed to the card, sourced from `product.discount` and matching the card |
| Build share message | Optional expiry date and time | A valid `product.endTime`, formatted with `Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })` in the shopper's local timezone |
| Build canonical deal link | Absolute Website2 product deal URL | Backend `WEBSITE2_URL` origin and `/deal/${encodeURIComponent(dealId)}` |
| Build share link | Absolute branded share URL | `VITE_DEAL_SHARE_URL` origin and `/share/deal/{encoded product.$id}` path; missing or invalid product ID disables sharing |
| Prepare device share | Offer text, share URL, and optional image file | Offer text excludes the final link line; URL field receives the branded share URL; image bytes come from the first allowed normalized source in `product.image`, then `product.images`, fetched through `imageProxyUrl` with a 15 second timeout; file name derives from `product.$id` and the response MIME type |
| Prepare WhatsApp share | Full share message | Offer text followed by `Shop now: {shareUrl}`, URL encoded as the `text` query parameter |
| Prepare Facebook share | Branded share URL | `VITE_DEAL_SHARE_URL` and `/share/deal/{dealId}`, URL encoded as the `u` query parameter |
| Prepare X share | Offer text and branded share URL | Offer text in the `text` query parameter and share URL in the `url` query parameter, each URL encoded |
| Prepare Telegram share | Offer text and branded share URL | Share URL in the `url` query parameter and offer text in the `text` query parameter, each URL encoded |
| Prepare social preview | Title and description | Deal document `productName`, `discount`, `dealPrice`, and `price`, formatted exactly as specified in AC-7 |
| Prepare social preview | Canonical link and redirect destination | Backend `WEBSITE2_URL` and encoded Appwrite deal document `$id` |
| Prepare social preview | Open Graph share URL | Validated `DEAL_SHARE_URL` origin and `/share/deal/{dealId}` path; never derived from request headers |
| Prepare social preview | Open Graph and Twitter image | Deal document `image`, or first `images` entry, passed through the existing public Appwrite image URL normalization |
| Validate share page | Deal availability | Appwrite deal document `$id`, `isDeal`, `dealEndTime`, finite `dealPrice`, finite `price`, and finite `discount` |
| Determine whether sharing is enabled | Whether the offer can be shared | Existing deal expiry state plus presence of a valid product ID, finite prices and finite discount; missing expiry means no expiry and invalid present expiry disables sharing |
| Show share feedback | Copy success or failure | Result of the browser clipboard operation, displayed through the existing toast pattern and selectable message fallback |
| Determine image eligibility | Image URL and share file | First normalized value from `image`, then `images`; HTTPS Appwrite URLs on `fra.cloud.appwrite.io` or `cloud.appwrite.io`; image MIME must be in `config.upload.allowedImageTypes` |
| Normalize deal image URLs | Public image URL | Backend `resolveAllowedAppwriteImageUrl` in `Backend/utils/appwriteImages.js`; Website2 fetches through `imageProxyUrl` |
| Decide whether a deal is shareable | Share button state and backend response | Appwrite document `$id`, `isDeal`, `dealEndTime` (mapped to frontend `endTime`, with null preserved), and finite `dealPrice`, `price`, and `discount`; expiry is checked against the current clock |

**Image source normalization and validation**:

| Input | Normalization | Result |
|---|---|---|
| `image` followed by each `images` entry in order | A string containing a JSON object is read as an object. An object uses its first available `url`, `imageUrl`, or `id` value. A remaining string is treated as a URL or Appwrite file ID. | Select the first candidate that becomes an allowed public image URL. |
| Appwrite file ID | Build the public file URL with `APPWRITE_ENDPOINT`, `APPWRITE_STORAGE_ID`, and `APPWRITE_PROJECT_ID`, then use the public preview path. | Continue to the URL validation below. |
| Appwrite file URL | Remove impersonation query parameters, add the configured project when absent, set `mode=public`, and change a `/view` path to `/preview`. | Continue to the URL validation below. |
| Final URL | Require HTTPS, host `fra.cloud.appwrite.io` or `cloud.appwrite.io`, and no URL username or password. | Use the same normalized URL for crawler metadata and image preparation. Reject candidates that fail validation and try the next one. |

**Key invariants**:
- Shared prices and discount match the values displayed on the deal card.
- The UI and backend apply the same deal shareability predicate from AC-5 to the same Appwrite fields.
- Every branded share URL resolves through Cloudflare to the matching canonical Website2 deal route and does not start checkout or payment.
- `DEAL_SHARE_URL` and `VITE_DEAL_SHARE_URL` are both exactly `https://www.nileflowafrica.com`; verify a generated Website2 URL matches the `og:url` returned for that deal.
- The Cloudflare Worker handles only `/share/deal/*`, forwards the encoded deal ID to the existing Backend preview route, and returns the Backend response without redirecting the browser to the Backend host.
- Product supplied text and URLs are escaped and validated before they are written into share page HTML. The page does not accept a caller supplied redirect destination.
- File sharing is capability checked with `navigator.canShare({ files })`; unsupported or unavailable image files never block text and URL sharing.
- Shared content includes no shopper account or personal information.
- The chooser does not claim to publish on the shopper's behalf.
- Each platform action opens a user controlled share composer; Website2 does not post automatically or request social account access.
- Social platforms receive only the branded share URL and offer text where their share format accepts it. Preview display remains controlled by each platform.

**Security model**:

No sign in is required to share a public deal. Only public product offer data, the branded share URL, and canonical Website2 deal URL are included. The feature does not request social credentials, share personal data, or add tracking. The Cloudflare Worker uses a fixed Backend origin and does not proxy paths or destinations supplied by a caller.

**Configuration required**:

- `WEBSITE2_URL`: public Website2 origin used by the backend share page for the canonical destination and redirect. Configure the deployed Website2 origin in the Backend environment.
- `DEAL_SHARE_URL`: public share origin, set to `https://www.nileflowafrica.com` in the Backend environment and used as the only source for `og:url`.
- `VITE_DEAL_SHARE_URL`: set to the same exact `https://www.nileflowafrica.com` origin in the Website2 build environment.
- `BACKEND_ORIGIN`: Cloudflare Worker environment value set to the deployed Backend origin. The Worker uses it as the fixed upstream for `/api/v1/deal-shares/:dealId`; it is never included in shared URLs or Open Graph metadata.
- Cloudflare Worker route: configure only `www.nileflowafrica.com/share/deal/*` to the Worker.

All toast messages are announced through the existing toast region with `role="status"` and `aria-live="polite"`. Disabled explanations are associated with their controls through `aria-describedby`.

**Capability and feedback behavior**:

| Situation | User visible result and accessibility |
|---|---|
| Deal expired | Keep Share visible but disabled. Associate `This deal has expired and cannot be shared.` with the button using `aria-describedby`. |
| Product ID missing | Disable Share and associate `This deal is missing its product link and cannot be shared.` with the button. |
| Price or discount missing or invalid | Disable Share and associate `This deal is missing valid offer details and cannot be shared.` with the button. |
| Expiry value invalid | Disable Share and associate `This deal has an invalid expiry time and cannot be shared.` with the button. |
| Device share API unavailable | Disable only the device action and show `Device sharing is not available in this browser.` with `aria-describedby`. Leave platform links and Copy link available. |
| Product image loading | Disable the device action until preparation finishes and show `Preparing product image for device sharing.` with a polite status announcement. Other chooser actions remain available. |
| Image preparation fails or times out | Return the device action to enabled text only sharing, announce `The product image could not be prepared. Sharing will include the offer and link.`, and make no automatic retry while the chooser remains open. |
| Chooser closes during image preparation | Abort the request without an error announcement. Reopening the chooser starts one fresh preparation attempt. |
| Image omitted after successful device share | Announce toast title `Deal shared without image` and message `The offer and link were shared, but the product image could not be attached.` |
| Copy succeeds | Announce toast title `Deal link copied` and message `Share the link with anyone who may like this offer.` |
| Copy fails | Show a `role="alert"` message `Copying is unavailable. You can select the message below and copy it manually.` Focus a read only text area containing the full share message. |
| Device share is cancelled | Treat `AbortError` as normal cancellation and show no error or image warning. |
| Device share fails for another reason | Announce toast title `Unable to share` and message `Please try one of the social platforms or copy the deal link instead.` |
| A social platform cannot open | Use a normal user initiated link in a new tab. Do not claim success or attempt app detection. Keep the other platform links and Copy link available. |

**Critical test scenarios**:
- Open the chooser for an active deal and check that the general Share button and the device share sheet, four social platforms, and Copy link are available, verifies **AC-1**.
- Build a message from a deal with known prices, discount, expiry, and product ID. Check the exact ordered lines, KES price format, optional expiry line using the specified date formatter, and absolute branded share URL, verifies **AC-2**.
- Invoke device sharing and each platform action. Check the expected URL template, query parameter values, URL encoding, offer text, and branded share URL, verifies **AC-3**.
- Copy a branded share URL successfully, then simulate clipboard failure and check success feedback and the visible, focusable, selectable message fallback, verifies **AC-4**.
- Check expired and invalid expiry values, missing or invalid required share data, an unsupported device share sheet, and a dismissed share sheet, verifies **AC-5**.
- Check a deal with no stored expiry. Confirm the API returns `endTime: null`, the card shows no countdown, sharing remains enabled, and the backend share page accepts it, verifies **AC-5**, **AC-7**.
- Check that a supported browser receives an image `File` and the share URL. Then simulate unsupported file sharing, missing image data, image request failure, and timeout. Confirm the device action becomes enabled for text only sharing, the shopper receives the defined status, closing during preparation aborts quietly, and reopening starts one new attempt, verifies **AC-6**.
- Request `https://www.nileflowafrica.com/share/deal/{dealId}` as a crawler and confirm the response includes title, offer description, canonical Website2 URL, and product image metadata without running JavaScript. Confirm Cloudflare returns the Backend preview response without redirecting to its host, rejects paths outside the share route, does not accept a caller supplied upstream host, `og:url` comes from `DEAL_SHARE_URL` rather than request headers, the image URL can be fetched without authentication and returns an allowed image content type, and Website2's generated link matches `og:url`. Open the link in a browser and confirm navigation to the canonical deal page. Check missing, inactive, expired, and HTML special character product data, verifies **AC-7**.
- Request an existing `/api/v1/deal-shares/{dealId}` link and confirm it continues serving its preview response without changing older shared links, verifies **AC-7**.
- Check an image from each allowed Appwrite host, an HTTP URL, a disallowed host, an image proxy timeout, and each allowed MIME type. Confirm only allowed HTTPS sources become metadata and files, and every unavailable image uses text and link sharing, verifies **AC-6**, **AC-7**.

## Build plan

1. Configure the Backend preview response to build `og:url` from the trusted Website2 share origin, then configure the Cloudflare Worker route for `/share/deal/*` to proxy to the existing versioned Backend endpoint. Verify HTML escaping, unavailable deals, image accessibility, metadata, and browser navigation while preserving old Backend links, satisfies **AC-5**, **AC-7**.
2. Preserve missing deal expiry as null in the deal products API and hide the countdown for those deals. Set `VITE_DEAL_SHARE_URL` to the Website2 origin and update Website2 links to use `/share/deal/{dealId}`, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**.
3. Prepare product image files through the existing image proxy and capability check, keeping text and URL sharing available when image sharing is unsupported or fails, satisfies **AC-5**, **AC-6**.
4. Verify each share destination, crawler metadata, redirect, and failure path against the deployed backend and Website2 static site, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**.

## Consequences

**Positive**:
- Shoppers can share useful offer details without leaving the deals page to copy them manually.
- Shoppers can choose among several direct social sharing options without being directed to only one platform.
- Social crawlers can read deal specific metadata and product images without executing Website2's client JavaScript.
- Shoppers see the existing Nile Flow Website2 domain instead of the Backend service host.
- Device sharing includes the product image when browser support permits.
- The backend share page redirects shoppers to the canonical Website2 deal page.
- The feature uses the existing backend, Appwrite deal data, and Website2 static site.

**Negative / tradeoffs**:
- Website2 cannot guarantee how a third party social app presents or delivers the shared message.
- A shopper must complete sharing in the selected app.
- Cloudflare needs a Worker route for the share path, and the preview still adds one navigation step before reaching Website2.
- The Backend and Website2 need correctly configured `WEBSITE2_URL`, `DEAL_SHARE_URL`, and `VITE_DEAL_SHARE_URL` values. Image attachment depends on browser file sharing and image proxy availability.

**Neutral**:
- The preview uses the product image already stored on the deal. It does not generate a new image.
- Device sharing availability varies by browser.
- Social platforms control whether and how they display crawler metadata.

## Rationale

Reasoning and options: see [rationale.md](./rationale.md).

## Follow-up

- [ ] Configure the Cloudflare Worker route for `www.nileflowafrica.com/share/deal/*`, set its Backend service origin, and verify the public URL returns preview HTML over HTTPS before switching Website2 share links.

## Migration plan

**Strategy**: Strangler, validate the Cloudflare proxy and existing Backend preview before switching Website2 links.
**Phases**:
1. Configure the Cloudflare Worker route for `/share/deal/*` on `www.nileflowafrica.com` to forward to the existing Backend preview endpoint. Configure trusted Backend and Website2 origins, then verify HTTPS, image access, crawler metadata, and browser navigation. Existing Backend share links continue to work.
2. Deploy Website2 with `VITE_DEAL_SHARE_URL` set to `https://www.nileflowafrica.com` and use `/share/deal/{dealId}` for sharing and copying.
**Rollback**: Revert Website2 to its previous share URL source while preserving the existing versioned preview route. The canonical Website2 deal URL remains unchanged.
**Risks**: If the Worker route, configured Backend origin, HTTPS, or either share origin setting is incorrect, new share links may fail or preview the wrong image. Verify the public route and crawler metadata before switching Website2 links.
