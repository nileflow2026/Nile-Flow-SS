require("dotenv").config();
const { Client, Databases } = require("node-appwrite");

const required = [
  "APPWRITE_ENDPOINT",
  "APPWRITE_PROJECT_ID",
  "APPWRITE_API_KEY",
  "APPWRITE_DATABASE_ID",
  "APPWRITE_PRODUCT_COLLECTION_ID",
];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const client = new Client()
  .setEndpoint(process.env.APPWRITE_ENDPOINT)
  .setProject(process.env.APPWRITE_PROJECT_ID)
  .setKey(process.env.APPWRITE_API_KEY);
const databases = new Databases(client);

const attributes = [
  {
    key: "totalRatings",
    create: () => databases.createIntegerAttribute(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_PRODUCT_COLLECTION_ID,
      "totalRatings",
      false,
      0,
      1000000000,
      0,
    ),
  },
  {
    key: "avgRating",
    create: () => databases.createFloatAttribute(
      process.env.APPWRITE_DATABASE_ID,
      process.env.APPWRITE_PRODUCT_COLLECTION_ID,
      "avgRating",
      false,
      0,
      5,
      0,
    ),
  },
];

async function main() {
  for (const attribute of attributes) {
    try {
      await attribute.create();
      console.log(`created ${attribute.key}`);
    } catch (error) {
      if (error?.code === 409) {
        console.log(`exists ${attribute.key}`);
      } else {
        throw error;
      }
    }
  }
}

main().catch((error) => {
  console.error(`rating attribute migration failed: ${error.message}`);
  process.exitCode = 1;
});
