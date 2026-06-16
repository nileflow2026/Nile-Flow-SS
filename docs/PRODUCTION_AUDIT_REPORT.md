# NILE FLOW — PRODUCTION OTA AUDIT REPORT

**Date:** June 9, 2026
**Auditor:** Senior Expo / React Native / EAS / DevOps Engineer
**Project:** Nile Flow Mobile App (Expo SDK 56)
**Repository:** `nileflow2026/NileFlow`
**Team Size:** 13 Engineers
**Target Scale:** Millions of users across Africa

---

## Table of Contents

1. [Phase 1 — Configuration Audit](#phase-1--configuration-audit)
2. [Phase 2 — Channel & Branch Architecture Review](#phase-2--channel--branch-architecture-review)
3. [Phase 3 — Release Process Audit](#phase-3--release-process-audit)
4. [Phase 4 — Deployment Workflow Design](#phase-4--deployment-workflow-design)
5. [Phase 5 — Security & Governance Review](#phase-5--security--governance-review)
6. [Phase 6 — CI/CD Recommendations](#phase-6--cicd-recommendations)
7. [Phase 7 — Final Verdict & Score](#phase-7--final-verdict--score)

---

# Phase 1 — Configuration Audit

## 1.1 Expo Updates Configuration

**File:** `Mobileapp/app.config.js` (lines 20–25)

```js
updates: {
  url: "https://u.expo.dev/f832f869-d5a3-472c-a6e6-8b098d9d45c9",
},
runtimeVersion: {
  policy: "appVersion",
},
```

### Analysis

| Setting                          | Current Value                     | Status         | Best Practice                                     |
| -------------------------------- | --------------------------------- | -------------- | ------------------------------------------------- |
| `updates.url`                    | `https://u.expo.dev/f832f869-...` | ✅ Correct     | Valid Expo Updates URL for project `f832f869-...` |
| `updates.enabled`                | **NOT SET**                       | ❌ **MISSING** | Should be explicitly `true`                       |
| `updates.checkAutomatically`     | **NOT SET**                       | ❌ **MISSING** | Should be set to `ON_LOAD` for production         |
| `updates.fallbackToCacheTimeout` | **NOT SET**                       | ❌ **MISSING** | Default is 0ms — too aggressive                   |
| `runtimeVersion.policy`          | `"appVersion"`                    | ⚠️ Suboptimal  | See §1.3                                          |

### Issues Found

**ISSUE 1 (CRITICAL): `updates.enabled` not declared**
The `updates.enabled` key is absent from `app.config.js`. While Expo defaults this to `true` when `updates.url` is set, it is best practice to **explicitly declare** `updates: { enabled: true }`. Without explicit declaration, a misconfigured build could accidentally disable OTA updates.

**ISSUE 2 (HIGH): `updates.checkAutomatically` not set**
The default behavior is `ON_LOAD` which checks for updates on app launch. If this is the intended behavior it should be explicitly declared. Without explicit declaration, future Expo upgrades could change the default silently.

**ISSUE 3 (MEDIUM): `updates.fallbackToCacheTimeout` not set**
Default is `0`, meaning if the update check fails on launch, the app immediately falls back to the cached bundle **without any grace period**. For users in Africa with variable network connectivity, a 10–30 second timeout should be set to allow the update check time to complete before falling back.

**Recommended fix:**

```js
updates: {
  url: "https://u.expo.dev/f832f869-d5a3-472c-a6e6-8b098d9d45c9",
  enabled: true,
  checkAutomatically: "ON_LOAD",
  fallbackToCacheTimeout: 30000, // 30 seconds for African network conditions
},
runtimeVersion: {
  policy: "fingerprint", // See §1.3 recommendation
},
```

---

## 1.2 EAS Configuration (`eas.json`)

**File:** `Mobileapp/eas.json`

```json
{
  "cli": {
    "version": ">= 18.6.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development"
    },
    "preview": {
      "distribution": "internal",
      "channel": "preview"
    },
    "apk": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      },
      "channel": "apk"
    },
    "production": {
      "autoIncrement": true,
      "channel": "production"
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Analysis

| Profile       | Channel       | Distribution     | Issues                                                |
| ------------- | ------------- | ---------------- | ----------------------------------------------------- |
| `development` | `development` | Internal         | ✅ Correct for dev builds                             |
| `preview`     | `preview`     | Internal         | ⚠️ **No Android/iOS platform config** — uses defaults |
| `apk`         | `apk`         | Internal         | ✅ Useful for Android APK testing                     |
| `production`  | `production`  | Store (implicit) | ⚠️ No explicit `distribution: "store"`                |

### Issues Found

**ISSUE 4 (MEDIUM): `production` profile missing `distribution: "store"`**
While the absence defaults to store distribution, explicit declaration prevents configuration drift.

**ISSUE 5 (LOW): No `ios` / `android` platform overrides in `production`**
For a production app targeting millions of users, platform-specific build configs (e.g., iOS Enterprise cert, Android ProGuard rules) should be explicitly configured.

**ISSUE 6 (LOW): `apk` profile has no `ios` counterpart**
Symmetry would be useful for iOS testing with debug builds.

**Recommended eas.json:**

```json
{
  "cli": {
    "version": ">= 18.6.0",
    "appVersionSource": "remote"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "channel": "development",
      "ios": { "simulator": true },
      "android": { "buildType": "apk" }
    },
    "preview": {
      "distribution": "internal",
      "channel": "staging",
      "android": { "buildType": "apk" }
    },
    "production": {
      "autoIncrement": true,
      "distribution": "store",
      "channel": "production",
      "ios": {
        "enterpriseProvisioning": false
      },
      "android": {
        "buildType": "app-bundle"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

---

## 1.3 Runtime Version Strategy

### Current: `appVersion` policy

The current strategy uses `runtimeVersion: { policy: "appVersion" }`, which ties the runtime version to the `version` field in `app.config.js` (currently `"1.2.8"`).

**How it works:**

- When `appVersion` changes (e.g., from `1.2.8` to `1.3.0`), the runtime version changes.
- OTA updates are only delivered to builds with a **matching** runtime version.
- A native rebuild is triggered automatically via `"appVersionSource": "remote"` in eas.json.

### Advantages

- ✅ Simple to understand and manage
- ✅ `appVersionSource: "remote"` ensures auto-increment works
- ✅ Works with `autoIncrement: true` in the production profile

### Risks

**ISSUE 7 (HIGH): `appVersion` policy is fragile for OTA-only changes**

Scenario: Developers fix a React Native bug on the `main` branch and publish an OTA update. If `version` in `app.config.js` is bumped at the same time, the runtime version changes, and **only users who install the new native build will receive the update**. Users on the previous build will not receive the OTA fix.

**Example:** Version `1.2.8` → OTA published → version bumped to `1.2.9` in app.config.js → OTA update now requires runtime `1.2.9` → users on `1.2.8` never get the fix.

**ISSUE 8 (MEDIUM): Manual version bumps cause OTA delivery gaps**
If a developer forgets to bump the version or bumps it incorrectly, OTA updates may silently fail to deliver to production users. There is no validation mechanism.

### Recommendation: Switch to `fingerprint` policy

```js
runtimeVersion: {
  policy: "fingerprint",
}
```

**Why `fingerprint`:**

- Automatically computes a unique hash based on the actual app content (JS bundles, assets, native modules).
- Only OTA-incompatible changes (native code, Expo config plugins) trigger a new fingerprint.
- Pure JS changes — UI updates, business logic, bug fixes — reuse the same fingerprint, so OTA updates deliver instantly.
- Eliminates human error from manual version bumps.
- Expo SDK 56 fully supports fingerprint.

**Migration path:**

1. Set `runtimeVersion.policy` to `"fingerprint"` in `app.config.js`
2. Remove `EAS_SKIP_AUTO_FINGERPRINT=1` from `.env` — this flag **disables** fingerprint auto-detection, which defeats the purpose

**⚠️ IMPORTANT: Environment Variable Conflict Detected**

**ISSUE 9 (CRITICAL): `EAS_SKIP_AUTO_FINGERPRINT=1` is set in `.env`**

```env
EAS_SKIP_AUTO_FINGERPRINT=1
```

This environment variable tells EAS Build to **skip automatic fingerprint computation**. This means:

- If you switch to `fingerprint` policy, it will **not work correctly** because the auto-fingerprint is skipped.
- This was likely set to work around an earlier issue with `appVersion` policy.
- **Must be removed** when switching to fingerprint policy.

---

## 1.4 OTA Compatibility Matrix

### What OTA Updates Can Safely Change

| Change Type                         | OTA Safe? | Notes                                        |
| ----------------------------------- | --------- | -------------------------------------------- |
| React Native JS/TS code changes     | ✅ Yes    | Pure JS/TS changes are fully OTA-safe        |
| UI component changes (React Native) | ✅ Yes    | All React Native components are JS-rendered  |
| Business logic changes              | ✅ Yes    | API calls, state management, data processing |
| Asset changes (images, fonts)       | ✅ Yes    | `expo-asset` handles updates via OTA         |
| i18n / locale files                 | ✅ Yes    | JSON translation files are bundled in JS     |
| Navigation / routing changes        | ✅ Yes    | `expo-router` is JS-based                    |
| Custom hooks / utils                | ✅ Yes    | Pure JS changes                              |
| Styling / NativeWind changes        | ✅ Yes    | Tailwind/NativeWind compiles to JS styles    |

### What Requires a Native Rebuild

| Change Type                                 | Requires Rebuild   | Reason                                |
| ------------------------------------------- | ------------------ | ------------------------------------- |
| Native module version bump                  | ✅ Yes             | Requires new compiled binary          |
| `app.json` / `app.config.js` plugin changes | ✅ Yes             | Expo config plugins run at build time |
| Expo SDK version bump                       | ✅ Yes             | New native code                       |
| `react-native` version bump                 | ✅ Yes             | New native code                       |
| `@stripe/stripe-react-native` version       | ✅ **Potentially** | Contains native code; check changelog |
| Push notification entitlements              | ✅ Yes             | Requires rebuilt provisioning profile |
| Deep linking scheme changes                 | ✅ Yes             | Native manifest changes               |
| Bundle identifier / package name            | ✅ Yes             | Native manifest                       |
| Android `enableOnBackInvokedCallback`       | ✅ Yes             | Plugin-only, builds fine              |

---

## 1.5 Native Dependency Audit

| Package                                | Native Dependency       | OTA Safe                          | Requires Rebuild                       | Notes                                                |
| -------------------------------------- | ----------------------- | --------------------------------- | -------------------------------------- | ---------------------------------------------------- |
| `expo` ~56.0.9                         | ✅ Core native          | ⚠️ Patch-safe                     | Major/minor requires rebuild           | SDK 56 stable                                        |
| `expo-router` ~56.2.9                  | ✅ Native               | ✅ Yes                            | —                                      | JS-based routing                                     |
| `expo-updates` ~56.0.18                | ✅ Native               | ✅ Yes                            | —                                      | Core OTA engine                                      |
| `@stripe/stripe-react-native` 0.64.0   | ✅ SDK                  | ❌ **No**                         | ⚠️ **Version changes require rebuild** | Has native modules                                   |
| `@sentry/react-native` ~7.11.0         | ✅ Native bridge        | ⚠️ Patch-safe                     | Major/minor requires rebuild           | SDK 7 is stable                                      |
| `expo-notifications` ~56.0.16          | ✅ Native               | ⚠️ Config changes require rebuild | Entitlement changes need rebuild       |                                                      |
| `expo-image` ~56.0.10                  | ✅ Native               | ✅ Yes                            | —                                      |                                                      |
| `expo-video` ~56.1.2                   | ✅ Native               | ✅ Yes                            | —                                      |                                                      |
| `react-native-maps` 1.27.2             | ✅ Native               | ❌ **No**                         | ⚠️ Version changes require rebuild     | Native map SDK                                       |
| `react-native-reanimated` 4.3.1        | ✅ Native Worklets      | ⚠️ Patch-safe                     | Major/minor requires rebuild           |                                                      |
| `react-native-gesture-handler` ~2.31.1 | ✅ Native               | ⚠️ Patch-safe                     | Major/minor requires rebuild           |                                                      |
| `react-native-screens` 4.25.2          | ✅ Native               | ⚠️ Patch-safe                     | Major/minor requires rebuild           |                                                      |
| `react-native-webview` 13.16.1         | ✅ Native               | ⚠️ Patch-safe                     | Major/minor requires rebuild           |                                                      |
| `react-native-maps` 1.27.2             | ✅ Google Maps SDK      | ❌ **No**                         | ⚠️ Version changes require rebuild     |                                                      |
| `react-native-paper` ^5.15.0           | ❌ Pure JS              | ✅ Yes                            | —                                      | UI components                                        |
| `react-native-toast-message` ^2.3.3    | ❌ Pure JS              | ✅ Yes                            | —                                      |                                                      |
| `react-native-vector-icons` ^10.3.0    | ✅ Font files           | ✅ Yes                            | —                                      | Font assets bundled in JS                            |
| `lucide-react-native` ^0.575.0         | ❌ Pure JS              | ✅ Yes                            | —                                      | SVG icon library                                     |
| `nativewind` ^4.2.1                    | ❌ Pure JS              | ✅ Yes                            | —                                      | CSS → JS compiler                                    |
| `@tanstack/react-query` ^5.100.11      | ❌ Pure JS              | ✅ Yes                            | —                                      |                                                      |
| `axios` ^1.13.5                        | ❌ Pure JS              | ✅ Yes                            | —                                      |                                                      |
| `appwrite` ^22.4.0                     | ❌ Pure JS (Client SDK) | ✅ Yes                            | —                                      | Direct SDK calls deprecated; now proxied via backend |
| `posthog-react-native` ^4.45.14        | ✅ Native               | ⚠️ Patch-safe                     | Major/minor requires rebuild           |                                                      |
| `react-native-reanimated` 4.3.1        | ✅ Native Worklets      | ⚠️ Patch-safe                     | Major/minor requires rebuild           |                                                      |
| `expo-dev-client` ~56.0.19             | ✅ Native               | ❌ N/A                            | ⚠️ Changes require rebuild             | Development builds                                   |
| `expo-splash-screen` ~56.0.10          | ✅ Native               | ✅ Yes                            | Config changes via plugin              |                                                      |

### Payment SDK Risk Assessment

**Stripe (`@stripe/stripe-react-native` 0.64.0):**

- Contains native payment UI components
- **Version upgrades require a new native build**
- OTA is safe for non-SDK-version payment logic (e.g., backend integration, amount formatting)
- ⚠️ Payment screen UI is a mix of native (Stripe elements) and JS (custom UI)

**M-Pesa (via `mtn-momo` on backend):**

- No native SDK on mobile
- ✅ Fully OTA-safe (API-based)

**Flutterwave:**

- No native SDK on mobile
- ✅ OTA-safe (API-based)

**PayPal (`@paypal/checkout-server-sdk`):**

- Only on backend (`Backend/package.json`)
- ✅ OTA-safe

---

# Phase 2 — Channel & Branch Architecture Review

## 2.1 Current Channels

From `eas.json`:

| Channel       | Profile       | Description                     |
| ------------- | ------------- | ------------------------------- |
| `development` | `development` | Dev builds, Expo Go alternative |
| `preview`     | `preview`     | Internal preview builds         |
| `apk`         | `apk`         | Direct APK distribution         |
| `production`  | `production`  | Production store builds         |

## 2.2 Current Channel-to-Branch Mapping

There is **no defined mapping** between Git branches and EAS channels. Based on typical Expo projects:

| Git Branch          | EAS Channel   | Purpose                 |
| ------------------- | ------------- | ----------------------- |
| `develop` (assumed) | `development` | Developer testing       |
| `staging` (assumed) | `preview`     | QA/preview              |
| `main` (assumed)    | `production`  | Production user updates |

## 2.3 Issues Found

**ISSUE 10 (HIGH): No `staging` channel in `eas.json`**

There is a `preview` channel, but no `staging` channel. For a 13-person team, you need:

- `development` — developer builds
- `staging` — QA and testing updates
- `preview` — product/design review
- `production` — production users

Combining `preview` and `staging` into a single channel creates risk:

- QA might be testing against an update that's still in preview/review
- No separation between "needs review" and "waiting for QA"

**ISSUE 11 (MEDIUM): No branch protection per channel**

Without CI/CD enforcement:

- Anyone can publish to `preview` or even `production` from any branch
- Manual `eas update --branch production --channel production` can be run accidentally

## 2.4 Recommended Architecture

```
Git Branch          EAS Branch          EAS Channel     Environment
──────────          ──────────          ───────────     ───────────
feature/*           develop             development     Individual dev testing
develop             staging             staging         QA / automated tests
release/*           preview             preview         Product/design review
main                production          production      Production users
hotfix/*            production          production      Emergency fixes
```

### Implementation

**EAS Channel → Branch mapping:**

```
EAS Update: --branch develop  --channel development
EAS Update: --branch staging  --channel staging
EAS Update: --branch preview  --channel preview
EAS Update: --branch production --channel production
```

**Add `staging` profile to `eas.json`:**

```json
"staging": {
  "distribution": "internal",
  "channel": "staging",
  "android": { "buildType": "apk" }
}
```

---

# Phase 3 — Release Process Audit

## 3.1 Current Build Workflow

Based on the codebase analysis, there is **no defined or documented release process**. The current state implies:

### How production builds are created:

- Manual: `eas build --platform all --profile production`
- No CI/CD trigger for builds

### How updates are published:

- Manual: `eas update --branch production --channel production`
- No automated checks before publishing

### How updates are delivered:

- Expo's OTA infrastructure via `https://u.expo.dev/...`
- Users get updates on next app launch
- No staged rollout (Expo does not natively support gradual rollouts)

### How rollback would work:

- Currently **NOT documented or implemented**
- Would require manual CLI command: `eas update:rollback --branch production`
- No rollback playbook

## 3.2 Risks

| Risk                             | Severity     | Description                                                      |
| -------------------------------- | ------------ | ---------------------------------------------------------------- |
| Accidental production deployment | **Critical** | No CI gates, anyone with Expo access can publish to production   |
| Broken updates                   | **Critical** | No QA/staging gate before production                             |
| Runtime version mismatch         | **High**     | `appVersion` policy + manual version bumps = OTA doesn't deliver |
| Missing channels                 | **Medium**   | No `staging` channel                                             |
| No rollback plan                 | **High**     | If a bad OTA goes out, team will scramble                        |
| No update approval               | **Critical** | Developers can push directly to production branch                |
| No automated CI/CD               | **High**     | All manual — human error risk                                    |

---

# Phase 4 — Deployment Workflow Design

## 4.1 Ideal Developer Workflow for Nile Flow

```
┌──────────────┐
│   Developer  │   Creates feature branch (feature/otp-fix)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Pull Request │   Code review + CI checks run
│  → develop    │     Architecture enforcement (existing .github/workflows)
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Merge develop │   Auto-trigger: eas update --branch staging
└──────┬───────┘       (GitHub Actions)
       │
       ▼
┌──────────────┐
│ Staging OTA  │   QA team tests on staging channel
│   Release    │     Internal distribution build
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  QA Approval │   Manual approval gate in GitHub
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Merge → main │   Auto-trigger: eas update --branch production
└──────┬───────┘     + optional native rebuild if fingerprint changes
       │
       ▼
┌──────────────┐
│ Production   │   Users receive OTA update on next launch
│    OTA       │
└──────────────┘
```

## 4.2 Emergency Hotfix Workflow

For critical checkout/payment bugs:

```
┌──────────────┐
│ Developer    │   Branch from main: hotfix/critical-patch
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Fast-track   │   Bypass full staging (but at minimum 1 peer review)
│  Review      │     Label: HOTFIX
└──────┬───────┘
       │
       ▼
┌──────────────┐
│ Merge → main │   Force deploy:
│  & deploy    │     eas update --branch production --message "HOTFIX: ..."
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  Notify team │   #release channel: "Production hotfix 1.2.9 deployed — fix for checkout crash"
│              │     Rollback prepared if needed
└──────────────┘
```

**Hotfix guardrails:**

1. Must be from an approved hotfix branch
2. Must pass CI checks (architecture enforcement)
3. Must have at least 1 peer review
4. Must be deployed with `--message` flag documenting the change
5. Rollback command must be prepared in advance

## 4.3 Rollback Workflow

```bash
# Rollback production to previous update
eas update:rollback --branch production --channel production

# Verify rollback by deploying to a test device
eas update --branch recovery --channel preview --message "Rollback verification"

# Confirm users are back on stable version
```

**Rollback playbook:**

1. Identify the bad update (check Sentry, user reports)
2. Run `eas update:rollback` on the affected branch
3. Verify rollback on internal preview build
4. Notify the team via Slack/Teams
5. Investigate root cause
6. Deploy fix via hotfix workflow

## 4.4 Release Approval Process

| Role            | Feature | Staging    | Production        | Hotfix       |
| --------------- | ------- | ---------- | ----------------- | ------------ |
| Developer       | ✅ Own  | ✅ PR      | ❌                | ✅ PR        |
| QA Engineer     | ❌      | ✅ Approve | ❌                | ❌           |
| Product Manager | ❌      | ❌         | ✅ Sign-off       | ❌           |
| Founder/Lead    | ❌      | ❌         | ✅ Final sign-off | ✅ Exception |

**Release checklist for production:**

1. [ ] All CI checks pass
2. [ ] QA verified on staging channel
3. [ ] Product Manager approved
4. [ ] Founder/Lead signed off
5. [ ] Changelog documented
6. [ ] Rollback command prepared

---

# Phase 5 — Security & Governance Review

## 5.1 Secrets Management

| Secret                          | Location                                          | Risk                                 |
| ------------------------------- | ------------------------------------------------- | ------------------------------------ |
| Sentry DSN                      | `.env` ✅ (public-safe)                           | Low                                  |
| Sentry Auth Token               | `.env`                                            | ⚠️ **SHOULD NOT BE IN REPO**         |
| PostHog API Key                 | `.env` (public-safe)                              | Low                                  |
| Google Play service account key | `Mobileapp/nile-flow-app-3ad669df2cd0.json`       | ❌ **CRITICAL: COMMITTED TO REPO**   |
| Stripe live key                 | `Mobileapp/.env.js` (hardcoded as `pk_live_XXXX`) | ⚠️ Placeholder but dangerous pattern |
| Appwrite endpoint/project IDs   | `Mobileapp/appwrite.js` (public-safe)             | Low                                  |
| API URL                         | `app.config.js` (public)                          | Low                                  |

**ISSUE 12 (CRITICAL): Google Play service account private key is committed to the repository**

File: `Mobileapp/nile-flow-app-3ad669df2cd0.json`

This file contains:

- `private_key_id` → `3ad669df2cd0876b951aa88a86c2a68e44cf4690`
- `private_key` → Full PEM-encoded RSA private key
- `client_email` → `play-console-service-account@nile-flow-app.iam.gserviceaccount.com`
- `client_id` → `111941029948285031859`

**Impact:** Anyone with access to this repo can:

1. Upload/manage apps on Google Play Console
2. Access Play Console data
3. Publish APKs under your account

**The `.gitignore` already has an entry for this file:**

```
# Play Console service account key
nile-flow-app-3ad669df2cd0.json
```

**However, it was committed before the `.gitignore` was updated.** It must be:

1. **Immediately revoke** the key from Google Play Console
2. **Remove from Git history** using `git filter-branch` or BFG Repo-Cleaner
3. Add to `.gitignore` (already done)
4. Generate a new key
5. Store the new key securely (GitHub Secrets/1Password)

## 5.2 Access Control Recommendations

### Expo Account Permissions

- **Admin:** Founder/Lead Developer (1–2 people)
- **Developer:** Can create builds, view logs
- **Viewer:** QA team, read-only

### GitHub Permissions

- **main branch:** Write access limited to Lead + QA approval
- **develop branch:** All developers have write access
- **Require pull request** before merging to `main`
- **Require CI checks** (architecture enforcement) before merge

### Least Privilege Model

```
Role            Expo Access     GitHub Access     EAS Publish
─────────       ──────────      ────────────      ───────────
Founder         Admin           Maintain          ✅ Production
Lead Dev        Admin           Maintain          ✅ Production
Developer       Contributor     Write             ✅ Staging only
QA Engineer     Viewer          Triage            ❌ No publish
Product Manager Viewer          Read              ❌ No publish
```

### Secret Management Recommendations

1. **Never commit secrets to the repo** — use EAS Secrets (`eas secret:create`)
2. **Use GitHub Secrets** for CI/CD workflows
3. **Revoke the leaked Play Console key immediately**
4. **Store Stripe production keys** in EAS Secrets, not `.env.js`
5. **Run `git secrets` scanner** to prevent future leaks
6. **Add `.env` file to `.gitignore`** — it's currently NOT listed in `.gitignore` (only `.env*.local`)

---

# Phase 6 — CI/CD Recommendations

## 6.1 GitHub Actions — Required Workflows

The existing `enforce-architecture.yml` is excellent. It must be supplemented with:

### 1. Staging OTA Deploy Workflow

```yaml
# .github/workflows/deploy-staging.yml
name: Deploy Staging OTA

on:
  push:
    branches: [develop, staging]

jobs:
  deploy-staging:
    name: Deploy to Staging Channel
    runs-on: ubuntu-latest
    timeout-minutes: 10

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
          cache-dependency-path: Mobileapp/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: Mobileapp

      - name: Publish EAS Update to Staging
        run: |
          npx eas update --branch staging \
            --channel staging \
            --message "Staging deploy: ${{ github.sha }}" \
            --non-interactive
        working-directory: Mobileapp
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

### 2. Production OTA Deploy Workflow

```yaml
# .github/workflows/deploy-production.yml
name: Deploy Production OTA

on:
  push:
    branches: [main]
  workflow_dispatch:
    inputs:
      reason:
        description: "Reason for deployment"
        required: true
        default: "Scheduled release"

jobs:
  validate:
    name: Validate Production Readiness
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check Sentry release
        run: |
          VERSION=$(node -p "require('./Mobileapp/app.config.js')().expo.version")
          echo "Production version: $VERSION"
          echo "version=$VERSION" >> $GITHUB_OUTPUT
        id: version

  deploy-production:
    name: Deploy to Production Channel
    needs: [validate]
    runs-on: ubuntu-latest
    timeout-minutes: 10
    environment:
      name: production
      url: https://u.expo.dev/... # Update URL

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
          cache-dependency-path: Mobileapp/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: Mobileapp

      - name: Run architecture checks
        run: npx github:architecture-check
        # Or include enforce-architecture.yml as a required check

      - name: Publish EAS Update to Production
        run: |
          npx eas update --branch production \
            --channel production \
            --message "Production deploy: ${{ github.sha }}" \
            --non-interactive
        working-directory: Mobileapp
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: Notify team
        uses: slackapi/slack-github-action@v1
        with:
          payload: |
            {
              "text": "✅ Production OTA deployed from ${{ github.sha }}"
            }
        env:
          SLACK_WEBHOOK_URL: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

### 3. Production Build (Native Rebuild) Workflow

```yaml
# .github/workflows/build-production-native.yml
name: Build Production Native

on:
  workflow_dispatch:
    inputs:
      platform:
        description: "Platform to build (ios, android, all)"
        required: true
        default: "all"
      profile:
        description: "Build profile"
        required: true
        default: "production"

jobs:
  build:
    name: EAS Build ${{ github.event.inputs.platform }}
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: "npm"
          cache-dependency-path: Mobileapp/package-lock.json

      - name: Install dependencies
        run: npm ci
        working-directory: Mobileapp

      - name: EAS Build
        run: npx eas build --platform ${{ github.event.inputs.platform }} --profile ${{ github.event.inputs.profile }} --non-interactive
        working-directory: Mobileapp
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}

      - name: Submit to Store
        if: github.event.inputs.profile == 'production'
        run: npx eas submit --platform ${{ github.event.inputs.platform }} --profile production --non-interactive
        working-directory: Mobileapp
        env:
          EXPO_TOKEN: ${{ secrets.EXPO_TOKEN }}
```

---

# Phase 7 — Final Verdict & Score

## 7.1 OTA Readiness Score

| Category            | Score (/100) | Assessment                                                                         |
| ------------------- | ------------ | ---------------------------------------------------------------------------------- |
| **Configuration**   | **55**       | Missing critical `updates.*` configs, env var conflicts                            |
| **Reliability**     | **40**       | `appVersion` policy fragile, no staging channel, no rollback playbook              |
| **Scalability**     | **30**       | No CI/CD, no staged rollouts, no release automation                                |
| **Team Operations** | **25**       | No defined release workflow, no approval gates, 13 devs without process            |
| **Security**        | **45**       | **CRITICAL**: Play Console key committed to repo, secrets in `.env` not gitignored |

### Overall Score: **39 / 100**

**This is NOT production-ready for OTA updates.**

---

## 7.2 Executive Summary

### 1. Is Nile Flow fully OTA-ready?

**No.** The codebase has the foundation for OTA updates (`expo-updates`, correct `updates.url`) but is missing critical configuration, safe runtime version management, deployment workflow, CI/CD, and has a **critical security vulnerability** (leaked Play Console key).

### 2. What is missing?

| Priority        | Item                                                              | Phase    |
| --------------- | ----------------------------------------------------------------- | -------- |
| 🔴 **CRITICAL** | Google Play service account key leak                              | Security |
| 🔴 **CRITICAL** | `updates.enabled`, `checkAutomatically`, `fallbackToCacheTimeout` | Config   |
| 🔴 **HIGH**     | Switch from `appVersion` to `fingerprint` runtime version         | Config   |
| 🔴 **HIGH**     | Remove `EAS_SKIP_AUTO_FINGERPRINT=1`                              | Config   |
| 🟡 **HIGH**     | Add `staging` channel to `eas.json`                               | Channels |
| 🟡 **HIGH**     | GitHub Actions for staging/production deploy                      | CI/CD    |
| 🟡 **HIGH**     | Rollback playbook                                                 | Process  |
| 🟡 **MEDIUM**   | Release approval workflow (Dev → QA → PM → Founder)               | Process  |
| 🟡 **MEDIUM**   | Emergency hotfix workflow                                         | Process  |
| 🔵 **MEDIUM**   | Environment variable management (`.env` in `.gitignore`)          | Security |
| 🔵 **LOW**      | Platform-specific build configs in `eas.json`                     | Config   |

### 3. What risks exist?

1. **🔴 CRITICAL:** Anyone with repo access has Google Play Console publishing privileges (leaked key)
2. **🔴 HIGH:** OTA updates may not deliver due to `appVersion` policy drift
3. **🔴 HIGH:** Accidental production deployment (no CI gates)
4. **🟡 HIGH:** No rollback capability documented
5. **🟡 HIGH:** Broken OTA would reach all users — no staged rollout
6. **🟡 MEDIUM:** `.env` file not gitignored — secrets may be committed
7. **🟡 MEDIUM:** No QA gate between staging and production

### 4. What should be fixed immediately?

**Immediate (24 hours):**

1. **Revoke the Google Play service account key** in Google Play Console
2. **Remove the key file from Git history** (BFG Repo-Cleaner or `git filter-branch`)
3. **Add `nile-flow-app-3ad669df2cd0.json` to `.gitignore`** (already there — verify history removed)
4. **Add `.env` to `.gitignore`** (currently only `.env*.local` is ignored)

**This week:** 5. Add `updates.*` configuration to `app.config.js` 6. Switch to `fingerprint` runtime version policy 7. Remove `EAS_SKIP_AUTO_FINGERPRINT=1` from `.env` 8. Add `staging` channel to `eas.json` 9. Set up `EXPO_TOKEN` in GitHub Secrets 10. Create the CI/CD deploy workflows

**This sprint:** 11. Create defined release workflow 12. Document rollback playbook 13. Add release approval process 14. Train team on release process

### 5. What deployment workflow should the team adopt?

**Adopt the Phase 4 workflow described in this document:**

```
Developer → Feature Branch → PR → Code Review
    ↓
Merge to develop → Auto-deploy to staging channel → QA tests
    ↓
QA Approval → Merge to main → Auto-deploy to production channel
    ↓
Users receive OTA update on next app launch
```

**With these guardrails:**

- CI checks required before merge to `main`
- QA must approve before production deploy
- Hotfix bypass is documented and approved
- Rollback command is prepared before every production deploy
- Founder/Lead signs off on production releases

---

## Appendix A: Fix Checklist

| #   | Action                                            | File                 | Priority |
| --- | ------------------------------------------------- | -------------------- | -------- |
| 1   | Revoke Google Play key                            | Google Console       | 🔴       |
| 2   | Remove key from Git history                       | Git CLI              | 🔴       |
| 3   | Add `updates.enabled: true`                       | `app.config.js`      | 🔴       |
| 4   | Add `checkAutomatically: "ON_LOAD"`               | `app.config.js`      | 🟡       |
| 5   | Add `fallbackToCacheTimeout: 30000`               | `app.config.js`      | 🟡       |
| 6   | Change `runtimeVersion.policy` to `"fingerprint"` | `app.config.js`      | 🔴       |
| 7   | Remove `EAS_SKIP_AUTO_FINGERPRINT=1`              | `.env`               | 🔴       |
| 8   | Add `staging` profile                             | `eas.json`           | 🟡       |
| 9   | Add `staging` channel                             | `eas.json`           | 🟡       |
| 10  | Set `distribution: "store"` on production         | `eas.json`           | 🟢       |
| 11  | Create deploy-staging GitHub Action               | `.github/workflows/` | 🟡       |
| 12  | Create deploy-production GitHub Action            | `.github/workflows/` | 🟡       |
| 13  | Add `.env` to `.gitignore`                        | `.gitignore`         | 🟡       |
| 14  | Store secrets in EAS Secrets / GitHub Secrets     | Various              | 🔴       |
| 15  | Document rollback playbook                        | README               | 🟡       |
| 16  | Train team on release process                     | Team                 | 🟡       |

**Severity:**

- 🔴 = Critical — block production
- 🟡 = High — needed this sprint
- 🟢 = Medium/low — can wait

---

_Report generated by Senior Expo / React Native / DevOps Engineer_
_Nile Flow Production Audit — June 2026_
