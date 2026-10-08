"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const { Job } = require("bullmq");
const {
  campaignDeliveryJobId,
  campaignPageJobId,
} = require("../services/pushBroadcastJobIds");

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
  const job = new Job(queue, "push-broadcast", {}, { jobId });
  job.validateOptions({ data: "{}" });
};

test("push broadcast custom job IDs do not contain BullMQ reserved colons", () => {
  const campaignId = "campaign123";
  const deliveryId = "delivery456";
  const pageJobId = campaignPageJobId(campaignId, "cursor789");
  const firstPageJobId = campaignPageJobId(campaignId, null);
  const deliveryJobId = campaignDeliveryJobId(deliveryId, 1);

  assert.equal(pageJobId, "push-broadcast-campaign123-page-cursor789");
  assert.equal(firstPageJobId, "push-broadcast-campaign123-page-start");
  assert.equal(deliveryJobId, "push-broadcast-delivery-delivery456-1");
  assert.equal(pageJobId.includes(":"), false);
  assert.equal(firstPageJobId.includes(":"), false);
  assert.equal(deliveryJobId.includes(":"), false);
  assert.throws(
    () => validateJobId(`push-broadcast:${campaignId}:page:cursor789`),
    /Custom Id cannot contain :/,
  );
  assert.doesNotThrow(() => validateJobId(pageJobId));
  assert.doesNotThrow(() => validateJobId(firstPageJobId));
  assert.doesNotThrow(() => validateJobId(deliveryJobId));
});
