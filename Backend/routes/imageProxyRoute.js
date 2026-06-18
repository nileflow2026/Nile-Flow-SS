/**
 * Image Proxy Route
 *
 * Proxies images from Appwrite Storage through the backend domain
 * so they load correctly in browsers (avoids Appwrite CORS issues).
 *
 * Usage: /api/image-proxy?url=https://fra.cloud.appwrite.io/v1/storage/...
 */

const { Router } = require("express");
const router = Router();
const https = require("https");
const http = require("http");

const ALLOWED_HOSTS = ["fra.cloud.appwrite.io", "cloud.appwrite.io"];

router.get("/", async (req, res) => {
  const { url } = req.query;

  if (!url) {
    return res
      .status(400)
      .json({ success: false, error: "url query param is required" });
  }

  // Security: only allow Appwrite storage URLs
  try {
    const parsed = new URL(url);
    if (!ALLOWED_HOSTS.includes(parsed.hostname)) {
      return res
        .status(403)
        .json({ success: false, error: "Host not allowed" });
    }
  } catch {
    return res.status(400).json({ success: false, error: "Invalid URL" });
  }

  // Set CORS headers explicitly for the image response
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");

  // Handle OPTIONS preflight
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Fetch the image from Appwrite and pipe it through
  const protocol = url.startsWith("https") ? https : http;

  protocol
    .get(url, (proxyRes) => {
      // Forward the content-type header
      const contentType = proxyRes.headers["content-type"] || "image/jpeg";
      res.setHeader("Content-Type", contentType);

      // Handle redirects (Appwrite may redirect to the actual storage)
      if (
        proxyRes.statusCode >= 300 &&
        proxyRes.statusCode < 400 &&
        proxyRes.headers.location
      ) {
        return res.redirect(proxyRes.statusCode, proxyRes.headers.location);
      }

      if (proxyRes.statusCode !== 200) {
        return res.status(proxyRes.statusCode).json({
          success: false,
          error: `Upstream returned ${proxyRes.statusCode}`,
        });
      }

      proxyRes.pipe(res);
    })
    .on("error", (err) => {
      console.error("Image proxy error:", err.message);
      if (!res.headersSent) {
        res
          .status(502)
          .json({ success: false, error: "Failed to fetch image" });
      }
    });
});

module.exports = router;
