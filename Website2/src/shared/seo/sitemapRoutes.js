/**
 * Sitemap Routes Configuration
 *
 * This file is kept for backward compatibility with any existing imports.
 * For dynamic sitemap generation, use SitemapGenerator.js instead.
 *
 * The dynamic generator excludes cart, checkout, login, signup, and other
 * non-indexable paths automatically. See SitemapGenerator.js for the
 * canonical list of included/excluded routes.
 */

import { STATIC_ROUTES } from './SitemapGenerator'

export const sitemapRoutes = STATIC_ROUTES.map((r) => r.path)

export function buildSitemapXml() {
  const { generateMainSitemap } = require('./SitemapGenerator')
  return generateMainSitemap()
}
