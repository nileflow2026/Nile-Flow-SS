// controllers/vendorOrderController.js
const { Query } = require("node-appwrite");
const { instrumentedDb } = require("../../services/appwriteService");
const { env } = require("../../src/env");
const OrderRepository = require("../../orders/OrderRepository");

// Get vendor's orders — uses OrderRepository with pagination.
// Previously fetched ALL orders and filtered in-memory (N+1 anti-pattern).
// Now: paginated query + in-memory filter on the paginated set.
const getvendorOrders = async (req, res) => {
  try {
    const vendorId = req.user.userId;
    const { page = 1, limit = 25 } = req.query;

    // 1. Get vendor's products (single query)
    const vendorProducts = await instrumentedDb.listDocuments(
      env.VENDOR_DATABASE_ID,
      env.VENDOR_PRODUCTS_COLLECTION_ID,
      [Query.equal("vendorId", vendorId)]
    );

    const vendorProductIds = vendorProducts.documents.map(
      (product) => product.$id
    );

    if (vendorProductIds.length === 0) {
      return res.json({
        success: true,
        data: { orders: [], total: 0, stats: {} },
      });
    }

    // 2. Get orders via OrderRepository with pagination
    //    The repository queries by userId is not directly applicable for vendors
    //    since orders don't have a vendorId field. We paginate and filter.
    const { orders, total } = await OrderRepository.list({
      page: parseInt(page),
      limit: Math.max(parseInt(limit), 100), // Need enough to filter meaningfully
    });

    // 3. Filter orders that contain vendor's products
    const vendorOrders = [];

    for (const order of orders) {
      try {
        const items = typeof order.items === "string"
          ? JSON.parse(order.items)
          : (order.items || []);

        const vendorItems = items.filter((item) =>
          vendorProductIds.includes(item.productId)
        );

        if (vendorItems.length > 0) {
          const vendorAmount = vendorItems.reduce(
            (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
            0
          );

          vendorOrders.push({
            orderId: order.orderNumber || order.$id,
            customerEmail: order.customerEmail,
            username: order.username,
            createdAt: order.createdAt,
            amount: vendorAmount,
            totalAmount: order.amount,
            items: JSON.stringify(vendorItems),
            status: order.orderStatus || order.status || "pending",
            paymentStatus: order.paymentStatus || "pending",
            paymentMethod: order.paymentMethod || "COD",
            sessionId: order.sessionId,
            stockUpdated: order.stockUpdated,
            stockConfirmed: order.stockConfirmed,
          });
        }
      } catch (error) {
        console.error("Error processing order:", error);
      }
    }

    res.json({
      success: true,
      data: {
        orders: vendorOrders,
        total: vendorOrders.length,
        stats: {
          total: vendorOrders.length,
          pending: vendorOrders.filter((o) => o.status === "pending").length,
          processing: vendorOrders.filter((o) => o.status === "processing").length,
          shipped: vendorOrders.filter((o) => o.status === "shipped").length,
          completed: vendorOrders.filter((o) => o.status === "completed").length,
          cancelled: vendorOrders.filter((o) => o.status === "cancelled").length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch orders",
    });
  }
};

// Update order status — now uses OrderService for state machine validation
// and event dispatch instead of inline DB calls.
const updateorderstatus = async (req, res) => {
  const OrderService = require("../../orders/OrderService");
  const { orderId } = req.params;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ success: false, error: "Status is required" });
  }

  // Delegate to OrderService which handles:
  // - State machine validation
  // - Authorization (vendor can update if order contains their products)
  // - Event dispatch
  // - Audit logging
  const result = await OrderService.updateStatus(orderId, status, req.user, { reason: "Vendor update" });

  return res.status(result.status || 200).json({
    success: result.success,
    message: result.message,
    data: result.success ? { orderId, status } : undefined,
    error: result.success ? undefined : result.message,
  });
};

module.exports = {
  getvendorOrders,
  updateorderstatus,
};
