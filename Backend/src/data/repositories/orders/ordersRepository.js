"use strict";

const BaseRepository = require("../baseRepository");
const { env } = require("../../../env");
const { ID } = require("node-appwrite");

class OrdersRepository extends BaseRepository {
  constructor(db) {
    super(db, env.APPWRITE_ORDERS_COLLECTION_ID, "COMMERCE");
  }

  async getOrderById(orderId) {
    return this.get(orderId);
  }

  async listOrdersForVendor(vendorId, limit, offset) {
    return this.list([
      `vendorId=${vendorId}`,
    ], limit, offset);
  }

  async markOrderDelivered(orderId, deliveredAt = new Date().toISOString()) {
    return this.update(orderId, {
      status: "delivered",
      deliveredAt,
    });
  }

  async cancelOrder(orderId, cancellationReason) {
    return this.update(orderId, {
      status: "cancelled",
      cancellationReason,
      cancelledAt: new Date().toISOString(),
    });
  }
}

module.exports = OrdersRepository;
