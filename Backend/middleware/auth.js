// middleware/auth.js

function adminOnly(req, res, next) {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Forbidden" });
  }
  next();
}

function somethingElse(req, res, next) {
  // ...
}

module.exports = {
  adminOnly,
};
