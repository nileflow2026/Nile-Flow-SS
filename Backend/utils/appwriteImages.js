const { env } = require("../src/env");

const ALLOWED_APPWRITE_IMAGE_HOSTS = new Set([
  "fra.cloud.appwrite.io",
  "cloud.appwrite.io",
]);

const normalizeAppwritePublicUrl = (url) => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("cloud.appwrite.io") && !url.includes("/v1/storage/")) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const params = parsed.searchParams;

    [
      "mode",
      "impersonateuserid",
      "impersonateUserId",
      "impersonateuseremail",
      "impersonateUserEmail",
      "impersonateuserphone",
      "impersonateUserPhone",
    ].forEach((key) => params.delete(key));

    if (!params.has("project") && parsed.hostname.includes("appwrite")) {
      params.set("project", env.APPWRITE_PROJECT_ID || "");
    }

    params.set("mode", "public");

    const pathname = parsed.pathname.replace(/\/view(?=$|[/?])/, "/preview");
    parsed.pathname = pathname;
    return parsed.toString();
  } catch (_) {
    return url;
  }
};

const buildImageUrl = (imageData) => {
  if (!imageData) return null;
  if (typeof imageData === "string") {
    if (imageData.startsWith("http")) {
      return normalizeAppwritePublicUrl(imageData);
    }
    return normalizeAppwritePublicUrl(
      `${env.APPWRITE_ENDPOINT}/storage/buckets/${env.APPWRITE_STORAGE_ID}/files/${imageData}/view?project=${env.APPWRITE_PROJECT_ID}&mode=public`,
    );
  }
  if (typeof imageData === "object" && !Array.isArray(imageData)) {
    const imageValue = imageData.url ?? imageData.imageUrl ?? imageData.id;
    return imageValue ? buildImageUrl(imageValue) : null;
  }
  return null;
};

const buildImageUrlFromValue = (value) => {
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      if (parsed && typeof parsed === "object") {
        return buildImageUrl(parsed);
      }
    } catch (_) {
      // Treat non JSON strings as image URLs or Appwrite file IDs.
    }
  }
  return buildImageUrl(value);
};

const normalizeImagesToUrls = (images) => {
  if (!Array.isArray(images)) return [];
  return images
    .map(buildImageUrlFromValue)
    .filter(Boolean);
};

const isAllowedAppwriteImageUrl = (value) => {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return (
      url.protocol === "https:" &&
      ALLOWED_APPWRITE_IMAGE_HOSTS.has(url.hostname) &&
      !url.username &&
      !url.password
    );
  } catch (_) {
    return false;
  }
};

const resolveAllowedAppwriteImageUrl = (primaryImage, images) => {
  const candidates = [
    primaryImage,
    ...(Array.isArray(images) ? images : []),
  ];

  for (const candidate of candidates) {
    const imageUrl = buildImageUrlFromValue(candidate);
    if (isAllowedAppwriteImageUrl(imageUrl)) return imageUrl;
  }

  return null;
};

module.exports = {
  buildImageUrl,
  isAllowedAppwriteImageUrl,
  normalizeAppwritePublicUrl,
  normalizeImagesToUrls,
  resolveAllowedAppwriteImageUrl,
};
