"use strict";

const crypto = require("crypto");
const rateLimit = require("express-rate-limit");
const { instrumentedDb } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const { productPublishingService } = require("../../services/productPublishingService");
const { resolveAllowedAppwriteImageUrl } = require("../../utils/appwriteImages");
const { buildProductShareHtml, isShareableProduct } = require("../../utils/productShare");

const productShareLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: "Too many product preview requests. Please try again shortly.",
});

const getProductSharePage = async (req, res) => {
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

  const productId =
    typeof req.params.productId === "string" ? req.params.productId.trim() : "";
  if (!productId || productId.length > 255) {
    return res.status(404).send("Product not found.");
  }

  if (!env.APPWRITE_PRODUCT_COLLECTION_ID) {
    console.error("[product-share] APPWRITE_PRODUCT_COLLECTION_ID is not configured.");
    return res.status(500).send("Unable to load this product right now.");
  }

  let product;
  try {
    product = await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId,
    );
  } catch (error) {
    if (error?.code === 404 || error?.type === "document_not_found") {
      return res.status(404).send("Product not found.");
    }
    console.error("[product-share] Failed to load product document:", error);
    return res.status(500).send("Unable to load this product right now.");
  }

  let approvalRequired;
  try {
    approvalRequired = await productPublishingService.isApprovalRequired();
  } catch (error) {
    console.error("[product-share] Failed to check product approval policy:", error);
    return res.status(500).send("Unable to load this product right now.");
  }

  if (!productPublishingService.isVisible(product) || !isShareableProduct(product, approvalRequired)) {
    return res.status(404).send("Product not found.");
  }

  const shareUrl = new URL(
    `/share/product/${encodeURIComponent(product.$id)}`,
    env.DEAL_SHARE_URL,
  ).toString();
  const canonicalUrl = new URL(
    `/products/${encodeURIComponent(product.$id)}`,
    env.WEBSITE2_URL,
  ).toString();
  const imageUrl = resolveAllowedAppwriteImageUrl(
    product.image,
    [product.imageUrl, ...(Array.isArray(product.images) ? product.images : [])],
  );

  let html;
  try {
    html = buildProductShareHtml({
      product,
      shareUrl,
      canonicalUrl,
      imageUrl,
      nonce: scriptNonce,
    });
  } catch (error) {
    console.error("[product-share] Failed to render product preview:", error);
    return res.status(500).send("Unable to load this product right now.");
  }

  return res.status(200).send(html);
};

module.exports = {
  getProductSharePage,
  productShareLimiter,
};
