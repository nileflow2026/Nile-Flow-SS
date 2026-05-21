"use strict";

const GovernanceError = require("./governanceErrors");

const MAX_TIMEOUT_MS = 10000;

const enforceTimeout = (timeoutMs) => {
  if (timeoutMs == null) return;
  if (timeoutMs < 0 || timeoutMs > MAX_TIMEOUT_MS) {
    throw new GovernanceError(
      `Timeout ${timeoutMs}ms is outside allowed range (0-${MAX_TIMEOUT_MS}ms).`,
      {
        timeoutMs,
        maxTimeoutMs: MAX_TIMEOUT_MS,
      },
    );
  }
};

module.exports = {
  MAX_TIMEOUT_MS,
  enforceTimeout,
};
