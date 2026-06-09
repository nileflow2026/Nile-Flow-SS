"use strict";

const BaseRepository = require("../baseRepository");
const { env } = require("../../../env");
const { Query } = require("node-appwrite");

class ContentRepository extends BaseRepository {
  constructor(db) {
    super(db, env.APPWRITE_CONTENT_COLLECTION_ID || "africanFacts", "CONTENT");
  }

  async getFeaturedFacts(limit = 5) {
    return this.list(
      [
        Query.equal("active", true),
        Query.equal("featured", true),
        Query.orderDesc("$createdAt"),
      ],
      limit,
      0,
      "$createdAt",
      "DESC",
    );
  }

  async getFactsByCategory(category, limit = 20, page = 1) {
    const offset = (page - 1) * limit;
    return this.list(
      [Query.equal("category", category), Query.equal("active", true)],
      limit,
      offset,
      "$createdAt",
      "DESC",
    );
  }

  async getProverbs(country, limit = 10) {
    return this.list(
      [Query.equal("country", country)],
      limit,
      0,
      "$createdAt",
      "DESC",
    );
  }
}

module.exports = ContentRepository;
