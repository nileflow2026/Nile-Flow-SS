"use strict";

const { ownsCollection } = require("./ownershipRegistry");
const { reportOwnershipViolation } = require("./violationReporter");
const { recordOwnershipValidation } = require("./ownershipMetrics");
const GovernanceError = require("../governance/governanceErrors");

const validateOwnership = (domainName, collectionId, sourceFile) => {
  if (!ownsCollection(domainName, collectionId)) {
    reportOwnershipViolation({ domainName, collectionId, sourceFile });
    throw new GovernanceError(
      `Ownership violation: Domain '${domainName}' is not authorized to access collection '${collectionId}'.`,
      { domainName, collectionId, sourceFile },
    );
  }
  recordOwnershipValidation({ domainName, collectionId, sourceFile });
};

module.exports = {
  validateOwnership,
};
