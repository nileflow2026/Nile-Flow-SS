"use strict";

const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const upload = require("../Config/multer");
const {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} = require("../controllers/v1/teamMembersController");

const router = express.Router();

router.get("/", getTeamMembers);
router.post("/", authenticateToken, upload.single("image"), createTeamMember);
router.patch("/:teamMemberId", authenticateToken, upload.single("image"), updateTeamMember);
router.delete("/:teamMemberId", authenticateToken, deleteTeamMember);

module.exports = router;
