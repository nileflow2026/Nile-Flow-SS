# Rationale: Share deal products from Website2

## Context

Website2 is a React and Vite static site on Render. Its deal page gets product data in the browser, and its current Open Graph metadata is added by client side JavaScript. Social crawlers may read the first HTML response without running that JavaScript, so they cannot reliably see the deal name, offer, or product image.

The backend already reads the Appwrite deal collection and Website2 already uses its public image proxy. The browser share action currently sends text and a direct deal URL, but not an image file. Social platforms accept a page URL and create their own preview from metadata; device file sharing is a separate browser capability. Shoppers must remain in control of every post.

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

Add a public endpoint that reads the deal from Appwrite and returns HTML metadata for crawlers. The page redirects shoppers to the canonical Website2 deal page. Website2 sends this share URL to social platforms and the device share sheet, attaching an image file when the browser supports it. (basis: Backend Appwrite access, existing Website2 API configuration, crawler readable metadata practice)

**Pros**:
- Social crawlers receive metadata and a public product image in the first HTML response.
- Website2 remains a static site and the existing deal page remains the canonical destination.
- The new endpoint can be deployed before Website2 switches links, so the old links keep working during rollout.

**Cons**:
- Shared links use the backend domain and add one navigation step.
- The backend needs a dedicated Website2 origin setting and careful HTML escaping.
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

Choose Option 2. It addresses the cause of missing social images, which is that a static client rendered page cannot put deal specific metadata in its initial HTML response. The existing backend already reads the deal collection, while the current static site remains in place. Render's static site rewrite rules route paths to static responses; they do not execute deal specific application code for each request. (basis: Render static site rewrite behavior, Open Graph crawler metadata practice)

Deploy the endpoint first, then switch Website2 links. This is an additive migration, and reverting Website2 restores the existing direct links without removing the new endpoint. The backend share URL is the same link sent to platforms and copied to the clipboard; its canonical Website2 URL comes from a dedicated `WEBSITE2_URL` setting, rather than assuming the general `FRONTEND_URL` belongs to Website2. The page uses a fixed server configured destination, escapes product values, and does not accept arbitrary redirect URLs.

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

**Links**:
- Render static site redirects and rewrites: https://render.com/docs/redirects-rewrites
