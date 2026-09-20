require("dotenv").config();

const axios = require("axios");

const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const databaseId = process.env.APPWRITE_DATABASE_ID;
const collectionId = process.env.TEAM_MEMBERS_COLLECTION_ID;

const attributes = [
  ["name", "string", 120],
  ["role", "string", 120],
  ["bio", "string", 1000],
  ["image", "string", 500],
  ["email", "string", 255],
  ["phone", "string", 40],
  ["socials", "string", 4000],
  ["order", "integer", null],
  ["isActive", "boolean", null],
];

async function main() {
  if (!endpoint || !projectId || !apiKey || !databaseId || !collectionId) {
    throw new Error("APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID, APPWRITE_API_KEY, APPWRITE_DATABASE_ID, and TEAM_MEMBERS_COLLECTION_ID are required");
  }

  const api = axios.create({
    baseURL: endpoint.replace(/\/$/, ""),
    headers: {
      "X-Appwrite-Project": projectId,
      "X-Appwrite-Key": apiKey,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    timeout: 20000,
  });
  const existing = await api.get(`/databases/${databaseId}/collections/${collectionId}/attributes`);
  const existingKeys = new Set((existing.data.attributes || []).map((attribute) => attribute.key));

  for (const [key, type, size] of attributes) {
    if (existingKeys.has(key)) {
      console.log(`Already exists: ${key}`);
      continue;
    }

    if (type === "string") {
      await api.post(`/databases/${databaseId}/collections/${collectionId}/attributes/string`, {
        key,
        size,
        required: false,
      });
    } else if (type === "integer") {
      await api.post(`/databases/${databaseId}/collections/${collectionId}/attributes/integer`, {
        key,
        required: false,
      });
    } else {
      await api.post(`/databases/${databaseId}/collections/${collectionId}/attributes/boolean`, {
        key,
        required: false,
      });
    }
    console.log(`Created optional team member attribute: ${key}`);
  }
}

main().catch((error) => {
  console.error("Team members collection setup failed:", {
    message: error.message,
    name: error.name,
    code: error.code,
    type: error.type,
    cause: error.cause?.message || error.cause,
    causeCode: error.cause?.code,
    causeErrno: error.cause?.errno,
    causeSyscall: error.cause?.syscall,
    endpoint,
    projectIdPresent: Boolean(projectId),
    databaseIdPresent: Boolean(databaseId),
    collectionIdPresent: Boolean(collectionId),
    stack: error.stack,
  });
  process.exitCode = 1;
});
