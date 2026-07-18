/**
 * Migration Script: Add resetCode and resetCodeExpiry attributes to the User collection
 *
 * ZERO dependencies — uses only Node.js built-in modules (fs + fetch which is
 * available in Node 18+ on Render).
 *
 * HOW TO RUN:
 *   1. Push code to GitHub (Render auto-deploys)
 *   2. On Render dashboard → Connect → Shell → run:
 *      node Backend/scripts/addResetCodeAttributes.js
 *
 *   3. Or locally (from the Backend directory):
 *      cd Backend && node scripts/addResetCodeAttributes.js
 *
 * Reads .env from Backend/.env if it exists, else falls back to process.env.
 */

const fs = require("fs");
const path = require("path");

// ── Load .env without dotenv ──────────────────────────────────────────
function loadEnv() {
  const envPath = path.resolve(__dirname, "..", ".env");
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, "utf-8").split("\n");
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      // Strip surrounding quotes
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

loadEnv();

const ENDPOINT = (process.env.APPWRITE_ENDPOINT || "https://fra.cloud.appwrite.io/v1").replace(/\/+$/, "");
const PROJECT_ID = process.env.APPWRITE_PROJECT_ID;
const API_KEY = process.env.APPWRITE_API_KEY;
const DATABASE_ID = process.env.APPWRITE_DATABASE_ID;
const COLLECTION_ID = process.env.APPWRITE_USER_COLLECTION_ID;

async function api(method, uri, body = null) { 
  const res = await fetch(`${ENDPOINT}${uri}`, {
    method,
    headers: {
      "X-Appwrite-Project": PROJECT_ID,
      "X-Appwrite-Key": API_KEY,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${data.message || JSON.stringify(data)}`);
  }
  return data;
}

async function run() {
  console.log("=== Add Reset Code Attributes Migration ===\n");

  const missing = ["APPWRITE_PROJECT_ID", "APPWRITE_API_KEY", "APPWRITE_DATABASE_ID", "APPWRITE_USER_COLLECTION_ID"]
    .filter((k) => !process.env[k]);
  if (missing.length > 0) {
    console.error(`❌ Missing env vars: ${missing.join(", ")}`);
    console.error("   Ensure .env file exists at Backend/.env or env vars are set on Render.");
    process.exit(1);
  }

  console.log(`📡 Endpoint:   ${ENDPOINT}`);
  console.log(`📦 Project:    ${PROJECT_ID}`);
  console.log(`🗄️  Database:   ${DATABASE_ID}`);
  console.log(`👤 Collection: ${COLLECTION_ID}\n`);

  // 1. Get existing attributes
  console.log("📋 Fetching existing collection attributes...");
  let existingKeys = [];
  try {
    const collection = await api("GET", `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}`);
    existingKeys = (collection.attributes || []).map((a) => a.key || a.$id);
    console.log(`   Found ${existingKeys.length} existing attributes.`);
  } catch (err) {
    console.error(`❌ Failed to fetch collection: ${err.message}`);
    process.exit(1);
  }

  const attributes = [
    { key: "resetCode", type: "string", size: 6, required: false, default: null },
    { key: "resetCodeExpiry", type: "datetime", required: false, default: null },
  ];

  let added = 0;
  let skipped = 0;

  for (const attr of attributes) {
    if (existingKeys.includes(attr.key)) {
      console.log(`⏭️  Skipping "${attr.key}" — already exists.`);
      skipped++;
      continue;
    }

    try {
      console.log(`➕ Adding "${attr.key}" (${attr.type})...`);

      if (attr.type === "string") {
        await api("POST", `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/string`, {
          key: attr.key,
          size: attr.size || 255,
          required: attr.required || false,
          default: attr.default || null,
          array: false,
        });
      } else if (attr.type === "datetime") {
        await api("POST", `/databases/${DATABASE_ID}/collections/${COLLECTION_ID}/attributes/datetime`, {
          key: attr.key,
          required: attr.required || false,
          default: attr.default || null,
          array: false,
        });
      }

      console.log(`   ✅ "${attr.key}" added successfully.`);
      added++;
    } catch (err) {
      console.error(`   ❌ Failed to add "${attr.key}": ${err.message}`);
    }
  }

  console.log(`\n=== Migration Complete ===`);
  console.log(`   Added:   ${added}`);
  console.log(`   Skipped: ${skipped}`);

  if (added > 0) {
    console.log(`
⚠️  IMPORTANT: Appwrite attribute creation is ASYNCHRONOUS.
   The attributes may take a few seconds to become active.
   Wait ~30 seconds before testing the forgot-password flow.
`);
  }
}

run().catch((err) => {
  console.error("\n❌ Migration failed:", err.message);
  process.exit(1);
});
