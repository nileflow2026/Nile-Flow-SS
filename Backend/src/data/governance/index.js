"use strict";

const { DOMAINS } = require("../../domains");

const getDomainByName = (domainName) => {
  const normalized = String(domainName).toUpperCase();
  const domain = DOMAINS[normalized];
  if (!domain) {
    throw new Error(`Unknown domain '${domainName}'. Valid domains: ${Object.keys(DOMAINS).join(", ")}`);
  }
  return domain;
};

const canAccessCollection = (domainName, collectionId) => {
  const domain = getDomainByName(domainName);
  return Array.isArray(domain.appwriteCollections) && domain.appwriteCollections.includes(collectionId);
};

const assertDomainAccess = (domainName, collectionId) => {
  if (!canAccessCollection(domainName, collectionId)) {
    throw new Error(
      `Domain '${domainName}' is not authorized to access Appwrite collection '${collectionId}'. ` +
        `Review Backend/src/domains/index.js and the domain ownership registry before changing this behavior.`,
    );
  }
};

const getAccessibleCollections = (domainName) => {
  return getDomainByName(domainName).appwriteCollections || [];
};

module.exports = {
  canAccessCollection,
  assertDomainAccess,
  getAccessibleCollections,
};
