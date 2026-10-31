"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const routePath = path.resolve(__dirname, "../routes/userRoutes.js");
const authenticateToken = (_req, _res, next) => next();
const adminOnly = (_req, _res, next) => next();
const apiLimiter = (_req, _res, next) => next();
let preferenceCalls = 0;
let storedPreferences = {};
const originalLoad = Module._load;

Module._load = function loadWithRouteStubs(request, parent, isMain) {
  if (parent?.filename === routePath) {
    if (request === "../middleware/authMiddleware") {
      return authenticateToken;
    }
    if (request === "../middleware/auth") {
      return { adminOnly };
    }
    if (request === "../middleware/rate-limiter") {
      return { apiLimiter };
    }
    if (request === "../controllers/AdminControllers/userController") {
      return { getAdminProfile: () => {}, getUsers: () => {} };
    }
    if (request === "../controllers/AdminControllers/auditLoggerController") {
      return { getAuditLogs: () => {}, logAuditEntry: () => {} };
    }
    if (request === "../src/appwrite") {
      return {
        users: {
          getPrefs: async () => {
            preferenceCalls += 1;
            return storedPreferences;
          },
          updatePrefs: async (_userId, preferences) => {
            preferenceCalls += 1;
            storedPreferences = preferences;
            return preferences;
          },
        },
      };
    }
  }

  return originalLoad.call(this, request, parent, isMain);
};

let router;
try {
  delete require.cache[routePath];
  router = require(routePath);
} finally {
  Module._load = originalLoad;
}

function getRoute(method, routePathname) {
  const layer = router.stack.find(
    (candidate) =>
      candidate.route?.path === routePathname &&
      candidate.route.methods[method],
  );
  return layer?.route;
}

function createResponse() {
  return {
    statusCode: 200,
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

test("user listing requires authentication and verified admin authorization", () => {
  const route = getRoute("get", "/users");

  assert.ok(route);
  const handlers = route.stack.map((layer) => layer.handle);
  assert.ok(handlers.includes(apiLimiter));
  assert.ok(handlers.includes(authenticateToken));
  assert.ok(handlers.includes(adminOnly));
});

test("preference reads and writes reject cross-user targets before Appwrite access", async () => {
  preferenceCalls = 0;
  const paths = [
    ["get", "/users/:userId/preferences"],
    ["put", "/users/:userId/preferences"],
    ["patch", "/api/users/:userId/preferences"],
  ];

  for (const [method, pathname] of paths) {
    const route = getRoute(method, pathname);
    assert.ok(route, `${method.toUpperCase()} ${pathname} exists`);
    const handler = route.stack.at(-1).handle;
    const res = createResponse();

    await handler(
      {
        params: { userId: "another-user" },
        user: { userId: "signed-in-user" },
        body: { preferences: { theme: "dark" } },
      },
      res,
    );

    assert.equal(res.statusCode, 403);
  }

  assert.equal(preferenceCalls, 0);
});

test("preference endpoints reject attempts to change protected fields", async () => {
  preferenceCalls = 0;
  const putRoute = getRoute("put", "/users/:userId/preferences");
  const patchRoute = getRoute("patch", "/api/users/:userId/preferences");

  for (const route of [putRoute, patchRoute]) {
    const res = createResponse();

    await route.stack.at(-1).handle(
      {
        params: { userId: "signed-in-user" },
        user: { userId: "signed-in-user" },
        body: { preferences: { role: "admin" }, role: "admin" },
      },
      res,
    );

    assert.equal(res.statusCode, 400);
  }

  assert.equal(preferenceCalls, 0);
});

test("preference reads return only allowlisted display preferences", async () => {
  preferenceCalls = 0;
  storedPreferences = {
    theme: "dark",
    role: "admin",
    resetToken: "secret",
    pushToken: "secret",
  };
  const route = getRoute("get", "/users/:userId/preferences");
  const res = createResponse();

  await route.stack.at(-1).handle(
    {
      params: { userId: "signed-in-user" },
      user: { userId: "signed-in-user" },
    },
    res,
  );

  assert.equal(res.statusCode, 200);
  assert.equal(res.body.preferences.theme, "dark");
  assert.equal("role" in res.body.preferences, false);
  assert.equal("resetToken" in res.body.preferences, false);
  assert.equal("pushToken" in res.body.preferences, false);
});
