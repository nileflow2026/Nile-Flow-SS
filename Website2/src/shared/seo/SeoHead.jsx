import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import {
  buildCanonicalUrl,
  buildKeywords,
  buildMetaDescription,
  buildPageTitle,
  createBreadcrumbSchema,
  createLocalBusinessSchema,
  createOrganizationSchema,
  createWebPageSchema,
  createWebsiteSchema,
  siteConfig,
} from './seoUtils'
import { StructuredData } from './StructuredData'

function updateMetaTag(attrName, attrValue, content) {
  let tag = document.head.querySelector(`meta[${attrName}="${attrValue}"]`)
  if (!tag) {
    tag = document.createElement('meta')
    tag.setAttribute(attrName, attrValue)
    document.head.appendChild(tag)
  }
  tag.setAttribute('content', content)
}

function updateLinkTag(rel, href) {
  let tag = document.head.querySelector(`link[rel="${rel}"]`)
  if (!tag) {
    tag = document.createElement('link')
    tag.setAttribute('rel', rel)
    document.head.appendChild(tag)
  }
  tag.setAttribute('href', href)
}

export function SeoHead({
  title,
  description,
  keywords = [],
  canonical,
  ogImage = siteConfig.defaultImage,
  twitterImage = ogImage,
  robots = 'index,follow,max-image-preview:large',
  language = siteConfig.language,
  schema,
  breadcrumbs = [],
  children,
}) {
  const location = useLocation()
  const resolvedTitle = buildPageTitle(title)
  const resolvedDescription = buildMetaDescription(description)
  const resolvedKeywords = buildKeywords(keywords)
  const resolvedCanonical = canonical || buildCanonicalUrl(location.pathname)

  useEffect(() => {
    document.title = resolvedTitle
    document.documentElement.lang = language

    updateMetaTag('name', 'description', resolvedDescription)
    updateMetaTag('name', 'keywords', resolvedKeywords.join(', '))
    updateMetaTag('name', 'robots', robots)
    updateMetaTag('name', 'theme-color', siteConfig.themeColor)
    updateMetaTag('property', 'og:title', resolvedTitle)
    updateMetaTag('property', 'og:description', resolvedDescription)
    updateMetaTag('property', 'og:type', 'website')
    updateMetaTag('property', 'og:url', resolvedCanonical)
    updateMetaTag('property', 'og:image', `${siteConfig.siteUrl}${ogImage}`)
    updateMetaTag('name', 'twitter:card', 'summary_large_image')
    updateMetaTag('name', 'twitter:title', resolvedTitle)
    updateMetaTag('name', 'twitter:description', resolvedDescription)
    updateMetaTag('name', 'twitter:image', `${siteConfig.siteUrl}${twitterImage}`)
    updateMetaTag('name', 'twitter:site', siteConfig.twitterHandle)
    updateMetaTag('property', 'article:publisher', siteConfig.siteName)
    updateMetaTag('name', 'application-name', siteConfig.siteName)

    updateLinkTag('canonical', resolvedCanonical)
    updateLinkTag('icon', '/favicon.svg')
    updateLinkTag('manifest', '/manifest.webmanifest')

    return () => {
      const jsonLdScripts = document.querySelectorAll('script[data-seo-jsonld="true"]')
      jsonLdScripts.forEach((script) => script.remove())
    }
  }, [language, ogImage, resolvedCanonical, resolvedDescription, resolvedKeywords, resolvedTitle, robots, twitterImage])

  const pageSchema = schema || createWebPageSchema({
    title: resolvedTitle,
    description: resolvedDescription,
    path: location.pathname,
    breadcrumbs,
  })

  const schemaPayload = [
    createOrganizationSchema(),
    createWebsiteSchema(),
    createLocalBusinessSchema(),
    pageSchema,
    breadcrumbs.length ? createBreadcrumbSchema(breadcrumbs) : null,
  ].filter(Boolean)

  return (
    <>
      {children}
      {schemaPayload.length > 0 && (
        <StructuredData data={schemaPayload.length === 1 ? schemaPayload[0] : schemaPayload} />
      )}
    </>
  )
}
