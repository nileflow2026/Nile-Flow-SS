/**
 * Nile Flow — Mobile Image Optimizer
 *
 * Fix: Appwrite image transformations only work on the /preview endpoint,
 * NOT on /view. This utility converts /view URLs to /preview and adds
 * transformation params.  For non-Appwrite URLs it returns as-is.
 *
 * Usage:
 *   import { imageForSize, IMAGE_SIZE } from "../../utils/imageOptimizer";
 *   <Image source={{ uri: imageForSize(url, IMAGE_SIZE.SMALL) }} />
 */

// ── Configuration ─────────────────────────────────────────────────────────────

// Breakpoints for different display contexts
export const IMAGE_SIZE = {
  THUMBNAIL: 48, // Avatars
  SMALL: 120, // Cart items
  MEDIUM: 200, // Featured products / grid cards
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

// Appwrite project endpoints we can transform
const APPWRITE_PATTERNS = ["cloud.appwrite.io", "appwrite", "/v1/storage/"];

// ── URL inspection ────────────────────────────────────────────────────────────

export function isAppwriteUrl(url) {
  if (!url || typeof url !== "string") return false;
  const lower = url.toLowerCase();
  return APPWRITE_PATTERNS.some((p) => lower.includes(p));
}

/**
 * Convert an Appwrite /view URL to /preview so transformation params work.
 * If the URL is already /preview or not Appwrite, return unchanged.
 *
 * Appwrite Storage URLs look like:
 *   https://fra.cloud.appwrite.io/v1/storage/buckets/{bucketId}/files/{fileId}/view?project={projectId}
 *
 * The /preview endpoint supports: ?width=N&height=N&quality=N&output=webp
 * The /view endpoint does NOT support those params.
 */
function ensurePreviewEndpoint(url) {
  if (!url || typeof url !== "string") return url;
  // Only transform Appwrite URLs
  if (!isAppwriteUrl(url)) return url;
  // Only transform /view → /preview
  if (!url.includes("/view")) return url;
  return url.replace("/view", "/preview");
}

/**
 * Get the optimal image URL for a given display size.
 *
 * For Appwrite Storage URLs: converts /view → /preview, adds transformation
 * params (width, quality, output=webp).  Appwrite serves WebP automatically
 * from the /preview endpoint when these params are present.
 *
 * For all other URLs (placeholders, external images): returns as-is.
 *
 * @param {string} url - The image URL
 * @param {number} size - Target width in px (from IMAGE_SIZE constants)
 * @returns {string} - Optimized URL (or original if non-Appwrite)
 */
export function imageForSize(url, size = IMAGE_SIZE.MEDIUM) {
  if (!url || typeof url !== "string") return url;

  // 1. Handle case where url might be an already-optimized /preview URL
  //    (idempotent — applying twice is safe)
  const previewUrl = ensurePreviewEndpoint(url);

  // 2. If it's not an Appwrite URL, return as-is (no transformation)
  if (!isAppwriteUrl(previewUrl)) {
    return previewUrl;
  }

  // 3. Determine quality for this size
  let quality = QUALITY.FULL;
  if (size <= IMAGE_SIZE.THUMBNAIL) quality = QUALITY.THUMBNAIL;
  else if (size <= IMAGE_SIZE.SMALL) quality = QUALITY.SMALL;
  else if (size <= IMAGE_SIZE.MEDIUM) quality = QUALITY.MEDIUM;
  else if (size <= IMAGE_SIZE.LARGE) quality = QUALITY.LARGE;
  else if (size <= IMAGE_SIZE.HERO) quality = QUALITY.HERO;

  // 4. Append transformation params via URL constructor (handles existing params)
  try {
    const parsed = new URL(previewUrl);
    parsed.searchParams.set("width", String(size));
    parsed.searchParams.set("quality", String(quality));
    parsed.searchParams.set("output", "webp");
    return parsed.toString();
  } catch {
    // URL parse failure — return original unchanged
    return url;
  }
}

/**
 * Preload an image into the React Native image cache.
 * Best-effort — errors are silently swallowed.
 *
 * @param {string} url
 */
export function preloadImage(url) {
  if (!url || typeof url !== "string") return;
  try {
    const { Image } = require("react-native");
    Image.prefetch(url).catch(() => {});
  } catch {
    // Not in RN environment
  }
}

/**
 * Preload multiple images in parallel (e.g. for FlatList items).
 */
export function preloadImages(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return;
  urls.forEach((url) => preloadImage(url));
}

export default {
  imageForSize,
  preloadImage,
  preloadImages,
  IMAGE_SIZE,
  isAppwriteUrl,
};
