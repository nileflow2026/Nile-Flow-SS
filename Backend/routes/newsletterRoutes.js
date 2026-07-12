const express = require("express");
const {
  newsletter,
  sendnewsletter,
  getAudienceStatistics,
  getCampaignTypes,
  sendBroadcast,
  getBroadcastAudienceStats,
} = require("../controllers/AdminControllers/newsletterController");
const {
  usercheck,
} = require("../controllers/AdminControllers/usercheckController");
const router = express.Router();

router.post("/subscribe", newsletter);
router.post("/send-newsletter", sendnewsletter);
router.post("/send-broadcast", sendBroadcast);
router.get("/audience-statistics", getAudienceStatistics);
router.get("/broadcast-stats", getBroadcastAudienceStats);
router.get("/campaign-types", getCampaignTypes);
router.post("/user-check", usercheck);


module.exports = router;
