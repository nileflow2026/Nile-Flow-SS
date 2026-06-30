// rate-limiter.js
const rateLimit = require("express-rate-limit");
const { ipKeyGenerator } = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const { redis } = require("./redisClient");

const authLimiter = rateLimit({
  store: new RedisStore({
    prefix: "rl:auth:",
    client: redis,
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 attempts per window
  message: {
    error: "Too many authentication attempts",
    code: "RATE_LIMITED",
    retryAfter: 900, // seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use ipKeyGenerator helper to properly handle IPv4 and IPv6 addresses
  keyGenerator: (req) => {
    const emailKey = req.body?.email || "unknown";
    const ipKey = ipKeyGenerator(req);
    return `${ipKey}:${emailKey}`;
  },
});

const sessionLimiter = rateLimit({
  store: new RedisStore({
    prefix: "rl:session:",
    client: redis,
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per session
  skip: (req) => !req.cookies.session_id,
  // Use ipKeyGenerator helper for IPv6-safe rate limiting
  keyGenerator: (req) => req.cookies.session_id || ipKeyGenerator(req),
});

module.exports = {
  authLimiter,
  sessionLimiter,
};
