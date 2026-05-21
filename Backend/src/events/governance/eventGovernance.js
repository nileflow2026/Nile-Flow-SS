"use strict";

const { validateEvent } = require("../schemas/eventSchema");

const enforceEventGovernance = (event) => {
  validateEvent(event);
  if (!event.idempotencyKey) {
    throw new Error("Event governance requires an idempotencyKey for every event.");
  }
  if (!event.correlationId) {
    throw new Error("Event governance requires a correlationId for every event.");
  }
  return true;
};

module.exports = {
  enforceEventGovernance,
};
