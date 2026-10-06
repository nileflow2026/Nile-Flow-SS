const express = require("express");
const multer = require("multer");
const {
  newsletter,
  sendnewsletter,
  getAudienceStatistics,
  getCampaignTypes,
  uploadNewsletterBanner,
  sendBroadcast,
  getBroadcastAudienceStats,
} = require("../controllers/AdminControllers/newsletterController");
const authenticateToken = require("../middleware/authMiddleware");
const { adminOnly } = require("../middleware/auth");
const subscriberController = require("../controllers/AdminControllers/subscriberController");
const {
  usercheck,
} = require("../controllers/AdminControllers/usercheckController");
const router = express.Router();

const newsletterImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    if (["image/png", "image/jpeg", "image/gif"].includes(file.mimetype)) {
      return callback(null, true);
    }
    return callback(new Error("Only PNG, JPG, and GIF images are supported."));
  },
});

function parseNewsletterImage(req, res, next) {
  newsletterImageUpload.single("image")(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.code === "LIMIT_FILE_SIZE"
          ? "Image must be 2MB or smaller."
          : error.message,
      });
    }
    return next();
  });
}

router.post("/subscribe", newsletter);
router.post("/send-newsletter", sendnewsletter);
router.post("/send-broadcast", sendBroadcast);
router.post(
  "/upload-banner",
  authenticateToken,
  adminOnly,
  parseNewsletterImage,
  uploadNewsletterBanner,
);
router.get("/audience-statistics", getAudienceStatistics);
router.get("/broadcast-stats", getBroadcastAudienceStats);
router.get("/campaign-types", getCampaignTypes);
router.post("/user-check", usercheck);

// Subscriber management
router.get("/subscribers", subscriberController.listSubscribers);
router.get("/subscribers/export", subscriberController.exportSubscribers);
router.delete("/subscribers/:id", subscriberController.removeSubscriber);

module.exports = router;
