const express = require("express");
const {
  sendForgotPasswordEmail,
  resetPassword,
  sendForgotPasswordCode,
  resetPasswordWithCode,
} = require("../controllers/UserControllers/forgotPasswordController");
const router = express.Router();

// Legacy — token-based reset (web)
router.post("/forgot-password", sendForgotPasswordEmail);
router.post("/reset-password", resetPassword);

// New — code-based reset (mobile)
router.post("/forgot-password/send-code", sendForgotPasswordCode);
router.post("/forgot-password/reset", resetPasswordWithCode);

module.exports = router;
