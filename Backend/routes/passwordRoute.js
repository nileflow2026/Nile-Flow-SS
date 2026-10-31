const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");
const {
  changePassword,
} = require("../controllers/AdminControllers/passwordController");

router.post("/user/password/change", authenticateToken, changePassword);

module.exports = router;
