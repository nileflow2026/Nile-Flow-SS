"use strict";

const { env } = require("../../env");
const { enforceRepositoryOwnership } = require("../ownership/runtimeEnforcement");
const { enforcePagination } = require("../governance/paginationRules");
const { enforceLimit } = require("../governance/queryLimits");
const { coalesce } = require("../coordination/requestCoalescer");

class BaseRepository {
  constructor(db, collectionId, domainName) {
    if (!db) {
      throw new Error("BaseRepository requires a database client");
    }
    if (!collectionId) {
      throw new Error("BaseRepository requires a collectionId");
    }
    if (!domainName) {
      throw new Error("BaseRepository requires a domainName for ownership enforcement");
    }

    enforceRepositoryOwnership({ domainName, collectionId, sourceFile: __filename });

    this.db = db;
    this.collectionId = collectionId;
    this.domainName = domainName;
  }

  async create(documentId, payload) {
    return this.db.createDocument(
      env.APPWRITE_DATABASE_ID,
      this.collectionId,
      documentId,
      payload,
    );
  }

  async get(documentId) {
    return coalesce(
      "getDocument",
      this.collectionId,
      [documentId],
      () =>
        this.db.getDocument(
          env.APPWRITE_DATABASE_ID,
          this.collectionId,
          documentId,
        ),
    );
  }

  async list(filters = [], limit = 25, offset = 0, orderField = "$createdAt", orderType = "DESC") {
    enforcePagination(limit, offset);
    enforceLimit(limit, "list");

    return coalesce(
      "listDocuments",
      this.collectionId,
      { filters, limit, offset, orderField, orderType },
      () =>
        this.db.listDocuments(
          env.APPWRITE_DATABASE_ID,
          this.collectionId,
          filters,
          limit,
          offset,
          orderField,
          orderType,
        ),
    );
  }

  async update(documentId, payload) {
    return this.db.updateDocument(
      env.APPWRITE_DATABASE_ID,
      this.collectionId,
      documentId,
      payload,
    );
  }

  async delete(documentId) {
    return this.db.deleteDocument(
      env.APPWRITE_DATABASE_ID,
      this.collectionId,
      documentId,
    );
  }
}

module.exports = BaseRepository;
