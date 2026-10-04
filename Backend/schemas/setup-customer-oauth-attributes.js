"use strict";

const { Databases } = require("node-appwrite");
const { client } = require("../services/appwriteService");
const { env } = require("../src/env");

const POLL_INTERVAL_MS = 1000;
const MAX_POLLS = 60;
const attributes = ["googleSubject", "facebookSubject"];

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function ensureAttribute(db, databaseId, collectionId, key) {
  try {
    const existing = await db.getAttribute(databaseId, collectionId, key);
    if (existing.type !== "string" || existing.size < 255 || existing.required) {
      throw new Error(
        `The ${key} attribute must be an optional string with a size of at least 255.`,
      );
    }
    if (existing.status === "available") return;
  } catch (error) {
    if (error.code !== 404) throw error;
    try {
      await db.createStringAttribute(
        databaseId,
        collectionId,
        key,
        255,
        false,
      );
    } catch (createError) {
      if (createError.code !== 409) throw createError;
    }
  }

  for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
    const attribute = await db.getAttribute(databaseId, collectionId, key);
    if (attribute.status === "available") return;
    if (attribute.status === "failed") {
      throw new Error(`Appwrite failed to create ${key}.`);
    }
    await wait(POLL_INTERVAL_MS);
  }
  throw new Error(`Timed out waiting for ${key} to become available.`);
}

async function ensureUniqueIndex(db, databaseId, collectionId, key) {
  const indexKey = `uniq_${key}`;
  try {
    const existing = await db.getIndex(databaseId, collectionId, indexKey);
    if (
      existing.type !== "unique" ||
      existing.attributes.length !== 1 ||
      existing.attributes[0] !== key
    ) {
      throw new Error(`The ${indexKey} index does not enforce uniqueness.`);
    }
    if (existing.status === "available") return;
  } catch (error) {
    if (error.code !== 404) throw error;
    try {
      await db.createIndex(
        databaseId,
        collectionId,
        indexKey,
        "unique",
        [key],
      );
    } catch (createError) {
      if (createError.code !== 409) throw createError;
    }
  }

  for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
    const index = await db.getIndex(databaseId, collectionId, indexKey);
    if (index.status === "available") return;
    if (index.status === "failed") {
      throw new Error(`Appwrite failed to create ${indexKey}.`);
    }
    await wait(POLL_INTERVAL_MS);
  }
  throw new Error(`Timed out waiting for ${indexKey} to become available.`);
}

async function setupCustomerOAuthAttributes() {
  const { APPWRITE_DATABASE_ID: databaseId, APPWRITE_USER_COLLECTION_ID: collectionId } =
    env;
  if (!databaseId || !collectionId) {
    throw new Error(
      "APPWRITE_DATABASE_ID and APPWRITE_USER_COLLECTION_ID must be configured.",
    );
  }

  const db = new Databases(client);
  for (const key of attributes) {
    await ensureAttribute(db, databaseId, collectionId, key);
    await ensureUniqueIndex(db, databaseId, collectionId, key);
  }
}

if (require.main === module) {
  setupCustomerOAuthAttributes()
    .then(() => {
      console.log("Customer OAuth profile attributes and unique indexes are ready.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Customer OAuth schema setup failed:", error.message);
      process.exit(1);
    });
}

module.exports = { setupCustomerOAuthAttributes };
