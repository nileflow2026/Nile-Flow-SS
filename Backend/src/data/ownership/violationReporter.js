"use strict";

const { ownershipViolationsTotal } = require("./ownershipMetrics");
const { logger } = require("../../lib/logger");

const reportOwnershipViolation = ({ domainName, collectionId, sourceFile }) => {
  if (ownershipViolationsTotal) {
    ownershipViolationsTotal.inc({ domain: domainName, collection: collectionId });
  }

  if (logger && typeof logger.warn === "function") {
    logger.warn("Ownership violation detected", {
      domainName,
      collectionId,
      sourceFile,
      timestamp: new Date().toISOString(),
    });
  }
};

module.exports = {
  reportOwnershipViolation,
};
