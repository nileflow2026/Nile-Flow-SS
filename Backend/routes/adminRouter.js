// routes/admin.js
const express = require("express");
const {
  getOrders,
  getProducts,
  updateOrderStatus,
  addProduct,
  getProductReviews,
  clientmesseags,
  replyclientmessages,
  addFeaturedProducts,
  addProductsDeal,
  updateProduct,
  getSubcategoriesByCategoryId,
  createSubcategory,
  getProductsBySubcategoryId,
  addFlashSale,
  getFlashSales,
  addReward,
  updateReward,
  deleteReward,
  listRewards,
  getApprovedProducts,
  getRejectedProducts,
  getSingleProductDetails,
  assignDeliveryToRider,
  getCancelledOrders,
  updatePremiumDeal,
  createCategory,
} = require("../controllers/AdminControllers/admin");
const {
  getDeals,
  getDealAnalytics,
  createDeal,
  updateDeal,
  deleteDeal,
} = require("../controllers/AdminControllers/dealsController");
const authenticateToken = require("../middleware/authMiddleware");

// Additional controllers
const { getAuditLogs } = require("../controllers/AdminControllers/auditLoggerController");
const { getUsers, getAdminProfile } = require("../controllers/AdminControllers/userController");
const { getRiders } = require("../controllers/RiderControler/RiderController");
const { newsletter, sendnewsletter } = require("../controllers/AdminControllers/newsletterController");
const subscriberController = require("../controllers/AdminControllers/subscriberController");
const CommissionController = require("../controllers/AdminControllers/commissionController");
const { instrumentedDb } = require("../services/appwriteService");
const { env } = require("../src/env");
const {
  getPendingProducts,
  approveProduct,
  rejectProduct,
} = require("../controllers/AdminControllers/ProductapprovalController");
const router = express.Router();

router.get("/orders", authenticateToken, getOrders);
router.get("/orders/cancelled", authenticateToken, getCancelledOrders);
router.get("/products", authenticateToken, getProducts);
router.post("/orderStatus", authenticateToken, updateOrderStatus);
router.post("/addproducts", authenticateToken, addProduct);
router.put("/updateproducts", authenticateToken, updateProduct);
router.get("/messages", authenticateToken, clientmesseags);
router.get("/customer-messages/messages", authenticateToken, clientmesseags);
router.post("/contact/reply", authenticateToken, replyclientmessages);
router.post("/products/feature", authenticateToken, addFeaturedProducts);
router.post("/products/deal", authenticateToken, addProductsDeal);
router.put("/premium-deal", authenticateToken, updatePremiumDeal);
router.post("/products/addReward", authenticateToken, addReward);
router.post("/products/updatereward", authenticateToken, updateReward);
router.post("/products/deletereward", authenticateToken, deleteReward);
router.post("/products/listrewards", authenticateToken, listRewards);
router.post("/products/flashsale", authenticateToken, addFlashSale);
// A new route for fetching flash sales
router.get("/products/flashsale", authenticateToken, getFlashSales);

// ── Deals Routes ───────────────────────────────────────────────────────────────
router.get("/deals", authenticateToken, getDeals);
router.post("/deals", authenticateToken, createDeal);
router.patch("/deals/:dealId", authenticateToken, updateDeal);
router.delete("/deals/:dealId", authenticateToken, deleteDeal);
router.get("/deals/analytics", authenticateToken, getDealAnalytics);

// GET all subcategories under a specific category
router.get("/categories/:id/subcategories", getSubcategoriesByCategoryId);
router.get("/products/subcategory/:id", getProductsBySubcategoryId);
router.post("/categories", authenticateToken, createCategory);
// POST a new subcategory under a specific category
router.post("/:id/subcategories", authenticateToken, createSubcategory);

// Product approval routes
router.get("/products/pending", authenticateToken, getPendingProducts);
router.get("/products/pending/:productId", authenticateToken, getPendingProducts);
router.get("/products/approved", authenticateToken, getApprovedProducts);
router.get("/products/rejected", authenticateToken, getRejectedProducts);
router.post("/products/approve/:productId", authenticateToken, approveProduct);
router.post("/products/reject/:productId", authenticateToken, rejectProduct);
router.get("/products/:productId", authenticateToken, getSingleProductDetails);
router.post("/assign-delivery", authenticateToken, assignDeliveryToRider);

router.get("/products/:productId/stock", async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_PRODUCT_COLLECTION_ID,
      productId,
    );
    res.json({
      productId,
      stock: product.stock || 0,
      available: (product.stock || 0) > 0,
      productName: product.productName,
      isApproved: product.isApproved,
      isActive: product.isActive,
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to check stock", details: error.message });
  }
});

// ── Admin User Routes ────────────────────────────────────────────────────────
router.get("/users", authenticateToken, getUsers);
router.get("/users/profile", authenticateToken, getAdminProfile);
router.get("/riders", authenticateToken, getRiders);

// ── Audit & Stats ────────────────────────────────────────────────────────────
router.get("/audit-logs", authenticateToken, getAuditLogs);

// ── Commission Routes ────────────────────────────────────────────────────────
router.get("/commission/settings", authenticateToken, CommissionController.getCommissionSettings.bind(CommissionController));
router.put("/commission/rate", authenticateToken, CommissionController.updateCommissionRate.bind(CommissionController));
router.get("/commission/analytics", authenticateToken, CommissionController.getCommissionAnalytics.bind(CommissionController));
router.get("/commission/gmv", authenticateToken, CommissionController.getGMVData.bind(CommissionController));
router.post("/commission/recalculate", authenticateToken, CommissionController.batchCalculateCommissions.bind(CommissionController));

// ── Newsletter Routes ────────────────────────────────────────────────────────
router.post("/newsletter/broadcast", authenticateToken, sendnewsletter);
router.get("/newsletter/subscribers", authenticateToken, subscriberController.listSubscribers.bind(subscriberController));
router.delete("/newsletter/subscribers/:id", authenticateToken, subscriberController.removeSubscriber.bind(subscriberController));
router.get("/newsletter/subscribers/export", authenticateToken, subscriberController.exportSubscribers.bind(subscriberController));

module.exports = router;
