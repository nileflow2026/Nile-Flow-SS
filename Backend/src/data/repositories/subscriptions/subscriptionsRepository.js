"use strict";

const BaseRepository = require("../baseRepository");
const { env } = require("../../../env");

class SubscriptionsRepository extends BaseRepository {
  constructor(db) {
    super(db, env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID, "SUBSCRIPTIONS");
  }

  async renewSubscription(subscriptionId, renewalPayload) {
    return this.update(subscriptionId, {
      ...renewalPayload,
      renewedAt: new Date().toISOString(),
    });
  }

  async getActiveSubscriptionsForUser(userId, limit = 50, offset = 0) {
    return this.list([`userId=${userId}`, "status=active"], limit, offset);
  }
}

module.exports = SubscriptionsRepository;
