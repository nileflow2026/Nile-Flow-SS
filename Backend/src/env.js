const path = require("path");
const dotenv = require("dotenv");
const Joi = require("joi");

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

const schema = Joi.object({
  NODE_ENV: Joi.string()
    .valid("development", "production", "test")
    .default("development"),
  PORT: Joi.number().default(3000),
  APPWRITE_ENDPOINT: Joi.string().uri().required(),
  APPWRITE_PROJECT_ID: Joi.string().required(),
  APPWRITE_API_KEY: Joi.string().required(),
  APPWRITE_STORAGE_ID: Joi.string().optional(),
  APPWRITE_DATABASE_ID: Joi.string().required(),
  APPWRITE_USER_COLLECTION_ID: Joi.string().required(),
  APPWRITE_ORDERS_COLLECTION: Joi.string().required(),
  APPWRITE_NOTIFICATIONS_COLLECTION_ID: Joi.string().required(),
  APPWRITE_CART_COLLECTION_ID: Joi.string().required(),
  APPWRITE_CANCELLED_ORDERS_COLLECTION_ID: Joi.string().optional(),
  APPWRITE_CANCELLATION_REQUESTS_COLLECTION_ID: Joi.string().optional(),
  // Platform Settings & Commission System
  APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID: Joi.string().required(),
  APPWRITE_FINANCIAL_REPORTS_COLLECTION_ID: Joi.string()
    .optional()
    .default("6971de010027c73e75a9"),
  APPWRITE_AUDIT_LOGS_COLLECTION_ID: Joi.string().optional(),
  APPWRITE_PROMOTION_BUCKET: Joi.string().optional(),
  // Banner Collection
  BANNER_COLLECTION_ID: Joi.string().optional(),
  // Banner Storage Bucket
  BANNER_STORAGE_BUCKET_ID: Joi.string().optional(),
  TEAM_MEMBERS_COLLECTION_ID: Joi.string().optional(),
  TEAM_MEMBERS_STORAGE_BUCKET_ID: Joi.string().optional(),
  // Subscriptions Collection
  APPWRITE_SUBSCRIPTIONS_COLLECTION_ID: Joi.string().optional(),
  // Products Collection
  APPWRITE_PRODUCT_COLLECTION_ID: Joi.string().optional(),
  // Categories Collection
  APPWRITE_CATEGORIES_COLLECTION_ID: Joi.string().optional(),
  // Deals Collection
  APPWRITE_DEALS_COLLECTION_ID: Joi.string().required(),
  // African Facts & Proverbs Collections
  AFRICAN_FACTS_COLLECTION_ID: Joi.string().optional(),
  AFRICAN_PROVERBS_COLLECTION_ID: Joi.string().optional(),
  // Recommendation System Collections
  EXPLORATION_PATTERNS_COLLECTION_ID: Joi.string().optional(),
  USER_SESSIONS_COLLECTION_ID: Joi.string().optional(),
  RECOMMENDATION_FEEDBACK_COLLECTION_ID: Joi.string().optional(),
  CONTEXT_PROFILES_COLLECTION_ID: Joi.string().optional(),
  RECOMMENDATION_WEIGHTS_COLLECTION_ID: Joi.string().optional(),
  ITEM_SOCIAL_SIGNALS_COLLECTION_ID: Joi.string().optional(),
  BUSINESS_METRICS_COLLECTION_ID: Joi.string().optional(),
  // Social Commerce Collections
  SOCIAL_POSTS_COLLECTION_ID: Joi.string().optional(),
  SOCIAL_LIKES_COLLECTION_ID: Joi.string().optional(),
  SOCIAL_COMMENTS_COLLECTION_ID: Joi.string().optional(),
  SOCIAL_SHARES_COLLECTION_ID: Joi.string().optional(),
  SOCIAL_FOLLOWS_COLLECTION_ID: Joi.string().optional(),
  // Group Buy System Collections
  APPWRITE_GROUP_ORDER_COLLECTION_ID: Joi.string().optional(),
  APPWRITE_PRICING_TIERS_COLLECTION_ID: Joi.string().optional(),
  APPWRITE_GROUP_BUY_SETTINGS_COLLECTION_ID: Joi.string().optional(),
  // Refresh tokens collection used by auth controllers
  APPWRITE_REFRESH_TOKEN_COLLECTION_ID: Joi.string().required(),
  // Account & Data Deletion System
  APPWRITE_DELETION_REQUESTS_COLLECTION_ID: Joi.string().optional(),
  DELETION_GRACE_PERIOD_DAYS: Joi.number().integer().min(1).max(30).default(7),
  // Vendor Payout System Collections
  APPWRITE_VENDOR_PAYOUT_BATCHES_COLLECTION_ID: Joi.string().optional(),
  APPWRITE_VENDOR_PAYOUTS_COLLECTION_ID: Joi.string().optional(),
  APPWRITE_PAYOUT_AUDIT_LOGS_COLLECTION_ID: Joi.string().optional(),
  // Frontend URL used for OAuth final redirect
  FRONTEND_URL: Joi.string().uri().default("http://localhost:5173"),
  // Website2 public origin used by deal sharing preview pages
  WEBSITE2_URL: Joi.string().uri({ scheme: ["http", "https"] }).required(),
  // Google OAuth
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_REDIRECT_URI: Joi.string().uri().optional(),

  // Google Generative AI
  GOOGLE_GENERATIVE_AI_API_KEY: Joi.string().optional(),
  // Google Cloud Translation API
  GOOGLE_CLOUD_TRANSLATION_API_KEY: Joi.string().optional(),
  // Facebook OAuth
  FACEBOOK_APP_ID: Joi.string().optional(),
  FACEBOOK_APP_SECRET: Joi.string().optional(),
  FACEBOOK_REDIRECT_URI: Joi.string().uri().optional(),
  // M-Pesa Daraja API
  MPESA_CONSUMER_KEY: Joi.string().optional(),
  MPESA_CONSUMER_SECRET: Joi.string().optional(),
  MPESA_SHORTCODE: Joi.string().optional(),
  MPESA_PASSKEY: Joi.string().optional(),
  MPESA_ENVIRONMENT: Joi.string()
    .valid("sandbox", "production")
    .default("sandbox"),
  MPESA_CALLBACK_URL: Joi.string().uri().optional(),
  BACKEND_URL: Joi.string().uri().optional(),
  INDEXNOW_KEY: Joi.string().pattern(/^[A-Za-z0-9-]{8,128}$/).optional(),
  INDEXNOW_SITE_URL: Joi.string().uri().optional(),
  // PayPal API
  PAYPAL_CLIENT_ID: Joi.string().optional(),
  PAYPAL_CLIENT_SECRET: Joi.string().optional(),
  PAYPAL_MODE: Joi.string().valid("sandbox", "production").default("sandbox"),
  // Stripe API
  STRIPE_SECRET_KEY: Joi.string().optional(),
  STRIPE_WEBHOOK_SECRET: Joi.string().optional(),
  // Pesapal API 3.0
  PESAPAL_CONSUMER_KEY: Joi.string().optional(),
  PESAPAL_CONSUMER_SECRET: Joi.string().optional(),
  PESAPAL_NOTIFICATION_ID: Joi.string()
    .guid({ version: "uuidv4" })
    .allow("")
    .optional(),
  PESAPAL_ENVIRONMENT: Joi.string().valid("sandbox", "production").default("sandbox"),
  APPWRITE_PESAPAL_CHECKOUT_COLLECTION_ID: Joi.string()
    .default("pesapal_checkout_sessions"),
  // OpenAI API
  OPENAI_API_KEY: Joi.string().optional(),
  // Exchange Rate API (optional — free tier works without key)
  EXCHANGE_RATE_API_KEY: Joi.string().optional(),
  // WhatsApp Business Cloud API (order notifications — optional, skipped when unset)
  WHATSAPP_API_URL: Joi.string().uri().allow("").optional(),
  WHATSAPP_PHONE_NUMBER_ID: Joi.string().allow("").optional(),
  WHATSAPP_ACCESS_TOKEN: Joi.string().allow("").optional(),
  // Notification delivery-log audit trail collection
  APPWRITE_NOTIFICATION_LOGS_COLLECTION_ID: Joi.string().optional(),
  APPWRITE_NOTIFICATION_WEBHOOKS_COLLECTION_ID: Joi.string().optional(),
  APPWRITE_PUSH_BROADCASTS_COLLECTION_ID: Joi.string().optional(),
  APPWRITE_PUSH_BROADCAST_DELIVERIES_COLLECTION_ID: Joi.string().optional(),
  APPWRITE_PUSH_EVENT_RECEIPTS_COLLECTION_ID: Joi.string().optional(),
  PUSH_NOTIFICATIONS_V2_ENABLED: Joi.boolean().default(false),
  REDIS_URL: Joi.string().uri().optional(),
  // Generic idempotency store (used to dedupe notifications and other retried operations)
  APPWRITE_IDEMPOTENCY_COLLECTION: Joi.string().allow("").optional(),
  // Admin/vendor recipient resolution for the centralized notification system
  APPWRITE_ADMIN_COLLECTION_ID: Joi.string().optional(),
  VENDOR_DATABASE_ID: Joi.string().optional(),
  VENDOR_COLLECTION_ID: Joi.string().optional(),
}).unknown();

const { error, value: env } = schema.validate(process.env, {
  stripUnknown: true,
});

if (error) {
  const missing = error.details.map((d) => d.message).join(", ");
  throw Object.assign(new Error(`Environment validation failed: ${missing}`), {
    details: error.details,
  });
}

try {
  const website2Url = new URL(env.WEBSITE2_URL);
  if (
    website2Url.pathname !== "/" ||
    website2Url.search ||
    website2Url.hash ||
    website2Url.username ||
    website2Url.password ||
    (env.NODE_ENV === "production" && website2Url.protocol !== "https:")
  ) {
    throw new Error(
      "WEBSITE2_URL must be a public origin without a path, query, or fragment, and must use HTTPS in production.",
    );
  }
  env.WEBSITE2_URL = website2Url.origin;
} catch (website2UrlError) {
  throw Object.assign(
    new Error(`Environment validation failed: ${website2UrlError.message}`),
    { cause: website2UrlError },
  );
}

module.exports = { env };
