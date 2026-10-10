# Alerting Framework Report

**Date:** 2026-06-09
**Auditor:** Platform Engineering (SRE)
**Scope:** Nile Flow — Alert Definitions and Notification Channels

---

## Critical Alerts

### CRIT-01: API Down

| Attribute | Value                                       |
| --------- | ------------------------------------------- |
| Condition | `/health` returns non-200 for > 1 minute    |
| Severity  | **SEV-0**                                   |
| Response  | 15 minutes                                  |
| Channel   | PagerDuty / Slack #incidents                |
| Runbook   | [Rollback Playbook](./ROLLBACK_PLAYBOOK.md) |

### CRIT-02: Checkout Failure Rate > 10%

| Attribute | Value                                                        |
| --------- | ------------------------------------------------------------ |
| Condition | `rate(nf_http_errors_total{route=~"/checkout.*"}[5m]) > 0.1` |
| Severity  | **SEV-0**                                                    |
| Response  | 15 minutes                                                   |
| Channel   | Slack #incidents                                             |
| Runbook   | [Rollback Playbook](./ROLLBACK_PLAYBOOK.md)                  |

### CRIT-03: Payment Failure Rate > 15%

| Attribute | Value                                                                                                |
| --------- | ---------------------------------------------------------------------------------------------------- |
| Condition | `rate(nf_payment_attempts_total{status="failure"}[5m]) / rate(nf_payment_attempts_total[5m]) > 0.15` |
| Severity  | **SEV-0**                                                                                            |
| Response  | 15 minutes                                                                                           |
| Channel   | Slack #incidents + SMS (on-call)                                                                     |
| Runbook   | [Payment Rollback](./ROLLBACK_PLAYBOOK.md#1-production-rollback)                                     |

### CRIT-04: Crash Free Sessions < 99%

| Attribute | Value                                                                 |
| --------- | --------------------------------------------------------------------- |
| Condition | Sentry crash-free session rate < 99%                                  |
| Severity  | **SEV-1**                                                             |
| Response  | 30 minutes                                                            |
| Channel   | Slack #incidents                                                      |
| Runbook   | [Hotfix Workflow](./OTA_RELEASE_OPERATING_MODEL.md#2-hotfix-workflow) |

## Warning Alerts

### WARN-01: Appwrite Read Spike

| Attribute | Value                                             |
| --------- | ------------------------------------------------- |
| Condition | `rate(nf_appwrite_reads_total[5m]) > 2x baseline` |
| Severity  | **SEV-3**                                         |
| Response  | 24 hours                                          |
| Channel   | Slack #engineering                                |

### WARN-02: Slow API Responses

| Attribute | Value                                        |
| --------- | -------------------------------------------- |
| Condition | `nf_http_request_duration_seconds{p50} > 2s` |
| Severity  | **SEV-3**                                    |
| Response  | 24 hours                                     |
| Channel   | Slack #engineering                           |

### WARN-03: Vendor Order Failure

| Attribute | Value                                                                         |
| --------- | ----------------------------------------------------------------------------- |
| Condition | `rate(nf_http_errors_total{route=~"/vendor/orders.*",status="5xx"}[10m]) > 0` |
| Severity  | **SEV-2**                                                                     |
| Response  | 2 hours                                                                       |
| Channel   | Slack #engineering                                                            |

### WARN-04: Queue Backlog Growing

| Attribute | Value                                   |
| --------- | --------------------------------------- |
| Condition | `nf_queue_depth > 1000` for > 5 minutes |
| Severity  | **SEV-2**                               |
| Response  | 2 hours                                 |
| Channel   | Slack #engineering                      |

### WARN-05: Cache Hit Rate Dropping

| Attribute | Value                                                                   |
| --------- | ----------------------------------------------------------------------- |
| Condition | `rate(nf_cache_misses_total[5m]) / rate(nf_cache_hits_total[5m]) > 0.5` |
| Severity  | **SEV-3**                                                               |
| Response  | 24 hours                                                                |
| Channel   | Slack #engineering                                                      |

## Alert Configuration (PrometheusRule Format)

```yaml
groups:
  - name: nileflow-critical
    interval: 30s
    rules:
      - alert: API_Down
        expr: probe_success{job="nileflow-backend"} == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Nile Flow API is down"

      - alert: CheckoutFailureRateHigh
        expr: |
          rate(nf_http_errors_total{route=~"/checkout.*"}[5m])
          / rate(nf_http_requests_total{route=~"/checkout.*"}[5m])
          > 0.1
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Checkout failure rate exceeds 10%"

      - alert: PaymentFailureRateHigh
        expr: |
          rate(nf_payment_attempts_total{status="failure"}[5m])
          / rate(nf_payment_attempts_total[5m])
          > 0.15
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Payment failure rate exceeds 15%"

  - name: nileflow-warning
    interval: 60s
    rules:
      - alert: AppwriteReadSpike
        expr: |
          rate(nf_appwrite_reads_total[5m])
          / avg_over_time(rate(nf_appwrite_reads_total[5m])[1h:1m])
          > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Appwrite read volume has doubled"

      - alert: SlowAPIResponses
        expr: nf_http_request_duration_seconds{p50} > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "p50 API response time exceeds 2 seconds"

      - alert: QueueBacklog
        expr: nf_queue_depth > 1000
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Queue depth exceeds 1000 jobs"
```

## Notification Channels

| Channel            | Critical   | Warning | Info |
| ------------------ | ---------- | ------- | ---- |
| Slack #incidents   | ✅         | ✅      | ❌   |
| Slack #engineering | ❌         | ✅      | ✅   |
| Email (on-call)    | ✅         | ❌      | ❌   |
| SMS (on-call)      | SEV-0 only | ❌      | ❌   |
| PagerDuty          | SEV-0 only | ❌      | ❌   |

## Recommendations

1. **Deploy Alert Rules** — Push the PrometheusRule YAML to the monitoring cluster (Grafana Mimir / Thanos).
2. **Configure Slack Integration** — Set up Sentry and Prometheus Alertmanager Slack webhooks.
3. **Test Alert Routing** — Simulate each alert to verify routing to the correct channel.
4. **Set Up On-Call Schedule** — Establish a weekly rotation in PagerDuty/Opsgenie.

---

## Conclusion

**ALERTING FRAMEWORK: PASS** — Alert definitions cover critical (API down, checkout failure, payment failure, crash-free rate) and warning (Appwrite reads, slow responses, queue depth, cache hit rate) categories. Notification channels are mapped to severity levels.

---

_Generated by Nile Flow Platform Engineering_
