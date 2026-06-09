# NILE FLOW — PRODUCTION SECURITY BASELINE

**Date:** June 9, 2026
**Version:** 1.0
**Applies to:** All Nile Flow repositories and infrastructure
**Audience:** Engineering team (13 members)

---

## 1. CREDENTIAL MANAGEMENT

### 1.1 Where Secrets Live

| Environment            | Storage                      | Access                  |
| ---------------------- | ---------------------------- | ----------------------- |
| Mobile app (EAS Build) | EAS Secrets                  | Expo account admins     |
| CI/CD (GitHub Actions) | GitHub Secrets               | GitHub repo admins      |
| Backend (Render)       | Render Environment Variables | Render dashboard admins |
| Local development      | `.env` file (GITIGNORED)     | Individual developer    |

### 1.2 Secret Types

| Type                 | Example                | Where To Store   |
| -------------------- | ---------------------- | ---------------- |
| API Keys (public)    | Stripe publishable key | EAS Secrets      |
| API Keys (secret)    | Stripe secret key      | Backend env only |
| Auth Tokens          | Sentry auth token      | GitHub Secrets   |
| Service Account Keys | Google Play JSON       | GitHub Secrets   |
| Database Credentials | Appwrite API key       | Backend env      |
| JWT Secrets          | Auth signing key       | Backend env      |

### 1.3 Prohibited Practices

- ❌ Hardcoding secrets in source code
- ❌ Committing `.env` files to Git
- ❌ Storing service account keys in repos
- ❌ Sharing secrets via Slack/email
- ❌ Using production keys in development
- ❌ Logging secret values

### 1.4 Required Practices

- ✅ All secrets loaded from environment variables
- ✅ `.gitignore` blocks all common secret file patterns
- ✅ CI/CD pipelines use GitHub Secrets (not hardcoded values)
- ✅ Mobile app uses EAS Secrets + `Constants.expoConfig?.extra?.`
- ✅ Secrets are rotated on schedule

---

## 2. SECRET ROTATION POLICY

| Secret                      | Rotation        | Procedure                                                              |
| --------------------------- | --------------- | ---------------------------------------------------------------------- |
| Google Play Service Account | Every 6 months  | Generate new key in GCP Console, update GitHub Secrets, delete old key |
| Stripe Keys                 | Every 12 months | Regenerate in Stripe Dashboard, update EAS/backend secrets             |
| Sentry Auth Token           | Every 6 months  | Generate in Sentry, update GitHub Secrets                              |
| Expo Access Token           | Every 6 months  | Generate in Expo Dashboard, update GitHub Secrets                      |
| Google Maps API Key         | Every 12 months | Restrict in GCP Console, update EAS Secrets                            |
| JWT Secret                  | Every 3 months  | Generate new random string, update backend env                         |
| Appwrite API Key            | Every 6 months  | Regenerate in Appwrite Console, update backend env                     |
| OpenAI API Key              | Every 12 months | Regenerate in OpenAI Dashboard, update backend env                     |

---

## 3. REPOSITORY ACCESS POLICY

### 3.1 Branch Protections

| Branch      | PR Required    | Approvals         | CI Checks                       | Direct Push |
| ----------- | -------------- | ----------------- | ------------------------------- | ----------- |
| `main`      | ✅ Yes         | 1 (2 for release) | Architecture + Security + Build | ❌ Blocked  |
| `staging`   | ✅ Yes         | 1                 | Architecture + Security         | ❌ Blocked  |
| `develop`   | ⚠️ Recommended | 0                 | Security                        | ✅ Allowed  |
| `feature/*` | ❌ No          | 0                 | None                            | ✅ Allowed  |
| `hotfix/*`  | ✅ Yes         | 1 (lead)          | Architecture + Security         | ❌ Blocked  |

### 3.2 Team Permissions

| Role   | Permission       | Members                    |
| ------ | ---------------- | -------------------------- |
| Admin  | Full access      | Founder, Lead Engineer     |
| Write  | Push + PR        | All engineers              |
| Triage | Issue management | QA team                    |
| Read   | View only        | Product, external auditors |

---

## 4. PRODUCTION DEPLOYMENT APPROVAL

### 4.1 Release Gates

```
┌─────────────────┐
│   Code Change   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PR → develop   │ ← CI runs: architecture + security scan
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Staging deploy  │ ← QA verifies on staging channel
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  QA Approval    │ ← QA Engineer signs off
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  PR → main      │ ← CI runs: full suite
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Product Signoff │ ← Product Manager approves
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Lead Approval  │ ← Founder/Lead Engineer signs
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Production OTA  │ ← Auto-deployed via CI/CD
└─────────────────┘
```

### 4.2 Emergency Override

For hotfixes (critical checkout/payment bugs):

1. Label PR with `HOTFIX`
2. Requires only 1 approval (Lead Engineer)
3. Bypass staging — deploy directly to production
4. Must be retroactively tested within 4 hours
5. Rollback command prepared before deploy

---

## 5. INCIDENT RESPONSE PROCESS

### 5.1 Security Incident Severity

| Severity    | Definition                                       | Response Time |
| ----------- | ------------------------------------------------ | ------------- |
| 🔴 CRITICAL | Secret leak, data breach, unauthorized access    | < 1 hour      |
| 🟡 HIGH     | Vulnerability in production, suspicious activity | < 4 hours     |
| 🟢 MEDIUM   | Misconfiguration, outdated dependency            | < 1 week      |
| 🔵 LOW      | Best practice violation, documentation gap       | < 1 month     |

### 5.2 Incident Response Steps

1. **Identify** — Detection via Gitleaks, Sentry, or user report
2. **Assess** — Determine severity and impact radius
3. **Contain** — Revoke compromised credentials immediately
4. **Remediate** — Remove secrets from codebase, rotate keys
5. **Communicate** — Notify team via #security channel
6. **Document** — Write incident report
7. **Prevent** — Update tooling, training, or processes

### 5.3 Contact List

| Role              | Person        | Contact           |
| ----------------- | ------------- | ----------------- |
| Security Lead     | Founder       | (Slack @founder)  |
| Technical Lead    | Lead Engineer | (Slack @lead)     |
| Incident Response | All engineers | #security channel |

---

## 6. VENDOR ACCESS CONTROLS

| Vendor       | Service                | Access Level         | Team Members       |
| ------------ | ---------------------- | -------------------- | ------------------ |
| Expo         | Builds, OTA, Submit    | Admin / Developer    | Founder, Lead      |
| GitHub       | Source code, CI/CD     | Admin / Write / Read | All (by role)      |
| Google Cloud | Maps API, Play Console | Admin                | Founder, Lead      |
| Stripe       | Payments               | Admin / Restricted   | Founder, Lead      |
| Sentry       | Error tracking         | Admin / Member       | All engineers      |
| PostHog      | Analytics              | Admin / View         | Product, engineers |
| Appwrite     | Backend DB, Auth       | Admin / Developer    | Founder, Lead      |
| Render       | Backend hosting        | Admin / Developer    | Founder, Lead      |
| Resend       | Email service          | Admin                | Founder, Lead      |

**Principle:** Grant minimum access required. Review quarterly.

---

## 7. AUDIT LOGGING

| Event             | Where            | Retention |
| ----------------- | ---------------- | --------- |
| Git commits       | GitHub           | Forever   |
| PR reviews        | GitHub           | Forever   |
| Secret detection  | Gitleaks CI      | 30 days   |
| Build logs        | Expo EAS         | 90 days   |
| Deployment events | GitHub Actions   | 90 days   |
| Error events      | Sentry           | 90 days   |
| API access        | Backend logs     | 30 days   |
| Auth events       | Backend + Sentry | 90 days   |

---

## 8. COMPLIANCE CHECKLIST (MONTHLY)

- [ ] Rotate secrets per schedule (§2)
- [ ] Review GitHub access — remove inactive users
- [ ] Verify Gitleaks CI is passing on all PRs
- [ ] Check Sentry for anomalous error patterns
- [ ] Review vendor access — remove unused permissions
- [ ] Run full secret scan (`python /tmp/secret_scan.py`)
- [ ] Update incident response contacts
- [ ] Test rollback procedure
- [ ] Review branch protection rules
- [ ] Verify `.gitignore` covers all new patterns
