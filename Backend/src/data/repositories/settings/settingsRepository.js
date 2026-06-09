"use strict";

const BaseRepository = require("../baseRepository");
const { env } = require("../../../env");
const { Query } = require("node-appwrite");

class SettingsRepository extends BaseRepository {
  constructor(db) {
    super(
      db,
      env.APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID || "settings",
      "AUTH",
    );
  }

  async getPlatformSettings() {
    const result = await this.list([], 1, 0);
    return result?.documents?.[0] || null;
  }
}

module.exports = SettingsRepository;
