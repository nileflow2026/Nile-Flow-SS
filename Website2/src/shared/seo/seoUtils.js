export const siteConfig = {
  siteName: 'Nile Flow',
  siteUrl: 'https://www.nileflowafrica.com',
  defaultTitle: 'Nile Flow | African Commerce, Fintech & AI Marketplace',
  defaultDescription:
    'Nile Flow brings trusted commerce, fintech, education and AI-powered shopping experiences to Africa, with fast, mobile-first discovery for buyers and vendors.',
  defaultKeywords: [
    'Nile Flow',
    'African marketplace',
    'commerce',
    'fintech',
    'AI commerce',
    'South Sudan ecommerce',
    'East Africa shopping',
  ],
  defaultImage: '/og-image.svg',
  twitterHandle: '@nileflow',
  locale: 'en_US',
  language: 'en',
  themeColor: '#16a34a',
}

export function normalizePath(path = '/') {
  if (!path || path === '/') return '/'
  return `/${String(path).replace(/^\/+|\/+$/g, '')}`
}

export function buildCanonicalUrl(path = '/') {
  return `${siteConfig.siteUrl}${normalizePath(path)}`
}

export function buildPageTitle(title) {
  return title ? `${title} | ${siteConfig.siteName}` : siteConfig.defaultTitle
}

export function buildMetaDescription(description) {
  return description || siteConfig.defaultDescription
}

export function buildKeywords(keywords = []) {
  const merged = [...siteConfig.defaultKeywords, ...(Array.isArray(keywords) ? keywords : [])]
  return Array.from(new Set(merged))
}

export function createOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: siteConfig.siteName,
    url: siteConfig.siteUrl,
    logo: `${siteConfig.siteUrl}/logo.png`,
    sameAs: ['https://www.facebook.com/profile.php?id=61580711948973', 'https://www.tiktok.com/@nile_flow?_r=1&_t=ZS-92eYXT0eqrF', "https://www.instagram.com/nileflowafrica?igsh=NTVoYWR1YW94Y3Bp", "https://www.linkedin.com/in/nile-flow-683806395?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"],
    description: siteConfig.defaultDescription,
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'KE',
      addressRegion: 'Nairobi',
      addressLocality: 'Nairobi',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer support',
      telephone: '+254-713-637-104',
      email: 'hello@nileflowafrica.com',
    },
  }
}

export function createWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: siteConfig.siteName,
    url: siteConfig.siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: `${siteConfig.siteUrl}/search?q={search_term_string}`,
      'query-input': 'required name=search_term_string',
    },
  }
}

export function createLocalBusinessSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name: siteConfig.siteName,
    url: siteConfig.siteUrl,
    image: `${siteConfig.siteUrl}/og-image.svg`,
    telephone: '+254-700-000-000',
    email: 'hello@nileflow.co',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Raila Odinga Way, Nairobi',
      addressLocality: 'Nairobi',
      addressRegion: 'Nairobi',
      postalCode: '00100',
      addressCountry: 'KE',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: '-1.286389',
      longitude: '36.817223',
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '08:00',
        closes: '18:00',
      },
    ],
  }
}

export function createBreadcrumbSchema(items = []) {
  if (!items.length) return null

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.href ? `${siteConfig.siteUrl}${normalizePath(item.href)}` : siteConfig.siteUrl,
    })),
  }
}

export function createWebPageSchema({ title, description, path, breadcrumbs = [] }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title || siteConfig.defaultTitle,
    description: description || siteConfig.defaultDescription,
    url: buildCanonicalUrl(path),
    inLanguage: siteConfig.language,
    breadcrumb: breadcrumbs.length ? createBreadcrumbSchema(breadcrumbs) : undefined,
  }
}

export function createProductSchema({
  name,
  description,
  price,
  currency = 'KES',
  availability = 'https://schema.org/InStock',
  image,
  url,
  brand = siteConfig.siteName,
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image,
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability,
      url,
    },
  }
}
