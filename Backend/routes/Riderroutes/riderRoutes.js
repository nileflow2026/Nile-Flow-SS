// routes/riderRoutes.js
const express = require("express");
const router = express.Router();
const riderAuthMiddleware = require("../../middleware/RiderMiddleware/riderAuthMiddleware");
const riderStatusValidator = require("../../middleware/RiderMiddleware/riderStatusValidator");

const {
  getCurrentRider,
} = require("../../controllers/RiderControler/riderAuthController");
const {
  updateRiderProfile,
  updateRiderStatus,
  updateLocation,
  getRiderDeliveries,
  getAllDeliveries,
  getRiderEarnings,
  updateDeliveryStatus,
  getRiders,
} = require("../../controllers/RiderControler/RiderController");
const {
  logAuditEvents,
} = require("../../controllers/RiderControler/riderAuditController");

// Apply auth middleware to all routes
router.use(riderAuthMiddleware);

/**
 * Get Rider Profile
 */
router.get("/profile", riderStatusValidator, getCurrentRider);

/**
 * Update Rider Profile
 */
router.patch("/profile", riderStatusValidator, updateRiderProfile);

/**
 * Update Rider Location (from GPS tracking)
 */
router.patch("/profile/location", updateLocation);

/**
 * Update Rider Status (online/offline/busy)
 */
router.patch("/status", updateRiderStatus);

/**
 * Get Rider Deliveries
 */
router.get("/deliveries", riderStatusValidator, getRiderDeliveries);

/**
 * Debug: Get All Deliveries
 */
router.get("/debug/all-deliveries", getAllDeliveries);

/**
 * Get Rider Earnings
 */
router.get("/earnings", riderStatusValidator, getRiderEarnings);

router.get("/riders", getRiders);

/**
 * Update Delivery Status
 */
router.patch(
  "/deliveries/:deliveryId/status",
  riderStatusValidator,
  updateDeliveryStatus,
);

/**
 * Audit Logging Endpoint
 * Accepts batched audit events from the rider dashboard
 */
router.post("/audit/logs", logAuditEvents);

module.exports = router;
