// routes/vendorAdminRoutes.js
const express = require("express");
const router = express.Router();
const vendorAdminController = require("../controllers/AdminControllers/vendorAdminController");
const authenticateToken = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/auth");

// Vendor admin routes for admin dashboard
router.get("/", authenticateToken, adminOnly, vendorAdminController.getAllVendors);
router.get(
  "/stats",
  authenticateToken,
  adminOnly,
  vendorAdminController.getVendorStats,
);
router.get(
  "/:vendorId",
  authenticateToken,
  adminOnly,
  vendorAdminController.getVendorById,
);
router.patch(
  "/:vendorId/status",
  authenticateToken,
  adminOnly,
  vendorAdminController.toggleVendorStatus,
);

module.exports = router;
