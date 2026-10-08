"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { Job } = require("bullmq");
const { pushNotificationJobId } = require("../services/pushNotificationJobIds");

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
  const job = new Job(queue, "expo-push", {}, { jobId });
  job.validateOptions({ data: "{}" });
};

test("idempotent push job IDs are stable, bounded, and BullMQ-safe", () => {
  const key = "admin-order-status:order-123:Processed:execution-456";
  const jobId = pushNotificationJobId(key);

  assert.equal(jobId, pushNotificationJobId(key));
  assert.match(jobId, /^push-[a-f0-9]{32}$/);
  assert.equal(jobId.includes(":"), false);
  assert.doesNotThrow(() => validateJobId(jobId));
});

test("different order status updates get distinct push job IDs", () => {
  assert.notEqual(
    pushNotificationJobId("order-123:Processed:execution-456"),
    pushNotificationJobId("order-123:Shipped:execution-456"),
  );
});
