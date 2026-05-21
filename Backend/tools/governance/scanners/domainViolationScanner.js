"use strict";

const fs = require("fs");
const path = require("path");

const collectionIdentifiers = [
  "APPWRITE_CATEGORIES_COLLECTION_ID",
  "APPWRITE_PRODUCTS_COLLECTION_ID",
  "APPWRITE_ORDERS_COLLECTION_ID",
  "APPWRITE_PAYMENTS_COLLECTION_ID",
  "APPWRITE_SUBSCRIPTIONS_COLLECTION_ID",
  "APPWRITE_NOTIFICATIONS_COLLECTION_ID",
  "APPWRITE_NILE_MILES_COLLECTION_ID",
  "APPWRITE_DELIVERIES_COLLECTION_ID",
  "APPWRITE_RIDERS_COLLECTION_ID",
  "APPWRITE_AFRICAN_FACTS_COLLECTION_ID",
  "APPWRITE_GROUP_ORDERS_COLLECTION_ID",
  "APPWRITE_AI_CHAT_SESSIONS_COLLECTION_ID",
];

const excludedDirectories = [
  "/Backend/src/data/",
  "/Backend/tools/governance/",
];

const scanFile = (filePath) => {
  const content = fs.readFileSync(filePath, "utf8");
  const violations = [];

  if (
    excludedDirectories.some((dir) => filePath.includes(path.normalize(dir)))
  ) {
    return violations;
  }

  for (const token of collectionIdentifiers) {
    const regex = new RegExp(`\\b${token}\\b`, "g");
    if (regex.test(content)) {
      violations.push({ file: filePath, token });
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
