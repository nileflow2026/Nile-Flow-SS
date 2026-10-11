/**
 * Nile Flow — API v1 Router
 *
 * Consolidated, versioned API routes for the platform.
 *
 * These routes are the primary interface for clients going forward.
 * Existing /api/* routes remain active for backwards compatibility
 * during the migration period.
 *
 * Mount in index.js:
 *   const v1Router = require('./routes/v1');
 *   app.use('/api/v1', v1Router);
 */

"use strict";

const { Router } = require("express");
const router = Router();

// ── Middleware ────────────────────────────────────────────────────────────────

const authenticateToken = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/auth");

// Optional auth — attaches req.user if a valid token is present; does NOT block unauthenticated requests
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(); // No token — guest request, proceed
  }
  // Delegate to the real middleware; if it fails, we still want to proceed as guest
  authenticateToken(req, res, (err) => {
    if (err) {
      // Invalid token — treat as guest, don't error
      req.user = null;
    }
    next();
  });
};

// ── Controllers ───────────────────────────────────────────────────────────────

const { getHomeFeed } = require("../controllers/v1/homeFeedController");
const {
  dealShareLimiter,
  getDealSharePage,
} = require("../controllers/v1/dealShareController");
const {
  getProductSharePage,
  productShareLimiter,
} = require("../controllers/v1/productShareController");
const {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../controllers/v1/bannerController");
const upload = require("../Config/multer");
const teamMemberRoutes = require("./teamMemberRoutes");
const {
  cancel: cancelPushBroadcast,
  create: createPushBroadcast,
  detail: getPushBroadcast,
  list: listPushBroadcasts,
  preview: previewPushBroadcast,
  retry: retryPushBroadcast,
} = require("../controllers/v1/pushBroadcastController");
const {
  getCustomerNotificationPreferences,
  snoozeCustomerNotificationPermissionPrompt,
  updateCustomerNotificationPreferences,
} = require("../controllers/UserControllers/Clientnotification");

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * GET /api/v1/deal-shares/:dealId
 * Public crawler preview page for an active deal.
 */
router.get("/deal-shares/:dealId", dealShareLimiter, getDealSharePage);
router.get("/product-shares/:productId", productShareLimiter, getProductSharePage);

/**
 * GET /api/v1/home-feed
 * Orchestrated homepage payload. Optional auth for personalised data.
 */
router.get("/home-feed", optionalAuth, getHomeFeed);

/**
 * GET /api/v1/health
 * Liveness check for load balancers / uptime monitors.
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    status: "ok",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

/**
 * GET /api/v1/cache/stats
 * Internal — returns cache hit/miss counters.
 * Restricted to admin JWT in production.
 */
router.get("/cache/stats", (req, res) => {
  if (process.env.NODE_ENV === "production") {
    const authHeader = req.headers.authorization || "";
    const adminKey = process.env.INTERNAL_METRICS_KEY;
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
  }

  const { getStats } = require("../src/lib/cache/cacheClient");
  res.json({ success: true, data: getStats() });
});

/**
 * GET /api/v1/banners
 * Public — returns all banners sorted by creation time.
 */
router.get("/banners", getBanners);

/**
 * POST /api/v1/banners
 * Admin — creates a new banner with optional image upload.
 */
router.post("/banners", authenticateToken, upload.single("image"), createBanner);

/**
 * PATCH /api/v1/banners/:bannerId
 * Admin — updates an existing banner with optional image replacement.
 */
router.patch("/banners/:bannerId", authenticateToken, upload.single("image"), updateBanner);

/**
 * DELETE /api/v1/banners/:bannerId
 * Admin — deletes a banner.
 */
router.delete("/banners/:bannerId", authenticateToken, deleteBanner);

router.get(
  "/customer/notification-preferences",
  authenticateToken,
  getCustomerNotificationPreferences,
);
router.patch(
  "/customer/notification-preferences",
  authenticateToken,
  updateCustomerNotificationPreferences,
);
router.post(
  "/customer/notification-permission-prompt/snooze",
  authenticateToken,
  snoozeCustomerNotificationPermissionPrompt,
);

router.post(
  "/admin/push-broadcasts/preview",
  authenticateToken,
  adminOnly,
  previewPushBroadcast,
);
router.post(
  "/admin/push-broadcasts",
  authenticateToken,
  adminOnly,
  createPushBroadcast,
);
router.get(
  "/admin/push-broadcasts",
  authenticateToken,
  adminOnly,
  listPushBroadcasts,
);
router.get(
  "/admin/push-broadcasts/:id",
  authenticateToken,
  adminOnly,
  getPushBroadcast,
);
router.post(
  "/admin/push-broadcasts/:id/cancel",
  authenticateToken,
  adminOnly,
  cancelPushBroadcast,
);
router.post(
  "/admin/push-broadcasts/:id/retry",
  authenticateToken,
  adminOnly,
  retryPushBroadcast,
);

router.use("/team-members", teamMemberRoutes);

module.exports = router;
