"use strict";

const express = require("express");
const authenticateToken = require("../middleware/authMiddleware");
const {
  getTeamMembers,
  createTeamMember,
  updateTeamMember,
  deleteTeamMember,
} = require("../controllers/v1/teamMembersController");

const router = express.Router();

router.get("/", getTeamMembers);
router.post("/", authenticateToken, createTeamMember);
router.patch("/:teamMemberId", authenticateToken, updateTeamMember);
router.delete("/:teamMemberId", authenticateToken, deleteTeamMember);

module.exports = router;
