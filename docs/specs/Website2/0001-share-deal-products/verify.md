# Verify Website2 deal sharing, spec 0001, updated 2026-10-10

_Steps derived from spec 0001 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [x] Visit `/deals`, open an active product's Share button, confirm the button uses a general share icon and the accessible chooser offers device sharing, WhatsApp, Facebook, X, Telegram, and Copy link. → AC-1
- [x] Check the displayed offer message line by line against the deal card. Confirm the product name, prices, discount, optional expiry, and direct deal URL use the specified order and formats. → AC-2
- [x] In a browser that supports device sharing, activate Share from this device and confirm the offer text and direct deal URL are passed separately. In a browser without support, confirm that option is disabled with an explanation while the direct platform choices remain enabled. → AC-3, AC-5
- [x] Inspect each social link without completing a post. Confirm WhatsApp uses the full encoded message in `text`; Facebook uses only the encoded deal URL in `u`; X uses the offer text in `text` and deal URL in `url`; Telegram uses deal URL in `url` and offer text in `text`. → AC-3
- [x] Copy a deal link and confirm success feedback. Deny clipboard access and confirm the visible read only message field is focused, selectable, and includes the deal link, with failure feedback. → AC-4
- [x] Check a deal whose end time is at or before now, a deal without an end time, an invalid end time, and missing product ID, prices, or discount. Confirm expired or invalid offers are disabled with an explanation, and an offer without an expiry remains shareable. → AC-5
- [x] Dismiss the device share sheet without sharing and confirm no error is shown. → AC-5

## Value sourcing checks

- [x] Use a product with a name and a product without one. Confirm the message uses `product.productName`, then the `this deal` fallback. → AC-2
- [x] Compare the shared deal price with the card's `product.dealPrice` value and confirm the `KES` label and `toLocaleString()` formatting match. → AC-2
- [x] Compare the shared original price with the card's `product.price` value and confirm the `KES` label and `toLocaleString()` formatting match. → AC-2
- [x] Compare the shared discount with the card's `discount` value sourced from `product.discount`. → AC-2
- [x] Compare the expiry line with `product.endTime`; change the browser locale or timezone and confirm `Intl.DateTimeFormat` reflects the shopper's local settings. → AC-2
- [x] Confirm the link uses the current Website2 origin and the encoded `product.$id` in `/deal/{productId}`. → AC-2, AC-4
- [x] Confirm device sharing receives offer text without the final link line and receives the deal link in its URL field. → AC-3
- [x] Decode WhatsApp's `text` query parameter and confirm it contains all offer lines and `Shop now: {dealUrl}`. → AC-3
- [x] Decode Facebook's `u` query parameter and confirm it contains only the direct deal URL. Treat any Facebook preview as best effort. → AC-3
- [x] Decode X's `text` and `url` query parameters and confirm each contains the expected offer text or deal URL. → AC-3
- [x] Decode Telegram's `url` and `text` query parameters and confirm each contains the expected deal URL or offer text. → AC-3
- [x] Change the product ID, prices, discount, and end time independently. Confirm invalid required data disables sharing, an end time at or before now is expired, a missing end time is not expired, and a valid active offer remains shareable. → AC-5
- [x] Allow and deny clipboard writes. Confirm the user feedback and visible selectable fallback match the clipboard result. → AC-4

## Commands

- [x] From `Website2`, run `npm run build` and confirm the production build and sitemap generation complete successfully. → AC-1, AC-2, AC-3, AC-4, AC-5

## Acceptance criteria coverage

- AC-1 covered by the active deal chooser check and platform option visibility.
- AC-2 covered by message comparison and the product name, price, discount, expiry, and URL source checks.
- AC-3 covered by device payload and platform URL parameter checks.
- AC-4 covered by link copy, clipboard failure, and feedback checks.
- AC-5 covered by expiry, invalid data, unsupported sharing, and cancellation checks.
