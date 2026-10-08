"use strict";

process.env.FORCE_NODE_FETCH = "1";

const { Databases, Query } = require("node-appwrite");
const { client } = require("../services/appwriteService");
const { env } = require("../src/env");

const PAGE_SIZE = 100;

const configuredCollections = [
  ["User preferences", "APPWRITE_USER_COLLECTION_ID", env.APPWRITE_USER_COLLECTION_ID],
  ["In app notifications", "APPWRITE_NOTIFICATIONS_COLLECTION_ID", env.APPWRITE_NOTIFICATIONS_COLLECTION_ID],
  ["Push broadcasts", "APPWRITE_PUSH_BROADCASTS_COLLECTION_ID", env.APPWRITE_PUSH_BROADCASTS_COLLECTION_ID],
  ["Push broadcast deliveries", "APPWRITE_PUSH_BROADCAST_DELIVERIES_COLLECTION_ID", env.APPWRITE_PUSH_BROADCAST_DELIVERIES_COLLECTION_ID],
  ["Push event receipts", "APPWRITE_PUSH_EVENT_RECEIPTS_COLLECTION_ID", env.APPWRITE_PUSH_EVENT_RECEIPTS_COLLECTION_ID],
];

async function listAllAttributes(db, databaseId, collectionId) {
  const attributes = [];
  let offset = 0;

  while (true) {
    const result = await db.listAttributes(databaseId, collectionId, [
      Query.limit(PAGE_SIZE),
      Query.offset(offset),
    ]);
    attributes.push(...result.attributes);
    if (result.attributes.length < PAGE_SIZE) break;
    offset += result.attributes.length;
  }

  return attributes;
}

async function inspectPushAttributes() {
  if (!env.APPWRITE_DATABASE_ID) {
    throw new Error("APPWRITE_DATABASE_ID is not configured.");
  }

  const db = new Databases(client);
  let failed = false;
  let inspected = 0;

  for (const [label, envName, collectionId] of configuredCollections) {
    if (!collectionId) {
      console.log(`${label}: skipped, ${envName} is not configured.`);
      continue;
    }

    try {
      const attributes = await listAllAttributes(
        db,
        env.APPWRITE_DATABASE_ID,
        collectionId,
      );
      inspected += 1;
      console.log(`\n${label} (${collectionId})`);
      if (!attributes.length) {
        console.log("  No attributes found.");
        continue;
      }

      for (const attribute of attributes) {
        const size = attribute.size ? `, size ${attribute.size}` : "";
        console.log(
          `  ${attribute.key}: ${attribute.type}${size}, ${attribute.status}`,
        );
      }
    } catch (error) {
      failed = true;
      console.error(
        `\nCould not inspect ${label} (${envName}=${collectionId}): ${error.message}`,
      );
    }
  }

  if (!inspected) {
    throw new Error("No configured push related collections could be inspected.");
  }
  if (failed) {
    throw new Error("One or more collections could not be inspected.");
  }
}

if (require.main === module) {
  inspectPushAttributes()
    .then(() => {
      console.log("\nAttribute inspection completed.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Push attribute inspection failed:", error.message);
      process.exit(1);
    });
}

module.exports = { inspectPushAttributes, listAllAttributes };
