"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  CATEGORIES,
  PushBroadcastError,
  idempotencyKey,
  normalizePayload,
  payloadHash,
  userEligible,
} = require("../services/pushBroadcastRules");

test("normalizes campaign fields while preserving message paragraphs", () => {
  const normalized = normalizePayload({
    title: "  Service update  ",
    body: "First paragraph.\n\nSecond paragraph.",
    category: "service_announcement",
    destinationRoute: " /(Screens)/OrdersScreen ",
  });

  assert.deepEqual(normalized, {
    title: "Service update",
    body: "First paragraph.\n\nSecond paragraph.",
    category: "service_announcement",
    destinationRoute: "/(Screens)/OrdersScreen",
  });
  assert.equal(CATEGORIES.promotion.expiresMs, 24 * 60 * 60 * 1000);
  assert.equal(CATEGORIES.app_update.expiresMs, 30 * 24 * 60 * 60 * 1000);
  assert.equal(
    CATEGORIES.service_announcement.expiresMs,
    7 * 24 * 60 * 60 * 1000,
  );
});

test("rejects campaign content outside the accepted limits and route allowlist", () => {
  for (const input of [
    { title: "", body: "body", category: "promotion" },
    { title: "x".repeat(81), body: "body", category: "promotion" },
    { title: "title", body: "x".repeat(241), category: "promotion" },
    { title: "title", body: "body", category: "unknown" },
    {
      title: "title",
      body: "body",
      category: "promotion",
      destinationRoute: "https://example.com",
    },
  ]) {
    assert.throws(() => normalizePayload(input), PushBroadcastError);
  }
});

test("promotional recipients require explicit consent recorded by the snapshot", () => {
  const snapshot = "2026-10-07T12:00:00.000Z";
  const registered = {
    pushToken: "ExponentPushToken[test]",
    marketingPushEnabled: true,
    marketingPushConsentUpdatedAt: "2026-10-07T11:59:00.000Z",
  };

  assert.equal(userEligible(registered, "promotion", snapshot), true);
  assert.equal(
    userEligible(
      { ...registered, marketingPushConsentUpdatedAt: "2026-10-07T12:01:00.000Z" },
      "promotion",
      snapshot,
    ),
    false,
  );
  assert.equal(
    userEligible({ pushToken: registered.pushToken }, "promotion", snapshot),
    false,
  );
  assert.equal(userEligible({ pushToken: registered.pushToken }, "app_update", snapshot), true);
  assert.equal(userEligible({ ...registered, pushToken: null }, "app_update", snapshot), false);
});

test("campaign push eligibility honors category switches but not sound mute", () => {
  const snapshot = "2026-10-07T12:00:00.000Z";
  const registered = { pushToken: "ExponentPushToken[test]" };

  assert.equal(
    userEligible(
      {
        ...registered,
        notificationPreferences: JSON.stringify({
          system: { push: false },
        }),
      },
      "app_update",
      snapshot,
    ),
    false,
  );
  assert.equal(
    userEligible(
      {
        ...registered,
        notificationPreferences: JSON.stringify({
          system: { push: true, soundId: "silent" },
          soundMuted: true,
        }),
      },
      "app_update",
      snapshot,
    ),
    true,
  );
});

test("accepts only UUID version four idempotency keys and canonicalizes case", () => {
  const key = "F47AC10B-58CC-4372-A567-0E02B2C3D479";
  assert.equal(idempotencyKey(key), key.toLowerCase());
  assert.throws(() => idempotencyKey("not-a-uuid"), PushBroadcastError);
  assert.notEqual(
    payloadHash(normalizePayload({ title: "x", body: "a\n\nb", category: "promotion" })),
    payloadHash(normalizePayload({ title: "x", body: "a b", category: "promotion" })),
  );
});
