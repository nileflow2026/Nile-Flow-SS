"use strict";

const client = require("prom-client");
const { registry } = require("../../observability/metrics");

const ownershipValidationTotal = new client.Counter({
  name: "nf_ownership_validations_total",
  help: "Total repository ownership validations performed",
  labelNames: ["domain", "collection"],
  registers: [registry],
});

const ownershipViolationsTotal = new client.Counter({
  name: "nf_ownership_violations_total",
  help: "Total ownership validation failures detected",
  labelNames: ["domain", "collection"],
  registers: [registry],
});

const recordOwnershipValidation = ({ domainName, collectionId }) => {
  ownershipValidationTotal.inc({ domain: domainName, collection: collectionId });
};

module.exports = {
  ownershipValidationTotal,
  ownershipViolationsTotal,
  recordOwnershipValidation,
};
