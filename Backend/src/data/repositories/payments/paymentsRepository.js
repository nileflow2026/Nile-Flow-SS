"use strict";

const BaseRepository = require("../baseRepository");
const { env } = require("../../../env");

class PaymentsRepository extends BaseRepository {
  constructor(db) {
    super(db, env.APPWRITE_PAYMENTS_COLLECTION_ID, "PAYMENTS");
  }

  async recordPaymentAttempt(payload) {
    return this.create(payload.id || payload.requestId, payload);
  }

  async reconcileSettlement(paymentId, settlementData) {
    return this.update(paymentId, {
      status: "settled",
      settlementDetails: settlementData,
      settledAt: new Date().toISOString(),
    });
  }

  async markPaymentFailed(paymentId, reason) {
    return this.update(paymentId, {
      status: "failed",
      failureReason: reason,
      failedAt: new Date().toISOString(),
    });
  }
}

module.exports = PaymentsRepository;
