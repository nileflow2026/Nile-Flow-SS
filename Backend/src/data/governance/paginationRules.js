"use strict";

const GovernanceError = require("./governanceErrors");
const { MAX_QUERY_LIMIT } = require("./queryLimits");
const MAX_OFFSET = 5000;

const enforcePagination = (limit, offset) => {
  if (limit > MAX_QUERY_LIMIT) {
    throw new GovernanceError(
      `Pagination limit ${limit} exceeds maximum allowed ${MAX_QUERY_LIMIT}.`,
      {
        limit,
        max: MAX_QUERY_LIMIT,
      },
    );
  }
  if (offset < 0 || offset > MAX_OFFSET) {
    throw new GovernanceError(
      `Pagination offset ${offset} is outside allowed range (0-${MAX_OFFSET}).`,
      {
        offset,
        maxOffset: MAX_OFFSET,
      },
    );
  }
};

module.exports = {
  MAX_OFFSET,
  enforcePagination,
};
