# Phase 5 Architecture: Operational Governance

**Status:** Started
**Date:** 2026-05-21
**Scope:** Backend data governance, Appwrite instrumentation, repository layer, domain access rules

---

## Objective

Phase 5 moves Nile Flow from an observability and infrastructure foundation to formal operational governance. The goal is to make the backend maintainable under scale by:

- enforcing clear data ownership boundaries
- replacing unstructured Appwrite access with repository-backed reads/writes
- instrumenting Appwrite operations for cardinality-safe metrics
- documenting domain access rules and migration guidance

---

## What changed

### 1. Appwrite instrumentation is now available

`Backend/services/appwriteService.js` now exports `instrumentedDb` in addition to the raw `db` client. This is the first step toward making all Appwrite calls observable and auditable.

### 2. Repository layer introduced

New files:

- `Backend/src/data/repositories/baseRepository.js`
- `Backend/src/data/repositories/notificationRepository.js`
- `Backend/src/data/repositories/index.js`

These repositories provide a shared API for CRUD operations and make it easier to audit data access patterns.

### 3. Domain access enforcement helper

New governance helper:

- `Backend/src/data/governance/index.js`

This helper reads the domain registry defined in `Backend/src/domains/index.js` and throws when a repository tries to access a collection outside its declared ownership.

### 4. Notification worker migration example

`Backend/src/jobs/workers/notificationWorker.js` now uses `NotificationRepository` and `instrumentedDb`. This is a safe, incremental migration path for other workers and controllers.

---

## Governance rules

### Domain ownership

Each domain in `Backend/src/domains/index.js` owns its Appwrite collections. No service should directly access another domain's collections.

### Repository-first access

Controllers and workers should prefer repository classes instead of raw `db` calls. Repositories centralize:

- Appwrite database ID bootstrapping
- collection-specific payload shapes
- retry or idempotency behavior
- collection ownership validation
- metrics-friendly access patterns

### Instrumented operations

All Appwrite write/read operations should be routed through `instrumentedDb` when possible. This ensures the platform can answer:

- which collection is responsible for the most load
- which Appwrite operations are failing most often
- whether read-heavy traffic corresponds to actual user behavior

---

## Next steps

1. Create repository modules for `orders`, `users`, `payments`, and `subscriptions`.
2. Replace direct `db.*` calls in controllers with repository methods.
3. Add collection-level validation to any remaining background workers.
4. Build a review checklist for cross-domain access during pull requests.

---

## Quick-win migration pattern

```js
const { NotificationRepository } = require("../data/repositories");
const { instrumentedDb } = require("../../../services/appwriteService");

const notificationRepository = new NotificationRepository(instrumentedDb);

await notificationRepository.createNotification({
  userId,
  message,
  title,
  notificationType,
});
```
