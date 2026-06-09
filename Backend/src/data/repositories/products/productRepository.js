"use strict";

const BaseRepository = require("../baseRepository");
const { env } = require("../../../env");
const { ID, Query } = require("node-appwrite");

class ProductRepository extends BaseRepository {
  constructor(db) {
    super(db, env.APPWRITE_PRODUCT_COLLECTION_ID || "products", "CATALOG");
  }

  async getFeatured(limit = 20) {
    return this.list(
      [
        Query.equal("status", "approved"),
        Query.equal("featured", true),
        Query.orderDesc("$createdAt"),
      ],
      limit,
      0,
      "$createdAt",
      "DESC",
    );
  }

  async getByCategory(category, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return this.list(
      [Query.equal("category", category), Query.equal("status", "approved")],
      limit,
      offset,
      "$createdAt",
      "DESC",
    );
  }

  async getDetail(productId) {
    return this.get(productId);
  }

  async search(query, page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return this.list(
      [Query.search("name", query), Query.equal("status", "approved")],
      limit,
      offset,
      "$createdAt",
      "DESC",
    );
  }

  async getPremiumDeals(limit = 10) {
    return this.list(
      [
        Query.equal("premiumDeal", true),
        Query.equal("status", "approved"),
        Query.orderDesc("$createdAt"),
      ],
      limit,
      0,
      "$createdAt",
      "DESC",
    );
  }

  async getTrending(limit = 10) {
    return this.list(
      [Query.equal("status", "approved"), Query.orderDesc("viewCount")],
      limit,
      0,
      "viewCount",
      "DESC",
    );
  }
}

module.exports = ProductRepository;
