"use strict";

const fs = require("fs");
const path = require("path");

const forbiddenPatterns = [
  /\bnew\s+Databases\s*\(/,
  /\bdb\s*\.\s*listDocuments\s*\(/,
  /\bdb\s*\.\s*getDocument\s*\(/,
  /\bdb\s*\.\s*createDocument\s*\(/,
  /\bdb\s*\.\s*updateDocument\s*\(/,
  /\bdb\s*\.\s*deleteDocument\s*\(/,
];

const isDataLayer = (filePath) =>
  filePath.includes(`${path.normalize("/Backend/src/data/")}`);

const scanFile = (filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  const violations = [];

  for (const pattern of forbiddenPatterns) {
    if (pattern.test(content) && !isDataLayer(filePath)) {
      violations.push({ file: filePath, pattern: pattern.toString() });
    }
  }

  return violations;
};

const walkDirectory = (rootDirectory) => {
  const results = [];
  const entries = fs.readdirSync(rootDirectory, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(rootDirectory, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkDirectory(fullPath));
    } else if (/\.jsx?$/.test(entry.name)) {
      results.push(fullPath);
    }
  }

  return results;
};

const run = () => {
  const root = path.resolve(__dirname, "../../..");
  const backendSrc = path.join(root, "Backend");
  const files = walkDirectory(backendSrc);
  const violations = files.flatMap(scanFile);

  return violations;
};

module.exports = {
  run,
};
