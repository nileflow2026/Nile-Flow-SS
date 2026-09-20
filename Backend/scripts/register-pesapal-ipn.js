require("dotenv").config();

const axios = require("axios");

const environment = process.env.PESAPAL_ENVIRONMENT || "sandbox";
const baseUrl = environment === "production"
  ? "https://pay.pesapal.com/v3"
  : "https://cybqa.pesapal.com/pesapalv3";

async function main() {
  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
  const backendUrl = process.env.BACKEND_URL;

  if (!consumerKey || !consumerSecret) {
    throw new Error("PESAPAL_CONSUMER_KEY and PESAPAL_CONSUMER_SECRET are required");
  }
  if (!backendUrl) {
    throw new Error("BACKEND_URL is required and must be publicly reachable over HTTPS");
  }
  if (!backendUrl.startsWith("https://")) {
    throw new Error("BACKEND_URL must use HTTPS for Pesapal IPN registration");
  }

  const ipnUrl = `${backendUrl.replace(/\/$/, "")}/api/payments/pesapal/ipn`;
  const tokenResponse = await axios.post(
    `${baseUrl}/api/Auth/RequestToken`,
    { consumer_key: consumerKey, consumer_secret: consumerSecret },
    { headers: { Accept: "application/json", "Content-Type": "application/json" } },
  );
  const token = tokenResponse.data?.token;
  if (!token) {
    throw new Error(tokenResponse.data?.message || "Pesapal authentication failed");
  }

  const response = await axios.post(
    `${baseUrl}/api/URLSetup/RegisterIPN`,
    { url: ipnUrl, ipn_notification_type: "POST" },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    },
  );

  const result = response.data;
  if (!result?.ipn_id) {
    throw new Error(`Pesapal did not return an IPN ID: ${JSON.stringify(result)}`);
  }

  console.log(JSON.stringify({
    environment,
    ipnUrl,
    ipnId: result.ipn_id,
    status: result.ipn_status_description || result.status,
    nextStep: "Set PESAPAL_NOTIFICATION_ID to ipnId and redeploy the backend",
  }, null, 2));
}

main().catch((error) => {
  console.error("Pesapal IPN registration failed:", {
    message: error.message,
    code: error.code,
    status: error.response?.status,
    response: error.response?.data,
    cause: error.cause?.message || error.cause,
    stack: error.stack,
  });
  process.exitCode = 1;
});
