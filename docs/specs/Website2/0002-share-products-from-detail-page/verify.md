# Verify: Website2 product detail sharing · spec 0002 · updated 2026-10-11

_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] Open an in stock product detail page and confirm the labeled Share control overlays the image, the chooser offers device sharing, WhatsApp, Facebook, X, Telegram, and Copy link, and purchase controls are unchanged. → AC-1, AC-3
- [ ] Open an out of stock but shopper visible product and confirm sharing is still available. → AC-1, AC-7
- [ ] Open a deal product and confirm its existing deal message and branded deal URL remain in use rather than the ordinary product message. → AC-1
- [ ] Share a product with no public image and confirm its text, social links, and copied link remain usable while WhatsApp does not open a text only composer. → AC-3, AC-4
- [ ] Deny clipboard access and confirm failure feedback plus a focusable, selectable, read only full message are shown. → AC-5
- [ ] Share from a browser without `navigator.share` and confirm device sharing is disabled with an explanation while social links and Copy link stay available. → AC-5

## Commands

- [ ] `node --test Website2\src\features\products\utils\productShareContent.test.js Website2\src\features\deals\utils\dealShareContent.test.js` → all product and deal message, URL, price fallback, image allowlist, and proxy parameter tests pass. → AC-1, AC-2, AC-3, AC-4, AC-5, AC-8
- [ ] `node --test Backend\tests\productShare.test.js` → preview metadata, escaping, KES formatting, visibility price checks, canonical redirect, and optional image tests pass. → AC-6, AC-7
- [ ] `node Backend\tests\currencyConverter.test.js` → original KES price conversion uses the same rate and psychological pricing settings and omits invalid values. → AC-2
- [ ] `npm run build` from `Website2` → production build and sitemap generation complete. → AC-1, AC-2, AC-3, AC-4
- [ ] Request `/share/product/{productId}` without authentication for a public product → first response includes Open Graph and Twitter metadata, allowed image when present, `noindex,follow`, no store caching, and a fixed canonical product URL. → AC-6
- [ ] Request previews for missing, hidden, inactive, draft, pending, rejected, suspended, archived, and approval required but unapproved products → same not found response; request an out of stock public product → preview succeeds. → AC-7
- [ ] Confirm unexpected Appwrite errors are logged and return a server error, and repeated requests are limited to 60 per minute per IP. → AC-7
- [ ] Confirm the flow creates no share record, analytics event, product field, environment setting, package, or migration. → AC-8

## Acceptance-criteria coverage

AC-1 through AC-8 are covered by the checks above. The message and currency checks exercise each required value source, including product name fallbacks, displayed price precedence, KES original price conversion, product ID encoding, image source precedence, share destinations, preview metadata, fixed canonical redirect, centralized visibility, and rate limiting.
