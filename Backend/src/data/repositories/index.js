"use strict";

const NotificationRepository = require("./notificationRepository");
const OrdersRepository = require("./orders/ordersRepository");
const PaymentsRepository = require("./payments/paymentsRepository");
const LoyaltyRepository = require("./loyalty/loyaltyRepository");
const VendorRepository = require("./vendors/vendorRepository");
const SubscriptionsRepository = require("./subscriptions/subscriptionsRepository");

module.exports = {
  NotificationRepository,
  OrdersRepository,
  PaymentsRepository,
  LoyaltyRepository,
  VendorRepository,
  SubscriptionsRepository,
};
