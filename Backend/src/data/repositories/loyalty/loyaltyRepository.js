"use strict";

const BaseRepository = require("../baseRepository");
const { env } = require("../../../env");
const { ID } = require("node-appwrite");

class LoyaltyRepository extends BaseRepository {
  constructor(db) {
    super(db, env.APPWRITE_NILE_MILES_COLLECTION_ID, "LOYALTY");
  }

  async awardMiles(userId, miles, metadata = {}) {
    const record = {
      userId,
      miles,
      metadata,
      awardedAt: new Date().toISOString(),
    };
    return this.create(ID.unique(), record);
  }

  async getMilesForUser(userId, limit = 50, offset = 0) {
    return this.list([`userId=${userId}`], limit, offset);
  }
}

module.exports = LoyaltyRepository;
