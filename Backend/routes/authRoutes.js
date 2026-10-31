const express = require("express");
const router = express.Router();
const {
  signin,
  handleRefreshToken,
  getCurrentUser,
  logout,
} = require("../controllers/AdminControllers/authController");
const authenticateToken = require("../middleware/authMiddleware");

router.post("/signin/admin", signin);
router.post("/logout/admin", authenticateToken, logout);
router.post("/refresh", handleRefreshToken);
router.get("/getcurrentuser", authenticateToken, getCurrentUser);

module.exports = router;
