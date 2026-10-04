# 0003. Mobile customer onboarding authentication

**Date**: 2026-10-05
**Status**: Proposed

## Summary

New and signed out customers must sign in or create an account before they can browse Nile Flow. Email accounts must verify their email, then customers without a saved pickup address must add one before entering the marketplace. Returning customers with a valid session go straight to the marketplace, and the Backend applies the same verification rule to every client.

## Context

> ⚠️ Premise note: Requiring both a verified email and a delivery address before browsing adds steps and can lower signup completion. You chose both as trust gates, so the first path needs clear recovery, while returning customers with a valid session should reach the marketplace directly.

The Mobileapp welcome screen currently offers marketplace browsing without sign in. Signup issues session credentials before email verification, the mobile verification screen reports success without calling the Backend, and the root layout does not guard protected routes. Password sign in does not check the Appwrite `isVerified` preference. The shared Backend middleware validates a token but does not check the customer verification status.

The existing stack already uses Appwrite for customer identity and records, Express routes, JWT sessions, cookies, Redis, Expo Router, and Website2 authentication. The active Website2 auth service treats a signup response containing a user as a session, so it must follow the shared verification response. The task stays focused on Mobileapp address onboarding; Website2 receives the shared verification and session behavior, not a new address screen.

## Requirements

**User stories**:

1. As a new customer, I want to sign up, verify my email, and save a pickup address so that I can enter the marketplace with a usable account.
2. As a returning customer, I want a valid session to resume quickly so that I do not repeat onboarding.
3. As a customer using Google or Facebook, I want to verify my email when the provider cannot confirm it so that my account is still protected.

**Acceptance criteria**:

1. **AC-1**: A customer without a valid session sees a welcome screen with separate Sign in and Create account actions. There is no guest or browse action.
2. **AC-2**: A valid session resumes to the marketplace home. A session check that fails because of a network problem keeps marketplace access locked, preserves the session, and offers Retry. Only a definitive invalid or revoked session returns the customer to the welcome screen.
3. **AC-3**: Direct navigation to a protected marketplace or account route is guarded. Sign in, sign up, password recovery, and legal pages remain accessible.
4. **AC-4**: Email signup creates a pending account and sends a six digit code that expires after 15 minutes. Signup does not set session cookies or return access or refresh tokens before verification.
5. **AC-5**: If account creation succeeds but email delivery fails, the pending account remains. The app explains that verification email delivery failed and routes the customer to the verification screen, where resend is available after the server enforced 60 second wait.
6. **AC-6**: Repeating signup for an existing pending account returns a verification required result and routes the customer to verification with resend. An existing verified account is directed to sign in.
7. **AC-7**: Successful code verification sets Appwrite user preference `isVerified` to true, mirrors that value to the customer profile, consumes the code, and only then issues a session. Invalid or expired codes leave the customer on verification with an error and no session.
8. **AC-8**: Password sign in issues a session only for verified customers. Correct credentials for a pending account return `EMAIL_NOT_VERIFIED` with a verification path. Incorrect credentials return the normal credentials error.
9. **AC-9**: Protected customer routes and refresh requests check the current Appwrite verification preference. Existing verified sessions continue to work. Existing unverified sessions cannot access customer routes or refresh into a new session.
10. **AC-10**: After Mobileapp authentication, a customer with an existing pickup address enters the marketplace. A customer without one sees a blocking address form with required street address, phone, city, and state, plus optional postal code. The customer cannot dismiss it, browse, or enter protected screens until the address saves.
11. **AC-11**: Address lookup or save failures keep marketplace access locked and show an actionable error with Retry. A successful save uses the authenticated customer as owner and routes to marketplace home.
12. **AC-12**: Google and Facebook sign in may bypass Nile Flow email verification only when the provider confirms the email. If the provider email is unverified or absent, the customer must verify an email before a session is issued. When no email is supplied, the app asks for one.
13. **AC-13**: A verified OAuth flow returns only a short lived, single use exchange code in the app link. The code expires after 60 seconds. The app exchanges it over HTTPS, stores the returned access and refresh tokens in Expo SecureStore without a mandatory biometric prompt, and never receives full tokens in a deep link.
14. **AC-14**: OAuth state is stored in Redis, bound to the provider and allowlisted app redirect, expires after 10 minutes, and can be used once. An expired or reused exchange code cannot create a session. A Redis outage fails the OAuth handoff closed with a visible retry path.
15. **AC-15**: The existing profile document stores at most one unique Google account ID and one unique Facebook account ID. OAuth account linking occurs only after the email is confirmed by the provider or verified by Nile Flow.
16. **AC-16**: Website2 signup and sign in follow the same Backend verification rule and keep its existing secure cookie session behavior. Website2 does not gain the Mobileapp pickup address screen in this feature.
17. **AC-17**: Canonical auth routes are available under `/api/v1/customerauth`. Existing `/api/customerauth` paths remain aliases to the same verification and authorization rules.
18. **AC-18**: Authentication failures remain subject to the existing limit of 10 failed requests per 15 minutes. Verification resend is separately limited to one send per email in each 60 second period, enforced by the Backend using the verification record `createdAt`.
19. **AC-19**: Mobile OAuth refresh sends the SecureStore refresh token over HTTPS to the existing refresh route and receives rotated tokens in the response. OAuth sign out revokes that refresh token on the Backend and clears both tokens from SecureStore only after revocation succeeds. If the device is offline or revocation fails, the session remains active and the app offers Retry rather than claiming sign out. Cookie based sessions keep their current refresh and logout behavior.

## Options considered

### Option 1: Keep the current browse first flow

Keep the welcome screen and existing auth behavior, then ask customers to sign in only when they reach an account or checkout action.

**Pros**:

1. Lowest immediate change to the Mobileapp.
2. Does not add signup steps before product discovery.

**Cons**:

1. Does not meet the chosen requirement that customers authenticate before browsing.
2. Leaves unverified accounts with sessions and protected API access.
3. Does not repair the nonfunctional mobile verification step.

### Option 2: Add a client only gate

Change the Mobileapp screens and navigation while leaving Backend session issuance and protected route checks unchanged.

**Pros**:

1. Fastest visual change.
2. Avoids changes to Website2 and shared API behavior.

**Cons**:

1. A modified client or direct API call bypasses the gate.
2. Existing sessions and older clients remain able to use unverified accounts.
3. Website2 and Mobileapp can disagree about verification.

### Option 3: Enforce verification in the shared Backend and align the clients

Use Appwrite verification state as the authority, guard Mobileapp routes, and update Website2 to follow the same account and session responses. Keep legacy API paths as aliases while adding versioned paths.

**Pros**:

1. The same verification rule applies to every customer API request and client.
2. Verified customers keep their existing sessions, while unverified sessions are blocked.
3. The Mobileapp can support secure OAuth token handoff without putting bearer tokens in a deep link.

**Cons**:

1. Protected customer requests need a current verification check, which adds Backend work and some latency.
2. OAuth requires production Redis and adds a secure token exchange path.
3. New account and address gates add steps for customers and require coordinated client releases.

## Decision

**Chosen option**: Option 3: Enforce verification in the shared Backend and align the clients.

The Backend is authoritative for verification and session access. The Mobileapp uses email and password sessions through the existing HTTP only cookie pattern, and stores OAuth tokens in Expo SecureStore after a one time code exchange. Website2 keeps its existing cookie session behavior and adopts the same verification responses.

**Implementation skills**: `expo-overview` (`expo/skills`, `.agents/skills/expo-overview/`) · `expo-router` (`expo/skills`, `.agents/skills/expo-router/`) · `expo-native-ui` (`expo/skills`, `.agents/skills/expo-native-ui/`)

## Rationale

The current code shows that a screen only gate would be bypassable: signup creates cookies and tokens before verification, password sign in skips the verification preference, and shared middleware accepts any valid token. Enforcing the preference in the Backend closes that gap without replacing Appwrite or the existing customer identity model.

Keeping verified sessions avoids logging out every existing customer. Versioned routes plus legacy aliases allow clients to move without creating a second set of authentication rules. Expo SecureStore protects OAuth credentials at rest, while a one time code avoids exposing full tokens in an app link.

## Feature design

**Data model sketch**:

| Entity | Key fields | Relationship and rules |
|---|---|---|
| Appwrite auth user | `$id`, email, password managed by Appwrite, `prefs.isVerified` | Existing account. `prefs.isVerified` is the canonical verification value. |
| Customer profile | `$id` equal to auth user `$id`, email, username, phone, `isVerified`, nullable `googleSubject`, nullable `facebookSubject` | One to one with the auth user. Profile mirrors verification. Each provider subject is unique and links at most one account per provider. |
| Verification record | `$id`, email, code, `createdAt` | Existing Appwrite record. One active code per email, valid for 15 minutes. The resend wait is calculated from `createdAt`. |
| Pickup address | `$id`, `user`, `type`, address, phone, city, state, `zipCode` | Existing Appwrite address record. The Mobileapp reads and writes the authenticated customer's pickup address. |
| Refresh token record | `$id`, `userId`, hashed refresh token, expiry, revoked state, device ID | Existing Appwrite record. A customer can have multiple device sessions. |
| OAuth state | Redis key with provider and allowlisted redirect URI | Temporary record, consumed once by the callback, expires after 10 minutes. |
| OAuth pending handoff | Redis key with provider, provider subject, provider profile details, and any provider email | Temporary record for email verification. It expires after 15 minutes and is consumed when verification succeeds. |
| OAuth exchange code | Redis key containing a hash of the random code, user ID, and provider | Temporary record, atomically consumed once, expires after 60 seconds. The app supplies `deviceId` during exchange. No permanent Appwrite entity is added for OAuth handoff. |

**State transitions**:

| Current state | Event | Next state |
|---|---|---|
| No session | Valid existing session check | Authenticated, then address check |
| No session | No valid session | Welcome |
| Session check pending | Network failure | Locked with Retry |
| Signup submitted | Account and email send succeed | Pending email verification |
| Signup submitted | Account created, email send fails | Pending verification with resend recovery |
| Pending email verification | Valid code | Verified session |
| Pending email verification | Invalid or expired code | Pending verification with error |
| Verified session | Pickup address exists | Marketplace |
| Verified session | Pickup address missing | Blocking address form |
| Blocking address form | Save succeeds | Marketplace |
| OAuth callback | Provider confirms email | One time exchange code |
| OAuth callback | Provider does not confirm email | Pending OAuth verification |
| Pending OAuth verification | Email verified | One time exchange code |
| One time exchange code | First valid exchange within 60 seconds | OAuth session |
| One time exchange code | Expired or already consumed | Sign in retry |

**API surface**:

All canonical routes use `/api/v1/customerauth`. The existing `/api/customerauth` routes remain aliases. The canonical and alias routes apply identical verification checks. Errors use the shared structured response with a stable code and message. Existing top level user fields remain where needed for current clients.

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/signup/customer` | POST | `email`, `password`, `username`, optional `phone`, `deviceId` | Pending verification state, user identity, code expiry, resend wait; no session credentials | Public | 400 invalid fields, 409 verified account exists, pending account result includes `verificationRequired`, 503 email delivery failed while preserving the account |
| `/signin/customer` | POST | `email`, `password`, optional `deviceId` | Verified customer profile and HTTP only session cookies | Public | 401 invalid credentials, 403 `EMAIL_NOT_VERIFIED` with a verification path, 429 rate limited |
| `/verify` and `/verify-customer` | POST | `email`, `verificationCode`, optional `deviceId` | Verified customer profile and HTTP only session cookies | Public | 400 invalid or expired code, 429 rate limited, 503 verification storage or update failure |
| `/resend-code` | POST | `email` | Generic resend result and `resendAfterSeconds` | Public | 400 missing email, 429 wait or rate limit, 503 delivery failure |
| `/getCustomerProfile` | GET | None | Customer profile and current verification state | Customer session | 401 invalid session, 403 unverified customer, 503 status lookup unavailable |
| `/refresh` | POST | Cookie refresh token or native `refreshToken` and `deviceId` | Rotated cookies for cookie sessions, or rotated access and refresh tokens for native OAuth sessions | Refresh cookie or refresh token in HTTPS body | 401 invalid or revoked session, 403 unverified customer, 503 status lookup unavailable |
| `/logoutCustomer` | POST | Cookie session or native `refreshToken` | Revoked refresh session and cleared cookies when present | Customer access token or cookie session | 401 invalid session, 503 revocation unavailable |
| `/oauth/google` and `/oauth/facebook` | GET | Allowlisted app `redirect_uri` for mobile | Provider `authUrl` with protected state | Public | 400 unsupported redirect, 503 provider configuration unavailable |
| `/oauth/{provider}/callback` | GET | Provider `code`, Redis backed `state` | Redirect to the allowlisted app URI with an exchange code, or `pendingId`, `emailRequired`, and optional `maskedEmail` | Public provider callback | 400 invalid state or provider response, 503 Redis or provider unavailable |
| `/oauth/verification/start` | POST | `pendingId`, optional email when provider supplied none | Verification pending state, `emailRequired`, `maskedEmail`, code expiry, and resend wait | Public, protected by short lived pending ID | 400 invalid pending handoff, 429 wait or rate limit, 503 email delivery failure |
| `/oauth/verification/complete` | POST | `pendingId`, email, `verificationCode`, `deviceId` | One time exchange code after verification | Public, protected by short lived pending ID | 400 invalid or expired code, 409 provider identity already linked, 429 rate limited |
| `/oauth/exchange` | POST | `code`, `deviceId` | Access token, refresh token, and sanitized user profile | Public, protected by one time code | 401 invalid, expired, or reused code, 503 Redis unavailable |
| `/pickup-address` | GET | None | Current pickup address | Verified customer session | 401 invalid session, 403 unverified customer, 404 no pickup address, 503 lookup failure |
| `/pickup-address` | POST | `address`, `phone`, `city`, `state`, optional `postalCode` | Saved address | Verified customer session | 400 invalid fields, 401 invalid session, 403 unverified customer, 503 save failure |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Decide the startup destination | Valid session, no session, or retry state | `/getCustomerProfile` and `/refresh` response; network errors remain distinct from authentication errors |
| Display verification instructions | Email, code expiry, resend wait | Signup input and the existing verification record `createdAt`; expiry is 15 minutes and resend wait is 60 seconds |
| Decide if a customer is verified | Verification result | Appwrite user preference `prefs.isVerified`; profile `isVerified` is a mirror |
| Create an email session | Access and refresh session | Backend token service after `prefs.isVerified` and profile mirror are updated |
| Rotate or revoke a native OAuth session | New tokens or signed out state | SecureStore refresh token, authenticated user ID, and existing Appwrite refresh token record |
| Display the address form | Existing address fields or missing address | Authenticated `GET /pickup-address`; 404 means the address form is required |
| Save an address | Address values and owner | Form input; owner comes from the authenticated session, never a client supplied user ID |
| Decide OAuth verification | Provider, provider subject, provider email, email verification claim | Google or Facebook provider response |
| Decide if the app asks for an email | `emailRequired` and optional masked email | Provider email claim stored in the pending handoff |
| Verify an OAuth account without a confirmed email | Email and code result | Email supplied by the customer or returned by the provider, plus the existing verification code record |
| Create an OAuth session | Access token, refresh token, and user profile | One time exchange code stored in Redis, `deviceId` supplied to the exchange endpoint, and the existing Backend token service |
| Validate an OAuth callback | State, provider, and app redirect destination | One time Redis state record, a 10 minute expiry, and the app's registered `nileflowapp://oauth/callback` URI |
| Resume Website2 | User and session status | Existing cookie session and shared Backend profile endpoint |

**Key invariants**:

1. A customer session is never issued or refreshed unless Appwrite `prefs.isVerified` is true.
2. The profile mirror is updated before a verification code is consumed and before a session is issued. A failed mirror update returns an error and can be retried.
3. Verification codes are valid for 15 minutes. Resend waits 60 seconds from the server stored `createdAt`.
4. OAuth state expires after 10 minutes and can be consumed once. OAuth pending handoffs expire after 15 minutes. OAuth exchange codes expire after 60 seconds and can succeed only once.
5. Full access and refresh tokens never appear in a deep link, log, or analytics event.
6. Production OAuth handoff requires shared Redis. The in memory Redis fallback is not accepted for OAuth state, pending handoffs, or exchange codes.
7. A customer's address owner is derived from the verified session. Client supplied owner IDs are ignored.
8. Native refresh tokens are rotated and revoked through the existing refresh and logout routes. The presented token must belong to the authenticated user and device.
9. User sign out clears the session and OAuth tokens from SecureStore. Existing push token sign out handling remains intact.

**Security model**:

Signup, sign in, verification, resend, OAuth start, and OAuth verification are public endpoints with input validation, rate limits, and generic responses where account existence could be exposed. Customer profile and address operations require a valid customer session and use the authenticated user ID for ownership checks. Every customer protected route and refresh request checks Appwrite verification state, including legacy route aliases and sessions issued before this change. Native refresh and logout requests must not log the supplied refresh token.

Email and password sessions use the existing HTTP only, secure cookie pattern. Website2 keeps that pattern. Mobile OAuth uses a high entropy one time exchange code, a server validated OAuth state, an allowlist for redirect destinations, and Expo SecureStore for returned tokens. Logs must omit passwords, verification codes, access tokens, refresh tokens, and provider credentials. MFA is not part of this feature.

**Configuration required**:

1. `REDIS_URL`: existing Backend setting, required in production for OAuth state, pending handoffs, and one time exchange codes.
2. Existing Google and Facebook credentials and callback URLs remain required for their provider flows.
3. Add `expo-secure-store` using the version matched to the installed Expo SDK.

**Critical test scenarios**:

1. Happy path: email signup, valid code, no saved address, address save, marketplace entry, verifies **AC-4**, **AC-7**, **AC-10**, and **AC-11**.
2. Session restore: valid customer enters home; a network failure stays locked with Retry; an invalid session returns to welcome, verifies **AC-2**.
3. Route access: unauthenticated and unverified customers cannot enter protected routes or call protected customer APIs, verifies **AC-3** and **AC-9**.
4. Verification errors: wrong code, expired code, resend too early, and email delivery failure preserve the pending account and never issue a session, verifies **AC-5**, **AC-6**, and **AC-18**.
5. Existing session: a verified customer retains access, while an unverified legacy session cannot refresh or use customer routes, verifies **AC-9**.
6. OAuth success: a verified provider email yields a one time code, exchange stores tokens in SecureStore, refresh rotates the tokens, logout revokes the session, and state or code replay fails, verifies **AC-12**, **AC-13**, **AC-14**, **AC-15**, and **AC-19**.
7. OAuth logout: a failed revocation leaves tokens and signed in state intact, shows an error, and allows retry, verifies **AC-19**.
8. OAuth verification: an unverified or absent provider email stays locked until email verification succeeds; repeated or expired pending handoffs fail, verifies **AC-12**, **AC-14**, and **AC-15**.
9. Website2: signup remains unauthenticated until verification, verified sign in keeps cookie behavior, and unverified requests are denied, verifies **AC-9** and **AC-16**.
10. Compatibility: versioned routes and legacy aliases return equivalent decisions and authorization outcomes, verifies **AC-17**.

## Build plan

The shared scope uses a Tracer Bullet approach. First prove the complete email signup, verification, address, and marketplace path through Mobileapp and Backend. Then add protected route enforcement and compatibility, extend the path to OAuth, and align Website2.

1. Add versioned customer auth routes and keep existing paths as aliases. Add Backend verification checks to signup, sign in, refresh, and customer authorization. Preserve verified sessions and deny unverified sessions. Add focused Backend tests, satisfies **AC-4**, **AC-7**, **AC-8**, **AC-9**, **AC-17**, **AC-18**, and **AC-19**.
2. Wire the Mobileapp signup and verification screens to the Backend. Keep pending accounts on email delivery failure, implement resend timing and errors, add startup session restoration and protected route guards, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, and **AC-7**.
3. Complete the Mobileapp address gate with the existing pickup address endpoints, owner checked saves, retry states, and the confirmed brand assets and light design, satisfies **AC-10** and **AC-11**.
4. Add nullable provider subject fields and unique indexes to the existing profile document. Implement provider verified email checks, one time Redis OAuth state, temporary Redis pending handoffs, verification start and completion, and atomic single use code exchange. Add SecureStore, native token rotation and revocation, and remove OAuth tokens from AsyncStorage and deep links, satisfies **AC-12**, **AC-13**, **AC-14**, **AC-15**, and **AC-19**.
5. Update Website2's active auth service and screens to honor pending verification and the shared cookie session responses. Keep the address gate Mobileapp only, satisfies **AC-16**.
6. Run the acceptance scenarios across mobile, Backend, and Website2. Confirm legacy aliases enforce the same rules and verify production Redis readiness before enabling the OAuth app handoff, satisfies **AC-1** through **AC-19**.

## Consequences

**Positive**:

1. Customers cannot use an unverified account to enter protected marketplace or account APIs.
2. Returning verified customers keep their sessions and avoid repeating onboarding.
3. Pending accounts can recover from email delivery failures without registering again.
4. The address owner and OAuth identity links are resolved from trusted session or provider data.

**Negative and tradeoffs**:

1. Email and address requirements add friction before product discovery.
2. Checking current verification state on customer routes adds Backend reads and makes Appwrite status availability part of authenticated request availability.
3. OAuth sign in depends on shared Redis in production and requires an additional exchange request.
4. Expo SecureStore adds a native dependency that must be installed for the current Expo SDK and included in development and store builds.

**Neutral**:

1. Existing auth routes remain during migration, but they no longer bypass verification.
2. The profile schema gains two optional provider identity fields.
3. MFA remains outside this feature.

## Follow-up

1. [ ] Enroll Mobile customer onboarding authentication in the shared scope before implementation. No matching scope feature currently exists.
2. [ ] Add `expo-overview`, `expo-router`, and `expo-native-ui` to a `Mobileapp/AGENTS.md` Agent skills section. The root guidance should link to that area guide during `/sync`.
3. [ ] Add the Expo MCP Server to `Mobileapp/AGENTS.md` after you connect it in your local MCP settings. It can provide current Expo documentation during the build.
4. [ ] Design MFA separately. It was explicitly left outside this onboarding decision.

## Migration plan

**Strategy**: Additive schema migration with a coordinated cutover and legacy route aliases.

**Phases**:

1. Add the optional provider identity fields and unique indexes to the existing Appwrite profile collection. Confirm production `REDIS_URL` is available before enabling OAuth handoffs.
2. Deploy Backend verification enforcement on versioned routes and legacy aliases. Verify that current verified sessions continue to work and unverified sessions cannot refresh or use customer APIs.
3. Release the Mobileapp and Website2 auth changes. Monitor signup, verification, resend, address completion, OAuth exchange failures, and protected route denials.
4. Retire legacy route aliases only in a later, separately planned API change.

**Rollback**: Revert a failing client release if needed, while retaining Backend verification enforcement. If OAuth exchange fails, roll back the OAuth client changes and keep email and password sign in available. Do not roll back to a Backend state that grants unverified sessions.

**Risks**: Older app versions may display local signed in state until their next protected API request fails. Appwrite verification reads can add latency or block customer requests during an Appwrite outage. A missing or unhealthy production Redis service prevents OAuth handoffs, which must fail closed rather than use process local memory.
