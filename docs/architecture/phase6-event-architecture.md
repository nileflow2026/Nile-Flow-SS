# Phase 6 — Event Architecture

## Problem Statement

Queues exist, but event governance does not. Domain events are not yet standardized, and the system still relies on transactional coupling instead of event-driven orchestration.

## Architecture Decisions

- Create a domain event framework under `Backend/src/events`.
- Define canonical event types:
  - `order.created`
  - `order.completed`
  - `payment.completed`
  - `payment.failed`
  - `subscription.renewed`
  - `vendor.approved`
  - `vendor.suspended`
  - `miles.awarded`
  - `notification.sent`
  - `ai.interaction.created`
- Enforce event metadata: version, timestamp, correlationId, actor, sourceDomain, idempotencyKey.
- Use BullMQ as transport infrastructure for domain event delivery.

## Rejected Alternatives

- Keeping business flows fully synchronous: too brittle.
- Building an event bus without schema governance: too risky for downstream consumers.

## Operational Implications

- Events become auditable, replayable, and observable artifacts.
- Domain interactions decouple from transaction boundaries.
- Future AI and analytics consumers can subscribe to events safely.

## Governance Rationale

- Event governance is the backbone of operational discipline.
- Standardized events reduce integration drift and make cross-domain wiring explicit.
- Controlled event metadata protects lineage and traceability.

## Future Evolution

- Add event subscribers and structured handler frameworks.
- Add replay stores and orphan event tracking.
- Add event-level observability panels in Grafana.
