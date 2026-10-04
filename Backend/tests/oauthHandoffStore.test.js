const test = require("node:test");
const assert = require("node:assert/strict");

const redisPath = require.resolve("../services/redisClient");
const handoffPath = require.resolve("../services/oauthHandoffStore");
const originalRedisModule = require.cache[redisPath];
const originalHandoffModule = require.cache[handoffPath];
const originalRedisUrl = process.env.REDIS_URL;

const records = new Map();
const fakeRedis = {
  status: "ready",
  async set(key, value, expiryMode, ttlSeconds, onlyIfMissing) {
    if (onlyIfMissing === "NX" && records.has(key)) return null;
    records.set(key, {
      value,
      expiresAt:
        expiryMode === "EX" ? Date.now() + ttlSeconds * 1000 : null,
    });
    return "OK";
  },
  async get(key) {
    const record = records.get(key);
    if (!record || (record.expiresAt && record.expiresAt <= Date.now())) {
      records.delete(key);
      return null;
    }
    return record.value;
  },
  async eval(_script, _keyCount, key) {
    const value = await this.get(key);
    if (value) records.delete(key);
    return value;
  },
};

process.env.REDIS_URL = "redis://oauth-handoff-test";
require.cache[redisPath] = {
  id: redisPath,
  filename: redisPath,
  loaded: true,
  exports: { redis: fakeRedis },
};
delete require.cache[handoffPath];

const {
  assertSharedRedisReady,
  consumeOAuthRecord,
  getOAuthRecord,
  replaceOAuthRecord,
  storeOAuthRecord,
} = require("../services/oauthHandoffStore");

test.after(() => {
  if (originalRedisUrl === undefined) delete process.env.REDIS_URL;
  else process.env.REDIS_URL = originalRedisUrl;

  if (originalRedisModule) require.cache[redisPath] = originalRedisModule;
  else delete require.cache[redisPath];
  if (originalHandoffModule) require.cache[handoffPath] = originalHandoffModule;
  else delete require.cache[handoffPath];
});

test("OAuth records are stored with expiry and create only when absent", async () => {
  records.clear();

  assert.equal(
    await storeOAuthRecord("oauth:test:state", { provider: "google" }, 600),
    "OK",
  );
  assert.equal(
    await storeOAuthRecord("oauth:test:state", { provider: "facebook" }, 600),
    null,
  );
  assert.deepEqual(await getOAuthRecord("oauth:test:state"), {
    provider: "google",
  });
});

test("OAuth record consumption is single use", async () => {
  records.clear();
  await replaceOAuthRecord("oauth:test:code", { userId: "customer-1" }, 60);

  assert.deepEqual(await consumeOAuthRecord("oauth:test:code"), {
    userId: "customer-1",
  });
  assert.equal(await consumeOAuthRecord("oauth:test:code"), null);
});

test("OAuth handoffs fail closed unless shared Redis is configured and ready", () => {
  const configuredUrl = process.env.REDIS_URL;
  process.env.REDIS_URL = "";
  assert.throws(assertSharedRedisReady, {
    code: "OAUTH_REDIS_UNAVAILABLE",
  });

  process.env.REDIS_URL = configuredUrl;
  fakeRedis.status = "connecting";
  assert.throws(assertSharedRedisReady, {
    code: "OAUTH_REDIS_UNAVAILABLE",
  });
  fakeRedis.status = "ready";
});
