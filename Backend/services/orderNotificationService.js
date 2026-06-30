/**
 * Order Notification Service
 *
 * Sends Appwrite Messaging notifications (SMS, Email, Push) when an order
 * is successfully placed. Dispatches to:
 *   1. The customer who placed the order
 *   2. All admin users
 *   3. Each vendor whose products are in the order
 *
 * All operations are fire-and-forget (setImmediate) — never block callers.
 */

const { Query } = require("node-appwrite");
const { instrumentedDb } = require("./appwriteService");
const { notifyUser: sendAppwriteNotify } = require("./appwriteMessagingService");
const { env } = require("../src/env");

/**
 * Send order success notifications to customer, admins, and vendors.
 *
 * @param {object} options
 * @param {string} options.orderId         - The order document ID
 * @param {string} options.customerName    - Customer's display name
 * @param {string} options.amount          - Order total (formatted, e.g. "KES 1500")
 * @param {string} options.paymentMethod   - Payment method used
 * @param {Array}  options.cartItems       - Array of cart items with vendorId, name
 * @param {string} options.customerUserId  - Customer's Appwrite user ID
 * @param {string} options.customerEmail   - Customer email
 * @param {string} [options.customerPhone] - Customer phone (optional)
 */
async function sendOrderSuccessNotifications({
  orderId,
  customerName,
  amount,
  paymentMethod,
  cartItems,
  customerUserId,
  customerEmail,
  customerPhone,
}) {
  setImmediate(async () => {
    try {
      const orderTag = orderId.slice(-8);

      // 1. Notify the customer
      await sendAppwriteNotify({
        userId: customerUserId,
        email: customerEmail,
        phone: customerPhone,
        emailSubject: `🎉 Order #${orderTag} Confirmed — Nile Flow`,
        emailContent: `<h2>Order Confirmed!</h2>
          <p>Hi <strong>${customerName}</strong>,</p>
          <p>Your order has been placed successfully.</p>
          <ul>
            <li><strong>Order ID:</strong> ${orderId}</li>
            <li><strong>Amount:</strong> ${amount}</li>
            <li><strong>Payment:</strong> ${paymentMethod}</li>
            <li><strong>Items:</strong> ${(cartItems || []).length}</li>
          </ul>
          <p>You will receive updates as your order progresses.</p>`,
        smsContent: `NileFlow: Order #${orderTag} confirmed! ${paymentMethod} — ${amount}. Track it in the app.`,
        pushTitle: "🎉 Order Confirmed!",
        pushBody: `Order #${orderTag} of ${amount} via ${paymentMethod} placed successfully.`,
        pushData: { orderId, type: "order_confirmed" },
      });

      // 2. Notify admin(s)
      const admins = await instrumentedDb.listDocuments(
        env.APPWRITE_DATABASE_ID,
        env.APPWRITE_ADMIN_COLLECTION_ID,
        [Query.equal("role", "admin"), Query.limit(10)],
      );

      for (const admin of admins.documents) {
        await sendAppwriteNotify({
          userId: admin.$id,
          email: admin.email,
          phone: admin.phone,
          emailSubject: `🛒 New Order #${orderTag} — ${customerName}`,
          emailContent: `<h2>New Order Received</h2>
            <p>A new order has been placed:</p>
            <ul>
              <li><strong>Order:</strong> ${orderId}</li>
              <li><strong>Customer:</strong> ${customerName}</li>
              <li><strong>Amount:</strong> ${amount}</li>
              <li><strong>Payment:</strong> ${paymentMethod}</li>
              <li><strong>Items:</strong> ${(cartItems || []).length}</li>
            </ul>
            <p><a href="${env.FRONTEND_URL || "https://admin.nileflowafrica.com"}/admin/orders/${orderId}" style="background:#16A34A;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">View Order</a></p>`,
          smsContent: `NileFlow Alert: New order #${orderTag} from ${customerName} — ${amount} via ${paymentMethod}.`,
          pushTitle: "🛒 New Order Received",
          pushBody: `${customerName} placed order #${orderTag} — ${amount} via ${paymentMethod}.`,
          pushData: { orderId, type: "new_order_admin" },
        });
      }

      // 3. Notify each vendor
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

          const vendorItems = (cartItems || []).filter(
            (item) => item.vendorId === vid,
          );
          const itemsList = vendorItems
            .map((i) => `${i.productName || i.name} x${i.quantity}`)
            .join(", ");

          await sendAppwriteNotify({
            userId: vendor.$id,
            email: vendor.email,
            phone: vendor.phone,
            emailSubject: `📦 New Order — ${itemsList}`,
            emailContent: `<h2>You Have a New Order!</h2>
              <p>A customer placed an order with your products:</p>
              <ul>
                <li><strong>Order:</strong> ${orderId}</li>
                <li><strong>Customer:</strong> ${customerName}</li>
                <li><strong>Items:</strong> ${itemsList}</li>
                <li><strong>Payment:</strong> ${paymentMethod}</li>
              </ul>
              <p><a href="${env.FRONTEND_URL || "https://vendor.nileflowafrica.com"}/vendor/orders/${orderId}" style="background:#16A34A;color:#fff;padding:10px 20px;border-radius:6px;text-decoration:none;">View Order</a></p>`,
            smsContent: `NileFlow: New order! ${customerName} ordered ${itemsList} — ${paymentMethod}.`,
            pushTitle: "📦 New Order Received",
            pushBody: `${customerName} ordered ${itemsList} via ${paymentMethod}.`,
            pushData: { orderId, type: "new_order_vendor" },
          });
        } catch (vendorErr) {
          console.warn(
            `[OrderNotification] Could not notify vendor ${vid}:`,
            vendorErr.message,
          );
        }
      }

      console.log(
        `[OrderNotification] Notifications dispatched for order ${orderId}`,
      );
    } catch (err) {
      console.warn("[OrderNotification] Error:", err.message);
    }
  });
}

module.exports = { sendOrderSuccessNotifications };
