import { Link, Links, Meta, Outlet, Scripts, ScrollRestoration, ServerRouter, UNSAFE_withComponentProps, UNSAFE_withErrorBoundaryProps, isRouteErrorResponse, useLocation } from "react-router";
import { renderToString } from "react-dom/server";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect } from "react";
import * as Sentry from "@sentry/react";
import posthog from "posthog-js";
import { Menu, Search, ShoppingCart } from "lucide-react";
//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region app/entry.server.tsx
var entry_server_exports = /* @__PURE__ */ __exportAll({ default: () => handleRequest });
function handleRequest(request, responseStatusCode, responseHeaders, routerContext) {
	const html = renderToString(/* @__PURE__ */ jsx(ServerRouter, {
		context: routerContext,
		url: request.url
	}));
	responseHeaders.set("Content-Type", "text/html; charset=utf-8");
	responseHeaders.set("Content-Length", String(Buffer.byteLength(html)));
	return new Response(html, {
		status: responseStatusCode,
		headers: responseHeaders
	});
}
//#endregion
//#region app/lib/seo.ts
/**
* Nile Flow SEO Configuration
* Per-page meta, structured data, and canonical URL helpers.
* All pages use React Router SSR <Meta> — Googlebot sees the final HTML.
*/
var SITE_NAME = "Nile Flow Africa";
var SITE_URL = typeof process !== "undefined" && process.env?.VITE_SITE_URL || "https://nileflowafrica.com";
`${SITE_URL}`;
var ROUTE_SEO = {
	"/": {
		title: "Nile Flow Africa | Premium African E-commerce",
		description: "Shop premium African products, discover artisan stories, and experience authentic commerce from across Africa. Free shipping on premium orders.",
		canonical: "/",
		type: "website"
	},
	"/shop": {
		title: "Shop Authentic African Products | Nile Flow Africa",
		description: "Browse curated African products, crafts, fashion, and premium collections from trusted vendors across the continent.",
		canonical: "/shop"
	},
	products: {
		title: "Product Details | Nile Flow Africa",
		description: "View product details, pricing, reviews, and shipping info for this Nile Flow Africa listing.",
		type: "product"
	},
	category: {
		title: "Category Products | Nile Flow Africa",
		description: "Browse products in this category and discover quality African items from verified sellers."
	},
	"/deals": {
		title: "Best Deals on African Products | Nile Flow Africa",
		description: "Explore limited-time deals and exclusive offers on authentic African products. Save big on premium marketplace finds.",
		canonical: "/deals"
	},
	"/search": {
		title: "Search African Products | Nile Flow Africa",
		description: "Search and discover curated African products tailored to your interests.",
		canonical: "/search",
		noindex: true
	},
	"/about": {
		title: "About Nile Flow Africa",
		description: "Learn about Nile Flow Africa, our mission, and our commitment to authentic African commerce.",
		canonical: "/about"
	},
	"/contact": {
		title: "Contact Nile Flow Africa",
		description: "Contact Nile Flow Africa support for help with products, orders, and marketplace inquiries.",
		canonical: "/contact"
	},
	"/help": {
		title: "Help Center | Nile Flow Africa",
		description: "Find answers to frequently asked questions about orders, returns, payments, and account support.",
		canonical: "/help"
	},
	"/returns": {
		title: "Return Policy | Nile Flow Africa",
		description: "Read Nile Flow Africa's return and refund policy for marketplace purchases.",
		canonical: "/returns"
	},
	"/terms": {
		title: "Terms of Service | Nile Flow Africa",
		description: "Review Nile Flow Africa terms and conditions for using our marketplace platform.",
		canonical: "/terms"
	},
	"/privacy": {
		title: "Privacy Policy | Nile Flow Africa",
		description: "Understand how Nile Flow Africa collects, processes, and protects your personal data.",
		canonical: "/privacy"
	},
	"/discover-africa": {
		title: "Discover Africa | Nile Flow Africa",
		description: "Explore African culture, stories, and curated discoveries alongside authentic marketplace products.",
		canonical: "/discover-africa"
	},
	"/chronicles": {
		title: "African Chronicles | Nile Flow Africa",
		description: "Read inspiring African stories, heritage content, and community-driven chronicles.",
		canonical: "/chronicles"
	},
	"/premium": {
		title: "Premium Deals | Nile Flow Africa",
		description: "Unlock premium marketplace deals and special pricing for selected African products.",
		canonical: "/premium"
	},
	"/featured": {
		title: "Featured Products | Nile Flow Africa",
		description: "Shop trending and featured products selected by Nile Flow Africa.",
		canonical: "/featured"
	},
	"/careers": {
		title: "Careers | Nile Flow Africa",
		description: "Join Nile Flow Africa and help shape the future of African e-commerce.",
		canonical: "/careers"
	},
	"/marketplace": {
		title: "Marketplace | Nile Flow Africa",
		description: "Explore our marketplace of verified African vendors, artisans, and unique products.",
		canonical: "/marketplace"
	},
	"/sign-in": {
		title: "Sign In | Nile Flow Africa",
		description: "Access your Nile Flow Africa account.",
		canonical: "/sign-in",
		noindex: true
	},
	"/sign-up": {
		title: "Create Account | Nile Flow Africa",
		description: "Create your Nile Flow Africa account to start shopping.",
		canonical: "/sign-up",
		noindex: true
	},
	"/forgot-password": {
		title: "Forgot Password | Nile Flow Africa",
		description: "Reset your Nile Flow Africa account password.",
		canonical: "/forgot-password",
		noindex: true
	},
	"/reset-password": {
		title: "Reset Password | Nile Flow Africa",
		description: "Set a new password for your Nile Flow Africa account.",
		canonical: "/reset-password",
		noindex: true
	},
	"/cart": {
		title: "Your Cart | Nile Flow Africa",
		description: "Review items in your cart before checkout.",
		canonical: "/cart",
		noindex: true
	},
	"/checkout": {
		title: "Checkout | Nile Flow Africa",
		description: "Complete your secure checkout on Nile Flow Africa.",
		canonical: "/checkout",
		noindex: true
	},
	"/payment": {
		title: "Payment | Nile Flow Africa",
		description: "Complete your payment on Nile Flow Africa.",
		canonical: "/payment",
		noindex: true
	},
	"/payment/success": {
		title: "Payment Successful | Nile Flow Africa",
		description: "Your payment was successful.",
		canonical: "/payment/success",
		noindex: true
	},
	"/payment/cancelled": {
		title: "Payment Cancelled | Nile Flow Africa",
		description: "Your payment was cancelled.",
		canonical: "/payment/cancelled",
		noindex: true
	},
	"/profile": {
		title: "My Profile | Nile Flow Africa",
		description: "Manage your Nile Flow Africa account profile.",
		canonical: "/profile",
		noindex: true
	},
	"/orders": {
		title: "My Orders | Nile Flow Africa",
		description: "View and manage your Nile Flow Africa orders.",
		canonical: "/orders",
		noindex: true
	},
	"/addresses": {
		title: "My Addresses | Nile Flow Africa",
		description: "Manage your saved delivery addresses.",
		canonical: "/addresses",
		noindex: true
	},
	"/settings": {
		title: "Account Settings | Nile Flow Africa",
		description: "Manage your Nile Flow Africa account settings.",
		canonical: "/settings",
		noindex: true
	},
	"/notifications": {
		title: "Notifications | Nile Flow Africa",
		description: "View your Nile Flow Africa notifications.",
		canonical: "/notifications",
		noindex: true
	},
	"/miles": {
		title: "Nile Miles | Nile Flow Africa",
		description: "View your Nile Miles loyalty balance and history.",
		canonical: "/miles",
		noindex: true
	},
	"/redeem": {
		title: "Redeem Points | Nile Flow Africa",
		description: "Redeem your loyalty points on Nile Flow Africa.",
		canonical: "/redeem",
		noindex: true
	},
	"/currency": {
		title: "Currency Settings | Nile Flow Africa",
		description: "Set your preferred currency for shopping.",
		canonical: "/currency",
		noindex: true
	},
	"/language": {
		title: "Language Settings | Nile Flow Africa",
		description: "Choose your preferred language.",
		canonical: "/language",
		noindex: true
	},
	"/report-problem": {
		title: "Report a Problem | Nile Flow Africa",
		description: "Report an issue with your Nile Flow Africa account or order.",
		canonical: "/report-problem",
		noindex: true
	},
	"/account-deletion": {
		title: "Account Deletion | Nile Flow Africa",
		description: "Request deletion of your Nile Flow Africa account.",
		canonical: "/account-deletion",
		noindex: true
	},
	"/subscription-success": {
		title: "Subscription Confirmed | Nile Flow Africa",
		description: "Your premium subscription is now active.",
		canonical: "/subscription-success",
		noindex: true
	},
	"/group-buying": {
		title: "Group Buying | Nile Flow Africa",
		description: "Join a group buy and save on authentic African products.",
		canonical: "/group-buying"
	}
};
function buildOrganizationSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: SITE_NAME,
		url: SITE_URL,
		logo: `${SITE_URL}/og-image.png`,
		description: "Nile Flow Africa is a premium African e-commerce marketplace connecting buyers with authentic products.",
		founder: {
			"@type": "Person",
			name: "Anthony Wai Chol",
			jobTitle: "Founder & CEO"
		}
	};
}
function buildWebSiteSchema() {
	return {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: SITE_NAME,
		url: SITE_URL,
		potentialAction: {
			"@type": "SearchAction",
			target: `${SITE_URL}/search?q={search_term_string}`,
			"query-input": "required name=search_term_string"
		}
	};
}
/** Humanize a path for fallback titles */
function humanizePath(pathname) {
	if (!pathname || pathname === "/") return SITE_NAME;
	return `${pathname.replace(/^\//, "").replace(/[-_]/g, " ").trim().split("/").flatMap((s) => s.split(" ")).filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")} | ${SITE_NAME}`;
}
/** Resolve SEO meta for a pathname */
function resolveRouteMeta(pathname, overrides) {
	const staticMatch = ROUTE_SEO[pathname];
	if (staticMatch) return {
		...staticMatch,
		...overrides
	};
	if (pathname.startsWith("/products/")) return {
		...ROUTE_SEO.products,
		...overrides
	};
	if (pathname.startsWith("/categories/")) return {
		...ROUTE_SEO.category,
		...overrides
	};
	return {
		title: humanizePath(pathname),
		description: `Explore ${humanizePath(pathname)} on Nile Flow Africa.`,
		...overrides
	};
}
typeof process !== "undefined" && process.env?.VITE_PUBLIC_POSTHOG_KEY;
typeof process !== "undefined" && process.env?.VITE_PUBLIC_POSTHOG_HOST;
/** Track a page view manually */
function trackPageView(pathname) {
	posthog.capture("$pageview", { path: pathname });
}
//#endregion
//#region app/components/layout/Header.tsx
/**
* Nile Flow Header
* Performance notes:
*  - No inline mouseEnter/mouseLeave handlers (old Website had 25+)
*  - Uses CSS classes for hover states
*  - No backdrop-filter on scroll — solid background
*  - Passive scroll listener not needed (no scroll-driven effects)
*/
var NAV_LINKS = [
	{
		to: "/",
		label: "Home"
	},
	{
		to: "/shop",
		label: "Shop"
	},
	{
		to: "/deals",
		label: "Deals"
	},
	{
		to: "/contact",
		label: "Contact"
	}
];
function Header() {
	return /* @__PURE__ */ jsx("header", {
		className: "sticky top-0 z-50 bg-white/95 border-b border-nile-border",
		children: /* @__PURE__ */ jsx("div", {
			className: "container-page",
			children: /* @__PURE__ */ jsxs("div", {
				className: "flex items-center justify-between h-16 md:h-20",
				children: [
					/* @__PURE__ */ jsxs(Link, {
						to: "/",
						className: "flex items-center gap-2 shrink-0",
						"aria-label": "Nile Flow Home",
						children: [/* @__PURE__ */ jsx("div", {
							className: "w-9 h-9 md:w-10 md:h-10 rounded-xl bg-nile-green-600 flex items-center justify-center",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-white font-black text-sm md:text-base",
								children: "NF"
							})
						}), /* @__PURE__ */ jsx("span", {
							className: "hidden sm:inline text-lg font-bold text-nile-green-900 tracking-wide",
							children: "NILE FLOW"
						})]
					}),
					/* @__PURE__ */ jsx("nav", {
						className: "hidden md:flex items-center gap-1",
						children: NAV_LINKS.map((link) => /* @__PURE__ */ jsx(Link, {
							to: link.to,
							className: "px-3 py-2 text-sm font-medium text-nile-body rounded-lg hover:bg-nile-green-50 hover:text-nile-green-700 transition-colors duration-200",
							children: link.label
						}, link.to))
					}),
					/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-1 md:gap-2",
						children: [
							/* @__PURE__ */ jsx(Link, {
								to: "/search",
								className: "p-2.5 text-nile-muted hover:text-nile-green-600 rounded-lg hover:bg-nile-green-50 transition-colors duration-200",
								"aria-label": "Search",
								children: /* @__PURE__ */ jsx(Search, { size: 20 })
							}),
							/* @__PURE__ */ jsxs(Link, {
								to: "/cart",
								className: "relative p-2.5 text-nile-muted hover:text-nile-green-600 rounded-lg hover:bg-nile-green-50 transition-colors duration-200",
								"aria-label": "Cart",
								children: [/* @__PURE__ */ jsx(ShoppingCart, { size: 20 }), /* @__PURE__ */ jsx("span", {
									className: "absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-nile-green-600 text-white text-[10px] font-bold flex items-center justify-center",
									children: "0"
								})]
							}),
							/* @__PURE__ */ jsx(Link, {
								to: "/sign-in",
								className: "hidden sm:inline-flex nile-btn text-sm py-2 px-4",
								children: "Sign In"
							}),
							/* @__PURE__ */ jsx("button", {
								className: "md:hidden p-2.5 text-nile-muted rounded-lg",
								"aria-label": "Open menu",
								children: /* @__PURE__ */ jsx(Menu, { size: 20 })
							})
						]
					})
				]
			})
		})
	});
}
//#endregion
//#region app/components/layout/Footer.tsx
var FOOTER_LINKS = {
	Shop: [
		"/deals",
		"/cart",
		"/checkout"
	],
	Support: [
		"/help",
		"/returns",
		"/contact",
		"/report-problem"
	],
	Company: [
		"/about",
		"/careers",
		"/privacy",
		"/terms"
	]
};
function Footer() {
	const year = (/* @__PURE__ */ new Date()).getFullYear();
	return /* @__PURE__ */ jsx("footer", {
		className: "bg-nile-heading text-white mt-auto",
		children: /* @__PURE__ */ jsxs("div", {
			className: "container-page py-12 md:py-16",
			children: [/* @__PURE__ */ jsxs("div", {
				className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "sm:col-span-2 lg:col-span-1",
					children: [/* @__PURE__ */ jsxs("div", {
						className: "flex items-center gap-3 mb-4",
						children: [/* @__PURE__ */ jsx("div", {
							className: "w-12 h-12 rounded-xl bg-nile-green-600 flex items-center justify-center",
							children: /* @__PURE__ */ jsx("span", {
								className: "text-white font-black text-lg",
								children: "NF"
							})
						}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h3", {
							className: "text-xl font-bold text-white",
							children: "NILE FLOW"
						}), /* @__PURE__ */ jsx("p", {
							className: "text-gray-400 text-sm",
							children: "Premium African Marketplace"
						})] })]
					}), /* @__PURE__ */ jsx("p", {
						className: "text-gray-400 text-sm leading-relaxed",
						children: "Your gateway to authentic African products. Premium quality, fair prices, and seamless delivery across the continent."
					})]
				}), Object.entries(FOOTER_LINKS).map(([title, paths]) => /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("h4", {
					className: "font-semibold text-white mb-4 text-sm uppercase tracking-wider",
					children: title
				}), /* @__PURE__ */ jsx("ul", {
					className: "space-y-2.5",
					children: paths.map((path) => {
						return /* @__PURE__ */ jsx("li", { children: /* @__PURE__ */ jsx(Link, {
							to: path,
							className: "text-gray-400 hover:text-nile-green-400 text-sm transition-colors duration-200",
							children: path.replace(/^\//, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
						}) }, path);
					})
				})] }, title))]
			}), /* @__PURE__ */ jsxs("div", {
				className: "mt-12 pt-8 border-t border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4",
				children: [/* @__PURE__ */ jsxs("p", {
					className: "text-gray-500 text-sm",
					children: [
						"© ",
						year,
						" Nile Flow. All rights reserved."
					]
				}), /* @__PURE__ */ jsxs("div", {
					className: "flex gap-4",
					children: [/* @__PURE__ */ jsx(Link, {
						to: "/privacy",
						className: "text-gray-500 hover:text-gray-300 text-sm transition-colors",
						children: "Privacy"
					}), /* @__PURE__ */ jsx(Link, {
						to: "/terms",
						className: "text-gray-500 hover:text-gray-300 text-sm transition-colors",
						children: "Terms"
					})]
				})]
			})]
		})
	});
}
//#endregion
//#region app/root.tsx
var root_exports = /* @__PURE__ */ __exportAll({
	ErrorBoundary: () => ErrorBoundary,
	Layout: () => Layout,
	default: () => root_default,
	links: () => links
});
var links = () => [
	{
		rel: "preconnect",
		href: "https://fonts.googleapis.com"
	},
	{
		rel: "preconnect",
		href: "https://fonts.gstatic.com",
		crossOrigin: "anonymous"
	},
	{
		rel: "stylesheet",
		href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Poppins:wght@300;400;500;600;700;800;900&display=swap"
	},
	{
		rel: "sitemap",
		type: "application/xml",
		href: "/sitemap.xml"
	}
];
function Layout({ children }) {
	const schemaOrg = JSON.stringify(buildOrganizationSchema());
	const schemaSite = JSON.stringify(buildWebSiteSchema());
	return /* @__PURE__ */ jsxs("html", {
		lang: "en",
		children: [/* @__PURE__ */ jsxs("head", { children: [
			/* @__PURE__ */ jsx("meta", { charSet: "utf-8" }),
			/* @__PURE__ */ jsx("meta", {
				name: "viewport",
				content: "width=device-width, initial-scale=1"
			}),
			/* @__PURE__ */ jsx("meta", {
				name: "theme-color",
				content: "#16A34A"
			}),
			/* @__PURE__ */ jsx("meta", {
				name: "robots",
				content: "index, follow"
			}),
			/* @__PURE__ */ jsx("meta", {
				property: "og:site_name",
				content: SITE_NAME
			}),
			/* @__PURE__ */ jsx("meta", {
				property: "og:locale",
				content: "en_US"
			}),
			/* @__PURE__ */ jsx(Meta, {}),
			/* @__PURE__ */ jsx(Links, {}),
			/* @__PURE__ */ jsx("script", {
				type: "application/ld+json",
				dangerouslySetInnerHTML: { __html: schemaOrg }
			}),
			/* @__PURE__ */ jsx("script", {
				type: "application/ld+json",
				dangerouslySetInnerHTML: { __html: schemaSite }
			})
		] }), /* @__PURE__ */ jsxs("body", { children: [
			children,
			/* @__PURE__ */ jsx(ScrollRestoration, {}),
			/* @__PURE__ */ jsx(Scripts, {})
		] })]
	});
}
var root_default = UNSAFE_withComponentProps(function App() {
	const location = useLocation();
	useEffect(() => {
		trackPageView(location.pathname);
	}, [location.pathname]);
	return /* @__PURE__ */ jsxs(Sentry.ErrorBoundary, {
		fallback: ({ error, resetError }) => {
			const msg = typeof error === "object" && error !== null ? String(error.message ?? "") : "";
			const isChunkError = msg.includes("Failed to fetch") || msg.includes("dynamically imported");
			return /* @__PURE__ */ jsx("div", {
				className: "nile-screen",
				children: /* @__PURE__ */ jsxs("div", {
					className: "container-page py-16 text-center",
					children: [
						/* @__PURE__ */ jsx("h1", {
							className: "nile-h1 mb-4",
							children: isChunkError ? "Loading Error" : "Something went wrong"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "nile-body max-w-lg mx-auto mb-8",
							children: isChunkError ? "A resource failed to load. A refresh should fix it." : "We've been notified and are looking into it."
						}),
						/* @__PURE__ */ jsx("button", {
							onClick: () => {
								if (isChunkError) window.location.reload();
								else resetError();
							},
							className: "nile-btn",
							children: isChunkError ? "Refresh Page" : "Try Again"
						})
					]
				})
			});
		},
		showDialog: true,
		children: [
			/* @__PURE__ */ jsx(Header, {}),
			/* @__PURE__ */ jsx(Outlet, {}),
			/* @__PURE__ */ jsx(Footer, {})
		]
	});
});
var ErrorBoundary = UNSAFE_withErrorBoundaryProps(function ErrorBoundary({ error }) {
	let message = "Oops!";
	let details = "An unexpected error occurred.";
	let stack;
	if (isRouteErrorResponse(error)) {
		message = error.status === 404 ? "404" : "Error";
		details = error.status === 404 ? "The requested page could not be found." : error.statusText || details;
	}
	return /* @__PURE__ */ jsxs("main", {
		className: "container-page py-16",
		children: [
			/* @__PURE__ */ jsx("h1", {
				className: "nile-h1",
				children: message
			}),
			/* @__PURE__ */ jsx("p", {
				className: "nile-body mt-4",
				children: details
			}),
			stack
		]
	});
});
//#endregion
//#region app/lib/seo-meta.ts
/**
* Nile Flow SEO — React Router v8 Meta Helpers
*
* Each route module exports a `meta` function that returns an array of
* meta descriptors. These are rendered by the root `<Meta />` component
* during SSR, so Googlebot sees the final HTML on every page.
*
* Usage in route module:
* ```tsx
* export function meta() {
*   return seoMeta("/shop", { title: "Custom", description: "..." });
* }
* ```
*/
/**
* Returns React Router v8 meta descriptors + canonical link for a route.
* Call this from each page's `meta` export.
*/
function seoMeta(pathname, options) {
	const routeMeta = resolveRouteMeta(pathname, options);
	const canonicalHref = `${SITE_URL}${options?.canonical || routeMeta.canonical || pathname}`;
	return [
		{ title: routeMeta.title },
		{
			name: "description",
			content: routeMeta.description
		},
		{
			name: "robots",
			content: routeMeta.noindex ? "noindex, nofollow" : "index, follow"
		},
		{
			property: "og:title",
			content: routeMeta.title
		},
		{
			property: "og:description",
			content: routeMeta.description
		},
		{
			property: "og:type",
			content: routeMeta.type || "website"
		},
		{
			property: "og:url",
			content: canonicalHref
		},
		{
			property: "og:image",
			content: options?.ogImage || routeMeta.ogImage || `${SITE_URL}/og-image.svg`
		},
		{
			name: "twitter:card",
			content: "summary_large_image"
		},
		{
			name: "twitter:title",
			content: routeMeta.title
		},
		{
			name: "twitter:description",
			content: routeMeta.description
		},
		{
			name: "twitter:image",
			content: options?.ogImage || routeMeta.ogImage || `${SITE_URL}/og-image.svg`
		},
		{
			tagName: "link",
			rel: "canonical",
			href: canonicalHref
		}
	];
}
//#endregion
//#region app/features/home/HomePage.tsx
var HomePage_exports = /* @__PURE__ */ __exportAll({
	default: () => HomePage_default,
	meta: () => meta$44
});
function meta$44({}) {
	return seoMeta("/");
}
var HomePage_default = UNSAFE_withComponentProps(function HomePage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [
			/* @__PURE__ */ jsx("section", {
				className: "bg-gradient-to-br from-nile-green-900 via-nile-green-800 to-nile-green-700",
				children: /* @__PURE__ */ jsx("div", {
					className: "container-page py-20 md:py-28 lg:py-36",
					children: /* @__PURE__ */ jsxs("div", {
						className: "max-w-3xl mx-auto text-center",
						children: [
							/* @__PURE__ */ jsxs("div", {
								className: "inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full mb-6",
								children: [/* @__PURE__ */ jsx("span", { className: "w-2 h-2 rounded-full bg-nile-gold-400 animate-pulse" }), /* @__PURE__ */ jsx("span", {
									className: "text-nile-green-100 text-sm font-medium",
									children: "Premium African Marketplace"
								})]
							}),
							/* @__PURE__ */ jsxs("h1", {
								className: "text-white font-bold text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-tight mb-6",
								children: ["Discover Africa's", /* @__PURE__ */ jsx("span", {
									className: "text-nile-gold-400 block",
									children: "Finest Treasures"
								})]
							}),
							/* @__PURE__ */ jsx("p", {
								className: "text-nile-green-200 text-lg md:text-xl max-w-2xl mx-auto mb-10",
								children: "Handpicked authentic products from across the continent, delivered to your door."
							}),
							/* @__PURE__ */ jsxs("div", {
								className: "flex flex-col sm:flex-row gap-4 justify-center",
								children: [/* @__PURE__ */ jsx("a", {
									href: "/shop",
									className: "nile-btn bg-nile-gold-600 hover:bg-nile-gold-700 text-white text-lg px-8 py-4",
									children: "Start Shopping"
								}), /* @__PURE__ */ jsx("a", {
									href: "/premium",
									className: "nile-btn-outline border-white/30 text-white hover:bg-white/10 text-lg px-8 py-4",
									children: "Go Premium"
								})]
							})
						]
					})
				})
			}),
			/* @__PURE__ */ jsx("section", {
				className: "border-b border-nile-border bg-nile-surface",
				children: /* @__PURE__ */ jsx("div", {
					className: "container-page py-6",
					children: /* @__PURE__ */ jsx("div", {
						className: "grid grid-cols-2 md:grid-cols-4 gap-4",
						children: [
							{
								icon: "🚚",
								title: "Fast Delivery",
								desc: "Across Africa"
							},
							{
								icon: "🛡️",
								title: "Secure Payment",
								desc: "100% Protected"
							},
							{
								icon: "💬",
								title: "24/7 Support",
								desc: "Local Agents"
							},
							{
								icon: "⭐",
								title: "Premium Quality",
								desc: "Authentic Products"
							}
						].map((item) => /* @__PURE__ */ jsxs("div", {
							className: "flex items-center gap-3 p-3 rounded-xl bg-white border border-nile-border",
							children: [/* @__PURE__ */ jsx("span", {
								className: "text-2xl",
								children: item.icon
							}), /* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx("p", {
								className: "font-semibold text-nile-heading text-sm",
								children: item.title
							}), /* @__PURE__ */ jsx("p", {
								className: "text-nile-muted text-xs",
								children: item.desc
							})] })]
						}, item.title))
					})
				})
			}),
			/* @__PURE__ */ jsxs("section", {
				className: "container-page py-16",
				children: [/* @__PURE__ */ jsx("h2", {
					className: "nile-h2 mb-8 text-center",
					children: "Shop by Category"
				}), /* @__PURE__ */ jsx("div", {
					className: "nile-grid",
					children: [
						"Fashion",
						"Art & Crafts",
						"Home & Living",
						"Jewelry",
						"Food & Spices",
						"Beauty"
					].map((cat) => /* @__PURE__ */ jsxs("a", {
						href: `/categories/${cat.toLowerCase().replace(/\s+/g, "-")}`,
						className: "nile-card p-6 text-center hover:border-nile-green-300 transition-colors duration-200",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-3",
								children: /* @__PURE__ */ jsx("span", {
									className: "text-nile-green-600 font-bold text-xl",
									children: cat[0]
								})
							}),
							/* @__PURE__ */ jsx("h3", {
								className: "font-semibold text-nile-heading",
								children: cat
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "text-nile-muted text-sm mt-1",
								children: ["Explore ", cat]
							})
						]
					}, cat))
				})]
			}),
			/* @__PURE__ */ jsx("section", {
				className: "bg-gradient-to-r from-nile-gold-600 to-nile-gold-700",
				children: /* @__PURE__ */ jsxs("div", {
					className: "container-page py-16 text-center",
					children: [
						/* @__PURE__ */ jsx("h2", {
							className: "text-white font-bold text-3xl md:text-4xl mb-4",
							children: "Go Premium & Save Big"
						}),
						/* @__PURE__ */ jsx("p", {
							className: "text-yellow-100 text-lg mb-8 max-w-xl mx-auto",
							children: "Free shipping, exclusive deals, and 10% back in Nile Miles on every purchase."
						}),
						/* @__PURE__ */ jsx("a", {
							href: "/premium",
							className: "inline-flex items-center gap-2 bg-white text-nile-gold-700 font-bold px-8 py-4 rounded-xl hover:bg-yellow-50 transition-colors",
							children: "Learn More"
						})
					]
				})
			})
		]
	});
});
//#endregion
//#region app/features/products/ShopPage.tsx
var ShopPage_exports = /* @__PURE__ */ __exportAll({
	default: () => ShopPage_default,
	meta: () => meta$43
});
function meta$43({}) {
	return seoMeta("/shop");
}
var ShopPage_default = UNSAFE_withComponentProps(function ShopPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Shop Authentic African Products"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Browse curated African products, crafts, fashion, and premium collections from trusted vendors across the continent."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "product-grid",
				children: Array.from({ length: 12 }).map((_, i) => /* @__PURE__ */ jsxs("a", {
					href: `/products/${i + 1}`,
					className: "nile-card overflow-hidden hover:shadow-elevated transition-shadow duration-200",
					children: [/* @__PURE__ */ jsx("div", {
						className: "aspect-square bg-nile-surface flex items-center justify-center",
						children: /* @__PURE__ */ jsx("span", {
							className: "text-nile-muted text-4xl font-bold",
							children: "NF"
						})
					}), /* @__PURE__ */ jsxs("div", {
						className: "p-4",
						children: [
							/* @__PURE__ */ jsx("span", {
								className: "nile-badge-green inline-block mb-2",
								children: /* @__PURE__ */ jsx("span", {
									className: "nile-badge-text",
									children: "African Product"
								})
							}),
							/* @__PURE__ */ jsxs("h3", {
								className: "font-semibold text-nile-heading line-clamp-2",
								children: ["Premium Product ", i + 1]
							}),
							/* @__PURE__ */ jsxs("p", {
								className: "nile-gold-text text-lg mt-1",
								children: ["KES ", (i + 1) * 500]
							})
						]
					})]
				}, i))
			})
		})]
	});
});
//#endregion
//#region app/features/products/ProductDetailPage.tsx
var ProductDetailPage_exports = /* @__PURE__ */ __exportAll({
	default: () => ProductDetailPage_default,
	meta: () => meta$42
});
/**
* Product Details â€” Nile Flow Africa
*
* Route: products
* Purpose: View product details, pricing, reviews, and shipping info.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$42({}) {
	return seoMeta("products");
}
var ProductDetailPage_default = UNSAFE_withComponentProps(function ProductDetailPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Product Details"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Complete product information coming soon."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/products/CategoryPage.tsx
var CategoryPage_exports = /* @__PURE__ */ __exportAll({
	default: () => CategoryPage_default,
	meta: () => meta$41
});
/**
* Category Products â€” Nile Flow Africa
*
* Route: category
* Purpose: Browse products in this category from verified sellers.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$41({}) {
	return seoMeta("category");
}
var CategoryPage_default = UNSAFE_withComponentProps(function CategoryPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Category Products"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Explore our curated collections."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/products/DealsPage.tsx
var DealsPage_exports = /* @__PURE__ */ __exportAll({
	default: () => DealsPage_default,
	meta: () => meta$40
});
/**
* Today's Best Deals â€” Nile Flow Africa
*
* Route: /deals
* Purpose: Limited-time deals on authentic African products.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$40({}) {
	return seoMeta("/deals");
}
var DealsPage_default = UNSAFE_withComponentProps(function DealsPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Today's Best Deals"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Limited-time offers on premium African products."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/products/SearchPage.tsx
var SearchPage_exports = /* @__PURE__ */ __exportAll({
	default: () => SearchPage_default,
	meta: () => meta$39
});
/**
* Search Products â€” Nile Flow Africa
*
* Route: /search
* Purpose: Search and discover curated African products.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$39({}) {
	return seoMeta("/search");
}
var SearchPage_default = UNSAFE_withComponentProps(function SearchPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Search Products"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Find what you're looking for."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/cart/CartPage.tsx
var CartPage_exports = /* @__PURE__ */ __exportAll({
	default: () => CartPage_default,
	meta: () => meta$38
});
/**
* Shopping Cart â€” Nile Flow Africa
*
* Route: /cart
* Purpose: Review items in your cart.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$38({}) {
	return seoMeta("/cart");
}
var CartPage_default = UNSAFE_withComponentProps(function CartPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Shopping Cart"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Your selected African treasures."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/checkout/CheckoutPage.tsx
var CheckoutPage_exports = /* @__PURE__ */ __exportAll({
	default: () => CheckoutPage_default,
	meta: () => meta$37
});
/**
* Checkout â€” Nile Flow Africa
*
* Route: /checkout
* Purpose: Complete your secure checkout.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$37({}) {
	return seoMeta("/checkout");
}
var CheckoutPage_default = UNSAFE_withComponentProps(function CheckoutPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Checkout"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Finalize your order securely."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/checkout/PaymentPage.tsx
var PaymentPage_exports = /* @__PURE__ */ __exportAll({
	default: () => PaymentPage_default,
	meta: () => meta$36
});
/**
* Payment â€” Nile Flow Africa
*
* Route: /payment
* Purpose: Complete your payment.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$36({}) {
	return seoMeta("/payment");
}
var PaymentPage_default = UNSAFE_withComponentProps(function PaymentPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Payment"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Secure payment processing."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/checkout/PaymentSuccessPage.tsx
var PaymentSuccessPage_exports = /* @__PURE__ */ __exportAll({
	default: () => PaymentSuccessPage_default,
	meta: () => meta$35
});
/**
* Payment Successful! â€” Nile Flow Africa
*
* Route: /payment/success
* Purpose: Your payment was successful.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$35({}) {
	return seoMeta("/payment/success");
}
var PaymentSuccessPage_default = UNSAFE_withComponentProps(function PaymentSuccessPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Payment Successful!"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Thank you for your order."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/checkout/PaymentCancelledPage.tsx
var PaymentCancelledPage_exports = /* @__PURE__ */ __exportAll({
	default: () => PaymentCancelledPage_default,
	meta: () => meta$34
});
/**
* Payment Cancelled â€” Nile Flow Africa
*
* Route: /payment/cancelled
* Purpose: Your payment was cancelled.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$34({}) {
	return seoMeta("/payment/cancelled");
}
var PaymentCancelledPage_default = UNSAFE_withComponentProps(function PaymentCancelledPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Payment Cancelled"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "No charges were made."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/auth/SignInPage.tsx
var SignInPage_exports = /* @__PURE__ */ __exportAll({
	default: () => SignInPage_default,
	meta: () => meta$33
});
/**
* Welcome Back â€” Nile Flow Africa
*
* Route: /sign-in
* Purpose: Access your Nile Flow Africa account.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$33({}) {
	return seoMeta("/sign-in");
}
var SignInPage_default = UNSAFE_withComponentProps(function SignInPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Welcome Back"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Sign in to your account to continue."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/auth/SignUpPage.tsx
var SignUpPage_exports = /* @__PURE__ */ __exportAll({
	default: () => SignUpPage_default,
	meta: () => meta$32
});
/**
* Join Nile Flow â€” Nile Flow Africa
*
* Route: /sign-up
* Purpose: Create your Nile Flow Africa account.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$32({}) {
	return seoMeta("/sign-up");
}
var SignUpPage_default = UNSAFE_withComponentProps(function SignUpPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Join Nile Flow"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Create an account and start discovering Africa."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/auth/ForgotPasswordPage.tsx
var ForgotPasswordPage_exports = /* @__PURE__ */ __exportAll({
	default: () => ForgotPasswordPage_default,
	meta: () => meta$31
});
/**
* Reset Password â€” Nile Flow Africa
*
* Route: /forgot-password
* Purpose: Reset your password.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$31({}) {
	return seoMeta("/forgot-password");
}
var ForgotPasswordPage_default = UNSAFE_withComponentProps(function ForgotPasswordPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Reset Password"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Enter your email to receive reset instructions."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/auth/ResetPasswordPage.tsx
var ResetPasswordPage_exports = /* @__PURE__ */ __exportAll({
	default: () => ResetPasswordPage_default,
	meta: () => meta$30
});
/**
* Set New Password â€” Nile Flow Africa
*
* Route: /reset-password
* Purpose: Set a new password.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$30({}) {
	return seoMeta("/reset-password");
}
var ResetPasswordPage_default = UNSAFE_withComponentProps(function ResetPasswordPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Set New Password"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Choose a strong password for your account."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/auth/OAuthCallbackPage.tsx
var OAuthCallbackPage_exports = /* @__PURE__ */ __exportAll({
	default: () => OAuthCallbackPage_default,
	meta: () => meta$29
});
/**
* Completing Sign In â€” Nile Flow Africa
*
* Route: /oauth/callback
* Purpose: Completing authentication.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$29({}) {
	return seoMeta("/oauth/callback");
}
var OAuthCallbackPage_default = UNSAFE_withComponentProps(function OAuthCallbackPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Completing Sign In"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Please wait while we complete your authentication."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/premium/PremiumDealsPage.tsx
var PremiumDealsPage_exports = /* @__PURE__ */ __exportAll({
	default: () => PremiumDealsPage_default,
	meta: () => meta$28
});
/**
* Premium Deals â€” Nile Flow Africa
*
* Route: /premium
* Purpose: Unlock exclusive premium deals.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$28({}) {
	return seoMeta("/premium");
}
var PremiumDealsPage_default = UNSAFE_withComponentProps(function PremiumDealsPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Premium Deals"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Exclusive offers for premium members."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/miles/MilesPage.tsx
var MilesPage_exports = /* @__PURE__ */ __exportAll({
	default: () => MilesPage_default,
	meta: () => meta$27
});
/**
* Nile Miles â€” Nile Flow Africa
*
* Route: /miles
* Purpose: View your loyalty balance.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$27({}) {
	return seoMeta("/miles");
}
var MilesPage_default = UNSAFE_withComponentProps(function MilesPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Nile Miles"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Your loyalty rewards."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/miles/RedeemPage.tsx
var RedeemPage_exports = /* @__PURE__ */ __exportAll({
	default: () => RedeemPage_default,
	meta: () => meta$26
});
/**
* Redeem Miles â€” Nile Flow Africa
*
* Route: /redeem
* Purpose: Redeem your loyalty points.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$26({}) {
	return seoMeta("/redeem");
}
var RedeemPage_default = UNSAFE_withComponentProps(function RedeemPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Redeem Miles"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Exchange your miles for rewards."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/group-buying/GroupBuyPage.tsx
var GroupBuyPage_exports = /* @__PURE__ */ __exportAll({
	default: () => GroupBuyPage_default,
	meta: () => meta$25
});
/**
* Group Buying Deals â€” Nile Flow Africa
*
* Route: /group-buying
* Purpose: Save with group purchases.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$25({}) {
	return seoMeta("/group-buying");
}
var GroupBuyPage_default = UNSAFE_withComponentProps(function GroupBuyPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Group Buying Deals"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Lower prices together."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/notifications/NotificationsPage.tsx
var NotificationsPage_exports = /* @__PURE__ */ __exportAll({
	default: () => NotificationsPage_default,
	meta: () => meta$24
});
/**
* Notifications â€” Nile Flow Africa
*
* Route: /notifications
* Purpose: View your notifications.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$24({}) {
	return seoMeta("/notifications");
}
var NotificationsPage_default = UNSAFE_withComponentProps(function NotificationsPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Notifications"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Stay updated on your orders."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/profile/OrdersPage.tsx
var OrdersPage_exports = /* @__PURE__ */ __exportAll({
	default: () => OrdersPage_default,
	meta: () => meta$23
});
/**
* My Orders â€” Nile Flow Africa
*
* Route: /orders
* Purpose: View your orders.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$23({}) {
	return seoMeta("/orders");
}
var OrdersPage_default = UNSAFE_withComponentProps(function OrdersPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "My Orders"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Track and manage your purchases."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/profile/TrackOrderPage.tsx
var TrackOrderPage_exports = /* @__PURE__ */ __exportAll({
	default: () => TrackOrderPage_default,
	meta: () => meta$22
});
/**
* Track Order â€” Nile Flow Africa
*
* Route: /orders/:id/track
* Purpose: Track your order.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$22({}) {
	return seoMeta("/orders/:id/track");
}
var TrackOrderPage_default = UNSAFE_withComponentProps(function TrackOrderPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Track Order"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Real-time order tracking."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/profile/CancelOrderPage.tsx
var CancelOrderPage_exports = /* @__PURE__ */ __exportAll({
	default: () => CancelOrderPage_default,
	meta: () => meta$21
});
/**
* Cancel Order â€” Nile Flow Africa
*
* Route: /orders/:id/cancel
* Purpose: Cancel your order.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$21({}) {
	return seoMeta("/orders/:id/cancel");
}
var CancelOrderPage_default = UNSAFE_withComponentProps(function CancelOrderPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Cancel Order"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Request order cancellation."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/profile/AddressesPage.tsx
var AddressesPage_exports = /* @__PURE__ */ __exportAll({
	default: () => AddressesPage_default,
	meta: () => meta$20
});
/**
* My Addresses â€” Nile Flow Africa
*
* Route: /addresses
* Purpose: Manage your addresses.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$20({}) {
	return seoMeta("/addresses");
}
var AddressesPage_default = UNSAFE_withComponentProps(function AddressesPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "My Addresses"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Your saved delivery addresses."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/profile/SettingsPage.tsx
var SettingsPage_exports = /* @__PURE__ */ __exportAll({
	default: () => SettingsPage_default,
	meta: () => meta$19
});
/**
* Account Settings â€” Nile Flow Africa
*
* Route: /settings
* Purpose: Manage your settings.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$19({}) {
	return seoMeta("/settings");
}
var SettingsPage_default = UNSAFE_withComponentProps(function SettingsPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Account Settings"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Customize your experience."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/profile/ProfilePage.tsx
var ProfilePage_exports = /* @__PURE__ */ __exportAll({
	default: () => ProfilePage_default,
	meta: () => meta$18
});
/**
* My Profile â€” Nile Flow Africa
*
* Route: /profile
* Purpose: Manage your profile.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$18({}) {
	return seoMeta("/profile");
}
var ProfilePage_default = UNSAFE_withComponentProps(function ProfilePage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "My Profile"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Manage your account details."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/home/DiscoverAfricaPage.tsx
var DiscoverAfricaPage_exports = /* @__PURE__ */ __exportAll({
	default: () => DiscoverAfricaPage_default,
	meta: () => meta$17
});
/**
* Discover Africa â€” Nile Flow Africa
*
* Route: /discover-africa
* Purpose: Explore African culture and stories.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$17({}) {
	return seoMeta("/discover-africa");
}
var DiscoverAfricaPage_default = UNSAFE_withComponentProps(function DiscoverAfricaPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Discover Africa"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Rich culture, heritage, and stories."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/home/MarketplaceHubPage.tsx
var MarketplaceHubPage_exports = /* @__PURE__ */ __exportAll({
	default: () => MarketplaceHubPage_default,
	meta: () => meta$16
});
/**
* Marketplace Hub â€” Nile Flow Africa
*
* Route: /marketplace
* Purpose: Explore our vendor marketplace.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$16({}) {
	return seoMeta("/marketplace");
}
var MarketplaceHubPage_default = UNSAFE_withComponentProps(function MarketplaceHubPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Marketplace Hub"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Connect with verified African vendors."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/home/ArtisanProfilePage.tsx
var ArtisanProfilePage_exports = /* @__PURE__ */ __exportAll({
	default: () => ArtisanProfilePage_default,
	meta: () => meta$15
});
/**
* Artisan Profile â€” Nile Flow Africa
*
* Route: artisans
* Purpose: Meet our artisans.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$15({}) {
	return seoMeta("artisans");
}
var ArtisanProfilePage_default = UNSAFE_withComponentProps(function ArtisanProfilePage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Artisan Profile"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Discover the makers behind the products."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/home/AfricanChroniclesPage.tsx
var AfricanChroniclesPage_exports = /* @__PURE__ */ __exportAll({
	default: () => AfricanChroniclesPage_default,
	meta: () => meta$14
});
/**
* African Chronicles â€” Nile Flow Africa
*
* Route: /chronicles
* Purpose: Read inspiring African stories.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$14({}) {
	return seoMeta("/chronicles");
}
var AfricanChroniclesPage_default = UNSAFE_withComponentProps(function AfricanChroniclesPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "African Chronicles"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Stories that celebrate Africa."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/home/FeaturedProductsPage.tsx
var FeaturedProductsPage_exports = /* @__PURE__ */ __exportAll({
	default: () => FeaturedProductsPage_default,
	meta: () => meta$13
});
/**
* Featured Products â€” Nile Flow Africa
*
* Route: /featured
* Purpose: Shop trending products.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$13({}) {
	return seoMeta("/featured");
}
var FeaturedProductsPage_default = UNSAFE_withComponentProps(function FeaturedProductsPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Featured Products"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Curated picks from our marketplace."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/home/AboutUsPage.tsx
var AboutUsPage_exports = /* @__PURE__ */ __exportAll({
	default: () => AboutUsPage_default,
	meta: () => meta$12
});
function meta$12({}) {
	return seoMeta("/about");
}
var AboutUsPage_default = UNSAFE_withComponentProps(function AboutUsPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "About Nile Flow Africa"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Our mission is to digitize African commerce infrastructure and empower youth participation in the economy."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsxs("div", {
				className: "max-w-3xl mx-auto space-y-8",
				children: [/* @__PURE__ */ jsxs("div", {
					className: "nile-card p-8",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "nile-h3 mb-4",
						children: "Our Story"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body leading-relaxed",
						children: "Nile Flow is a hyperlocal commerce ecosystem designed to connect local merchants and consumers through accessible, culturally adaptive digital commerce solutions. We are building the foundational digital infrastructure for African commerce."
					})]
				}), /* @__PURE__ */ jsxs("div", {
					className: "nile-card p-8",
					children: [/* @__PURE__ */ jsx("h2", {
						className: "nile-h3 mb-4",
						children: "Our Mission"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body leading-relaxed",
						children: "We exist to digitize African commerce, empower youth participation in the economy, build trust-centered digital commerce, create culturally adaptive technology, and scale South Sudanese innovation globally."
					})]
				})]
			})
		})]
	});
});
//#endregion
//#region app/features/home/ContactPage.tsx
var ContactPage_exports = /* @__PURE__ */ __exportAll({
	default: () => ContactPage_default,
	meta: () => meta$11
});
/**
* Contact Us â€” Nile Flow Africa
*
* Route: /contact
* Purpose: Get in touch with Nile Flow support.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$11({}) {
	return seoMeta("/contact");
}
var ContactPage_default = UNSAFE_withComponentProps(function ContactPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Contact Us"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "We'd love to hear from you."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/home/HelpCenterPage.tsx
var HelpCenterPage_exports = /* @__PURE__ */ __exportAll({
	default: () => HelpCenterPage_default,
	meta: () => meta$10
});
/**
* Help Center â€” Nile Flow Africa
*
* Route: /help
* Purpose: Find answers to common questions.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$10({}) {
	return seoMeta("/help");
}
var HelpCenterPage_default = UNSAFE_withComponentProps(function HelpCenterPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Help Center"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "How can we help you?"
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/home/CareersPage.tsx
var CareersPage_exports = /* @__PURE__ */ __exportAll({
	default: () => CareersPage_default,
	meta: () => meta$9
});
/**
* Join Our Team â€” Nile Flow Africa
*
* Route: /careers
* Purpose: Join the Nile Flow team.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$9({}) {
	return seoMeta("/careers");
}
var CareersPage_default = UNSAFE_withComponentProps(function CareersPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Join Our Team"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Help shape the future of African commerce."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/home/PrivacyPolicyPage.tsx
var PrivacyPolicyPage_exports = /* @__PURE__ */ __exportAll({
	default: () => PrivacyPolicyPage_default,
	meta: () => meta$8
});
/**
* Privacy Policy â€” Nile Flow Africa
*
* Route: /privacy
* Purpose: Understand how we protect your data.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$8({}) {
	return seoMeta("/privacy");
}
var PrivacyPolicyPage_default = UNSAFE_withComponentProps(function PrivacyPolicyPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Privacy Policy"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Your privacy matters to us."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/home/TermsOfServicePage.tsx
var TermsOfServicePage_exports = /* @__PURE__ */ __exportAll({
	default: () => TermsOfServicePage_default,
	meta: () => meta$7
});
/**
* Terms of Service â€” Nile Flow Africa
*
* Route: /terms
* Purpose: Review our terms and conditions.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$7({}) {
	return seoMeta("/terms");
}
var TermsOfServicePage_default = UNSAFE_withComponentProps(function TermsOfServicePage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Terms of Service"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Please read these terms carefully."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/home/ReturnPolicyPage.tsx
var ReturnPolicyPage_exports = /* @__PURE__ */ __exportAll({
	default: () => ReturnPolicyPage_default,
	meta: () => meta$6
});
/**
* Return Policy â€” Nile Flow Africa
*
* Route: /returns
* Purpose: Read our return policy.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$6({}) {
	return seoMeta("/returns");
}
var ReturnPolicyPage_default = UNSAFE_withComponentProps(function ReturnPolicyPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Return Policy"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Hassle-free returns within 30 days."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/home/ReportProblemPage.tsx
var ReportProblemPage_exports = /* @__PURE__ */ __exportAll({
	default: () => ReportProblemPage_default,
	meta: () => meta$5
});
/**
* Report a Problem â€” Nile Flow Africa
*
* Route: /report-problem
* Purpose: Report an issue.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$5({}) {
	return seoMeta("/report-problem");
}
var ReportProblemPage_default = UNSAFE_withComponentProps(function ReportProblemPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Report a Problem"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "We're here to help resolve any issues."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/home/CurrencyPage.tsx
var CurrencyPage_exports = /* @__PURE__ */ __exportAll({
	default: () => CurrencyPage_default,
	meta: () => meta$4
});
/**
* Currency â€” Nile Flow Africa
*
* Route: /currency
* Purpose: Set your preferred currency.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$4({}) {
	return seoMeta("/currency");
}
var CurrencyPage_default = UNSAFE_withComponentProps(function CurrencyPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Currency"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Choose your preferred currency."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/home/LanguagePage.tsx
var LanguagePage_exports = /* @__PURE__ */ __exportAll({
	default: () => LanguagePage_default,
	meta: () => meta$3
});
/**
* Language â€” Nile Flow Africa
*
* Route: /language
* Purpose: Choose your language.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$3({}) {
	return seoMeta("/language");
}
var LanguagePage_default = UNSAFE_withComponentProps(function LanguagePage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Language"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "Select your preferred language."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/profile/AccountDeletionPage.tsx
var AccountDeletionPage_exports = /* @__PURE__ */ __exportAll({
	default: () => AccountDeletionPage_default,
	meta: () => meta$2
});
/**
* Delete Account â€” Nile Flow Africa
*
* Route: /account-deletion
* Purpose: Request account deletion.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$2({}) {
	return seoMeta("/account-deletion");
}
var AccountDeletionPage_default = UNSAFE_withComponentProps(function AccountDeletionPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Delete Account"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "We're sorry to see you go."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/premium/SubscriptionSuccessPage.tsx
var SubscriptionSuccessPage_exports = /* @__PURE__ */ __exportAll({
	default: () => SubscriptionSuccessPage_default,
	meta: () => meta$1
});
/**
* Welcome to Premium! â€” Nile Flow Africa
*
* Route: /subscription-success
* Purpose: Your premium subscription is active.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta$1({}) {
	return seoMeta("/subscription-success");
}
var SubscriptionSuccessPage_default = UNSAFE_withComponentProps(function SubscriptionSuccessPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Welcome to Premium!"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "You now have access to exclusive benefits."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region app/features/home/NotFoundPage.tsx
var NotFoundPage_exports = /* @__PURE__ */ __exportAll({
	default: () => NotFoundPage_default,
	meta: () => meta
});
/**
* Page Not Found â€” Nile Flow Africa
*
* Route: *
* Purpose: The page you're looking for doesn't exist.
* Design: Uses nile-* utility classes consistent with Mobileapp design system
*/
function meta({}) {
	return seoMeta("*");
}
var NotFoundPage_default = UNSAFE_withComponentProps(function NotFoundPage() {
	return /* @__PURE__ */ jsxs("div", {
		className: "nile-screen",
		children: [/* @__PURE__ */ jsx("section", {
			className: "bg-gradient-to-br from-nile-green-50 to-white border-b border-nile-border",
			children: /* @__PURE__ */ jsx("div", {
				className: "container-page py-12 md:py-16 lg:py-20",
				children: /* @__PURE__ */ jsxs("div", {
					className: "max-w-3xl mx-auto text-center",
					children: [/* @__PURE__ */ jsx("h1", {
						className: "nile-h1 mb-4",
						children: "Page Not Found"
					}), /* @__PURE__ */ jsx("p", {
						className: "nile-body text-lg",
						children: "The page you're looking for doesn't exist or has been moved."
					})]
				})
			})
		}), /* @__PURE__ */ jsx("section", {
			className: "container-page py-12",
			children: /* @__PURE__ */ jsx("div", {
				className: "max-w-3xl mx-auto",
				children: /* @__PURE__ */ jsx("div", {
					className: "nile-card p-8",
					children: /* @__PURE__ */ jsxs("div", {
						className: "text-center py-8",
						children: [
							/* @__PURE__ */ jsx("div", {
								className: "w-16 h-16 rounded-full bg-nile-green-100 flex items-center justify-center mx-auto mb-4",
								children: /* @__PURE__ */ jsx("svg", {
									className: "w-8 h-8 text-nile-green-600",
									fill: "none",
									viewBox: "0 0 24 24",
									stroke: "currentColor",
									children: /* @__PURE__ */ jsx("path", {
										"stroke-linecap": "round",
										"stroke-linejoin": "round",
										"stroke-width": "2",
										d: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
									})
								})
							}),
							/* @__PURE__ */ jsx("h2", {
								className: "nile-subheading text-xl mb-2",
								children: "Coming Soon"
							}),
							/* @__PURE__ */ jsx("p", {
								className: "nile-body",
								children: "This page is under construction and will be available shortly."
							})
						]
					})
				})
			})
		})]
	});
});
//#endregion
//#region \0virtual:react-router/server-manifest
var server_manifest_default = {
	"entry": {
		"module": "/assets/entry.client-63uVeG6r.js",
		"imports": ["/assets/jsx-runtime-CEFdSpyz.js", "/assets/monitoring-6NOnv3qJ.js"],
		"css": []
	},
	"routes": {
		"root": {
			"id": "root",
			"parentId": void 0,
			"path": "",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": true,
			"module": "/assets/root-DfVaJ1DO.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/monitoring-6NOnv3qJ.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": ["/assets/root-B40pHwOx.css"],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/HomePage": {
			"id": "features/home/HomePage",
			"parentId": "root",
			"path": "/",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/HomePage-C0-tr0s7.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/products/ShopPage": {
			"id": "features/products/ShopPage",
			"parentId": "root",
			"path": "shop",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/ShopPage-DcSLI2B_.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/products/ProductDetailPage": {
			"id": "features/products/ProductDetailPage",
			"parentId": "root",
			"path": "products/:id",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/ProductDetailPage-CGwJ0aFJ.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/products/CategoryPage": {
			"id": "features/products/CategoryPage",
			"parentId": "root",
			"path": "categories/:slug",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/CategoryPage-BNc1G41q.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/products/DealsPage": {
			"id": "features/products/DealsPage",
			"parentId": "root",
			"path": "deals",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/DealsPage-DWcd0gP-.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/products/SearchPage": {
			"id": "features/products/SearchPage",
			"parentId": "root",
			"path": "search",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/SearchPage-Z_hIOhbn.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/cart/CartPage": {
			"id": "features/cart/CartPage",
			"parentId": "root",
			"path": "cart",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/CartPage-CnxM1_AV.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/checkout/CheckoutPage": {
			"id": "features/checkout/CheckoutPage",
			"parentId": "root",
			"path": "checkout",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/CheckoutPage-bp1D4w0k.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/checkout/PaymentPage": {
			"id": "features/checkout/PaymentPage",
			"parentId": "root",
			"path": "payment",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/PaymentPage-DIte8Vk7.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/checkout/PaymentSuccessPage": {
			"id": "features/checkout/PaymentSuccessPage",
			"parentId": "root",
			"path": "payment/success",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/PaymentSuccessPage-AHRojSb7.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/checkout/PaymentCancelledPage": {
			"id": "features/checkout/PaymentCancelledPage",
			"parentId": "root",
			"path": "payment/cancelled",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/PaymentCancelledPage-NqfeWy3i.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/auth/SignInPage": {
			"id": "features/auth/SignInPage",
			"parentId": "root",
			"path": "sign-in",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/SignInPage-C4lES1kS.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/auth/SignUpPage": {
			"id": "features/auth/SignUpPage",
			"parentId": "root",
			"path": "sign-up",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/SignUpPage-DGUQWHfy.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/auth/ForgotPasswordPage": {
			"id": "features/auth/ForgotPasswordPage",
			"parentId": "root",
			"path": "forgot-password",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/ForgotPasswordPage-DxAwZm62.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/auth/ResetPasswordPage": {
			"id": "features/auth/ResetPasswordPage",
			"parentId": "root",
			"path": "reset-password",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/ResetPasswordPage-DjU_LA7V.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/auth/OAuthCallbackPage": {
			"id": "features/auth/OAuthCallbackPage",
			"parentId": "root",
			"path": "oauth/callback",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/OAuthCallbackPage-C-lLqQjF.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/premium/PremiumDealsPage": {
			"id": "features/premium/PremiumDealsPage",
			"parentId": "root",
			"path": "premium",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/PremiumDealsPage-Bj-OZ3dn.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/miles/MilesPage": {
			"id": "features/miles/MilesPage",
			"parentId": "root",
			"path": "miles",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/MilesPage-BmsK7xeH.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/miles/RedeemPage": {
			"id": "features/miles/RedeemPage",
			"parentId": "root",
			"path": "redeem",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/RedeemPage-CGSnlvEC.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/group-buying/GroupBuyPage": {
			"id": "features/group-buying/GroupBuyPage",
			"parentId": "root",
			"path": "group-buying",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/GroupBuyPage-I6JTrbJF.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/notifications/NotificationsPage": {
			"id": "features/notifications/NotificationsPage",
			"parentId": "root",
			"path": "notifications",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/NotificationsPage-CI3Mo8Jy.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/profile/OrdersPage": {
			"id": "features/profile/OrdersPage",
			"parentId": "root",
			"path": "orders",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/OrdersPage-DPlf2bgI.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/profile/TrackOrderPage": {
			"id": "features/profile/TrackOrderPage",
			"parentId": "root",
			"path": "orders/:id/track",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/TrackOrderPage-CkrhZAvw.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/profile/CancelOrderPage": {
			"id": "features/profile/CancelOrderPage",
			"parentId": "root",
			"path": "orders/:id/cancel",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/CancelOrderPage-BaedaSAd.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/profile/AddressesPage": {
			"id": "features/profile/AddressesPage",
			"parentId": "root",
			"path": "addresses",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/AddressesPage-1P2s8nJJ.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/profile/SettingsPage": {
			"id": "features/profile/SettingsPage",
			"parentId": "root",
			"path": "settings",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/SettingsPage-CWVQzH_Q.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/profile/ProfilePage": {
			"id": "features/profile/ProfilePage",
			"parentId": "root",
			"path": "profile",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/ProfilePage-6J-ScoJn.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/DiscoverAfricaPage": {
			"id": "features/home/DiscoverAfricaPage",
			"parentId": "root",
			"path": "discover-africa",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/DiscoverAfricaPage-XAQsRzgf.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/MarketplaceHubPage": {
			"id": "features/home/MarketplaceHubPage",
			"parentId": "root",
			"path": "marketplace",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/MarketplaceHubPage-DONoh9xt.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/ArtisanProfilePage": {
			"id": "features/home/ArtisanProfilePage",
			"parentId": "root",
			"path": "artisans/:id",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/ArtisanProfilePage-DrWyeBO1.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/AfricanChroniclesPage": {
			"id": "features/home/AfricanChroniclesPage",
			"parentId": "root",
			"path": "chronicles",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/AfricanChroniclesPage-BhnTWTbQ.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/FeaturedProductsPage": {
			"id": "features/home/FeaturedProductsPage",
			"parentId": "root",
			"path": "featured",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/FeaturedProductsPage-BLCUfc5C.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/AboutUsPage": {
			"id": "features/home/AboutUsPage",
			"parentId": "root",
			"path": "about",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/AboutUsPage-D31u5brN.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/ContactPage": {
			"id": "features/home/ContactPage",
			"parentId": "root",
			"path": "contact",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/ContactPage-vK73acll.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/HelpCenterPage": {
			"id": "features/home/HelpCenterPage",
			"parentId": "root",
			"path": "help",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/HelpCenterPage-CdwD3VxQ.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/CareersPage": {
			"id": "features/home/CareersPage",
			"parentId": "root",
			"path": "careers",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/CareersPage-BNnmngsC.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/PrivacyPolicyPage": {
			"id": "features/home/PrivacyPolicyPage",
			"parentId": "root",
			"path": "privacy",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/PrivacyPolicyPage-BZqvSSp5.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/TermsOfServicePage": {
			"id": "features/home/TermsOfServicePage",
			"parentId": "root",
			"path": "terms",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/TermsOfServicePage-jYQBkmki.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/ReturnPolicyPage": {
			"id": "features/home/ReturnPolicyPage",
			"parentId": "root",
			"path": "returns",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/ReturnPolicyPage-CDZ_Jina.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/ReportProblemPage": {
			"id": "features/home/ReportProblemPage",
			"parentId": "root",
			"path": "report-problem",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/ReportProblemPage-BKs9uMHc.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/CurrencyPage": {
			"id": "features/home/CurrencyPage",
			"parentId": "root",
			"path": "currency",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/CurrencyPage-PjQS4b0Q.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/LanguagePage": {
			"id": "features/home/LanguagePage",
			"parentId": "root",
			"path": "language",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/LanguagePage-BRHiaudZ.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/profile/AccountDeletionPage": {
			"id": "features/profile/AccountDeletionPage",
			"parentId": "root",
			"path": "account-deletion",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/AccountDeletionPage-CtwyDj0D.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/premium/SubscriptionSuccessPage": {
			"id": "features/premium/SubscriptionSuccessPage",
			"parentId": "root",
			"path": "subscription-success",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/SubscriptionSuccessPage-CFf4bjZI.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		},
		"features/home/NotFoundPage": {
			"id": "features/home/NotFoundPage",
			"parentId": "root",
			"path": "*",
			"index": void 0,
			"caseSensitive": void 0,
			"hasAction": false,
			"hasLoader": false,
			"hasClientAction": false,
			"hasClientLoader": false,
			"hasClientMiddleware": false,
			"hasDefaultExport": true,
			"hasErrorBoundary": false,
			"module": "/assets/NotFoundPage-B7i6dRKn.js",
			"imports": [
				"/assets/jsx-runtime-CEFdSpyz.js",
				"/assets/seo-meta-yQ-QwFH9.js",
				"/assets/seo-B6r3859E.js"
			],
			"css": [],
			"clientActionModule": void 0,
			"clientLoaderModule": void 0,
			"clientMiddlewareModule": void 0,
			"hydrateFallbackModule": void 0
		}
	},
	"url": "/assets/manifest-766c8522.js",
	"version": "766c8522",
	"sri": void 0
};
//#endregion
//#region \0virtual:react-router/server-build
var assetsBuildDirectory = "build\\client";
var basename = "/";
var future = { "unstable_optimizeDeps": false };
var ssr = true;
var isSpaMode = false;
var prerender = [];
var routeDiscovery = {
	"mode": "lazy",
	"manifestPath": "/__manifest"
};
var publicPath = "/";
var entry = { module: entry_server_exports };
var routes = {
	"root": {
		id: "root",
		parentId: void 0,
		path: "",
		index: void 0,
		caseSensitive: void 0,
		module: root_exports
	},
	"features/home/HomePage": {
		id: "features/home/HomePage",
		parentId: "root",
		path: "/",
		index: void 0,
		caseSensitive: void 0,
		module: HomePage_exports
	},
	"features/products/ShopPage": {
		id: "features/products/ShopPage",
		parentId: "root",
		path: "shop",
		index: void 0,
		caseSensitive: void 0,
		module: ShopPage_exports
	},
	"features/products/ProductDetailPage": {
		id: "features/products/ProductDetailPage",
		parentId: "root",
		path: "products/:id",
		index: void 0,
		caseSensitive: void 0,
		module: ProductDetailPage_exports
	},
	"features/products/CategoryPage": {
		id: "features/products/CategoryPage",
		parentId: "root",
		path: "categories/:slug",
		index: void 0,
		caseSensitive: void 0,
		module: CategoryPage_exports
	},
	"features/products/DealsPage": {
		id: "features/products/DealsPage",
		parentId: "root",
		path: "deals",
		index: void 0,
		caseSensitive: void 0,
		module: DealsPage_exports
	},
	"features/products/SearchPage": {
		id: "features/products/SearchPage",
		parentId: "root",
		path: "search",
		index: void 0,
		caseSensitive: void 0,
		module: SearchPage_exports
	},
	"features/cart/CartPage": {
		id: "features/cart/CartPage",
		parentId: "root",
		path: "cart",
		index: void 0,
		caseSensitive: void 0,
		module: CartPage_exports
	},
	"features/checkout/CheckoutPage": {
		id: "features/checkout/CheckoutPage",
		parentId: "root",
		path: "checkout",
		index: void 0,
		caseSensitive: void 0,
		module: CheckoutPage_exports
	},
	"features/checkout/PaymentPage": {
		id: "features/checkout/PaymentPage",
		parentId: "root",
		path: "payment",
		index: void 0,
		caseSensitive: void 0,
		module: PaymentPage_exports
	},
	"features/checkout/PaymentSuccessPage": {
		id: "features/checkout/PaymentSuccessPage",
		parentId: "root",
		path: "payment/success",
		index: void 0,
		caseSensitive: void 0,
		module: PaymentSuccessPage_exports
	},
	"features/checkout/PaymentCancelledPage": {
		id: "features/checkout/PaymentCancelledPage",
		parentId: "root",
		path: "payment/cancelled",
		index: void 0,
		caseSensitive: void 0,
		module: PaymentCancelledPage_exports
	},
	"features/auth/SignInPage": {
		id: "features/auth/SignInPage",
		parentId: "root",
		path: "sign-in",
		index: void 0,
		caseSensitive: void 0,
		module: SignInPage_exports
	},
	"features/auth/SignUpPage": {
		id: "features/auth/SignUpPage",
		parentId: "root",
		path: "sign-up",
		index: void 0,
		caseSensitive: void 0,
		module: SignUpPage_exports
	},
	"features/auth/ForgotPasswordPage": {
		id: "features/auth/ForgotPasswordPage",
		parentId: "root",
		path: "forgot-password",
		index: void 0,
		caseSensitive: void 0,
		module: ForgotPasswordPage_exports
	},
	"features/auth/ResetPasswordPage": {
		id: "features/auth/ResetPasswordPage",
		parentId: "root",
		path: "reset-password",
		index: void 0,
		caseSensitive: void 0,
		module: ResetPasswordPage_exports
	},
	"features/auth/OAuthCallbackPage": {
		id: "features/auth/OAuthCallbackPage",
		parentId: "root",
		path: "oauth/callback",
		index: void 0,
		caseSensitive: void 0,
		module: OAuthCallbackPage_exports
	},
	"features/premium/PremiumDealsPage": {
		id: "features/premium/PremiumDealsPage",
		parentId: "root",
		path: "premium",
		index: void 0,
		caseSensitive: void 0,
		module: PremiumDealsPage_exports
	},
	"features/miles/MilesPage": {
		id: "features/miles/MilesPage",
		parentId: "root",
		path: "miles",
		index: void 0,
		caseSensitive: void 0,
		module: MilesPage_exports
	},
	"features/miles/RedeemPage": {
		id: "features/miles/RedeemPage",
		parentId: "root",
		path: "redeem",
		index: void 0,
		caseSensitive: void 0,
		module: RedeemPage_exports
	},
	"features/group-buying/GroupBuyPage": {
		id: "features/group-buying/GroupBuyPage",
		parentId: "root",
		path: "group-buying",
		index: void 0,
		caseSensitive: void 0,
		module: GroupBuyPage_exports
	},
	"features/notifications/NotificationsPage": {
		id: "features/notifications/NotificationsPage",
		parentId: "root",
		path: "notifications",
		index: void 0,
		caseSensitive: void 0,
		module: NotificationsPage_exports
	},
	"features/profile/OrdersPage": {
		id: "features/profile/OrdersPage",
		parentId: "root",
		path: "orders",
		index: void 0,
		caseSensitive: void 0,
		module: OrdersPage_exports
	},
	"features/profile/TrackOrderPage": {
		id: "features/profile/TrackOrderPage",
		parentId: "root",
		path: "orders/:id/track",
		index: void 0,
		caseSensitive: void 0,
		module: TrackOrderPage_exports
	},
	"features/profile/CancelOrderPage": {
		id: "features/profile/CancelOrderPage",
		parentId: "root",
		path: "orders/:id/cancel",
		index: void 0,
		caseSensitive: void 0,
		module: CancelOrderPage_exports
	},
	"features/profile/AddressesPage": {
		id: "features/profile/AddressesPage",
		parentId: "root",
		path: "addresses",
		index: void 0,
		caseSensitive: void 0,
		module: AddressesPage_exports
	},
	"features/profile/SettingsPage": {
		id: "features/profile/SettingsPage",
		parentId: "root",
		path: "settings",
		index: void 0,
		caseSensitive: void 0,
		module: SettingsPage_exports
	},
	"features/profile/ProfilePage": {
		id: "features/profile/ProfilePage",
		parentId: "root",
		path: "profile",
		index: void 0,
		caseSensitive: void 0,
		module: ProfilePage_exports
	},
	"features/home/DiscoverAfricaPage": {
		id: "features/home/DiscoverAfricaPage",
		parentId: "root",
		path: "discover-africa",
		index: void 0,
		caseSensitive: void 0,
		module: DiscoverAfricaPage_exports
	},
	"features/home/MarketplaceHubPage": {
		id: "features/home/MarketplaceHubPage",
		parentId: "root",
		path: "marketplace",
		index: void 0,
		caseSensitive: void 0,
		module: MarketplaceHubPage_exports
	},
	"features/home/ArtisanProfilePage": {
		id: "features/home/ArtisanProfilePage",
		parentId: "root",
		path: "artisans/:id",
		index: void 0,
		caseSensitive: void 0,
		module: ArtisanProfilePage_exports
	},
	"features/home/AfricanChroniclesPage": {
		id: "features/home/AfricanChroniclesPage",
		parentId: "root",
		path: "chronicles",
		index: void 0,
		caseSensitive: void 0,
		module: AfricanChroniclesPage_exports
	},
	"features/home/FeaturedProductsPage": {
		id: "features/home/FeaturedProductsPage",
		parentId: "root",
		path: "featured",
		index: void 0,
		caseSensitive: void 0,
		module: FeaturedProductsPage_exports
	},
	"features/home/AboutUsPage": {
		id: "features/home/AboutUsPage",
		parentId: "root",
		path: "about",
		index: void 0,
		caseSensitive: void 0,
		module: AboutUsPage_exports
	},
	"features/home/ContactPage": {
		id: "features/home/ContactPage",
		parentId: "root",
		path: "contact",
		index: void 0,
		caseSensitive: void 0,
		module: ContactPage_exports
	},
	"features/home/HelpCenterPage": {
		id: "features/home/HelpCenterPage",
		parentId: "root",
		path: "help",
		index: void 0,
		caseSensitive: void 0,
		module: HelpCenterPage_exports
	},
	"features/home/CareersPage": {
		id: "features/home/CareersPage",
		parentId: "root",
		path: "careers",
		index: void 0,
		caseSensitive: void 0,
		module: CareersPage_exports
	},
	"features/home/PrivacyPolicyPage": {
		id: "features/home/PrivacyPolicyPage",
		parentId: "root",
		path: "privacy",
		index: void 0,
		caseSensitive: void 0,
		module: PrivacyPolicyPage_exports
	},
	"features/home/TermsOfServicePage": {
		id: "features/home/TermsOfServicePage",
		parentId: "root",
		path: "terms",
		index: void 0,
		caseSensitive: void 0,
		module: TermsOfServicePage_exports
	},
	"features/home/ReturnPolicyPage": {
		id: "features/home/ReturnPolicyPage",
		parentId: "root",
		path: "returns",
		index: void 0,
		caseSensitive: void 0,
		module: ReturnPolicyPage_exports
	},
	"features/home/ReportProblemPage": {
		id: "features/home/ReportProblemPage",
		parentId: "root",
		path: "report-problem",
		index: void 0,
		caseSensitive: void 0,
		module: ReportProblemPage_exports
	},
	"features/home/CurrencyPage": {
		id: "features/home/CurrencyPage",
		parentId: "root",
		path: "currency",
		index: void 0,
		caseSensitive: void 0,
		module: CurrencyPage_exports
	},
	"features/home/LanguagePage": {
		id: "features/home/LanguagePage",
		parentId: "root",
		path: "language",
		index: void 0,
		caseSensitive: void 0,
		module: LanguagePage_exports
	},
	"features/profile/AccountDeletionPage": {
		id: "features/profile/AccountDeletionPage",
		parentId: "root",
		path: "account-deletion",
		index: void 0,
		caseSensitive: void 0,
		module: AccountDeletionPage_exports
	},
	"features/premium/SubscriptionSuccessPage": {
		id: "features/premium/SubscriptionSuccessPage",
		parentId: "root",
		path: "subscription-success",
		index: void 0,
		caseSensitive: void 0,
		module: SubscriptionSuccessPage_exports
	},
	"features/home/NotFoundPage": {
		id: "features/home/NotFoundPage",
		parentId: "root",
		path: "*",
		index: void 0,
		caseSensitive: void 0,
		module: NotFoundPage_exports
	}
};
var allowedActionOrigins = false;
//#endregion
export { allowedActionOrigins, server_manifest_default as assets, assetsBuildDirectory, basename, entry, future, isSpaMode, prerender, publicPath, routeDiscovery, routes, ssr };
