/**
 * NotificationTemplates — Reusable, parameterised templates for every business event.
 *
 * Never hardcode message strings in controllers. Always use these templates.
 * Supports localization-ready pattern (locale parameter for future i18n).
 *
 * @module notifications/NotificationTemplates
 */

'use strict';

const { EVENT } = require('./NotificationTypes');

// ── Helpers ──────────────────────────────────────────────────────────────────

function truncate(s, len = 50) { return s ? s.substring(0, len) : ''; }
function formatCurrency(amount, currency = 'KES') {
  const n = Number(amount) || 0;
  return `${currency} ${Math.round(n).toLocaleString()}`;
}

// ── Template Registry ───────────────────────────────────────────────────────
// Each template is a function(payload, locale?) => { subject, html?, text, sms, pushTitle, pushBody }

const TEMPLATES = Object.freeze({
  // ── Order Templates ──────────────────────────────────────────────────────

  [EVENT.ORDER_CREATED]: (p) => ({
    emailSubject: `🎉 Your Nile Flow Order ${p.orderNumber || ''} Has Been Received`,
    emailHtml: `<h2>Order Received!</h2>
      <p>Hi <strong>${p.customerName}</strong>,</p>
      <p>Your order has been successfully placed.</p>
      <ul>
        <li><strong>Order:</strong> ${p.orderNumber || p.orderId}</li>
        <li><strong>Amount:</strong> ${formatCurrency(p.amount)}</li>
        <li><strong>Payment:</strong> ${p.paymentMethod}</li>
        <li><strong>Items:</strong> ${p.itemCount || 0}</li>
      </ul>
      <p>We'll notify you every step of the way.</p>`,
    sms: `NileFlow: Order ${p.orderNumber || p.orderId} received. ${formatCurrency(p.amount)} via ${p.paymentMethod}. Track it in the app.`,
    whatsapp: `🎉 *Nile Flow* — Order ${p.orderNumber || p.orderId} received.
Amount: ${formatCurrency(p.amount)}
Payment: ${p.paymentMethod}
We'll notify you every step of the way.`,
    pushTitle: '🎉 Order Received!',
    pushBody: `Your order ${p.orderNumber || ''} of ${formatCurrency(p.amount)} has been placed successfully.`,
    inApp: `Order ${p.orderNumber || p.orderId} placed successfully.`,
  }),

  [EVENT.ORDER_CANCELLED]: (p) => ({
    emailSubject: `❌ Order ${p.orderNumber || p.orderId} Cancelled — Nile Flow`,
    emailHtml: `<h2>Order Cancelled</h2>
      <p>Hi <strong>${p.customerName}</strong>,</p>
      <p>Your order <strong>${p.orderNumber || p.orderId}</strong> has been cancelled.</p>
      ${p.reason ? `<p>Reason: ${p.reason}</p>` : ''}
      <p>If you have questions, contact support@nileflowafrica.com</p>`,
    sms: `NileFlow: Order ${p.orderNumber || p.orderId} has been cancelled.`,
    pushTitle: '❌ Order Cancelled',
    pushBody: `Order ${p.orderNumber || ''} has been cancelled.`,
    inApp: `Order ${p.orderNumber || p.orderId} cancelled.`,
  }),

  // ── Product Submission (Vendor → Admin) ──────────────────────────────────

  [EVENT.PRODUCT_SUBMITTED]: (p) => ({
    emailSubject: `🆕 New Product Submitted for Review — ${truncate(p.productName, 40)}`,
    emailHtml: `<h2>New Product Submission</h2>
      <p>A vendor has submitted a new product for review.</p>
      <ul>
        <li><strong>Vendor:</strong> ${p.vendorName}</li>
        <li><strong>Product:</strong> ${p.productName}</li>
        <li><strong>Category:</strong> ${p.category || 'N/A'}</li>
        <li><strong>Price:</strong> ${formatCurrency(p.price)}</li>
        <li><strong>Submitted:</strong> ${new Date().toLocaleDateString()}</li>
      </ul>
      <p><a href="${p.reviewUrl || '#'}" style="background:#16A34A;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Review Product</a></p>`,
    sms: `NileFlow: New product "${truncate(p.productName, 30)}" submitted by ${p.vendorName} for review.`,
    pushTitle: '🆕 New Product Submitted',
    pushBody: `${p.vendorName} submitted "${truncate(p.productName, 30)}" for review.`,
    inApp: `New product "${p.productName}" submitted by ${p.vendorName}.`,
  }),

  [EVENT.PRODUCT_APPROVED]: (p) => ({
    emailSubject: `✅ "${truncate(p.productName, 40)}" Approved — Nile Flow`,
    emailHtml: `<h2>Product Approved</h2>
      <p>Hi <strong>${p.vendorName}</strong>,</p>
      <p>Your product <strong>${p.productName}</strong> has been approved and is now live on Nile Flow.</p>
      <p><a href="${p.productUrl || '#'}">View your listing</a></p>`,
    pushTitle: '✅ Product Approved',
    pushBody: `"${truncate(p.productName, 30)}" is now live on Nile Flow.`,
    inApp: `"${p.productName}" approved and live.`,
  }),

  [EVENT.PRODUCT_REJECTED]: (p) => ({
    emailSubject: `❌ "${truncate(p.productName, 40)}" Needs Changes — Nile Flow`,
    emailHtml: `<h2>Product Requires Changes</h2>
      <p>Hi <strong>${p.vendorName}</strong>,</p>
      <p>Your product <strong>${p.productName}</strong> was not approved.</p>
      ${p.reason ? `<p><strong>Reason:</strong> ${p.reason}</p>` : ''}
      <p>Please update and resubmit.</p>`,
    inApp: `"${p.productName}" was not approved. ${p.reason ? `Reason: ${p.reason}` : ''}`,
  }),

  // ── Vendor Templates ─────────────────────────────────────────────────────

  [EVENT.VENDOR_WELCOME]: (p) => ({
    emailSubject: `🎉 Welcome to Nile Flow, ${p.vendorName}!`,
    emailHtml: `<h2>Welcome to Nile Flow!</h2>
      <p>Hi <strong>${p.vendorName}</strong>,</p>
      <p>Your vendor account is active. Start listing your products and reaching customers across Africa.</p>
      <p><a href="${p.dashboardUrl || '#'}" style="background:#16A34A;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Go to Dashboard</a></p>`,
    inApp: 'Welcome to Nile Flow! Your vendor account is active.',
  }),

  // ── Admin Notification Templates ─────────────────────────────────────────

  _adminNewOrder: (p) => ({
    emailSubject: `🛒 New Order ${p.orderNumber || ''} — ${p.customerName}`,
    emailHtml: `<h2>New Customer Order</h2>
      <ul>
        <li><strong>Order:</strong> ${p.orderNumber || p.orderId}</li>
        <li><strong>Customer:</strong> ${p.customerName}</li>
        <li><strong>Total:</strong> ${formatCurrency(p.amount)}</li>
        <li><strong>Payment:</strong> ${p.paymentMethod}</li>
        <li><strong>Items:</strong> ${p.itemCount || 0}</li>
      </ul>
      <p><a href="${p.reviewUrl || '#'}" style="background:#16A34A;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">View Order</a></p>`,
    sms: `NileFlow Alert: New order ${p.orderNumber || p.orderId} from ${p.customerName} — ${formatCurrency(p.amount)} via ${p.paymentMethod}.`,
    whatsapp: `🛒 *Nile Flow — New Order*
Order: ${p.orderNumber || p.orderId}
Customer: ${p.customerName}
Total: ${formatCurrency(p.amount)}
Payment: ${p.paymentMethod}
Items: ${p.itemCount || 0}`,
    pushTitle: '🛒 New Order Received',
    pushBody: `${p.customerName} placed an order — ${formatCurrency(p.amount)}.`,
    inApp: `New order ${p.orderNumber || ''} from ${p.customerName}.`,
  }),

  // ── Vendor Notification Template (multi-vendor safe — vendor's items only) ──

  _vendorNewOrder: (p) => ({
    emailSubject: `📦 New Order — ${truncate(p.itemsList, 60)}`,
    emailHtml: `<h2>You Have a New Order!</h2>
      <p>Hello <strong>${p.vendorName || 'Vendor'}</strong>,</p>
      <p>You've received a new order containing your product(s):</p>
      <ul>${p.itemsHtml || `<li>${p.itemsList || ''}</li>`}</ul>
      <p><strong>Vendor subtotal:</strong> ${formatCurrency(p.vendorSubtotal)}</p>
      <p><strong>Payment:</strong> ${p.paymentMethod || 'N/A'}</p>
      <p>Please open your Nile Flow Vendor Dashboard to manage this order.</p>
      <p><a href="${p.reviewUrl || '#'}" style="background:#16A34A;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">View Order</a></p>`,
    sms: `NileFlow: New order! Items: ${truncate(p.itemsList, 80)} — subtotal ${formatCurrency(p.vendorSubtotal)}.`,
    whatsapp: `📦 *Nile Flow — New Order*
Hello ${p.vendorName || 'Vendor'},
You received:
${p.itemsList || ''}
Vendor subtotal: ${formatCurrency(p.vendorSubtotal)}
Payment: ${p.paymentMethod || 'N/A'}
Open your Vendor Dashboard to manage this order.`,
    pushTitle: '📦 New Order Received',
    pushBody: `You received an order — ${truncate(p.itemsList, 60)}.`,
    inApp: `New order received: ${truncate(p.itemsList, 80)}.`,
  }),

  // ── Account Templates ────────────────────────────────────────────────────

  [EVENT.ACCOUNT_WELCOME]: (p) => ({
    emailSubject: `🎉 Welcome to Nile Flow, ${p.customerName}!`,
    emailHtml: `<h2>Welcome to Nile Flow!</h2>
      <p>Hi <strong>${p.customerName}</strong>,</p>
      <p>Your account is ready. Start exploring premium African products.</p>
      <p><a href="${p.shopUrl || '#'}" style="background:#16A34A;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">Start Shopping</a></p>`,
    inApp: 'Welcome to Nile Flow! Your account is ready.',
  }),

  [EVENT.LOGIN_ALERT]: (p) => ({
    emailSubject: `🔐 New Sign-In to Your Nile Flow Account`,
    emailHtml: `<h2>New Sign-In Detected</h2>
      <p>Hi ${p.customerName || 'there'},</p>
      <p>A new sign-in to your Nile Flow account was detected.</p>
      <ul>
        <li><strong>Time:</strong> ${new Date(p.timestamp || Date.now()).toLocaleString()}</li>
        <li><strong>IP:</strong> ${p.ip || 'Unknown'}</li>
        <li><strong>Device:</strong> ${p.userAgent || 'Unknown device'}</li>
      </ul>
      <p>If this wasn't you, please change your password immediately.</p>`,
    inApp: 'New sign-in detected on your account.',
  }),
});

// ── Public API ───────────────────────────────────────────────────────────────

/**
 * Get a compiled template for a given event.
 *
 * @param {string} event — One of EVENT.* values
 * @param {object} payload — Template variables
 * @returns {object|null} — { emailSubject, emailHtml?, sms?, pushTitle?, pushBody?, inApp? }
 */
function render(event, payload) {
  const fn = TEMPLATES[event];
  if (!fn) {
    console.warn(`[NotificationTemplates] No template for event: ${event}`);
    return null;
  }
  try {
    return fn(payload || {});
  } catch (err) {
    console.error(`[NotificationTemplates] Render error for ${event}:`, err.message);
    return null;
  }
}

/**
 * Get the admin new-order template (internal, not event-keyed).
 */
function adminNewOrderTemplate(payload) {
  return TEMPLATES._adminNewOrder(payload || {});
}

/**
 * Get the vendor new-order template (internal, not event-keyed).
 * Payload must only contain that vendor's own items (see NotificationService.notifyVendors).
 */
function vendorNewOrderTemplate(payload) {
  return TEMPLATES._vendorNewOrder(payload || {});
}

module.exports = {
  render,
  adminNewOrderTemplate,
  vendorNewOrderTemplate,
};
