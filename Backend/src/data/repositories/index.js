"use strict";

const NotificationRepository = require("./notificationRepository");
const OrdersRepository = require("./orders/ordersRepository");
const PaymentsRepository = require("./payments/paymentsRepository");
const LoyaltyRepository = require("./loyalty/loyaltyRepository");
const VendorRepository = require("./vendors/vendorRepository");
const SubscriptionsRepository = require("./subscriptions/subscriptionsRepository");
const ProductRepository = require("./products/productRepository");
const UserRepository = require("./users/userRepository");
const CategoryRepository = require("./categories/categoryRepository");
const ContentRepository = require("./content/contentRepository");
const SettingsRepository = require("./settings/settingsRepository");

module.exports = {
  NotificationRepository,
  OrdersRepository,
  PaymentsRepository,
  LoyaltyRepository,
  VendorRepository,
  SubscriptionsRepository,
  ProductRepository,
  UserRepository,
  CategoryRepository,
  ContentRepository,
  SettingsRepository,
};
