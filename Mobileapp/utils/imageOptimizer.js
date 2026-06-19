/**
 * Nile Flow — Mobile Image Optimizer
 *
 * Two strategies for loading product images as fast as possible:
 *
 * 1. DIRECT (preferred): Load from Appwrite CDN directly with width/quality
 *    params. This bypasses the backend proxy entirely for most images.
 *    Only fall back to proxy for images that need CORS protection.
 *
 * 2. PROXY (fallback): For images that fail to load directly, or for
 *    environments where direct Appwrite access is blocked.
 *
 * Usage:
 *   import { getOptimizedImageUrl } from "../../utils/imageOptimizer";
 *   <Image source={{ uri: getOptimizedImageUrl(url, 200) }} .. />
 */

// ── Configuration ─────────────────────────────────────────────────────────────
const BACKEND_URL = "https://nile-flow-backend.onrender.com";

// Images smaller than this (in bytes) won't be worth transforming
const MIN_SIZE_FOR_TRANSFORM = 1024; // 1KB

// Breakpoints for different display contexts
export const IMAGE_SIZE = {
  THUMBNAIL: 48, // Product table thumbnails
  SMALL: 120, // Cart items, category cards
  MEDIUM: 200, // Featured products grid
  LARGE: 400, // Product details gallery
  HERO: 600, // Hero carousel
};

// Quality settings per context (balance size vs quality)
const QUALITY = {
  THUMBNAIL: 40,
  SMALL: 50,
  MEDIUM: 60,
  LARGE: 75,
  HERO: 80,
  FULL: 80,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Check if a URL is an Appwrite storage URL
 */
export function isAppwriteUrl(url) {
  if (!url || typeof url !== "string") return false;
  return (
    url.includes("cloud.appwrite.io") ||
    url.includes("appwrite") ||
    url.includes("/v1/storage/")
  );
}

/**
 * Check if a URL is already going through our proxy
 */
export function isProxiedUrl(url) {
  if (!url || typeof url !== "string") return false;
  return url.includes("/api/image-proxy");
}

/**
 * Extract the raw Appwrite URL from a proxied URL
 */
export function extractOriginalUrl(proxiedUrl) {
  if (!proxiedUrl || typeof proxiedUrl !== "string") return proxiedUrl;
  const match = proxiedUrl.match(/[?&]url=([^&]+)/);
  if (match) {
    return decodeURIComponent(match[1]);
  }
  return proxiedUrl;
}

/**
 * Get the optimal image URL for a given display context.
 *
 * Uses Appwrite's native image transformation query params directly
 * to avoid proxying through the backend.  Falls back to proxy if
 * the URL has CORS issues.
 *
 * @param {string} url - The original image URL (Appwrite or proxy)
 * @param {number} size - Target width in px (from IMAGE_SIZE or custom)
 * @param {boolean} preferDirect - If true, always try direct Appwrite first
 * @returns {string} - Optimized URL
 */
export function getOptimizedImageUrl(
  url,
  size = IMAGE_SIZE.MEDIUM,
  preferDirect = true,
) {
  if (!url || typeof url !== "string") return url;

  // If already proxied, extract the original and re-optimize
  const originalUrl = extractOriginalUrl(url);

  if (!isAppwriteUrl(originalUrl)) {
    // Not an Appwrite URL — return as-is
    return originalUrl;
  }

  // Determine quality for this size
  let quality;
  if (size <= IMAGE_SIZE.THUMBNAIL) quality = QUALITY.THUMBNAIL;
  else if (size <= IMAGE_SIZE.SMALL) quality = QUALITY.SMALL;
  else if (size <= IMAGE_SIZE.MEDIUM) quality = QUALITY.MEDIUM;
  else if (size <= IMAGE_SIZE.LARGE) quality = QUALITY.LARGE;
  else if (size <= IMAGE_SIZE.HERO) quality = QUALITY.HERO;
  else quality = QUALITY.FULL;

  try {
    const parsed = new URL(originalUrl);

    // Remove existing transform params
    parsed.searchParams.delete("width");
    parsed.searchParams.delete("height");
    parsed.searchParams.delete("quality");
    parsed.searchParams.delete("output");

    // Set Appwrite transformation params
    parsed.searchParams.set("width", String(size));
    parsed.searchParams.set("quality", String(quality));
    parsed.searchParams.set("output", "webp");

    if (preferDirect) {
      // Serve directly from Appwrite CDN — fastest path
      return parsed.toString();
    }
  } catch {
    // URL parsing failed, fall through to proxy
  }

  // Fallback: proxy with size hint
  return `${BACKEND_URL}/api/image-proxy?url=${encodeURIComponent(originalUrl)}&width=${size}&quality=${quality}`;
}

/**
 * Get multiple sized URLs for the same image (used in galleries/carousels)
 *
 * @param {string} url
 * @param {Array<{size: number, label: string}>} sizes
 * @returns {Object} - { thumbnail: "...", small: "...", medium: "...", ... }
 */
export function getSizedImageUrls(url, sizes) {
  const result = {};
  if (!url) return result;

  sizes.forEach(({ size, label }) => {
    result[label || String(size)] = getOptimizedImageUrl(url, size);
  });

  return result;
}

/**
 * Preload an image into the React Native image cache.
 * Call this for images that will be displayed soon (e.g. next slide in carousel).
 *
 * @param {string} url - The optimized URL to preload
 */
export function preloadImage(url) {
  if (!url || typeof url !== "string") return;

  try {
    const { Image } = require("react-native");
    Image.prefetch(url).catch(() => {
      // Silent — preload is best-effort
    });
  } catch {
    // Module not available (testing environment)
  }
}

/**
 * Preload multiple images in parallel (e.g. for FlatList items).
 *
 * @param {string[]} urls - Array of optimized URLs
 */
export function preloadImages(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return;
  urls.forEach((url) => preloadImage(url));
}

/**
 * Get an Appwrite image URL with direct transformation params,
 * completely bypassing the backend proxy.
 * This is the fastest possible path for image loading.
 */
export function getDirectAppwriteUrl(url, width = 200, quality = 60) {
  if (!url || !isAppwriteUrl(url)) return url;

  try {
    const parsed = new URL(url);
    parsed.searchParams.set("width", String(width));
    parsed.searchParams.set("quality", String(quality));
    parsed.searchParams.set("output", "webp");
    return parsed.toString();
  } catch {
    return url;
  }
}

/**
 * Convert product.image (which may be an Appwrite or proxy URL) into the
 * fastest-loading URL for the given display size.
 *
 * This is the function you should use in most components:
 *
 *   import { imageForSize } from "../../utils/imageOptimizer";
 *   <Image source={{ uri: imageForSize(product.image, IMAGE_SIZE.SMALL) }} />
 *
 * @param {string} imageUrl - The product.image value (any format)
 * @param {number} size - Desired width in px (from IMAGE_SIZE constants)
 * @returns {string} - Optimized URL
 */
export function imageForSize(imageUrl, size = IMAGE_SIZE.MEDIUM) {
  return getOptimizedImageUrl(imageUrl, size, true);
}

export default {
  getOptimizedImageUrl,
  getSizedImageUrls,
  preloadImage,
  preloadImages,
  getDirectAppwriteUrl,
  imageForSize,
  IMAGE_SIZE,
  isAppwriteUrl,
};
