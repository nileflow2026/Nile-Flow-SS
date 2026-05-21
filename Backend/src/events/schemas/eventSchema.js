"use strict";

const EVENT_COMMON_FIELDS = [
  "eventType",
  "eventVersion",
  "timestamp",
  "sourceDomain",
  "actor",
  "payload",
  "correlationId",
  "idempotencyKey",
];

const validateEvent = (event) => {
  const missing = EVENT_COMMON_FIELDS.filter((field) => !Object.prototype.hasOwnProperty.call(event, field));
  if (missing.length > 0) {
    throw new Error(`Domain event missing required fields: ${missing.join(", ")}`);
  }
  return true;
};

module.exports = {
  EVENT_COMMON_FIELDS,
  validateEvent,
};
