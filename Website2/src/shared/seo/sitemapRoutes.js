export const sitemapRoutes = [
  '/',
  '/products',
  '/products/featured-item',
  '/products/daily-essentials',
  '/products/premium-pick',
  '/cart',
  '/checkout',
  '/login',
  '/404',
]

export function buildSitemapXml() {
  const baseUrl = 'https://www.nileflowafrica.com'
  const urls = sitemapRoutes.map((route) => `  <url><loc>${baseUrl}${route}</loc></url>`)

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`
}
