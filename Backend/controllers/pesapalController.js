const OrderService = require("../orders/OrderService");
const OrderRepository = require("../orders/OrderRepository");
const { env } = require("../src/env");
const pesapalService = require("../services/pesapalService");

function configured() {
  return env.PESAPAL_CONSUMER_KEY && env.PESAPAL_CONSUMER_SECRET && env.PESAPAL_NOTIFICATION_ID;
}

async function updateOrder(orderId, updates, phase) {
  try {
    return await OrderRepository.update(orderId, updates);
  } catch (error) {
    console.error(`[Pesapal] ${phase} order update failed:`, {
      message: error.message,
      code: error.code,
      type: error.type,
      attributes: Object.keys(updates),
    });
    return null;
  }
}

async function initiate(req, res) {
  if (!configured()) {
    return res.status(503).json({ success: false, message: "Pesapal is not configured" });
  }

  let created;
  let phase = "request validation";
  try {
    const body = { ...req.body, userId: req.user.userId, paymentMethod: "Pesapal" };

    phase = "order creation";
    created = await OrderService.createCodOrder(body, req.user, {
      paymentMethod: "Pesapal",
      paymentStatus: "pending",
    });
    if (!created.success) return res.status(created.status || 400).json(created);

    phase = "order reload";
    const order = await OrderRepository.findById(created.orderId);
    if (!order) throw new Error("Created Pesapal order could not be reloaded");

    phase = "Pesapal order submission";
    const payment = await pesapalService.submitOrder(order);
    if (!payment?.redirect_url || !payment.order_tracking_id) {
      throw new Error(payment?.message || "Pesapal did not return a payment URL");
    }

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

    const pesapalError = error.response?.data?.error || error.response?.data;
    console.error("[Pesapal] Initiation failed:", {
      phase,
      message: error.message,
      code: error.code,
      type: error.type,
      response: pesapalError,
    });
    return res.status(502).json({
      success: false,
      message: "Unable to start Pesapal payment",
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
  await OrderRepository.update(order.$id, {
    paymentStatus,
    paymentReference: payment.confirmation_code || "",
    pesapalPaymentMethod: payment.payment_method || "",
    updatedAt: new Date().toISOString(),
    ...(completed ? { orderStatus: "Ordered", status: "Ordered" } : {}),
  });

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

module.exports = { initiate, status, ipn };