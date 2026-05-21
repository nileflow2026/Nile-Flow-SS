/**
 * Nile Flow — Mobileapp Query Key Registry
 *
 * Mirrors Website/src/hooks/api/queryKeys.js.
 * Keep both files in sync when adding new domains.
 */

export const queryKeys = {
  homeFeed: {
    all: () => ["homeFeed"],
    feed: () => ["homeFeed", "feed"],
  },

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

  categories: {
    all: () => ["categories"],
    list: () => ["categories", "list"],
  },

  orders: {
    all: () => ["orders"],
    list: (page = 1) => ["orders", "list", page],
    detail: (id) => ["orders", "detail", id],
    tracking: (id) => ["orders", "tracking", id],
  },

  user: {
    all: () => ["user"],
    profile: () => ["user", "profile"],
    addresses: () => ["user", "addresses"],
  },

  premium: {
    all: () => ["premium"],
    status: () => ["premium", "status"],
    deals: () => ["premium", "deals"],
    monthlySummary: (month) => ["premium", "monthlySummary", month],
  },

  notifications: {
    all: () => ["notifications"],
    list: (page = 1) => ["notifications", "list", page],
    count: () => ["notifications", "count"],
  },

  nileMiles: {
    all: () => ["nileMiles"],
    summary: () => ["nileMiles", "summary"],
  },

  cart: {
    all: () => ["cart"],
    items: () => ["cart", "items"],
  },

  africa: {
    all: () => ["africa"],
    facts: (category) => ["africa", "facts", category],
  },

  recommendations: {
    all: () => ["recommendations"],
    forUser: (userId) => ["recommendations", "user", userId],
  },
};
