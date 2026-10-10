# 0001. Share deal products from Website2

**Date**: 2026-10-10
**Status**: In Progress

## Summary

Each active deal card lets shoppers share the offer details and product image. The chooser offers device sharing, WhatsApp, Facebook, X, Telegram, and copying a link. Share previews use `share.nileflowafrica.com/share/deal/{dealId}`, a branded subdomain on the existing Render hosted Backend service.

## Requirements

**User stories**:
- As a shopper, I want to share a deal's price, discount, product image, and link through the device share sheet or my preferred social platform so that other people can view the offer.
- As a shopper, I want to know when a deal cannot be shared because it has expired.

**Acceptance criteria**:
- **AC-1**: Each active deal card shows a clearly labeled Share button with a general share icon, not a WhatsApp icon. Selecting it opens an accessible chooser with options for the device share sheet, WhatsApp, Facebook, X, Telegram, and copying the deal link. Use the existing `lucide-react` icons and inline platform marks; do not add an icon dependency.
- **AC-2**: Build the plain text share message in this order: `✨ *DEAL ALERT*`, `🛍️ *{productName}*`, `💸 Now *KES {dealPrice}* (was KES {originalPrice})`, `🔥 *Save {discount}%*`, an optional `⏰ Ends {expiry}` line, a blank line, then `🛒 *Shop now:* {shareUrl}`. Replace each placeholder with its sourced value. Use `*...*` markers to emphasize key details in WhatsApp; other platforms may display the markers literally. Do not promise colors or custom fonts, or add unsupported stock or scarcity claims. Prices use the same `KES ${value.toLocaleString()}` format as the deal card. Product name falls back to `this deal`; if the product ID, either price, or discount is missing or invalid, sharing is disabled with an accessible explanation. When an expiry time exists, format it with `Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })` in the shopper's local timezone and include the expiry line; otherwise omit that line. The share URL is `https://share.nileflowafrica.com/share/deal/{dealId}` and does not expose the Backend service URL or an API path.
- **AC-3**: Use the formatted offer lines from AC-2 wherever a destination accepts text. The device share sheet receives the offer lines without the final call to action, the branded share URL in its URL field, and the product image file when file sharing is supported. WhatsApp uses the device file share sheet to pass the actual image file and full formatted message, including its final call to action and branded URL; the shopper chooses WhatsApp and then Status if that option is available. Website2 does not claim it can preselect or publish to WhatsApp Status. If the browser cannot share the file or the share call fails after image preparation, do not open a text only WhatsApp composer. Show `Unable to share the product image. Download it and add it to your WhatsApp Status, then copy the offer link.` and offer the prepared image download and Copy link. If image preparation itself fails, explain that the image could not be prepared and keep Copy link available. A user cancellation is silent and does not show an error. X opens `https://twitter.com/intent/tweet?text={encodedOfferText}&url={encodedShareUrl}`. Telegram opens `https://t.me/share/url?url={encodedShareUrl}&text={encodedOfferText}`. For X and Telegram, `encodedOfferText` contains the formatted offer lines without the final call to action, and `encodedShareUrl` supplies the destination link separately. Facebook opens `https://www.facebook.com/sharer/sharer.php?u={encodedShareUrl}` so its preview comes from the branded share page. Encode each dynamic query value with `encodeURIComponent`. The shopper completes any post or status in the selected platform. Platform availability is best effort and controlled by the platform.
- **AC-4**: Choosing Copy link copies the absolute branded share URL and shows clear success feedback. If copying fails, the full share message remains visible in a focusable, read only text area that can be selected and copied, with clear failure feedback.
- **AC-5**: A deal is shareable only when its document exists, `isDeal === true`, its Appwrite `$id` is a nonempty string, its `dealPrice`, `price`, and `discount` are finite numbers, and its `dealEndTime` is null or absent, or a valid time later than the current clock. The deal products API preserves `dealEndTime` as `endTime` and returns null when no expiry is stored. It does not invent a 24 hour expiry. Hide the countdown row when the deal has no expiry. A present but invalid expiry is not shareable. The frontend compares parsed timestamps with `Date.now()` and the backend compares them with its `Date.now()`; both use this same predicate. An expired deal keeps its Share button visible but disabled, with the accessible message `This deal has expired and cannot be shared.` An invalid expiry or required field also disables sharing with the exact accessible messages in the feedback table. If `navigator.share` is unavailable, its device share action is disabled with `Device sharing is not available in this browser.` Other platform links, WhatsApp's download and Copy link fallback, and Copy link remain available. Closing the device share sheet without sharing is treated as cancellation and does not show an error.
- **AC-6**: Resolve an image from the deal's `image` field first, then the first valid entry in `images`. Normalize file IDs and URLs with the existing Appwrite public image normalization. Accept only HTTPS URLs whose host is `fra.cloud.appwrite.io` or `cloud.appwrite.io`. While the chooser is open, fetch the image through `imageProxyUrl` with a 15 second abort timeout and no retry, whether or not `navigator.share` is available. Accept only responses whose MIME type is in `config.upload.allowedImageTypes`. Name the image file `deal-{dealId}.{extension}`, using the Appwrite `$id` and mapping `image/jpeg` to `jpg`, `image/png` to `png`, `image/webp` to `webp`, and `image/gif` to `gif`. For WhatsApp, call `navigator.share` only when `navigator.canShare({ files })` returns true for the prepared file. Pass the actual image file and the full offer message, including the branded share URL. If file sharing is unsupported or image preparation fails, do not send a text only WhatsApp share. If a valid image was fetched, offer a `Download product image` action that downloads the fetched image through a temporary object URL using the same file name, then revoke that URL. Keep the existing `Copy link` action available as a separate action. If no valid image could be fetched, explain that it is unavailable and keep `Copy link` available. Other device sharing may still send the offer text and branded URL without a file. Disable WhatsApp image sharing while the image is being prepared and show `Preparing product image for WhatsApp sharing.` Other share options remain available.
- **AC-7**: The public `GET https://share.nileflowafrica.com/share/deal/{dealId}` route returns `200` HTML with `Content-Type: text/html; charset=utf-8` and `Cache-Control: no-store`. The route is served directly by the existing Backend Express service on Render. Add a public route alias in `Backend/src/index.js` that invokes the existing deal preview controller and limiter. Add `share.nileflowafrica.com` as a custom domain on the Render service, then configure exactly the DNS record type, target, and any verification values that Render shows for this service. The engineer or DNS administrator who owns the `nileflowafrica.com` DNS zone applies the record. Do not guess the DNS record type or change routing or hosting for `nileflowafrica.com`. Before switching Website2 links, confirm Render has verified the custom domain and issued HTTPS. The first HTML response contains crawler readable Open Graph and Twitter metadata before client side navigation. The title is `{productName} on Nile Flow`, using `This Nile Flow deal` when the name is missing. The description is `Save {discount}% on {productName}. Deal price: KES {dealPrice}. Original price: KES {originalPrice}.`, using `this deal` when the name is missing and the raw numeric deal fields. Include `og:title`, `og:description`, `og:url` set to `DEAL_SHARE_URL/share/deal/{dealId}`, `og:image` when an image exists, and Twitter title, description, image, and `summary_large_image` card metadata. Build `og:url` only from the validated `DEAL_SHARE_URL` setting, never from the request host or forwarded headers. The image uses the normalized HTTPS Appwrite image URL allowed in AC-6, and image metadata is omitted when neither field has a valid image. A crawler without a session, cookies, or authorization must be able to fetch the image successfully with an image content type. The canonical link is `WEBSITE2_URL/deal/{dealId}`. The page uses `window.location.replace` to send shoppers to that canonical deal page and includes a visible `Continue to this deal` link inside a `noscript` fallback. The Backend endpoint rejects a missing, inactive, expired, or invalid deal with a not found response. It does not require authentication and escapes product supplied values before inserting them into HTML. Lookup failures return a server error response. Set `WEBSITE2_URL` to the deployed Website2 origin and `DEAL_SHARE_URL` to `https://share.nileflowafrica.com` in the Backend production environment; set `VITE_DEAL_SHARE_URL` to the same share origin in the Website2 production build environment. Validate both Backend settings as absolute origins and require HTTPS in production. The old `/api/v1/deal-shares/{dealId}` route continues serving its current preview response for existing links, but Website2 never generates or copies it.

## Decision

**Chosen option**: Option 2: Extend the chooser with image sharing and a branded preview subdomain on the existing Render hosted Backend service.

Keep the existing chooser and serve social previews at `https://share.nileflowafrica.com/share/deal/{dealId}` through a custom domain attached to the Backend's existing Render web service. Add a route alias in that service for the existing preview controller. Social crawlers can read the deal image metadata, while shoppers see a Nile Flow subdomain and are redirected to the canonical Website2 deal page. WhatsApp image sharing uses a real image file through the device share sheet. If file sharing is unavailable, offer download and copy actions instead of silently sending text only. Use a plain text deal alert with spacing, emojis, and WhatsApp emphasis markers; rely on the real discount and optional expiry for urgency. Do not generate a new image, request social account access, post automatically, or add analytics tracking.

## Feature design

**Data model sketch**:

No persistent data model is needed. The chooser's open or closed state and any prepared image file are temporary interface state. Product and offer values come from the existing Appwrite deal document.

**State transitions**:

The chooser has temporary states only: closed, preparing an image, ready to share with the image, and ready to share text only. Opening the chooser starts one image preparation attempt when an eligible image exists, whether or not the browser share API is available. A successful image moves to ready with image; a missing or unsupported image, failed request, or timeout moves general device sharing to ready with text only and leaves WhatsApp without an image download. Closing while preparation is in progress aborts that request. Reopening starts a new attempt. No state is persisted.

**API surface**:

The browser uses existing product data, browser sharing and clipboard actions, and one public backend endpoint for crawler readable metadata.

| Action | Endpoint or inputs | Outputs | Authentication | Key errors |
|---|---|---|---|---|
| Resolve a share page | `GET https://share.nileflowafrica.com/share/deal/:dealId` | `200` HTML with social metadata, no store cache policy, JavaScript redirect, and no JavaScript link | None | `404` for missing or unshareable deals; `500` for an unexpected lookup failure |
| Open deal share chooser | Deal product object | Chooser with supported actions | None | Expired deal leaves the button visible and disabled |
| Share with device | Offer text, branded share URL, and optionally a product image `File` | Browser or device share sheet | None | Unsupported file sharing or image fetch failure falls back to text and URL; dismissal is a normal cancellation |
| Share with WhatsApp | Prepared image `File` and full share message via `navigator.share` | OS share sheet, then WhatsApp and Status when available | None | If file sharing is unsupported or image preparation fails, offer image download and Copy link; never launch a text only WhatsApp action; cancellation stays silent and leaves the chooser available |
| Share with Facebook | Branded share URL encoded in the `u` query parameter | Facebook share dialog with crawler readable deal preview | None | Browser or Facebook availability is outside Website2 control |
| Share with X | Offer text and branded share URL, each URL encoded in its own query parameter | X post composer with crawler readable deal preview | None | Browser or X availability is outside Website2 control |
| Share with Telegram | Offer text and branded share URL, each URL encoded in its own query parameter | Telegram share composer with crawler readable deal preview | None | Browser or Telegram availability is outside Website2 control |
| Copy deal link | Absolute branded share URL | Clipboard write and success feedback | None | On failure, show the complete selectable message and failure feedback |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Build share message | Product name with WhatsApp emphasis markers | `product.productName`, falling back to `this deal` when absent |
| Build share message | Deal price with WhatsApp emphasis markers | Finite numeric `product.dealPrice`, formatted with the deal card's `KES ${value.toLocaleString()}` format |
| Build share message | Original price | Finite numeric `product.price`, formatted with the deal card's `KES ${value.toLocaleString()}` format |
| Build share message | Discount percentage with WhatsApp emphasis markers | Finite numeric `discount` passed to the card, sourced from `product.discount` and matching the card |
| Build share message | Optional expiry date and time | A valid `product.endTime`, formatted with `Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })` in the shopper's local timezone |
| Build share message | Deal alert heading, emojis, line order, blank line before the call to action, and WhatsApp emphasis markers | The fixed message template in AC-2; no platform specific color or font controls |
| Build canonical deal link | Absolute Website2 product deal URL | Backend `WEBSITE2_URL` origin and `/deal/${encodeURIComponent(dealId)}` |
| Build share link | Absolute branded share URL | `VITE_DEAL_SHARE_URL` origin `https://share.nileflowafrica.com` and `/share/deal/{encoded product.$id}` path; missing or invalid product ID disables sharing |
| Prepare device share | Offer text, share URL, and optional image file | Offer text excludes the final link line; URL field receives the branded share URL; image bytes come from the first allowed normalized source in `product.image`, then `product.images`, fetched through `imageProxyUrl` with a 15 second timeout; file name derives from `product.$id` and the response MIME type |
| Prepare WhatsApp share | Image file and full share message | Prepared `File` from the validated image and the full share message containing the branded share URL, passed to `navigator.share`; when unsupported, the validated image URL is offered for download and Copy link copies `dealUrl` |
| Download image fallback | Downloaded image file | Prepared image `Blob` fetched through `imageProxyUrl`; create a temporary object URL for the user initiated download, then revoke it after the browser has started the download and also clean up any remaining URL when the chooser closes or the component unmounts |
| Prepare Facebook share | Branded share URL | `VITE_DEAL_SHARE_URL` and `/share/deal/{dealId}`, URL encoded as the `u` query parameter |
| Prepare X share | Offer text and branded share URL | Offer text in the `text` query parameter and share URL in the `url` query parameter, each URL encoded |
| Prepare Telegram share | Offer text and branded share URL | Share URL in the `url` query parameter and offer text in the `text` query parameter, each URL encoded |
| Prepare social preview | Title and description | Deal document `productName`, `discount`, `dealPrice`, and `price`, formatted exactly as specified in AC-7 |
| Prepare social preview | Canonical link and redirect destination | Backend `WEBSITE2_URL` and encoded Appwrite deal document `$id` |
| Prepare social preview | Open Graph share URL | Validated `DEAL_SHARE_URL` origin `https://share.nileflowafrica.com` and `/share/deal/{dealId}` path; never derived from request headers |
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
- Every branded share URL resolves through the Backend custom domain on Render to the matching canonical Website2 deal route and does not start checkout or payment.
- `DEAL_SHARE_URL` and `VITE_DEAL_SHARE_URL` are both exactly `https://share.nileflowafrica.com`; verify a generated Website2 URL matches the `og:url` returned for that deal.
- The Render custom domain serves only the Backend preview route for `/share/deal/:dealId`. The custom domain does not require a Cloudflare Worker or alter the root domain host.
- Product supplied text and URLs are escaped and validated before they are written into share page HTML. The page does not accept a caller supplied redirect destination.
- Device file sharing is capability checked with `navigator.canShare({ files })`. WhatsApp never silently falls back to text only. If a file cannot be shared, offer image download and link copy actions.
- Shared content includes no shopper account or personal information.
- The chooser does not claim to publish on the shopper's behalf.
- Each platform action opens a user controlled share composer; Website2 does not post automatically or request social account access.
- Social platforms receive only the branded share URL and offer text where their share format accepts it. Preview display remains controlled by each platform.

**Security model**:

No sign in is required to share a public deal. Only public product offer data, the branded share URL, and canonical Website2 deal URL are included. The feature does not request social credentials, share personal data, or add tracking. The Backend share route uses the existing controller and limiter; its metadata URLs are built only from the validated `DEAL_SHARE_URL` setting.

**Configuration required**:

- `WEBSITE2_URL`: public Website2 origin used by the Backend share page for the canonical destination and redirect. In production, set this to the actual deployed Website2 origin.
- `DEAL_SHARE_URL`: public share origin, set to `https://share.nileflowafrica.com` in the Backend environment and used as the only source for `og:url`.
- `VITE_DEAL_SHARE_URL`: set to the same exact `https://share.nileflowafrica.com` origin in the Website2 build environment.
- Render custom domain: add `share.nileflowafrica.com` to the existing Backend web service and configure the exact DNS record and target Render displays for that service. The DNS zone owner makes the change. Confirm Render domain verification and HTTPS before switching Website2 links.

All toast messages are announced through the existing toast region with `role="status"` and `aria-live="polite"`. Disabled explanations are associated with their controls through `aria-describedby`.

**Capability and feedback behavior**:

| Situation | User visible result and accessibility |
|---|---|
| Deal expired | Keep Share visible but disabled. Associate `This deal has expired and cannot be shared.` with the button using `aria-describedby`. |
| Product ID missing | Disable Share and associate `This deal is missing its product link and cannot be shared.` with the button. |
| Price or discount missing or invalid | Disable Share and associate `This deal is missing valid offer details and cannot be shared.` with the button. |
| Expiry value invalid | Disable Share and associate `This deal has an invalid expiry time and cannot be shared.` with the button. |
| Device share API unavailable | Disable only the device action and show `Device sharing is not available in this browser.` with `aria-describedby`. Leave platform links and Copy link available. |
| Product image loading | Disable device and WhatsApp file sharing until preparation finishes and show their corresponding preparing messages with a polite status announcement. Prepare the image even if `navigator.share` is unavailable so the download fallback can use the same fetched bytes. Other chooser actions remain available. |
| Image preparation fails or times out | Device sharing returns to text and URL sharing with an announcement. WhatsApp does not open text only. Explain that the image could not be prepared and keep Copy link available. Do not show a download action when no valid image file is available. Do not retry while the chooser remains open. |
| Chooser closes during image preparation | Abort the request without an error announcement. Reopening the chooser starts one fresh preparation attempt. |
| WhatsApp file sharing unavailable or fails | Do not open WhatsApp with text only. When a valid image was prepared but file sharing is unsupported or the share call fails, announce `Unable to share the product image. Download it and add it to your WhatsApp Status, then copy the offer link.` and offer `Download product image` and the existing `Copy link` action. If image preparation failed, explain that the image could not be prepared and leave `Copy link` available without a download action. Treat `AbortError` as a quiet cancellation and leave the chooser and its available fallback actions available. |
| Copy succeeds | Announce toast title `Deal link copied` and message `Share the link with anyone who may like this offer.` |
| Copy fails | Show a `role="alert"` message `Copying is unavailable. You can select the message below and copy it manually.` Focus a read only text area containing the full share message. |
| Device share is cancelled | Treat `AbortError` as normal cancellation and show no error or image warning. |
| Device share fails for another reason | Announce toast title `Unable to share` and message `Please try one of the social platforms or copy the deal link instead.` |
| A social platform cannot open | Use a normal user initiated link in a new tab. Do not claim success or attempt app detection. Keep the other platform links and Copy link available. |

**Critical test scenarios**:
- Open the chooser for an active deal and check that the general Share button and the device share sheet, four social platforms, and Copy link are available, verifies **AC-1**.
- Build a message from a deal with known prices, discount, expiry, and product ID. Check the exact emojis, emphasis markers, line order, blank line before the call to action, KES price format, localized expiry, and absolute branded share URL. Repeat without an expiry and confirm the expiry line is omitted. Confirm no stock or scarcity claim is added, verifies **AC-2**.
- Invoke device sharing and each platform action. Check the expected URL template, query parameter values, URL encoding, the formatted offer lines in text fields, the branded URL in URL fields, and WhatsApp's full message with the call to action. Confirm other platforms may receive the literal emphasis markers, verifies **AC-3**.
- Copy a branded share URL successfully, then simulate clipboard failure and check success feedback and the visible, focusable, selectable message fallback, verifies **AC-4**.
- Check expired and invalid expiry values, missing or invalid required share data, an unsupported device share sheet, and a dismissed share sheet, verifies **AC-5**.
- Check a deal with no stored expiry. Confirm the API returns `endTime: null`, the card shows no countdown, sharing remains enabled, and the backend share page accepts it, verifies **AC-5**, **AC-7**.
- Check that a supported browser passes a prepared image `File` and full offer message to WhatsApp sharing, then verify the OS share sheet can target WhatsApp Status on a supported phone. Simulate unsupported file sharing, missing image data, image request failure, timeout, a rejected share call, and `AbortError`. Confirm WhatsApp never sends text only, failures retain image download and Copy link when an image is available, cancellations stay quiet, and general device sharing retains its text and URL fallback. Closing during preparation aborts quietly, and reopening starts one new attempt, verifies **AC-3**, **AC-6**.
- Request `https://share.nileflowafrica.com/share/deal/{dealId}` as a crawler and confirm the response includes title, offer description, canonical Website2 URL, and product image metadata without running JavaScript. Confirm Render has verified the custom domain and HTTPS, the route reaches the Backend preview response directly, `og:url` comes from `DEAL_SHARE_URL` rather than request headers, the image URL can be fetched without a session, cookies, or authorization and returns an allowed image content type, and Website2's generated link matches `og:url`. Open the link in a browser and confirm navigation to the canonical deal page. Check missing, inactive, expired, and HTML special character product data, verifies **AC-7**.
- Request an existing `/api/v1/deal-shares/{dealId}` link and confirm it continues serving its preview response without changing older shared links, verifies **AC-7**.
- Check an image from each allowed Appwrite host, an HTTP URL, a disallowed host, an image proxy timeout, and each allowed MIME type. Confirm only allowed HTTPS sources become metadata and files; WhatsApp offers download and Copy link on every image failure and never launches with text only, while general device sharing retains text and URL sharing. Confirm temporary object URLs are revoked after download and on chooser close or component unmount, verifies **AC-3**, **AC-6**, **AC-7**.

## Build plan

1. Add the public share route alias to the existing Backend Express service, remove the now unused Cloudflare Worker source, configuration, and tests, attach the branded share subdomain to the Render service, and have the DNS zone owner configure the exact record and target Render requests. Set production `WEBSITE2_URL` to the deployed Website2 origin and `DEAL_SHARE_URL` to `https://share.nileflowafrica.com`. Verify custom domain ownership, DNS resolution, HTTPS, metadata, session free image access, redirect, and legacy Backend links before switching callers, satisfies **AC-5**, **AC-7**.
2. Set `DEAL_SHARE_URL` and `VITE_DEAL_SHARE_URL` to `https://share.nileflowafrica.com`. Preserve missing deal expiry as null, hide its countdown, and switch Website2 generated share and copy links to `/share/deal/{dealId}`, satisfies **AC-1**, **AC-2**, **AC-4**, **AC-5**.
3. Prepare product image files through the existing image proxy and capability check. Keep general device sharing's text and URL fallback, and make WhatsApp image sharing require the actual file, with download and Copy link fallback, satisfies **AC-3**, **AC-6**.
4. Verify each share destination, crawler metadata, redirect, and failure path against the deployed backend and Website2 static site, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**.

## Consequences

**Positive**:
- Shoppers can share useful offer details without leaving the deals page to copy them manually.
- The share message has a clearer visual hierarchy and makes the verified discount and expiry easy to notice.
- Shoppers can choose among several direct social sharing options without being directed to only one platform.
- Social crawlers can read deal specific metadata and product images without executing Website2's client JavaScript.
- Shoppers see the existing Nile Flow Website2 domain instead of the Backend service host.
- Device sharing includes the product image when browser support permits.
- The backend share page redirects shoppers to the canonical Website2 deal page.
- The feature uses the existing backend, Appwrite deal data, and Website2 static site.

**Negative / tradeoffs**:
- Website2 cannot guarantee how a third party social app presents or delivers the shared message.
- WhatsApp may render the emphasis markers as bold, while other destinations may show the markers literally; no destination can be guaranteed to preserve colors or fonts.
- A shopper must complete sharing in the selected app.
- The share subdomain needs a DNS record and custom domain setup on Render. Social platforms still control whether previews display the image.
- The Backend and Website2 need correctly configured `WEBSITE2_URL`, `DEAL_SHARE_URL`, and `VITE_DEAL_SHARE_URL` values. WhatsApp image attachment depends on browser file sharing and image proxy availability.

**Neutral**:
- The preview uses the product image already stored on the deal. It does not generate a new image.
- Device sharing availability varies by browser.
- Social platforms control whether and how they display crawler metadata.

## Rationale

Reasoning and options: see [rationale.md](./rationale.md).

## Follow-up

- [ ] Add `share.nileflowafrica.com` as a custom domain on the existing Backend Render service, configure its requested DNS record, and verify the public URL returns preview HTML over HTTPS before switching Website2 share links.

## Migration plan

**Strategy**: Strangler, validate the Render custom domain and existing Backend preview before switching Website2 links.
**Phases**:
1. Add a direct Backend route alias, attach `share.nileflowafrica.com` to the existing Render service, add the DNS record Render specifies, and configure trusted Backend and Website2 origins. Verify HTTPS, image access, crawler metadata, and browser navigation. Existing Backend share links continue to work.
2. Deploy Website2 with `VITE_DEAL_SHARE_URL` set to `https://share.nileflowafrica.com` and use `/share/deal/{dealId}` for sharing and copying.
**Rollback**: Revert Website2 to its previous share URL source while preserving the existing versioned preview route. Keep the Render custom domain, DNS record, and existing preview controller in place during rollback so previously shared subdomain links continue to work. Reverting Backend route aliases or environment settings is a separate operation and happens only after confirming that no live links rely on the subdomain.
**Risks**: If the DNS owner, Render custom domain, DNS record target, HTTPS certificate, or any production origin setting is incorrect, new share links may fail or preview the wrong destination. If the Appwrite image is not publicly readable without a session, crawlers cannot load it. Verify DNS, the public route, and image access before switching Website2 links.
