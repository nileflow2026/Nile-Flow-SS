/**
 * OrderPolicies — Authorization and ownership enforcement for orders.
 *
 * Every access control check for order resources goes through this module.
 * This is the only place where "who can do what" is defined.
 *
 * @module orders/OrderPolicies
 */

'use strict';

// ── Role constants ───────────────────────────────────────────────────────────

const ROLES = Object.freeze({
  CUSTOMER: 'customer',
  VENDOR: 'vendor',
  ADMIN: 'admin',
  RIDER: 'rider',
  STAFF: 'staff',
});

/**
 * Check if the authenticated user owns the order.
 *
 * @param {object} order   — Order document from Appwrite
 * @param {object} user    — Authenticated user info { userId, role }
 * @returns {boolean}
 */
function isOwner(order, user) {
  if (!order || !user) return false;
  const orderUserId = order.userId || order.users;
  return String(orderUserId) === String(user.userId);
}

/**
 * Check if a user can view a specific order.
 *
 * Customers can view their own orders.
 * Vendors can view orders containing their products.
 * Admins can view all orders.
 *
 * @param {object} order
 * @param {object} user
 * @returns {boolean}
 */
function canView(order, user) {
  if (!order || !user) return false;

  // Admins can view everything
  if (user.role === 'admin' || user.role === 'staff') return true;

  // Customers can view their own
  if (user.role === 'customer' && isOwner(order, user)) return true;

  // Vendors check is done at the service level (order must contain their products)
  if (user.role === 'vendor') return true; // Actual filtering is done in the vendor query

  return false;
}

/**
 * Check if a user can update order status.
 *
 * @param {object} order
 * @param {object} user
 * @returns {boolean}
 */
function canUpdateStatus(order, user) {
  if (!order || !user) return false;

  // Admins can always update
  if (user.role === 'admin' || user.role === 'staff') return true;

  // Vendors can update status on orders containing their products
  if (user.role === 'vendor') return true; // Product ownership is verified in the service

  return false;
}

/**
 * Check if a user can cancel an order.
 *
 * @param {object} order
 * @param {object} user
 * @returns {boolean}
 */
function canCancel(order, user) {
  if (!order || !user) return false;

  // Customer can cancel their own order
  if (user.role === 'customer' && isOwner(order, user)) return true;

  // Admins can cancel any order
  if (user.role === 'admin' || user.role === 'staff') return true;

  return false;
}

/**
 * Check if a user can request cancellation of an order.
 *
 * @param {object} order
 * @param {object} user
 * @returns {boolean}
 */
function canRequestCancellation(order, user) {
  if (!order || !user) return false;
  return isOwner(order, user);
}

/**
 * Check if a user can view vendor-specific order data.
 *
 * @param {object} vendor  — Vendor document
 * @param {Array} vendorProductIds  — Array of product IDs belonging to vendor
 * @param {object} order
 * @returns {boolean}
 */
function vendorHasOrderProducts(vendorProductIds, order) {
  if (!vendorProductIds || vendorProductIds.length === 0) return false;
  if (!order || !order.items) return false;

  try {
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    return items.some((item) => vendorProductIds.includes(item.productId));
  } catch {
    return false;
  }
}

/**
 * Filter an order's items to only show those belonging to a specific vendor.
 *
 * @param {object} order
 * @param {Array} vendorProductIds
 * @returns {object} — Order with only vendor's items, and recalculated amount
 */
function filterOrderForVendor(order, vendorProductIds) {
  try {
    const items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    const vendorItems = items.filter((item) => vendorProductIds.includes(item.productId));
    const vendorAmount = vendorItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

    return {
      ...order,
      items: vendorItems,
      amount: vendorAmount,
      // Keep original total for reference
      originalTotalAmount: order.amount,
    };
  } catch {
    return order;
  }
}

module.exports = {
  ROLES,
  isOwner,
  canView,
  canUpdateStatus,
  canCancel,
  canRequestCancellation,
  vendorHasOrderProducts,
  filterOrderForVendor,
};
