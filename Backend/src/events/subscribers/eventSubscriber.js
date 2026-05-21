"use strict";

const { logger } = require("../../lib/logger");

class EventSubscriber {
  constructor(name, handler) {
    this.name = name;
    this.handler = handler;
  }

  async process(event) {
    if (logger && typeof logger.info === "function") {
      logger.info("Processing domain event", { eventType: event.eventType, name: this.name, correlationId: event.correlationId });
    }
    return this.handler(event);
  }
}

module.exports = EventSubscriber;
