// src/auth/AuditLogger.js
/**
 * Security Event Audit Logger
 * Logs all security-sensitive events for compliance and incident investigation.
 * Events are stored in localStorage for offline persistence and batched for server sync.
 */

const STORAGE_KEY = "rider_audit_logs";
const BATCH_SIZE = 20;
const SYNC_INTERVAL = 60000; // 1 minute

class AuditLogger {
  constructor() {
    this._queue = this._loadQueue();
    this._syncTimer = null;
  }

  _loadQueue() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  _saveQueue() {
    try {
      // Keep only last 500 entries to prevent storage overflow
      const trimmed = this._queue.slice(-500);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // Storage full or unavailable - clear oldest entries
      this._queue = this._queue.slice(-100);
    }
  }

  /**
   * Log a security event
   * @param {string} event - Event type
   * @param {object} data - Event data
   * @param {'info'|'warn'|'critical'} severity
   */
  log(event, data = {}, severity = "info") {
    const entry = {
      event,
      severity,
      data: this._sanitizeData(data),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
    };

    this._queue.push(entry);
    this._saveQueue();

    // Log to console in development
    if (import.meta.env.DEV) {
      const icon =
        severity === "critical" ? "🔴" : severity === "warn" ? "🟡" : "🔵";
      console.log(`${icon} [Audit] ${event}:`, data);
    }

    // Attempt sync if queue is large enough
    if (this._queue.length >= BATCH_SIZE) {
      this.sync();
    }

    return entry;
  }

  _sanitizeData(data) {
    // Never log sensitive fields
    const sensitive = [
      "password",
      "token",
      "accessToken",
      "refreshToken",
      "secret",
      "authorization",
    ];
    const sanitized = { ...data };
    for (const key of sensitive) {
      if (sanitized[key]) sanitized[key] = "[REDACTED]";
    }
    return sanitized;
  }

  /**
   * Sync queued logs to the server
   */
  async sync() {
    if (this._queue.length === 0) return;

    const batch = [...this._queue];
    this._queue = [];
    this._saveQueue();

    try {
      const { default: riderAxiosClient } =
        await import("../api/riderAxiosClient");
      await riderAxiosClient.post("/api/rider/audit/logs", { events: batch });
    } catch (error) {
      // Re-queue on failure, don't lose logs
      this._queue = [...batch, ...this._queue];
      this._saveQueue();
      console.warn("[AuditLogger] Sync failed, logs queued:", error.message);
    }
  }

  startPeriodicSync() {
    this.stopPeriodicSync();
    this._syncTimer = setInterval(() => this.sync(), SYNC_INTERVAL);
  }

  stopPeriodicSync() {
    if (this._syncTimer) {
      clearInterval(this._syncTimer);
      this._syncTimer = null;
    }
  }

  /** Specific event loggers */
  loginSuccess(riderId, email, method = "password") {
    return this.log("LOGIN_SUCCESS", { riderId, email, method }, "info");
  }

  loginFailure(email, reason) {
    return this.log("LOGIN_FAILURE", { email, reason }, "warn");
  }

  logout(riderId, reason = "user_initiated") {
    return this.log("LOGOUT", { riderId, reason }, "info");
  }

  sessionRestored(riderId, method = "cookie") {
    return this.log("SESSION_RESTORED", { riderId, method }, "info");
  }

  sessionExpired(riderId) {
    return this.log("SESSION_EXPIRED", { riderId }, "warn");
  }

  tokenRefreshed(riderId) {
    return this.log("TOKEN_REFRESHED", { riderId }, "info");
  }

  tokenRefreshFailed(riderId, error) {
    return this.log("TOKEN_REFRESH_FAILED", { riderId, error }, "warn");
  }

  unauthorizedAccess(route, reason) {
    return this.log("UNAUTHORIZED_ACCESS", { route, reason }, "warn");
  }

  forbiddenAccess(route, role, requiredRole) {
    return this.log(
      "FORBIDDEN_ACCESS",
      { route, role, requiredRole },
      "critical",
    );
  }

  suspiciousActivity(detail, data = {}) {
    return this.log("SUSPICIOUS_ACTIVITY", { detail, ...data }, "critical");
  }

  riderStatusChanged(riderId, oldStatus, newStatus) {
    return this.log(
      "RIDER_STATUS_CHANGE",
      { riderId, oldStatus, newStatus },
      "info",
    );
  }

  sessionRevoked(riderId, reason) {
    return this.log("SESSION_REVOKED", { riderId, reason }, "critical");
  }

  multiTabLogout() {
    return this.log("MULTI_TAB_LOGOUT", {}, "info");
  }
}

// Singleton
const auditLogger = new AuditLogger();
export default auditLogger;
