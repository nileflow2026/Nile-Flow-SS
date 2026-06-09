# WORKSTREAM 7 — Governance Enforcement Report

## Objective

Make it difficult to violate the architecture. Expand domain enforcement, add CI checks, and formalize the code review rules.

---

## Current Governance Infrastructure (Already Exists)

| Facility          | File                                              | Status                              |
| ----------------- | ------------------------------------------------- | ----------------------------------- |
| Domain Registry   | Backend/src/domains/index.js                      | ✅ Defined (11 domains)             |
| Governance Helper | Backend/src/data/governance/index.js              | ✅ assertDomainAccess() exists      |
| Pagination Rules  | Backend/src/data/governance/paginationRules.js    | ✅ enforcePagination() exists       |
| Query Limits      | Backend/src/data/governance/queryLimits.js        | ✅ enforceLimit() exists            |
| Request Coalescer | Backend/src/data/coordination/requestCoalescer.js | ✅ Deduplication exists             |
| BaseRepository    | Backend/src/data/repositories/baseRepository.js   | ✅ Calls enforceRepositoryOwnership |
| Rate Limiting     | Backend/middleware/distributedRateLimit.js        | ✅ 7 distributed limiters           |
| Error Handling    | Backend/middleware/errorHandler.js                | ✅ Centralized error handler        |

## What's Missing

### 1. CI Enforcement Rules

Files to create: `.github/workflows/enforce-architecture.yml` (or equivalent lint rule)

**Rules:**

```yaml
# Rule 1: No raw db.* calls outside src/data/
# Fail if: db.listDocuments|db.getDocument|db.createDocument appears outside src/data/
regex: '(?<!instrumented)db\.(listDocuments|getDocument|createDocument|updateDocument|deleteDocument)'
excludePaths: ['src/data/', 'node_modules/', 'diagnostics/', 'tests/']

# Rule 2: No frontend Appwrite SDK imports for data access
# Fail if: import { Databases } from "appwrite" appears in frontend files
regex: 'import\s*\{[^}]*Databases[^}]*\}\s*from\s*["\x27]appwrite["\x27]'
paths: ['Website/', 'Mobileapp/', 'AdminDashboard/', 'VendorDashboard/', 'RiderDashboard/']

# Rule 3: No direct users.get() without caching
# Fail if: users\.get\( appears without cache wrapper
regex: 'users\.get\('
excludePaths: ['src/data/', 'tests/', 'diagnostics/']

# Rule 4: All new routes must use CacheKeys for cache keys
# Fail if: "nf:" appears in ad-hoc string keys
regex: 'nf:[a-z]+:[a-z]+'
message: 'Use CacheKeys.*() instead of inline cache key strings'

# Rule 5: No setInterval for polling
# Fail if: setInterval\( in frontend files
regex: 'setInterval\('
paths: ['Website/', 'Mobileapp/', 'AdminDashboard/', 'VendorDashboard/', 'RiderDashboard/']
```

### 2. Runtime Enforcement Expansion

The `baseRepository.js` already calls `enforceRepositoryOwnership()` but the function doesn't exist yet at the expected path. Need to create:

**`Backend/src/ownership/runtimeEnforcement.js`:**

```js
function enforceRepositoryOwnership({ domainName, collectionId, sourceFile }) {
  const { DOMAINS } = require("../domains");
  const normalizedDomain = String(domainName).toUpperCase();
  const domain = DOMAINS[normalizedDomain];

  if (!domain) {
    throw new Error(
      `Unknown domain: ${domainName}. Add to Backend/src/domains/index.js`,
    );
  }

  if (!domain.appwriteCollections.includes(collectionId)) {
    throw new Error(
      `Repository for domain "${domainName}" attempted to access "${collectionId}", ` +
        `but the domain only owns: ${domain.appwriteCollections.join(", ")}. ` +
        `Update Backend/src/domains/index.js if this access is intentional.`,
    );
  }
}

module.exports = { enforceRepositoryOwnership };
```

### 3. Code Review Checklist

Add to PR template:

```markdown
## Architecture Review Checklist

- [ ] All data fetches go through `axiosClient` → Express API (no frontend Appwrite SDK)
- [ ] No `db.listDocuments()` / `db.getDocument()` in controllers — uses repository methods
- [ ] Cache middleware applied for GET routes with appropriate TTL from `TTL.*`
- [ ] Cache keys use `CacheKeys.*()` registry (no inline strings)
- [ ] Instrumented via `instrumentedDb` (not raw `db`)
- [ ] Rate limiters applied for new endpoints
- [ ] Domain ownership respected (no cross-domain collection access)
- [ ] Pagination respects `enforcePagination()` limits
```

---

## Compliance Dashboard (Grafana)

Track these metrics to measure governance adoption:

| Metric                            | Source                                | Target             |
| --------------------------------- | ------------------------------------- | ------------------ |
| % controllers using repositories  | Manual audit                          | 100%               |
| % routes with cacheMiddleware     | Grafana / HTTP headers                | 100% of GET routes |
| % operations using instrumentedDb | `nf_appwrite_reads_total` cardinality | 100%               |
| % frontend SDK violations         | CI scan                               | 0                  |
| % setInterval violations          | CI scan                               | 0                  |

---

## Migration Path for Existing Violations

| Violation                          | Count       | Mitigation                      | Tracked In                            |
| ---------------------------------- | ----------- | ------------------------------- | ------------------------------------- |
| Raw `db.*` calls in controllers    | ~370        | Replace with repository methods | repository-migration-report.md        |
| Raw `users.get()` calls            | 42          | Cache wrapper + TTL             | auth-read-optimization-report.md      |
| Frontend SDK imports               | 4           | Already migrated                | frontend-appwrite-migration-report.md |
| Notification polling               | 5 frontends | TanStack Query refetchInterval  | notification-governance-report.md     |
| Routes without cache               | 6+          | Cache middleware applied        | cache-expansion-report.md             |
| Controllers without instrumentedDb | ~40         | Migration planned               | observability-completion-report.md    |

---

## Summary

| Facility                         | Status                                             |
| -------------------------------- | -------------------------------------------------- |
| Domain registry                  | ✅ Complete                                        |
| Repository ownership enforcement | ⚠️ `enforceRepositoryOwnership` needed             |
| CI lint rules                    | ❌ Not implemented                                 |
| PR review checklist              | ❌ Not added                                       |
| Grafana compliance dashboard     | ❌ Not configured                                  |
| Runtime cross-domain guards      | ⚠️ BaseRepository calls it, function may not exist |
