import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const backendBaseUrl =
  process.env.VITE_API_BASE_URL || 'https://nile-flow-backend-5dqm.onrender.com'
const sitemapFiles = [
  'sitemap.xml',
  'sitemap-products.xml',
  'sitemap-categories.xml',
  'sitemap-images.xml',
]
const scriptDirectory = dirname(fileURLToPath(import.meta.url))
const outputDirectory = resolve(scriptDirectory, '../dist')

await mkdir(outputDirectory, { recursive: true })

for (const filename of sitemapFiles) {
  const sitemapUrl = new URL(`/${filename}`, backendBaseUrl)
  const response = await fetch(sitemapUrl, {
    signal: AbortSignal.timeout(90_000),
  })

  if (!response.ok) {
    throw new Error(
      `Could not build ${filename}: backend returned HTTP ${response.status}`,
    )
  }

  const contentType = response.headers.get('content-type') || ''
  if (!/application\/xml|text\/xml/i.test(contentType)) {
    throw new Error(
      `Could not build ${filename}: expected XML, received ${contentType || 'no content type'}`,
    )
  }

  const xml = await response.text()
  if (!xml.trimStart().startsWith('<?xml') || !/<urlset\b/.test(xml)) {
    throw new Error(`Could not build ${filename}: response is not a sitemap`)
  }

  await writeFile(resolve(outputDirectory, filename), xml, 'utf8')
  console.log(`Generated ${filename}`)
}
