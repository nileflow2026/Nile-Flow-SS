"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const authenticateToken = (_req, _res, next) => next();
const adminOnly = (_req, _res, next) => next();
const middleware = (_req, _res, next) => next();
const handler = () => {};
const controllerProxy = new Proxy(
  {},
  {
    get: () => handler,
  },
);

function loadRouter(relativePath, stubs) {
  const resolvedPath = path.resolve(__dirname, "..", relativePath);
  const originalLoad = Module._load;

  Module._load = function loadWithRouteStubs(request, parent, isMain) {
    if (
      parent?.filename === resolvedPath &&
      Object.prototype.hasOwnProperty.call(stubs, request)
    ) {
      return stubs[request];
    }

    return originalLoad.call(this, request, parent, isMain);
  };

  try {
    delete require.cache[resolvedPath];
    return require(resolvedPath);
  } finally {
    Module._load = originalLoad;
  }
}

function findRoute(router, method, routePathname) {
  return router.stack.find(
    (layer) =>
      layer.route?.path === routePathname &&
      layer.route.methods[method],
  )?.route;
}

function assertHasGuards(route, guards) {
  assert.ok(route);
  const handlers = route.stack.map((layer) => layer.handle);
  let lastIndex = -1;

  for (const guard of guards) {
    const index = handlers.indexOf(guard);
    assert.ok(index > lastIndex, "guards must run in the required order");
    lastIndex = index;
  }
}

test("admin customer and vendor management routes require admin authorization", () => {
  const customerRoutes = loadRouter("routes/Vendorroutes/customerRoutes.js", {
    "../../middleware/authMiddleware": authenticateToken,
    "../../middleware/auth": { adminOnly },
    "../../controllers/VendorControllers/customerController": controllerProxy,
  });
  const customerAuthIndex = customerRoutes.stack.findIndex(
    (layer) => layer.handle === authenticateToken,
  );
  const customerAdminIndex = customerRoutes.stack.findIndex(
    (layer) => layer.handle === adminOnly,
  );
  const firstCustomerRouteIndex = customerRoutes.stack.findIndex(
    (layer) => layer.route,
  );

  assert.ok(customerAuthIndex >= 0);
  assert.ok(customerAdminIndex > customerAuthIndex);
  assert.ok(firstCustomerRouteIndex > customerAdminIndex);

  const vendorRoutes = loadRouter("routes/vendorAdminRoutes.js", {
    "../controllers/AdminControllers/vendorAdminController": controllerProxy,
    "../middleware/authMiddleware": authenticateToken,
    "../middleware/auth": { adminOnly },
  });

  for (const [method, pathname] of [
    ["get", "/"],
    ["get", "/stats"],
    ["get", "/:vendorId"],
    ["patch", "/:vendorId/status"],
  ]) {
    assertHasGuards(findRoute(vendorRoutes, method, pathname), [
      authenticateToken,
      adminOnly,
    ]);
  }
});

test("vendor password reset requires admin authorization", () => {
  const vendorAuthRoutes = loadRouter(
    "routes/Vendorroutes/vendorauth.js",
    {
      "../../controllers/VendorControllers/vendorauthController":
        controllerProxy,
      "../../middleware/authMiddleware": authenticateToken,
      "../../middleware/auth": { adminOnly },
      "../../utils/Vendor/validationSchemas": {},
      "../../middleware/Vendormiddleware/validation": {},
    },
  );

  assertHasGuards(
    findRoute(vendorAuthRoutes, "post", "/reset-vendor-password"),
    [authenticateToken, adminOnly],
  );
});

test("password change and AI chat require authentication", () => {
  const passwordRoutes = loadRouter("routes/passwordRoute.js", {
    "../middleware/authMiddleware": authenticateToken,
    "../controllers/AdminControllers/passwordController": controllerProxy,
  });
  assertHasGuards(
    findRoute(passwordRoutes, "post", "/user/password/change"),
    [authenticateToken],
  );

  const aiRoutes = loadRouter("routes/aiChatRoutes.js", {
    "../controllers/aiChatController": controllerProxy,
    "../middleware/authMiddleware": authenticateToken,
    "../middleware/rate-limiter": { apiLimiter: middleware },
  });
  assertHasGuards(findRoute(aiRoutes, "post", "/chat"), [
    authenticateToken,
    middleware,
  ]);
});

test("recent-search writes and reads require authentication", () => {
  const clientRoutes = loadRouter("routes/ClientRoutes.js", {
    "../middleware/authMiddleware": authenticateToken,
    "../middleware/currencyMiddleware": { currencyMiddleware: middleware },
    "../controllers/UserControllers/ClientController": controllerProxy,
    "../controllers/UserControllers/vendorInfoController": controllerProxy,
    "../controllers/UserControllers/businessDirectoryController": controllerProxy,
    "../middleware/rate-limiter": { apiLimiter: middleware },
    "../controllers/UserControllers/orderController": controllerProxy,
  });

  assertHasGuards(
    findRoute(clientRoutes, "post", "/customer-searches"),
    [authenticateToken],
  );
  assertHasGuards(
    findRoute(clientRoutes, "get", "/customer-recent-search"),
    [authenticateToken],
  );
});
