import { HydratedRouter } from "react-router/dom";
import { startTransition, StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { initMonitoring } from "./lib/monitoring";

// Initialize Sentry + PostHog before anything renders
initMonitoring();

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <HydratedRouter />
    </StrictMode>
  );
});
