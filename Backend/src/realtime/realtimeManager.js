"use strict";

/**
 * Nile Flow — Realtime Subscription Manager
 *
 * Centralized management of Appwrite realtime subscriptions to prevent:
 *   - Duplicate subscriptions (same channel, multiple listeners)
 *   - Leaked subscriptions (no cleanup after component unmount)
 *   - Overly broad channels (listening to entire databases when only a collection is needed)
 *   - Unnecessary listeners (listening to events no component cares about)
 *
 * Architecture:
 *   All realtime subscriptions flow through this manager.
 *   Components register their interest. If another component already
 *   subscribed to the same channel, the existing subscription is shared.
 *   Reference counting ensures cleanup when all consumers unsubscribe.
 */

const { Client } = require("node-appwrite");
const { env } = require("../src/env");
const {
  performanceTracker,
} = require("../observability/appwritePerformanceMetrics");

// ── Subscription Registry ────────────────────────────────────────────────────

class RealtimeManager {
  constructor() {
    this._subscriptions = new Map(); // channel → { client, unsubscribe, refCount, consumers }
    this._clientSubscriptions = new Map(); // subscription ID → { channels, unsubscribe }
    this._eventListeners = new Set(); // registered event types
    this._channelPatterns = new Map(); // pattern → [channels]
  }

  /**
   * Parse a channel string into its components.
   * Supports: databases.{dbId}.collections.{colId}.documents
   */
  _parseChannel(channel) {
    const parts = channel.split(".");
    if (parts.length < 4)
      return { type: "unknown", dbId: null, collectionId: null };

    return {
      type: parts[0], // "databases"
      dbId: parts[1],
      scope: parts[2], // "collections"
      collectionId: parts[3],
      subType: parts[4], // "documents"
    };
  }

  /**
   * Register interest in a realtime channel.
   * Returns an unsubscribe function.
   *
   * @param {string} channel - The Appwrite realtime channel
   * @param {Function} callback - Callback for events on this channel
   * @param {string} consumerId - Identifier for the consuming component/service
   * @returns {Function} Unsubscribe function
   */
  subscribe(channel, callback, consumerId = "anonymous") {
    if (!channel || !callback) {
      console.warn("[RealtimeManager] subscribe requires channel and callback");
      return () => {};
    }

    // Track this consumer
    const key = `${channel}:${consumerId}`;

    // Get or create the channel subscription
    let entry = this._subscriptions.get(channel);
    if (!entry) {
      // New channel — establish the realtime subscription
      const client = new Client()
        .setEndpoint(env.APPWRITE_ENDPOINT)
        .setProject(env.APPWRITE_PROJECT_ID);

      // Use Appwrite's built-in realtime
      const unsubscribe = client.subscribe(channel, (response) => {
        // Notify all consumers of this channel
        const subscribers = this._subscriptions.get(channel);
        if (subscribers) {
          const event = {
            channel,
            type: response.events?.[0] || "unknown",
            payload: response.payload,
            timestamp: new Date().toISOString(),
          };
          for (const [, consumerCallback] of subscribers.consumers) {
            try {
              consumerCallback(event);
            } catch (err) {
              console.error(
                `[RealtimeManager] Error in consumer callback for ${channel}:`,
                err.message,
              );
            }
          }
        }
      });

      entry = {
        client,
        unsubscribe,
        refCount: 0,
        consumers: new Map(),
        createdAt: Date.now(),
      };
      this._subscriptions.set(channel, entry);

      // Track the subscription
      this._clientSubscriptions.set(channel, {
        channels: [channel],
        unsubscribe,
      });

      // Update metrics
      const parsed = this._parseChannel(channel);
      performanceTracker.recordQuery({
        collectionId: parsed.collectionId || "realtime",
        operation: "realtime_subscribe",
        durationMs: 0,
        filters: [`channel:${channel}`],
      });
    }

    // Add consumer
    entry.consumers.set(consumerId, callback);
    entry.refCount = entry.consumers.size;

    // Return unsubscribe function
    return () => {
      const currentEntry = this._subscriptions.get(channel);
      if (!currentEntry) return;

      currentEntry.consumers.delete(consumerId);
      currentEntry.refCount = currentEntry.consumers.size;

      // If no more consumers, clean up the subscription
      if (currentEntry.consumers.size === 0) {
        try {
          currentEntry.unsubscribe();
        } catch (err) {
          console.warn(
            `[RealtimeManager] Error unsubscribing from ${channel}:`,
            err.message,
          );
        }
        this._subscriptions.delete(channel);
        this._clientSubscriptions.delete(channel);
      }
    };
  }

  /**
   * Subscribe to a collection's document changes.
   * Convenience wrapper for the common case.
   */
  subscribeToCollection(collectionId, callback, consumerId) {
    const channel = `databases.${env.APPWRITE_DATABASE_ID}.collections.${collectionId}.documents`;
    return this.subscribe(channel, callback, consumerId);
  }

  /**
   * Get active subscription stats.
   */
  getStats() {
    const channels = Array.from(this._subscriptions.entries()).map(
      ([channel, entry]) => ({
        channel,
        consumerCount: entry.consumers.size,
        consumers: Array.from(entry.consumers.keys()),
        age: Date.now() - entry.createdAt,
      }),
    );

    // Group by collection
    const byCollection = {};
    for (const [channel, entry] of this._subscriptions.entries()) {
      const parsed = this._parseChannel(channel);
      const colId = parsed.collectionId || "unknown";
      if (!byCollection[colId]) {
        byCollection[colId] = { subscriptions: 0, consumers: 0, channels: [] };
      }
      byCollection[colId].subscriptions++;
      byCollection[colId].consumers += entry.consumers.size;
      byCollection[colId].channels.push(channel);
    }

    return {
      totalChannels: this._subscriptions.size,
      totalConsumers: Array.from(this._subscriptions.values()).reduce(
        (sum, e) => sum + e.consumers.size,
        0,
      ),
      channels,
      byCollection,
      channelPatterns: Array.from(this._channelPatterns.entries()).map(
        ([pattern, chs]) => ({ pattern, channels: chs }),
      ),
    };
  }

  /**
   * Run diagnostics — find potential issues.
   */
  runDiagnostics() {
    const issues = [];

    // Check for duplicate channels
    const channelCounts = new Map();
    for (const [channel, entry] of this._subscriptions.entries()) {
      channelCounts.set(channel, (channelCounts.get(channel) || 0) + 1);
    }
    for (const [channel, count] of channelCounts.entries()) {
      if (count > 1) {
        issues.push({
          severity: "warning",
          message: `Channel ${channel} has ${count} duplicate subscriptions`,
        });
      }
    }

    // Check for overly broad channels
    for (const [channel] of this._subscriptions.entries()) {
      const parts = channel.split(".");
      // databases.*.collections.*.documents is too broad if wildcard
      if (parts.length <= 3 || channel.includes("*")) {
        issues.push({
          severity: "warning",
          message: `Overly broad channel: ${channel}`,
        });
      }
    }

    // Check for channels with no consumers
    for (const [channel, entry] of this._subscriptions.entries()) {
      if (entry.consumers.size === 0) {
        issues.push({
          severity: "error",
          message: `Leaked subscription: ${channel} has no consumers`,
        });
      }
    }

    return issues;
  }

  /**
   * Clean up all subscriptions.
   */
  destroy() {
    for (const [channel, entry] of this._subscriptions.entries()) {
      try {
        entry.unsubscribe();
      } catch (err) {
        console.warn(
          `[RealtimeManager] Error cleaning up ${channel}:`,
          err.message,
        );
      }
    }
    this._subscriptions.clear();
    this._clientSubscriptions.clear();
    this._eventListeners.clear();
    this._channelPatterns.clear();
  }
}

// ── Singleton ────────────────────────────────────────────────────────────────

const realtimeManager = new RealtimeManager();

module.exports = {
  realtimeManager,
  RealtimeManager,
};
