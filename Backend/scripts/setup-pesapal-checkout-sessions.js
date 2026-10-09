"use strict";

require("dotenv").config();
process.env.FORCE_NODE_FETCH = "1";

const { Client, Databases, Query } = require("node-appwrite");

const databaseId = process.env.APPWRITE_DATABASE_ID;
const collectionId =
  process.env.APPWRITE_PESAPAL_CHECKOUT_COLLECTION_ID ||
  "pesapal_checkout_sessions";
const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

async function main() {
  if (!databaseId || !endpoint || !projectId || !apiKey) {
    throw new Error("Missing Appwrite environment variables");
  }

  const databases = new Databases(
    new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey),
  );

  try {
    await databases.getCollection(databaseId, collectionId);
    console.log(`Already exists: ${collectionId}`);
  } catch (error) {
    if (error.code !== 404) throw error;
    await databases.createCollection(
      databaseId,
      collectionId,
      "Pesapal Checkout Sessions",
      [],
      false,
    );
    console.log(`Created collection: ${collectionId}`);
  }

  const attributes = await databases.listAttributes(
    databaseId,
    collectionId,
    [Query.limit(100)],
  );
  if (attributes.attributes.length !== attributes.total) {
    throw new Error(
      `Attribute listing was incomplete (${attributes.attributes.length} of ${attributes.total}).`,
    );
  }
  const attributesByKey = new Map(
    attributes.attributes.map((attribute) => [attribute.key, attribute]),
  );

  for (const [key, size] of [
    ["orderId", 64],
    ["trackingId", 128],
  ]) {
    const existing = attributesByKey.get(key);
    if (existing) {
      if (existing.type !== "string") {
        throw new Error(`${key} exists with an incompatible type.`);
      }
      console.log(`Already exists: ${key}`);
      continue;
    }

    await databases.createStringAttribute(
      databaseId,
      collectionId,
      key,
      size,
      true,
    );
    console.log(`Created required attribute: ${key}`);
  }

  const redirectUrl = attributesByKey.get("redirectUrl");
  if (redirectUrl) {
    if (!["string", "url"].includes(redirectUrl.type)) {
      throw new Error("redirectUrl exists with an incompatible type.");
    }
    console.log("Already exists: redirectUrl");
  } else {
    await databases.createUrlAttribute(
      databaseId,
      collectionId,
      "redirectUrl",
      true,
    );
    console.log("Created required attribute: redirectUrl");
  }
}

main().catch((error) => {
  console.error("Pesapal checkout session migration failed:", {
    message: error.message,
    code: error.code,
    endpoint,
    projectIdPresent: Boolean(projectId),
    databaseIdPresent: Boolean(databaseId),
    collectionId,
    stack: error.stack,
  });
  process.exitCode = 1;
});
