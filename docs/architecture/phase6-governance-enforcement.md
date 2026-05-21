# Phase 6 — Governance Enforcement

## Problem Statement

Nile Flow has governance foundations, but enforcement remains optional. Direct Appwrite access and raw database usage still exist outside the data layer, enabling architecture drift and operational collapse.

## Architecture Decisions

- Enforce repository usage at build and runtime.
- Add custom ESLint rules that fail on forbidden Appwrite and `db.*` patterns outside `Backend/src/data`.
- Add static scanners that produce governance reports and break CI when violations exist.
- Keep enforcement targeted to backend data ownership boundaries and repository compliance.

## Rejected Alternatives

- Using only runtime assertions: too late and too fragile.
- Full code rewriting before enforcement: unnecessary for a governance-first phase.
- Relying on manual review: unacceptable for scale.

## Operational Implications

- Pull requests now fail fast when governance policy is breached.
- Existing direct database access remains visible through reports and lint failures.
- Repositories become the enforced access gateway.

## Scaling Implications

- The enforcement layer converts technical debt into observable policy violations.
- New backend code can no longer bypass repository boundaries without explicit migration.
- This reduces blast radius as Nile Flow scales across teams and domains.

## Governance Rationale

- Optional rules become optional behavior.
- Automatic enforcement prevents hidden ORMs and direct Appwrite coupling.
- This protects the platform from incremental architecture drift.

## Enforcement Strategy

- `Backend/.eslintrc.js` enforces custom governance rules.
- `Backend/tools/governance/scanners` produces machine-readable violation reports.
- `Backend/tools/governance/ci/governanceChecks.js` is the CI guard.
- `Backend/package.json` exposes `npm run governance:ci`.

## Observability Impact

- Governance reports are written to `Backend/reports/governance-report.json`.
- Static scanners provide evidence for audit reviews.
- Lint failures become immediate enforcement feedback.

## Migration Roadmap

1. Add repositories for each domain.
2. Migrate controllers and workers to repository abstractions.
3. Remove direct `db.*` usage from `Backend/controllers` and `Backend/middleware`.
4. Use the governance scanners to track remaining violations.

## Future Evolution

- Expand rule coverage to include service-layer API boundaries.
- Add metrics for repository coverage and raw access attempts.
- Integrate scan results into pull request status checks.
