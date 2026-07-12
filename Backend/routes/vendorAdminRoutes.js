// routes/vendorAdminRoutes.js
const express = require("express");
const router = express.Router();
const vendorAdminController = require("../controllers/AdminControllers/vendorAdminController");
const authenticateToken = require("../middleware/authMiddleware");

// Vendor admin routes for admin dashboard
router.get("/", authenticateToken, vendorAdminController.getAllVendors);
router.get("/stats", authenticateToken, vendorAdminController.getVendorStats);
router.get("/:vendorId", authenticateToken, vendorAdminController.getVendorById);
router.patch("/:vendorId/status", authenticateToken, vendorAdminController.toggleVendorStatus);

module.exports = router;
