// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../../controllers/VendorControllers/vendorauthController");
const authenticateToken = require("../../middleware/authMiddleware");
const {
  loginSchema,
  validationSchemas,
} = require("../../utils/Vendor/validationSchemas");
const { validate } = require("../../middleware/Vendormiddleware/validation");

router.post("/register", authController.registerVendor);
router.post("/login", authController.loginVendor);
router.get("/me", authenticateToken, authController.getCurrentVendor);
router.post("/refresh", authController.handleRefreshToken);
router.post("/logout", authenticateToken, authController.logoutVendor);

// Password reset (public)
router.post("/forgot-password/send-code", authController.sendVendorResetCode);
router.post("/forgot-password/verify", authController.verifyVendorResetCode);

// Admin: direct password reset (requires auth)
router.post("/reset-vendor-password", authenticateToken, authController.resetVendorPassword);

module.exports = router;
