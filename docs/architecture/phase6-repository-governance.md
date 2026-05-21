# Phase 6 — Repository Governance

## Problem Statement

The base repository is currently generic and risks becoming an opaque ORM. Nile Flow requires domain-aware repositories that enforce business invariants, idempotency, audit logging, and ownership semantics.

## Architecture Decisions

- Maintain `BaseRepository` for Appwrite plumbing, but require domain-specific subclasses.
- Introduce dedicated repository directories for:
  - `orders`
  - `payments`
  - `loyalty`
  - `vendors`
  - `subscriptions`
- Expose domain-specific methods such as `markOrderDelivered`, `reconcileSettlement`, `awardMiles`, `approveVendor`, and `renewSubscription`.

## Rejected Alternatives

- Keeping only a generic CRUD repository: too weak for commerce infrastructure.
- Embedding business logic in controllers: violates separation of concerns.

## Operational Implications

- Repositories become the canonical domain boundary for data access.
- Business rules and governance policies are centralized in the repository layer.
- Controllers and workers become lighter and easier to audit.

## Scaling Implications

- Domain-aware repositories help prepare for a future service split.
- They reduce cross-domain coupling and make ownership explicit.
- They simplify observability and metrics attribution by domain.

## Governance Rationale

- Generic repositories obscure policy enforcement.
- Domain-specific methods codify the correct contracts for each bounded context.
- This makes it far harder to bypass governance accidentally.

## Repository Migration Strategy

1. Create domain-aware repository scaffolding.
2. Migrate one domain at a time using `Backend/src/data/repositories/index.js`.
3. Replace raw `db.*` calls with repository methods.
4. Keep `BaseRepository` as a stable plumbing layer.

## Future Evolution

- Add policy modules, validation rules, and queue triggers inside each repository.
- Make repositories publish domain events instead of writing side-effect data directly.
- Add repository-level coverage metrics to the governance dashboard.
