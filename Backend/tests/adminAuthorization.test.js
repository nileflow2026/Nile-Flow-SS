"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const middlewarePath = path.resolve(__dirname, "../middleware/auth.js");
let adminProfile = { role: "admin" };
let lookupError = null;
let lookupCount = 0;
const originalLoad = Module._load;

Module._load = function loadWithAppwriteStubs(request, parent, isMain) {
  if (parent?.filename === middlewarePath) {
    if (request === "../services/appwriteService") {
      return {
        instrumentedDb: {
          getDocument: async () => {
            lookupCount += 1;
            if (lookupError) {
              throw lookupError;
            }
            return adminProfile;
          },
        },
      };
    }

    if (request === "../src/env") {
      return {
        env: {
          APPWRITE_DATABASE_ID: "database",
          APPWRITE_ADMIN_COLLECTION_ID: "admins",
        },
      };
    }
  }

  return originalLoad.call(this, request, parent, isMain);
};

let adminOnly;
try {
  delete require.cache[middlewarePath];
  ({ adminOnly } = require(middlewarePath));
} finally {
  Module._load = originalLoad;
}

function createResponse() {
  return {
    statusCode: null,
    body: null,
    status(statusCode) {
      this.statusCode = statusCode;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("adminOnly authorizes only users with an admin profile document", async () => {
  adminProfile = { role: "admin" };
  lookupError = null;
  lookupCount = 0;
  const res = createResponse();
  let nextCalled = false;

  await adminOnly(
    { user: { userId: "admin-1", role: "admin" } },
    res,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(nextCalled, true);
  assert.equal(lookupCount, 1);
});

test("adminOnly rejects a forged admin role without an admin profile", async () => {
  adminProfile = { role: "customer" };
  lookupError = null;
  const res = createResponse();
  let nextCalled = false;

  await adminOnly(
    { user: { userId: "customer-1", role: "admin" } },
    res,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});

test("adminOnly fails closed when Appwrite cannot verify admin membership", async () => {
  adminProfile = null;
  lookupError = Object.assign(new Error("not found"), { code: 404 });
  const res = createResponse();
  let nextCalled = false;

  await adminOnly(
    { user: { userId: "missing-admin", role: "admin" } },
    res,
    () => {
      nextCalled = true;
    },
  );

  assert.equal(nextCalled, false);
  assert.equal(res.statusCode, 403);
});
