"use strict";

const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const { instrumentedDb } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const {
  resolveAllowedAppwriteImageUrl,
} = require("../../utils/appwriteImages");

const dealShareLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many deal preview requests. Please try again shortly.",
});

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const getDealShareUrl = (dealId) => {
  return new URL(
    `/share/deal/${encodeURIComponent(dealId)}`,
    env.DEAL_SHARE_URL,
  ).toString();
};

const isShareableDeal = (deal, now = Date.now()) => {
  if (
    !deal ||
    deal.isDeal !== true ||
    typeof deal.$id !== "string" ||
    !deal.$id.trim() ||
    !Number.isFinite(deal.dealPrice) ||
    !Number.isFinite(deal.price) ||
    !Number.isFinite(deal.discount)
  ) {
    return false;
  }

  if (deal.dealEndTime === null || deal.dealEndTime === undefined) return true;
  const expiry = new Date(deal.dealEndTime).getTime();
  return Number.isFinite(expiry) && expiry > now;
};

const escapeInlineScriptValue = (value) =>
  JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");

const getDealSharePage = async (req, res) => {
  const scriptNonce = crypto.randomBytes(18).toString("base64");
  res.set({
    "Cache-Control": "no-store",
    "Content-Security-Policy": [
      "default-src 'none'",
      `script-src 'nonce-${scriptNonce}'`,
      "img-src https://fra.cloud.appwrite.io https://cloud.appwrite.io",
      "base-uri 'none'",
      "form-action 'none'",
      "frame-ancestors 'none'",
    ].join("; "),
    "Content-Type": "text/html; charset=utf-8",
    "X-Content-Type-Options": "nosniff",
  });

  const dealId = typeof req.params.dealId === "string" ? req.params.dealId.trim() : "";
  if (!dealId) {
    return res.status(404).send("Deal not found.");
  }

  let deal;
  try {
    deal = await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_DEALS_COLLECTION_ID,
      dealId,
    );
  } catch (error) {
    if (error?.code === 404 || error?.type === "document_not_found") {
      return res.status(404).send("Deal not found.");
    }
    console.error("[deal-share] Failed to load deal document:", error);
    return res.status(500).send("Unable to load this deal right now.");
  }

  if (!isShareableDeal(deal)) {
    return res.status(404).send("Deal not found.");
  }

  const productName =
    typeof deal.productName === "string" && deal.productName.trim()
      ? deal.productName.trim()
      : "";
  const title = productName
    ? `${productName} on Nile Flow`
    : "This Nile Flow deal";
  const descriptionName = productName || "this deal";
  const description = `Save ${deal.discount}% on ${descriptionName}. Deal price: KES ${deal.dealPrice}. Original price: KES ${deal.price}.`;
  const shareUrl = getDealShareUrl(deal.$id);
  const canonicalUrl = new URL(
    `/deal/${encodeURIComponent(deal.$id)}`,
    env.WEBSITE2_URL,
  ).toString();
  const imageUrl = resolveAllowedAppwriteImageUrl(deal.image, deal.images);

  const metadata = [
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(shareUrl)}">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    '<meta name="twitter:card" content="summary_large_image">',
  ];
  if (imageUrl) {
    metadata.push(
      `<meta property="og:image" content="${escapeHtml(imageUrl)}">`,
      `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">`,
    );
  }

  const safeCanonicalUrl = escapeHtml(canonicalUrl);
  const safeScriptUrl = escapeInlineScriptValue(canonicalUrl);
  const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${escapeHtml(title)}</title>
    ${metadata.join("\n    ")}
    <link rel="canonical" href="${safeCanonicalUrl}">
  </head>
  <body>
    <main>
      <h1>${escapeHtml(title)}</h1>
      <p>${escapeHtml(description)}</p>
      <p><a href="${safeCanonicalUrl}">Continue to this deal</a></p>
    </main>
    <script nonce="${scriptNonce}">window.location.replace(${safeScriptUrl});</script>
  </body>
</html>`;

  return res.status(200).send(html);
};

module.exports = {
  dealShareLimiter,
  getDealSharePage,
  isShareableDeal,
};
