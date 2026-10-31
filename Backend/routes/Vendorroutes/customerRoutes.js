const express = require("express");
const router = express.Router();
const authenticateToken = require("../../middleware/authMiddleware");
const { adminOnly } = require("../../middleware/auth");
const {
  getAllCustomers,
  getCustomerInsights,
  getCustomerDetails,
} = require("../../controllers/VendorControllers/customerController");
router.use(authenticateToken, adminOnly);

router.get("/", getAllCustomers);
router.get("/insights", getCustomerInsights);
router.get("/:customerId", getCustomerDetails);

module.exports = router;
