# Rationale: Share deal products from Website2

## Context

Website2 is a React and Vite static site on Render. Its deal page gets product data in the browser, and its current Open Graph metadata is added by client side JavaScript. Social crawlers may read the first HTML response without running that JavaScript, so they cannot reliably see the deal name, offer, or product image.

The backend already reads the Appwrite deal collection and Website2 already uses its public image proxy. The browser share action currently sends text and a direct deal URL, but not an image file. Social platforms accept a page URL and create their own preview from metadata; device file sharing is a separate browser capability. Shoppers must remain in control of every post. The current preview URL also exposes the Backend service host and API route, which does not look like a shopper facing Nile Flow link.

## Options considered

### Option 1: Keep the current direct deal links and add device image sharing

Attach a product image to the browser share sheet where supported, while leaving all social links pointed directly at the client rendered Website2 deal page. (basis: existing Website2 share chooser and image proxy)

**Pros**:
- Smallest change to the existing sharing flow.
- Device users can attach the product image without a new backend route.
- Existing Website2 links remain unchanged.

**Cons**:
- Social crawlers may not see deal metadata or the product image because the static page adds its tags in JavaScript.
- Different share destinations would produce inconsistent image previews.

### Option 2: Add a branded share subdomain to the existing Render Backend

Add a public route on the existing Backend service that reads the deal from Appwrite and returns HTML metadata for crawlers. Add `share.nileflowafrica.com` as a custom domain on the Backend's existing Render web service, then create the DNS record Render specifies. The page redirects shoppers to the canonical Website2 deal page. Website2 sends this share URL to social platforms. WhatsApp receives an actual image file through the browser share sheet, not just a link message. (basis: Backend Appwrite access, existing Website2 API configuration, Render custom domain support, crawler readable metadata practice)

**Pros**:
- Social crawlers receive metadata and a public product image in the first HTML response.
- Website2 remains a static site and the existing deal page remains the canonical destination.
- Keeps the share link branded without changing the hosting or routing for the root domain.
- Uses the existing Backend service rather than adding another service or proxy.

**Cons**:
- Requires a DNS change and custom domain validation in Render before public links work.
- Device image attachment still depends on browser support and image proxy availability.

### Option 3: Use the Render service hostname for share links

Use the existing public Render service URL directly for preview pages and metadata. (basis: existing Backend deployment)

**Pros**:
- No DNS changes or custom domain setup are needed.
- The existing Backend preview endpoint already returns crawler readable metadata.

**Cons**:
- Shared links expose the Render service hostname, which is not a Nile Flow branded URL.
- The Backend service hostname becomes a permanent public link contract.

### Option 4: Change Website2 to server rendered pages

Move deal page rendering to a server capable of loading deal data and returning per deal metadata on the Website2 domain. (basis: crawler readable metadata practice)

**Pros**:
- Deal links keep the Website2 domain and can return metadata directly.
- Server rendering could support other dynamically generated Website2 pages later.

**Cons**:
- Replaces the current static hosting model and expands this feature into a rendering and deployment migration.
- Adds an always running render path for a need that can be met by one endpoint on the existing backend.

## Rationale

Choose Option 2. The root domain is already hosted separately, so adding a path route there depends on infrastructure Nile Flow does not control. A branded subdomain can be attached directly to the existing Render Backend service, with DNS pointed to the target Render specifies. This keeps the public link branded, reuses the existing Appwrite access and metadata controller, and does not add a Worker or new hosting service. Option 3 is simpler but exposes the Render hostname. Option 4 is disproportionate for one preview route. (basis: existing Website2 static hosting, Backend Appwrite access, Render custom domain support, Open Graph crawler metadata practice)

Set `DEAL_SHARE_URL` on the Backend and `VITE_DEAL_SHARE_URL` in the Website2 build to `https://share.nileflowafrica.com`. The Backend uses the configured origin for crawler metadata, while its canonical Website2 URL comes from a dedicated `WEBSITE2_URL` setting, rather than assuming the general `FRONTEND_URL` belongs to Website2. Add the share route alias to the existing Express service and invoke the existing preview controller and limiter. Use the Render custom domain settings and DNS record they provide. The page escapes product values and does not accept an arbitrary redirect destination. Keep the old versioned endpoint available for compatibility, but do not use it in newly shared or copied links.

For WhatsApp, prepare the product image while the chooser is open and call `navigator.canShare({ files })` before starting the share action. `wa.me` accepts a text message, not an attached image file, so it cannot satisfy the requirement for an image in Status. Pass the actual file and offer text to `navigator.share`, then let the shopper choose WhatsApp and Status where supported. If the file share is unavailable or fails, offer a direct image download and a separate Copy link action. Treat cancellation as quiet and keep the chooser available for another action. General device sharing may still degrade to text and URL. (basis: Web Share file capability and user controlled sharing)

Keep the offer message as plain text because its destinations do not share a reliable rich text format. Use spacing, relevant emojis, and WhatsApp asterisk markers to make the product, savings, and call to action easier to scan. Other platforms may show the markers literally, and no platform specific color or font is promised. Use only the real discount and optional deal expiry to signal urgency; do not invent stock or scarcity claims.

Render supplies the custom domain verification instructions and DNS record target for the specific web service. Do not hardcode a record type or address in the application spec, since those values depend on the Render service configuration. The DNS zone owner applies exactly the record Render provides. Confirm the domain resolves and HTTPS is active before Website2 uses the branded subdomain.

The deal image metadata is useful only if the referenced image can be fetched by a social crawler without the shopper's authentication state. Require a public HTTPS Appwrite image URL, and verify the image response without cookies or authorization before enabling production sharing.

## References

**Project sources**:
- `docs/scope/Website2/scope.md`, Website2's static site and Tracer Bullet approach.
- `Website2/src/shared/seo/SeoHead.jsx`, current client side metadata behavior.
- `Website2/src/api/config/index.js`, backend URL and image proxy configuration.
- `Backend/routes/v1.js` and `Backend/src/index.js`, versioned API routing.
- `Backend/controllers/UserControllers/ClientController.js`, Appwrite deal data and public image URL conventions.

**Practices & standards**:
- Open Graph metadata for crawler readable link previews.
- HTML output escaping and fixed redirect destinations for public HTML responses.
- Strangler pattern for adding a route before switching existing callers.
