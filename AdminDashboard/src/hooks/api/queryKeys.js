/**
 * Nile Flow — AdminDashboard Query Key Registry
 */

export const queryKeys = {
  // ── Dashboard Summary ──────────────────────────────────────────────────────
  dashboard: {
    all: () => ["dashboard"],
    summary: () => ["dashboard", "summary"],
    metrics: () => ["dashboard", "metrics"],
  },

  // ── Orders ─────────────────────────────────────────────────────────────────
  orders: {
    all: () => ["orders"],
    list: (page = 1, status) => ["orders", "list", page, status ?? "all"],
    detail: (id) => ["orders", "detail", id],
    cancelled: (page = 1) => ["orders", "cancelled", page],
    cancellationRequests: (page = 1) => [
      "orders",
      "cancellationRequests",
      page,
    ],
  },

  // ── Users ──────────────────────────────────────────────────────────────────
  users: {
    all: () => ["users"],
    list: (page = 1, search) => ["users", "list", page, search ?? ""],
    detail: (id) => ["users", "detail", id],
    premiumUsers: (page = 1) => ["users", "premium", page],
  },

  // ── Vendors ────────────────────────────────────────────────────────────────
  vendors: {
    all: () => ["vendors"],
    list: (page = 1) => ["vendors", "list", page],
    detail: (id) => ["vendors", "detail", id],
    pending: (page = 1) => ["vendors", "pending", page],
  },

  // ── Products ───────────────────────────────────────────────────────────────
  products: {
    all: () => ["products"],
    list: (page = 1) => ["products", "list", page],
    detail: (id) => ["products", "detail", id],
    flagged: (page = 1) => ["products", "flagged", page],
  },

  // ── Revenue / Financial ────────────────────────────────────────────────────
  revenue: {
    all: () => ["revenue"],
    summary: (period) => ["revenue", "summary", period],
    byVendor: (vendorId, period) => ["revenue", "vendor", vendorId, period],
    payouts: (page = 1) => ["revenue", "payouts", page],
  },

  // ── Riders ─────────────────────────────────────────────────────────────────
  riders: {
    all: () => ["riders"],
    list: (page = 1) => ["riders", "list", page],
    detail: (id) => ["riders", "detail", id],
    active: () => ["riders", "active"],
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications: {
    all: () => ["notifications"],
    list: (page = 1) => ["notifications", "list", page],
  },

  // ── System / Config ────────────────────────────────────────────────────────
  system: {
    all: () => ["system"],
    settings: () => ["system", "settings"],
    healthCheck: () => ["system", "health"],
  },

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  auditLogs: {
    all: () => ["auditLogs"],
    list: (page = 1, action) => ["auditLogs", "list", page, action ?? "all"],
  },
};
