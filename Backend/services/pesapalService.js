const axios = require("axios");
const { env } = require("../src/env");

let cachedToken = null;
let cachedTokenExpiresAt = 0;

function getBaseUrl() {
  return env.PESAPAL_ENVIRONMENT === "production"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";
}

async function getAccessToken() {
  if (cachedToken && cachedTokenExpiresAt > Date.now() + 30_000) {
    return cachedToken;
  }

  const response = await axios.post(
    `${getBaseUrl()}/api/Auth/RequestToken`,
    {
      consumer_key: env.PESAPAL_CONSUMER_KEY,
      consumer_secret: env.PESAPAL_CONSUMER_SECRET,
    },
    { headers: { Accept: "application/json", "Content-Type": "application/json" } },
  );

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
  const token = await getAccessToken();
  const response = await axios({
    method,
    url: `${getBaseUrl()}${path}`,
    data,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
  });
  return response.data;
}

async function submitOrder(order) {
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
      phone_number: order.customerPhone,
      country_code: "KE",
      first_name: order.username,
      line_1: order.deliveryAddress,
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