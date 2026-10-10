# 0001. Share deal products from Website2

**Date**: 2026-10-10
**Status**: In Progress

## Summary

Each active deal card will let shoppers share the offer details and a direct link. A chooser will offer the device share sheet, WhatsApp, Facebook, X, Telegram, and copying the link. Each social platform will receive content suited to its sharing format. Expired offers will show a disabled share button, and the feature will use existing Website2 product data without adding a backend service or saved data.

## Requirements

**User stories**:
- As a shopper, I want to share a deal's price, discount, and link through the device share sheet or my preferred social platform so that other people can view the offer.
- As a shopper, I want to know when a deal cannot be shared because it has expired.

**Acceptance criteria**:
- **AC-1**: Each active deal card shows a clearly labeled Share button with a general share icon, not a WhatsApp icon. Selecting it opens an accessible chooser with options for the device share sheet, WhatsApp, Facebook, X, Telegram, and copying the deal link. Platform icons appear beside their respective choices in the chooser.
- **AC-2**: The share content uses these lines in order: `Check out {productName} on Nile Flow!`, `Deal price: KES {dealPrice}`, `Original price: KES {originalPrice}`, `Save {discount}%`, optional `Offer ends: {expiry}`, and `Shop now: {dealUrl}`. Replace each placeholder with its sourced value. Prices use the same `KES ${value.toLocaleString()}` format as the deal card. Product name falls back to `this deal`; if the product ID, either price, or discount is missing or invalid, sharing is disabled with an accessible explanation. When an expiry time exists, format it with `Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })` in the shopper's local timezone. The direct link uses the public `/deal/{productId}` route on the current Website2 origin.
- **AC-3**: The device share sheet receives the offer lines as text and the direct deal link as its URL. WhatsApp opens `https://wa.me/?text={encodedFullMessage}`. X opens `https://twitter.com/intent/tweet?text={encodedOfferText}&url={encodedDealUrl}`. Telegram opens `https://t.me/share/url?url={encodedDealUrl}&text={encodedOfferText}`. Facebook opens `https://www.facebook.com/sharer/sharer.php?u={encodedDealUrl}`. Encode each dynamic query value with `encodeURIComponent`. The shopper completes any post or status in the selected platform. Platform availability and Facebook preview contents are best effort and controlled by the platform.
- **AC-4**: Choosing Copy link copies the absolute deal page URL and shows clear success feedback. If copying fails, the full share message remains visible in a focusable, read only text area that can be selected and copied, with clear failure feedback.
- **AC-5**: A deal is expired when its valid end time is at or before the current time. An expired deal keeps its Share button visible but disabled, with an accessible explanation. An absent expiry means the deal does not expire. A present but invalid expiry, or missing or invalid required share data, disables sharing with an accessible explanation. If the browser does not support the device share sheet, that chooser option is disabled with an explanation while the four direct social options and Copy link remain available. Closing the device share sheet without sharing is treated as cancellation and does not show an error.

## Decision

**Chosen option**: Option 1: Add a deal share chooser to each card.

Use a small chooser on each Website2 deal card. It offers the device share sheet, direct share links for WhatsApp, Facebook, X, and Telegram, and copy link. WhatsApp, X, and Telegram receive the complete offer message and URL. Facebook receives the URL so it can build its own link preview. No direct posting to social accounts, generated image, analytics tracking, or server side share service is included.

## Feature design

**Data model sketch**:

No persistent data model is needed. The chooser's open or closed state is temporary interface state. Product and offer values come from the existing deal product object.

**State transitions**:

Not applicable. Opening and closing the chooser is temporary interface state, not a persisted business workflow.

**API surface**:

No backend endpoint is needed. The browser uses the existing product data and browser sharing, clipboard, and link actions.

| Action | Inputs | Outputs | Authentication | Key errors |
|---|---|---|---|---|
| Open deal share chooser | Deal product object | Chooser with supported actions | None | Expired deal leaves the button visible and disabled |
| Share with device | Share message and deal URL | Browser or device share sheet | None | Unsupported capability is disabled; dismissal is a normal cancellation |
| Share with WhatsApp | Full share message, URL encoded in the `text` query parameter | WhatsApp share composer | None | Browser or WhatsApp availability is outside Website2 control |
| Share with Facebook | Absolute deal URL, URL encoded in the `u` query parameter | Facebook link share dialog | None | Browser or Facebook availability is outside Website2 control; preview is best effort |
| Share with X | Offer text and absolute deal URL, each URL encoded in its own query parameter | X post composer | None | Browser or X availability is outside Website2 control |
| Share with Telegram | Offer text and absolute deal URL, each URL encoded in its own query parameter | Telegram share composer | None | Browser or Telegram availability is outside Website2 control |
| Copy deal link | Absolute deal URL | Clipboard write and success feedback | None | On failure, show the complete selectable message and failure feedback |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Build share message | Product name | `product.productName`, falling back to `this deal` when absent |
| Build share message | Deal price | Finite numeric `product.dealPrice`, formatted with the deal card's `KES ${value.toLocaleString()}` format |
| Build share message | Original price | Finite numeric `product.price`, formatted with the deal card's `KES ${value.toLocaleString()}` format |
| Build share message | Discount percentage | Finite numeric `discount` passed to the card, sourced from `product.discount` and matching the card |
| Build share message | Optional expiry date and time | A valid `product.endTime`, formatted with `Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' })` in the shopper's local timezone |
| Build share link | Absolute product deal URL | Website2's current origin and `/deal/${encodeURIComponent(product.$id)}`; missing or invalid product ID disables sharing |
| Prepare device share | Offer text and deal URL | Offer text excludes the final link line; the URL field receives the direct deal URL |
| Prepare WhatsApp share | Full share message | Offer text followed by `Shop now: {dealUrl}`, URL encoded as the `text` query parameter |
| Prepare Facebook share | Direct deal URL | Website2's current origin and deal route, URL encoded as the `u` query parameter; any preview is controlled by Facebook |
| Prepare X share | Offer text and deal URL | Offer text in the `text` query parameter and deal URL in the `url` query parameter, each URL encoded |
| Prepare Telegram share | Offer text and deal URL | Deal URL in the `url` query parameter and offer text in the `text` query parameter, each URL encoded |
| Determine whether sharing is enabled | Whether the offer can be shared | Existing deal expiry state plus presence of a valid product ID, finite prices and finite discount; missing expiry means no expiry and invalid present expiry disables sharing |
| Show share feedback | Copy success or failure | Result of the browser clipboard operation, displayed through the existing toast pattern and selectable message fallback |

**Key invariants**:
- Shared prices and discount match the values displayed on the deal card.
- Share links point to the matching Website2 deal route and do not start checkout or payment.
- Shared content includes no shopper account or personal information.
- The chooser does not claim to publish on the shopper's behalf.
- Each platform action opens a user controlled share composer; Website2 does not post automatically or request social account access.
- Facebook receives only the deal URL. Its preview content and presentation are controlled by Facebook.

**Security model**:

No sign in is required to share a public deal. Only public product offer data and the public Website2 deal URL are included. The feature does not request social credentials, share personal data, or add tracking.

**Configuration required**:

None.

**Critical test scenarios**:
- Open the chooser for an active deal and check that the general Share button and the device share sheet, four social platforms, and Copy link are available, verifies **AC-1**.
- Build a message from a deal with known prices, discount, expiry, and product ID. Check the exact ordered lines, KES price format, optional expiry line using the specified date formatter, and absolute deal URL, verifies **AC-2**.
- Invoke device sharing and each platform action. Check the expected URL template, query parameter values, URL encoding, offer text, and direct Website2 deal URL. Check Facebook receives only the direct deal URL and treat its preview as best effort, verifies **AC-3**.
- Copy a deal URL successfully, then simulate clipboard failure and check success feedback and the visible, focusable, selectable message fallback, verifies **AC-4**.
- Check expired and invalid expiry values, missing or invalid required share data, an unsupported device share sheet, and a dismissed share sheet, verifies **AC-5**.

## Build plan

- [x] Add the deal share message and absolute Website2 detail link using existing product values, satisfies **AC-2**.
- [x] Add the accessible card chooser with device share, WhatsApp, Facebook, X, Telegram, and copy link actions, using each platform's selected share format, satisfies **AC-1**, **AC-3**, **AC-4**.
- [x] Handle expired deals, unavailable browser sharing, cancellation, and clipboard failure, then verify each action, satisfies **AC-4**, **AC-5**.

## Consequences

**Positive**:
- Shoppers can share useful offer details without leaving the deals page to copy them manually.
- Shoppers can choose among several direct social sharing options without being directed to only one platform.
- The feature uses existing Website2 routes and product data.
- No new backend service, database field, credential, or dependency is required.

**Negative / tradeoffs**:
- Website2 cannot guarantee how a third party social app presents or delivers the shared message.
- A shopper must complete sharing in the selected app.

**Neutral**:
- Generated preview images and guaranteed social previews are not part of this decision. Facebook preview is best effort; the direct deal link remains available.
- Device sharing availability varies by browser.
- Facebook controls the preview and may not display every offer detail; the deal page link remains the source of the offer details.

## Rationale

Reasoning and options: see [rationale.md](./rationale.md).
