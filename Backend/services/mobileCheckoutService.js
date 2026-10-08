"use strict";

const { Query } = require("node-appwrite");
const { db } = require("../src/appwrite");
const { env } = require("../src/env");
const AddressService = require("./AddressService");
const {
  CHECKOUT_RECOVERY_STATES,
  getRecoveryState,
  sameOrderContents,
} = require("./mobileCheckoutRules");

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class CheckoutRequestError extends Error {
  constructor(status, code, message) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function authenticatedUserId(user) {
  const id = user?.userId || user?.$id || user?.id;
  return Array.isArray(id) ? id[0] : id;
}

async function findOrderByAttempt(checkoutAttemptId) {
  const indexedResponse = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_ORDERS_COLLECTION,
    [
      Query.equal("checkoutAttemptKey", checkoutAttemptId),
      Query.limit(2),
    ],
  );

  if (indexedResponse.documents.length > 1) {
    throw new Error("Checkout attempt index returned duplicate orders.");
  }

  if (indexedResponse.documents[0]) {
    return indexedResponse.documents[0];
  }

  const legacyResponse = await db.listDocuments(
    env.APPWRITE_DATABASE_ID,
    env.APPWRITE_ORDERS_COLLECTION,
    [
      Query.equal("checkoutAttemptId", checkoutAttemptId),
      Query.limit(2),
    ],
  );

  if (legacyResponse.documents.length > 1) {
    throw new Error("Legacy checkout attempt lookup returned duplicate orders.");
  }

  return legacyResponse.documents[0] || null;
}

async function findOwnedOrderByAttempt(checkoutAttemptId, userId) {
  if (!checkoutAttemptId || !userId) return null;
  const order = await findOrderByAttempt(checkoutAttemptId);

  return order && order.userId === userId ? order : null;
}

function createDeliverySnapshot(address) {
  const fullName = String(address.fullName || "").trim();
  const streetAddress = String(address.address || "").trim();
  const phone = String(address.phone || "").trim();
  const digitCount = phone.replace(/\D/g, "").length;

  if (!fullName || !streetAddress || digitCount < 7 || digitCount > 15) {
    throw new CheckoutRequestError(
      400,
      "ADDRESS_INCOMPLETE",
      "Complete the saved address before placing this order.",
    );
  }

  const deliveryAddress = [
    address.address,
    address.city,
    address.state,
    address.zipCode,
    address.country,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .join(", ");

  return {
    deliveryAddressId: address.$id,
    deliveryRecipient: fullName,
    deliveryAddress,
    customerPhone: phone,
  };
}

function validateExistingOrder(order, { userId, deliveryAddressId, cart, currency }) {
  if (order.userId !== userId) {
    throw new CheckoutRequestError(
      404,
      "CHECKOUT_ATTEMPT_NOT_FOUND",
      "Checkout attempt not found.",
    );
  }

  if (
    order.deliveryAddressId !== deliveryAddressId ||
    (currency && order.currency !== currency) ||
    !sameOrderContents(cart, order.items)
  ) {
    throw new CheckoutRequestError(
      409,
      "CHECKOUT_ATTEMPT_CONFLICT",
      "This checkout attempt is already bound to different order details.",
    );
  }
}

async function prepareMobileCheckout(body, user) {
  if (!Object.prototype.hasOwnProperty.call(body || {}, "addressConfirmationVersion")) {
    return { versioned: false };
  }

  if (body.addressConfirmationVersion !== 1) {
    throw new CheckoutRequestError(
      400,
      "UNSUPPORTED_ADDRESS_CONFIRMATION_VERSION",
      "This checkout version is not supported.",
    );
  }

  const userId = authenticatedUserId(user);
  if (!userId) {
    throw new CheckoutRequestError(401, "UNAUTHENTICATED", "Sign in to checkout.");
  }

  const { checkoutAttemptId, deliveryAddressId, cart } = body;
  if (
    typeof checkoutAttemptId !== "string" ||
    !UUID_PATTERN.test(checkoutAttemptId) ||
    typeof deliveryAddressId !== "string" ||
    !deliveryAddressId.trim() ||
    !Array.isArray(cart) ||
    cart.length === 0
  ) {
    throw new CheckoutRequestError(
      400,
      "INVALID_CHECKOUT_REQUEST",
      "A valid checkout attempt, saved address, and cart are required.",
    );
  }

  const existingOrder = await findOrderByAttempt(checkoutAttemptId);
  if (existingOrder) {
    validateExistingOrder(existingOrder, {
      userId,
      deliveryAddressId,
      cart,
      currency: body.currency,
    });
    return {
      versioned: true,
      userId,
      checkoutAttemptId,
      existingOrder,
      recoveryState: getRecoveryState(existingOrder),
      orderFields: {
        checkoutAttemptId,
        checkoutAttemptKey: checkoutAttemptId,
        deliveryAddressId,
      },
    };
  }

  const address = await AddressService.getOwnedAddress(
    deliveryAddressId,
    userId,
  );
  if (!address) {
    throw new CheckoutRequestError(
      404,
      "DELIVERY_ADDRESS_NOT_FOUND",
      "The selected delivery address is no longer available. Choose an address you own.",
    );
  }

  const deliverySnapshot = createDeliverySnapshot(address);
  return {
    versioned: true,
    userId,
    checkoutAttemptId,
    deliverySnapshot,
    recoveryState: CHECKOUT_RECOVERY_STATES.PAYMENT_PENDING,
    orderFields: {
      checkoutAttemptId,
      checkoutAttemptKey: checkoutAttemptId,
      ...deliverySnapshot,
    },
  };
}

function checkoutSuccessResponse(order) {
  return {
    success: true,
    orderId: order.$id,
    orderNumber: order.orderNumber,
    paymentStatus: order.paymentStatus,
    recoveryState: getRecoveryState(order),
  };
}

module.exports = {
  CHECKOUT_RECOVERY_STATES,
  CheckoutRequestError,
  checkoutSuccessResponse,
  findOrderByAttempt,
  findOwnedOrderByAttempt,
  getRecoveryState,
  prepareMobileCheckout,
  sameOrderContents,
};
