"use strict";

/**
 * Nile Flow — Appwrite Operation Instrumentation
 *
 * Wraps the Appwrite database client to automatically track:
 *   - Read/write operation counts by collection
 *   - Operation duration histograms
 *   - Error counts
 *
 * Usage:
 *   const { instrumentedDb } = require('./appwriteMetrics');
 *   // Use instrumentedDb instead of raw db in any controller
 *
 * Note: This wraps the existing db instance from appwriteService.
 * Controllers can opt in to instrumentation progressively.
 */

const { metrics } = require("./metrics");

const READ_OPS = new Set(["listDocuments", "getDocument"]);

const WRITE_OPS = new Set([
  "createDocument",
  "updateDocument",
  "deleteDocument",
]);

/**
 * Wraps an Appwrite Databases client instance with metrics instrumentation.
 * Returns a Proxy that intercepts all method calls.
 *
 * @param {object} dbClient - Appwrite Databases instance
 * @returns {Proxy}
 */
const createInstrumentedDb = (dbClient) => {
  return new Proxy(dbClient, {
    get(target, prop) {
      const original = target[prop];
      if (typeof original !== "function") return original;

      return async (...args) => {
        // args[1] = collectionId for listDocuments/getDocument/createDocument/etc.
        const collectionId = args[1] || "unknown";
        const operation = String(prop);

        if (READ_OPS.has(operation)) {
          metrics.appwriteReadsTotal.inc({
            collection: collectionId,
            operation,
          });
        } else if (WRITE_OPS.has(operation)) {
          metrics.appwriteWritesTotal.inc({
            collection: collectionId,
            operation,
          });
        }

        const end = metrics.appwriteOperationDuration.startTimer({
          collection: collectionId,
          operation,
        });

        try {
          const result = await original.apply(target, args);
          end();
          return result;
        } catch (err) {
          end();
          metrics.appwriteErrorsTotal.inc({
            collection: collectionId,
            operation,
          });
          throw err;
        }
      };
    },
  });
};

module.exports = { createInstrumentedDb };
