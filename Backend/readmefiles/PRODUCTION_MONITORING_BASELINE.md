# Production Monitoring Baseline

**Date:** 2026-06-09
**Author:** Platform Engineering (SRE)
**Project:** Nile Flow
**Document:** Production Monitoring Baseline & Runbook

---

## Purpose

This document defines the production monitoring baseline for Nile Flow. All monitoring configurations, alert thresholds, and escalation procedures are centralized here for on-call engineers and the 13-person engineering team.

---

## 1. Monitoring Stack

| Component              | Tool                     | Surface              |
| ---------------------- | ------------------------ | -------------------- |
| Error Tracking         | Sentry                   | Mobile, Backend, Web |
| Performance Monitoring | Sentry (Tracing)         | Mobile, Backend, Web |
| Session Replay         | Sentry                   | Mobile, Web          |
| Product Analytics      | PostHog                  | Mobile, Web          |
| Feature Flags          | PostHog                  | Not yet configured   |
| Metrics                | Prometheus (prom-client) | Backend              |
| Health Checks          | Express endpoints        | Backend              |
| Logging                | Winston + Morgan         | Backend              |
| Request Tracing        | Correlation IDs          | Backend              |

## 2. Health Endpoints

| Endpoint               | Purpose                         | Expected Status                |
| ---------------------- | ------------------------------- | ------------------------------ |
| `GET /health`          | Simple liveness check           | 200 OK                         |
| `GET /api/health`      | Simple liveness check (aliased) | 200 OK                         |
| `GET /health/appwrite` | Appwrite connectivity           | 200 OK                         |
| `GET /health/deep`     | Full dependency check           | 200 OK / 503 Degraded          |
| `GET /metrics`         | Prometheus metrics scrape       | 200 OK (key-protected in prod) |
| `GET /api/version`     | Current deployment version      | 200 OK (no-cache)              |

## 3. Prometheus Metrics

### HTTP Metrics

```prometheus
nf_http_request_duration_seconds{method,route,status_code}  # Histogram
nf_http_requests_total{method,route,status_code}            # Counter
nf_http_errors_total{method,route,status_code}              # Counter
nf_http_requests_in_flight                                   # Gauge
```

### Appwrite Metrics

```prometheus
nf_appwrite_reads_total{collection,operation}                # Counter
nf_appwrite_writes_total{collection,operation}               # Counter
nf_appwrite_errors_total{collection,operation}               # Counter
nf_appwrite_operation_duration_seconds{collection,operation} # Histogram
```

### Payment Metrics

```prometheus
nf_payment_attempts_total{provider,status}                   # Counter
nf_payment_processing_seconds{provider}                      # Histogram
nf_payment_amount_kes_total{provider}                        # Counter
```

### Cache Metrics

```prometheus
nf_cache_hits_total{key_prefix}                              # Counter
nf_cache_misses_total{key_prefix}                            # Counter
nf_cache_errors_total                                        # Counter
nf_cache_operation_duration_seconds{operation}               # Histogram
```

### Queue Metrics

```prometheus
nf_queue_jobs_enqueued_total{queue}                          # Counter
nf_queue_jobs_completed_total{queue}                         # Counter
nf_queue_jobs_failed_total{queue}                            # Counter
nf_queue_job_processing_seconds{queue,job_type}              # Histogram
nf_queue_depth{queue}                                        # Gauge
```

### Release Metrics

```prometheus
nf_release_info{sha,branch,channel,runtime_version}          # Gauge
```

## 4. Sentry Configuration

### Mobile (React Native)

| Parameter          | Value                                               |
| ------------------ | --------------------------------------------------- |
| DSN                | `913978...`                                         |
| Environment        | `development` / `production`                        |
| Release            | `nile-flow@{app version}`                           |
| Traces Sample Rate | 1.0 (dev) / 0.2 (prod)                              |
| Replays on Error   | 100%                                                |
| Replays Session    | 10%                                                 |
| OTA Tags           | `ota.channel`, `ota.runtimeVersion`, `ota.updateId` |

### Backend (Node.js)

| Parameter            | Value                          |
| -------------------- | ------------------------------ |
| DSN                  | `e5d842...`                    |
| Environment          | `NODE_ENV`                     |
| Release              | `APP_VERSION`                  |
| Traces Sample Rate   | 1.0 (dev) / 0.1 (prod)         |
| Profiles Sample Rate | 1.0 (dev) / 0.1 (prod)         |
| Max Request Body     | `always` (dev) / `none` (prod) |

### Website (React)

| Parameter          | Value                  |
| ------------------ | ---------------------- |
| DSN                | `4f4398...`            |
| Environment        | `import.meta.env.MODE` |
| Release            | `VITE_APP_VERSION`     |
| Traces Sample Rate | 1.0 (dev) / 0.1 (prod) |
| Replays on Error   | 100%                   |
| Replays Session    | 5%                     |

## 5. Alert Thresholds

### Critical (SEV-0)

| Alert                 | Threshold          | For   |
| --------------------- | ------------------ | ----- |
| API Down              | probe_success == 0 | 1 min |
| Checkout Failure Rate | > 10%              | 2 min |
| Payment Failure Rate  | > 15%              | 2 min |
| Crash Free Sessions   | < 99%              | 5 min |

### Warning (SEV-2/3)

| Alert                | Threshold       | For    |
| -------------------- | --------------- | ------ |
| Appwrite Read Spike  | > 2x baseline   | 5 min  |
| Slow API Responses   | p50 > 2s        | 5 min  |
| Vendor Order Failure | any 5xx         | 10 min |
| Queue Backlog        | depth > 1000    | 5 min  |
| Cache Hit Rate Drop  | miss/hits > 0.5 | 5 min  |

## 6. On-Call Rotation

**Status: NOT ESTABLISHED** — Requires weekly rotation setup.

Suggested schedule: 4 engineers, weekly rotation, Monday 09:00 UTC handover.

## 7. Escalation Contacts

| Level | Role                | Contact |
| ----- | ------------------- | ------- |
| L1    | On-call Engineer    | [TBD]   |
| L2    | SRE / Platform Lead | [TBD]   |
| L3    | Engineering Manager | [TDD]   |
| L4    | CTO                 | [TBD]   |

## 8. Recovery SLAs

| Severity | Response | Mitigation | Resolution |
| -------- | -------- | ---------- | ---------- |
| SEV-0    | 15 min   | 15 min     | 1 hour     |
| SEV-1    | 30 min   | 30 min     | 2 hours    |
| SEV-2    | 2 hours  | 4 hours    | 8 hours    |
| SEV-3    | 24 hours | 48 hours   | 1 week     |

## 9. Dashboard Definitions

### Grafana Dashboard: Nile Flow — Production Overview

**Panel 1: HTTP Request Rate**

- Metric: `rate(nf_http_requests_total[5m])`
- Group by: route
- Type: Timeseries

**Panel 2: Error Rate**

- Metric: `rate(nf_http_errors_total[5m]) / rate(nf_http_requests_total[5m])`
- Group by: status_code
- Type: Timeseries
- Threshold: 0.05 (5%)

**Panel 3: p50/p95/p99 Latency**

- Metric: `nf_http_request_duration_seconds`
- Type: Heatmap

**Panel 4: Payment Success Rate**

- Metric: `rate(nf_payment_attempts_total{status="success"}[1h]) / rate(nf_payment_attempts_total[1h])`
- Group by: provider
- Type: Stat
- Threshold: 0.85 (85%)

**Panel 5: Appwrite Operations**

- Metric: `rate(nf_appwrite_reads_total[5m])`, `rate(nf_appwrite_writes_total[5m])`
- Group by: collection
- Type: Timeseries

**Panel 6: Queue Depth**

- Metric: `nf_queue_depth`
- Group by: queue
- Type: Timeseries
- Threshold: 1000

**Panel 7: Active Deployments**

- Metric: `nf_release_info`
- Type: Table (last 10 releases)

**Panel 8: Sentry Crash-Free Rate**

- Source: Sentry Dashboard (embedded)
- Type: Iframe

---

_Generated by Nile Flow Platform Engineering — Production Monitoring Baseline_
