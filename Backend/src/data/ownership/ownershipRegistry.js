"use strict";

const { DOMAINS } = require("../../domains");

const getDomain = (domainName) => {
  const normalized = String(domainName).toUpperCase();
  const domain = DOMAINS[normalized];
  if (!domain) {
    throw new Error(
      `Unknown domain '${domainName}'. Supported domains: ${Object.keys(DOMAINS).join(", ")}`,
    );
  }
  return domain;
};

const getDomainCollections = (domainName) => {
  return getDomain(domainName).appwriteCollections || [];
};

const ownsCollection = (domainName, collectionId) => {
  const collections = getDomainCollections(domainName);
  return collections.includes(collectionId);
};

module.exports = {
  getDomain,
  getDomainCollections,
  ownsCollection,
};
