"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const { File } = require("node-fetch-native-with-agent");

const database = {
  async updateDocument(_databaseId, _collectionId, _vendorId, updates) {
    return { $id: "vendor-1", ...updates };
  },
};
const uploadedFiles = [];
const deletedFiles = [];
const storageClient = {
  async createFile(bucketId, fileId, file, permissions) {
    uploadedFiles.push({ bucketId, fileId, file, permissions });
    return { $id: fileId };
  },
  async deleteFile(bucketId, fileId) {
    deletedFiles.push({ bucketId, fileId });
  },
};
database.getDocument = async () => ({ avatarFileId: "previous-avatar" });

require.cache[require.resolve("../src/appwrite")] = {
  id: require.resolve("../src/appwrite"),
  filename: require.resolve("../src/appwrite"),
  loaded: true,
  exports: {
    db: database,
    storage: storageClient,
    ID: { unique: () => `file-${uploadedFiles.length + 1}` },
  },
};
require.cache[require.resolve("../src/env")] = {
  id: require.resolve("../src/env"),
  filename: require.resolve("../src/env"),
  loaded: true,
  exports: {
    env: {
      APPWRITE_ENDPOINT: "https://appwrite.example/v1",
      APPWRITE_PROJECT_ID: "project-1",
      APPWRITE_STORAGE_ID: "vendor-images",
      VENDOR_PROFILE_STORAGE_BUCKET_ID: "vendor-profile-images",
      VENDOR_DATABASE_ID: "database-1",
      VENDOR_COLLECTION_ID: "vendors",
    },
  },
};

const vendorController = require("../controllers/VendorControllers/vendorController");

function makeResponse() {
  return {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("profile and cover uploads use the configured Appwrite storage client and bucket", async () => {
  const file = {
    originalname: "business-image.jpeg",
    mimetype: "image/jpeg",
    size: 100,
    buffer: Buffer.from("image"),
  };
  const uploads = [
    {
      handler: vendorController.updateProfilePicture,
      imageField: "profileImage",
      bucketId: "vendor-profile-images",
    },
    {
      handler: vendorController.updateCoverPicture,
      imageField: "coverImage",
      bucketId: "vendor-images",
    },
  ];

  for (const { handler, imageField, bucketId } of uploads) {
    const response = makeResponse();
    await handler({ user: { userId: "vendor-1" }, file }, response);

    assert.equal(response.statusCode, 200);
    assert.equal(response.body.success, true);
    assert.equal(response.body.data.vendor[imageField], response.body.data.fileUrl);
    assert.ok(
      response.body.data.fileUrl.includes(`/storage/buckets/${bucketId}/files/`),
    );
    assert.match(
      response.body.data.fileUrl,
      /\/files\/file-\d+\/view\?project=project-1$/,
    );
  }

  assert.equal(uploadedFiles.length, 2);
  assert.deepEqual(
    uploadedFiles.map(({ bucketId }) => bucketId),
    ["vendor-profile-images", "vendor-images"],
  );
  assert.ok(uploadedFiles.every(({ file: uploadedFile }) => uploadedFile instanceof File));
  assert.ok(uploadedFiles.every(({ file: uploadedFile }) => uploadedFile.name === "business-image.jpeg"));
});

test("profile picture removal uses the configured Appwrite storage client and bucket", async () => {
  const response = makeResponse();
  await vendorController.removeProfilePicture(
    { user: { userId: "vendor-1" } },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.success, true);
  assert.deepEqual(deletedFiles, [
    { bucketId: "vendor-images", fileId: "previous-avatar" },
  ]);
});
