const { redis } = require("./redisClient");

const consumeScript = `
  local value = redis.call("GET", KEYS[1])
  if value then redis.call("DEL", KEYS[1]) end
  return value
`;

function assertSharedRedisReady() {
  if (!process.env.REDIS_URL || redis.status !== "ready") {
    const error = new Error("Shared Redis is not ready for OAuth handoffs.");
    error.code = "OAUTH_REDIS_UNAVAILABLE";
    throw error;
  }
}

async function storeOAuthRecord(key, value, ttlSeconds) {
  assertSharedRedisReady();
  return redis.set(key, JSON.stringify(value), "EX", ttlSeconds, "NX");
}

async function replaceOAuthRecord(key, value, ttlSeconds) {
  assertSharedRedisReady();
  return redis.set(key, JSON.stringify(value), "EX", ttlSeconds);
}

async function getOAuthRecord(key) {
  assertSharedRedisReady();
  const value = await redis.get(key);
  return value ? JSON.parse(value) : null;
}

async function consumeOAuthRecord(key) {
  assertSharedRedisReady();
  const value = await redis.eval(consumeScript, 1, key);
  return value ? JSON.parse(value) : null;
}

module.exports = {
  assertSharedRedisReady,
  consumeOAuthRecord,
  getOAuthRecord,
  replaceOAuthRecord,
  storeOAuthRecord,
};
