const express = require("express");
const router = express.Router();
const {
  signupcustomer,
  signincustomer,
  verifyCustomerEmail,
  handleRefreshToken,
  getCurrentCustomer,
  logoutcustomer,
  getCustomerPreferences,
  updateCustomerPreferences,
  updateCustomerProfile,
  getGoogleOAuthUrl,
  googleOAuthCallback,
  getFacebookOAuthUrl,
  facebookOAuthCallback,
  startOAuthEmailVerification,
  completeOAuthEmailVerification,
  exchangeOAuthCode,
  savePickupAddress,
  getPickupAddress,
} = require("../controllers/UserControllers/ClientauthController");
const { resendVerificationCode } = require("../services/send-confirmation");
const authMiddleware = require("../middleware/authMiddleware");
const { log } = require("winston");

router.post("/signup/customer", signupcustomer);
router.post("/signin/customer", signincustomer);

router.post("/refresh", handleRefreshToken);
router.post("/resend-code", resendVerificationCode);
router.post("/verify", verifyCustomerEmail);
router.post("/verify-customer", verifyCustomerEmail);
router.get("/getCustomerProfile", authMiddleware, getCurrentCustomer);
// routes/ClientauthRouter.js
router.get("/preferences", authMiddleware, getCustomerPreferences);
router.put("/preferences", authMiddleware, updateCustomerPreferences);
router.put("/update-profile", authMiddleware, updateCustomerProfile);
router.post("/logoutCustomer", authMiddleware, logoutcustomer);

// OAuth routes
router.get("/oauth/google", getGoogleOAuthUrl);
router.get("/oauth/google/callback", googleOAuthCallback);
router.get("/oauth/facebook", getFacebookOAuthUrl);
router.get("/oauth/facebook/callback", facebookOAuthCallback);
router.post("/oauth/verification/start", startOAuthEmailVerification);
router.post("/oauth/verification/complete", completeOAuthEmailVerification);
router.post("/oauth/exchange", exchangeOAuthCode);

// Pickup address routes
router.post("/pickup-address", authMiddleware, savePickupAddress);
router.get("/pickup-address", authMiddleware, getPickupAddress);

module.exports = router;
