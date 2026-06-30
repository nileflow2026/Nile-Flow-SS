import { useEffect } from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";

import type { Route } from "./+types/root";
import {
  SITE_NAME,
  SITE_URL,
  buildOrganizationSchema,
  buildWebSiteSchema,
} from "./lib/seo";
import { trackPageView, Sentry } from "./lib/monitoring";
import Header from "./components/layout/Header";
import Footer from "./components/layout/Footer";
import "./styles/app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&family=Poppins:wght@300;400;500;600;700;800;900&display=swap",
  },
  { rel: "sitemap", type: "application/xml", href: "/sitemap.xml" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const schemaOrg = JSON.stringify(buildOrganizationSchema());
  const schemaSite = JSON.stringify(buildWebSiteSchema());

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#16A34A" />
        <meta name="robots" content="index, follow" />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:locale" content="en_US" />
        <Meta />
        <Links />
        {/* Global JSON-LD — Organization + WebSite schemas */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaOrg }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: schemaSite }}
        />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const location = useLocation();

  // PostHog pageview tracking on every route change
  useEffect(() => {
    trackPageView(location.pathname);
  }, [location.pathname]);

  return (
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }: { error: unknown; resetError: () => void }) => {
        const msg =
          typeof error === "object" && error !== null
            ? String((error as Record<string, unknown>).message ?? "")
            : "";
        const isChunkError =
          msg.includes("Failed to fetch") ||
          msg.includes("dynamically imported");

        return (
          <div className="nile-screen">
            <div className="container-page py-16 text-center">
              <h1 className="nile-h1 mb-4">
                {isChunkError ? "Loading Error" : "Something went wrong"}
              </h1>
              <p className="nile-body max-w-lg mx-auto mb-8">
                {isChunkError
                  ? "A resource failed to load. A refresh should fix it."
                  : "We've been notified and are looking into it."}
              </p>
              <button
                onClick={() => {
                  if (isChunkError) {
                    window.location.reload();
                  } else {
                    resetError();
                  }
                }}
                className="nile-btn"
              >
                {isChunkError ? "Refresh Page" : "Try Again"}
              </button>
            </div>
          </div>
        );
      }}
      showDialog
    >
      <Header />
      <Outlet />
      <Footer />
    </Sentry.ErrorBoundary>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="container-page py-16">
      <h1 className="nile-h1">{message}</h1>
      <p className="nile-body mt-4">{details}</p>
      {stack && (
        <pre className="w-full p-4 mt-8 overflow-x-auto bg-nile-surface rounded-xl text-sm">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
