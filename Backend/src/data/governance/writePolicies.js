"use strict";

const GovernanceError = require("./governanceErrors");

const MAX_BULK_WRITES = 100;

const enforceBulkWriteSize = (size) => {
  if (size > MAX_BULK_WRITES) {
    throw new GovernanceError(
      `Bulk write size ${size} exceeds governance limit of ${MAX_BULK_WRITES}. Use batched processing or a queue for larger updates.`,
      { size, max: MAX_BULK_WRITES },
    );
  }
};

module.exports = {
  MAX_BULK_WRITES,
  enforceBulkWriteSize,
};
