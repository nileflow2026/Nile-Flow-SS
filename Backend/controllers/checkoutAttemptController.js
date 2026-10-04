"use strict";

const { createHash } = require("node:crypto");
const {
  findOwnedOrderByAttempt,
  getRecoveryState,
} = require("../services/mobileCheckoutService");

function hashId(value) {
  return value
    ? createHash("sha256").update(String(value)).digest("hex").slice(0, 16)
    : undefined;
}

function parseItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items !== "string") {
    throw new Error("Stored checkout item snapshot is invalid.");
  }

  const parsed = JSON.parse(items);
  if (!Array.isArray(parsed)) {
    throw new Error("Stored checkout item snapshot is invalid.");
  }
  return parsed;
}

async function getCheckoutAttempt(req, res) {
  const userId = req.user?.userId || req.user?.$id || req.user?.id;
  const { checkoutAttemptId } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "Authentication is required.",
    });
  }

  try {
    const order = await findOwnedOrderByAttempt(checkoutAttemptId, userId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Checkout attempt not found.",
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        orderId: order.$id,
        items: parseItems(order.items),
        amount: order.amount,
        currency: order.currency,
        orderStatus: order.orderStatus || order.status,
        paymentMethod: order.paymentMethod,
        paymentStatus: order.paymentStatus,
        recoveryState: getRecoveryState(order),
        deliveryAddressId: order.deliveryAddressId,
        deliveryRecipient: order.deliveryRecipient,
        deliveryAddress: order.deliveryAddress,
        customerPhone: order.customerPhone,
      },
    });
  } catch (error) {
    console.error("Checkout attempt lookup failed", {
      operation: "checkout_attempt_lookup",
      errorCategory: String(
        error?.type || error?.code || error?.name || "unknown_error",
      ),
      userIdHash: hashId(userId),
      checkoutAttemptIdHash: hashId(checkoutAttemptId),
    });
    return res.status(500).json({
      success: false,
      message: "Unable to recover this checkout right now.",
    });
  }
}

module.exports = { getCheckoutAttempt };
