const test = require("node:test");
const assert = require("node:assert/strict");
const { setCustomerSessionCookies } = require("../utils/customerSessionCookies");

test("sets secure cross origin cookies for the email verification session", () => {
  const cookies = [];
  const req = {
    get: (name) =>
      name === "origin" ? "https://mobile.nileflowafrica.com" : undefined,
    headers: {
      host: "nile-flow-backend.onrender.com",
      "x-forwarded-proto": "https",
    },
    protocol: "https",
  };
  const res = {
    cookie: (name, value, options) => cookies.push({ name, value, options }),
  };

  setCustomerSessionCookies(req, res, "access-token", "refresh-token");

  assert.deepEqual(
    cookies.map(({ name, value }) => [name, value]),
    [
      ["accessToken", "access-token"],
      ["refreshToken", "refresh-token"],
    ],
  );
  assert.deepEqual(
    cookies.map(({ options }) => options),
    [
      {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 15 * 60 * 1000,
      },
      {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        path: "/",
        maxAge: 30 * 24 * 60 * 60 * 1000,
      },
    ],
  );
});
