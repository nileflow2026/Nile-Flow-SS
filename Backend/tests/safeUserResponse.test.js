"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { toSafeUserResponse } = require("../utils/safeUserResponse");

test("safe user response includes only the approved user-list fields", () => {
  const response = toSafeUserResponse({
    $id: "user-1",
    $createdAt: "2026-01-01T00:00:00.000Z",
    email: "customer@example.test",
    username: "customer",
    role: "customer",
    avatarUrl: "https://example.test/avatar.png",
    isVerified: true,
    isPremium: false,
    phone: "+000000000",
    resetToken: "secret-reset-token",
    resetTokenExpiry: "2026-01-02T00:00:00.000Z",
    pushToken: "secret-push-token",
    googleSubject: "provider-subject",
    facebookSubject: "provider-subject",
    subscriptionId: "subscription-secret",
    $permissions: ["read(\"any\")"],
  });

  assert.deepEqual(response, {
    $id: "user-1",
    email: "customer@example.test",
    username: "customer",
    role: "customer",
    avatarUrl: "https://example.test/avatar.png",
    isVerified: true,
    isPremium: false,
    $createdAt: "2026-01-01T00:00:00.000Z",
  });
});
