/**
 * SchemaFactory — generates all Schema.org structured data for Nile Flow.
 * Every schema is built with proper @context, @type, and all required fields.
 * Validation-ready for Google Search Console, Schema.org, and Rich Results Test.
 */

import { SITE_CONFIG } from './SeoConstants'

/**
 * Build a canonical URL from a path.
 */
export function buildCanonicalUrl(path = '/') {
  const normalized = path === '/' ? '/' : `/${String(path).replace(/^\/+|\/+$/g, '')}`
  return `${SITE_CONFIG.siteUrl}${normalized}`
}

/**
 * Organization schema — appears on every page.
 */
export function createOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_CONFIG.siteUrl}/#organization`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.siteUrl,
    logo: `${SITE_CONFIG.siteUrl}/logo.png`,
    sameAs: SITE_CONFIG.sameAs,
    description: SITE_CONFIG.defaultDescription,
    address: {
      '@type': 'PostalAddress',
      ...SITE_CONFIG.contact.address,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: SITE_CONFIG.contact.telephone,
      email: SITE_CONFIG.contact.email,
    },
  }
}

/**
 * WebSite schema with SearchAction — appears on every page.
 */
export function createWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_CONFIG.siteUrl}/#website`,
    name: SITE_CONFIG.name,
    url: SITE_CONFIG.siteUrl,
    description: SITE_CONFIG.defaultDescription,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_CONFIG.siteUrl}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
}

/**
 * WebPage schema — generic page metadata.
 */
export function createWebPageSchema({ title, description, path, breadcrumbs = [] }) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${buildCanonicalUrl(path)}#webpage`,
    name: title || SITE_CONFIG.defaultTitle,
    description: description || SITE_CONFIG.defaultDescription,
    url: buildCanonicalUrl(path),
    inLanguage: SITE_CONFIG.language,
    isPartOf: {
      '@id': `${SITE_CONFIG.siteUrl}/#website`,
    },
    about: {
      '@id': `${SITE_CONFIG.siteUrl}/#organization`,
    },
  }

  if (breadcrumbs.length > 0) {
    schema.breadcrumb = {
      '@id': `${buildCanonicalUrl(path)}#breadcrumb`,
    }
  }

  return schema
}

/**
 * BreadcrumbList schema.
 */
export function createBreadcrumbSchema(items = []) {
  if (!items.length) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${buildCanonicalUrl(items[items.length - 1]?.href || '/')}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? buildCanonicalUrl(item.href) : SITE_CONFIG.siteUrl,
    })),
  }
}

/**
 * Product schema — for individual product pages.
 * Includes Offer, Brand, and AggregateRating.
 */
export function createProductSchema({
  name,
  description,
  price,
  currency = 'KES',
  availability = 'https://schema.org/InStock',
  image,
  url,
  brandName = SITE_CONFIG.name,
  sku,
  mpn,
  reviewCount = 0,
  ratingValue = 0,
  category,
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name,
    description,
    image: Array.isArray(image) ? image : (image ? [image] : undefined),
    sku: sku || undefined,
    mpn: mpn || undefined,
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    category: category || undefined,
    offers: {
      '@type': 'Offer',
      '@id': `${url}#offer`,
      price: typeof price === 'number' ? price : parseFloat(price),
      priceCurrency: currency,
      availability,
      url,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  }

  // Add aggregateRating only if there are reviews
  if (reviewCount > 0 && ratingValue > 0) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Math.round(ratingValue * 10) / 10,
      reviewCount,
      bestRating: 5,
      worstRating: 1,
    }
  }

  return schema
}

/**
 * CollectionPage schema — for product listing / category pages.
 */
export function createCollectionPageSchema({ title, description, path, numberOfItems = 0 }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': `${buildCanonicalUrl(path)}#collection`,
    name: title || 'Products',
    description: description || 'Browse products on Nile Flow',
    url: buildCanonicalUrl(path),
    inLanguage: SITE_CONFIG.language,
    isPartOf: {
      '@id': `${SITE_CONFIG.siteUrl}/#website`,
    },
    about: {
      '@id': `${SITE_CONFIG.siteUrl}/#organization`,
    },
    numberOfItems,
  }
}

/**
 * ItemList schema — for search results and product listings.
 */
export function createItemListSchema({ itemListElement = [], url, name }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${buildCanonicalUrl(url)}#itemlist`,
    name: name || 'Product list',
    url: buildCanonicalUrl(url),
    numberOfItems: itemListElement.length,
    itemListElement: itemListElement.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      url: item.url ? buildCanonicalUrl(item.url) : undefined,
      name: item.name,
    })),
  }
}

/**
 * FAQPage schema — for help center and FAQ content.
 */
export function createFAQPageSchema(questions = []) {
  if (!questions.length) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${SITE_CONFIG.siteUrl}/help#faq`,
    mainEntity: questions.map((q) => ({
      '@type': 'Question',
      name: q.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: q.answer,
      },
    })),
  }
}

/**
 * ProfilePage schema — for vendor stores.
 */
export function createProfilePageSchema({ name, description, image, url, email, telephone }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    '@id': `${buildCanonicalUrl(url)}#profile`,
    name: name || 'Vendor Store',
    description: description || '',
    url: buildCanonicalUrl(url),
    mainEntity: {
      '@type': 'Person',
      name: name || 'Vendor',
      image: image || undefined,
      email: email || undefined,
      telephone: telephone || undefined,
    },
  }
}

/**
 * AboutPage schema — for the about page with organization and person data.
 */
export function createAboutPageSchema(teamMembers = []) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${SITE_CONFIG.siteUrl}/about#aboutpage`,
    name: 'About Nile Flow',
    description: 'Learn about Nile Flow, our mission, team, and values.',
    url: `${SITE_CONFIG.siteUrl}/about`,
    mainEntity: {
      '@id': `${SITE_CONFIG.siteUrl}/#organization`,
    },
  }

  if (teamMembers.length > 0) {
    // Add team members as related entities
    schema.hasPart = teamMembers.map((member) => ({
      '@type': 'Person',
      name: member.name,
      description: member.role,
      image: member.image || undefined,
      email: member.email || undefined,
      telephone: member.phone || undefined,
      sameAs: member.socials?.map((s) => s.href) || undefined,
    }))
  }

  return schema
}

/**
 * ContactPage schema.
 */
export function createContactPageSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    '@id': `${SITE_CONFIG.siteUrl}/contact#contactpage`,
    name: 'Contact Nile Flow',
    description: 'Get in touch with Nile Flow for support, partnerships, and inquiries.',
    url: `${SITE_CONFIG.siteUrl}/contact`,
    mainEntity: {
      '@id': `${SITE_CONFIG.siteUrl}/#organization`,
    },
  }
}

/**
 * Default page schema set — used by SeoHead on every page.
 * Includes Organization, WebSite, WebPage, and optionally BreadcrumbList.
 */
export function createDefaultSchemas({ title, description, path, breadcrumbs = [] }) {
  const schemas = [
    createOrganizationSchema(),
    createWebsiteSchema(),
    createWebPageSchema({ title, description, path, breadcrumbs }),
  ]

  if (breadcrumbs.length > 0) {
    const breadcrumbSchema = createBreadcrumbSchema(breadcrumbs)
    if (breadcrumbSchema) schemas.push(breadcrumbSchema)
  }

  return schemas
}
