# NILE FLOW — GITHUB SECURITY REVIEW

**Date:** June 9, 2026
**Scope:** GitHub Actions workflows, repository settings, secrets management

---

## 1. EXISTING WORKFLOWS REVIEW

| Workflow                 | File                                         | Permissions     | Secrets Used                       | Security Score |
| ------------------------ | -------------------------------------------- | --------------- | ---------------------------------- | -------------- |
| Architecture Enforcement | `.github/workflows/enforce-architecture.yml` | Default (write) | None                               | 🟡 MEDIUM      |
| Security Scan            | `.github/workflows/security-scan.yml`        | Default (write) | `GITHUB_TOKEN`, `GITLEAKS_LICENSE` | 🟢 GOOD (new)  |

### Issues Found

**ISSUE G1 (MEDIUM): Architecture Enforcement workflow runs with default permissions**
The `enforce-architecture.yml` workflow does not specify explicit permissions. By default, GitHub Actions triggers with `contents: write` and `pull-requests: write`. This gives the GITHUB_TOKEN more access than needed for a CI check.

**ISSUE G2 (LOW): No workflow-level permission scoping**
Neither workflow restricts permissions at the job or step level. Best practice is to scope each job to the minimum required.

---

## 2. RECOMMENDED PERMISSIONS

Each workflow should explicitly declare minimal permissions:

```yaml
# For CI workflows that only READ the repo and post status checks:
permissions:
  contents: read
  pull-requests: write # Only needed to post check results
  actions: read
  checks: write # Only needed to update check run status
```

### Updated Architecture Enforcement Workflow

Add to the top of `enforce-architecture.yml`:

```yaml
permissions:
  contents: read
  pull-requests: write
```

### Updated Security Scan Workflow

```yaml
permissions:
  contents: read
  pull-requests: write
  checks: write
```

---

## 3. SECRETS USAGE AUDIT

| Secret Name        | Used By            | Exists in GitHub? | Risk                           |
| ------------------ | ------------------ | ----------------- | ------------------------------ |
| `GITHUB_TOKEN`     | Both workflows     | ✅ Auto-injected  | 🟢 Low (scoped to workflow)    |
| `GITLEAKS_LICENSE` | Security scan      | ❌ Not set        | 🟢 Optional (not required)     |
| `EXPO_TOKEN`       | Not yet configured | ❌ Not set        | 🔴 NEEDED for deploy workflows |
| `SLACK_WEBHOOK`    | Not yet configured | ❌ Not set        | 🟡 Low priority                |

---

## 4. BRANCH PROTECTION RECOMMENDATIONS

### Main branch

- [ ] Require pull request before merging
- [ ] Require 1 approval (for non-hotfix)
- [ ] Require status checks (architecture + security scan)
- [ ] Require up-to-date branches
- [ ] Include administrators
- [ ] Do not allow bypass

### Staging branch

- [ ] Require pull request before merging
- [ ] Require 1 approval
- [ ] Require status checks (architecture + security scan)

### Develop branch

- [ ] Require status checks (security scan)
- [ ] Optional: require PR for direct pushes

---

## 5. LEAST PRIVILEGE MODEL

### GitHub Teams

| Team                  | Repository Role | Who                    |
| --------------------- | --------------- | ---------------------- |
| `nileflow/admins`     | Admin           | Founder, Lead Engineer |
| `nileflow/developers` | Write           | All 13 engineers       |
| `nileflow/qa`         | Triage          | QA Engineers           |
| `nileflow/product`    | Read            | Product Manager        |

### Action Items

1. **Create teams** in GitHub organization
2. **Remove individual collaborator access** — use teams instead
3. **Set branch protection** rules for main/staging
4. **Limit workflow permissions** to read-only where possible
5. **Add `EXPO_TOKEN`** to GitHub Secrets
6. **Enable secret scanning** in GitHub repo settings (Settings → Security → Secret scanning)
7. **Enable push protection** (prevents pushes containing secrets)
