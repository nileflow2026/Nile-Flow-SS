// __APP_VERSION__ is injected at build time by vite.config.js (git SHA).
// The typeof guard prevents a ReferenceError if the build didn't run the define
// replacement (e.g. cached build, non-Vite runner). In that case we simply
// skip update checks so the app never crashes.
/* global __APP_VERSION__ */
const CURRENT_VERSION =
  typeof __APP_VERSION__ !== "undefined" ? __APP_VERSION__ : null;
const RELOAD_GUARD_KEY = "rider:update-reload-guard";

export function shouldAutoReloadForVersion(version) {
  if (!version) return false;

  try {
    const storedVersion = window.sessionStorage.getItem(RELOAD_GUARD_KEY);
    if (storedVersion === version) {
      return false;
    }

    window.sessionStorage.setItem(RELOAD_GUARD_KEY, version);
    return true;
  } catch {
    return false;
  }
}

/**
 * Fetches the server-side version and compares it with the running build.
 * Returns { hasUpdate: boolean, force: boolean, version?: string }.
 */
export async function checkForUpdate() {
  // If we don't have a version to compare against, bail out silently.
  if (!CURRENT_VERSION) return { hasUpdate: false };

  try {
    const backendUrl =
      import.meta.env.VITE_API_URL ||
      "https://nile-flow-backend-5dqm.onrender.com";
    const res = await fetch(`${backendUrl}/api/version`, { cache: "no-store" });
    if (!res.ok) return { hasUpdate: false };

    const contentType = res.headers.get("content-type") || "";
    if (!contentType.includes("application/json")) {
      return { hasUpdate: false };
    }

    const data = await res.json();
    if (data.version && data.version !== CURRENT_VERSION) {
      return {
        hasUpdate: true,
        force: !!data.forceUpdate,
        version: data.version,
      };
    }

    return { hasUpdate: false };
  } catch {
    return { hasUpdate: false };
  }
}
