"use strict";

class GovernanceError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = "GovernanceError";
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = GovernanceError;
