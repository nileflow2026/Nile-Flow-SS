/**
 * Nile Flow — Website Query Key Registry
 *
 * Centralized query key definitions. ALL useQuery/useMutation calls must
 * reference keys from this file — never inline string arrays.
 *
 * Convention:
 *   queryKeys.<domain>.<operation>(...params)
 *
 * This ensures:
 *   - Invalidation targets the correct queries
 *   - No accidental key mismatches across components
 *   - Refactoring is safe (one place to rename)
 */

export const queryKeys = {
  // ── Home Feed ──────────────────────────────────────────────────────────────
  homeFeed: {
    all: () => ["homeFeed"],
    feed: () => ["homeFeed", "feed"],
  },

  // ── Products ───────────────────────────────────────────────────────────────
  products: {
    all: () => ["products"],
    featured: () => ["products", "featured"],
    detail: (id) => ["products", "detail", id],
    reviews: (id, page = 1) => ["products", "reviews", id, page],
    byCategory: (category, page = 1) => [
      "products",
      "category",
      category,
      page,
    ],
    trending: () => ["products", "trending"],
    search: (query, page = 1) => ["products", "search", query, page],
    premiumDeals: () => ["products", "premiumDeals"],
  },

  // ── Categories ─────────────────────────────────────────────────────────────
  categories: {
    all: () => ["categories"],
    list: () => ["categories", "list"],
  },

  // ── Orders ─────────────────────────────────────────────────────────────────
  orders: {
    all: () => ["orders"],
    list: (page = 1) => ["orders", "list", page],
    detail: (id) => ["orders", "detail", id],
    tracking: (id) => ["orders", "tracking", id],
    cancelled: (page = 1) => ["orders", "cancelled", page],
  },

  // ── User / Auth ────────────────────────────────────────────────────────────
  user: {
    all: () => ["user"],
    profile: () => ["user", "profile"],
    addresses: () => ["user", "addresses"],
    preferences: () => ["user", "preferences"],
  },

  // ── Premium / Subscription ─────────────────────────────────────────────────
  premium: {
    all: () => ["premium"],
    status: () => ["premium", "status"],
    deals: () => ["premium", "deals"],
    monthlySummary: (month) => ["premium", "monthlySummary", month],
  },

  // ── Notifications ──────────────────────────────────────────────────────────
  notifications: {
    all: () => ["notifications"],
    list: (page = 1) => ["notifications", "list", page],
    count: () => ["notifications", "count"],
  },

  // ── Vendor ─────────────────────────────────────────────────────────────────
  vendor: {
    all: () => ["vendor"],
    profile: (id) => ["vendor", "profile", id],
    featured: () => ["vendor", "featured"],
  },

  // ── Discover Africa ────────────────────────────────────────────────────────
  africa: {
    all: () => ["africa"],
    facts: (category) => ["africa", "facts", category],
    proverbs: (country) => ["africa", "proverbs", country],
  },

  // ── Nile Miles ─────────────────────────────────────────────────────────────
  nileMiles: {
    all: () => ["nileMiles"],
    summary: () => ["nileMiles", "summary"],
    history: (page = 1) => ["nileMiles", "history", page],
  },

  // ── Cart ───────────────────────────────────────────────────────────────────
  cart: {
    all: () => ["cart"],
    items: () => ["cart", "items"],
  },

  // ── Exchange Rates ─────────────────────────────────────────────────────────
  exchangeRates: {
    all: () => ["exchangeRates"],
    base: (currency) => ["exchangeRates", currency],
  },

  // ── Recommendations ────────────────────────────────────────────────────────
  recommendations: {
    all: () => ["recommendations"],
    forUser: (userId) => ["recommendations", "user", userId],
  },
};
