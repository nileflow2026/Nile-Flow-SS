"use strict";

/**
 * Nile Flow — Repository Factory
 *
 * Centralized factory for creating cached, instrumented repository instances.
 * This is the single point of integration where:
 *   - The instrumented Appwrite DB is injected
 *   - The cachedRepository `withCache()` wrapper is applied
 *   - All repositories are instantiated with the correct collection IDs
 *
 * Usage:
 *   const { productRepo, userRepo } = require('./repositoryFactory');
 *   const products = await productRepo.getFeatured(10);
 *
 * Every service, controller, and route should use this factory
 * instead of importing raw repositories or raw Appwrite db.
 */

const { db, instrumentedDb } = require("../../../services/appwriteService");
const { withCache } = require("../../cache/cachedRepository");
const { env } = require("../../env");

const repositories = {};

/**
 * Lazy-initialize a repository, wrapping it with caching.
 */
function getRepo(name, RepositoryClass, collectionId) {
  if (!repositories[name]) {
    const rawRepo = new RepositoryClass(instrumentedDb || db);
    // Wrap with transparent caching
    repositories[name] = withCache(rawRepo, collectionId);
  }
  return repositories[name];
}

/**
 * Get a cached repository instance by name.
 * All repositories auto-initialize on first access.
 */
function getRepository(name) {
  return repositories[name] || null;
}

/**
 * Get all registered repositories.
 */
function getAllRepositories() {
  return { ...repositories };
}

/**
 * Preload all repositories (optional — call on startup to warm up).
 */
function initializeAll() {
  const { env } = require("../../env");

  // Product Repositories
  const {
    default: ProductRepository,
  } = require("./products/productRepository");
  const { default: UserRepository } = require("./users/userRepository");
  const { default: OrdersRepository } = require("./orders/ordersRepository");
  const { default: VendorRepository } = require("./vendors/vendorRepository");
  const {
    default: CategoryRepository,
  } = require("./categories/categoryRepository");
  const {
    default: SubscriptionsRepository,
  } = require("./subscriptions/subscriptionsRepository");
  const {
    default: PaymentsRepository,
  } = require("./payments/paymentsRepository");
  const {
    default: SettingsRepository,
  } = require("./settings/settingsRepository");
  const { default: ContentRepository } = require("./content/contentRepository");
  const { default: LoyaltyRepository } = require("./loyalty/loyaltyRepository");
  const {
    default: NotificationRepository,
  } = require("./notificationRepository");

  getRepo("product", ProductRepository, env.APPWRITE_PRODUCT_COLLECTION_ID);
  getRepo("user", UserRepository, env.APPWRITE_USER_COLLECTION_ID);
  getRepo("order", OrdersRepository, env.APPWRITE_ORDERS_COLLECTION_ID);
  getRepo("vendor", VendorRepository, env.APPWRITE_VENDORS_COLLECTION_ID);
  getRepo(
    "category",
    CategoryRepository,
    env.APPWRITE_CATEGORIES_COLLECTION_ID,
  );
  getRepo(
    "subscription",
    SubscriptionsRepository,
    env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
  );
  getRepo("payment", PaymentsRepository, env.APPWRITE_PAYMENTS_COLLECTION_ID);
  getRepo("setting", SettingsRepository, env.APPWRITE_SETTINGS_COLLECTION_ID);
  getRepo("content", ContentRepository, env.APPWRITE_CONTENT_COLLECTION_ID);
  getRepo("loyalty", LoyaltyRepository, env.APPWRITE_NILE_MILES_COLLECTION_ID);
  getRepo(
    "notification",
    NotificationRepository,
    env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
  );

  console.log(
    "[RepositoryFactory] ✅ All repositories initialized with caching",
  );
}

// ── Lazy accessors ───────────────────────────────────────────────────────────

const { default: ProductRepository } = require("./products/productRepository");
const { default: UserRepository } = require("./users/userRepository");
const { default: OrdersRepository } = require("./orders/ordersRepository");
const { default: VendorRepository } = require("./vendors/vendorRepository");
const {
  default: CategoryRepository,
} = require("./categories/categoryRepository");
const {
  default: SubscriptionsRepository,
} = require("./subscriptions/subscriptionsRepository");
const {
  default: PaymentsRepository,
} = require("./payments/paymentsRepository");
const {
  default: SettingsRepository,
} = require("./settings/settingsRepository");
const { default: ContentRepository } = require("./content/contentRepository");
const { default: LoyaltyRepository } = require("./loyalty/loyaltyRepository");
const { default: NotificationRepository } = require("./notificationRepository");

const productRepo = () =>
  getRepo("product", ProductRepository, env.APPWRITE_PRODUCT_COLLECTION_ID);
const userRepo = () =>
  getRepo("user", UserRepository, env.APPWRITE_USER_COLLECTION_ID);
const orderRepo = () =>
  getRepo("order", OrdersRepository, env.APPWRITE_ORDERS_COLLECTION_ID);
const vendorRepo = () =>
  getRepo("vendor", VendorRepository, env.APPWRITE_VENDORS_COLLECTION_ID);
const categoryRepo = () =>
  getRepo(
    "category",
    CategoryRepository,
    env.APPWRITE_CATEGORIES_COLLECTION_ID,
  );
const subscriptionRepo = () =>
  getRepo(
    "subscription",
    SubscriptionsRepository,
    env.APPWRITE_SUBSCRIPTIONS_COLLECTION_ID,
  );
const paymentRepo = () =>
  getRepo("payment", PaymentsRepository, env.APPWRITE_PAYMENTS_COLLECTION_ID);
const settingRepo = () =>
  getRepo("setting", SettingsRepository, env.APPWRITE_SETTINGS_COLLECTION_ID);
const contentRepo = () =>
  getRepo("content", ContentRepository, env.APPWRITE_CONTENT_COLLECTION_ID);
const loyaltyRepo = () =>
  getRepo("loyalty", LoyaltyRepository, env.APPWRITE_NILE_MILES_COLLECTION_ID);
const notificationRepo = () =>
  getRepo(
    "notification",
    NotificationRepository,
    env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
  );

module.exports = {
  // Factory
  getRepo,
  getRepository,
  getAllRepositories,
  initializeAll,

  // Lazy accessors (these always return the cached singleton)
  productRepo,
  userRepo,
  orderRepo,
  vendorRepo,
  categoryRepo,
  subscriptionRepo,
  paymentRepo,
  settingRepo,
  contentRepo,
  loyaltyRepo,
  notificationRepo,
};
