"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  buildProductShareHtml,
  formatCatalogPrice,
  isShareableProduct,
} = require("../utils/productShare");

test("only shopper visible products with a finite catalog price are shareable", () => {
  assert.equal(isShareableProduct({ $id: "prod-1", price: 100 }, false), true);
  assert.equal(isShareableProduct({ $id: "prod-1", price: 100 }, true), false);
  assert.equal(isShareableProduct({
    $id: "prod-1",
    price: 100,
    isApproved: true,
  }, true), true);
  assert.equal(isShareableProduct({ $id: "prod-1", price: "100" }, false), false);
  assert.equal(isShareableProduct({ $id: "prod-1", price: Infinity }, false), false);
});

test("renders escaped KES preview metadata and a fixed canonical redirect", () => {
  const product = {
    $id: "prod-1",
    productName: '<script>alert("x")</script>',
    price: 1500,
    originalPrice: 2000,
  };
  const html = buildProductShareHtml({
    product,
    shareUrl: "https://share.nileflowafrica.com/share/product/prod-1",
    canonicalUrl: "https://website.example/products/prod-1",
    imageUrl: "https://fra.cloud.appwrite.io/image.jpg",
    nonce: "test-nonce",
  });

  assert.match(html, /<meta name="robots" content="noindex,follow">/);
  assert.match(html, /<meta property="og:type" content="product">/);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image">/);
  assert.match(html, /<meta property="og:image" content="https:\/\/fra\.cloud\.appwrite\.io\/image\.jpg">/);
  assert.match(html, /Shop &lt;script&gt;alert\(&quot;x&quot;\)&lt;\/script&gt; on Nile Flow for KSh 1,500\./);
  assert.match(html, /Original price: KSh 2,000\./);
  assert.match(html, /window\.location\.replace\("https:\/\/website\.example\/products\/prod-1"\)/);
  assert.equal(formatCatalogPrice(1500), "KSh 1,500");
});

test("omits image metadata and optional original price when unavailable", () => {
  const html = buildProductShareHtml({
    product: { $id: "prod-2", name: "Simple Product", price: 0, originalPrice: 0 },
    shareUrl: "https://share.nileflowafrica.com/share/product/prod-2",
    canonicalUrl: "https://website.example/products/prod-2",
    imageUrl: null,
    nonce: "test-nonce",
  });

  assert.doesNotMatch(html, /property="og:image"/);
  assert.doesNotMatch(html, /Original price:/);
  assert.match(html, /Shop Simple Product on Nile Flow for KSh 0\./);
});
