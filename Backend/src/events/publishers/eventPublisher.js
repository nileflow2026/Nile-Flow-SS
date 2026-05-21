"use strict";

const { logger } = require("../../lib/logger");
const { eventsPublishedTotal } = require("../observability/eventMetrics");

const buildEvent = ({ eventType, sourceDomain, actor, payload, correlationId, idempotencyKey }) => ({
  eventType,
  eventVersion: "1.0",
  timestamp: new Date().toISOString(),
  sourceDomain,
  actor,
  payload,
  correlationId,
  idempotencyKey,
});

const publishEvent = async ({ eventType, sourceDomain, actor, payload, correlationId, idempotencyKey, transport }) => {
  const event = buildEvent({ eventType, sourceDomain, actor, payload, correlationId, idempotencyKey });
  if (logger && typeof logger.info === "function") {
    logger.info("Publishing domain event", { eventType, sourceDomain, actor, correlationId });
  }

  if (eventsPublishedTotal) {
    eventsPublishedTotal.inc({ eventType, sourceDomain });
  }

  if (transport && typeof transport.publish === "function") {
    return transport.publish(event);
  }

  throw new Error("No event transport configured for publishEvent");
};

module.exports = {
  publishEvent,
  buildEvent,
};
