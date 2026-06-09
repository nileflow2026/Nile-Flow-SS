# PERFORMANCE GOVERNANCE REPORT

**Date:** 2026-06-09
**Sprint:** Day 5 — Appwrite Platform Validation

---

## GOVERNANCE FRAMEWORK

Performance governance protects the Appwrite architecture from regressions — ensuring that the optimizations made in Day 4 and Day 5 are not undone by future code changes.

---

## IMPLEMENTED GUARDRAILS

### 1. Read Budget Enforcement (`readBudget.js`)

**Purpose:** Prevents any single API request or user session from consuming excessive Appwrite reads.

**Mechanism:**

- **Per-request budget:** Max 10 Appwrite reads per HTTP request (configurable)
- **Per-session budget:** Max 200 reads per user session in rolling 5-minute window
- **Per-collection rate limit:** Max 500 reads/minute per collection (triggers warning)
- **Circuit breaker:** Blocks reads entirely when budget exhausted, auto-resets after 5s cooldown

**Metrics emitted:**

- `nf_governance_read_budget_exhausted_total` — Counter for budget violations
- `nf_governance_read_budget_remaining` — Gauge showing remaining reads
- `nf_governance_collection_read_limit_hits_total` — Counter for collection rate limit hits

**Integration:**

```javascript
// Express middleware
const { readBudgetMiddleware } = require("./src/governance/readBudget");
app.use(readBudgetMiddleware);

// Per-operation budget check
const { withReadBudget } = require("./src/governance/readBudget");
const result = await withReadBudget(req._readBudgetId, collectionId, () =>
  repo.get(id),
);
```

### 2. Repository Pattern Enforcement (`baseRepository.js`)

**Purpose:** All data access must go through the repository layer.

**Mechanism:**

- `BaseRepository` is the only class that directly interfaces with Appwrite SDK
- 11 specialized repository subclasses enforce domain ownership (`AUTH`, `CATALOG`, `COMMERCE`, etc.)
- Runtime enforcement via `enforceRepositoryOwnership()` — crashes if wrong domain touches a collection
- ESLint rule `no-raw-db-access` prevents direct SDK usage in controllers

**Integration:**

```javascript
// Correct:
const { orderRepo } = require('../src/data/repositories/repositoryFactory');
const orders = await orderRepo().list([...], 20, 0);
```

### 3. Cache Layer Integration (`cachedRepository.js` + `repositoryFactory.js`)

**Purpose:** Every read should be cache-aware.

**Mechanism:**

- `withCache()` Proxy wraps any repository instance
- Read methods automatically check cache before hitting Appwrite
- Write methods automatically invalidate cache entries
- Collection-specific TTLs (10min static, 3min semi-static, 30s dynamic)

### 4. Pagination Enforcement (`governance/paginationRules.js`)

**Purpose:** Prevent unbounded collection scans.

**Mechanism:**

- `enforcePagination(limit, offset)` — validates sensible pagination
- Default max page size: 50 documents
- No negative limits or offsets

### 5. Query Limits (`governance/queryLimits.js`)

**Purpose:** Cap expensive `listDocuments` queries.

**Mechanism:**

- `enforceLimit(limit, operation)` — caps list operations
- Default max: 100 documents per list call

---

## ESLINT RULES (Prevent Regressions)

| Rule                        | File                                                   | Purpose                                       | Status    |
| --------------------------- | ------------------------------------------------------ | --------------------------------------------- | --------- |
| `no-direct-appwrite`        | `tools/governance/eslint/no-direct-appwrite.js`        | Prevent importing appwrite SDK in controllers | ✅ Exists |
| `no-raw-db-access`          | `tools/governance/eslint/no-raw-db-access.js`          | Prevent direct db.\* calls                    | ✅ Exists |
| `repository-boundary-rules` | `tools/governance/eslint/repository-boundary-rules.js` | Enforce domain ownership                      | ✅ Exists |
| `domain-violation-scanner`  | `tools/governance/scanners/domainViolationScanner.js`  | Runtime domain enforcement                    | ✅ Exists |

---

## MONITORING DASHBOARD

### Recommended Grafana Alerts

| Alert                     | Condition                                                                                                  | Severity    | Action                                |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------- | ------------------------------------- |
| Read Budget Exhausted     | `rate(nf_governance_read_budget_exhausted_total[5m]) > 0`                                                  | 🔴 Critical | Investigate source of excessive reads |
| Collection Rate Limit Hit | `rate(nf_governance_collection_read_limit_hits_total[5m]) > 0`                                             | 🟡 Warning  | Add index or optimize query           |
| Low Cache Hit Rate        | `nf_appwrite_cache_hits_total / (nf_appwrite_cache_hits_total + nf_appwrite_cache_misses_total) < 0.5`     | 🟡 Warning  | Check cache TTL or invalidation       |
| High Appwrite Error Rate  | `rate(nf_appwrite_errors_total[5m]) > 10`                                                                  | 🔴 Critical | Check Appwrite service health         |
| Direct Appwrite Call      | `rate(nf_data_coordination_deduplicated_reads_total[5m]) == 0 and rate(nf_appwrite_reads_total[5m]) > 100` | 🟡 Warning  | Reads bypassing cache                 |

---

## REGRESSION PREVENTION CHECKLIST

### Code Review Checklist

When reviewing a PR that touches data access:

- [ ] Does it use the repository factory instead of `appwriteService.db.*`?
- [ ] Does it use `Query` builders instead of string filters?
- [ ] Does it respect pagination limits (max 50 per page)?
- [ ] Does it have a corresponding cache invalidation strategy?
- [ ] Does it use `coalesce()` for in-flight deduplication?
- [ ] Does it pass the read budget check?
- [ ] Does it have proper index coverage?

### CI Pipeline Checks

- [ ] `eslint` — enforces no-direct-appwrite rule
- [ ] `tsc --noEmit` — type checking
- [ ] `npm test` — unit + integration tests
- [ ] Read budget validation — simulate worst-case request budget

---

## GOVERNANCE ADOPTION

| Guardrail                           | Status     | Adoption %                 |
| ----------------------------------- | ---------- | -------------------------- |
| Read budget middleware              | ✅ Created | 0% (not wired)             |
| Repository factory                  | ✅ Created | 0% (not wired to services) |
| Pagination enforcement              | ✅ Active  | 100% (in baseRepository)   |
| Query limits                        | ✅ Active  | 100% (in baseRepository)   |
| ESLint rules                        | ✅ Active  | 100% (in CI)               |
| Runtime domain enforcement          | ✅ Active  | 100% (in baseRepository)   |
| Read budget per-request integration | ⬜ Pending | 0%                         |

---

## VERIFICATION

| Check                     | Status | Notes                                      |
| ------------------------- | ------ | ------------------------------------------ |
| Read budget module exists | ✅     | `src/governance/readBudget.js` — 250 lines |
| Read budget middleware    | ✅     | Express middleware export                  |
| Per-request budget        | ✅     | Default 10 reads                           |
| Per-collection rate limit | ✅     | Default 500 reads/min                      |
| Circuit breaker           | ✅     | Auto-reset after 5s                        |
| Metrics emitted           | ✅     | 3 Prometheus counters/gauges               |
| ESLint rules exist        | ✅     | 3 rules in tools/governance                |
| Pagination enforced       | ✅     | In baseRepository                          |
| Query limits enforced     | ✅     | In baseRepository                          |
| Domain ownership enforced | ✅     | Runtime checks + ESLint                    |
| Governance dashboard      | ⬜     | Grafana alerts documented                  |
