"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { ORDER_EVENT_TYPE, ORDER_STATUS } = require("../orders/OrderTypes");
const { EVENT } = require("../notifications/NotificationTypes");
const { getOrderNotificationEvent } = require("../notifications/orderNotificationMapping");
const { render } = require("../notifications/NotificationTemplates");

test("maps each supported order status to its specific notification", () => {
  const cases = [
    [ORDER_STATUS.CONFIRMED, EVENT.ORDER_CONFIRMED],
    [ORDER_STATUS.PREPARING, EVENT.ORDER_PREPARING],
    [ORDER_STATUS.READY_FOR_DISPATCH, EVENT.ORDER_READY],
    [ORDER_STATUS.OUT_FOR_DELIVERY, EVENT.ORDER_OUT_FOR_DELIVERY],
    [ORDER_STATUS.DELIVERED, EVENT.ORDER_DELIVERED],
    [ORDER_STATUS.CANCELLED, EVENT.ORDER_CANCELLED],
  ];

  for (const [toStatus, expectedEvent] of cases) {
    assert.equal(
      getOrderNotificationEvent(ORDER_EVENT_TYPE.STATUS_CHANGED, {
        metadata: { toStatus },
      }),
      expectedEvent,
    );
  }
});

test("does not notify for completed or unknown order statuses", () => {
  assert.equal(
    getOrderNotificationEvent(ORDER_EVENT_TYPE.STATUS_CHANGED, {
      metadata: { toStatus: ORDER_STATUS.COMPLETED },
    }),
    undefined,
  );
  assert.equal(
    getOrderNotificationEvent(ORDER_EVENT_TYPE.STATUS_CHANGED, {
      metadata: { toStatus: "unknown" },
    }),
    undefined,
  );
});

test("maps cancellation decisions to their dedicated notification events", () => {
  assert.equal(
    getOrderNotificationEvent(ORDER_EVENT_TYPE.CANCELLATION_REQUESTED),
    EVENT.ORDER_CANCELLATION_REQUESTED,
  );
  assert.equal(
    getOrderNotificationEvent(ORDER_EVENT_TYPE.CANCELLATION_APPROVED),
    EVENT.ORDER_CANCELLATION_APPROVED,
  );
  assert.equal(
    getOrderNotificationEvent(ORDER_EVENT_TYPE.CANCELLATION_REJECTED),
    EVENT.ORDER_CANCELLATION_REJECTED,
  );
});

test("escapes order identifiers in new status email templates", () => {
  const rendered = render(EVENT.ORDER_CONFIRMED, {
    orderNumber: "<script>alert(1)</script>",
  });

  assert.equal(rendered.emailHtml.includes("<script>"), false);
  assert.equal(rendered.emailHtml.includes("&lt;script&gt;"), true);
});

test("in app order messages show the human readable order number", () => {
  const rendered = render(EVENT.ORDER_CONFIRMED, {
    orderId: "appwrite-document-id",
    orderNumber: "NF-2026-0001",
  });

  assert.match(rendered.inApp, /NF-2026-0001/);
  assert.doesNotMatch(rendered.inApp, /appwrite-document-id/);
});

test("in app order messages do not expose the Appwrite ID when no order number exists", () => {
  const rendered = render(EVENT.ORDER_CONFIRMED, {
    orderId: "appwrite-document-id",
  });

  assert.match(rendered.inApp, /Your order/);
  assert.doesNotMatch(rendered.inApp, /appwrite-document-id/);
});
