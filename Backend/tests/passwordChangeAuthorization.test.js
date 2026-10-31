"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const controllerPath = path.resolve(
  __dirname,
  "../controllers/AdminControllers/passwordController.js",
);
const originalLoad = Module._load;
const calls = [];
let currentPasswordValid = true;

class FakeClient {
  setEndpoint() {
    return this;
  }

  setProject() {
    return this;
  }
}

class FakeAccount {
  async createEmailPasswordSession(email, password) {
    calls.push(["verify", email, password]);
    if (!currentPasswordValid) {
      throw Object.assign(new Error("Invalid credentials"), { code: 401 });
    }
    return { $id: "verification-session", userId: "token-user" };
  }
}

Module._load = function loadWithPasswordStubs(request, parent, isMain) {
  if (parent?.filename === controllerPath) {
    if (request === "node-appwrite") {
      return { Client: FakeClient, Account: FakeAccount };
    }
    if (request === "../../services/appwriteService") {
      return {
        users: {
          get: async (userId) => {
            calls.push(["get", userId]);
            return { $id: userId, email: "customer@example.test" };
          },
          updatePassword: async (userId, password) => {
            calls.push(["update", userId, password]);
          },
          deleteSession: async (userId, sessionId) => {
            calls.push(["deleteSession", userId, sessionId]);
          },
        },
      };
    }
    if (request === "../../src/env") {
      return {
        env: {
          APPWRITE_ENDPOINT: "https://appwrite.example.test/v1",
          APPWRITE_PROJECT_ID: "test-project",
        },
      };
    }
  }

  return originalLoad.call(this, request, parent, isMain);
};

let changePassword;
try {
  delete require.cache[controllerPath];
  ({ changePassword } = require(controllerPath));
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

test("password change verifies the current password and uses the token subject", async () => {
  calls.length = 0;
  currentPasswordValid = true;
  const res = createResponse();

  await changePassword(
    {
      user: { userId: "token-user" },
      headers: { "x-appwrite-user-id": "attacker-selected-user" },
      body: {
        currentPassword: "old-password",
        newPassword: "new-password",
        confirmNewPassword: "new-password",
      },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.deepEqual(
    calls.find(([name]) => name === "update"),
    ["update", "token-user", "new-password"],
  );
  assert.ok(
    calls.some(
      ([name, email, password]) =>
        name === "verify" &&
        email === "customer@example.test" &&
        password === "old-password",
    ),
  );
  assert.ok(
    calls.some(
      ([name, userId, sessionId]) =>
        name === "deleteSession" &&
        userId === "token-user" &&
        sessionId === "verification-session",
    ),
  );
  assert.equal(
    calls.some((call) => call.includes("attacker-selected-user")),
    false,
  );
});

test("password change does not update the account when current password is wrong", async () => {
  calls.length = 0;
  currentPasswordValid = false;
  const res = createResponse();

  await changePassword(
    {
      user: { userId: "token-user" },
      body: {
        currentPassword: "wrong-password",
        newPassword: "new-password",
        confirmNewPassword: "new-password",
      },
    },
    res,
  );

  assert.equal(res.statusCode, 401);
  assert.equal(calls.some(([name]) => name === "update"), false);
});
