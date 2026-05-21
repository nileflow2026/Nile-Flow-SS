"use strict";

const client = require("prom-client");
const { registry } = require("../../observability/metrics");

const eventsPublishedTotal = new client.Counter({
  name: "nf_events_published_total",
  help: "Total number of domain events published",
  labelNames: ["eventType", "sourceDomain"],
  registers: [registry],
});

const eventHandlerFailuresTotal = new client.Counter({
  name: "nf_event_handler_failures_total",
  help: "Total number of domain event handler failures",
  labelNames: ["eventType", "handler"],
  registers: [registry],
});

const eventReplayAttemptsTotal = new client.Counter({
  name: "nf_event_replay_attempts_total",
  help: "Total number of event replay attempts",
  labelNames: ["eventType"],
  registers: [registry],
});

module.exports = {
  eventsPublishedTotal,
  eventHandlerFailuresTotal,
  eventReplayAttemptsTotal,
};
