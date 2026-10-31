const express = require("express");
const router = express.Router();
const authenticateToken = require("../../middleware/authMiddleware");
const { adminOnly } = require("../../middleware/auth");
const { apiLimiter } = require("../../middleware/rate-limiter");
const {
  getAllCustomers,
  getCustomerInsights,
  getCustomerDetails,
} = require("../../controllers/VendorControllers/customerController");
router.get("/", apiLimiter, authenticateToken, adminOnly, getAllCustomers);
router.get("/insights", apiLimiter, authenticateToken, adminOnly, getCustomerInsights);
router.get("/:customerId", apiLimiter, authenticateToken, adminOnly, getCustomerDetails);

module.exports = router;
