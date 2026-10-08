"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { Job } = require("bullmq");
const {
  eventPushJobId,
  eventPushRecoveryJobId,
} = require("../services/automaticPushJobIds");

const validateJobId = (jobId) => {
  const queue = {
    qualifiedName: "test:notifications",
    toKey: (key) => key,
    keys: {
      wait: "wait",
      active: "active",
      prioritized: "prioritized",
      events: "events",
      stalled: "stalled",
      limiter: "limiter",
      delayed: "delayed",
      paused: "paused",
      meta: "meta",
      pc: "pc",
    },
  };
  const job = new Job(queue, "automatic-event-push", {}, { jobId });
  job.validateOptions({ data: "{}" });
};

test("automatic push custom job IDs do not contain BullMQ reserved colons", () => {
  const receiptId = "a".repeat(32);
  const regularJobId = eventPushJobId(receiptId);
  const recoveryJobId = eventPushRecoveryJobId(receiptId, 30000);

  assert.equal(regularJobId, `push-event-${receiptId}`);
  assert.equal(recoveryJobId, `push-event-${receiptId}-recovery-1`);
  assert.throws(
    () => validateJobId(`push-event:${receiptId}`),
    /Custom Id cannot contain :/,
  );
  assert.doesNotThrow(() => validateJobId(regularJobId));
  assert.doesNotThrow(() => validateJobId(recoveryJobId));
});

test("recovery job IDs change by recovery interval", () => {
  const receiptId = "a".repeat(32);

  assert.notEqual(
    eventPushRecoveryJobId(receiptId, 30000),
    eventPushRecoveryJobId(receiptId, 60000),
  );
});
