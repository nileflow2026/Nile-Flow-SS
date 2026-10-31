const { Query } = require("node-appwrite");
const { users, instrumentedDb } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const { toSafeUserResponse } = require("../../utils/safeUserResponse");

// controllers/adminController.js

const getAdminProfile = async (req, res) => {
  try {
    // req.user is injected by your JWT middleware
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized: Invalid token." });
    }

    const { userId, email, username, role } = req.user;

    // Role check
    if (role !== "admin") {
      return res.status(403).json({ error: "Forbidden: Admins only." });
    }

    // Return normalized profile
    return res.status(200).json({
      userId,
      email,
      username,
      role,
    });
  } catch (err) {
    console.error("[AdminProfile] Error:", err);
    return res.status(500).json({ error: "Server error retrieving profile." });
  }
};

const getUsers = async (req, res) => {
  try {
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const limit = Math.min(
      100,
      Math.max(1, Number.parseInt(req.query.limit, 10) || 25),
    );
    const response = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_USER_COLLECTION_ID,
      [Query.limit(limit), Query.offset((page - 1) * limit)],
    );

    return res.json({
      users: response.documents.map(toSafeUserResponse),
      total: response.total,
      page,
      limit,
      totalPages: Math.ceil(response.total / limit),
    });
  } catch (error) {
    console.error("Failed to list users:", error.message);
    return res.status(500).json({ error: "Failed to list users." });
  }
};

module.exports = { getAdminProfile, getUsers };
