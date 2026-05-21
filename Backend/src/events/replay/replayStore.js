"use strict";

class EventReplayStore {
  constructor() {
    this.replayLog = [];
  }

  recordReplay(event) {
    this.replayLog.push({ event, replayedAt: new Date().toISOString() });
  }

  getReplays() {
    return [...this.replayLog];
  }
}

module.exports = EventReplayStore;
