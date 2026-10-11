"use strict";

const { formatCurrency } = require("./currencyConverter");

const escapeHtml = (value) =>
  String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const escapeInlineScriptValue = (value) =>
  JSON.stringify(value)
    .replaceAll("<", "\\u003c")
    .replaceAll(">", "\\u003e")
    .replaceAll("&", "\\u0026")
    .replaceAll("\u2028", "\\u2028")
    .replaceAll("\u2029", "\\u2029");

const getProductName = (product) => {
  for (const value of [product?.productName, product?.name, product?.title]) {
    if (typeof value === "string" && value.trim()) return value.trim();
  }
  return "Product";
};

const getCatalogPrice = (product) =>
  typeof product?.price === "number" && Number.isFinite(product.price)
    ? product.price
    : null;

const isShareableProduct = (product, approvalRequired) =>
  Boolean(
    product &&
      typeof product.$id === "string" &&
      product.$id.trim() &&
      Number.isFinite(getCatalogPrice(product)) &&
      (!approvalRequired || product.isApproved === true),
  );

const formatCatalogPrice = (amount) => formatCurrency(amount, "KES");

const buildProductShareHtml = ({
  product,
  shareUrl,
  canonicalUrl,
  imageUrl,
  nonce,
}) => {
  const name = getProductName(product);
  const price = getCatalogPrice(product);
  if (price === null) {
    throw new TypeError("A finite catalog price is required for product sharing.");
  }

  const title = `${name} on Nile Flow`;
  const descriptionParts = [
    `Shop ${name} on Nile Flow for ${formatCatalogPrice(price)}.`,
  ];
  if (
    typeof product.originalPrice === "number" &&
    Number.isFinite(product.originalPrice) &&
    product.originalPrice > price
  ) {
    descriptionParts.push(`Original price: ${formatCatalogPrice(product.originalPrice)}.`);
  }
  const description = descriptionParts.join(" ");
  const metadata = [
    `<meta name="robots" content="noindex,follow">`,
    `<meta property="og:type" content="product">`,
    `<meta property="og:title" content="${escapeHtml(title)}">`,
    `<meta property="og:description" content="${escapeHtml(description)}">`,
    `<meta property="og:url" content="${escapeHtml(shareUrl)}">`,
    `<meta name="twitter:title" content="${escapeHtml(title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(description)}">`,
    `<meta name="twitter:card" content="summary_large_image">`,
  ];
  if (imageUrl) {
    metadata.push(
      `<meta property="og:image" content="${escapeHtml(imageUrl)}">`,
      `<meta name="twitter:image" content="${escapeHtml(imageUrl)}">`,
    );
  }

  const safeCanonicalUrl = escapeHtml(canonicalUrl);
  const safeScriptUrl = escapeInlineScriptValue(canonicalUrl);
  return `<!doctype html>
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
      <p><a href="${safeCanonicalUrl}">Continue to this product</a></p>
    </main>
    <script nonce="${escapeHtml(nonce)}">window.location.replace(${safeScriptUrl});</script>
  </body>
</html>`;
};

module.exports = {
  buildProductShareHtml,
  formatCatalogPrice,
  getCatalogPrice,
  getProductName,
  isShareableProduct,
};
