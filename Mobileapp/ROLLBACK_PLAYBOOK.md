# Rollback Playbook

**Document:** Incident Response & Recovery
**Owner:** Platform Engineering
**Scope:** Nile Flow — OTA Update Rollback Procedures
**Audience:** 13-person engineering team, on-call engineers

---

## Table of Contents

1. [Production Rollback](#1-production-rollback)
2. [Verification Process](#2-verification-process)
3. [Hotfix Recovery Workflow](#3-hotfix-recovery-workflow)
4. [Communication Plan](#4-communication-plan)
5. [Incident Severity Matrix](#5-incident-severity-matrix)
6. [Recovery SLA](#6-recovery-sla)

---

## 1. Production Rollback

### Prerequisites

- Authorized access to EAS project (EXPO_TOKEN)
- GitHub Actions permissions for rollback workflow
- Knowledge of the last known-good update group

### Rollback Command

```bash
# Rollback production channel to previous update
eas update:rollback --branch production --channel production

# Rollback to a specific update group
eas update:rollback --branch production --channel production \
  --group-id <group-id>

# Preview what will be rolled back (dry run)
eas update:rollback --branch production --channel production --dry-run
```

### Rollback Steps

1. **Assess Impact**
   - Identify affected users and scope
   - Determine severity level (see Section 5)

2. **Execute Rollback**

   ```bash
   eas update:rollback --branch production --channel production
   ```

3. **Verify Rollback**
   - Confirm the previous update group is now active
   - Test key flows: checkout, payments, authentication

4. **Notify Team**
   - Post to #incidents Slack channel
   - Update status page

5. **Post-Mortem**
   - Root cause analysis
   - Preventative measures
   - Update playbook if needed

### Automated Rollback via GitHub

```bash
# Trigger rollback workflow manually
gh workflow run rollback.yml -f branch=production -f channel=production
```

---

## 2. Verification Process

### Pre-Rollback Verification

```
□ Identify the last known-good update group
□ Verify rollback target is compatible with current native runtime
□ Confirm rollback won't break payments/auth flows
□ Communication drafted (see Section 4)
□ On-call engineer notified
```

### Post-Rollback Verification

```
□ Confirm update group switched successfully
   -> eas update:list --branch production
□ Verify authentication flow (login/signup)
□ Verify checkout flow (add to cart, pay)
□ Verify payment processing (Stripe/Flutterwave/PayPal)
□ Verify push notifications deliver
□ Monitor Sentry error rates (should decrease)
□ Monitor PostHog user sessions
□ Verify all 4 channels show correct updates
```

### Verification Commands

```bash
# List update groups on production
eas update:list --branch production --limit 10

# Check current active update
eas update:view --branch production

# Verify app config
npx expo config --type public

# Check runtime version
npx @expo/fingerprint .
```

---

## 3. Hotfix Recovery Workflow

### Use Case: Critical bug in production requires immediate fix

```
Timeline: < 1 hour from bug report to production OTA
```

### Steps

1. **Create hotfix branch**

   ```bash
   git checkout main
   git checkout -b hotfix/HF-<issue-number>-<short-description>
   ```

2. **Apply fix** — minimal change, focus on the critical path

3. **Validate locally**

   ```bash
   npx expo start
   # Test the specific fix
   ```

4. **Bypass staging** (hotfix exception)

   ```bash
   # Push directly to production channel
   eas update --branch production --message "Hotfix: HF-<issue> - <description>"
   ```

5. **Verify production**
   - Check Sentry error rate drops
   - Verify fix in production via internal test device
   - Confirm no regression in payments/auth

6. **Backport to main**

   ```bash
   git checkout main
   git merge hotfix/HF-<issue-number>-<short-description>
   git push origin main
   ```

7. **Backport to develop**

   ```bash
   git checkout develop
   git merge hotfix/HF-<issue-number>-<short-description>
   git push origin develop
   ```

8. **Delete hotfix branch**
   ```bash
   git branch -d hotfix/HF-<issue-number>-<short-description>
   git push origin --delete hotfix/HF-<issue-number>-<short-description>
   ```

### Hotfix Gate Criteria

- [ ] Bug prevents users from completing a critical flow (auth, payment, checkout)
- [ ] No workaround exists
- [ ] Fix is < 20 lines of code
- [ ] Fix is isolated to one module
- [ ] At least one senior engineer approved
- [ ] Staging bypass explicitly approved by lead

---

## 4. Communication Plan

### Slack Channels

| Channel        | Purpose                             | Posted By           |
| -------------- | ----------------------------------- | ------------------- |
| `#incidents`   | Real-time incident updates          | On-call engineer    |
| `#engineering` | Technical details & rollback status | Lead engineer       |
| `#product`     | User-facing impact & ETA            | Engineering manager |
| `#leadership`  | Executive summary                   | CTO / VP Eng        |

### Communication Templates

#### Incident Notification

```
🚨 INCIDENT: [SEVERITY]
Channel: #incidents

What: [brief description of issue]
Impact: [affected users / flows]
Status: [Investigating / Mitigating / Resolved]
Action: [rollback in progress / fix deployed]
ETA: [estimated resolution time]
On-call: @[name]
```

#### Resolution Notification

```
✅ RESOLVED: [INCIDENT ID]
Channel: #incidents

What happened: [root cause]
Fix: [what was done to resolve]
Impact: [downtime duration, affected users]
Prevention: [what changes prevent recurrence]
Post-mortem: [link to doc]
```

### Escalation Path

```
On-call Engineer
    ↓ (if unresolved after 15 min)
Senior Engineer / Tech Lead
    ↓ (if unresolved after 30 min)
Engineering Manager
    ↓ (if unresolved after 45 min)
CTO / VP Engineering
```

---

## 5. Incident Severity Matrix

| Severity  | Definition                                                              | Response Time    | Recovery SLA | Examples                                              |
| --------- | ----------------------------------------------------------------------- | ---------------- | ------------ | ----------------------------------------------------- |
| **SEV-0** | Complete system outage — all users cannot complete checkout or payments | Immediate        | < 15 min     | Auth system down, payment gateway unresponsive        |
| **SEV-1** | Critical flow broken — majority of users affected                       | Immediate        | < 30 min     | Checkout broken for most users, incorrect pricing     |
| **SEV-2** | Non-critical flow broken — some users affected                          | < 1 hour         | < 2 hours    | Profile page crash for Android, delayed notifications |
| **SEV-3** | Minor issue — cosmetic or edge case                                     | < 1 business day | < 1 week     | Button misaligned, incorrect copy text                |

### SEV-0 / SEV-1 Response

```
1. Immediate rollback (if OTA was recent)
2. Notify #incidents
3. Assemble response team
4. Mitigate (rollback or hotfix)
5. Verify
6. Post-mortem within 24 hours
```

---

## 6. Recovery SLA

| Environment            | Recovery Objective | Measurement                           |
| ---------------------- | ------------------ | ------------------------------------- |
| **Production (SEV-0)** | 15 minutes         | Time from alert → rollback complete   |
| **Production (SEV-1)** | 30 minutes         | Time from alert → fix deployed        |
| **Production (SEV-2)** | 2 hours            | Time from alert → fix deployed        |
| **Staging**            | 1 hour             | Time from bug report → fix in staging |
| **Development**        | 4 hours            | Time from bug report → fix in dev     |

### SLA Targets

- **OTA rollback execution:** < 5 minutes from command to full rollout
- **Hotfix OTA deployment:** < 30 minutes from code push to production
- **Verification complete:** < 10 minutes after rollback/hotfix

### Monitoring Tools

| Tool    | Metric           | Alert Threshold    |
| ------- | ---------------- | ------------------ |
| Sentry  | Error rate       | > 0.1% increase    |
| Sentry  | Crash-free rate  | < 99.5%            |
| PostHog | Session duration | > 20% drop         |
| PostHog | Conversion rate  | > 10% drop         |
| EAS     | Update delivery  | < 95% success rate |

---

## Appendix: Quick Reference

### Commands

```bash
# List updates
eas update:list --branch production --limit 10

# Rollback
eas update:rollback --branch production --channel production

# Check current group
eas update:view --branch production

# Publish hotfix
eas update --branch production --message "Hotfix: <description>"
```

### Contacts

| Role                      | Person |
| ------------------------- | ------ |
| Platform Engineering Lead | [TBD]  |
| DevOps / Release Engineer | [TBD]  |
| Engineering Manager       | [TBD]  |
| CTO                       | [TBD]  |
| QA Lead                   | [TBD]  |

---

_Generated by Nile Flow Platform Engineering — Last updated: 2026-06-09_
