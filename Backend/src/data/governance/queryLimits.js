"use strict";

const GovernanceError = require("./governanceErrors");

const MAX_QUERY_LIMIT = 100;
const MAX_BULK_READS = 1000;

const enforceLimit = (limit, context = "query") => {
  if (limit > MAX_QUERY_LIMIT) {
    throw new GovernanceError(
      `Query limit ${limit} exceeds governance maximum of ${MAX_QUERY_LIMIT} for ${context}.`,
      { limit, max: MAX_QUERY_LIMIT, context },
    );
  }
  if (limit <= 0) {
    throw new GovernanceError(`Query limit must be positive for ${context}.`, {
      limit,
      context,
    });
  }
};

const enforceBulkReadSize = (size, context = "bulk read") => {
  if (size > MAX_BULK_READS) {
    throw new GovernanceError(
      `Bulk read size ${size} exceeds governance maximum of ${MAX_BULK_READS} for ${context}.`,
      { size, max: MAX_BULK_READS, context },
    );
  }
};

module.exports = {
  MAX_QUERY_LIMIT,
  MAX_BULK_READS,
  enforceLimit,
  enforceBulkReadSize,
};
