"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const appwriteServicePath = require.resolve("../services/appwriteService");
const environmentPath = require.resolve("../src/env");
const controllerPath = require.resolve("../controllers/UserControllers/vendorInfoController");

const mainVendor = {
  $id: "vendor-one",
  name: "Store owner",
  storeName: "One Store",
  email: "owner@example.com",
};
const storedVendor = {
  $id: "vendor-one",
  avatar: "https://images.example/avatar.jpg",
  profileImage: "https://images.example/profile.jpg",
  coverImage: "https://images.example/cover.jpg",
  bankAccount: "private",
};

require.cache[appwriteServicePath] = {
  id: appwriteServicePath,
  filename: appwriteServicePath,
  loaded: true,
  exports: {
    db: {
      async getDocument() {
        return storedVendor;
      },
    },
    instrumentedDb: {
      async getDocument() {
        return mainVendor;
      },
    },
  },
};

require.cache[environmentPath] = {
  id: environmentPath,
  filename: environmentPath,
  loaded: true,
  exports: {
    env: {
      MAIN_VENDORS_COLLECTION_ID: "main-vendors",
      APPWRITE_DATABASE_ID: "main-db",
      VENDOR_DATABASE_ID: "vendors-db",
      VENDOR_COLLECTION_ID: "vendors",
    },
  },
};

const { getPublicVendorInfo } = require(controllerPath);

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

test("includes uploaded vendor images when the main vendor record omits them", async () => {
  const response = makeResponse();

  await getPublicVendorInfo({ params: { vendorId: "vendor-one" } }, response);

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.vendor, {
    $id: "vendor-one",
    name: "Store owner",
    storeName: "One Store",
    email: "owner@example.com",
    avatar: "https://images.example/avatar.jpg",
    profileImage: "https://images.example/profile.jpg",
    coverImage: "https://images.example/cover.jpg",
  });
  assert.equal("bankAccount" in response.body.vendor, false);
});
