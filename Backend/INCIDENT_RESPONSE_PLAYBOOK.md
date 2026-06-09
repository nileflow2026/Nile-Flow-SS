# Incident Response Playbook

**Document:** Nile Flow — Incident Management
**Owner:** SRE / Platform Engineering Lead
**Audience:** On-call engineers, 13-person engineering team
**Last Updated:** 2026-06-09

---

## 1. Severity Levels

| Severity  | Definition                                                                | Response SLA | Examples                                                       |
| --------- | ------------------------------------------------------------------------- | ------------ | -------------------------------------------------------------- |
| **SEV-0** | Complete system outage — all users cannot complete checkout/payments/auth | 15 min       | API down, payment gateway unresponsive, auth system failure    |
| **SEV-1** | Critical flow broken — majority of users affected                         | 30 min       | Checkout broken, incorrect pricing, search returning errors    |
| **SEV-2** | Non-critical flow broken — some users affected                            | 2 hours      | Profile page crash for Android, delayed notifications          |
| **SEV-3** | Minor issue — cosmetic, edge case, or non-user-facing                     | 24 hours     | Button misaligned, incorrect copy text, low-priority tech debt |

## 2. Escalation Matrix

```
                          ┌─────────────────────┐
                          │   On-Call Engineer   │
                          │  (Weekly Rotation)   │
                          └──────────┬──────────┘
                                     │ 15 min (SEV-0) / 30 min (SEV-1)
                                     ▼
                          ┌─────────────────────┐
                          │   Senior Engineer /  │
                          │    Tech Lead (SRE)   │
                          └──────────┬──────────┘
                                     │ +15 min (SEV-0) / +30 min (SEV-1)
                                     ▼
                          ┌─────────────────────┐
                          │ Engineering Manager  │
                          └──────────┬──────────┘
                                     │ +15 min
                                     ▼
                          ┌─────────────────────┐
                          │   CTO / VP Eng      │
                          └─────────────────────┘
```

### Contacts

| Role                  | Contact                        |
| --------------------- | ------------------------------ |
| On-call Engineer      | Weekly rotation (see schedule) |
| SRE / Platform Lead   | [TBD]                          |
| Engineering Manager   | [TBD]                          |
| CTO                   | [TBD]                          |
| QA Lead               | [TBD]                          |
| Customer Support Lead | [TBD]                          |

## 3. Incident Lifecycle

### Detection

Incidents can be detected via:

- **Automated alerts** (Sentry, Prometheus, PostHog)
- **User reports** (customer support, app reviews)
- **Internal monitoring** (engineer notices anomaly)
- **Payment provider webhook failures**

### Triage (First 5 Minutes)

1. **Acknowledge alert** — Respond in Slack #incidents
2. **Assess severity** — Use the severity matrix above
3. **Declare incident** — Post the incident notification template
4. **Assign roles** — Incident commander, communicator, investigator

### Response

1. **Mitigate** — Rollback OTA, disable feature flag, block problematic traffic
2. **Investigate** — Check Sentry, logs, metrics for root cause
3. **Fix** — Apply hotfix (see Rollback Playbook for OTA rollback)
4. **Verify** — Confirm fix in production, monitor error rates

### Resolution

1. **Post resolution notification** — Use the resolution template
2. **Post-mortem** — Schedule within 24 hours for SEV-0/1, 1 week for SEV-2
3. **Track action items** — Create GitHub issues for each action item

## 4. Communication Templates

### Incident Notification (Slack #incidents)

```
🚨 INCIDENT: [SEV-0/1/2/3]
ID: INC-[YYYYMMDD]-[NN]

What: [brief description]
Impact: [affected users/flows]
Status: [Investigating / Mitigating / Resolved]
Action: [rollback in progress / fix deployed / monitoring]
Started: [timestamp]
ETA: [estimated resolution time]
On-call: @[name]
Slack Thread: [link to thread]
```

### Customer-Facing Message (for SEV-0/1)

```
We're currently experiencing a technical issue affecting [feature].
Our team is actively working on a fix. We apologize for the inconvenience.
Updates will be posted here. [link to status page]
```

### Vendor Notification (SEV-0/1 affecting vendors)

```
Hi [Vendor Name],

We're aware of a technical issue affecting [orders/listing/payments]
and our team is working on it right now. Your store data is safe.
We'll update you as soon as this is resolved.

— Nile Flow Team
```

### Rider Notification (SEV-0/1 affecting deliveries)

```
Hi [Rider Name],

We're experiencing a system issue that may affect [delivery assignments/
tracking/payments]. Our team is working on a fix. Please stay online
for updates.

— Nile Flow Team
```

### Resolution Notification

```
✅ RESOLVED: INC-[YYYYMMDD]-[NN]

What happened: [root cause summary]
Fix applied: [what was done]
Impact duration: [X] minutes
Users affected: [estimated count]
Prevention: [follow-up measures]
Post-mortem: [link to doc]
```

## 5. Recovery Procedures

### OTA Rollback (15 min SLA)

See [Rollback Playbook](./ROLLBACK_PLAYBOOK.md) for detailed steps.

Quick reference:

```bash
# Rollback production OTA
eas update:rollback --branch production --channel production

# Verify
eas update:list --branch production --limit 5
```

### Hotfix Deployment (30 min SLA)

See [OTA Release Operating Model](./OTA_RELEASE_OPERATING_MODEL.md#2-hotfix-workflow) for detailed steps.

### Database Recovery (if applicable)

1. Identify the scope of data issue
2. Restore from Appwrite backup (if available)
3. Verify data integrity
4. Notify affected users

## 6. Post-Mortem Template

```markdown
# Post-Mortem: INC-[YYYYMMDD]-[NN]

## Summary

- **Date:** YYYY-MM-DD
- **Duration:** X hours Y minutes
- **Severity:** SEV-X
- **Impact:** [description of user/business impact]

## Timeline

- HH:MM — Alert triggered
- HH:MM — On-call acknowledged
- HH:MM — Incident declared
- HH:MM — Mitigation started
- HH:MM — Service restored
- HH:MM — Resolution confirmed

## Root Cause

[detailed explanation]

## Contributing Factors

- Factor 1
- Factor 2

## Action Items

- [ ] Action 1 (owner, due date)
- [ ] Action 2 (owner, due date)

## Lessons Learned

- What went well
- What went wrong
- What can be improved

## Appendices

- Relevant logs
- Metric graphs
- Sentry event IDs
```

## 7. On-Call Schedule

| Week   | Engineer | Backup |
| ------ | -------- | ------ |
| Week 1 | [TBD]    | [TBD]  |
| Week 2 | [TBD]    | [TBD]  |
| Week 3 | [TBD]    | [TBD]  |
| Week 4 | [TBD]    | [TBD]  |

Rotation: Monday 09:00 UTC → next Monday 09:00 UTC

---

_Generated by Nile Flow Platform Engineering — Last updated: 2026-06-09_
