/**
 * Sitemap Service — Backend implementation of XML sitemap generation.
 * Node.js-compatible — no JSX dependencies.
 */

var BASE_URL = "https://www.nileflowafrica.com";

var STATIC_ROUTES = [
  { path: "/", priority: "1.0", changefreq: "daily" },
  { path: "/home", priority: "0.9", changefreq: "daily" },
  { path: "/products", priority: "0.9", changefreq: "hourly" },
  { path: "/search", priority: "0.8", changefreq: "weekly" },
  { path: "/deals", priority: "0.7", changefreq: "daily" },
  { path: "/premium-deals", priority: "0.6", changefreq: "daily" },
  { path: "/group-buy", priority: "0.5", changefreq: "daily" },
  { path: "/about", priority: "0.5", changefreq: "monthly" },
  { path: "/contact", priority: "0.4", changefreq: "monthly" },
  { path: "/help", priority: "0.4", changefreq: "monthly" },
  { path: "/privacy", priority: "0.3", changefreq: "monthly" },
  { path: "/terms", priority: "0.3", changefreq: "monthly" },
  { path: "/return-policy", priority: "0.3", changefreq: "monthly" },
  { path: "/careers", priority: "0.4", changefreq: "weekly" },
];

var AMP = String.fromCharCode(38) + "amp;";
var LT = String.fromCharCode(38) + "lt;";
var GT = String.fromCharCode(38) + "gt;";
var QUOT = String.fromCharCode(38) + "quot;";
var APOS = String.fromCharCode(38) + "apos;";

function escapeXml(str) {
  var s = String(str);
  s = s.split("&").join(AMP);
  s = s.split("<").join(LT);
  s = s.split(">").join(GT);
  s = s.split('"').join(QUOT);
  s = s.split("'").join(APOS);
  return s;
}

function urlElement(path, opts) {
  opts = opts || {};
  var priority = opts.priority || "0.5";
  var changefreq = opts.changefreq || "weekly";
  var lastmod = opts.lastmod;
  var loc = BASE_URL + path;
  var parts = [
    "  <url>",
    "    <loc>" + escapeXml(loc) + "</loc>",
  ];

  if (lastmod) {
    parts.push(
      "    <lastmod>" +
        escapeXml(new Date(lastmod).toISOString().split("T")[0]) +
        "</lastmod>"
    );
  }

  parts.push(
    "    <changefreq>" + changefreq + "</changefreq>",
    "    <priority>" + priority + "</priority>",
    "  </url>"
  );
  return parts.join("\n");
}

function xmlHeader(urls) {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:xhtml="http://www.w3.org/1999/xhtml">',
    urls,
    "</urlset>"
  ].join("\n");
}

function generateMainSitemap() {
  return xmlHeader(
    STATIC_ROUTES.map(function(r) { return urlElement(r.path, r); }).join("\n")
  );
}

function generateProductSitemap(products) {
  products = products || [];
  return xmlHeader(
    products.map(function(p) {
      var id = p.$id || p.id;
      return urlElement("/products/" + encodeURIComponent(id), {
        priority: "0.8",
        changefreq: "weekly",
        lastmod: p.updatedAt || p.$updatedAt
      });
    }).join("\n")
  );
}

function generateCategorySitemap(categories) {
  categories = categories || [];
  return xmlHeader(
    categories.map(function(c) {
      var slug = c.slug || c.$id || c.id;
      return urlElement("/category/" + encodeURIComponent(slug), {
        priority: "0.7",
        changefreq: "daily"
      });
    }).join("\n")
  );
}

function generateImageSitemap(products) {
  products = products || [];
  var urls = products.map(function(p) {
    var id = p.$id || p.id;
    var images = p.images || [];
    if (!images.length && !p.image) return "";

    var allImages = p.image ? [p.image].concat(images) : images;
    var imageTags = allImages.slice(0, 10).map(function(img) {
      var imgUrl = typeof img === "string" ? img : (img.url || img);
      var loc = escapeXml(
        /^https?:\/\//i.test(imgUrl)
          ? imgUrl
          : new URL(imgUrl, BASE_URL + "/").toString()
      );
      var title = escapeXml(p.productName || p.name || "Product");
      return [
        "      <image:image>",
        "        <image:loc>" + loc + "</image:loc>",
        "        <image:title>" + title + "</image:title>",
        "      </image:image>"
      ].join("\n");
    }).join("\n");

    if (!imageTags) return "";

    return [
      "  <url>",
      "    <loc>" + escapeXml(BASE_URL + "/products/" + encodeURIComponent(id)) + "</loc>",
      imageTags,
      "  </url>"
    ].join("\n");
  }).filter(Boolean).join("\n");

  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    urls,
    "</urlset>"
  ].join("\n");
}

module.exports = {
  generateMainSitemap: generateMainSitemap,
  generateProductSitemap: generateProductSitemap,
  generateCategorySitemap: generateCategorySitemap,
  generateImageSitemap: generateImageSitemap
};
