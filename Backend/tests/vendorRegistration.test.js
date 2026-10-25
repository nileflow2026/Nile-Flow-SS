"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");

const vendorWrites = [];
let nextId = 0;

const database = {
  async listDocuments() {
    return { total: 0, documents: [] };
  },
  async createDocument(databaseId, collectionId, documentId, data) {
    if (collectionId === "vendors") {
      vendorWrites.push({ databaseId, collectionId, documentId, data });
    }
    return { $id: documentId, ...data };
  },
};

const authUsers = {
  async create(userId, email, _phone, _password, name) {
    return { $id: userId, email, name };
  },
  async updatePrefs() {},
  async delete() {},
};

function mockModule(request, exports) {
  const filename = require.resolve(request);
  require.cache[filename] = {
    id: filename,
    filename,
    loaded: true,
    exports,
  };
}

mockModule("../services/appwriteService", {
  db: database,
  users: authUsers,
});
mockModule("../src/env", {
  env: {
    RESEND_API_KEY: "test",
    JWT_REFRESH_EXPIRES_IN: "30d",
    VENDOR_DATABASE_ID: "vendor-database",
    VENDOR_COLLECTION_ID: "vendors",
    VENDOR_SESSIONS_COLLECTION_ID: "vendor-sessions",
  },
});
mockModule("../utils/tokenManager", {
  signAccessToken: () => "access-token",
  signRefreshToken: () => "refresh-token",
  verifyRefreshToken: () => ({}),
  verifyAccessToken: () => ({}),
  hashToken: (token) => `hash:${token}`,
  timeframeToMs: () => 30 * 24 * 60 * 60 * 1000,
});
mockModule("../services/vendorMailService", {
  sendVendorOnboardingEmails: async () => {},
});
mockModule("../services/emailTheme", {
  sendBrandedEmail: async () => {},
});
mockModule("resend", {
  Resend: class {
    constructor() {}
  },
});
mockModule("node-appwrite", {
  ID: { unique: () => `id-${++nextId}` },
  Query: { equal: (attribute, value) => ({ attribute, value }) },
});

const { registerVendor } = require("../controllers/VendorControllers/vendorauthController");

function makeRequest(body) {
  return {
    body,
    headers: { host: "localhost:3000", "user-agent": "test-agent" },
    protocol: "http",
    ip: "127.0.0.1",
    get: () => null,
  };
}

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
    cookie() {},
  };
}

function validVendorDetails(overrides = {}) {
  return {
    name: "Amina K",
    storeName: "Nile Crafts",
    email: "amina@example.com",
    password: "SafePass123!",
    confirmPassword: "SafePass123!",
    category: "Arts & Crafts",
    storeDescription: "Handmade goods from local makers.",
    location: "Juba",
    phone: "+211 912 345 678",
    deviceId: "device-1",
    ...overrides,
  };
}

test("stores all submitted vendor profile details and does not return the password", async () => {
  vendorWrites.length = 0;
  const response = makeResponse();

  await registerVendor(makeRequest(validVendorDetails()), response);

  assert.equal(response.statusCode, 201);
  assert.equal(vendorWrites.length, 1);
  assert.deepEqual(
    {
      name: vendorWrites[0].data.name,
      storeName: vendorWrites[0].data.storeName,
      email: vendorWrites[0].data.email,
      category: vendorWrites[0].data.category,
      storeDescription: vendorWrites[0].data.storeDescription,
      location: vendorWrites[0].data.location,
      phone: vendorWrites[0].data.phone,
    },
    {
      name: "Amina K",
      storeName: "Nile Crafts",
      email: "amina@example.com",
      category: "Arts & Crafts",
      storeDescription: "Handmade goods from local makers.",
      location: "Juba",
      phone: "+211 912 345 678",
    },
  );
  assert.equal(vendorWrites[0].data.password === "SafePass123!", false);
  assert.equal("password" in response.body.vendor, false);
  assert.equal(response.body.vendor.phone, "+211 912 345 678");
});

test("keeps phone optional and stores an empty value when none was submitted", async () => {
  vendorWrites.length = 0;
  const response = makeResponse();
  const details = validVendorDetails();
  delete details.phone;

  await registerVendor(makeRequest(details), response);

  assert.equal(response.statusCode, 201);
  assert.equal(vendorWrites[0].data.phone, "");
});

test("rejects registration without required business details", async () => {
  vendorWrites.length = 0;
  const response = makeResponse();

  await registerVendor(
    makeRequest(validVendorDetails({ storeDescription: "" })),
    response,
  );

  assert.equal(response.statusCode, 400);
  assert.equal(vendorWrites.length, 0);
});
