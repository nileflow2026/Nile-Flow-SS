# REPOSITORY MIGRATION REPORT

**Date:** 2026-06-09
**Sprint:** Day 5 — Appwrite Platform Validation

---

## EXECUTIVE SUMMARY

Audited all direct Appwrite calls across the codebase and created a migration path to the repository pattern with caching, instrumentation, and read budget enforcement.

---

## CURRENT STATE

| Layer                                                           | Pattern                         | Files           | Adoption         |
| --------------------------------------------------------------- | ------------------------------- | --------------- | ---------------- |
| Repository Layer (src/data/repositories)                        | BaseRepository + Query builders | 11 repo classes | ✅ 100% built    |
| Repository Factory (src/data/repositories/repositoryFactory.js) | withCache() wrapper + lazy init | 1 file          | ✅ Created Day 5 |
| Service Layer (services/)                                       | Direct `db.*` calls             | 7 files         | ❌ Not migrated  |
| Controllers (controllers/)                                      | Mixed — some repos, some db     | 10+ files       | ⚠️ Partial       |
| Frontend Apps                                                   | Direct Appwrite SDK             | 3 files         | ❌ Not migrated  |

---

## MIGRATION TARGETS

### Target 1: 7 Backend Service Files

| #   | File                                  | Direct Calls           | Repository to Use                  | Risk   | Priority |
| --- | ------------------------------------- | ---------------------- | ---------------------------------- | ------ | -------- |
| 1   | `services/commissionService.js`       | 4 (`db.*`)             | `orderRepo()`, `paymentRepo()`     | HIGH   | 🔴 P1    |
| 2   | `services/subscriptionCronService.js` | 8 (`instrumentedDb.*`) | `subscriptionRepo()`, `userRepo()` | HIGH   | 🔴 P1    |
| 3   | `services/groupBuyCronService.js`     | 4 (`db.*`)             | `orderRepo()`                      | MEDIUM | 🟡 P2    |
| 4   | `services/pushNotificationService.js` | 2 (`db.*`)             | `notificationRepo()`               | LOW    | 🟡 P2    |
| 5   | `services/vendorPayoutService.js`     | 3 (`db.*`)             | `vendorRepo()`, `paymentRepo()`    | MEDIUM | 🟡 P2    |
| 6   | `services/platformSettingsService.js` | 2 (`db.*`)             | `settingRepo()`                    | LOW    | 🟢 P3    |
| 7   | `utils/auditLogger.js`                | 2 (`db.*`)             | Keep as is (audit writes)          | LOW    | 🟢 P3    |

### Target 2: 3 Frontend Appwrite.js Files

| #   | File                         | Direct SDK Exports                     | Migration Path                           | Priority |
| --- | ---------------------------- | -------------------------------------- | ---------------------------------------- | -------- |
| 1   | `Mobileapp/Appwrite.js`      | databases, account, storage, functions | All data via `axiosClient` → Express API | 🔴 P1    |
| 2   | `AdminDashboard/appwrite.js` | databases, account, storage, functions | All data via `axiosClient` → Express API | 🔴 P1    |
| 3   | `Website/appwrite.js`        | databases, account, storage, functions | All data via `axiosClient` → Express API | 🔴 P1    |

---

## MIGRATION PATTERN

### From (Direct Appwrite):

```javascript
const { db } = require("../services/appwriteService");
const result = await db.listDocuments(
  env.APPWRITE_DATABASE_ID,
  env.APPWRITE_ORDERS_COLLECTION_ID,
  [Query.equal("vendorId", vendorId)],
);
```

### To (Repository Factory):

```javascript
const { orderRepo } = require("../src/data/repositories/repositoryFactory");
const repo = orderRepo();
const result = await repo.list([Query.equal("vendorId", vendorId)]);
```

**Benefits of migration:**

1. ✅ Transparent caching via `withCache()` wrapper
2. ✅ Instrumentation via `appwritePerformanceTracker`
3. ✅ Request deduplication via `coalesce()`
4. ✅ Cache invalidation on writes
5. ✅ Read budget enforcement via `readBudget.js`
6. ✅ Centralized collection ID management
7. ✅ Consistent error handling

---

## MIGRATION PROGRESS

| File                                  | Before               | After              | Status     |
| ------------------------------------- | -------------------- | ------------------ | ---------- |
| `repositoryFactory.js`                | —                    | Created            | ✅ Day 5   |
| `subscriptionCronService.js`          | Bug (undefined refs) | Fixed + import fix | ✅ Day 5   |
| `services/commissionService.js`       | 4 direct db calls    | Not migrated       | ⬜ Pending |
| `services/groupBuyCronService.js`     | 4 direct db calls    | Not migrated       | ⬜ Pending |
| `services/pushNotificationService.js` | 2 direct db calls    | Not migrated       | ⬜ Pending |
| `services/vendorPayoutService.js`     | 3 direct db calls    | Not migrated       | ⬜ Pending |
| `services/platformSettingsService.js` | 2 direct db calls    | Not migrated       | ⬜ Pending |
| `utils/auditLogger.js`                | 2 direct db calls    | Keep as is         | ⬜ Pending |
| `Mobileapp/Appwrite.js`               | Full SDK exports     | Not migrated       | ⬜ Pending |
| `AdminDashboard/appwrite.js`          | Full SDK exports     | Not migrated       | ⬜ Pending |
| `Website/appwrite.js`                 | Full SDK exports     | Not migrated       | ⬜ Pending |

**Migration completion: ~12%** (2/17 target files addressed)

---

## MIGRATION INSTRUCTIONS

### For Backend Services:

Each service file needs:

1. Replace `const { db } = require('./appwriteService')` with `const { orderRepo } = require('../src/data/repositories/repositoryFactory')`
2. Replace `db.listDocuments(dbId, collectionId, filters)` with `repo.list(filters)`
3. Replace `db.getDocument(dbId, collectionId, docId)` with `repo.get(docId)`
4. Replace `db.createDocument(...)` with `repo.create(...)`
5. Replace `db.updateDocument(...)` with `repo.update(...)`
6. Replace `db.deleteDocument(...)` with `repo.delete(...)`

### For Frontend Apps:

Each frontend needs to replace direct Appwrite SDK calls with `axiosClient` API calls:

1. Remove `import { databases } from './appwrite'`
2. Add `import api from './api'`
3. Replace `databases.listDocuments(...)` with `api.get('/api/...')`
4. Replace `databases.getDocument(...)` with `api.get('/api/...')`
5. Replace `databases.createDocument(...)` with `api.post('/api/...')`

---

## VERIFICATION

| Check                             | Status  | Notes                               |
| --------------------------------- | ------- | ----------------------------------- |
| Repository classes created        | ✅      | 11 classes in src/data/repositories |
| Repository factory created        | ✅      | withCache() integration point       |
| subscriptionCronService fixed     | ✅      | Missing imports added               |
| service direct db calls remaining | 25      | In 7 files                          |
| frontend SDK calls remaining      | 3 files | All 3 frontends                     |
| Migration completion              | ~12%    | 2/17 files addressed                |
| Migration pattern documented      | ✅      | Above                               |
