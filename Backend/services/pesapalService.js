const axios = require("axios");
const { env } = require("../src/env");
const logger = require("../utils/logger");

let cachedToken = null;
let cachedTokenExpiresAt = 0;

function getBaseUrl() {
  return env.PESAPAL_ENVIRONMENT === "production"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";
}

async function getAccessToken() {
  if (cachedToken && cachedTokenExpiresAt > Date.now() + 30_000) {
    logger.debug("Pesapal token cache hit", {
      meta: { expiresInMs: cachedTokenExpiresAt - Date.now() },
    });
    return cachedToken;
  }

  const url = `${getBaseUrl()}/api/Auth/RequestToken`;
  const startedAt = Date.now();
  logger.info("Pesapal authentication request started", {
    meta: {
      url,
      environment: env.PESAPAL_ENVIRONMENT,
      hasConsumerKey: Boolean(env.PESAPAL_CONSUMER_KEY),
      hasConsumerSecret: Boolean(env.PESAPAL_CONSUMER_SECRET),
    },
  });

  let response;
  try {
    response = await axios.post(
      url,
      {
        consumer_key: env.PESAPAL_CONSUMER_KEY,
        consumer_secret: env.PESAPAL_CONSUMER_SECRET,
      },
      { headers: { Accept: "application/json", "Content-Type": "application/json" } },
    );
  } catch (error) {
    logger.error("Pesapal authentication request failed", {
      meta: {
        url,
        status: error.response?.status,
        code: error.code,
        message: error.message,
        response: error.response?.data,
        durationMs: Date.now() - startedAt,
        stack: error.stack,
      },
    });
    throw error;
  }

  logger.info("Pesapal authentication response received", {
    meta: {
      url,
      status: response.status,
      providerStatus: response.data?.status,
      hasToken: Boolean(response.data?.token),
      expiryDate: response.data?.expiryDate,
      providerMessage: response.data?.message,
      providerError: response.data?.error,
      durationMs: Date.now() - startedAt,
    },
  });

  if (!response.data?.token) {
    throw new Error(response.data?.message || "Pesapal authentication failed");
  }

  cachedToken = response.data.token;
  cachedTokenExpiresAt = response.data.expiryDate
    ? new Date(response.data.expiryDate).getTime()
    : Date.now() + 240_000;
  return cachedToken;
}

async function pesapalRequest(method, path, data) {
  const url = `${getBaseUrl()}${path}`;
  const startedAt = Date.now();
  logger.info("Pesapal API request started", {
    meta: {
      method,
      url,
      payload: method === "POST" ? {
        id: data?.id,
        currency: data?.currency,
        amount: data?.amount,
        notificationIdPresent: Boolean(data?.notification_id),
        callbackUrl: data?.callback_url,
        cancellationUrl: data?.cancellation_url,
        billingEmailPresent: Boolean(data?.billing_address?.email_address),
        billingPhonePresent: Boolean(data?.billing_address?.phone_number),
      } : undefined,
    },
  });

  try {
    const token = await getAccessToken();
    const response = await axios({
      method,
      url,
      data,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    });
    logger.info("Pesapal API response received", {
      meta: {
        method,
        url,
        status: response.status,
        providerStatus: response.data?.status,
        providerMessage: response.data?.message,
        providerError: response.data?.error,
        hasRedirectUrl: Boolean(response.data?.redirect_url),
        hasTrackingId: Boolean(response.data?.order_tracking_id),
        durationMs: Date.now() - startedAt,
      },
    });
    return response.data;
  } catch (error) {
    logger.error("Pesapal API request failed", {
      meta: {
        method,
        url,
        status: error.response?.status,
        code: error.code,
        message: error.message,
        response: error.response?.data,
        durationMs: Date.now() - startedAt,
        stack: error.stack,
      },
    });
    throw error;
  }
}

async function submitOrder(order, customerDetails = {}) {
  if (!order?.orderNumber || !order?.amount || !order?.currency) {
    throw new Error("Pesapal order is missing order number, amount, or currency");
  }
  if (!env.PESAPAL_NOTIFICATION_ID) {
    throw new Error("PESAPAL_NOTIFICATION_ID is not configured");
  }

  return pesapalRequest("POST", "/api/Transactions/SubmitOrderRequest", {
    id: order.orderNumber,
    currency: order.currency,
    amount: Number(order.amount),
    description: `Nile Flow order ${order.orderNumber}`.slice(0, 100),
    callback_url: `${env.FRONTEND_URL}/payment/success?orderId=${encodeURIComponent(order.$id)}`,
    cancellation_url: `${env.FRONTEND_URL}/payment/cancelled?orderId=${encodeURIComponent(order.$id)}`,
    notification_id: env.PESAPAL_NOTIFICATION_ID,
    billing_address: {
      email_address: order.customerEmail,
      phone_number: customerDetails.customerPhone || order.customerPhone,
      country_code: "KE",
      first_name: order.username,
      line_1: customerDetails.deliveryAddress || order.deliveryAddress,
    },
  });
}

async function getTransactionStatus(orderTrackingId) {
  return pesapalRequest(
    "GET",
    `/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
  );
}

module.exports = { submitOrder, getTransactionStatus };