"use strict";

/**
 * Nile Flow — Expanded Appwrite Performance Instrumentation
 *
 * Extends the existing appwriteMetrics.js with:
 *   - nf_appwrite_cache_hits / misses / saved_reads
 *   - nf_appwrite_duplicate_requests
 *   - Top collections tracking (reads, writes, duration)
 *   - Top endpoints tracking
 *   - Most expensive queries tracking
 *
 * Provides a /api/admin/appwrite-performance endpoint for the dashboard.
 */

const client = require("prom-client");
const { registry } = require("./metrics");

// ── New Metrics (extending the existing set) ─────────────────────────────────

const appwriteCacheHitsTotal = new client.Counter({
  name: "nf_appwrite_cache_hits_total",
  help: "Total Appwrite cache hits (data served without Appwrite call)",
  labelNames: ["collection", "operation"],
  registers: [registry],
});

const appwriteCacheMissesTotal = new client.Counter({
  name: "nf_appwrite_cache_misses_total",
  help: "Total Appwrite cache misses (data fetched from Appwrite)",
  labelNames: ["collection", "operation"],
  registers: [registry],
});

const appwriteSavedReadsTotal = new client.Counter({
  name: "nf_appwrite_saved_reads_total",
  help: "Total Appwrite reads avoided due to caching",
  labelNames: ["collection", "operation"],
  registers: [registry],
});

const appwriteDuplicateRequestsTotal = new client.Counter({
  name: "nf_appwrite_duplicate_requests_total",
  help: "Total duplicate Appwrite requests coalesced/deduplicated",
  labelNames: ["collection", "operation"],
  registers: [registry],
});

const appwriteQueryCost = new client.Histogram({
  name: "nf_appwrite_query_cost_estimate",
  help: "Estimated cost impact of queries",
  labelNames: ["collection", "operation"],
  buckets: [1, 5, 10, 25, 50, 100, 500],
  registers: [registry],
});

// ── Top Collections Tracker (in-memory recent data for dashboard) ────────────

class AppwritePerformanceTracker {
  constructor() {
    this._topCollections = new Map(); // collectionId → { reads, writes, duration, lastAccessed }
    this._topEndpoints = new Map(); // operation → { count, totalDuration }
    this._expensiveQueries = []; // ring buffer of last 100 expensive queries
    this._maxQueries = 100;
  }

  recordQuery({ collectionId, operation, durationMs, filters }) {
    // Top collections
    const col = this._topCollections.get(collectionId) || {
      reads: 0,
      writes: 0,
      duration: 0,
      count: 0,
      lastAccessed: null,
    };
    if (["listDocuments", "getDocument"].includes(operation)) {
      col.reads++;
    } else {
      col.writes++;
    }
    col.duration += durationMs;
    col.count++;
    col.lastAccessed = new Date().toISOString();
    this._topCollections.set(collectionId, col);

    // Top endpoints (operations)
    const ep = this._topEndpoints.get(operation) || {
      count: 0,
      totalDuration: 0,
    };
    ep.count++;
    ep.totalDuration += durationMs;
    this._topEndpoints.set(operation, ep);

    // Expensive queries (top by duration)
    if (durationMs > 500) {
      this._expensiveQueries.unshift({
        collectionId,
        operation,
        durationMs,
        filters: filters ? filters.slice(0, 3) : [],
        timestamp: new Date().toISOString(),
        estimatedCost: this._estimateCost(operation, durationMs),
      });
      if (this._expensiveQueries.length > this._maxQueries) {
        this._expensiveQueries.pop();
      }
    }

    // Update cost histogram
    appwriteQueryCost.observe(
      { collection: collectionId, operation },
      this._estimateCost(operation, durationMs),
    );
  }

  _estimateCost(operation, durationMs) {
    // Rough cost estimation: reads are cheaper than writes,
    // listDocuments is more expensive than getDocument
    const baseCost = operation === "listDocuments" ? 5 : 1;
    const durationFactor = Math.ceil(durationMs / 100);
    return baseCost * durationFactor;
  }

  getTopCollections(limit = 10) {
    return Array.from(this._topCollections.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([id, data]) => ({ collectionId: id, ...data }));
  }

  getTopEndpoints(limit = 10) {
    return Array.from(this._topEndpoints.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, limit)
      .map(([op, data]) => ({ operation: op, ...data }));
  }

  getExpensiveQueries(limit = 20) {
    return this._expensiveQueries.slice(0, limit);
  }

  getSnapshot() {
    return {
      topCollections: this.getTopCollections(),
      topEndpoints: this.getTopEndpoints(),
      expensiveQueries: this.getExpensiveQueries(),
      totalCollectionsTracked: this._topCollections.size,
      cacheSummary: {
        hitRate: this._getHitRate(),
      },
    };
  }

  _getHitRate() {
    const hits = appwriteCacheHitsTotal.get();
    const misses = appwriteCacheMissesTotal.get();
    const total = (hits?.value || 0) + (misses?.value || 0);
    if (total === 0) return "0%";
    return (((hits?.value || 0) / total) * 100).toFixed(2) + "%";
  }
}

const performanceTracker = new AppwritePerformanceTracker();

// ── Express middleware for dashboard endpoint ────────────────────────────────

function createPerformanceDashboardRouter() {
  const express = require("express");
  const router = express.Router();

  // GET /api/admin/appwrite-performance
  router.get("/", (req, res) => {
    const snapshot = performanceTracker.getSnapshot();

    // Get raw metric values
    const cacheHits = appwriteCacheHitsTotal.get();
    const cacheMisses = appwriteCacheMissesTotal.get();
    const savedReads = appwriteSavedReadsTotal.get();
    const duplicateRequests = appwriteDuplicateRequestsTotal.get();

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      topCollections: snapshot.topCollections,
      topEndpoints: snapshot.topEndpoints,
      expensiveQueries: snapshot.expensiveQueries,
      totalCollectionsTracked: snapshot.totalCollectionsTracked,
      cacheMetrics: {
        hits: cacheHits?.values || [],
        misses: cacheMisses?.values || [],
        savedReads: savedReads?.values || [],
        duplicatesBlocked: duplicateRequests?.values || [],
        hitRate: snapshot.cacheSummary.hitRate,
      },
    });
  });

  return router;
}

module.exports = {
  appwriteCacheHitsTotal,
  appwriteCacheMissesTotal,
  appwriteSavedReadsTotal,
  appwriteDuplicateRequestsTotal,
  appwriteQueryCost,
  performanceTracker,
  createPerformanceDashboardRouter,
};
