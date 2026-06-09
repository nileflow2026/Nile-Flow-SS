"use strict";

const BaseRepository = require("../baseRepository");
const { env } = require("../../../env");
const { ID, Query } = require("node-appwrite");

class UserRepository extends BaseRepository {
  constructor(db) {
    super(db, env.APPWRITE_USER_COLLECTION_ID || "users", "AUTH");
  }

  async getProfile(userId) {
    return this.get(userId);
  }

  async updateProfile(userId, data) {
    return this.update(userId, data);
  }

  async getPreferences(userId) {
    const doc = await this.get(userId);
    return doc?.preferences || doc?.prefs || {};
  }

  async updatePreferences(userId, prefs) {
    return this.update(userId, { preferences: prefs });
  }
}

module.exports = UserRepository;
