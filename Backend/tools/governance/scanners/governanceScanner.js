"use strict";

const path = require("path");
const { run: scanRawDb } = require("./rawDbScanner");
const { run: scanDomainViolations } = require("./domainViolationScanner");

const run = () => {
  const rawDbViolations = scanRawDb();
  const domainViolations = scanDomainViolations();

  const report = {
    timestamp: new Date().toISOString(),
    rawDbViolations,
    domainViolations,
    totalViolations: rawDbViolations.length + domainViolations.length,
  };

  return report;
};

module.exports = {
  run,
};
