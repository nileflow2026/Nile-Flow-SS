/**
 * Banner Routes
 *
 * Banner management endpoints.
 *
 * GET    /api/v1/banners          — List all banners (public)
 * POST   /api/v1/banners          — Create banner (admin)
 * PATCH  /api/v1/banners/:id      — Update banner (admin)
 * DELETE /api/v1/banners/:id      — Delete banner (admin)
 */

"use strict";

const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const upload = require("../Config/multer");
const {
  getBanners,
  createBanner,
  updateBanner,
  deleteBanner,
} = require("../controllers/v1/bannerController");

// Public — fetch all active banners
router.get("/", getBanners);

// Admin — manage banners (requires auth token)
router.post("/", authenticateToken, upload.single("image"), createBanner);
router.patch("/:bannerId", authenticateToken, upload.single("image"), updateBanner);
router.delete("/:bannerId", authenticateToken, deleteBanner);

module.exports = router;
