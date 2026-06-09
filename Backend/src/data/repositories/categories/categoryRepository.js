"use strict";

const BaseRepository = require("../baseRepository");
const { env } = require("../../../env");
const { Query } = require("node-appwrite");

class CategoryRepository extends BaseRepository {
  constructor(db) {
    super(db, env.APPWRITE_CATEGORIES_COLLECTION_ID || "categories", "CATALOG");
  }

  async getAll() {
    return this.list([], 50, 0, "sortOrder", "ASC");
  }

  async getBySlug(slug) {
    const result = await this.list([Query.equal("slug", slug)], 1, 0);
    return result?.documents?.[0] || null;
  }
}

module.exports = CategoryRepository;
