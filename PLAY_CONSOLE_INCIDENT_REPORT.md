# NILE FLOW — GOOGLE PLAY CONSOLE INCIDENT REPORT

**Date:** June 9, 2026
**Incident ID:** SEC-2026-001
**Severity:** CRITICAL
**Status:** INVESTIGATION — REMEDIATION IN PROGRESS

---

## 1. INCIDENT SUMMARY

A Google Play Console service account JSON key file was discovered committed to the repository:

```
File: Mobileapp/nile-flow-app-3ad669df2cd0.json
Service Account: play-console-service-account@nile-flow-app.iam.gserviceaccount.com
Project: nile-flow-app
```

This file contains:

- **RSA private key** with full PEM encoding
- **Service account email** with publishing privileges
- **OAuth token endpoint** credentials

---

## 2. EXPOSURE RISK ASSESSMENT

| Factor                              | Status                                                    | Risk        |
| ----------------------------------- | --------------------------------------------------------- | ----------- |
| Private key exposed                 | ✅ Confirmed — in committed file                          | 🔴 CRITICAL |
| Key can publish APKs                | ✅ Yes — service account has Play Console access          | 🔴 CRITICAL |
| Key can access Play data            | ✅ Yes — can read analytics, crash reports, ratings       | 🔴 CRITICAL |
| Key can manage listings             | ✅ Yes — can modify store listing, pricing                | 🔴 CRITICAL |
| Key can add/remove users            | ⚠️ Depends on IAM role assigned                           | 🟡 MEDIUM   |
| Key committed to Git history        | ✅ Yes — file present in working tree                     | 🔴 CRITICAL |
| Key pushed to remote                | ✅ Yes — remote is `github.com/nileflow2026/NileFlow.git` | 🔴 CRITICAL |
| Key accessible to all collaborators | ✅ Yes — anyone with repo access                          | 🔴 CRITICAL |

---

## 3. FILE DETAILS

| Property                  | Value                                                                |
| ------------------------- | -------------------------------------------------------------------- |
| File path                 | `Mobileapp/nile-flow-app-3ad669df2cd0.json`                          |
| Client email              | `play-console-service-account@nile-flow-app.iam.gserviceaccount.com` |
| Project ID                | `nile-flow-app`                                                      |
| Private key ID            | `3ad669df2cd0876b951aa88a86c2a68e44cf4690`                           |
| File size                 | ~2.5 KB                                                              |
| Added to `.gitignore`     | ✅ Yes (but after it was committed)                                  |
| Currently in working tree | ✅ Yes                                                               |

---

## 4. REFERENCES IN CODEBASE

The file is referenced/used by:

- **None found** — this file is not imported or required anywhere in the codebase
- The file was likely placed as a manual reference for EAS Submit (Play Store)
- No CI/CD pipeline references it
- No build scripts reference it

**Recommendation:** The key can be safely deleted from the working tree as it has zero codebase dependencies.

---

## 5. REMEDIATION STATUS

| Step                              | Status          | Action Required                                                                 |
| --------------------------------- | --------------- | ------------------------------------------------------------------------------- |
| Revoke key in Google Play Console | 🔴 **NOT DONE** | Manual: Login to console.cloud.google.com → IAM → Service Accounts → revoke key |
| Remove file from Git              | 🔴 **NOT DONE** | Use `git rm --cached` + `.gitignore` updates                                    |
| Remove file from Git history      | 🔴 **NOT DONE** | Use BFG Repo-Cleaner or `git filter-repo`                                       |
| Generate new key                  | 🔴 **NOT DONE** | After old key is revoked + history cleaned                                      |
| Store new key in GitHub Secrets   | 🔴 **NOT DONE** | `EAS_BUILD_GOOGLE_SERVICE_ACCOUNT_KEY` in GitHub → EAS                          |
| Verify no other copies exist      | 🔴 **NOT DONE** | Check local clones, CI caches, team machines                                    |

---

## 6. IMMEDIATE ACTIONS REQUIRED

### By the Founder/Lead (manual — outside repo):

```bash
# Step 1: Revoke the compromised key
# Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
# Project: nile-flow-app
# Service account: play-console-service-account@nile-flow-app.iam.gserviceaccount.com
# → Keys tab → Find key ID: 3ad669df2cd0876b951aa88a86c2a68e44cf4690
# → Click "Disable" → "Delete"
```

```bash
# Step 2: Generate a new key
# → Keys tab → "Add Key" → "Create New Key" → JSON
# → Store securely in password manager + GitHub Secrets as:
#   EAS_BUILD_GOOGLE_SERVICE_ACCOUNT_KEY
```

### By Engineering (repo changes — PARTIALLY DONE):

- ✅ `.gitignore` updated to block `service-account*.json`, `google-play*.json`, `*.pem`
- ✅ File listed in `.gitignore` as `nile-flow-app-3ad669df2cd0.json`
- ❌ File needs removal from Git tracking: `git rm --cached Mobileapp/nile-flow-app-3ad669df2cd0.json`
- ❌ Git history needs purging: Use BFG Repo-Cleaner

---

## 7. HISTORY REMEDIATION COMMANDS

**⚠️ DO NOT RUN YET — requires team coordination**
**⚠️ Run after all team members have pushed/merged their work**

```bash
# Install BFG Repo-Cleaner
# Download from: https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# Create a mirror of the repo
git clone --mirror https://github.com/nileflow2026/NileFlow.git nileflow-mirror.git
cd nileflow-mirror.git

# Remove the file from all history
java -jar bfg-1.14.0.jar --delete-files nile-flow-app-3ad669df2cd0.json nileflow-mirror.git

# GC and prune
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Force push (requires team to re-clone)
git push --force origin main
```

**Team communication required before force push:**

1. Notify all 13 team members to push/merge work
2. Announce maintenance window
3. Force push
4. All team members must `git fetch --all && git reset --hard origin/main`
5. Verify the file is gone from `git log --all --full-history -- nile-flow-app-3ad669df2cd0.json`

---

## 8. LESSONS LEARNED

1. **Service account keys should NEVER be stored in application repos**
2. **Use EAS Secrets or GitHub Secrets** instead of local files
3. **Gitleaks/pre-commit hook** would have caught this on `git commit`
4. **Gitignores should be set up before the first commit**
5. **Team needs mandatory security training**

---

## 9. FINAL CHECKLIST

- [ ] Revoke compromised key in Google Console
- [ ] Run `git rm --cached Mobileapp/nile-flow-app-3ad669df2cd0.json`
- [ ] Commit `.gitignore` + file removal
- [ ] Team communication about force push
- [ ] Run BFG / filter-repo to purge history
- [ ] Force push to remote
- [ ] Generate new service account key
- [ ] Store new key in GitHub Secrets
- [ ] Configure EAS Submit to use GitHub Secret
- [ ] Verify no remnants exist
- [ ] Enable Gitleaks pre-commit hook for all 13 developers
