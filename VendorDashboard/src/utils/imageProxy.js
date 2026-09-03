/**
 * Proxies Appwrite Storage images through the backend to avoid CORS issues.
 *
 * Usage: <img src={proxyImageUrl(product.image)} alt={product.name} />
 */

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_URL ||
  "https://nile-flow-backend-5dqm.onrender.com";

export function proxyImageUrl(url) {
  if (!url) return url;
  if (url.includes("/api/image-proxy?")) return url;

  // Only proxy Appwrite cloud storage URLs
  if (url.includes("cloud.appwrite.io")) {
    return `${API_BASE_URL}/api/image-proxy?url=${encodeURIComponent(url)}`;
  }

  return url;
}

export function proxyImageUrls(urls) {
  if (!Array.isArray(urls)) return urls;
  return urls.map(proxyImageUrl);
}
