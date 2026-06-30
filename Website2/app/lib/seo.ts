/**
 * Nile Flow SEO Configuration
 * Per-page meta, structured data, and canonical URL helpers.
 * All pages use React Router SSR <Meta> — Googlebot sees the final HTML.
 */

export const SITE_NAME = "Nile Flow Africa";
export const SITE_URL: string =
  (typeof process !== "undefined" && (process.env as Record<string, string>)?.VITE_SITE_URL) ||
  "https://nileflowafrica.com";
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-image.png`;
export const TWITTER_HANDLE = "@NileFlowAfrica";

/** Route-level SEO metadata */
export interface RouteSeo {
  title: string;
  description: string;
  canonical?: string; // absolute path, e.g. "/shop"
  noindex?: boolean;
  type?: "website" | "product" | "article";
  ogImage?: string;
}

export const ROUTE_SEO: Record<string, RouteSeo> = {
  "/": {
    title: "Nile Flow Africa | Premium African E-commerce",
    description:
      "Shop premium African products, discover artisan stories, and experience authentic commerce from across Africa. Free shipping on premium orders.",
    canonical: "/",
    type: "website",
  },
  "/shop": {
    title: "Shop Authentic African Products | Nile Flow Africa",
    description:
      "Browse curated African products, crafts, fashion, and premium collections from trusted vendors across the continent.",
    canonical: "/shop",
  },
  products: {
    title: "Product Details | Nile Flow Africa",
    description:
      "View product details, pricing, reviews, and shipping info for this Nile Flow Africa listing.",
    type: "product",
  },
  category: {
    title: "Category Products | Nile Flow Africa",
    description:
      "Browse products in this category and discover quality African items from verified sellers.",
  },
  "/deals": {
    title: "Best Deals on African Products | Nile Flow Africa",
    description:
      "Explore limited-time deals and exclusive offers on authentic African products. Save big on premium marketplace finds.",
    canonical: "/deals",
  },
  "/search": {
    title: "Search African Products | Nile Flow Africa",
    description:
      "Search and discover curated African products tailored to your interests.",
    canonical: "/search",
    noindex: true,
  },
  "/about": {
    title: "About Nile Flow Africa",
    description:
      "Learn about Nile Flow Africa, our mission, and our commitment to authentic African commerce.",
    canonical: "/about",
  },
  "/contact": {
    title: "Contact Nile Flow Africa",
    description:
      "Contact Nile Flow Africa support for help with products, orders, and marketplace inquiries.",
    canonical: "/contact",
  },
  "/help": {
    title: "Help Center | Nile Flow Africa",
    description:
      "Find answers to frequently asked questions about orders, returns, payments, and account support.",
    canonical: "/help",
  },
  "/returns": {
    title: "Return Policy | Nile Flow Africa",
    description:
      "Read Nile Flow Africa's return and refund policy for marketplace purchases.",
    canonical: "/returns",
  },
  "/terms": {
    title: "Terms of Service | Nile Flow Africa",
    description:
      "Review Nile Flow Africa terms and conditions for using our marketplace platform.",
    canonical: "/terms",
  },
  "/privacy": {
    title: "Privacy Policy | Nile Flow Africa",
    description:
      "Understand how Nile Flow Africa collects, processes, and protects your personal data.",
    canonical: "/privacy",
  },
  "/discover-africa": {
    title: "Discover Africa | Nile Flow Africa",
    description:
      "Explore African culture, stories, and curated discoveries alongside authentic marketplace products.",
    canonical: "/discover-africa",
  },
  "/chronicles": {
    title: "African Chronicles | Nile Flow Africa",
    description:
      "Read inspiring African stories, heritage content, and community-driven chronicles.",
    canonical: "/chronicles",
  },
  "/premium": {
    title: "Premium Deals | Nile Flow Africa",
    description:
      "Unlock premium marketplace deals and special pricing for selected African products.",
    canonical: "/premium",
  },
  "/featured": {
    title: "Featured Products | Nile Flow Africa",
    description:
      "Shop trending and featured products selected by Nile Flow Africa.",
    canonical: "/featured",
  },
  "/careers": {
    title: "Careers | Nile Flow Africa",
    description:
      "Join Nile Flow Africa and help shape the future of African e-commerce.",
    canonical: "/careers",
  },
  "/marketplace": {
    title: "Marketplace | Nile Flow Africa",
    description:
      "Explore our marketplace of verified African vendors, artisans, and unique products.",
    canonical: "/marketplace",
  },
  "/sign-in": {
    title: "Sign In | Nile Flow Africa",
    description: "Access your Nile Flow Africa account.",
    canonical: "/sign-in",
    noindex: true,
  },
  "/sign-up": {
    title: "Create Account | Nile Flow Africa",
    description: "Create your Nile Flow Africa account to start shopping.",
    canonical: "/sign-up",
    noindex: true,
  },
  "/forgot-password": {
    title: "Forgot Password | Nile Flow Africa",
    description: "Reset your Nile Flow Africa account password.",
    canonical: "/forgot-password",
    noindex: true,
  },
  "/reset-password": {
    title: "Reset Password | Nile Flow Africa",
    description: "Set a new password for your Nile Flow Africa account.",
    canonical: "/reset-password",
    noindex: true,
  },
  "/cart": {
    title: "Your Cart | Nile Flow Africa",
    description: "Review items in your cart before checkout.",
    canonical: "/cart",
    noindex: true,
  },
  "/checkout": {
    title: "Checkout | Nile Flow Africa",
    description: "Complete your secure checkout on Nile Flow Africa.",
    canonical: "/checkout",
    noindex: true,
  },
  "/payment": {
    title: "Payment | Nile Flow Africa",
    description: "Complete your payment on Nile Flow Africa.",
    canonical: "/payment",
    noindex: true,
  },
  "/payment/success": {
    title: "Payment Successful | Nile Flow Africa",
    description: "Your payment was successful.",
    canonical: "/payment/success",
    noindex: true,
  },
  "/payment/cancelled": {
    title: "Payment Cancelled | Nile Flow Africa",
    description: "Your payment was cancelled.",
    canonical: "/payment/cancelled",
    noindex: true,
  },
  "/profile": {
    title: "My Profile | Nile Flow Africa",
    description: "Manage your Nile Flow Africa account profile.",
    canonical: "/profile",
    noindex: true,
  },
  "/orders": {
    title: "My Orders | Nile Flow Africa",
    description: "View and manage your Nile Flow Africa orders.",
    canonical: "/orders",
    noindex: true,
  },
  "/addresses": {
    title: "My Addresses | Nile Flow Africa",
    description: "Manage your saved delivery addresses.",
    canonical: "/addresses",
    noindex: true,
  },
  "/settings": {
    title: "Account Settings | Nile Flow Africa",
    description: "Manage your Nile Flow Africa account settings.",
    canonical: "/settings",
    noindex: true,
  },
  "/notifications": {
    title: "Notifications | Nile Flow Africa",
    description: "View your Nile Flow Africa notifications.",
    canonical: "/notifications",
    noindex: true,
  },
  "/miles": {
    title: "Nile Miles | Nile Flow Africa",
    description: "View your Nile Miles loyalty balance and history.",
    canonical: "/miles",
    noindex: true,
  },
  "/redeem": {
    title: "Redeem Points | Nile Flow Africa",
    description: "Redeem your loyalty points on Nile Flow Africa.",
    canonical: "/redeem",
    noindex: true,
  },
  "/currency": {
    title: "Currency Settings | Nile Flow Africa",
    description: "Set your preferred currency for shopping.",
    canonical: "/currency",
    noindex: true,
  },
  "/language": {
    title: "Language Settings | Nile Flow Africa",
    description: "Choose your preferred language.",
    canonical: "/language",
    noindex: true,
  },
  "/report-problem": {
    title: "Report a Problem | Nile Flow Africa",
    description: "Report an issue with your Nile Flow Africa account or order.",
    canonical: "/report-problem",
    noindex: true,
  },
  "/account-deletion": {
    title: "Account Deletion | Nile Flow Africa",
    description: "Request deletion of your Nile Flow Africa account.",
    canonical: "/account-deletion",
    noindex: true,
  },
  "/subscription-success": {
    title: "Subscription Confirmed | Nile Flow Africa",
    description: "Your premium subscription is now active.",
    canonical: "/subscription-success",
    noindex: true,
  },
  "/group-buying": {
    title: "Group Buying | Nile Flow Africa",
    description: "Join a group buy and save on authentic African products.",
    canonical: "/group-buying",
  },
};

/* ── Structured Data Helpers ───────────────────────────────────────────── */

export function buildOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/og-image.png`,
    description:
      "Nile Flow Africa is a premium African e-commerce marketplace connecting buyers with authentic products.",
    founder: {
      "@type": "Person",
      name: "Anthony Wai Chol",
      jobTitle: "Founder & CEO",
    },
  };
}

export function buildWebSiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${SITE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };
}

export function buildBreadcrumbSchema(pathname: string) {
  const segments = pathname.split("/").filter(Boolean);
  const itemListElement = [
    { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
  ];

  let currentPath = "";
  segments.forEach((segment, index) => {
    currentPath += `/${segment}`;
    const name = segment
      .replace(/[-_]/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    itemListElement.push({
      "@type": "ListItem",
      position: index + 2,
      name,
      item: `${SITE_URL}${currentPath}`,
    });
  });

  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement,
  };
}

export function buildProductSchema(product: {
  name: string;
  description: string;
  price: number;
  image?: string;
  sku?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.sku ?? undefined,
    image: product.image ?? `${SITE_URL}/og-image.png`,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "KES",
      availability: "https://schema.org/InStock",
    },
  };
}

/** Build a canonical URL from a path */
export function canonicalUrl(path: string): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_URL}${clean}`;
}

/** Humanize a path for fallback titles */
export function humanizePath(pathname: string): string {
  if (!pathname || pathname === "/") return SITE_NAME;
  const cleaned = pathname.replace(/^\//, "").replace(/[-_]/g, " ").trim();
  const words = cleaned
    .split("/")
    .flatMap((s) => s.split(" "))
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1));
  return `${words.join(" ")} | ${SITE_NAME}`;
}

/** Resolve SEO meta for a pathname */
export function resolveRouteMeta(
  pathname: string,
  overrides?: Partial<RouteSeo>
): RouteSeo {
  const staticMatch = ROUTE_SEO[pathname];
  if (staticMatch) {
    return { ...staticMatch, ...overrides };
  }
  // Dynamic route patterns
  if (pathname.startsWith("/products/")) {
    return { ...ROUTE_SEO.products, ...overrides };
  }
  if (pathname.startsWith("/categories/")) {
    return { ...ROUTE_SEO.category, ...overrides };
  }
  // Fallback
  return {
    title: humanizePath(pathname),
    description: `Explore ${humanizePath(pathname)} on Nile Flow Africa.`,
    ...overrides,
  };
}
