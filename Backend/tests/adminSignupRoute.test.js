"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const routePath = path.resolve(__dirname, "../routes/authRoutes.js");
const originalLoad = Module._load;

Module._load = function loadWithAuthStubs(request, parent, isMain) {
  if (parent?.filename === routePath) {
    if (request === "../controllers/AdminControllers/authController") {
      return {
        signup: () => {},
        signin: () => {},
        handleRefreshToken: () => {},
        getCurrentUser: () => {},
        logout: () => {},
      };
    }

    if (request === "../middleware/authMiddleware") {
      return (_req, _res, next) => next();
    }
  }

  return originalLoad.call(this, request, parent, isMain);
};

let authRouter;
try {
  delete require.cache[routePath];
  authRouter = require(routePath);
} finally {
  Module._load = originalLoad;
}

test("admin auth router does not expose public admin signup", () => {
  const signupRoute = authRouter.stack.find(
    (layer) => layer.route?.path === "/signup/admin",
  );

  assert.equal(signupRoute, undefined);
});
