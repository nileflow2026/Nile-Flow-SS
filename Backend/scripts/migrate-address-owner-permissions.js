require("dotenv").config();

const {
  Client,
  Databases,
  Permission,
  Query,
  Role,
} = require("node-appwrite");

const databaseId = process.env.APPWRITE_DATABASE_ID;
const collectionId = process.env.APPWRITE_ADDRESS_COLLECTION_ID;
const endpoint = process.env.APPWRITE_ENDPOINT;
const projectId = process.env.APPWRITE_PROJECT_ID;
const apiKey = process.env.APPWRITE_API_KEY;
const dryRun = process.argv.includes("--dry-run");
const PAGE_SIZE = 100;

function resolveOwner(address) {
  const currentOwner =
    typeof address.user === "string" ? address.user.trim() : "";
  const legacyOwner =
    typeof address.userId === "string" ? address.userId.trim() : "";

  if (currentOwner && legacyOwner && currentOwner !== legacyOwner) {
    return { ownerId: null, reason: "conflicting_owner_fields" };
  }

  const ownerId = currentOwner || legacyOwner;
  return ownerId
    ? { ownerId, reason: null }
    : { ownerId: null, reason: "missing_owner" };
}

async function listAllAddresses(databases) {
  const documents = [];
  let offset = 0;

  while (true) {
    const response = await databases.listDocuments(databaseId, collectionId, [
      Query.limit(PAGE_SIZE),
      Query.offset(offset),
    ]);
    documents.push(...response.documents);
    if (documents.length >= response.total || response.documents.length === 0) {
      return documents;
    }
    offset += response.documents.length;
  }
}

async function main() {
  if (!databaseId || !collectionId || !endpoint || !projectId || !apiKey) {
    throw new Error("Missing Appwrite environment variables");
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);
  const databases = new Databases(client);
  const addresses = await listAllAddresses(databases);
  const report = [];

  for (const address of addresses) {
    const { ownerId, reason } = resolveOwner(address);
    const permissions = ownerId
      ? [
          Permission.read(Role.user(ownerId)),
          Permission.write(Role.user(ownerId)),
          Permission.update(Role.user(ownerId)),
          Permission.delete(Role.user(ownerId)),
        ]
      : [];

    if (!dryRun) {
      await databases.updateDocument(
        databaseId,
        collectionId,
        address.$id,
        undefined,
        permissions,
      );
    }

    report.push({
      addressId: address.$id,
      action: ownerId ? "owner_only" : "permissions_removed",
      reason,
    });
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        scanned: addresses.length,
        updated: dryRun ? 0 : addresses.length,
        records: report,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error("Address permission migration failed:", {
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
