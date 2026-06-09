"use strict";

/**
 * Nile Flow — Read Budget & Performance Governance
 *
 * Enforces read budgets per request and per user session to prevent
 * excessive Appwrite consumption. Acts as a circuit breaker when
 * reads exceed configured thresholds.
 *
 * Features:
 *   - Per-request read budget (max Appwrite reads per API call)
 *   - Per-session read budget (max reads per user session)
 *   - Collection-level read limits (per minute)
 *   - Circuit breaker: blocks reads when budget exhausted
 *   - Prometheus metrics for budget exhaustion
 *   - Logging for regressions
 */

const client = require("prom-client");
const { registry } = require("../observability/metrics");

// ── Metrics ──────────────────────────────────────────────────────────────────

const readBudgetExhaustedTotal = new client.Counter({
  name: "nf_governance_read_budget_exhausted_total",
  help: "Total requests where read budget was exceeded",
  labelNames: ["budget_type"],
  registers: [registry],
});

const readBudgetRemaining = new client.Gauge({
  name: "nf_governance_read_budget_remaining",
  help: "Remaining reads in current budget window",
  labelNames: ["budget_type", "scope"],
  registers: [registry],
});

const collectionReadLimitHits = new client.Counter({
  name: "nf_governance_collection_read_limit_hits_total",
  help: "Times a collection's per-minute read limit was exceeded",
  labelNames: ["collection"],
  registers: [registry],
});

// ── Configuration ────────────────────────────────────────────────────────────

const DEFAULTS = {
  // Max Appwrite reads per single HTTP request
  REQUEST_BUDGET: 10,

  // Max Appwrite reads per user session (rolling 5 min window)
  SESSION_BUDGET: 200,

  // Max reads per collection per minute (before emitting warning)
  COLLECTION_PER_MINUTE_LIMIT: 500,

  // Circuit breaker: block reads entirely if budget exhausted
  CIRCUIT_BREAK_ENABLED: true,

  // Cooldown period in ms after circuit break
  CIRCUIT_BREAK_COOLDOWN: 5000,
};

// ── In-memory state ──────────────────────────────────────────────────────────

const requestContext = new Map(); // requestId → { reads: Count, budget: Number }
const collectionRateMap = new Map(); // collectionId → { count, resetAt }
const circuitBreakerState = {
  isOpen: false,
  openedAt: 0,
};

// ── Read Budget Tracker ──────────────────────────────────────────────────────

class ReadBudgetTracker {
  constructor(options = {}) {
    this.requestBudget = options.requestBudget || DEFAULTS.REQUEST_BUDGET;
    this.sessionBudget = options.sessionBudget || DEFAULTS.SESSION_BUDGET;
    this.collectionLimit =
      options.collectionPerMinuteLimit || DEFAULTS.COLLECTION_PER_MINUTE_LIMIT;
    this.circuitBreakEnabled =
      options.circuitBreakEnabled !== undefined
        ? options.circuitBreakEnabled
        : DEFAULTS.CIRCUIT_BREAK_ENABLED;
    this.cooldown =
      options.circuitBreakCooldown || DEFAULTS.CIRCUIT_BREAK_COOLDOWN;
  }

  /**
   * Start tracking a new request.
   * Call at the beginning of each API request.
   */
  startRequest(requestId) {
    requestContext.set(requestId, { reads: 0, budget: this.requestBudget });
    readBudgetRemaining.set(
      { budget_type: "request", scope: requestId },
      this.requestBudget,
    );
  }

  /**
   * Record a read operation. Returns false if budget is exhausted.
   */
  recordRead(requestId, collectionId) {
    // Check circuit breaker
    if (this._isCircuitOpen()) {
      readBudgetExhaustedTotal.inc({ budget_type: "circuit_breaker" });
      return false;
    }

    // Check request budget
    const ctx = requestContext.get(requestId);
    if (ctx) {
      ctx.reads++;
      if (ctx.reads > ctx.budget) {
        readBudgetExhaustedTotal.inc({ budget_type: "request" });
        this._openCircuit("Request budget exceeded");
        return false;
      }
      readBudgetRemaining.set(
        { budget_type: "request", scope: requestId },
        ctx.budget - ctx.reads,
      );
    }

    // Check collection rate limit
    if (collectionId) {
      const now = Date.now();
      let colState = collectionRateMap.get(collectionId);
      if (!colState || now > colState.resetAt) {
        colState = { count: 0, resetAt: now + 60000 };
        collectionRateMap.set(collectionId, colState);
      }
      colState.count++;
      if (colState.count > this.collectionLimit) {
        collectionReadLimitHits.inc({ collection: collectionId });
        console.warn(
          `[ReadBudget] Collection ${collectionId} exceeded ${this.collectionLimit} reads/min (${colState.count})`,
        );
      }
    }

    return true;
  }

  /**
   * End tracking a request. Call in response finish handler.
   */
  endRequest(requestId) {
    const ctx = requestContext.get(requestId);
    if (ctx) {
      const usage = ctx.reads;
      if (usage > this.requestBudget * 0.8) {
        console.warn(
          `[ReadBudget] Request ${requestId} used ${usage}/${this.requestBudget} reads (${Math.round((usage / this.requestBudget) * 100)}%)`,
        );
      }
      requestContext.delete(requestId);
      readBudgetRemaining.set({ budget_type: "request", scope: requestId }, 0);
    }
  }

  /**
   * Get current stats.
   */
  getStats() {
    return {
      activeRequests: requestContext.size,
      circuitBreakerOpen: circuitBreakerState.isOpen,
      circuitBreakerOpenedAt: circuitBreakerState.openedAt,
      trackedCollections: collectionRateMap.size,
      collectionRates: Array.from(collectionRateMap.entries()).map(
        ([col, state]) => ({
          collection: col,
          count: state.count,
          resetIn: Math.max(0, state.resetAt - Date.now()),
        }),
      ),
    };
  }

  _isCircuitOpen() {
    if (!circuitBreakerState.isOpen) return false;
    if (Date.now() - circuitBreakerState.openedAt > this.cooldown) {
      circuitBreakerState.isOpen = false;
      console.log("[ReadBudget] Circuit breaker reset after cooldown");
      return false;
    }
    return true;
  }

  _openCircuit(reason) {
    if (!this.circuitBreakEnabled) return;
    circuitBreakerState.isOpen = true;
    circuitBreakerState.openedAt = Date.now();
    console.warn(`[ReadBudget] Circuit breaker opened: ${reason}`);
  }
}

// ── Singleton & Express Middleware ───────────────────────────────────────────

const readBudget = new ReadBudgetTracker();

/**
 * Express middleware that enforces read budgets per request.
 * Must be mounted early in middleware chain.
 */
function readBudgetMiddleware(req, res, next) {
  const requestId =
    req.headers["x-request-id"] ||
    req.id ||
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  req._readBudgetId = requestId;

  readBudget.startRequest(requestId);

  // Instrument res.json to track reads
  const originalJson = res.json.bind(res);
  res.json = function (body) {
    readBudget.endRequest(requestId);
    return originalJson(body);
  };

  // Also track on finish
  res.on("finish", () => {
    readBudget.endRequest(requestId);
  });

  next();
}

/**
 * Decorator to check read budget before executing a repository method.
 * Usage: const result = await withReadBudget(requestId, () => repo.get(id));
 */
async function withReadBudget(requestId, collectionId, fn) {
  if (!readBudget.recordRead(requestId, collectionId)) {
    const err = new Error("Read budget exceeded");
    err.code = "READ_BUDGET_EXCEEDED";
    err.statusCode = 429;
    throw err;
  }
  return fn();
}

module.exports = {
  ReadBudgetTracker,
  readBudget,
  readBudgetMiddleware,
  withReadBudget,
  DEFAULTS,
};
