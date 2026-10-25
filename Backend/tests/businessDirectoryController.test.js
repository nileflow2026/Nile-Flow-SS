"use strict";

const assert = require("node:assert/strict");
const test = require("node:test");
const {
  createBusinessDirectoryController,
  parseDirectoryQuery,
  sanitizePublicBusiness,
} = require("../controllers/UserControllers/businessDirectoryController");

const fakeQuery = {
  equal: (field, value) => ({ type: "equal", field, value }),
  orderDesc: (field) => ({ type: "orderDesc", field }),
  limit: (value) => ({ type: "limit", value }),
  offset: (value) => ({ type: "offset", value }),
  select: (fields) => ({ type: "select", fields }),
};

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

function makeController(documents) {
  const database = {
    async listDocuments(_databaseId, _collectionId, queries) {
      const activeOnly = queries.some(
        (query) => query.type === "equal" && query.field === "isActive" && query.value === true,
      );
      const categoryQuery = queries.find(
        (query) => query.type === "equal" && query.field === "category",
      );
      const allActive = documents.filter((document) => !activeOnly || document.isActive === true);
      const matching = categoryQuery
        ? allActive.filter((document) => document.category === categoryQuery.value)
        : allActive;
      const limit = queries.find((query) => query.type === "limit")?.value || matching.length;
      const offset = queries.find((query) => query.type === "offset")?.value || 0;
      return {
        documents: matching.slice(offset, offset + limit),
        total: matching.length,
      };
    },
    async getDocument(_databaseId, _collectionId, id) {
      const document = documents.find((item) => item.$id === id);
      if (!document) {
        const error = new Error("Not found");
        error.code = 404;
        throw error;
      }
      return document;
    },
  };

  return createBusinessDirectoryController({
    database,
    configuration: { VENDOR_DATABASE_ID: "vendors-db", VENDOR_COLLECTION_ID: "vendors" },
    queryBuilder: fakeQuery,
    log: { error() {} },
  });
}

const vendorDocuments = [
  {
    $id: "vendor-one",
    $createdAt: "2026-10-20T10:00:00.000Z",
    name: "One Owner",
    storeName: "One Store",
    storeDescription: "A real public store description.",
    category: "Food & Groceries",
    location: "Juba",
    city: "Juba",
    country: "South Sudan",
    coverImage: "https://images.example/cover.jpg",
    profileImage: "https://images.example/profile.jpg",
    isActive: true,
    email: "private@example.com",
    phone: "+2110000000",
    address: "Private street address",
    password: "not-public",
    bankAccount: "not-public",
  },
  {
    $id: "vendor-two",
    $createdAt: "2026-10-19T10:00:00.000Z",
    name: "Two Owner",
    storeName: "Two Store",
    category: "Fashion & Clothing",
    isActive: true,
  },
  {
    $id: "inactive-vendor",
    storeName: "Inactive Store",
    category: "Fashion & Clothing",
    isActive: false,
  },
];

test("parses paging defaults, caps the limit, and rejects invalid query values", () => {
  assert.deepEqual(parseDirectoryQuery({}), { page: 1, limit: 24, category: null });
  assert.deepEqual(parseDirectoryQuery({ page: "2", limit: "500" }), {
    page: 2,
    limit: 100,
    category: null,
  });
  assert.deepEqual(parseDirectoryQuery({ category: "  Fashion & Clothing " }), {
    page: 1,
    limit: 24,
    category: "Fashion & Clothing",
  });
  assert.equal(parseDirectoryQuery({ page: "0" }), null);
  assert.equal(parseDirectoryQuery({ limit: "2.5" }), null);
  assert.equal(parseDirectoryQuery({ category: ["Food"] }), null);
});

test("sanitizes vendor documents to public business fields only", () => {
  const business = sanitizePublicBusiness(vendorDocuments[0]);

  assert.deepEqual(business, {
    id: "vendor-one",
    name: "One Owner",
    storeName: "One Store",
    storeDescription: "A real public store description.",
    category: "Food & Groceries",
    location: "Juba",
    city: "Juba",
    country: "South Sudan",
    coverImage: "https://images.example/cover.jpg",
    profileImage: "https://images.example/profile.jpg",
    createdAt: "2026-10-20T10:00:00.000Z",
  });
  assert.equal("email" in business, false);
  assert.equal("phone" in business, false);
  assert.equal("address" in business, false);
  assert.equal("password" in business, false);
  assert.equal("bankAccount" in business, false);
});

test("lists only active vendors, orders categories, and applies pagination and category filters", async () => {
  const controller = makeController(vendorDocuments);
  const response = makeResponse();

  await controller.listBusinesses(
    { query: { page: "1", limit: "1", category: "Food & Groceries" } },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.body.data.businesses.map((business) => business.id), ["vendor-one"]);
  assert.deepEqual(response.body.data.categories, ["Fashion & Clothing", "Food & Groceries"]);
  assert.deepEqual(response.body.data.pagination, {
    page: 1,
    limit: 1,
    total: 1,
    totalPages: 1,
  });
  assert.equal("email" in response.body.data.businesses[0], false);
});

test("rejects malformed query values without reading vendor documents", async () => {
  const controller = createBusinessDirectoryController({
    database: {
      async listDocuments() {
        assert.fail("invalid input must not query Appwrite");
      },
    },
    configuration: { VENDOR_DATABASE_ID: "vendors-db", VENDOR_COLLECTION_ID: "vendors" },
    queryBuilder: fakeQuery,
    log: { error() {} },
  });
  const response = makeResponse();

  await controller.listBusinesses({ query: { page: "NaN" } }, response);

  assert.equal(response.statusCode, 400);
  assert.equal(response.body.success, false);
});

test("returns active profile data and hides inactive or missing profiles", async () => {
  const controller = makeController(vendorDocuments);
  const activeResponse = makeResponse();
  await controller.getBusiness({ params: { businessId: "vendor-one" } }, activeResponse);
  assert.equal(activeResponse.statusCode, 200);
  assert.equal(activeResponse.body.data.business.id, "vendor-one");
  assert.equal("email" in activeResponse.body.data.business, false);

  const inactiveResponse = makeResponse();
  await controller.getBusiness({ params: { businessId: "inactive-vendor" } }, inactiveResponse);
  assert.equal(inactiveResponse.statusCode, 404);

  const missingResponse = makeResponse();
  await controller.getBusiness({ params: { businessId: "missing-vendor" } }, missingResponse);
  assert.equal(missingResponse.statusCode, 404);
});
