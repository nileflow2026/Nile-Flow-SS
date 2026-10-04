"use strict";

const { Databases } = require("node-appwrite");
const { client } = require("../services/appwriteService");
const { env } = require("../src/env");

const POLL_INTERVAL_MS = 1000;
const MAX_POLLS = 60;

const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

async function waitForAttribute(db, databaseId, collectionId) {
  for (let attempt = 0; attempt < MAX_POLLS; attempt += 1) {
    const attribute = await db.getAttribute(
      databaseId,
      collectionId,
      "pushToken",
    );

    if (attribute.status === "available") return attribute;
    if (attribute.status === "failed") {
      throw new Error("Appwrite failed to create the pushToken attribute.");
    }

    await wait(POLL_INTERVAL_MS);
  }

  throw new Error("Timed out waiting for the pushToken attribute.");
}

async function setupPushTokenAttribute() {
  const databaseId = env.APPWRITE_DATABASE_ID;
  const collectionId = env.APPWRITE_USER_COLLECTION_ID;
  if (!databaseId || !collectionId) {
    throw new Error(
      "APPWRITE_DATABASE_ID and APPWRITE_USER_COLLECTION_ID must be configured.",
    );
  }

  const db = new Databases(client);
  try {
    const existingAttribute = await db.getAttribute(
      databaseId,
      collectionId,
      "pushToken",
    );
    if (existingAttribute.type !== "string" || existingAttribute.size < 512) {
      throw new Error(
        "The existing pushToken attribute must be a string with at least 512 characters.",
      );
    }
    if (existingAttribute.status === "available") return existingAttribute;
  } catch (error) {
    if (error.code !== 404) throw error;

    try {
      await db.createStringAttribute(
        databaseId,
        collectionId,
        "pushToken",
        512,
        false,
      );
    } catch (creationError) {
      if (creationError.code !== 409) throw creationError;
    }
  }

  return waitForAttribute(db, databaseId, collectionId);
}

if (require.main === module) {
  setupPushTokenAttribute()
    .then(() => {
      console.log("Appwrite pushToken attribute is ready.");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Could not set up the Appwrite pushToken attribute:", error.message);
      process.exit(1);
    });
}

module.exports = { setupPushTokenAttribute };
