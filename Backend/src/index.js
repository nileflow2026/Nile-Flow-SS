// IMPORTANT: instrument.js must be the very first import — initializes Sentry
// before any other module so all errors and traces are captured from startup.
require("../instrument.js");
const Sentry = require("@sentry/node");

// EMERGENCY DEBUG - Add to VERY TOP of index.js
process.on("uncaughtException", (error) => {
  Sentry.captureException(error);
  console.error("[FATAL] UNCAUGHT EXCEPTION:", error.message);
  console.error("  Stack:", error.stack);
  console.error("  Code:", error.code);

  // Don't exit immediately - let us see the error
  setTimeout(() => {
    console.error("[FATAL] Exiting due to uncaught exception...");
    process.exit(1);
  }, 2000);
});

process.on("unhandledRejection", (reason, promise) => {
  Sentry.captureException(reason);
  console.error("[FATAL] UNHANDLED REJECTION at:", promise);
  console.error("  Reason:", reason);
  if (reason && reason.stack) {
    console.error("  Stack:", reason.stack);
  }

  // Don't exit immediately - let us see the error
  setTimeout(() => {
    console.error("[FATAL] Exiting due to unhandled promise rejection...");
    process.exit(1);
  }, 2000);
});

// Timestamp wrapper on console output
const originalLog = console.log;
const originalError = console.error;

console.log = (...args) => {
  const timestamp = new Date().toISOString();
  originalLog(`[${timestamp}]`, ...args);
};

console.error = (...args) => {
  const timestamp = new Date().toISOString();
  originalError(`[${timestamp}] [ERROR]`, ...args);
};

console.warn = (...args) => {
  const timestamp = new Date().toISOString();
  originalError(`[${timestamp}] [WARN]`, ...args);
};

// Import and configure Express app
let app;
let express, cookieParser, cors, morgan, helmet, fileUpload, rateLimit;
let appwriteService, securityHeaders, authLimiter, apiLimiter;
let validateSignup, validateLogin, healthRoutes;

try {
  express = require("express");
  cookieParser = require("cookie-parser");
  cors = require("cors");
  morgan = require("morgan");
  helmet = require("helmet");
  fileUpload = require("express-fileupload");
  rateLimit = require("express-rate-limit");

  appwriteService = require("../services/AppwriteSessionService");
  securityHeaders = require("../middleware/security");
  const rateLimiterModule = require("../middleware/rate-limiter");
  authLimiter = rateLimiterModule.authLimiter;
  apiLimiter = rateLimiterModule.apiLimiter;

  const validateMiddleware = require("../middleware/validate.middleware");
  validateSignup = validateMiddleware.validateSignup;
  validateLogin = validateMiddleware.validateLogin;

  healthRoutes = require("../routes/health.routes");

  app = express();
  // Trust Render's reverse proxy so Express can detect HTTPS correctly
  // and allow secure cookies to be read on the OAuth callback path.
  app.set("trust proxy", 1);
} catch (setupError) {
  console.error(
    "CRITICAL: Failed to set up Express application:",
    setupError.message,
  );
  console.error("  Stack:", setupError.stack);
  process.exit(1);
}

const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:3000",
  "https://nile-mart-backend-2.onrender.com",
  "https://nileflow-com.onrender.com",
  "https://nileflowafrica.com",
  "https://www.nileflowafrica.com",
  "https://nileflow.co.ke",
  "https://new-nile-flow-backend.onrender.com",
  "https://nileflowvendordashboard.onrender.com",
  "https://nile-flow-adminpanel.onrender.com",
  "https://nile-flow-website.onrender.com",
  "https://nile-flow-website2.onrender.com",
  "https://admin.nileflowafrica.com",
  "https://vendor.nileflowafrica.com",
  "https://nile-flow-backend.onrender.com",
  "https://nile-flow-backend-5dqm.onrender.com",
  "https://nileflow-oxpl.onrender.com",
  "https://nile-flow-rider-dashboard.onrender.com",
  "https://nile-flow-riderdashboard.onrender.com",
];

const corsAllowedHeaders =
  "Content-Type,Authorization,X-Requested-With,Accept,X-CSRF-Token,X-Platform,x-platform,X-Device-Id,x-device-id,X-Timezone,x-timezone,X-Transaction-ID,X-Currency,X-Correlation-ID,X-Request-ID,Cache-Control,Pragma,Origin,Access-Control-Request-Method,Access-Control-Request-Headers";

function applyCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (!origin) {
    return true;
  }
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      req.headers["access-control-request-headers"] || corsAllowedHeaders,
    );
    res.header("Access-Control-Max-Age", "86400");
    return true;
  }
  return false;
}

// Load core routes
let adminRouter,
  authRoutes,
  userRoutes,
  notificationRoutes,
  customernotifications,
  staffRoutes,
  settingRoutes,
  ClientRoute,
  ClientRouter;
try {
  adminRouter = require("../routes/adminRouter");
  authRoutes = require("../routes/authRoutes");
  userRoutes = require("../routes/userRoutes");
  notificationRoutes = require("../routes/notificationRoutes");
  customernotifications = require("../routes/ClientnotificationsRouter");
  staffRoutes = require("../routes/staffroutes");
  settingRoutes = require("../routes/settingsRouter");
  ClientRoute = require("../routes/ClientauthRouter");
  ClientRouter = require("../routes/ClientRoutes");
  commissionRoutes = require("../routes/commissionRoutes");
} catch (routeError) {
  console.error("Failed to load core routes:", routeError.message);
  throw routeError;
}

// Load additional routes
let PaymentRouter,
  nilemiles,
  addressRoutes,
  questions,
  Promotion,
  groupOrderRoutes;
let gamificationRoutes,
  newsletterRoutes,
  clientmessages,
  careersRoutes,
  applyRoutes,
  productsrouter;
let africanFactsRoutes, orderTrackingRoutes;

try {
  PaymentRouter = require("../routes/paymentrouter");
  nilemiles = require("../routes/reward");
  addressRoutes = require("../routes/addressroutes");
  questions = require("../routes/questionRoutes");
  Promotion = require("../routes/promotionRoutes");
  groupOrderRoutes = require("../routes/groupOrderRoutes");
  gamificationRoutes = require("../routes/gamificationRoutes");
  newsletterRoutes = require("../routes/newsletterRoutes");
  clientmessages = require("../routes/clientmessagerouter");
  careersRoutes = require("../routes/careersRoutes");
  applyRoutes = require("../routes/applyRoutes");
  productsrouter = require("../routes/productsRouter");
  africanFactsRoutes = require("../routes/africanFactsRoutes");
  orderTrackingRoutes = require("../routes/orderTrackingRoutes");
} catch (additionalRouteError) {
  console.warn(
    "Some additional routes failed to load:",
    additionalRouteError.message,
  );
  console.warn("  Server will continue with core functionality only");
}

// ========== PASSWORD ROUTES ==========
let passwordRouter;
try {
  passwordRouter = require("../routes/passwordRoute");
} catch (passwordRouteError) {
  console.warn("Password routes failed to load:", passwordRouteError.message);
}

// ========== FORGOT PASSWORD ROUTES ==========
let forgotPasswordRoutes;
try {
  forgotPasswordRoutes = require("../routes/forgotPasswordRoutes");
} catch (forgotPasswordError) {
  console.warn(
    "Forgot password routes failed to load:",
    forgotPasswordError.message,
  );
}

// ========== CART ROUTES ==========
let cartRoutes;
try {
  cartRoutes = require("../routes/Cartrouter");
} catch (cartRouteError) {
  console.warn("Cart routes failed to load:", cartRouteError.message);
}

// Vendor Routes
let vendorauth,
  vendorRoutes,
  productRoutes,
  vendorDashboardRoutes,
  analyticstroutes,
  vendorOrdersRoutes,
  customerRoutes;
try {
  vendorauth = require("../routes/Vendorroutes/vendorauth");
  vendorRoutes = require("../routes/Vendorroutes/vendors");
  productRoutes = require("../routes/Vendorroutes/productsRouter");
  vendorDashboardRoutes = require("../routes/Vendorroutes/vendorDashboardRoutes");
  analyticstroutes = require("../routes/Vendorroutes/analyticsRoutes");
  vendorOrdersRoutes = require("../routes/Vendorroutes/vendorOrdersRoutes");
  customerRoutes = require("../routes/Vendorroutes/customerRoutes");
} catch (vendorRouteError) {
  console.warn("Vendor routes failed to load:", vendorRouteError.message);
  console.warn("  Server will continue without vendor functionality");
}

// Rider Routes
let riderAuthRoutes, riderRoutes, riderTrackingRoutes, vendorNotificationRoutes;
try {
  riderAuthRoutes = require("../routes/Riderroutes/riderAuthRoutes");
  riderRoutes = require("../routes/Riderroutes/riderRoutes");
  riderTrackingRoutes = require("../routes/riderTrackingRoutes");
  vendorNotificationRoutes = require("../routes/Vendorroutes/vendornotification");
} catch (riderRouteError) {
  console.warn("Rider routes failed to load:", riderRouteError.message);
  console.warn("  Server will continue without rider functionality");
}

// ========== SECURITY HEADERS ==========
try {
  if (securityHeaders) {
    securityHeaders(app);
  }
} catch (securityError) {
  console.warn("Security headers failed:", securityError.message);
}

// ========== HELMET ==========
try {
  if (helmet) {
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'", "https://fra.cloud.appwrite.io"],
            frameAncestors: ["'none'"],
          },
        },
        hsts: {
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true,
        },
      }),
    );
  }
} catch (helmetError) {
  console.warn("Helmet middleware failed:", helmetError.message);
}

app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    if (applyCorsHeaders(req, res)) {
      return res.sendStatus(204);
    }
    return res.sendStatus(403);
  }
  next();
});

// ========== CORS CONFIGURATION ==========
try {
  if (cors) {
    const corsOptions = {
      origin: (origin, callback) => {
        if (!origin) {
          return callback(null, true);
        }

        if (allowedOrigins.includes(origin)) {
          callback(null, true);
        } else {
          callback(new Error("Not allowed by CORS"));
        }
      },
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["*"],
      credentials: true,
      exposedHeaders: ["X-CSRF-Token"],
      optionsSuccessStatus: 200,
      maxAge: 86400,
      preflightContinue: false,
    };

    app.use(cors(corsOptions));
  }
} catch (corsError) {
  console.warn("CORS middleware failed:", corsError.message);
}

// Global CORS headers middleware - admin requests
app.use("/api/admin", (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    const requestedHeaders =
      req.headers["access-control-request-headers"] || corsAllowedHeaders;
    res.header("Access-Control-Allow-Headers", requestedHeaders);
  }
  next();
});

// Global CORS headers middleware - vendor requests
app.use("/api/vendor", (req, res, next) => {
  const origin = req.headers.origin;
  if (origin && origin.includes("vendor.nileflowafrica.com")) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    const requestedHeaders =
      req.headers["access-control-request-headers"] || corsAllowedHeaders;
    res.header("Access-Control-Allow-Headers", requestedHeaders);
  }
  next();
});

// Manual CORS fallback for OPTIONS preflight requests
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    const origin = req.headers.origin;
    const allowedOrigins = [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:3000",
      "https://nile-mart-backend-2.onrender.com",
      "https://nileflow-com.onrender.com",
      "https://nileflowafrica.com",
      "https://www.nileflowafrica.com",
      "https://nileflow.co.ke",
      "https://new-nile-flow-backend.onrender.com",
      "https://nileflowvendordashboard.onrender.com",
      "https://nile-flow-adminpanel.onrender.com",
      "https://nile-flow-website.onrender.com",
      "https://admin.nileflowafrica.com",
      "https://vendor.nileflowafrica.com",
      "https://nile-flow-backend.onrender.com",
      "https://nile-flow-backend-5dqm.onrender.com",
      "https://nileflow-oxpl.onrender.com",
      "https://nile-flow-rider-dashboard.onrender.com",
      "https://nile-flow-riderdashboard.onrender.com",
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      res.header("Access-Control-Allow-Origin", origin || "*");
      res.header(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      );
      const requestedHeaders =
        req.headers["access-control-request-headers"] || corsAllowedHeaders;
      res.header("Access-Control-Allow-Headers", requestedHeaders);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header("Access-Control-Max-Age", "86400");
      return res.status(200).end();
    }
  }
  next();
});

// ========== REQUEST PARSING ==========
try {
  if (express) {
    // Only parse JSON when Content-Type is application/json —
    // do NOT let express.json() consume multipart streams, which would
    // corrupt the body before busboy/multer can parse it.
    app.use((req, res, next) => {
      const ct = (req.headers["content-type"] || "").toLowerCase();
      if (ct.includes("application/json")) {
        express.json({
          limit: "50mb",
          verify: (r, r2, buf) => {
            r.rawBody = buf;
          },
        })(req, res, next);
      } else {
        next();
      }
    });
    app.use((req, res, next) => {
      const ct = (req.headers["content-type"] || "").toLowerCase();
      if (ct.includes("application/x-www-form-urlencoded")) {
        express.urlencoded({ extended: true, limit: "50mb" })(req, res, next);
      } else {
        next();
      }
    });
  }

  if (cookieParser) {
    app.use(cookieParser());
  }
} catch (parsingError) {
  console.warn("Request parsing middleware failed:", parsingError.message);
}

// ========== REQUEST TRACING (Correlation IDs + structured logging) ==========
try {
  const requestTracing = require("../middleware/requestTracing");
  app.use(requestTracing);
} catch (tracingError) {
  console.warn("Request tracing middleware failed:", tracingError.message);
}

// ========== PROMETHEUS HTTP METRICS ==========
try {
  const {
    requestMetricsMiddleware,
  } = require("./observability/requestMetrics");
  app.use(requestMetricsMiddleware);
} catch (metricsError) {
  console.warn("Prometheus metrics middleware failed:", metricsError.message);
}

// ========== LOGGING ==========
try {
  if (morgan) {
    app.use(
      morgan(":method :url :status :response-time ms - :res[content-length]"),
    );
  }
} catch (loggingError) {
  console.warn("Logging middleware failed:", loggingError.message);
}

// Note: We use multer for file uploads (see routes/v1.js), not express-fileupload
// to avoid middleware conflicts that corrupt multipart streams

// ========== APPWRITE INITIALIZATION MIDDLEWARE ==========
let appwriteLastFailedAt = 0;
const APPWRITE_RETRY_COOLDOWN_MS = 30000;

app.use(async (req, res, next) => {
  if (appwriteService.isConnected) {
    return next();
  }

  const now = Date.now();
  if (now - appwriteLastFailedAt < APPWRITE_RETRY_COOLDOWN_MS) {
    if (
      req.path === "/health" ||
      req.path === "/api/health" ||
      req.path === "/status" ||
      req.path === "/" ||
      req.path.startsWith("/api/cors-test")
    ) {
      return next();
    }
    return res.status(503).json({
      error: "Service temporarily unavailable",
      code: "APPWRITE_UNAVAILABLE",
      message: "Authentication service is down. Please try again later.",
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }

  try {
    await appwriteService.initialize();
    next();
  } catch (error) {
    appwriteLastFailedAt = Date.now();
    console.error("Appwrite initialization failed:", error.message);

    if (
      req.path === "/health" ||
      req.path === "/api/health" ||
      req.path === "/status" ||
      req.path === "/" ||
      req.path.startsWith("/api/cors-test")
    ) {
      return next();
    }

    res.status(503).json({
      error: "Service temporarily unavailable",
      code: "APPWRITE_UNAVAILABLE",
      message: "Authentication service is down. Please try again later.",
      timestamp: new Date().toISOString(),
      path: req.path,
    });
  }
});

// ========== HEALTH CHECKS ==========
app.get("/", (req, res) => {
  try {
    res.json({
      status: "online",
      service: "Nile Flow Backend",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: require("../package.json").version || "unknown",
    });
  } catch (error) {
    res.json({
      status: "online",
      service: "Nile Flow Backend",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: "unknown",
    });
  }
});

app.use("/health", healthRoutes);
app.use("/api/health", healthRoutes);

// ========== CACHE CONTROL HEADERS ==========
app.use((req, res, next) => {
  if (req.url === "/" || req.url.includes("index.html")) {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  } else if (req.url.startsWith("/assets/")) {
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  }
  next();
});

// ========== VERSION CONTROL ENDPOINT ==========
const getServerVersion = (() => {
  let cached;
  return () => {
    if (cached) return cached;
    if (process.env.APP_VERSION) {
      cached = process.env.APP_VERSION;
      return cached;
    }
    try {
      cached = require("child_process")
        .execSync("git rev-parse --short HEAD")
        .toString()
        .trim();
    } catch {
      cached = "unknown";
    }
    return cached;
  };
})();

app.get("/api/version", (req, res) => {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  res.json({
    version: getServerVersion(),
    forceUpdate: process.env.FORCE_UPDATE === "true",
    timestamp: Date.now(),
  });
});

// ========== CORS TEST ENDPOINT ==========
app.get("/api/cors-test", (req, res) => {
  res.json({
    message: "CORS test successful",
    origin: req.headers.origin,
    timestamp: new Date().toISOString(),
    headers: {
      "access-control-allow-origin": res.getHeader(
        "Access-Control-Allow-Origin",
      ),
      "access-control-allow-credentials": res.getHeader(
        "Access-Control-Allow-Credentials",
      ),
    },
  });
});

// ========== SENTRY VERIFICATION ENDPOINT (dev only) ==========
if (process.env.NODE_ENV !== "production") {
  app.get("/debug-sentry", function debugSentryHandler(req, res) {
    throw new Error("Sentry test error from nileflow-backend");
  });
}

// Helper function to safely mount routes (only logs on failure)
function safeMount(path, router, description) {
  try {
    if (router) {
      app.use(path, router);
    }
  } catch (error) {
    console.error(`Failed to mount ${description} at ${path}:`, error.message);
  }
}

// ========== DIRECT ROUTE DEFINITIONS ==========

// Admin auth CORS headers middleware
app.use("/api/admin/auth", (req, res, next) => {
  const origin = req.headers.origin;
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5175",
    "http://localhost:5176",
    "http://localhost:3000",
    "https://admin.nileflowafrica.com",
    "https://nile-flow-adminpanel.onrender.com",
    "https://nileflowafrica.com",
    "https://nile-flow-backend.onrender.com",
    "https://nileflow-oxpl.onrender.com",
    "https://nile-flow-backend-5dqm.onrender.com",
  ];

  if (!origin || allowedOrigins.includes(origin)) {
    res.header(
      "Access-Control-Allow-Origin",
      origin || "https://admin.nileflowafrica.com",
    );
    res.header("Access-Control-Allow-Credentials", "true");
    res.header(
      "Access-Control-Allow-Methods",
      "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    );
    res.header(
      "Access-Control-Allow-Headers",
      "Content-Type,Authorization,X-Requested-With,Accept,X-CSRF-Token,Cache-Control",
    );
  }
  next();
});

// Admin Routes
safeMount(
  "/api/admin/auth",
  [authLimiter, authRoutes].filter(Boolean),
  "Admin Auth",
);

// Admin vendor management routes (separate router to avoid conflicts)
let vendorAdminRoutes;
try {
  vendorAdminRoutes = require("../routes/vendorAdminRoutes");
} catch (vendorAdminError) {
  console.warn("Vendor admin routes failed to load:", vendorAdminError.message);
}
safeMount("/api/admin/vendors", vendorAdminRoutes, "Admin Vendors");

// Mount admin router - handles ALL admin routes at /api/admin/*
safeMount("/api/admin", adminRouter, "Admin Router");

// Order tracking routes (non-admin)
safeMount("/api/orders", orderTrackingRoutes, "Order Tracking");

// Finance routes
safeMount("/api/finance", require("../routes/financeRoutes"), "Finance & Tax Reporting");

// Staff, careers, newsletter (separate routers)
safeMount("/api/admin/staff", staffRoutes, "Admin Staff");
safeMount("/api/admin/careers", careersRoutes, "Admin Careers");
safeMount("/api/admin/newsletter", newsletterRoutes, "Admin Newsletter");
safeMount("/api/admin/commission", commissionRoutes, "Admin Commission");
safeMount("/api", userRoutes, "User Routes");
safeMount("/api/notifications", notificationRoutes, "Notifications");

// ========== NOTIFICATION INFRASTRUCTURE ROUTES ==========
try {
  const notifLogRoutes = require("../routes/notificationLogRoutes");
  safeMount("/api/notifications/logs", notifLogRoutes, "Notification Logs");
} catch (notifLogError) {
  console.warn(
    "Notification log routes failed to load:",
    notifLogError.message,
  );
}
try {
  const webhookRoutes = require("../routes/webhookRoutes");
  safeMount(
    "/api/notifications/webhooks",
    webhookRoutes,
    "Notification Webhooks",
  );
} catch (webhookRouteError) {
  console.warn("Webhook routes failed to load:", webhookRouteError.message);
}
safeMount(
  "/api/customernotifications",
  customernotifications,
  "Customer Notifications",
);
safeMount("/api/ai", require("../routes/aiChatRoutes"), "AI Chat");
safeMount("/api/audit-logs", userRoutes, "Audit Logs");
safeMount("/api/users", userRoutes, "Users");
safeMount("/api/settings", settingRoutes, "Settings");
safeMount(
  "/api/customerauth",
  [authLimiter, ClientRoute].filter(Boolean),
  "Customer Auth",
);
safeMount(
  "/api/v1/customerauth",
  [authLimiter, ClientRoute].filter(Boolean),
  "Versioned Customer Auth",
);
safeMount("/api/customerprofile", ClientRouter, "Customer Profile");
safeMount("/api/update-currencies", ClientRouter, "Update Currencies");
safeMount("/api/payments", PaymentRouter, "Payments");
safeMount("/api/nilemiles", nilemiles, "Nile Miles");
safeMount("/api/nilemart", addressRoutes, "Nile Mart Addresses");
safeMount("/api/nilemart/questions", questions, "Questions");
safeMount("/api/nilemart/promotions", Promotion, "Promotions");
safeMount("/api/nileflow/passwordchange", passwordRouter, "Password Change");
safeMount(
  "/api/nileflowafrica/passwordchange",
  forgotPasswordRoutes,
  "Forgot Password",
);
safeMount("/cart", cartRoutes, "Cart");
safeMount("/api/group-orders", groupOrderRoutes, "Group Orders");
safeMount("/api/gamification", gamificationRoutes, "Gamification");
safeMount("/api/contact-nile-flow", clientmessages, "Contact Messages");
safeMount("/api/social", require("../routes/SocialRoutes"), "Social Commerce");
safeMount("/api/products", productsrouter, "Products");
safeMount("/api/apply", applyRoutes, "Apply");
safeMount("/api", africanFactsRoutes, "African Facts");
safeMount("/api/currency", require("../routes/currencyRoutes"), "Currency CAL");
safeMount(
  "/api/recommendations",
  require("../routes/recommendations"),
  "Recommendations",
);
safeMount("/api/nileflow/addresses", addressRoutes, "Nileflow Addresses");

// Vendor Routes
safeMount(
  "/api/vendor/auth",
  [authLimiter, vendorauth].filter(Boolean),
  "Vendor Auth",
);
safeMount("/api/vendors", vendorRoutes, "Vendor Management");
safeMount("/api/vendor/products", productRoutes, "Vendor Products");
safeMount(
  "/api/vendor/notifications",
  vendorNotificationRoutes,
  "Vendor Notifications",
);
safeMount("/api/vendor", vendorDashboardRoutes, "Vendor Dashboard");
safeMount("/api/vendor", analyticstroutes, "Vendor Analytics");
safeMount("/api/vendor", vendorOrdersRoutes, "Vendor Orders");
safeMount("/api/admin/customers", customerRoutes, "Admin Customers");

// Subscription & Payment Routes
safeMount(
  "/api/subscription",
  require("../routes/subscriptionRoutes"),
  "Subscription",
);
safeMount(
  "/api/payments",
  require("../routes/paymentCallbackRoutes"),
  "Payment Callbacks",
);
safeMount("/api/premium", require("../routes/premiumRoutes"), "Premium");

// Rider Routes
safeMount(
  "/api/rider/auth",
  [authLimiter, riderAuthRoutes].filter(Boolean),
  "Rider Auth",
);
safeMount("/api/rider", riderRoutes, "Rider Management");
safeMount("/api/rider", riderTrackingRoutes, "Rider Tracking");

// Account Deletion Routes (GDPR / Play Store compliance)
try {
  const accountDeletionRoutes = require("../routes/accountDeletionRoutes");
  safeMount("/api/account/deletion", accountDeletionRoutes, "Account Deletion");
  safeMount(
    "/account-deletion",
    accountDeletionRoutes,
    "Account Deletion (Public)",
  );
} catch (deletionError) {
  console.warn(
    "Account deletion routes failed to load:",
    deletionError.message,
  );
}

// ========== CACHE MIDDLEWARE FOR HIGH-TRAFFIC ROUTES ==========
try {
  require("../middleware/applyCacheToRoutes")(app);
} catch (cacheError) {
  console.warn("Cache middleware setup failed:", cacheError.message);
}

// ========== V1 API GATEWAY ROUTES ==========
try {
  const v1Router = require("../routes/v1");
  app.use("/api/v1", v1Router);
} catch (v1Error) {
  console.warn("API v1 router failed to load:", v1Error.message);
}

// ========== ORDER MANAGEMENT SYSTEM ROUTES ==========
try {
  const orderRoutes = require("../routes/orderRoutes");
  safeMount("/api/orders", orderRoutes, "Order Management");
} catch (orderRouteError) {
  console.warn(
    "Order management routes failed to load:",
    orderRouteError.message,
  );
}

// ========== IMAGE PROXY ==========
try {
  const imageProxyRoute = require("../routes/imageProxyRoute");
  safeMount("/api/image-proxy", imageProxyRoute, "Image Proxy");
} catch (proxyError) {
  console.warn("Image proxy route failed to load:", proxyError.message);
}

// ========== SEO ROUTES (Sitemaps, Merchant Feed, IndexNow) ==========
try {
  const { seoRouter } = require("../routes/seoRoutes");
  // Mount sitemaps at root level so they are at https://domain.com/sitemap*.xml
  app.use("/", seoRouter);
  // Also mount merchant feed under /api
  app.use("/api", seoRouter);
  console.log("  ✅ SEO routes mounted (sitemaps, merchant feed, IndexNow)");
} catch (seoError) {
  console.warn("SEO routes failed to load:", seoError.message);
}

// ========== PROMETHEUS METRICS SCRAPE ENDPOINT ==========
app.get("/metrics", async (req, res) => {
  try {
    if (process.env.NODE_ENV === "production") {
      const key = req.headers["x-metrics-key"];
      if (!key || key !== process.env.INTERNAL_METRICS_KEY) {
        return res.status(403).end();
      }
    }
    const { registry } = require("./observability/metrics");
    res.set("Content-Type", registry.contentType);
    res.end(await registry.metrics());
  } catch (err) {
    res.status(500).end();
  }
});

// ========== ERROR HANDLING MIDDLEWARE ==========
Sentry.setupExpressErrorHandler(app);

// 404 — unknown routes
app.use((req, res) => {
  res.status(404).json({
    error: "Route not found",
    code: "NOT_FOUND",
    path: req.path,
    method: req.method,
  });
});

// Centralized error handler
const errorHandler = require("../middleware/errorHandler");
app.use(errorHandler);

// ========== START SERVER ==========
async function startServer() {
  try {
    // Check critical environment variables first
    let env;
    try {
      const envModule = require("./env");
      env = envModule.env;
    } catch (envError) {
      console.error("Environment validation failed:", envError.message);
      if (envError.details) {
        console.error(
          "  Validation details:",
          envError.details
            .map((d) => `${d.path.join(".")}: ${d.message}`)
            .join(", "),
        );
      }
      throw new Error(`Environment validation failed: ${envError.message}`);
    }

    // Initialize Appwrite
    await appwriteService.initialize();

    // Initialize subscription cron jobs
    let SubscriptionCronService = null;
    try {
      SubscriptionCronService = require("../services/subscriptionCronService");
      await SubscriptionCronService.initialize();
    } catch (subscriptionError) {
      console.warn(
        "Subscription service failed to initialize:",
        subscriptionError.message,
      );
    }

    // Initialize group buy cron jobs
    try {
      const GroupBuyCronService = require("../services/groupBuyCronService");
      GroupBuyCronService.initialize();
    } catch (groupBuyError) {
      console.warn(
        "Group buy cron service failed to initialize:",
        groupBuyError.message,
      );
    }

    // Initialize account deletion cron (GDPR / Play Store compliance)
    try {
      const DeletionService = require("../services/DeletionService");
      DeletionService.initializeCron();
    } catch (deletionCronError) {
      console.warn(
        "Account deletion cron service failed to initialize:",
        deletionCronError.message,
      );
    }

    // Warm up exchange rate cache (non-blocking)
    try {
      const { warmUpCache } = require("../services/exchangeRateService");
      warmUpCache();
    } catch (exchangeErr) {
      console.warn("Exchange rate cache warm-up skipped:", exchangeErr.message);
    }

    // Start BullMQ workers
    try {
      if (
        process.env.NODE_ENV === "production" ||
        process.env.START_WORKERS === "true"
      ) {
        require("./jobs/workers/notificationWorker");
        require("./jobs/workers/nileMilesWorker");
        require("./jobs/workers/orderEventsWorker");
      }
    } catch (workerError) {
      console.warn("BullMQ workers failed to start:", workerError.message);
    }

    // Start queue depth poller for Prometheus (non-critical)
    try {
      const {
        startQueueMetricsPoller,
      } = require("./observability/queueMetrics");
      startQueueMetricsPoller();
    } catch (pollerError) {
      console.warn("Queue metrics poller failed:", pollerError.message);
    }

    // Initialize newsletter scheduled campaigns processor
    let processScheduledCampaigns = null;
    try {
      const newsletterModule = require("../controllers/AdminControllers/newsletterController");
      processScheduledCampaigns = newsletterModule.processScheduledCampaigns;
    } catch (newsletterError) {
      console.warn(
        "Newsletter scheduler failed to initialize:",
        newsletterError.message,
      );
    }

    // Process scheduled campaigns every 2 minutes
    const schedulerInterval = setInterval(
      async () => {
        if (processScheduledCampaigns) {
          try {
            await processScheduledCampaigns();
          } catch (error) {
            console.error("Newsletter scheduler error:", error.message);
          }
        }
      },
      2 * 60 * 1000,
    );

    // Run once immediately to check for any pending campaigns
    setTimeout(async () => {
      if (processScheduledCampaigns) {
        try {
          await processScheduledCampaigns();
        } catch (error) {
          console.error("Initial newsletter check error:", error.message);
        }
      }
    }, 10000);

    const server = app.listen(PORT, "0.0.0.0", () => {
      console.log(`
  ✅  SERVER STARTED
  📍 Port: ${PORT}
  📡 Environment: ${process.env.NODE_ENV || "development"}
  🔗 Health: http://localhost:${PORT}/health
      `);
    });

    // Handle server errors
    server.on("error", (error) => {
      console.error("HTTP Server error:");
      console.error("  Code:", error.code);
      console.error("  Message:", error.message);
      console.error("  Port:", error.port);

      if (error.code === "EADDRINUSE") {
        console.error(`Port ${PORT} is already in use. Try a different port.`);
      } else if (error.code === "EACCES") {
        console.error(`Permission denied to bind to port ${PORT}.`);
      }

      process.exit(1);
    });

    // Initialize WebSocket for real-time tracking
    try {
      const socketService = require("../services/socketService");
      socketService.initialize(server);
    } catch (socketError) {
      console.warn(
        "WebSocket service failed to initialize:",
        socketError.message,
      );
    }

    // Keep the process alive
    process.stdin.resume();
  } catch (error) {
    console.error("Failed to start server:");
    console.error("  Name:", error.name);
    console.error("  Message:", error.message);
    console.error("  Code:", error.code);
    console.error("  Stack:", error.stack);

    if (error.message && error.message.includes("ENOTFOUND")) {
      console.error("  -> DNS Resolution Error - Check network connectivity");
    } else if (error.message && error.message.includes("ECONNREFUSED")) {
      console.error("  -> Connection Refused - External service may be down");
    } else if (error.message && error.message.includes("ValidationError")) {
      console.error(
        "  -> Environment Variable Validation Error - Check your .env file",
      );
    } else if (error.code === "MODULE_NOT_FOUND") {
      console.error("  -> Missing Dependency - Run npm install");
    }

    setTimeout(() => {
      process.exit(1);
    }, 3000);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received. Shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received. Shutting down gracefully...");
  process.exit(0);
});

// Start the server
startServer();
