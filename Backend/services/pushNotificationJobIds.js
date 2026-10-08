"use strict";

const crypto = require("crypto");

function pushNotificationJobId(idempotencyKey) {
  return `push-${crypto
    .createHash("sha256")
    .update(idempotencyKey)
    .digest("hex")
    .slice(0, 32)}`;
}

module.exports = { pushNotificationJobId };
