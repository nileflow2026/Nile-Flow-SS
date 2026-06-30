/**
 * Nile Flow Monitoring — Sentry + PostHog
 *
 * Single entry point for error tracking and analytics.
 * Initialized once in entry.client.tsx, used across the app.
 *
 * Sentry DSN (from old Website):
 *   https://4f439835f9a532d6371f7e0421b83766@o4510430501666816.ingest.us.sentry.io/4511230033199104
 *
 * PostHog key (from old Website .env):
 *   phc_nKMceBtSnFSMrAdmikN22RTSPcP3UUvXWzxv96kaBGaH
 */

import * as Sentry from "@sentry/react";
import posthog from "posthog-js";

const POSTHOG_KEY =
  (typeof process !== "undefined" &&
    (process.env as Record<string, string>)?.VITE_PUBLIC_POSTHOG_KEY) ||
  "phc_nKMceBtSnFSMrAdmikN22RTSPcP3UUvXWzxv96kaBGaH";

const POSTHOG_HOST =
  (typeof process !== "undefined" &&
    (process.env as Record<string, string>)?.VITE_PUBLIC_POSTHOG_HOST) ||
  "https://us.i.posthog.com";

const SENTRY_DSN =
  "https://4f439835f9a532d6371f7e0421b83766@o4510430501666816.ingest.us.sentry.io/4511230033199104";

let initialized = false;

export function initMonitoring(): void {
  if (initialized) return;
  initialized = true;

  // Sentry — error tracking + performance + session replay
  Sentry.init({
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    release: import.meta.env.VITE_APP_VERSION || undefined,
    sendDefaultPii: false,
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    replaysOnErrorSampleRate: 1.0,
    replaysSessionSampleRate: 0.05,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
  });

  // PostHog — product analytics
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    capture_pageview: false, // Handled manually per-route
    loaded: () => {
      // Opt-in to autocapture for clicks/inputs
      posthog.set_config({ autocapture: true });
    },
  });
}

/** Track a page view manually */
export function trackPageView(pathname: string): void {
  posthog.capture("$pageview", { path: pathname });
}

/** Track a custom event */
export function trackEvent(name: string, properties?: Record<string, unknown>): void {
  posthog.capture(name, properties);
}

/** Expose Sentry for manual error reporting */
export { Sentry };
