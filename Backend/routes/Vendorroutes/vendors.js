// routes/vendors.js
const express = require("express");
const router = express.Router();
const vendorController = require("../../controllers/VendorControllers/vendorController");
const authenticateToken = require("../../middleware/authMiddleware");
const multer = require("multer");

// Use memory storage for Appwrite uploads
// Simple multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
  // Remove fileFilter for now to test
});

// Error handling wrapper for multer
const handleUpload = (uploadMethod) => {
  return (req, res, next) => {
    uploadMethod(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            error: "File too large. Maximum size is 5MB.",
          });
        }
        return res.status(400).json({
          success: false,
          error: "File upload error: " + err.message,
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: err.message,
        });
      }
      next();
    });
  };
};

// Routes
// In your vendor routes file
// In your vendor routes file - FIXED VERSION
// SIMPLE WORKING VERSION - remove all debugging first
// In your vendor routes file - FIXED VERSION
router.put(
  "/profile-picture",
  authenticateToken,
  handleUpload(upload.single("avatar")),
  vendorController.updateProfilePicture
);

router.put(
  "/cover-picture",
  authenticateToken,
  handleUpload(upload.single("cover")),
  vendorController.updateCoverPicture,
);

router.delete(
  "/profile-picture",
  authenticateToken,
  vendorController.removeProfilePicture
);
router.patch("/profile", authenticateToken, vendorController.updateProfile);
router.get(
  "/dashboard/stats",
  authenticateToken,
  vendorController.getDashboardStats
);

module.exports = router;
