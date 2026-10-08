const test = require("node:test");
const assert = require("node:assert/strict");
const {
  getPasswordResetErrorResponse,
} = require("../utils/passwordResetError");

test("returns an actionable validation response for a recently used password", () => {
  assert.deepEqual(
    getPasswordResetErrorResponse({ type: "password_recently_used" }),
    {
      status: 400,
      body: {
        success: false,
        code: "password_recently_used",
        message:
          "This password is too similar to one you used recently. Please choose a different password.",
      },
    },
  );
});

test("keeps unknown password reset failures generic", () => {
  assert.deepEqual(getPasswordResetErrorResponse(new Error("internal detail")), {
    status: 500,
    body: {
      success: false,
      message: "Unable to reset password. Please try again later.",
    },
  });
});
