const { fetchAuditLogs, logAudit } = require("../../utils/auditLogger");

const getAuditLogs = async (req, res) => {
  try {
    const logs = await fetchAuditLogs(100); // fetch up to 100 logs
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const logAuditEntry = async (req, res) => {
  try {
    const { action, details, timestamp, level, entityType, entityId } = req.body || {};

    await logAudit({
      action: action || "UNKNOWN_ACTION",
      performedBy: req.user?.email || req.user?.userId || "UNKNOWN_USER",
      entityType: entityType || "CLIENT_EVENT",
      entityId: entityId || req.user?.userId || "UNKNOWN_ID",
      details: {
        level: level || "info",
        timestamp: timestamp || new Date().toISOString(),
        details: typeof details === "string" ? details : details || {},
      },
    });

    res.status(201).json({ success: true, message: "Audit log recorded" });
  } catch (err) {
    console.error("Failed to record audit log:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
};

module.exports = { getAuditLogs, logAuditEntry };
