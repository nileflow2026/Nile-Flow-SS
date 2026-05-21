# Phase 6 — DB Observability

## Problem Statement

Instrumentation exists, but DB governance visibility is incomplete. The platform lacks dashboards for collection-level pressure, governance violations, and repository coverage.

## Architecture Decisions

- Add database governance metrics to Prometheus.
- Track:
  - reads per collection
  - writes per collection
  - slowest collections
  - hottest collections
  - governance violation totals
  - read amplification counts
  - cache bypass events
  - repository validation coverage
- Expose metrics through the existing Prometheus registry.

## Rejected Alternatives

- Building observability only from log lines: too low fidelity.
- Waiting for full service separation: governance visibility is needed now.

## Operational Implications

- Collection pressure becomes measurable.
- Governance violations can be alerted on.
- Repository coverage can be inferred from ownership validation metrics.

## Governance Rationale

- Observability is enforcement: if a policy cannot be measured, it cannot be governed.
- DB dashboards make ownership and query safety visible to operations and engineering.

## Future Evolution

- Add Grafana panels for `nf_appwrite_reads_total`, `nf_appwrite_writes_total`, `nf_ownership_violations_total`, `nf_appwrite_operation_duration_seconds`, `nf_data_coordination_deduplicated_reads_total`, and `nf_cache_bypass_total`.
- Add alerts for spikes in read amplification, cache bypass, and governance failures.
