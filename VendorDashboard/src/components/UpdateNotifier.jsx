import { Component, useEffect, useState } from "react";
import { checkForUpdate } from "../core/versionManager";

const CHECK_INTERVAL_MS = 60_000; // 60 seconds
const DISMISSED_VERSION_KEY = "vendor_dashboard_dismissed_update_version";

function UpdateBanner() {
  const [updateAvailable, setUpdateAvailable] = useState(false);
  const [availableVersion, setAvailableVersion] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function poll() {
      const result = await checkForUpdate();
      if (cancelled) return;

      if (result.hasUpdate) {
        const nextVersion = result.version || "unknown";
        const dismissedVersion = localStorage.getItem(DISMISSED_VERSION_KEY);

        if (dismissedVersion === nextVersion) {
          setUpdateAvailable(false);
          return;
        }

        if (result.force) {
          const forcedVersionKey = "vendor_dashboard_last_forced_reload";
          const lastForcedVersion = sessionStorage.getItem(forcedVersionKey);

          if (lastForcedVersion === nextVersion) {
            setAvailableVersion(nextVersion);
            setUpdateAvailable(true);
            return;
          }

          sessionStorage.setItem(forcedVersionKey, nextVersion);
          window.location.reload();
          return;
        }
        setAvailableVersion(nextVersion);
        setUpdateAvailable(true);
      }
    }

    poll();
    const id = setInterval(poll, CHECK_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, []);

  if (!updateAvailable) return null;

  return (
    <div
      role="alert"
      style={{
        position: "fixed",
        bottom: 20,
        left: 20,
        right: 20,
        background: "#111827",
        color: "#f9fafb",
        padding: "12px 16px",
        borderRadius: "8px",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: "12px",
        boxShadow: "0 4px 24px rgba(0,0,0,0.35)",
      }}
    >
      <span style={{ fontSize: "14px" }}>
        A new version of the vendor dashboard is available.
      </span>
      <button
        onClick={() => {
          if (availableVersion) {
            localStorage.setItem(DISMISSED_VERSION_KEY, availableVersion);
          }
          setUpdateAvailable(false);
          window.location.reload();
        }}
        style={{
          background: "#f59e0b",
          color: "#111827",
          border: "none",
          borderRadius: "6px",
          padding: "6px 14px",
          fontWeight: 700,
          cursor: "pointer",
          fontSize: "13px",
          whiteSpace: "nowrap",
        }}
      >
        Update now
      </button>
    </div>
  );
}

// Error boundary ensures a crash inside UpdateBanner never blanks the whole app.
class UpdateNotifierBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { crashed: false };
  }
  static getDerivedStateFromError() {
    return { crashed: true };
  }
  componentDidCatch(err) {
    console.error("[UpdateNotifier] Isolated error:", err);
  }
  render() {
    if (this.state.crashed) return null;
    return this.props.children;
  }
}

export default function UpdateNotifier() {
  return (
    <UpdateNotifierBoundary>
      <UpdateBanner />
    </UpdateNotifierBoundary>
  );
}
