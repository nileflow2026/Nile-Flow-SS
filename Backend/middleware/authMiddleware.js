// middleware/authMiddleware.js
const { verifyAccessToken } = require("../utils/tokenManager");
const { users } = require("../services/appwriteService");
const { isCustomerEmailVerified } = require("../utils/customerAuthPolicy");

// Exact-match allowed origins to prevent subdomain bypass
const ALLOWED_ORIGINS = new Set([
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
  "http://localhost:5176",
  "http://localhost:3000",
  "https://admin.nileflowafrica.com",
  "https://vendor.nileflowafrica.com",
  "https://nileflowafrica.com",
  "https://www.nileflowafrica.com",
  "https://nileflowvendordashboard.onrender.com",
  "https://nile-flow-adminpanel.onrender.com",
  "https://nile-flow-website.onrender.com",
  "https://nile-flow-backend.onrender.com",
]);

const authMiddleware = async (req, res, next) => {
  try {
    // Set CORS headers using exact-match origin validation
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
      res.header(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS",
      );
      res.header(
        "Access-Control-Allow-Headers",
        "Content-Type,Authorization,X-Requested-With,Accept,X-CSRF-Token,Cache-Control,Pragma",
      );
    }

    // Get token from cookie OR Authorization header (mobile OAuth uses Bearer token)
    const cookieToken = req.cookies?.accessToken;
    const authHeader = req.headers.authorization || "";
    const bearerToken = authHeader.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;
    const accessToken = cookieToken || bearerToken;

    if (!accessToken) {
      return res.status(401).json({
        error: "No access token provided",
      });
    }

    let decoded;
    try {
      decoded = verifyAccessToken(accessToken);
    } catch {
      return res.status(401).json({
        success: false,
        code: "INVALID_SESSION",
        error: "Invalid or expired token",
      });
    }

    // Attach user info to request
    req.user = {
      userId: decoded.sub,
      role: decoded.role,
      email: decoded.email || null,
    };

    if (!decoded.role || decoded.role === "customer") {
      let user;
      try {
        user = await users.get(decoded.sub);
      } catch (error) {
        if (error.code === 404) {
          return res.status(401).json({
            success: false,
            code: "INVALID_SESSION",
            error: "Customer account is not available.",
          });
        }

        console.error("Customer verification status lookup failed:", error.message);
        return res.status(503).json({
          success: false,
          code: "CUSTOMER_STATUS_UNAVAILABLE",
          error: "Customer status could not be checked. Please retry.",
        });
      }

      if (!isCustomerEmailVerified(user)) {
        return res.status(403).json({
          success: false,
          code: "EMAIL_NOT_VERIFIED",
          error: "Verify your email before accessing this resource.",
        });
      }
    }

    next();
  } catch (error) {
    // Ensure CORS headers are set even on error
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.has(origin)) {
      res.header("Access-Control-Allow-Origin", origin);
      res.header("Access-Control-Allow-Credentials", "true");
    }

    console.error("Authentication middleware failed:", error.message);
    return res.status(503).json({
      success: false,
      code: "AUTHORIZATION_UNAVAILABLE",
      error: "Authentication could not be checked. Please retry.",
    });
  }
};

module.exports = authMiddleware;
