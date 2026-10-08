require("dotenv").config();
process.env.FORCE_NODE_FETCH = "1";

const { Client, Databases, Query } = require("node-appwrite");

const databaseId = process.env.APPWRITE_DATABASE_ID;
const collectionId = process.env.APPWRITE_ORDERS_COLLECTION;
const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

const attributes = [
  ["checkoutAttemptId", 64],
  ["checkoutAttemptKey", 64],
  ["deliveryRecipient", 255],
  ["deliveryAddressId", 64],
];
const attemptIndexKey = "checkout_attempt_unique";

async function main() {
  if (!databaseId || !collectionId || !endpoint || !projectId || !apiKey) {
    throw new Error("Missing Appwrite environment variables");
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);
  const databases = new Databases(client);
  const existingAttributes = await databases.listAttributes(
    databaseId,
    collectionId,
    [Query.limit(100)],
  );
  if (existingAttributes.attributes.length !== existingAttributes.total) {
    throw new Error(
      `Attribute listing was incomplete (${existingAttributes.attributes.length} of ${existingAttributes.total}).`,
    );
  }
  const attributesByKey = new Map(
    existingAttributes.attributes.map((attribute) => [
      attribute.key,
      attribute,
    ]),
  );
  const deliveryAddress = attributesByKey.get("deliveryAddress");

  if (
    !deliveryAddress ||
    !["string", "longtext"].includes(deliveryAddress.type)
  ) {
    throw new Error(
      "The existing deliveryAddress text attribute is required before checkout migration.",
    );
  }

  console.log(
    `Verified existing deliveryAddress text attribute, type ${deliveryAddress.type}.`,
  );

  for (const [key, size] of attributes) {
    if (attributesByKey.has(key)) {
      console.log(`Already exists: ${key}`);
      continue;
    }

    await databases.createStringAttribute(
      databaseId,
      collectionId,
      key,
      size,
      false,
    );
    console.log(`Created optional order attribute: ${key}`);
  }

  const existingIndexes = await databases.listIndexes(
    databaseId,
    collectionId,
    [Query.limit(100)],
  );
  if (existingIndexes.indexes.length !== existingIndexes.total) {
    throw new Error(
      `Index listing was incomplete (${existingIndexes.indexes.length} of ${existingIndexes.total}).`,
    );
  }
  const attemptIndex = existingIndexes.indexes.find(
    (index) => index.key === attemptIndexKey,
  );
  const indexedAttribute = "checkoutAttemptKey";

  if (attemptIndex) {
    const isValid =
      attemptIndex.type === "unique" &&
      attemptIndex.attributes.length === 1 &&
      attemptIndex.attributes[0] === indexedAttribute;
    if (!isValid) {
      throw new Error(
        `Index ${attemptIndexKey} exists with an incompatible definition.`,
      );
    }
    console.log(`Already exists: ${attemptIndexKey}`);
    return;
  }

  await databases.createIndex(
    databaseId,
    collectionId,
    attemptIndexKey,
    "unique",
    [indexedAttribute],
  );
  console.log(`Created unique index: ${attemptIndexKey}`);
}

main().catch((error) => {
  console.error("Mobile checkout order schema migration failed:", {
    message: error.message,
    code: error.code,
    endpoint,
    projectIdPresent: Boolean(projectId),
    databaseIdPresent: Boolean(databaseId),
    collectionIdPresent: Boolean(collectionId),
    stack: error.stack,
  });
  process.exitCode = 1;
});
