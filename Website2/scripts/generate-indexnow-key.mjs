import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const key = process.env.INDEXNOW_KEY?.trim()

if (!key) {
  console.warn('[IndexNow] INDEXNOW_KEY is not set; no verification file generated.')
  process.exit(0)
}

if (!/^[A-Za-z0-9-]{8,128}$/.test(key)) {
  throw new Error('[IndexNow] INDEXNOW_KEY must contain 8-128 letters, numbers, or hyphens.')
}

const publicDirectory = resolve(process.cwd(), 'public')
await mkdir(publicDirectory, { recursive: true })
await writeFile(resolve(publicDirectory, `${key}.txt`), `${key}\n`, 'utf8')
console.log(`[IndexNow] Generated public/${key}.txt`)