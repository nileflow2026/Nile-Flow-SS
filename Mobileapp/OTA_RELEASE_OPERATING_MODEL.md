# OTA Release Operating Model

**Document:** Nile Flow Engineering — Release Governance
**Owner:** Platform Engineering Lead
**Scope:** 13-person engineering team
**Version:** 1.0
**Last Updated:** 2026-06-09

---

## Table of Contents

1. [Developer Workflow](#1-developer-workflow)
2. [Hotfix Workflow](#2-hotfix-workflow)
3. [Approval Matrix](#3-approval-matrix)
4. [Release Ownership](#4-release-ownership)
5. [Deployment Checklist](#5-deployment-checklist)
6. [Release Cadence](#6-release-cadence)

---

## 1. Developer Workflow

### Standard Flow

```
Feature Branch
    │
    ▼ Pull Request (code review)
Feature Branch ──► Develop
                        │
                        ▼ Auto-OTA (deploy-staging.yml)
                    Staging (QA Channel)
                        │
                        ▼ QA Verification
                    QA Sign-off
                        │
                        ▼ Manual Promotion
                    Preview (UAT Channel)
                        │
                        ▼ Production Approval Gate
                    Production (Release Channel)
```

### Step-by-Step

#### Step 1: Feature Development

```bash
git checkout develop
git pull origin develop
git checkout -b feature/FEAT-<issue-number>-<short-description>
```

#### Step 2: Code Review

- Create PR against `develop`
- Minimum 1 reviewer for standard features
- Minimum 2 reviewers for payment/auth/critical paths
- All CI checks must pass:
  - TypeScript (`npx tsc --noEmit`)
  - Lint (`npx eslint .`)
  - Expo config validation (`npx expo config --type public`)
  - Fingerprint generation (`npx @expo/fingerprint .`)

#### Step 3: Merge to Develop

```bash
# Merge PR to develop via GitHub UI (Squash merge)
```

#### Step 4: Automatic Staging OTA

- Triggered by push to `develop` or `staging`
- Runs `deploy-staging.yml` workflow
- Publishes OTA update to `staging` channel
- Tags deployment with `staging-ota-<timestamp>`

#### Step 5: QA Verification

- QA team tests on staging channel
- Verify: auth, checkout, payments, notifications
- Report bugs via GitHub Issues

#### Step 6: Promote to Preview

```bash
eas update --branch preview --message "Promotion: <description>"
```

#### Step 7: Production OTA

- PR from `develop` → `main`
- Requires production approval gate
- Runs `deploy-production.yml` workflow
- Publishes OTA update to `production` channel
- Tags release with `production-ota-<timestamp>`

---

## 2. Hotfix Workflow

### When to Use

- SEV-0 or SEV-1 incident (see Rollback Playbook)
- Critical bug blocking users from checkout/payments/auth

### Flow

```
Main (current production)
    │
    ▼ Create hotfix branch
Hotfix/HF-<issue>
    │
    ▼ Fix + minimal validation
Hotfix Branch
    │
    ▼ OTA directly to production (bypass staging)
Production Channel
    │
    ▼ Backport to main + develop
All Branches Updated
```

### Hotfix Process

1. **Incident declared** — on-call engineer notifies #incidents
2. **Hotfix branch created** — from `main`
3. **Fix applied** — minimal, focused change
4. **Expedited review** — senior engineer (can be async)
5. **OTA published** — directly to production channel via `eas update`
6. **Verification** — Sentry error rate, manual test
7. **Backport** — merge to `main` and `develop`
8. **Post-mortem** — within 24 hours

### Hotfix Rules

- Hotfix bypass is **explicitly** approved by lead
- Hotfix must be backported within 1 hour
- No hotfix on Friday unless SEV-0
- All hotfixes get a post-mortem

---

## 3. Approval Matrix

| Action                          | Requires            | Reviewers         | Environment |
| ------------------------------- | ------------------- | ----------------- | ----------- |
| PR to `develop` (standard)      | Code review         | 1 engineer        | Development |
| PR to `develop` (critical path) | Code review         | 2 engineers       | Development |
| Merge to `staging`              | Auto (push trigger) | N/A               | Staging     |
| OTA to `preview`                | Manual              | 1 engineer        | Preview     |
| PR to `main`                    | Code review         | 2 engineers       | Production  |
| OTA to `production`             | Approval gate       | Lead + 1 engineer | Production  |
| Hotfix OTA                      | Emergency gate      | 1 senior engineer | Production  |
| Native build (Android/iOS)      | Manual trigger      | Lead              | Production  |
| Store submission                | Manual trigger      | Lead + PM         | Store       |

### Production Gate

```
□ Code review completed (2 engineers)
□ All CI checks pass
□ QA sign-off on staging
□ Platform lead approval
□ Deployment window (not Friday unless approved)
```

---

## 4. Release Ownership

### Roles & Responsibilities

| Role                          | Person          | Responsibilities                                             |
| ----------------------------- | --------------- | ------------------------------------------------------------ |
| **Release Engineer**          | Rotating weekly | Owns OTA deployment pipeline, monitors CI/CD, enforces gates |
| **Platform Engineering Lead** | [TBD]           | Architecture decisions, tooling, release strategy            |
| **QA Lead**                   | [TBD]           | Staging verification, approval gate sign-off                 |
| **Engineering Manager**       | [TBD]           | Release cadence, escalation management                       |
| **On-call Engineer**          | Rotating weekly | Incident response, hotfix execution                          |

### Rotation

```
Weekly rotation for:
  - Release Engineer
  - On-call Engineer

Rotation schedule:
  - Monday 09:00 UTC → next Monday 09:00 UTC
  - Handover document required
```

### Release Engineer Duties

```
□ Monitor CI/CD pipeline health
□ Review deployment failures
□ Enforce approval gates
□ Manage EAS channels
□ Coordinate with QA
□ Lead release post-mortems
```

---

## 5. Deployment Checklist

### Pre-Deployment

```
□ Feature branch builds and passes CI
□ Code reviewed (per approval matrix)
□ All TypeScript errors resolved
□ All lint warnings resolved (target: 0 warnings)
□ Expo config exports clean
□ Fingerprint generated without errors
□ QA verified on staging channel
□ Sentry error rate stable (no increase > 0.1%)
□ PostHog metrics stable (no > 10% drop in conversion)
□ Production approval gate signed off
```

### Deployment

```
□ OTA published to target channel
□ Update group verified active
□ Production tested (auth, checkout, payment)
□ Sentry monitored for 15 minutes post-deploy
□ Deployment tagged in git
□ Release notes published to #engineering
```

### Post-Deployment

```
□ Error rate monitored for 1 hour
□ Crash-free rate confirmed > 99.5%
□ Rollback playbook accessible
□ Hotfix path available (if needed)
□ Deployment logged in release registry
```

---

## 6. Release Cadence

| Type             | Frequency           | Examples                                |
| ---------------- | ------------------- | --------------------------------------- |
| **Bug-fix OTA**  | Daily as needed     | Non-critical fixes, minor improvements  |
| **Feature OTA**  | 2-3 per week        | New features, moderate changes          |
| **Hotfix OTA**   | As needed (SEV-0/1) | Critical production bugs                |
| **Native build** | Bi-weekly           | Store submission, native module updates |

### OTA Update Policy

- **Development channel:** Unlimited, no restrictions
- **Staging channel:** Auto-deployed on every push to develop/staging
- **Preview channel:** On-demand for UAT
- **Production channel:** Approval-gated, maximum 3 per day

### Blackout Periods

```
□ Major holiday periods (Dec 15 - Jan 5)
□ Peak commerce days (Black Friday, Cyber Monday)
□ During store submission reviews
□ Friday after 14:00 UTC (exceptions for SEV-0)
```

---

## Appendix: Quick Reference

### Common Commands

```bash
# Publish to staging
eas update --branch staging --message "Update: <description>"

# Publish to production
eas update --branch production --message "Release: <description>"

# Rollback
eas update:rollback --branch production --channel production

# List updates
eas update:list --branch production --limit 10

# Check config
npx expo config --type public
```

### CI/CD Workflows

| Workflow                      | Trigger                 | Action                      |
| ----------------------------- | ----------------------- | --------------------------- |
| `deploy-staging.yml`          | Push to develop/staging | OTA to staging channel      |
| `deploy-production.yml`       | Push to main / manual   | OTA to production channel   |
| `build-production-native.yml` | Manual                  | Android AAB + iOS IPA build |
| `security-scan.yml`           | PR to main              | Security audit              |
| `enforce-architecture.yml`    | PR                      | Architecture conformance    |

---

_Generated by Nile Flow Platform Engineering — Last updated: 2026-06-09_
