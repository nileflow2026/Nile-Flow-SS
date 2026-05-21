"use strict";

const { validateOwnership } = require("./ownershipValidator");

const enforceRepositoryOwnership = ({ domainName, collectionId, sourceFile }) => {
  validateOwnership(domainName, collectionId, sourceFile);
};

module.exports = {
  enforceRepositoryOwnership,
};
