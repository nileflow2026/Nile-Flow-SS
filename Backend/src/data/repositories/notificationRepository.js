"use strict";

const BaseRepository = require("./baseRepository");
const { env } = require("../../env");
const { ID } = require("node-appwrite");
const { assertDomainAccess } = require("../governance");

class NotificationRepository extends BaseRepository {
  constructor(db) {
    super(db, env.APPWRITE_NOTIFICATIONS_COLLECTION_ID, "NOTIFICATIONS");
    assertDomainAccess("NOTIFICATIONS", env.APPWRITE_NOTIFICATIONS_COLLECTION_ID);
  }

  async createNotification({ userId, message, title, notificationType, metadata = {} }) {
    if (!userId || !message) {
      throw new Error("Notification requires userId and message");
    }

    return this.create(ID.unique(), {
      userId,
      message,
      title: title || "Nile Flow",
      type: notificationType || "userNotification",
      read: false,
      metadata: JSON.stringify(metadata),
      createdAt: new Date().toISOString(),
    });
  }

  async createBatchNotifications(recipients, message, title, notificationType) {
    if (!Array.isArray(recipients) || recipients.length === 0) {
      throw new Error("Batch notifications require at least one recipient");
    }

    return Promise.allSettled(
      recipients.map((userId) =>
        this.create(ID.unique(), {
          userId,
          message,
          title: title || "Nile Flow",
          type: notificationType || "userNotification",
          read: false,
          metadata: "{}",
          createdAt: new Date().toISOString(),
        }),
      ),
    );
  }
}

module.exports = NotificationRepository;
