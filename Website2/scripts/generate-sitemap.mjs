/**
 * Nile Flow Sitemap Generator
 * Generates public/sitemap.xml with all indexable routes.
 *
 * Run: node scripts/generate-sitemap.mjs
 * Runs automatically before build via "prebuild" script.
 */

import { writeFileSync, existsSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const SITE_URL = process.env.VITE_SITE_URL || "https://nileflowafrica.com";

const INDEXABLE_ROUTES = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/shop", changefreq: "daily", priority: "0.9" },
  { path: "/deals", changefreq: "daily", priority: "0.8" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
  { path: "/help", changefreq: "monthly", priority: "0.4" },
  { path: "/returns", changefreq: "monthly", priority: "0.4" },
  { path: "/terms", changefreq: "yearly", priority: "0.3" },
  { path: "/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/discover-africa", changefreq: "weekly", priority: "0.7" },
  { path: "/chronicles", changefreq: "weekly", priority: "0.7" },
  { path: "/premium", changefreq: "weekly", priority: "0.7" },
  { path: "/featured", changefreq: "daily", priority: "0.8" },
  { path: "/careers", changefreq: "weekly", priority: "0.5" },
  { path: "/marketplace", changefreq: "daily", priority: "0.8" },
  { path: "/group-buying", changefreq: "daily", priority: "0.7" },
];

const today = new Date().toISOString().split("T")[0];

const urls = INDEXABLE_ROUTES
  .map(
    (route) => `  <url>
    <loc>${SITE_URL}${route.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`
  )
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`;

const outputPath = resolve(__dirname, "..", "public", "sitemap.xml");
const publicDir = dirname(outputPath);

if (!existsSync(publicDir)) {
  mkdirSync(publicDir, { recursive: true });
}

writeFileSync(outputPath, sitemap, "utf-8");
console.log(`✅ Sitemap generated: ${outputPath} (${INDEXABLE_ROUTES.length} URLs)`);
