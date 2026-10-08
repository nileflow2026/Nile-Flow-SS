"use strict";

const eventPushJobId = (receiptId) => `push-event-${receiptId}`;

const eventPushRecoveryJobId = (receiptId, now = Date.now()) =>
  `push-event-${receiptId}-recovery-${Math.floor(now / 30000)}`;

module.exports = { eventPushJobId, eventPushRecoveryJobId };
