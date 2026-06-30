/**
 * Nile Flow SEO — React Router v8 Meta Helpers
 *
 * Each route module exports a `meta` function that returns an array of
 * meta descriptors. These are rendered by the root `<Meta />` component
 * during SSR, so Googlebot sees the final HTML on every page.
 *
 * Usage in route module:
 * ```tsx
 * export function meta() {
 *   return seoMeta("/shop", { title: "Custom", description: "..." });
 * }
 * ```
 */

import { resolveRouteMeta, SITE_URL } from "./seo";

interface SeoMetaOptions {
  title?: string;
  description?: string;
  noindex?: boolean;
  canonical?: string;
  ogImage?: string;
}

/**
 * Returns React Router v8 meta descriptors + canonical link for a route.
 * Call this from each page's `meta` export.
 */
export function seoMeta(
  pathname: string,
  options?: SeoMetaOptions
): Record<string, unknown>[] {
  const routeMeta = resolveRouteMeta(pathname, options);
  const canonicalHref = `${SITE_URL}${options?.canonical || routeMeta.canonical || pathname}`;

  const descriptors: Record<string, unknown>[] = [
    { title: routeMeta.title },
    { name: "description", content: routeMeta.description },
    {
      name: "robots",
      content: routeMeta.noindex ? "noindex, nofollow" : "index, follow",
    },
    { property: "og:title", content: routeMeta.title },
    { property: "og:description", content: routeMeta.description },
    { property: "og:type", content: routeMeta.type || "website" },
    { property: "og:url", content: canonicalHref },
    {
      property: "og:image",
      content: options?.ogImage || routeMeta.ogImage || `${SITE_URL}/og-image.svg`,
    },
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: routeMeta.title },
    { name: "twitter:description", content: routeMeta.description },
    {
      name: "twitter:image",
      content: options?.ogImage || routeMeta.ogImage || `${SITE_URL}/og-image.svg`,
    },
    // Canonical link via react-router's meta descriptor system
    { tagName: "link", rel: "canonical", href: canonicalHref },
  ];

  return descriptors;
}
