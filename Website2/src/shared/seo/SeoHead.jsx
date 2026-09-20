import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SITE_CONFIG } from './SeoConstants'
import {
  buildCanonicalUrl,
  createDefaultSchemas,
} from './SchemaFactory'
import { StructuredData } from './StructuredData'

/**
 * Update or create a <meta> tag.
 */
function setMetaTag(attrName, attrValue, content) {
  let tag = document.head.querySelector(`meta[${attrName}="${attrValue}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attrName, attrValue)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

/**
 * Update or create a <link> tag.
 */
function setLinkTag(rel, href, extra = {}) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`)
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', rel)
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
  Object.entries(extra).forEach(([k, v]) => tag.setAttribute(k, v))
}

/**
 * Remove all existing hreflang link tags so we can re-add fresh ones.
 */
function clearHreflangTags() {
  document.head.querySelectorAll('link[rel="alternate"][hreflang]').forEach((el) => el.remove())
}

export function SeoHead({
  title,
  description,
  keywords = [],
  canonical,
  ogImage = SITE_CONFIG.defaultImage,
  ogType = 'website',
  robots = 'index,follow,max-image-preview:large',
  language = SITE_CONFIG.language,
  breadcrumbs = [],
  schema, // custom schema override
  hreflang, // [{ hreflang: 'en-KE', href: '...' }, ...]
}) {
  const location = useLocation()
  const path = location.pathname
  const resolvedTitle = title ? `${title} | ${SITE_CONFIG.name}` : SITE_CONFIG.defaultTitle
  const resolvedDescription = description || SITE_CONFIG.defaultDescription
  const resolvedKeywords = [...new Set([...SITE_CONFIG.defaultKeywords, ...keywords])]
  const resolvedCanonical = canonical || buildCanonicalUrl(path)
  const resolvedOgImage = ogImage.startsWith('http') ? ogImage : `${SITE_CONFIG.siteUrl}${ogImage}`

  useEffect(() => {
    // ── Document title ──────────────────────────────────────────
    document.title = resolvedTitle
    document.documentElement.lang = language

    // ── Meta tags ───────────────────────────────────────────────
    setMetaTag('name', 'description', resolvedDescription)
    setMetaTag('name', 'keywords', resolvedKeywords.join(', '))
    setMetaTag('name', 'robots', robots)
    setMetaTag('name', 'theme-color', SITE_CONFIG.themeColor)
    setMetaTag('name', 'application-name', SITE_CONFIG.name)

    // ── Open Graph ──────────────────────────────────────────────
    setMetaTag('property', 'og:site_name', SITE_CONFIG.name)
    setMetaTag('property', 'og:title', resolvedTitle)
    setMetaTag('property', 'og:description', resolvedDescription)
    setMetaTag('property', 'og:type', ogType)
    setMetaTag('property', 'og:url', resolvedCanonical)
    setMetaTag('property', 'og:image', resolvedOgImage)
    setMetaTag('property', 'og:image:secure_url', resolvedOgImage)
    setMetaTag('property', 'og:image:width', String(SITE_CONFIG.defaultImageWidth))
    setMetaTag('property', 'og:image:height', String(SITE_CONFIG.defaultImageHeight))
    setMetaTag('property', 'og:image:type', SITE_CONFIG.defaultImageType)
    setMetaTag('property', 'og:locale', SITE_CONFIG.locale)

    // ── Twitter Cards ───────────────────────────────────────────
    setMetaTag('name', 'twitter:card', 'summary_large_image')
    setMetaTag('name', 'twitter:title', resolvedTitle)
    setMetaTag('name', 'twitter:description', resolvedDescription)
    setMetaTag('name', 'twitter:image', resolvedOgImage)
    setMetaTag('name', 'twitter:image:alt', `${SITE_CONFIG.name} African marketplace`)
    setMetaTag('name', 'twitter:site', SITE_CONFIG.twitterHandle)

    // ── Link tags ───────────────────────────────────────────────
    setLinkTag('canonical', resolvedCanonical)
    setLinkTag('icon', '/logo.png')
    setLinkTag('manifest', '/manifest.webmanifest')

    // ── Hreflang tags (multi-country SEO) ───────────────────────
    if (hreflang && hreflang.length > 0) {
      clearHreflangTags()
      hreflang.forEach((entry) => {
        const link = document.createElement('link')
        link.setAttribute('rel', 'alternate')
        link.setAttribute('hreflang', entry.hreflang)
        link.setAttribute('href', entry.href)
        document.head.appendChild(link)
      })
      // Default x-default tag
      const defaultLink = document.createElement('link')
      defaultLink.setAttribute('rel', 'alternate')
      defaultLink.setAttribute('hreflang', 'x-default')
      defaultLink.setAttribute('href', resolvedCanonical)
      document.head.appendChild(defaultLink)
    }

    // Cleanup JSON-LD scripts from previous page
    return () => {
      document.head.querySelectorAll('script[data-seo-jsonld="true"]').forEach((s) => s.remove())
    }
  }, [
    language, resolvedCanonical, resolvedDescription, resolvedKeywords.join(','),
    resolvedTitle, robots, resolvedOgImage, ogType,
    hreflang?.map((h) => h.href + h.hreflang).join(','),
  ])

  // ── Schema (JSON-LD) ──────────────────────────────────────────
  const pageSchemas = schema || createDefaultSchemas({
    title: resolvedTitle,
    description: resolvedDescription,
    path,
    breadcrumbs,
  })

  const schemasArray = Array.isArray(pageSchemas) ? pageSchemas : [pageSchemas]

  return (
    <>
      {schemasArray.map((s, i) => (
        <StructuredData key={i} data={s} />
      ))}
    </>
  )
}
