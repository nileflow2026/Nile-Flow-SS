"use strict";

const { Query } = require("node-appwrite");
const { logger } = require("../../src/lib/logger");

const DEFAULT_PAGE_SIZE = 24;
const MAX_PAGE_SIZE = 100;
const CATEGORY_CACHE_TTL_MS = 60_000;

const PUBLIC_BUSINESS_FIELDS = [
  "$id",
  "$createdAt",
  "name",
  "storeName",
  "storeDescription",
  "category",
  "location",
  "city",
  "country",
  "coverImage",
  "profileImage",
];

function parseDirectoryQuery(query = {}) {
  const pageValue = query.page ?? "1";
  const limitValue = query.limit ?? String(DEFAULT_PAGE_SIZE);
  const categoryValue = query.category;
  const page = Number(pageValue);
  const requestedLimit = Number(limitValue);

  if (
    typeof pageValue !== "string" ||
    !Number.isSafeInteger(page) ||
    page < 1 ||
    typeof limitValue !== "string" ||
    !Number.isSafeInteger(requestedLimit) ||
    requestedLimit < 1 ||
    (categoryValue !== undefined && typeof categoryValue !== "string")
  ) {
    return null;
  }
  if (!Number.isSafeInteger((page - 1) * Math.min(requestedLimit, MAX_PAGE_SIZE))) {
    return null;
  }

  const category = categoryValue?.trim();
  if (category && category.length > 100) return null;

  return {
    page,
    limit: Math.min(requestedLimit, MAX_PAGE_SIZE),
    category: category || null,
  };
}

function sanitizePublicBusiness(document) {
  if (!document || typeof document !== "object" || typeof document.$id !== "string") {
    return null;
  }

  const business = { id: document.$id };
  for (const field of PUBLIC_BUSINESS_FIELDS) {
    if (field === "$id" || field === "$createdAt") continue;
    const value = document[field];
    if (typeof value === "string" && value.trim()) {
      business[field] = value.trim();
    }
  }

  const createdAt = document.$createdAt || document.createdAt;
  if (typeof createdAt === "string" && createdAt) {
    business.createdAt = createdAt;
  }

  return business;
}

function createBusinessDirectoryController({
  database,
  configuration,
  queryBuilder = Query,
  log = logger,
} = {}) {
  let cachedCategories = null;
  let categoriesCachedAt = 0;

  function getDatabase() {
    return database || require("../../services/appwriteService").db;
  }

  function getConfiguration() {
    return configuration || require("../../src/env").env;
  }

  function isConfigured() {
    const currentConfiguration = getConfiguration();
    return Boolean(
      currentConfiguration.VENDOR_DATABASE_ID &&
      currentConfiguration.VENDOR_COLLECTION_ID,
    );
  }

  async function getActiveCategories() {
    if (cachedCategories && Date.now() - categoriesCachedAt < CATEGORY_CACHE_TTL_MS) {
      return cachedCategories;
    }

    const categories = new Set();
    const batchSize = MAX_PAGE_SIZE;
    let offset = 0;
    let total = 0;

    do {
      const currentConfiguration = getConfiguration();
      const result = await getDatabase().listDocuments(
        currentConfiguration.VENDOR_DATABASE_ID,
        currentConfiguration.VENDOR_COLLECTION_ID,
        [
          queryBuilder.equal("isActive", true),
          queryBuilder.select(["category"]),
          queryBuilder.limit(batchSize),
          queryBuilder.offset(offset),
        ],
      );

      const documents = result.documents || [];
      total = result.total || 0;
      for (const document of documents) {
        if (typeof document.category === "string" && document.category.trim()) {
          categories.add(document.category.trim());
        }
      }
      offset += documents.length;
      if (documents.length === 0) break;
    } while (offset < total);

    cachedCategories = [...categories].sort((left, right) =>
      left.localeCompare(right, undefined, { sensitivity: "base" }),
    );
    categoriesCachedAt = Date.now();
    return cachedCategories;
  }

  async function listBusinesses(req, res) {
    const options = parseDirectoryQuery(req.query);
    if (!options) {
      return res.status(400).json({
        success: false,
        error: "Page, limit, or category is invalid",
      });
    }

    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        error: "Business directory is not configured",
      });
    }

    try {
      const currentConfiguration = getConfiguration();
      const queries = [
        queryBuilder.equal("isActive", true),
        queryBuilder.orderDesc("$createdAt"),
        queryBuilder.limit(options.limit),
        queryBuilder.offset((options.page - 1) * options.limit),
      ];
      if (options.category) {
        queries.push(queryBuilder.equal("category", options.category));
      }

      const [result, categories] = await Promise.all([
        getDatabase().listDocuments(
          currentConfiguration.VENDOR_DATABASE_ID,
          currentConfiguration.VENDOR_COLLECTION_ID,
          queries,
        ),
        getActiveCategories(),
      ]);

      const businesses = (result.documents || [])
        .filter((document) => document.isActive === true)
        .map(sanitizePublicBusiness)
        .filter(Boolean);
      const total = result.total || 0;
      const pagination = {
        page: options.page,
        limit: options.limit,
        total,
        totalPages: Math.ceil(total / options.limit),
      };

      return res.json({
        success: true,
        data: { businesses, categories, pagination },
        meta: pagination,
      });
    } catch (error) {
      log.error("Business directory read failed", { error: error.message });
      return res.status(500).json({
        success: false,
        error: "Failed to load businesses",
      });
    }
  }

  async function getBusiness(req, res) {
    const businessId = req.params.businessId;
    if (typeof businessId !== "string" || !businessId.trim()) {
      return res.status(400).json({
        success: false,
        error: "Business ID is required",
      });
    }

    if (!isConfigured()) {
      return res.status(503).json({
        success: false,
        error: "Business directory is not configured",
      });
    }

    try {
      const currentConfiguration = getConfiguration();
      const document = await getDatabase().getDocument(
        currentConfiguration.VENDOR_DATABASE_ID,
        currentConfiguration.VENDOR_COLLECTION_ID,
        businessId,
      );
      if (document.isActive !== true) {
        return res.status(404).json({
          success: false,
          error: "Business not found",
        });
      }

      const business = sanitizePublicBusiness(document);
      if (!business) {
        return res.status(404).json({
          success: false,
          error: "Business not found",
        });
      }

      return res.json({
        success: true,
        data: { business },
      });
    } catch (error) {
      if (error.code === 404) {
        return res.status(404).json({
          success: false,
          error: "Business not found",
        });
      }

      log.error("Business profile read failed", { error: error.message });
      return res.status(500).json({
        success: false,
        error: "Failed to load business",
      });
    }
  }

  return { listBusinesses, getBusiness };
}

const controller = createBusinessDirectoryController();

module.exports = {
  ...controller,
  createBusinessDirectoryController,
  parseDirectoryQuery,
  sanitizePublicBusiness,
};
