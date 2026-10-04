"use strict";

const CHECKOUT_RECOVERY_STATES = Object.freeze({
  PAYMENT_PENDING: "payment_pending",
  PAYMENT_UNKNOWN: "payment_unknown",
  PAYMENT_FAILED: "payment_failed",
  PAYMENT_CANCELLED: "payment_cancelled",
  ORDER_SUCCEEDED: "order_succeeded",
  COD_ORDER_CREATED: "cod_order_created",
});

const ORDER_CONTENT_KEYS = new Set([
  "productId",
  "id",
  "$id",
  "quantity",
  "dealId",
]);

function stableValue(value) {
  if (Array.isArray(value)) {
    return value.map(stableValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, stableValue(value[key])]),
    );
  }
  return value;
}

function getOrderContentIdentity(item) {
  const identity = {};

  for (const [key, value] of Object.entries(item)) {
    if (
      ORDER_CONTENT_KEYS.has(key) ||
      /variant|color|size|option/i.test(key)
    ) {
      identity[key] = stableValue(value);
    }
  }

  identity.productId = item.productId || item.id || item.$id || "";
  identity.quantity = Number(item.quantity || 1);
  identity.dealId = item.dealId || null;
  return stableValue(identity);
}

function parseOrderItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items !== "string") return null;

  try {
    const parsed = JSON.parse(items);
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function sameOrderContents(requestItems, persistedItems) {
  const savedItems = parseOrderItems(persistedItems);
  if (!Array.isArray(requestItems) || !savedItems) return false;
  if (requestItems.length !== savedItems.length) return false;

  const identify = (items) =>
    items
      .map(getOrderContentIdentity)
      .map((item) => JSON.stringify(item))
      .sort();

  return identify(requestItems).every(
    (item, index) => item === identify(savedItems)[index],
  );
}

function getRecoveryState(order) {
  const paymentMethod = String(order.paymentMethod || "").toLowerCase();
  const paymentStatus = String(order.paymentStatus || "").toLowerCase();
  const orderStatus = String(
    order.orderStatus || order.status || "",
  ).toLowerCase();

  if (
    paymentMethod === "payment on delivery" ||
    paymentMethod === "cash on delivery" ||
    paymentMethod === "cash_on_delivery"
  ) {
    return CHECKOUT_RECOVERY_STATES.COD_ORDER_CREATED;
  }

  if (
    paymentStatus === "succeeded" ||
    ["succeeded", "complete", "completed", "delivered"].includes(orderStatus)
  ) {
    return CHECKOUT_RECOVERY_STATES.ORDER_SUCCEEDED;
  }

  if (
    paymentStatus === "failed" ||
    ["failed", "payment failed"].includes(orderStatus)
  ) {
    return CHECKOUT_RECOVERY_STATES.PAYMENT_FAILED;
  }

  if (
    ["cancelled", "canceled"].includes(paymentStatus) ||
    ["cancelled", "canceled"].includes(orderStatus)
  ) {
    return CHECKOUT_RECOVERY_STATES.PAYMENT_CANCELLED;
  }

  if (paymentStatus === "pending") {
    return CHECKOUT_RECOVERY_STATES.PAYMENT_PENDING;
  }

  return CHECKOUT_RECOVERY_STATES.PAYMENT_UNKNOWN;
}

module.exports = {
  CHECKOUT_RECOVERY_STATES,
  getRecoveryState,
  sameOrderContents,
};
