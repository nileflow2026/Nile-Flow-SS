"use strict";

const GovernanceError = require("./governanceErrors");

const MAX_READ_AMPLIFICATION = 3;

const detectAmplification = ({ requestedPages = 1, maxPages = 1 }) => {
  if (requestedPages > maxPages * MAX_READ_AMPLIFICATION) {
    throw new GovernanceError(
      `Read amplification detected: requested ${requestedPages} pages exceeds safe limit ${MAX_READ_AMPLIFICATION} x ${maxPages}.`,
      { requestedPages, maxPages, multiplier: MAX_READ_AMPLIFICATION },
    );
  }
};

module.exports = {
  MAX_READ_AMPLIFICATION,
  detectAmplification,
};
