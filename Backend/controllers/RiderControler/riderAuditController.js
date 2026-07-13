// controllers/RiderControler/riderAuditController.js
const { instrumentedDb } = require("../../services/appwriteService");
const { ID } = require("node-appwrite");
const { env } = require("../../src/env");

const log = {
  info: (...args) => console.info("[rider-audit]", ...args),
  error: (...args) => console.error("[rider-audit]", ...args),
};

/**
 * Log a batch of audit events from the rider dashboard.
 * Events are sanitized server-side before storage.
 */
async function logAuditEvents(req, res) {
  try {
    const { events } = req.body;
    const riderId = req.rider?.riderId;

    if (!Array.isArray(events) || events.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Events array is required",
      });
    }

    // Sanitize and persist each event
    const stored = [];
    for (const event of events) {
      const sanitized = {
        riderId,
        event: event.event || "unknown",
        severity: event.severity || "info",
        data: event.data || {},
        timestamp: event.timestamp || new Date().toISOString(),
        userAgent: event.userAgent || null,
        url: event.url || null,
        serverReceivedAt: new Date().toISOString(),
        ip: req.ip || null,
      };

      try {
        const doc = await instrumentedDb.createDocument(
          env.APPWRITE_DATABASE_ID,
          env.APPWRITE_AUDIT_LOGS_COLLECTION_ID || env.AUDIT_LOGS_COLLECTION_ID,
          ID.unique(),
          sanitized,
        );
        stored.push(doc.$id);
      } catch (docErr) {
        log.error("Failed to store audit event:", docErr.message);
      }
    }

    log.info(`Stored ${stored.length} audit events for rider ${riderId}`);

    res.json({
      success: true,
      stored: stored.length,
    });
  } catch (error) {
    log.error("Failed to log audit events:", error.message);
    res.status(500).json({
      success: false,
      error: "Failed to log audit events",
    });
  }
}

module.exports = { logAuditEvents };
