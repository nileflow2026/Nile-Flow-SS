"use strict";

class EventHandlerBase {
  constructor(eventType) {
    this.eventType = eventType;
  }

  async handle(event) {
    throw new Error("EventHandlerBase.handle must be implemented by a concrete handler.");
  }
}

module.exports = EventHandlerBase;
