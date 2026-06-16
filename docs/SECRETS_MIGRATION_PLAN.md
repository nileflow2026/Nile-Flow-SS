# NILE FLOW — SECRETS MIGRATION PLAN

**Date:** June 9, 2026
**Status:** Action Required

---

## 1. CURRENT SECRET EXPOSURE

| Secret                        | Current Location                               | Risk                             | Should Be In        |
| ----------------------------- | ---------------------------------------------- | -------------------------------- | ------------------- |
| Sentry DSN (public-safe)      | `Mobileapp/.env`                               | 🟢 Low — DSN is safe to expose   | EAS Secrets         |
| Sentry Auth Token             | `Mobileapp/.env`                               | 🔴 HIGH — Full Sentry org access | GitHub Secrets only |
| PostHog API Key (public-safe) | `Mobileapp/.env`                               | 🟢 Low — client-side key         | EAS Secrets         |
| PostHog Host                  | `Mobileapp/.env`                               | 🟢 Low                           | EAS Secrets         |
| EAS Build Skip Fingerprint    | `Mobileapp/.env`                               | 🟢 Low — build flag              | Remove entirely     |
| API Base URL (public)         | `Mobileapp/.env` + `app.config.js`             | 🟢 Low — public URL              | EAS Secrets         |
| Google Maps API Key           | `Mobileapp/utils/geocoding.js` (was hardcoded) | 🟡 MEDIUM — NOW REMOVED          | EAS Secrets ✅      |
| OpenAI API Key                | `Mobileapp/utils/ai.js` (was hardcoded)        | 🟡 MEDIUM — NOW REMOVED          | Backend env only    |
| Stripe Publishable Key        | `Mobileapp/.env.js` (placeholder)              | 🟢 Low — placeholder, public key | EAS Secrets         |
| Flutterwave Public Key        | `Mobileapp/config/config.js`                   | 🟢 Low — public key              | EAS Secrets         |
| Google Play Service Key       | `Mobileapp/*.json`                             | 🔴 CRITICAL — NOW GITIGNORED     | GitHub Secrets      |
| Appwrite Endpoints            | `Mobileapp/appwrite.js`                        | 🟢 Low — public                  | Code (public-safe)  |
| Sentry Org/Project            | `Mobileapp/app.config.js`                      | 🟢 Low — config metadata         | Code (public-safe)  |

---

## 2. MIGRATION DESTINATIONS

### EAS Secrets (for mobile app builds)

Used during `eas build` and injected via `app.config.js` into `Constants.expoConfig.extra`.

```bash
# Set each secret
eas secret:create --scope project --name SENTRY_DSN --value "https://..."
eas secret:create --scope project --name EXPO_PUBLIC_POSTHOG_API_KEY --value "phc_..."
eas secret:create --scope project --name EXPO_PUBLIC_POSTHOG_HOST --value "https://..."
eas secret:create --scope project --name STRIPE_PUBLISH_KEY --value "pk_live_..."
eas secret:create --scope project --name FLW_PUBLIC_KEY --value "FLWPUBK-..."
eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "AIza..."
eas secret:create --scope project --name API_BASE_URL --value "https://..."

# For production builds only
eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "sntrys_..."
```

### GitHub Secrets (for CI/CD workflows)

```bash
# Go to: https://github.com/nileflow2026/NileFlow/settings/secrets/actions
# Add:
#   EXPO_TOKEN — from https://expo.dev/settings/access-tokens
#   SLACK_WEBHOOK — for deployment notifications (optional)
#   EAS_BUILD_GOOGLE_SERVICE_ACCOUNT_KEY — new Play Console key JSON
```

### Backend Environment Variables (Render/Appwrite)

Already handled in `Backend/.env` — ensure this is NOT committed:

- `SENTRY_DSN`
- `STRIPE_SECRET_KEY`
- `JWT_SECRET`
- `APPWRITE_API_KEY`
- `OPENAI_API_KEY`
- `RESEND_API_KEY`

---

## 3. MIGRATION STEPS

### Step 1: Clean up local `.env` file

Remove secrets from `Mobileapp/.env`:

```env
# REMOVE these lines from .env:
SENTERY_AUTH_TOKEN=sntrys_...
EAS_SKIP_AUTO_FINGERPRINT=1

# KEEP these (public-safe or needed locally):
SENTRY_DSN=https://...
EXPO_PUBLIC_POSTHOG_API_KEY=phc_...
EXPO_PUBLIC_POSTHOG_HOST=https://...
API_BASE_URL=https://...
```

### Step 2: Set EAS Secrets for all build-time values

```bash
npx eas secret:create --scope project --name SENTRY_DSN --value "https://913978e2e014e234568fdfd4ffc3b3e2@o4510430501666816.ingest.us.sentry.io/4511411561037824"
npx eas secret:create --scope project --name EXPO_PUBLIC_POSTHOG_API_KEY --value "phc_kD8phHiMUQsZmBTzVTdxqHjasGnq5i9ZmVqgJDbXXreb"
npx eas secret:create --scope project --name EXPO_PUBLIC_POSTHOG_HOST --value "https://us.i.posthog.com"
npx eas secret:create --scope project --name API_BASE_URL --value "https://nile-flow-backend.onrender.com"
npx eas secret:create --scope project --name GOOGLE_MAPS_API_KEY --value "<new-key>"
npx eas secret:create --scope project --name STRIPE_PUBLISH_KEY --value "pk_live_..."
npx eas secret:create --scope project --name FLW_PUBLIC_KEY --value "FLWPUBK-..."
npx eas secret:create --scope project --name PAYPAL_CLIENT_ID --value "..."
# Only for production builds:
npx eas secret:create --scope project --name SENTRY_AUTH_TOKEN --value "sntrys_..."
```

### Step 3: Verify EAS Secrets are loaded

After setting secrets, run:

```bash
npx eas build:version:get
```

Or create a test build:

```bash
npx eas build --platform android --profile preview --non-interactive
```

### Step 4: Set GitHub Secrets for CI/CD

1. Go to: `https://github.com/nileflow2026/NileFlow/settings/secrets/actions`
2. Add:
   - `EXPO_TOKEN` (from Expo dashboard)
   - `SLACK_WEBHOOK` (optional, for deployment notifications)

### Step 5: Remove hardcoded secrets from code

| File                           | Status    | Action                                                                     |
| ------------------------------ | --------- | -------------------------------------------------------------------------- |
| `Mobileapp/utils/ai.js`        | ✅ DONE   | OpenAI key removed, now proxies through backend                            |
| `Mobileapp/utils/geocoding.js` | ✅ DONE   | Maps key now loaded via Constants                                          |
| `Mobileapp/.env.js`            | 🟡 UPDATE | Replace `STRIPE_KEY: "pk_live_XXXX"` with `process.env.STRIPE_PUBLISH_KEY` |
| `Mobileapp/config/config.js`   | 🟡 UPDATE | Ensure all keys use `Constants.expoConfig?.extra?.` pattern                |

---

## 4. SECRET ROTATION POLICY

| Secret                          | Rotation Cadence | Responsible   |
| ------------------------------- | ---------------- | ------------- |
| Google Play Service Account Key | Every 6 months   | Lead Engineer |
| Stripe API Keys                 | Every 12 months  | Lead Engineer |
| Sentry Auth Token               | Every 6 months   | Any Engineer  |
| Expo Access Token               | Every 6 months   | Lead Engineer |
| API Keys (Maps, etc.)           | Every 12 months  | Any Engineer  |
| Appwrite API Key                | Every 6 months   | Lead Engineer |
| JWT Secret                      | Every 3 months   | Lead Engineer |
| OpenAI API Key                  | Every 12 months  | Any Engineer  |

---

## 5. EMERGENCY REVOCATION PROCEDURE

If a secret is suspected compromised:

1. **Immediately revoke** the key at the provider (Google Console, Stripe Dashboard, etc.)
2. **Generate new key** immediately
3. **Update** EAS Secrets / GitHub Secrets
4. **Trigger a rebuild** of affected build profiles
5. **Notify team** via #security Slack channel
6. **Document** in incident log

---

## 6. VERIFICATION CHECKLIST

- [ ] All EAS Secrets set
- [ ] All GitHub Secrets set
- [ ] `Mobileapp/.env` cleaned of sensitive values
- [ ] `Mobileapp/.env.js` updated to use env vars
- [ ] Hardcoded keys removed from source code
- [ ] `Mobileapp/config/config.js` verified
- [ ] Gitleaks workflow running on every PR
- [ ] Team trained on secret management
