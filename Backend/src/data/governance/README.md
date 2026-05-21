# Data Governance Helpers

This module provides a lightweight runtime companion to the domain ownership registry in `Backend/src/domains/index.js`.

## Purpose

- Prevent accidental cross-domain Appwrite access.
- Provide a standard place for collection access validation.
- Support gradual migration from direct `db` calls to repository-backed data access.

## Usage

```js
const { assertDomainAccess } = require("../data/governance");

assertDomainAccess(
  "NOTIFICATIONS",
  process.env.APPWRITE_NOTIFICATIONS_COLLECTION_ID,
);
```

## Exports

- `canAccessCollection(domainName, collectionId)` — returns `true` when the domain owns the collection.
- `assertDomainAccess(domainName, collectionId)` — throws when access is forbidden.
- `getAccessibleCollections(domainName)` — returns the permitted Appwrite collection list.
