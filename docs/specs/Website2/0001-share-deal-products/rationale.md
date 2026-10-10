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

### Option 2: Add a public backend share page beside the static deal page

Add a public route on the existing Backend service that reads the deal from Appwrite and returns HTML metadata for crawlers. Keep the public link on `www.nileflowafrica.com` at `/share/deal/{dealId}`. A Cloudflare Worker handles only that path, forwards it to the existing Backend preview endpoint, and returns the metadata page to the crawler. The page redirects shoppers to the canonical Website2 deal page. Website2 sends this share URL to social platforms and the device share sheet, attaching an image file when the browser supports it. (basis: Backend Appwrite access, existing Website2 API configuration, Cloudflare proxy routing, crawler readable metadata practice)

**Pros**:
- Social crawlers receive metadata and a public product image in the first HTML response.
- Website2 remains a static site and the existing deal page remains the canonical destination.
- The new endpoint can be deployed before Website2 switches links, so the old links keep working during rollout.

**Cons**:
- A Cloudflare Worker route and its Backend origin configuration are needed.
- The preview adds one navigation step and needs a dedicated Website2 origin setting and careful HTML escaping.
- Device image attachment still depends on browser support and image proxy availability.

### Option 3: Change Website2 to server rendered pages

Move deal page rendering to a server capable of loading deal data and returning per deal metadata on the Website2 domain. (basis: crawler readable metadata practice)

**Pros**:
- Deal links keep the Website2 domain and can return metadata directly.
- Server rendering could support other dynamically generated Website2 pages later.

**Cons**:
- Replaces the current static hosting model and expands this feature into a rendering and deployment migration.
- Adds an always running render path for a need that can be met by one endpoint on the existing backend.

## Rationale

Choose Option 2 with a Cloudflare Worker route on the existing Website2 domain. Website2 remains static, while the Backend still returns the deal data and crawler metadata. The Worker forwards only `/share/deal/{dealId}` to the current Backend preview endpoint and returns its HTML response, so the shared link and `og:url` stay on `www.nileflowafrica.com` without introducing a new domain. This requires a small Cloudflare routing configuration, but avoids changing Website2 rendering or adding another service. (basis: existing Website2 static hosting, Backend Appwrite access, Cloudflare proxy routing, Open Graph crawler metadata practice)

Set `DEAL_SHARE_URL` on the Backend and `VITE_DEAL_SHARE_URL` in the Website2 build to the same public origin, `https://www.nileflowafrica.com`. The Backend uses the configured origin for crawler metadata, while its canonical Website2 URL comes from a dedicated `WEBSITE2_URL` setting, rather than assuming the general `FRONTEND_URL` belongs to Website2. Configure Cloudflare to forward the public share path to the Backend's existing versioned preview endpoint without redirecting the browser to the Backend host. The page uses a fixed server configured destination, escapes product values, and does not accept arbitrary redirect URLs. Keep the old versioned endpoint available for compatibility, but do not use it in newly shared or copied links.

For device sharing, prepare the product image while the chooser is open and call `navigator.canShare({ files })` before attaching it. This avoids making image support a requirement for text sharing and reduces the risk that an image network request consumes the browser's user action. When the image cannot be included, continue with the offer and link and tell the shopper. (basis: graceful degradation and user controlled sharing)

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
