// middleware/auth.js

const { instrumentedDb } = require("../services/appwriteService");
const { env } = require("../src/env");

async function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }

  if (!req.user.userId) {
    return res.status(403).json({ error: "Forbidden" });
  }

  try {
    const adminProfile = await instrumentedDb.getDocument(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ADMIN_COLLECTION_ID,
      req.user.userId,
    );

    if (adminProfile.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    return next();
  } catch (error) {
    if (error.code === 404) {
      return res.status(403).json({ error: "Forbidden" });
    }

    console.error("Admin authorization check failed:", error.message);
    return res.status(503).json({
      error: "Authorization could not be verified. Please retry.",
    });
  }
}

function somethingElse(req, res, next) {
  // ...
}

module.exports = {
  adminOnly,
};
