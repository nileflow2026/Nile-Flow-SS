/**
 * SEO Routes — Sitemaps, Merchant Center Feed, and IndexNow
 *
 * Mounts:
 *   GET  /sitemap.xml               — Main static sitemap
 *   GET  /sitemap-products.xml       — Product sitemap (fetches from DB)
 *   GET  /sitemap-categories.xml     — Category sitemap
 *   GET  /sitemap-images.xml         — Image sitemap
 *   GET  /merchant-feed.xml          — Google Merchant Center product feed
 *   POST /api/indexnow               — IndexNow URL submission
 */

"use strict";

var express = require("express");
var router = express.Router();
var Query = require("node-appwrite").Query;
var instrumentedDb = require("../services/appwriteService").instrumentedDb;
var env = require("../src/env").env;
var sitemapService = require("../services/sitemapService");

// ── Sitemap: Static Routes ─────────────────────────────────────
router.get("/sitemap.xml", function(req, res) {
  try {
    var xml = sitemapService.generateMainSitemap();
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.send(xml);
  } catch (error) {
    console.error("Sitemap generation failed:", error.message);
    res.status(500).send("Sitemap generation failed");
  }
});

// ── Sitemap: Products ──────────────────────────────────────────
router.get("/sitemap-products.xml", async function(req, res) {
  try {
    var products = [];
    var batch = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      [
        Query.equal("isActive", true),
        Query.limit(100),
        Query.orderDesc("$updatedAt")
      ]
    );
    products = batch.documents;

    var cursorId = batch.documents.length > 0
      ? batch.documents[batch.documents.length - 1].$id
      : null;

    while (cursorId && products.length < 50000) {
      var nextBatch = await instrumentedDb.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        [
          Query.equal("isActive", true),
          Query.limit(100),
          Query.cursorAfter(cursorId),
          Query.orderDesc("$updatedAt")
        ]
      );
      if (nextBatch.documents.length === 0) break;
      products = products.concat(nextBatch.documents);
      cursorId = nextBatch.documents[nextBatch.documents.length - 1].$id;
    }

    var xml = sitemapService.generateProductSitemap(products);
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=1800, s-maxage=1800");
    res.send(xml);
  } catch (error) {
    console.error("Product sitemap failed:", error.message);
    res.status(500).send("Product sitemap generation failed");
  }
});

// ── Sitemap: Categories ────────────────────────────────────────
router.get("/sitemap-categories.xml", async function(req, res) {
  try {
    var result = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_CATEGORIES_COLLECTION_ID,
      [Query.limit(100)]
    );
    var xml = sitemapService.generateCategorySitemap(result.documents);
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.send(xml);
  } catch (error) {
    console.error("Category sitemap failed:", error.message);
    res.status(500).send("Category sitemap generation failed");
  }
});

// ── Sitemap: Images ────────────────────────────────────────────
router.get("/sitemap-images.xml", async function(req, res) {
  try {
    var products = [];
    var batch = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      [
        Query.equal("isActive", true),
        Query.limit(100),
        Query.orderDesc("$updatedAt")
      ]
    );
    products = batch.documents;

    var cursorId = batch.documents.length > 0
      ? batch.documents[batch.documents.length - 1].$id
      : null;

    while (cursorId && products.length < 50000) {
      var nextBatch = await instrumentedDb.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        [
          Query.equal("isActive", true),
          Query.limit(100),
          Query.cursorAfter(cursorId),
          Query.orderDesc("$updatedAt")
        ]
      );
      if (nextBatch.documents.length === 0) break;
      products = products.concat(nextBatch.documents);
      cursorId = nextBatch.documents[nextBatch.documents.length - 1].$id;
    }

    var xml = sitemapService.generateImageSitemap(products);
    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=1800, s-maxage=1800");
    res.send(xml);
  } catch (error) {
    console.error("Image sitemap failed:", error.message);
    res.status(500).send("Image sitemap generation failed");
  }
});

// ── Google Merchant Center Product Feed ────────────────────────
router.get("/merchant-feed.xml", async function(req, res) {
  try {
    var products = [];
    var batch = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      [
        Query.equal("isActive", true),
        Query.limit(100),
        Query.orderDesc("$updatedAt")
      ]
    );
    products = batch.documents;

    var cursorId = batch.documents.length > 0
      ? batch.documents[batch.documents.length - 1].$id
      : null;

    while (cursorId && products.length < 50000) {
      var nextBatch = await instrumentedDb.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_PRODUCT_COLLECTION_ID,
        [
          Query.equal("isActive", true),
          Query.limit(100),
          Query.cursorAfter(cursorId),
          Query.orderDesc("$updatedAt")
        ]
      );
      if (nextBatch.documents.length === 0) break;
      products = products.concat(nextBatch.documents);
      cursorId = nextBatch.documents[nextBatch.documents.length - 1].$id;
    }

    var items = products.map(function(p) {
      var id = p.$id || p.id;
      var name = (p.productName || p.name || "Product").replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
      var desc = (p.description || name).substring(0, 5000).replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">");
      var price = p.price || 0;
      var currency = p.currency || "KES";
      var link = "https://www.nileflowafrica.com/products/" + id;
      var imageLink = p.image ? (p.image.indexOf("http") === 0 ? p.image : "https://www.nileflowafrica.com" + p.image) : "https://www.nileflowafrica.com/logo.png";
      var availability = (p.stock > 0) ? "in_stock" : "out_of_stock";
      var brand = (p.vendorName || p.brand || "Nile Flow").replace(/&/g, "&").replace(/</g, "<");

      return [
        "  <item>",
        "    <g:id>" + id + "</g:id>",
        "    <title>" + name + "</title>",
        "    <description>" + desc + "</description>",
        "    <link>" + link + "</link>",
        "    <g:image_link>" + imageLink + "</g:image_link>",
        "    <g:price>" + price + " " + currency + "</g:price>",
        "    <g:availability>" + availability + "</g:availability>",
        "    <g:condition>new</g:condition>",
        "    <g:brand>" + brand + "</g:brand>",
        "    <g:identifier_exists>no</g:identifier_exists>",
        "  </item>"
      ].join("\n");
    }).join("\n");

    var xml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">',
      "  <channel>",
      "    <title>Nile Flow - Products</title>",
      "    <link>https://www.nileflowafrica.com</link>",
      "    <description>Nile Flow Product Feed for Google Merchant Center</description>",
      items,
      "  </channel>",
      "</rss>"
    ].join("\n");

    res.set("Content-Type", "application/xml; charset=utf-8");
    res.set("Cache-Control", "public, max-age=3600, s-maxage=3600");
    res.send(xml);
  } catch (error) {
    console.error("Merchant feed failed:", error.message);
    res.status(500).send("Merchant feed generation failed");
  }
});

// ── IndexNow URL Submission ────────────────────────────────────
async function submitToIndexNow(urls) {
  urls = urls || [];
  if (urls.length === 0) return;

  var INDEXNOW_KEY = process.env.INDEXNOW_KEY || "";
  if (!INDEXNOW_KEY) {
    console.debug("[IndexNow] INDEXNOW_KEY not configured — skipping.");
    return;
  }

  var SITE_URL = "https://www.nileflowafrica.com";
  var HOST = "www.nileflowafrica.com";

  var payload = JSON.stringify({
    host: HOST,
    key: INDEXNOW_KEY,
    keyLocation: SITE_URL + "/" + INDEXNOW_KEY + ".txt",
    urlList: urls.slice(0, 10000)
  });

  try {
    var response = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload
    });

    if (response.ok) {
      console.log("[IndexNow] Submitted " + urls.length + " URLs successfully");
    } else {
      var text = await response.text();
      console.warn("[IndexNow] Submission returned " + response.status + ": " + text);
    }
  } catch (error) {
    console.warn("[IndexNow] Submission failed:", error.message);
  }
}

async function submitProductToIndexNow(productId) {
  var url = "https://www.nileflowafrica.com/products/" + productId;
  await submitToIndexNow([url]);
}

router.post("/indexnow", express.json(), async function(req, res) {
  try {
    var urls = req.body.urls || [];
    if (urls.length === 0) {
      return res.status(400).json({ error: "No URLs provided" });
    }
    await submitToIndexNow(urls);
    res.json({ success: true, submitted: urls.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = {
  seoRouter: router,
  submitProductToIndexNow: submitProductToIndexNow
};
