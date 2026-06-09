"use strict";

const { DOMAINS } = require("../domains");

function enforceRepositoryOwnership({ domainName, collectionId, sourceFile }) {
  const normalizedDomain = String(domainName).toUpperCase();
  const domain = DOMAINS[normalizedDomain];

  if (!domain) {
    throw new Error(
      `[ENFORCEMENT] Unknown domain: "${domainName}". Valid domains: ${Object.keys(DOMAINS).join(", ")}. Called from: ${sourceFile}`,
    );
  }

  if (!domain.appwriteCollections.includes(collectionId)) {
    throw new Error(
      `[ENFORCEMENT] Domain "${domainName}" attempted to access collection "${collectionId}", but the domain only owns: ${domain.appwriteCollections.join(", ")}. Called from: ${sourceFile}`,
    );
  }
}

module.exports = { enforceRepositoryOwnership };
