require("dotenv").config();

const { Client, Databases } = require("node-appwrite");

const databaseId = process.env.APPWRITE_DATABASE_ID;
const collectionId = process.env.APPWRITE_ORDERS_COLLECTION;
const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;

const attributes = [
  ["pesapalTrackingId", 100],
  ["pesapalMerchantReference", 100],
  ["pesapalPaymentMethod", 50],
  ["paymentReference", 255],
];

async function main() {
  if (!databaseId || !collectionId || !endpoint || !projectId || !apiKey) {
    throw new Error("Missing Appwrite environment variables");
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);
  const databases = new Databases(client);
  const existing = await databases.listAttributes(databaseId, collectionId);
  const existingKeys = new Set(existing.attributes.map((attribute) => attribute.key));

  for (const [key, size] of attributes) {
    if (existingKeys.has(key)) {
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
}

main().catch((error) => {
  console.error("Pesapal order attribute migration failed:", error.message);
  process.exitCode = 1;
});
