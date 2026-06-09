"use strict";

/**
 * Nile Flow — Release Intelligence Service
 *
 * Tracks every production deployment with metadata:
 *   - Git SHA
 *   - Branch
 *   - Build number
 *   - Runtime version
 *   - OTA update ID
 *   - Deployment timestamp
 *
 * Stores release records in-memory (for the /metrics endpoint) and optionally
 * persists to Appwrite for long-term release audit trail.
 */

const { metrics } = require("./metrics");

// In-memory release registry (last 50 releases)
const releaseHistory = [];
const MAX_RELEASES = 50;

/**
 * Record a new deployment/release.
 *
 * @param {object} params
 * @param {string} params.sha           - Git commit SHA
 * @param {string} params.branch        - Git branch (develop, staging, main)
 * @param {string} params.buildNumber   - EAS build number or CI run number
 * @param {string} params.runtimeVersion - Expo runtime version (fingerprint)
 * @param {string} params.otaUpdateId   - EAS Update group ID (if OTA)
 * @param {string} params.channel       - EAS channel (staging, production)
 * @param {string} params.deployedBy    - GitHub actor or engineer name
 */
function recordRelease(params) {
  const release = {
    sha: params.sha || "unknown",
    branch: params.branch || "unknown",
    buildNumber: params.buildNumber || "unknown",
    runtimeVersion: params.runtimeVersion || "unknown",
    otaUpdateId: params.otaUpdateId || null,
    channel: params.channel || "unknown",
    deployedBy: params.deployedBy || "unknown",
    timestamp: new Date().toISOString(),
  };

  // Prepend to history
  releaseHistory.unshift(release);

  // Trim to max size
  if (releaseHistory.length > MAX_RELEASES) {
    releaseHistory.length = MAX_RELEASES;
  }

  // Update Prometheus gauge with latest release timestamp
  metrics.releaseInfo
    .labels(
      release.sha,
      release.branch,
      release.channel,
      release.runtimeVersion,
    )
    .set(Date.now() / 1000);

  console.log(
    `[ReleaseIntelligence] Recorded: ${release.channel}@${release.sha.slice(0, 7)} branch=${release.branch}`,
  );

  return release;
}

/**
 * Get the full release history.
 */
function getReleaseHistory() {
  return [...releaseHistory];
}

/**
 * Get the most recent production release.
 */
function getLatestProductionRelease() {
  return releaseHistory.find((r) => r.channel === "production") || null;
}

module.exports = {
  recordRelease,
  getReleaseHistory,
  getLatestProductionRelease,
};
