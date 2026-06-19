/**
 * Nile Flow — Image Proxy Route (v2)
 *
 * Proxies images from Appwrite Storage through the backend domain
 * with in-memory LRU caching and connection reuse.
 *
 * Usage: /api/image-proxy?url=...&width=200&quality=60
 *
 * Query params:
 *   url     - The Appwrite storage URL (required)
 *   width   - Desired width in px (optional, Appwrite image transformation)
 *   quality - JPEG/WebP quality 1-100 (optional, default 80)
 */

const { Router } = require("express");
const router = Router();
const https = require("https");
const http = require("http");
const { imageCache } = require("../utils/imageCache");

// ── Connection pooling ────────────────────────────────────────────────────────
// Reuse agent so DNS resolution and TCP handshakes are shared across requests.
const KEEP_ALIVE_MS = 60000; // 60s
const MAX_SOCKETS = 25;

const httpsAgent = new https.Agent({
  keepAlive: true,
  keepAliveMsecs: KEEP_ALIVE_MS,
  maxSockets: MAX_SOCKETS,
  timeout: 15000,
});

const httpAgent = new http.Agent({
  keepAlive: true,
  keepAliveMsecs: KEEP_ALIVE_MS,
  maxSockets: MAX_SOCKETS,
  timeout: 15000,
});

// ── Configuration ─────────────────────────────────────────────────────────────
const ALLOWED_HOSTS = ["fra.cloud.appwrite.io", "cloud.appwrite.io"];
const MAX_CACHE_SIZE_BYTES = 200 * 1024 * 1024; // 200MB safety limit

// ── Utility: Appwrite-style image transform query builder ─────────────────────
// Appwrite Storage supports on-the-fly image transformations via query params:
//   ?width=200&height=200&quality=60&output=webp
// We only add width & quality; height is auto to preserve aspect ratio.
function appendTransformParams(originalUrl, width, quality) {
  try {
    const parsed = new URL(originalUrl);

    // Remove any existing transform params (so we don't stack them)
    parsed.searchParams.delete("width");
    parsed.searchParams.delete("height");
    parsed.searchParams.delete("quality");
    parsed.searchParams.delete("output");

    if (width && width > 0) {
      parsed.searchParams.set("width", String(Math.min(width, 2000)));
    }
    if (quality && quality > 0 && quality <= 100) {
      parsed.searchParams.set("quality", String(Math.round(quality)));
    }
    // Default to WebP for smaller payloads
    parsed.searchParams.set("output", "webp");

    return parsed.toString();
  } catch {
    return originalUrl;
  }
}

// ── Utility: generate cache key ──────────────────────────────────────────────
function cacheKey(url, width, quality) {
  return `${url}|w${width || "full"}|q${quality || "orig"}`;
}

// ── Fetch an image from upstream with timeout + redirect following ────────────
function fetchImage(url, maxRedirects = 3) {
  return new Promise((resolve, reject) => {
    if (maxRedirects <= 0) {
      return reject(new Error("Too many redirects"));
    }

    const protocol = url.startsWith("https") ? https : http;
    const agent = url.startsWith("https") ? httpsAgent : httpAgent;

    // Abort if no response within 15s
    const req = protocol.get(url, { agent, timeout: 15000 }, (proxyRes) => {
      // Handle redirects (Appwrite may redirect to CDN)
      if (
        proxyRes.statusCode >= 300 &&
        proxyRes.statusCode < 400 &&
        proxyRes.headers.location
      ) {
        // Consume the response body to free resources
        proxyRes.resume();
        return resolve(fetchImage(proxyRes.headers.location, maxRedirects - 1));
      }

      if (proxyRes.statusCode !== 200) {
        proxyRes.resume(); // drain
        return reject(new Error(`Upstream returned ${proxyRes.statusCode}`));
      }

      const contentType = proxyRes.headers["content-type"] || "image/jpeg";
      const contentLength = parseInt(proxyRes.headers["content-length"], 10);

      // Reject if response is above our cache safety limit
      if (contentLength && contentLength > MAX_CACHE_SIZE_BYTES) {
        proxyRes.resume();
        return reject(new Error("Image too large to cache"));
      }

      const chunks = [];
      let totalBytes = 0;

      proxyRes.on("data", (chunk) => {
        totalBytes += chunk.length;
        if (totalBytes > MAX_CACHE_SIZE_BYTES) {
          req.destroy();
          return reject(new Error("Image exceeds max size"));
        }
        chunks.push(chunk);
      });

      proxyRes.on("end", () => {
        resolve({
          data: Buffer.concat(chunks),
          contentType,
        });
      });

      proxyRes.on("error", (err) => {
        reject(err);
      });
    });

    req.on("error", reject);
    req.on("timeout", () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });
  });
}

// ── Route: GET /api/image-proxy ──────────────────────────────────────────────
router.get("/", async (req, res) => {
  const { url, width, quality } = req.query;

  if (!url) {
    return res
      .status(400)
      .json({ success: false, error: "url query param is required" });
  }

  // Validate URL
  let parsed;
  try {
    parsed = new URL(url);
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
      return res
        .status(403)
        .json({ success: false, error: "Host not allowed" });
    }
  } catch {
    return res.status(400).json({ success: false, error: "Invalid URL" });
  }

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // OPTIONS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Build the transform URL (Appwrite native resizing) and the cache key
  const transformUrl = appendTransformParams(
    url,
    parseInt(width, 10) || null,
    parseInt(quality, 10) || 80,
  );
  const key = cacheKey(url, width, quality);

  // 1. Check cache
  const cached = imageCache.get(key);
  if (cached) {
    res.setHeader("Content-Type", cached.contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    res.setHeader("X-Cache", "HIT");
    return res.end(cached.data);
  }

  try {
    // 2. Fetch from upstream (or transformed URL)
    const { data, contentType } = await fetchImage(transformUrl);

    // 3. Store in cache
    imageCache.set(key, data, contentType);

    // 4. Serve
    res.setHeader("Content-Type", contentType);
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    res.setHeader("X-Cache", "MISS");
    res.setHeader("Content-Length", data.length);
    res.end(data);
  } catch (err) {
    console.error("Image proxy error:", err.message);

    // Fallback: try the original (untransformed) URL
    if (transformUrl !== url) {
      try {
        const { data, contentType } = await fetchImage(url);
        imageCache.set(key, data, contentType);

        res.setHeader("Content-Type", contentType);
        res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
        res.setHeader("X-Cache", "MISS-FALLBACK");
        res.end(data);
        return;
      } catch (fallbackErr) {
        console.error("Image proxy fallback also failed:", fallbackErr.message);
      }
    }

    if (!res.headersSent) {
      res.status(502).json({ success: false, error: "Failed to fetch image" });
    }
  }
});

// ── Route: GET /api/image-proxy/cache-stats ──────────────────────────────────
router.get("/cache-stats", (req, res) => {
  res.json({ success: true, cache: imageCache.stats });
});

module.exports = router;
