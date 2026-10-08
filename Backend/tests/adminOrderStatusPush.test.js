"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");
const path = require("node:path");

const controllerPath = path.resolve(
  __dirname,
  "../controllers/AdminControllers/admin.js",
);
const pushJobs = [];
const loggedErrors = [];
let queueError = null;

const stubs = {
  "../../services/appwriteService": {
    functions: {
      createExecution: async () => ({ $id: "execution-1" }),
    },
    instrumentedDb: {
      getDocument: async () => ({
        $id: "order-1",
        userId: "customer-1",
        orderNumber: "NF-1001",
        customerEmail: "customer@example.com",
      }),
    },
  },
  "../../utils/auditLogger": {
    logAuditFromRequest: async () => {},
  },
  "../../src/env": {
    env: { APPWRITE_DATABASE_ID: "database", APPWRITE_ORDERS_COLLECTION: "orders" },
  },
  "../../services/send-confirmation": {
    sendOrderStatusUpdateEmail: async () => {},
  },
  resend: {
    Resend: class Resend {},
  },
  "../../services/emailTheme": {
    sendBrandedEmail: async () => {},
  },
  "../../services/socketService": {},
  "../../utils/orderStatusRequest": {
    getRequestedOrderStatus: (body) => body?.orderStatus?.trim() || "",
  },
  "../../services/pushNotificationService": {
    enqueuePushNotification: async (payload) => {
      if (queueError) throw queueError;
      pushJobs.push(payload);
      return { id: "push-job-1" };
    },
  },
  "../../utils/logger": {
    info: () => {},
    warn: () => {},
    error: (message, metadata) => loggedErrors.push({ message, metadata }),
  },
};

const originalLoad = Module._load;
Module._load = function loadWithControllerStubs(request, parent, isMain) {
  if (parent?.filename === controllerPath && Object.hasOwn(stubs, request)) {
    return stubs[request];
  }
  return originalLoad.call(this, request, parent, isMain);
};

let controller;
try {
  delete require.cache[controllerPath];
  controller = require(controllerPath);
} finally {
  Module._load = originalLoad;
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

test("admin status changes queue a customer push with order details", async () => {
  pushJobs.length = 0;
  queueError = null;
  const response = createResponse();

  await controller.updateOrderStatus(
    {
      user: { userId: "admin-1" },
      body: { orderId: "order-1", orderStatus: "Processed" },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(pushJobs.length, 1);
  assert.deepEqual(pushJobs[0], {
    userId: "customer-1",
    title: "Order status updated",
    message: "Your order NF-1001 status is now Processed.",
    type: "order",
    data: {
      event: "order.status_updated",
      orderId: "order-1",
      orderStatus: "Processed",
      route: "/(Screens)/OrdersScreen",
    },
    idempotencyKey: "admin-order-status:order-1:Processed:execution-1",
  });
});

test("a push queue failure is logged without hiding the successful status update", async () => {
  queueError = new Error("queue unavailable");
  const response = createResponse();

  await controller.updateOrderStatus(
    {
      user: { userId: "admin-1" },
      body: { orderId: "order-1", orderStatus: "Shipped" },
    },
    response,
  );

  assert.equal(response.statusCode, 200);
  assert.equal(response.body.$id, "execution-1");
  assert.equal(loggedErrors.at(-1).metadata.error, "queue unavailable");
  queueError = null;
});
