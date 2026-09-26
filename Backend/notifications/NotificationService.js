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
const { render, adminNewOrderTemplate, vendorNewOrderTemplate } = require('./NotificationTemplates');
const { resolveChannels } = require('./NotificationPreferences');
const { dispatchAll, dispatchInApp } = require('./NotificationDispatcher');

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Send notifications for a business event to a single user.
 *
 * @param {string} event      — EVENT.* value
 * @param {object} payload    — Template variables (customerName, orderNumber, amount, etc.)
 * @param {object} recipient  — { userId, email, phone?, whatsapp?, username? }
 * @param {string} [idempotencyKey] — Stable key (e.g. `${orderId}:customer:${userId}:${event}`)
 */
async function notifyUser(event, payload, recipient, idempotencyKey = null) {
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
    recipientWhatsapp: recipient.whatsapp || recipient.phone,
    template,
    pushData: { event, type: event.split('.')[0] },
    source: 'NotificationService.notifyUser',
    idempotencyKey,
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
  const admins = await getAdmins();
  for (const admin of admins) {
    await notifyUser(event, payload, {
      userId: admin.$id,
      email: admin.email,
      phone: admin.phone,
      whatsapp: admin.whatsapp,
      username: admin.name || 'Admin',
    });
  }
}

/**
 * Resolve the vendor id carried on a cart/order item, tolerating the
 * different field names used across the Website, Mobile App, and legacy
 * checkout payloads (vendor_id is what the storefront actually sends).
 */
function getItemVendorId(item) {
  return item?.vendorId || item?.vendor_id || item?.vendor || null;
}

/**
 * Send notifications for a business event to ALL vendors whose products
 * are in the given cart/order items array. Each vendor only ever sees
 * their own line items — never another vendor's products or the full order.
 *
 * @param {Array} cartItems   — Array of order items ({ vendorId|vendor_id, productName, quantity, price })
 * @param {string} event      — EVENT.* value
 * @param {object} payload    — Shared context (orderId, orderNumber, paymentMethod, reviewUrlBase)
 */
async function notifyVendors(cartItems, event, payload) {
  const vendorIds = new Set(
    (cartItems || []).map(getItemVendorId).filter(Boolean),
  );

  for (const vid of vendorIds) {
    try {
      const vendor = await instrumentedDb.getDocument(
        env.VENDOR_DATABASE_ID,
        env.VENDOR_COLLECTION_ID,
        vid,
      );

      const vendorItems = (cartItems || []).filter((i) => getItemVendorId(i) === vid);
      const vendorSubtotal = vendorItems.reduce(
        (sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1),
        0,
      );
      const itemsList = vendorItems
        .map((i) => `${i.quantity || 1} x ${i.productName || i.name || 'Item'} — KES ${Math.round(Number(i.price) || 0)}`)
        .join(', ');
      const itemsHtml = vendorItems
        .map((i) => `<li>${i.quantity || 1} × ${i.productName || i.name || 'Item'} — KES ${Math.round(Number(i.price) || 0)}</li>`)
        .join('');

      const vendorPayload = {
        orderNumber: payload.orderNumber,
        orderId: payload.orderId,
        vendorName: vendor.name || vendor.storeName || vendor.businessName || 'Vendor',
        itemsList,
        itemsHtml,
        vendorSubtotal,
        paymentMethod: payload.paymentMethod,
        reviewUrl: `${env.FRONTEND_URL || 'https://vendor.nileflowafrica.com'}/vendor/orders/${payload.orderId}`,
      };

      const template = vendorNewOrderTemplate(vendorPayload);
      const idempotencyKey = `${payload.orderId}:vendor:${vendor.$id}:${event}`;

      await dispatchAll({
        event,
        channels: [CHANNEL.EMAIL, CHANNEL.SMS, CHANNEL.WHATSAPP, CHANNEL.PUSH],
        recipientId: vendor.$id,
        recipient: vendor.email,
        recipientPhone: vendor.phone,
        recipientWhatsapp: vendor.whatsapp || vendor.phone,
        template,
        pushData: { orderId: payload.orderId, type: 'new_order_vendor' },
        source: 'NotificationService.notifyVendors',
        idempotencyKey,
      });

      if (template.inApp) {
        await dispatchInApp({
          recipientId: vendor.$id,
          message: template.inApp,
          type: 'order',
          username: vendorPayload.vendorName,
          email: vendor.email,
        });
      }
    } catch (err) {
      console.warn(`[NotificationService] Could not notify vendor ${vid}:`, err.message);
    }
  }
}

// ── High-Level Business Event Handlers ───────────────────────────────────────

/**
 * Send all notifications for a new order.
 * Admin gets the full order; each vendor gets only their own line items.
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
  const customerId = order.userId || order.users;
  await notifyUser(EVENT.ORDER_CREATED, payload, {
    userId: customerId,
    email: order.customerEmail,
    phone: order.customerPhone || '',
    username: order.username,
  }, `${order.$id}:customer:${customerId}:${EVENT.ORDER_CREATED}`);

  // 2. Notify admins with admin-specific template (full order visibility)
  const adminPayload = {
    orderNumber: order.orderNumber,
    orderId: order.$id,
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
      channels: [CHANNEL.EMAIL, CHANNEL.SMS, CHANNEL.WHATSAPP, CHANNEL.PUSH],
      recipientId: admin.$id,
      recipient: admin.email,
      recipientPhone: admin.phone,
      recipientWhatsapp: admin.whatsapp || admin.phone,
      template: adminTemplate,
      pushData: { orderId: order.$id, type: 'new_order_admin' },
      source: 'NotificationService.orderCreated',
      idempotencyKey: `${order.$id}:admin:${admin.$id}:${EVENT.ORDER_CREATED}`,
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

  // 3. Notify vendors — each only sees their own products (never the full order)
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
