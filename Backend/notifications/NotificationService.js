/**
 * NotificationService — Centralized entry point for all business event notifications.
 *
 * Every business event in Nile Flow triggers notifications through this service.
 * No controller should call Appwrite Messaging directly.
 *
 * Flow:
 *   Business Event → NotificationService.notify() → Template Render → Channel Resolve → Dispatch → Log
 *
 * @module notifications/NotificationService
 */

'use strict';

const { Query } = require('node-appwrite');
const { instrumentedDb } = require('../services/appwriteService');
const { env } = require('../src/env');
const { EVENT, CHANNEL } = require('./NotificationTypes');
const { render, adminNewOrderTemplate } = require('./NotificationTemplates');
const { resolveChannels } = require('./NotificationPreferences');
const { dispatchAll, dispatchInApp } = require('./NotificationDispatcher');

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Send notifications for a business event to a single user.
 *
 * @param {string} event      — EVENT.* value
 * @param {object} payload    — Template variables (customerName, orderNumber, amount, etc.)
 * @param {object} recipient  — { userId, email, phone?, username? }
 */
async function notifyUser(event, payload, recipient) {
  const channels = await resolveChannels(recipient.userId, event);
  if (channels.length === 0) return;

  const template = render(event, payload);
  if (!template) return;

  // Dispatch to all channels
  await dispatchAll({
    event,
    channels,
    recipientId: recipient.userId,
    recipient: recipient.email,
    recipientPhone: recipient.phone,
    template,
    pushData: { event, type: event.split('.')[0] },
    source: 'NotificationService.notifyUser',
  });

  // In-app notification
  if (channels.includes(CHANNEL.IN_APP) && template.inApp) {
    await dispatchInApp({
      recipientId: recipient.userId,
      message: template.inApp,
      type: event.split('.')[0],
      username: recipient.username,
      email: recipient.email,
    });
  }
}

/**
 * Send notifications for a business event to ALL admin users.
 *
 * @param {string} event    — EVENT.* value
 * @param {object} payload  — Template variables
 */
async function notifyAdmins(event, payload) {
  let admins;
  try {
    admins = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ADMIN_COLLECTION_ID,
      [Query.equal('role', 'admin'), Query.limit(10)],
    );
  } catch (err) {
    console.warn('[NotificationService] Failed to fetch admins:', err.message);
    return;
  }

  for (const admin of admins.documents) {
    await notifyUser(event, payload, {
      userId: admin.$id,
      email: admin.email,
      phone: admin.phone,
      username: admin.name || 'Admin',
    });
  }
}

/**
 * Send notifications for a business event to ALL vendors whose products
 * are in the given cart items array.
 *
 * @param {Array} cartItems   — Array of { vendorId, productName, quantity, price }
 * @param {string} event      — EVENT.* value
 * @param {object} payload    — Template variables (merged per-vendor)
 */
async function notifyVendors(cartItems, event, payload) {
  const vendorIds = new Set(
    (cartItems || []).map((item) => item.vendorId).filter(Boolean),
  );

  for (const vid of vendorIds) {
    try {
      const vendor = await instrumentedDb.getDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        vid,
      );

      const vendorItems = (cartItems || []).filter((i) => i.vendorId === vid);
      const itemList = vendorItems.map((i) => `${i.productName || i.name} x${i.quantity}`).join(', ');

      await notifyUser(event, {
        ...payload,
        itemsList: itemList,
        itemCount: vendorItems.length,
      }, {
        userId: vendor.$id,
        email: vendor.email,
        phone: vendor.phone,
        username: vendor.name || vendor.businessName || 'Vendor',
      });
    } catch (err) {
      console.warn(`[NotificationService] Could not notify vendor ${vid}:`, err.message);
    }
  }
}

// ── High-Level Business Event Handlers ───────────────────────────────────────

/**
 * Send all notifications for a new order.
 */
async function orderCreated(order, cartItems) {
  const payload = {
    orderId: order.$id,
    orderNumber: order.orderNumber,
    customerName: order.username || 'Customer',
    amount: order.amount,
    paymentMethod: order.paymentMethod,
    itemCount: (cartItems || []).length,
  };

  // 1. Notify customer
  await notifyUser(EVENT.ORDER_CREATED, payload, {
    userId: order.userId || order.users,
    email: order.customerEmail,
    phone: order.customerPhone || '',
    username: order.username,
  });

  // 2. Notify admins with admin-specific template
  const adminPayload = {
    orderNumber: order.orderNumber,
    customerName: order.username || 'Customer',
    amount: order.amount,
    paymentMethod: order.paymentMethod,
    itemCount: (cartItems || []).length,
    reviewUrl: `${env.FRONTEND_URL || 'https://admin.nileflowafrica.com'}/admin/orders/${order.$id}`,
  };

  const adminTemplate = adminNewOrderTemplate(adminPayload);
  const admins = await getAdmins();
  for (const admin of admins) {
    await dispatchAll({
      event: EVENT.ORDER_CREATED,
      channels: [CHANNEL.EMAIL, CHANNEL.PUSH],
      recipientId: admin.$id,
      recipient: admin.email,
      template: adminTemplate,
      pushData: { orderId: order.$id, type: 'new_order_admin' },
      source: 'NotificationService.orderCreated',
    });
    if (adminTemplate.inApp) {
      await dispatchInApp({
        recipientId: admin.$id,
        message: adminTemplate.inApp,
        type: 'order',
        username: admin.name || 'Admin',
        email: admin.email,
      });
    }
  }

  // 3. Notify vendors
  await notifyVendors(cartItems, EVENT.ORDER_CREATED, payload);
}

/**
 * Send notification for product submission (vendor → admin).
 */
async function productSubmitted({ vendorName, productName, category, price, reviewUrl }) {
  const payload = { vendorName, productName, category, price, reviewUrl };
  await notifyAdmins(EVENT.PRODUCT_SUBMITTED, {
    ...payload,
    vendorName,
    productName,
    category,
    price,
    reviewUrl,
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getAdmins() {
  try {
    const result = await instrumentedDb.listDocuments(
      env.APPWRITE_DATABASE_ID,
      env.APPWRITE_ADMIN_COLLECTION_ID,
      [Query.equal('role', 'admin'), Query.limit(10)],
    );
    return result.documents;
  } catch {
    return [];
  }
}

module.exports = {
  notifyUser,
  notifyAdmins,
  notifyVendors,
  orderCreated,
  productSubmitted,
};
