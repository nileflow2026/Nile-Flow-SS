const OrderService = require("../orders/OrderService");
const OrderRepository = require("../orders/OrderRepository");
const { env } = require("../src/env");
const pesapalService = require("../services/pesapalService");
const logger = require("../utils/logger");
const { createHash } = require("node:crypto");
const {
  CHECKOUT_RECOVERY_STATES,
  CheckoutRequestError,
  checkoutSuccessResponse,
  getRecoveryState,
  prepareMobileCheckout,
} = require("../services/mobileCheckoutService");

function errorDetails(error) {
  return {
    name: error?.name,
    message: error?.message,
    code: error?.code,
    type: error?.type,
    status: error?.status || error?.response?.status,
    stack: error?.stack,
    providerResponse: error?.response?.data?.error || error?.response?.data,
  };
}

function requestSummary(req) {
  const body = req.body || {};
  return {
    correlationId: req.correlationId,
    userId: req.user?.userId,
    cartItems: Array.isArray(body.cart) ? body.cart.length : 0,
    totalAmount: body.totalAmount,
    amount: body.amount,
    currency: body.currency,
    customerEmailPresent: Boolean(body.customerEmail),
    customerPhonePresent: Boolean(body.customerPhone),
    deliveryAddressPresent: Boolean(body.deliveryAddress),
    paymentMethod: body.paymentMethod,
  };
}

function traceRequestEntry(req, res, next) {
  const startedAt = Date.now();
  logger.info("Pesapal route entry", {
    meta: {
      correlationId: req.correlationId,
      method: req.method,
      path: req.originalUrl,
      contentLength: req.headers["content-length"],
      hasAuthorizationHeader: Boolean(req.headers.authorization),
      bodyKeys: Object.keys(req.body || {}),
    },
  });

  res.once("finish", () => {
    logger.info("Pesapal route finished", {
      meta: {
        correlationId: req.correlationId,
        method: req.method,
        path: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
      },
    });
  });
  next();
}

function configured() {
  return env.PESAPAL_CONSUMER_KEY && env.PESAPAL_CONSUMER_SECRET && env.PESAPAL_NOTIFICATION_ID;
}

async function updateOrder(orderId, updates, phase) {
  logger.debug("Pesapal order update started", {
    meta: { orderId, phase, attributes: Object.keys(updates) },
  });
  try {
    const result = await OrderRepository.update(orderId, updates);
    logger.debug("Pesapal order update completed", {
      meta: { orderId, phase, success: true },
    });
    return result;
  } catch (error) {
    logger.error(`[Pesapal] ${phase} order update failed`, {
      meta: { orderId, phase, attributes: Object.keys(updates), ...errorDetails(error) },
    });
    return null;
  }
}

function hashId(value) {
  return value
    ? createHash("sha256").update(String(value)).digest("hex").slice(0, 16)
    : undefined;
}

async function initiateVersioned(req, res) {
  const userId = req.user?.userId || req.user?.$id || req.user?.id;
  const checkoutAttemptId = req.body?.checkoutAttemptId;
  let orderId;
  let paymentStatus = "unknown";
  let phase = "checkout validation";

  try {
    const checkout = await prepareMobileCheckout(req.body, req.user);
    if (!checkout.versioned) {
      return res.status(400).json({
        success: false,
        message: "A confirmed checkout address is required.",
      });
    }

    let order = checkout.existingOrder;
    if (order) {
      orderId = order.$id;
      paymentStatus = order.paymentStatus || "unknown";
      if (
        checkout.recoveryState === CHECKOUT_RECOVERY_STATES.PAYMENT_PENDING ||
        checkout.recoveryState === CHECKOUT_RECOVERY_STATES.PAYMENT_UNKNOWN ||
        checkout.recoveryState === CHECKOUT_RECOVERY_STATES.ORDER_SUCCEEDED ||
        checkout.recoveryState === CHECKOUT_RECOVERY_STATES.COD_ORDER_CREATED
      ) {
        return res.status(200).json(checkoutSuccessResponse(order));
      }
    } else {
      phase = "order creation";
      const body = {
        ...req.body,
        userId: checkout.userId,
        paymentMethod: "Pesapal",
        deliveryAddress: checkout.deliverySnapshot.deliveryAddress,
        customerPhone: checkout.deliverySnapshot.customerPhone,
      };
      const created = await OrderService.createCodOrder(body, req.user, {
        paymentMethod: "Pesapal",
        paymentStatus: "unknown",
        checkoutAttemptId: checkout.checkoutAttemptId,
        orderFields: checkout.orderFields,
      });

      if (!created.success) {
        return res.status(created.status || 400).json(created);
      }
      orderId = created.orderId;
      order = await OrderRepository.findById(orderId);
      if (!order) throw new Error("Created Pesapal order could not be reloaded");

      if (created.alreadyExisting) {
        const recoveryState = getRecoveryState(order);
        if (
          recoveryState === CHECKOUT_RECOVERY_STATES.PAYMENT_PENDING ||
          recoveryState === CHECKOUT_RECOVERY_STATES.PAYMENT_UNKNOWN ||
          recoveryState === CHECKOUT_RECOVERY_STATES.ORDER_SUCCEEDED ||
          recoveryState === CHECKOUT_RECOVERY_STATES.COD_ORDER_CREATED
        ) {
          return res.status(200).json(checkoutSuccessResponse(order));
        }
      }
    }

    phase = "provider initiation";
    await OrderRepository.update(orderId, {
      paymentMethod: "Pesapal",
      paymentStatus: "unknown",
      orderStatus: "Pending Payment",
      status: "Pending",
      updatedAt: new Date().toISOString(),
    });
    order = await OrderRepository.findById(orderId);
    if (!order) throw new Error("Pesapal order could not be reloaded");

    const payment = await pesapalService.submitOrder(order, {
      customerPhone: req.body.customerPhone,
      deliveryAddress: order.deliveryAddress,
      callbackUrl: req.body.callbackUrl,
      cancellationUrl: req.body.cancellationUrl,
    });

    await updateOrder(
      orderId,
      {
        pesapalTrackingId: payment.order_tracking_id,
        pesapalMerchantReference:
          payment.merchant_reference || order.orderNumber,
        paymentStatus: "pending",
        updatedAt: new Date().toISOString(),
      },
      "versioned Pesapal reference",
    );
    paymentStatus = "pending";

    return res.status(201).json({
      success: true,
      orderId,
      orderNumber: order.orderNumber,
      redirectUrl: payment.redirect_url,
      paymentStatus,
      recoveryState: CHECKOUT_RECOVERY_STATES.PAYMENT_PENDING,
    });
  } catch (error) {
    if (orderId && paymentStatus !== "failed") {
      await updateOrder(
        orderId,
        {
          paymentStatus: "unknown",
          orderStatus: "Pending Payment",
          updatedAt: new Date().toISOString(),
        },
        "versioned Pesapal unknown state",
      );
      paymentStatus = "unknown";
    }

    logger.error("Versioned Pesapal initiation failed", {
      meta: {
        operation: "mobile_pesapal_checkout",
        phase,
        errorCategory: String(
          error?.code || error?.type || error?.name || "unknown_error",
        ),
        userIdHash: hashId(userId),
        checkoutAttemptIdHash: hashId(checkoutAttemptId),
        paymentStatus,
      },
    });

    const status = error instanceof CheckoutRequestError ? error.status : 502;
    return res.status(status).json({
      success: false,
      orderId,
      code: error.code || "PESAPAL_INITIATION_FAILED",
      recoveryState:
        orderId && paymentStatus === "unknown"
          ? CHECKOUT_RECOVERY_STATES.PAYMENT_UNKNOWN
          : undefined,
      message:
        error instanceof CheckoutRequestError
          ? error.message
          : "Unable to confirm Pesapal initiation. Check payment status before retrying.",
    });
  }
}

async function initiate(req, res) {
  if (!configured()) {
    logger.error("Pesapal initiation blocked: missing configuration", {
      meta: {
        correlationId: req.correlationId,
        hasConsumerKey: Boolean(env.PESAPAL_CONSUMER_KEY),
        hasConsumerSecret: Boolean(env.PESAPAL_CONSUMER_SECRET),
        hasNotificationId: Boolean(env.PESAPAL_NOTIFICATION_ID),
        environment: env.PESAPAL_ENVIRONMENT,
      },
    });
    return res.status(503).json({
      success: false,
      code: "PESAPAL_NOT_CONFIGURED",
      message: "Pesapal is not configured.",
    });
  }

  if (
    Object.prototype.hasOwnProperty.call(
      req.body || {},
      "addressConfirmationVersion",
    )
  ) {
    return initiateVersioned(req, res);
  }

  const startedAt = Date.now();
  logger.info("Pesapal initiation started", { meta: requestSummary(req) });

  let created;
  let phase = "request validation";
  try {
    const body = { ...req.body, userId: req.user.userId, paymentMethod: "Pesapal" };

    phase = "order creation";
    logger.info("Pesapal phase started", {
      meta: { correlationId: req.correlationId, phase, ...requestSummary(req) },
    });
    created = await OrderService.createCodOrder(body, req.user, {
      paymentMethod: "Pesapal",
      paymentStatus: "pending",
    });
    logger.info("Pesapal order creation result", {
      meta: { correlationId: req.correlationId, phase, created },
    });
    if (!created.success) return res.status(created.status || 400).json(created);

    phase = "order reload";
    logger.info("Pesapal phase started", {
      meta: { correlationId: req.correlationId, phase, orderId: created.orderId },
    });
    const order = await OrderRepository.findById(created.orderId);
    logger.info("Pesapal order reload result", {
      meta: {
        correlationId: req.correlationId,
        phase,
        orderId: created.orderId,
        found: Boolean(order),
        orderNumber: order?.orderNumber,
        amount: order?.amount,
        currency: order?.currency,
        hasEmail: Boolean(order?.customerEmail),
        hasPhone: Boolean(order?.customerPhone),
        hasAddress: Boolean(order?.deliveryAddress),
      },
    });
    if (!order) throw new Error("Created Pesapal order could not be reloaded");

    phase = "Pesapal order submission";
    logger.info("Pesapal phase started", {
      meta: {
        correlationId: req.correlationId,
        phase,
        orderId: order.$id,
        orderNumber: order.orderNumber,
        amount: order.amount,
        currency: order.currency,
        environment: env.PESAPAL_ENVIRONMENT,
      },
    });
    const payment = await pesapalService.submitOrder(order, {
      customerPhone: body.customerPhone,
      deliveryAddress: body.deliveryAddress,
      callbackUrl: body.callbackUrl,
      cancellationUrl: body.cancellationUrl,
    });
    logger.info("Pesapal order submission result", {
      meta: {
        correlationId: req.correlationId,
        phase,
        orderId: order.$id,
        hasRedirectUrl: Boolean(payment?.redirect_url),
        hasTrackingId: Boolean(payment?.order_tracking_id),
        merchantReference: payment?.merchant_reference,
        status: payment?.status,
        providerError: payment?.error,
        durationMs: Date.now() - startedAt,
      },
    });

    await updateOrder(created.orderId, {
      pesapalTrackingId: payment.order_tracking_id,
      pesapalMerchantReference: payment.merchant_reference || order.orderNumber,
      updatedAt: new Date().toISOString(),
    }, "Pesapal reference");

    return res.status(201).json({
      success: true,
      orderId: created.orderId,
      orderNumber: created.orderNumber,
      redirectUrl: payment.redirect_url,
    });
  } catch (error) {
    if (created?.orderId) {
      await updateOrder(created.orderId, {
        paymentStatus: "failed",
        orderStatus: "Failed",
        status: "Failed",
        failureReason: "Pesapal initiation failed",
        updatedAt: new Date().toISOString(),
      }, "failure status");
    }

    const pesapalError = error.providerResponse || error.response?.data?.error || error.response?.data;
    logger.error("[Pesapal] Initiation failed", {
      meta: {
        correlationId: req.correlationId,
        phase,
        orderId: created?.orderId,
        durationMs: Date.now() - startedAt,
        providerError: pesapalError,
        ...errorDetails(error),
      },
    });
    return res.status(502).json({
      success: false,
      message: error.providerResponse?.message || "Unable to start Pesapal payment",
      code: "PESAPAL_INITIATION_FAILED",
    });
  }
}

async function syncStatus(order, orderTrackingId) {
  if (!order || order.pesapalTrackingId !== orderTrackingId) {
    return { success: false, status: 404, message: "Payment not found" };
  }

  const payment = await pesapalService.getTransactionStatus(orderTrackingId);
  const statusCode = Number(payment?.status_code);
  const description = String(payment?.payment_status_description || "PENDING").toUpperCase();
  const completed = statusCode === 1 || description === "COMPLETED";
  const failed = statusCode === 2 || statusCode === 3 || ["FAILED", "REVERSED", "INVALID"].includes(description);

  if (completed && (Number(payment.amount) !== Number(order.amount) || payment.currency !== order.currency)) {
    return { success: false, status: 409, message: "Payment amount or currency could not be verified" };
  }

  const paymentStatus = completed ? "succeeded" : failed ? "failed" : "pending";
  const paymentMethod = payment.payment_method || payment.paymentMethod;
  const paymentReference = payment.confirmation_code || payment.confirmationCode;
  await OrderRepository.update(order.$id, {
    paymentStatus,
    ...(paymentReference ? { paymentReference } : {}),
    ...(paymentMethod ? { pesapalPaymentMethod: paymentMethod } : {}),
    updatedAt: new Date().toISOString(),
    ...(completed ? { orderStatus: "Ordered", status: "Ordered" } : {}),
  });

  if (
    completed &&
    order.paymentStatus !== "succeeded" &&
    env.PUSH_NOTIFICATIONS_V2_ENABLED === true &&
    (order.userId || order.users)
  ) {
    try {
      const NotificationService = require("../notifications/NotificationService");
      await NotificationService.orderConfirmed({
        ...order,
        paymentStatus: "succeeded",
        paymentMethod: paymentMethod || order.paymentMethod,
      });
    } catch (notificationError) {
      logger.error("Could not queue Pesapal order confirmation notification", {
        orderId: order.$id,
        error: notificationError.message,
      });
    }
  }

  return { success: true, paymentStatus, orderId: order.$id, orderNumber: order.orderNumber, payment };
}

async function status(req, res) {
  const order = await OrderRepository.findById(req.params.orderId);
  if (!order || order.userId !== req.user.userId) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }
  const result = await syncStatus(order, order.pesapalTrackingId);
  return res.status(result.status || 200).json(result);
}

async function cancel(req, res) {
  const order = await OrderRepository.findById(req.params.orderId);
  if (!order || order.userId !== req.user.userId) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (order.paymentMethod !== "Pesapal") {
    return res.status(409).json({ success: false, message: "Order is not a Pesapal payment" });
  }

  if (order.paymentStatus === "succeeded") {
    return res.status(409).json({ success: false, message: "A completed payment cannot be cancelled" });
  }

  await OrderRepository.update(order.$id, {
    status: "Failed",
    orderStatus: "cancelled",
    paymentStatus: "failed",
    failureReason: "Customer cancelled Pesapal payment",
    updatedAt: new Date().toISOString(),
  });

  logger.info("Pesapal payment cancelled", {
    meta: {
      correlationId: req.correlationId,
      orderId: order.$id,
      orderNumber: order.orderNumber,
      userId: req.user.userId,
    },
  });

  return res.json({
    success: true,
    orderId: order.$id,
    orderNumber: order.orderNumber,
    paymentStatus: "failed",
    orderStatus: "cancelled",
  });
}

async function ipn(req, res) {
  const payload = { ...(req.query || {}), ...(req.body || {}) };
  const order = await OrderRepository.findByOrderNumber(payload.OrderMerchantReference || payload.orderMerchantReference);
  const result = await syncStatus(order, payload.OrderTrackingId || payload.orderTrackingId);
  return res.status(200).json({
    orderNotificationType: payload.OrderNotificationType || payload.orderNotificationType || "IPNCHANGE",
    orderTrackingId: payload.OrderTrackingId || payload.orderTrackingId,
    orderMerchantReference: payload.OrderMerchantReference || payload.orderMerchantReference,
    status: result.success ? 200 : 500,
  });
}

module.exports = { initiate, status, cancel, ipn, traceRequestEntry };