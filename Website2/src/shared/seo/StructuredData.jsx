export function StructuredData({ data }) {
  if (!data) return null

  const content = JSON.stringify(data)

  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: content }} />
}
