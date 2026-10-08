"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const {
  NotificationPreferenceError,
  mergePreferences,
  normalizePreferences,
  readStoredPreferences,
  resolvePushSettings,
  validatePreferencePatch,
} = require("../notifications/CustomerNotificationPreferences");

test("normalizes absent preferences to the documented category defaults", () => {
  assert.deepEqual(normalizePreferences(readStoredPreferences(null)), {
    order: { push: true, soundId: "coreflow_1" },
    promotion: { soundId: "kalimba_1" },
    loyalty: { push: true, soundId: "nile_miles_1" },
    system: { push: true, soundId: "sonic_logo_1" },
    soundMuted: false,
  });
});

test("merges category updates without replacing unrelated stored preferences", () => {
  const existing = {
    order: { push: true, soundId: "coreflow_1", email: false },
    support: { email: true, push: false },
    soundMuted: false,
  };
  const merged = mergePreferences(existing, {
    order: { push: false },
    soundMuted: true,
  });

  assert.equal(merged.order.push, false);
  assert.equal(merged.order.soundId, "coreflow_1");
  assert.equal(merged.order.email, false);
  assert.deepEqual(merged.support, { email: true, push: false });
  assert.equal(merged.soundMuted, true);
});

test("rejects unknown keys, invalid values, and category sound IDs", () => {
  for (const patch of [
    { unknown: true },
    { notificationPreferences: { unknown: { push: true } } },
    { notificationPreferences: { promotion: { push: true } } },
    { notificationPreferences: { order: { push: "false" } } },
    { notificationPreferences: { order: { soundId: "kalimba_1" } } },
    { notificationPreferences: { loyalty: { soundId: "unknown" } } },
  ]) {
    assert.throws(() => validatePreferencePatch(patch), NotificationPreferenceError);
  }
});

test("resolves category sounds, silent choices, and master mute to stable channels", () => {
  const preferences = {
    order: { push: true, soundId: "coreflow_1" },
    promotion: { soundId: "kalimba_3" },
    loyalty: { push: true, soundId: "nile_miles_2" },
    system: { push: true, soundId: "sonic_logo_2" },
  };

  assert.deepEqual(
    resolvePushSettings("order.created", preferences, false),
    {
      category: "order",
      enabled: true,
      soundId: "coreflow_1",
      sound: "coreflow_1.wav",
      channelId: "nf-order-coreflow_1",
    },
  );
  assert.equal(
    resolvePushSettings("appUpdate", preferences, false).channelId,
    "nf-system-sonic_logo_2",
  );
  assert.equal(
    resolvePushSettings("reward", preferences, false).sound,
    "nile_miles_2.wav",
  );
  assert.equal(
    resolvePushSettings("promotion", preferences, true).channelId,
    "nf-promotion-kalimba_3",
  );
  assert.equal(
    resolvePushSettings(
      "order.created",
      { ...preferences, order: { push: true, soundId: "silent" } },
      false,
    ).channelId,
    "nf-order-silent",
  );
  assert.equal(
    resolvePushSettings(
      "account.welcome",
      { ...preferences, system: { push: false }, soundMuted: true },
      false,
    ).channelId,
    "nf-welcome-silent",
  );
  assert.equal(
    resolvePushSettings("unclassified", { soundMuted: true }, false).channelId,
    "nf-customer-silent",
  );
});

test("category push switches and promotional consent block only affected pushes", () => {
  assert.equal(
    resolvePushSettings(
      "order.confirmed",
      { order: { push: false } },
      false,
    ).enabled,
    false,
  );
  assert.equal(
    resolvePushSettings("promotion", {}, false).enabled,
    false,
  );
  assert.equal(
    resolvePushSettings("promotion", {}, true).enabled,
    true,
  );
  assert.equal(
    resolvePushSettings("password_changed", { system: { push: false } }, false)
      .enabled,
    true,
  );
});
