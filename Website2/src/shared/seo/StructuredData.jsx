export function StructuredData({ data }) {
  if (!data) return null

  const content = JSON.stringify(data, null, 2)

  return (
    <script
      type="application/ld+json"
      data-seo-jsonld="true"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  )
}
