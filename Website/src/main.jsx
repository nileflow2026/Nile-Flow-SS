import React from "react";
import ReactDOM from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import * as Sentry from "@sentry/react";
import App from "./App";
import "./index.css";

// Initialize Sentry synchronously so it's ready before any user interaction
Sentry.init({
  dsn: "https://4f439835f9a532d6371f7e0421b83766@o4510430501666816.ingest.us.sentry.io/4511230033199104",
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION,
  sendDefaultPii: true,
  // Capture 10% of sessions for performance tracing
  tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
  // Replay 100% of sessions with errors, 5% of all sessions
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

// Defer non-critical imports
const loadNonCriticalAssets = () => {
  // Load carousel styles asynchronously
  import("slick-carousel/slick/slick.css");
  import("slick-carousel/slick/slick-theme.css");

  // Load FontAwesome asynchronously
  import("@fortawesome/fontawesome-free");
};

// Load non-critical assets after initial render
setTimeout(loadNonCriticalAssets, 100);

// Use concurrent mode for better performance
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <App />
    </HelmetProvider>
  </React.StrictMode>,
);
