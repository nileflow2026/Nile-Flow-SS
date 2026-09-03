/**
 * SEO Constants — single source of truth for all SEO configuration.
 * Centralizes site identity, social profiles, multi-country settings,
 * and default metadata values.
 */

export const SITE_CONFIG = {
  name: 'Nile Flow',
  shortName: 'NileFlow',
  tagline: 'African Commerce, Fintech & AI Marketplace',
  domain: 'www.nileflowafrica.com',
  siteUrl: 'https://www.nileflowafrica.com',
  defaultTitle: 'Nile Flow | African Commerce, Fintech & AI Marketplace',
  defaultDescription:
    'Nile Flow brings trusted commerce, fintech, education and AI-powered shopping experiences to Africa, with fast, mobile-first discovery for buyers and vendors.',
  defaultKeywords: [
    'Nile Flow',
    'African marketplace',
    'online marketplace Africa',
    'ecommerce platform in Africa',
    'online shopping Africa',
    'African ecommerce',
    'AI commerce platform Africa',
    'South Sudan ecommerce',
    'Kenya ecommerce',
    'Uganda online shopping',
    'best ecommerce app Africa',
    'African shopping platform',
    'African online marketplace',
  ],
  defaultImage: 'https://www.nileflowafrica.com/og-image.png',
  defaultImageType: 'image/png',
  defaultImageWidth: 1424,
  defaultImageHeight: 752,
  twitterHandle: '@nileflow',
  locale: 'en_US',
  language: 'en',
  themeColor: '#16a34a',
  sameAs: [
    'https://www.facebook.com/profile.php?id=61580711948973',
    'https://www.instagram.com/nileflowafrica',
    'https://www.tiktok.com/@nile_flow',
    'https://www.linkedin.com/in/nile-flow-683806395',
    'https://twitter.com/nileflowafrica',
    'https://www.youtube.com/@nileflowafrica',
  ],
  contact: {
    email: 'hello@nileflowafrica.com',
    telephone: '+254-713-637-104',
    address: {
      streetAddress: 'Riara University, Icenter',
      addressLocality: 'Nairobi',
      addressRegion: 'Nairobi',
      postalCode: '00100',
      addressCountry: 'KE',
    },
  },
}

/**
 * Multi-country SEO configuration for future expansion.
 * Each country has its own hreflang code and optional subdomain/path prefix.
 */
export const MARKET_CONFIGS = {
  default: { hreflang: 'en', prefix: '', currency: 'KES', country: 'KE' },
  KE: { hreflang: 'en-KE', prefix: '/ke', currency: 'KES', country: 'KE' },
  UG: { hreflang: 'en-UG', prefix: '/ug', currency: 'UGX', country: 'UG' },
  TZ: { hreflang: 'en-TZ', prefix: '/tz', currency: 'TZS', country: 'TZ' },
  RW: { hreflang: 'en-RW', prefix: '/rw', currency: 'RWF', country: 'RW' },
  SS: { hreflang: 'en-SS', prefix: '/ss', currency: 'SSP', country: 'SS' },
  NG: { hreflang: 'en-NG', prefix: '/ng', currency: 'NGN', country: 'NG' },
  GH: { hreflang: 'en-GH', prefix: '/gh', currency: 'GHS', country: 'GH' },
  ET: { hreflang: 'en-ET', prefix: '/et', currency: 'ETB', country: 'ET' },
}
