/**
 * Dynamic Sitemap Generator for Nile Flow.
 *
 * Generates XML sitemaps for all public routes, products, categories,
 * and upcoming vendor/profile pages. Designed to be called from the
 * backend API to serve fresh sitemaps on request.
 *
 * Usage:
 *   1. Import this module in a backend route handler (e.g. GET /sitemap.xml)
 *   2. Call generateMainSitemap() or generateProductSitemap(products)
 *   3. Serve the XML string with Content-Type: application/xml
 */

// ── Static Routes ──────────────────────────────────────────────
export const STATIC_ROUTES = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/products', priority: '0.9', changefreq: 'hourly' },
  { path: '/search', priority: '0.8', changefreq: 'weekly' },
  { path: '/deals', priority: '0.7', changefreq: 'daily' },
  { path: '/premium-deals', priority: '0.6', changefreq: 'daily' },
  { path: '/group-buy', priority: '0.5', changefreq: 'daily' },
  { path: '/about', priority: '0.5', changefreq: 'monthly' },
  { path: '/contact', priority: '0.4', changefreq: 'monthly' },
  { path: '/help', priority: '0.4', changefreq: 'monthly' },
  { path: '/privacy', priority: '0.3', changefreq: 'monthly' },
  { path: '/terms', priority: '0.3', changefreq: 'monthly' },
  { path: '/return-policy', priority: '0.3', changefreq: 'monthly' },
  { path: '/careers', priority: '0.4', changefreq: 'weekly' },
]

// ── Excluded from sitemaps ─────────────────────────────────────
export const EXCLUDED_PATHS = [
  '/cart',
  '/checkout',
  '/login',
  '/signup',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/oauth',
  '/payment',
  '/payment/success',
  '/payment/cancelled',
  '/account-deletion',
  '/notifications',
  '/profile',
  '/settings',
  '/addresses',
  '/orders',
  '/track-order',
  '/cancel-order',
  '/Landing',
]

const BASE_URL = 'https://www.nileflowafrica.com'

/**
 * Escape XML special characters.
 */
function xmlEscape(str) {
  return String(str)
    .replace(/&/g, '&' + 'amp;')
    .replace(/</g, '&' + 'lt;')
    .replace(/>/g, '&' + 'gt;')
    .replace(/"/g, '&' + 'quot;')
    .replace(/'/g, '&' + 'apos;')
}

/**
 * Generate a `<url>` XML element.
 */
function urlElement(path, { priority = '0.5', changefreq = 'weekly', lastmod } = {}) {
  const loc = `${BASE_URL}${path}`
  const now = new Date().toISOString().split('T')[0]
  return `  <url>
    <loc>${xmlEscape(loc)}</loc>
    <lastmod>${lastmod || now}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority}</priority>
  </url>`
}

/**
 * Generate the main sitemap (static routes).
 */
export function generateMainSitemap() {
  const urls = STATIC_ROUTES.map((r) => urlElement(r.path, r)).join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`
}

/**
 * Generate a product sitemap from an array of product objects.
 * Each product should have: $id (or id), productName (or name),
 * updatedAt (or $updatedAt), and optionally images[].
 *
 * @param {Array} products
 * @param {Object} [options]
 * @param {number} [options.maxUrls=45000] - Max URLs per sitemap (Google limit: 50k)
 * @returns {string} XML sitemap
 */
export function generateProductSitemap(products = [], options = {}) {
  const { maxUrls = 45000 } = options
  const batch = products.slice(0, maxUrls)

  const urls = batch.map((product) => {
    const id = product.$id || product.id
    const lastmod = product.updatedAt || product.$updatedAt || new Date().toISOString().split('T')[0]
    return urlElement(`/products/${id}`, {
      priority: '0.8',
      changefreq: 'weekly',
      lastmod,
    })
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`
}

/**
 * Generate a category sitemap.
 */
export function generateCategorySitemap(categories = []) {
  const urls = categories.map((cat) => {
    const slug = cat.slug || cat.$id || cat.id
    return urlElement(`/category/${slug}`, {
      priority: '0.7',
      changefreq: 'daily',
    })
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`
}

/**
 * Generate a vendor store sitemap.
 */
export function generateVendorSitemap(vendors = []) {
  const urls = vendors.map((vendor) => {
    return urlElement(`/vendors/${vendor.$id || vendor.id}`, {
      priority: '0.6',
      changefreq: 'daily',
    })
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>`
}

/**
 * Generate a sitemap index file referencing all sub-sitemaps.
 */
export function generateSitemapIndex(sitemaps = []) {
  const urls = sitemaps.map((sm) => {
    return `  <sitemap>
    <loc>${xmlEscape(BASE_URL + sm.path)}</loc>
    <lastmod>${sm.lastmod || new Date().toISOString().split('T')[0]}</lastmod>
  </sitemap>`
  }).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</sitemapindex>`
}

/**
 * Generate an image sitemap for product images.
 * @param {Array} products - Products with images array
 */
export function generateImageSitemap(products = []) {
  const urls = products.map((product) => {
    const id = product.$id || product.id
    const images = product.images || []
    if (!images.length && !product.image) return ''

    const allImages = product.image ? [product.image, ...images] : images
    const imageTags = allImages.slice(0, 10).map((img) => {
      const imgUrl = typeof img === 'string' ? img : (img.url || img)
      return `      <image:image>
        <image:loc>${xmlEscape(imgUrl.startsWith('http') ? imgUrl : `${BASE_URL}${imgUrl}`)}</image:loc>
        <image:title>${xmlEscape(product.productName || product.name || 'Product')}</image:title>
      </image:image>`
    }).join('\n')

    if (!imageTags) return ''

    return `  <url>
    <loc>${xmlEscape(`${BASE_URL}/products/${id}`)}</loc>
${imageTags}
  </url>`
  }).filter(Boolean).join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${urls}
</urlset>`
}
