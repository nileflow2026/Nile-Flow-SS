"use strict";

const path = require("path");
const fs = require("fs");
const { run: scanGovernance } = require("../scanners/governanceScanner");

const outputPath = path.resolve(__dirname, "../reports/governance-report.json");

const ensureReportsDirectory = () => {
  const reportsDir = path.dirname(outputPath);
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
};

const run = async () => {
  console.log("Running Backend governance enforcement checks...");

  const report = scanGovernance();
  ensureReportsDirectory();
  fs.writeFileSync(outputPath, JSON.stringify(report, null, 2), "utf8");

  if (report.totalViolations > 0) {
    console.error(`Governance violations found: ${report.totalViolations}`);
    report.rawDbViolations.forEach((violation) => {
      console.error(`RAW DB VIOLATION: ${violation.file} -> ${violation.pattern}`);
    });
    report.domainViolations.forEach((violation) => {
      console.error(`DOMAIN VIOLATION: ${violation.file} -> ${violation.token}`);
    });
    process.exit(1);
  }

  console.log("No governance violations detected.");
  process.exit(0);
};

if (require.main === module) {
  run();
}
