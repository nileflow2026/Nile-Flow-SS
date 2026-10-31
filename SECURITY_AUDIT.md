# Nile Flow Backend Security Audit

**Assessment date:** 2026-10-31

**Scope:** The initial assessment was a read-only repository review of the Node.js/Express backend and configuration files relevant to its API, Appwrite integration, authentication, payment callbacks, and checked-in client environment files. Follow-up source remediations are recorded separately below. Appwrite MCP was also used to list database metadata in the Nile Flow project; no collection ACLs, documents, customer records, production logs, or application endpoints were queried. The project's production status was not established. No credential values or PII are reproduced below.

## 1. Executive Summary

**Risk at initial audit: CRITICAL source-level exposure.** Repository evidence confirmed routes that could issue an admin identity publicly or let a low-privilege authenticated caller access other users' data. This establishes serious source-level vulnerabilities, but does **not** establish that the affected revision was deployed, that any request exploited it, or that a breach occurred. Production deployment state, Appwrite ACLs, and service logs were not accessed.

**Current worktree status:** NF-01 through NF-07 have source-level remediations and regression coverage for the affected authorization paths. NF-10 has been removed from Git's index, but credential validity, rotation, and history cleanup remain owner actions. NF-11 is partially remediated: callback-body logging was removed, but durable idempotency and provider-side payment verification remain unresolved. NF-18's public collection-permission defaults have been removed from setup code; existing Appwrite collection ACLs remain unverified. NF-08, NF-09, NF-12, NF-14, NF-16 (auditability), and NF-17 remain open or partial. None of the source changes have been deployed or verified against production.

The source paths made user and customer records potentially retrievable without a legitimate admin authorization decision. The code does **not** prove how many documents were returned, what was deployed at incident time, whether any access occurred, or whether the reported user collection was fetched through the API or directly from Appwrite. A permissive Appwrite collection ACL or exposed server key remains a plausible additional path and must be checked in the production Appwrite console and access logs.

**Highest remaining risks**

1. Password reset codes/tokens remain plaintext in user documents and the public reset flow lacks explicit attempt/issuance limits.
2. The M-Pesa callback still needs authenticated provider verification, amount/currency matching, and durable idempotency.
3. Live Appwrite collection/document ACLs, API-key scopes, deployment revision, and access logs remain unverified.
4. The Sentry-auth-token-named value was removed from the Git index, but provider revocation and Git-history cleanup are not verified.
5. Administrative user exports still lack a dedicated export audit trail; the public health endpoint still exposes unnecessary user-count metadata.

**Breach determination:** UNKNOWN. The audit found exploit-relevant source paths but did not inspect production logs, deployments, Appwrite ACLs, or affected records. There is no evidence in this repository review that confirms or disproves exploitation.

**Scope limitation:** The backend contains approximately 60 route modules and hundreds of route declarations. This review mapped all top-level mounts and investigated the incident-critical routes and selected auth/payment flows in depth; it did not manually trace every unrelated product, social, rider, vendor, loyalty, and operational handler. The endpoint inventory below is complete for the incident-critical paths and identifies the mounted route modules, but is not a line-by-line authorization ledger for every route in the application.

## 2. Incident Attack Path Reconstruction

The paths below reconstruct the vulnerable source observed during the audit. NF-01 was removed from the current worktree afterward, but a deployment that still runs the earlier code remains exposed.

### Rank 1 — Anonymous admin signup, then raw user/customer APIs (most probable code-supported path)

1. An unauthenticated caller sends a valid email, username, and password to `POST /api/admin/auth/signup/admin`. The route itself has no authentication or invitation middleware (`Backend/routes/authRoutes.js:12`). The router is mounted with `authLimiter`, but the limiter skips successful requests; this does not impose a useful cap on repeated successful admin registrations (`Backend/src/index.js:688-695`; `Backend/middleware/rate-limiter.js:4-12`).
2. Signup creates an Appwrite user and profile with `role: "admin"`, writes that role to user preferences, and signs an access token containing the admin role (`Backend/controllers/AdminControllers/authController.js:293-356`).
3. The caller uses the returned token/cookie against `/api/admin/users`. The admin router checks the token role, but the issued token already satisfies that check (`Backend/routes/adminRouter.js:57,125`; `Backend/middleware/auth.js:3-7`). The handler returns the raw `APPWRITE_USER_COLLECTION_ID` documents, without a projection, field allowlist, or explicit pagination (`Backend/controllers/AdminControllers/userController.js:34-40`).
4. The same token can call `/api/admin/customers`. That router checks authentication only, and the handler aggregates up to 1,000 order records into customer names, email addresses, spending, loyalty estimates, and order dates (`Backend/routes/Vendorroutes/customerRoutes.js:10-14`; `Backend/controllers/VendorControllers/customerController.js:5-11,49-58,80-100`).

**Limits of this reconstruction:** `getUsers` supplies no pagination query. Appwrite's actual default page behavior and the deployed dataset size determine whether that endpoint alone could return the entire collection. The customer endpoint requests up to 1,000 orders per call. Neither observation establishes that every record reported in the incident was retrieved through these exact handlers.

### Rank 2 — Any customer account reads users and customer data

1. A caller obtains an ordinary authenticated token (for example, through the public customer signup/signin flow).
2. The caller calls `GET /api/users`; it has token authentication but no admin/role or ownership check (`Backend/routes/userRoutes.js:32`). The controller returns raw user collection documents (`Backend/controllers/AdminControllers/userController.js:34-40`). The same router is mounted at `/api`, `/api/users`, and `/api/audit-logs`, creating aliases (`Backend/src/index.js:717,746-747`).
3. The caller uses the same token against `/api/admin/customers` and arbitrary `/api/admin/customers/:customerId` paths. The endpoint performs no role/tenant/ownership check and returns customer/order information (`Backend/routes/Vendorroutes/customerRoutes.js:10-14`; `Backend/controllers/VendorControllers/customerController.js:132-140,223-236`).

### Rank 3 — Authenticated privilege escalation through preferences

1. An authenticated user calls `PUT` or `PATCH /api/users/:userId/preferences` using their own user ID and supplies a preference object containing a security-sensitive `role` field. The routes do not compare the requested ID to the token subject or restrict keys (`Backend/routes/userRoutes.js:93-119,156-177`).
2. A later sign-in derives the token role from `user.prefs.role` (`Backend/controllers/AdminControllers/authController.js:441-457`). The user cache can delay the effect, but does not prevent it.
3. The resulting admin token passes the role middleware and reaches admin routes, including user and customer data endpoints.

### Rank 4 — Direct unauthenticated Appwrite reads (runtime configuration dependent)

The repository does not contain a definitive ACL configuration for the deployed user/customer collections. If the Appwrite user or order/customer collection grants read to `Role.any()` or `Role.users()`, a caller may be able to read records directly through Appwrite REST/SDK without using the Express routes. This is **not confirmed from repository evidence**. Appwrite project permissions, collection/document security, API-key scopes, and access logs must be inspected as detailed under Manual Verification Required.

## 3. Findings Table

| ID | Severity | Initial confidence | Finding at audit time | Current worktree status |
|---|---|---|---|---|
| NF-01 | 🔴 CRITICAL | CONFIRMED | Public admin signup created and returned an admin identity | Fixed in source; not deployed |
| NF-02 | 🔴 CRITICAL | CONFIRMED | User-controlled preferences permitted role escalation and cross-user writes | Fixed with ownership checks and preference allowlist; admin authorization independently verifies membership |
| NF-03 | 🟠 HIGH | CONFIRMED | Authenticated user-list API returned raw user documents | Admin-only, bounded listing with safe DTO; dedicated export auditing remains open |
| NF-04 | 🟠 HIGH | CONFIRMED | Customer directory/detail API lacked admin and ownership checks | Fixed with admin-only route guard; not deployed |
| NF-05 | 🔴 CRITICAL | CONFIRMED | Unauthenticated password change trusted caller-supplied identity | Fixed with authentication, token-subject identity, and current-password verification; not deployed |
| NF-06 | 🟠 HIGH | CONFIRMED | Any authenticated user could reset an arbitrary vendor password | Fixed with admin-only guard; not deployed |
| NF-07 | 🟠 HIGH | CONFIRMED | Unauthenticated AI chat accepted another user's ID and read order context | Fixed with authentication and token-bound identity; mobile client uses authenticated API client |
| NF-08 | 🟠 HIGH | CONFIRMED | Reset credentials were stored in plaintext; public OTP flow lacked route-specific throttling | Open |
| NF-09 | 🟠 HIGH | NEEDS RUNTIME VERIFICATION | M-Pesa callback accepted body success after an IP check based on forwarded header | Open; deployment ingress and provider verification are unverified |
| NF-10 | 🟠 HIGH | CONFIRMED | Sentry-auth-token-named value was present in tracked mobile environment file | Removed from Git index; rotation, validity, and history cleanup unverified |
| NF-11 | 🟡 MEDIUM | CONFIRMED | M-Pesa callback logged full body and used process-local idempotency state | Callback-body logging fixed; durable idempotency and provider verification remain open |
| NF-12 | 🟡 MEDIUM | CONFIRMED | Reset-code endpoint revealed account existence and reset endpoints lacked explicit rate limits | Open |
| NF-13 | 🟡 MEDIUM | CONFIRMED | Preference/password errors and preference logging could disclose internal data | Preference fields are allowlisted; remaining error paths require review |
| NF-14 | ⚪ LOW | CONFIRMED | Customer monetary totals were formatted as USD despite KES payment flows | Open |
| NF-15 | 🟡 MEDIUM | NEEDS RUNTIME VERIFICATION | Appwrite collection ACLs and API-key scopes cannot be established from repository | Open; recommendation setup defaults were hardened but existing live ACLs are unverified |
| NF-16 | 🟡 MEDIUM | CONFIRMED | Sensitive user export lacked dedicated audit and bounded query | Bounded safe DTO is implemented; dedicated export auditing remains open |
| NF-17 | ⚪ LOW | CONFIRMED | Public Appwrite health route disclosed total user count and raw errors | Open |
| NF-18 | 🟠 HIGH | CONFIRMED IN SETUP CODE | Recommendation/context/metrics collection templates granted public CRUD permissions | Setup defaults hardened in worktree; existing collection ACLs remain unverified |

## 4. Detailed Findings

The descriptions and evidence in this section record the vulnerable implementation observed during the initial audit. The current worktree status is summarized in the findings table above; a finding's historical exploit scenario is not a claim that the same source path remains open after the listed remediation. No remediation has been deployed or verified in production.

### NF-01 — Public admin signup creates and returns an admin identity

**Description and why it matters.** The admin signup endpoint is publicly callable and unconditionally assigns `admin`; there is no invitation, existing-admin authorization, or email verification gate. The sign-up response also issues an access token whose role claim is already `admin`. This is a direct anonymous-to-admin privilege escalation and is the most probable route-level breach path.

**Evidence at audit time.**

```js
// Backend/routes/authRoutes.js:12
router.post("/signup/admin", signup);

// Backend/controllers/AdminControllers/authController.js:332,355
role: "admin",
const accessPayload = { sub: createdUser.$id, role: "admin" };
```

The handler also sets `role: "admin"` in preferences and signs/sets tokens (`Backend/controllers/AdminControllers/authController.js:342-356,382-405`). The router is mounted with `authLimiter` only (`Backend/src/index.js:688-695`).

**Current worktree status.** The `POST /signup/admin` registration and its unused import were removed from `Backend/routes/authRoutes.js`. `Backend/tests/adminSignupRoute.test.js` now checks that the route is absent. This is a source change only; production must still be updated.

**Exploitation scenario.** A remote caller registers an admin account, retains the returned cookie/token, and calls admin data APIs over HTTP. The auth limiter skips successful requests (`Backend/middleware/rate-limiter.js:4-12`), so repeated successful signups are not effectively capped by that limiter.

**Impact.** Full user and customer data exposure, administrative actions, account changes, and potential payment/merchant manipulation; material privacy, financial, regulatory, and reputational impact.

**Recommended fix.** Disable this public route immediately. Provision administrators only via an authenticated, audited operator workflow with approval/invitation, MFA, and separate privilege assignment. Revoke admin accounts/tokens created through this path and verify every existing admin independently.

**How to verify the fix.** Add an integration test asserting anonymous signup is rejected and creates no Appwrite user/profile; test that only a pre-authorized administrator can provision an admin and that the event is audited.

**Effort:** S for immediate disablement; M for a controlled provisioning workflow.

### NF-02 — User-controlled preferences permit role escalation and cross-user writes

**Description and why it matters.** Authenticated `GET`, `PUT`, and `PATCH /api/users/:userId/preferences` trust the path ID and accept/read arbitrary preference keys. No owner comparison or admin-only check is present. The admin signin handler later trusts `user.prefs.role` when issuing a token. This connects an ordinary authenticated account to admin authorization.

**Evidence.**

```js
// Backend/routes/userRoutes.js:119
const updatedPreferences = await users.updatePrefs(userId, preferences);

// Backend/routes/userRoutes.js:174-178
const currentPreferences = await users.getPrefs(userId);
const updatedPreferences = await users.updatePrefs(userId, {
  ...currentPreferences,
  ...updates,
});

// Backend/controllers/AdminControllers/authController.js:455-457
const role = user.prefs?.role || "user";
const accessToken = signAccessToken(accessPayload);
```

The routes use `authenticateToken` but do not authorize the requested `userId` (`Backend/routes/userRoutes.js:34-38,94-98,157-161`).

**Exploitation scenario.** A user changes their own preferences to include an admin role, then signs in again after any cached user record refreshes. The new token carries the preference-derived admin role.

**Impact.** Privilege escalation to admin APIs; cross-user preference reads/writes may also expose or alter security settings.

**Recommended fix.** Derive the target from `req.user.userId`; require an explicit admin policy for cross-user actions; define an allowlist of harmless preference fields and reject security/financial fields (`role`, `isPremium`, verification, loyalty, status, tokens). Store roles outside user-editable preferences. Invalidate cached user state on security changes.

**How to verify the fix.** Tests must prove a customer cannot read/write another user's preferences, cannot set protected keys, and cannot obtain a role claim above their server-authorized role after signin or refresh.

**Effort:** M.

### NF-03 — Authenticated user-list API returns raw user documents

**Description and why it matters.** `GET /api/users` requires a token but has no admin role check. Its handler returns Appwrite documents unchanged. Reset fields and internal metadata may be present in those documents, and the handler does not impose explicit pagination or a response-field allowlist. The router is mounted multiple times, adding aliases.

**Evidence.**

```js
// Backend/routes/userRoutes.js:32
router.get("/users", authenticateToken, getUsers);

// Backend/controllers/AdminControllers/userController.js:36-40
const { documents } = await instrumentedDb.listDocuments(
  env.APPWRITE_DATABASE_ID,
  env.APPWRITE_USER_COLLECTION_ID,
);
res.json({ users: documents });
```

Reset material is persisted on the user documents (`Backend/controllers/UserControllers/forgotPasswordController.js:61-62,293-294`). Mount aliases are defined at `Backend/src/index.js:717,746-747`.

**Exploitation scenario.** A regular registered customer calls the list endpoint and receives the default Appwrite page of documents; an admin obtained through NF-01 can use the admin alias as well. If the Appwrite collection is directly readable, anonymous access may bypass this API entirely (NF-15).

**Impact.** Bulk or repeated exposure of email, phone, role, push tokens, reset material, profile attributes, and Appwrite metadata depending on the collection schema and page behavior.

**Recommended fix.** Remove this endpoint unless there is a demonstrated business need. Otherwise require a server-side admin policy, return a documented minimal DTO rather than raw documents, redact credential/reset/token fields, and implement hard-bounded pagination with cursor authorization and audit logging.

**How to verify the fix.** Integration tests with customer and anonymous tokens must return 401/403; admin tests should assert response schema excludes sensitive/internal fields and pagination cannot exceed the configured cap.

**Effort:** S-M.

### NF-04 — Customer directory/detail API has no admin, tenant, or ownership check

**Description and why it matters.** The `/api/admin/customers` router authenticates callers but explicitly says admin-only behavior is still adjustable; it never invokes `adminOnly`. The collection endpoint reads up to 1,000 orders and composes customer profiles; the detail endpoint accepts an arbitrary `customerId` and returns email, spend, order dates, and order history.

**Evidence.**

```js
// Backend/routes/Vendorroutes/customerRoutes.js:10-14
router.use(authenticateToken);
router.get("/", getAllCustomers);
router.get("/insights", getCustomerInsights);
router.get("/:customerId", getCustomerDetails);

// Backend/controllers/VendorControllers/customerController.js:8-11
const orders = await db.listDocuments(..., [Query.limit(1000)]);
```

The list includes customer email/name/order aggregates (`Backend/controllers/VendorControllers/customerController.js:49-58,80-100`); detail queries use the caller-supplied ID and return email/order history (`:132-140,223-236`). The route is mounted at `/api/admin/customers` (`Backend/src/index.js:804`).

**Exploitation scenario.** Any account with a valid token enumerates customer aggregates and requests details for known customer IDs; the URL's `admin` segment provides no authorization.

**Impact.** Customer PII, purchase history and profiling data disclosed; merchant/customer confidentiality and trust are compromised.

**Recommended fix.** Require `adminOnly` for admin views. If vendors have a legitimate need, use a separate vendor endpoint that proves the authenticated vendor owns each order and exposes only the minimum fields. Add a strict maximum and cursor pagination.

**How to verify the fix.** Customer and vendor tests must be denied cross-tenant access; admin tests should assert field-level minimization and capped pagination.

**Effort:** S-M.

### NF-05 — Unauthenticated password change trusts caller-supplied identity header

**Description and why it matters.** The route has no authentication middleware. The controller treats `x-appwrite-user-id` as the target and directly calls the privileged Appwrite Users API to change its password. It checks that a current password was supplied but never verifies it.

**Evidence.**

```js
// Backend/routes/passwordRoute.js:8
router.post("/user/password/change", changePassword);

// Backend/controllers/AdminControllers/passwordController.js:10,18,63-64
const userId = req.headers["x-appwrite-user-id"];
if (!currentPassword || !newPassword || !confirmNewPassword) { ... }
await users.updatePassword(userId, newPassword);
```

The controller's own comments acknowledge the server Users API bypasses the current-password check (`Backend/controllers/AdminControllers/passwordController.js:31-56`).

**Exploitation scenario.** A remote caller supplies a victim ID in the header and a new password; no valid session or correct current password is required.

**Impact.** Account takeover, fraudulent orders/payments, personal-data exposure, and loss of customer/vendor/admin accounts.

**Recommended fix.** Disable the route until repaired. Require a verified access token, derive the target from its subject, verify the current password through an authenticated Appwrite Account/session flow, apply password policy and rate limits, revoke all sessions, and never accept identity from a request header.

**How to verify the fix.** Test missing/invalid tokens, wrong current passwords, forged target headers, and session revocation after a legitimate password update.

**Effort:** M.

### NF-06 — Any authenticated user can reset an arbitrary vendor password

**Description and why it matters.** The route requires a token but not an admin role. It accepts `vendorId` from the request body and uses the server Users API to change the vendor's password.

**Evidence.**

```js
// Backend/routes/Vendorroutes/vendorauth.js:23
router.post("/reset-vendor-password", authenticateToken, authController.resetVendorPassword);

// Backend/controllers/VendorControllers/vendorauthController.js:1029,1038,1045
const { vendorId, newPassword } = req.body;
const vendor = await db.getDocument(..., vendorId);
await users.updatePassword(vendor.$id, newPassword);
```

The controller comment says admin token is required, but the code does not enforce that claim.

**Exploitation scenario.** Any logged-in customer or vendor who knows a vendor ID changes that vendor's password and may invalidate its sessions.

**Impact.** Vendor account takeover, inventory/settlement manipulation, business disruption, and potential financial loss.

**Recommended fix.** Enforce `adminOnly` plus audit logging, or remove this endpoint and rely on the vendor's verified password-reset process. Do not copy passwords into vendor profile documents.

**How to verify the fix.** Test that customer/vendor roles receive 403 and that a privileged action is audited with actor, target, request ID, and outcome (never password).

**Effort:** S.

### NF-07 — Unauthenticated AI chat accepts another user's ID and reads their order context

**Description and why it matters.** The authentication middleware is commented out. The handler trusts `userId` from the request body and loads that user's profile and order data, including latest order status, total, and date for order-status prompts.

**Evidence.**

```js
// Backend/routes/aiChatRoutes.js:14-18
router.post(
  "/chat",
  /* authenticateToken */
  apiLimiter,
  handleAiChat,
);

// Backend/controllers/aiChatController.js:328,356,368
const { userId, message, sessionId, userName } = sanitizer.sanitize(req.body);
const userContext = await getUserContext(userId, userName);
additionalContext.latestOrder = await getLatestOrderStatus(userId);
```

**Exploitation scenario.** An anonymous caller supplies a victim's user ID and asks for an order update; the server places the victim's data into the model context and returns a response.

**Impact.** Cross-user order/profile disclosure, AI prompt/context leakage, and cost abuse. `apiLimiter` reduces request rate but does not authorize identity.

**Recommended fix.** Require authentication and derive `userId` only from the verified token subject. Keep conversation memory keyed to the authenticated user and add a separate audited support workflow for cross-user access.

**How to verify the fix.** Test anonymous requests are denied and authenticated requests cannot access another user's context by changing body fields, session IDs, or prompt text.

**Effort:** S-M.

### NF-08 — Password reset credentials are plaintext and reset endpoints lack a route-specific throttle

**Description and why it matters.** The six-digit code is stored directly in the user collection for 15 minutes; the reset link token is stored directly for one hour. Public verification compares the submitted code/token to those plaintext values. The code is single-use/cleared on success, which is positive, but no attempt counter or route-specific rate limiter appears on these routes. The code-based request also returns a distinct 404 for nonexistent emails.

**Evidence.**

```js
// Backend/controllers/UserControllers/forgotPasswordController.js:52-62
const resetCode = crypto.randomInt(100000, 999999).toString();
...
{ resetCode, resetCodeExpiry: resetCodeExpiry.toISOString() }

// Backend/controllers/UserControllers/forgotPasswordController.js:176-184
if (!user.resetCode || user.resetCode !== code) { ... }
if (!user.resetCodeExpiry || new Date(user.resetCodeExpiry) < new Date()) { ... }

// Backend/controllers/UserControllers/forgotPasswordController.js:285-294
const resetToken = crypto.randomBytes(32).toString("hex");
...
{ resetToken, resetTokenExpiry: resetTokenExpiry.toISOString() }
```

Routes are public and have no route middleware (`Backend/routes/forgotPasswordRoutes.js:11-16`); they are mounted without the auth limiter (`Backend/src/index.js:767-770`). The code flow returns `404 user_not_found` (`Backend/controllers/UserControllers/forgotPasswordController.js:21-35`).

**Exploitation scenario.** An attacker repeatedly requests codes for a target and guesses the six-digit value during its validity window, or uses the user-list flaw to acquire an active reset code/token. The differing response also confirms registered email addresses.

**Impact.** Account takeover, reset-credential exposure from raw user-list APIs, targeted phishing, and user enumeration.

**Recommended fix.** Store only keyed hashes of reset tokens/codes; enforce per-account and per-IP issuance/attempt limits, lockout/backoff, one-time atomic consumption, and a generic response regardless of account existence. Keep credentials out of user-readable profile documents and exclude them from every API response.

**How to verify the fix.** Tests should prove hashes alone are persisted, attempts/issuance are throttled, the token expires and can be consumed only once, and known/unknown emails receive indistinguishable responses.

**Effort:** M.

### NF-09 — M-Pesa callback authenticity depends on a spoofable forwarded header

**Description and why it matters.** The first mounted M-Pesa callback uses an IP allowlist that reads the leftmost value from the raw `X-Forwarded-For` header. The callback then trusts `ResultCode === 0` and marks the matching order succeeded. The callback path is mounted before a second callback router containing a separate webhook limiter, so the first route may handle and terminate the request before that limiter is reached. Whether the ingress sanitizes forwarded headers is deployment-specific and must be verified; no live test was performed.

**Evidence.**

```js
// Backend/middleware/mpesaCallbackAuth.js:38-44
const clientIp =
  req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
  req.socket?.remoteAddress ||
  req.ip;

// Backend/controllers/AdminControllers/PaymentController.js:2152-2172
if (ResultCode === 0) {
  ...
  await processSuccessfulMpesaPayment(order, orderId, { ... });
}
```

The order update sets `paymentStatus: "succeeded"` (`Backend/controllers/AdminControllers/PaymentController.js:92`). The first payment router is mounted before callback routes (`Backend/src/index.js:761,813-814`); the first route has only the IP middleware (`Backend/routes/paymentrouter.js:107`).

Separately, the callback extracts the provider-reported amount and passes it to processing, but the reviewed success path does not compare it with the stored order amount before setting payment success (`Backend/controllers/AdminControllers/PaymentController.js:68-92,2152-2172`).

**Exploitation scenario.** If the production proxy accepts and forwards attacker-supplied X-Forwarded-For rather than replacing it, a caller may spoof an allowlisted address and submit a forged success callback for a known checkout request. This is conditional, not proven.

**Impact.** Unauthorized paid-order state, inventory/commission/loyalty updates, financial loss, and reconciliation problems.

**Recommended fix.** Verify callbacks cryptographically or query the provider transaction API server-to-server before state changes; compare provider transaction, amount, currency, checkout ID, and expected order state. Use only a proxy-sanitized client IP (never a raw user header) as supplementary control. Consolidate duplicate routes and apply one durable webhook limiter/idempotency mechanism.

**How to verify the fix.** In staging only, test forged forwarded headers, invalid signatures, amount/currency mismatches, replayed callbacks, concurrent duplicate deliveries, and valid provider callbacks through the actual ingress. Assert no invalid case changes order state.

**Effort:** M-L.

### NF-10 — Tracked mobile environment contains a Sentry-auth-token-named value

**Description and why it matters.** `Mobileapp/.env` is tracked by Git and contains a non-empty, high-entropy value under a variable named `SENTERY_AUTH_TOKEN`. The value is not reproduced here. The spelling is unusual, and validity/use as a Sentry credential cannot be established from this review; nevertheless, a token-like value committed in a client repository should be treated as potentially compromised until revoked.

**Evidence.** `Mobileapp/.env:3` contains the variable name and a set value. `Mobileapp/.env` is listed by Git as tracked. `Backend/.env` is not tracked and is ignored by `Backend/.gitignore:9`.

**Exploitation scenario.** Anyone with repository access or a checkout/history copy may recover the value; if it is an active Sentry auth token, it could permit privileged telemetry/project actions. A client build must never receive an auth token.

**Impact.** Potential monitoring account/project compromise, telemetry tampering, or abuse. No validity or observed misuse is established.

**Recommended fix.** Revoke/rotate it if it is or was valid; replace client configuration with only an intentionally public DSN/project key; remove the credential from tracked files and Git history under the repository's secret-removal procedure. Review other tracked env files and CI logs.

**How to verify the fix.** Confirm the token is revoked at the provider; scan all branches/history and produced mobile bundles for the old credential using a secret scanner that does not print matches; verify app builds use no Sentry auth token.

**Effort:** S-M.

### NF-11 — M-Pesa callback logs full callback payload and uses process-local idempotency

**Description and why it matters.** The callback logs the complete request body, which can include phone numbers, transaction receipt/identifiers, amounts, and other metadata. Duplicate protection uses a process-local `Map` with entries cleared after ten minutes; it does not coordinate across Render instances or restarts. The order status check is not an atomic compare-and-set. These controls do not establish durable replay protection.

**Evidence.**

```js
// Backend/controllers/AdminControllers/PaymentController.js:47,2083
const processedCallbacks = new Map();
console.log("Callback Body:", JSON.stringify(req.body, null, 2));
```

The in-memory key is set/checked at `:2101-2110`; the callback later checks and updates order status at `:2145-2172`.

**Exploitation scenario.** Payment metadata is persisted in application logs; simultaneous callbacks handled by different instances or replay after map expiry/restart may both pass local checks.

**Impact.** PII/payment metadata retention and potential duplicate side effects or reconciliation anomalies.

**Recommended fix.** Redact callback logs to correlation/event IDs and outcome. Persist provider event/checkout IDs in a uniquely constrained idempotency record and atomically transition order state; reconcile amount/currency against the expected order.

**How to verify the fix.** Verify logs contain no phone, full payload, token, or payment credential; run concurrency/restart/replay tests against a shared idempotency store.

**Effort:** M.

### NF-12 — Reset-code account enumeration and missing reset-flow throttling

**Description and why it matters.** The code-based forgot-password flow distinguishes a missing account with a 404 and `user_not_found`. The password reset routes are not wrapped in the configured auth limiter. A six-digit OTP has a small search space and the code-verification handler contains no visible retry counter in the reviewed route/controller paths.

**Evidence.** `Backend/controllers/UserControllers/forgotPasswordController.js:21-35,141-184`; public routes at `Backend/routes/forgotPasswordRoutes.js:11-16`; mount at `Backend/src/index.js:767-770`.

**Exploitation scenario.** An attacker enumerates account emails and performs repeated OTP guesses or reset-code requests, especially if other data access exposes the stored code.

**Impact.** Target discovery, account takeover risk, unwanted email floods, and targeted abuse.

**Recommended fix.** Use uniform success responses, limit per account and IP, add attempt counters and temporary lockouts, and monitor reset anomalies. Do not rely on a process-local IP limiter as the sole control.

**How to verify the fix.** Automated tests should assert response equivalence for existing/non-existing addresses and rejection after configured request/guess budgets.

**Effort:** S-M.

### NF-13 — Error responses and preference logs may disclose internal data

**Description and why it matters.** Preference handlers return `error.message` in a response and log full updates. The unauthenticated password controller includes raw Appwrite error details in its response. If callers supply sensitive preference fields, those values may reach logs; backend errors may reveal implementation/configuration details.

**Evidence.** `Backend/routes/userRoutes.js:69-84,182-189`; `Backend/controllers/AdminControllers/passwordController.js:72-80`.

**Exploitation scenario.** Callers trigger error cases to learn internal details; operational logs capture user-provided preference bodies, potentially including sensitive or credential-like values.

**Impact.** Secondary information disclosure and increased impact of log access compromise.

**Recommended fix.** Return stable generic errors with correlation IDs; log allowlisted metadata only and never raw bodies or secrets. Ensure client-controlled preferences cannot include sensitive fields.

**How to verify the fix.** Test error responses contain no provider messages/stack details and inspect captured logs for redaction.

**Effort:** S.

### NF-14 — Customer monetary totals are labeled as dollars in KES flows

**Description and why it matters.** Customer analytics formats order totals with a `$` prefix, while payment flows explicitly calculate and store KES (`KES`/`kes`). This may misstate customer spend and dashboard revenue.

**Evidence.** `Backend/controllers/VendorControllers/customerController.js:90,229,234` formats values as `$...`; `Backend/controllers/AdminControllers/PaymentController.js:1061-1109` identifies the amount/currency as KES.

**Exploitation scenario.** An operator/customer relies on incorrectly labeled reports for pricing, loyalty, tax, or settlement decisions.

**Impact.** Financial reporting errors, inaccurate loyalty metrics, and customer confusion; no direct payment exploit established.

**Recommended fix.** Store integer minor units with an explicit ISO currency per order, aggregate by currency, and format using currency-aware formatting rather than hardcoded symbols.

**How to verify the fix.** Add tests for KES amounts and any supported alternate currency, including formatting and aggregation behavior.

**Effort:** S-M.

### NF-15 — Appwrite collection ACLs and API-key scopes require production verification

**Description and why it matters.** Both backend Appwrite clients use `APPWRITE_API_KEY` and expose server-level `Users`, `Databases`, `Storage`, and `Functions` clients. The key's actual scopes and the deployed collection/document ACLs are not checked into the repository in a way that establishes production permissions. Server SDK calls are privileged; Express authorization is therefore essential. If a browser/mobile project can read user/customer collections directly, route fixes alone will not contain the breach.

**Evidence.**

```js
// Backend/services/appwriteService.js:18-25
.setEndpoint(process.env.APPWRITE_ENDPOINT)
.setProject(process.env.APPWRITE_PROJECT_ID)
.setKey(process.env.APPWRITE_API_KEY);

// Backend/src/appwrite.js:13-24
.setKey(env.APPWRITE_API_KEY);
```

**Exploitation scenario.** A permissive collection/document read ACL or over-scoped API key allows direct data access or broad server-side impact. This is a runtime hypothesis, not a confirmed repository fact.

**Impact.** Potential unauthenticated direct access to user/customer collections and broad Appwrite project compromise.

**Recommended fix.** Rotate the active key after preserving incident evidence; create a least-privilege server key, isolate it from clients, set collection/document permissions to deny public reads, and confirm document security/default permissions. Use different keys for distinct operational needs.

**How to verify the fix.** In Appwrite Console and staging, test unauthenticated and normal-user reads against every sensitive collection and storage bucket; confirm denied responses and inspect the server key's exact scopes.

**Effort:** M.

### NF-16 — Sensitive user export path has no explicit export audit or bounded query

**Description and why it matters.** The user listing returns documents directly and does not record an export event, actor, purpose, record count, or pagination cursor. Even after authorization is repaired, this makes abuse detection, incident scoping, and accountability difficult.

**Evidence.** `Backend/controllers/AdminControllers/userController.js:34-40` performs `listDocuments` and returns raw `documents`; no audit/export call is made in that handler. Admin route is `Backend/routes/adminRouter.js:125`.

**Exploitation scenario.** A privileged or compromised account downloads user data without generating a distinct audit event that security staff can review.

**Impact.** Detection gaps and difficulty meeting accountability and breach-response obligations.

**Recommended fix.** Remove unnecessary export functionality. For retained administrative access, require a reason/approval where appropriate, record actor, scope, timestamp, request ID, record counts and outcome, paginate with strict bounds, and alert on abnormal volumes.

**How to verify the fix.** Add tests that every export emits a redacted audit event and that unauthorized or unbounded exports are rejected.

**Effort:** M.

### NF-17 — Public Appwrite health route discloses total user count and raw errors

**Description and why it matters.** The unauthenticated Appwrite health route reports the total user count and returns `error.message` on failure. This does not disclose user documents, but it exposes internal account-volume metadata and may reveal dependency/configuration details.

**Evidence.** `Backend/routes/health.routes.js:21-37` calls `users.list([], 1)`, returns `userCount.total`, and includes `error.message`; the router is mounted under `/api/health` (`Backend/src/index.js:570-571`), making the full path `/api/health/health/appwrite`.

**Exploitation scenario.** An unauthenticated caller probes the deployment to estimate registered-user volume or retrieve provider error details during an outage.

**Impact.** Low-grade reconnaissance and internal error disclosure; not a direct bulk-data read.

**Recommended fix.** Return only a generic liveness/readiness status to unauthenticated callers. Restrict detailed health diagnostics to internal monitoring and return stable error codes rather than provider messages.

**How to verify the fix.** Confirm public responses omit user counts and raw error messages; test detailed diagnostics require internal authentication/network access.

**Effort:** S.

### NF-18 — Recommendation and metrics collection templates grant public CRUD access

**Description and why it matters.** Multiple Appwrite setup helpers created recommendation, user behavior, context profile, and business-metrics collections with `read`, `create`, `update`, and `delete` permissions for `Role.any()`. If these helpers were used to create deployed collections, anonymous callers could read or tamper with behavioral and business data. The repository does not establish whether these scripts ran or what permissions existing collections currently have.

**Evidence at audit time.** `Backend/schemas/recommendationSchemas.js:20-25`, `Backend/schemas/simpleRecommendationSchemas.js:20-25`, and setup scripts under `Backend/services/` and `Backend/diagnostics/` supplied public CRUD permissions when creating collections.

**Current worktree status.** Recommendation schema helpers and the associated context-profile, business-metrics, v2, and diagnostic setup scripts now create collections with no client permissions. Server-side Appwrite API-key operations remain available. This change affects only future collection creation; it does not alter permissions on existing collections.

**Impact.** Potential disclosure or unauthorized modification/deletion of behavioral profiles, recommendation signals, item embeddings, and business/supply metrics.

**Recommended fix.** Keep client permissions empty by default for server-owned analytics collections. If a collection needs direct client access, grant narrowly scoped document-level permissions tied to authenticated ownership and expose only the required fields. Audit existing collection ACLs in Appwrite Console before considering this contained.

**How to verify the fix.** In a non-production project, create each collection through the setup scripts and confirm anonymous and ordinary-user CRUD is denied. Separately inspect the existing production collection and document permissions.

**Effort:** S-M.

## 5. Immediate Containment Checklist (Next 24 Hours)

This checklist records incident-response actions and production checks; source-level changes listed above do not complete these actions.

1. **Preserve evidence before broad changes.** Export relevant Render and Appwrite access/audit logs to a restricted evidence location. Record time range, timezone, affected deployments, and log retention limits. Do not place PII or secrets in this audit.
2. **Disable public admin creation immediately.** Remove or feature-disable `POST /api/admin/auth/signup/admin`; review all admin accounts created since the route was exposed.
3. **Block unsafe routes at the edge/application.** Temporarily disable `/api/users` listing and aliases, `/api/admin/customers` endpoints pending proper role enforcement, unauthenticated password change, direct vendor password reset, and unauthenticated AI chat.
4. **Rotate/revoke credentials.** Rotate Appwrite server API key, JWT access/refresh signing secrets, payment provider credentials/webhook secrets, OAuth client secrets, email/AI/messaging credentials, and the tracked mobile Sentry-token-named value if valid. Deploy new secrets through Render secret environment settings only. Do not reuse the existing values.
5. **Invalidate sessions.** Revoke refresh-token records and Appwrite sessions for users/admins with exposure risk; expire access cookies/tokens by rotating JWT secrets. Require privileged staff to reauthenticate with MFA.
6. **Lock down Appwrite.** Remove `Role.any()`/broad authenticated read from user, customer/order, refresh-token, address, notification/push, and audit collections and buckets. Validate document-level ACLs and server key scopes.
7. **Investigate access patterns.** Search Render logs and Appwrite audit/API logs for signup, user listing, customer listing/detail, preference update, password change/reset, AI chat, and direct Appwrite collection access. Preserve request IDs/source IP/time/path and estimate records accessed without copying bulk PII.
8. **Assess reset-material exposure.** Assume active reset codes/tokens on user documents may have been disclosed. Clear all outstanding reset values, invalidate reset links, and require fresh reset flows after code fixes.
9. **Validate payment integrity.** Review M-Pesa success callbacks, provider transaction status, amounts/currency, receipts and associated orders for a reconciliation window. Do not rely solely on callback request payloads.
10. **Start breach notification assessment.** Under Kenya's Data Protection Act, 2019, section 43, assess and document whether the breach creates a real risk of harm and the applicable ODPC/data-subject notification timelines. The Act provides a 72-hour controller notification framework; processor notification timing and sector/contractual duties should be confirmed with Kenyan privacy counsel. Preserve a decision log even if notification is not required.

## 6. Remediation Roadmap

Items in this roadmap describe the initial remediation plan. Source changes have since addressed several authorization paths; deployment, credential actions, live ACL verification, and the remaining open findings are still outstanding.

### Week 1 — Stop active exposure

1. Disable anonymous admin signup and remove or block the password-change endpoint that trusts `x-appwrite-user-id`.
2. Enforce role checks and ownership on user preferences, user listing, customer directory/detail, vendor password reset, and AI chat. Derive identities from verified tokens.
3. Remove raw Appwrite-document responses; introduce minimal allowlisted response DTOs and redact reset tokens, push tokens, `$permissions`, and internal identifiers.
4. Lock down Appwrite collection/bucket permissions and rotate server/payment/JWT secrets. Invalidate sessions and reset credentials.
5. Add route-specific distributed throttling for signup, login, reset/OTP, AI, and customer/user listing; make limiter behavior count successful registrations.
6. Repair M-Pesa verification and durable idempotency; remove full callback body logging.
7. Review access logs and complete the legal incident assessment; engage privacy counsel and the relevant incident-response owner.

### Month 1 — Make controls testable and observable

1. Centralize route authorization policy (authentication + role + ownership/tenant) and add a route inventory/check preventing sensitive routes without explicit policy.
2. Add integration tests for all NF-01–NF-09 scenarios, including anonymous, customer, vendor, and admin personas.
3. Hash password reset material, enforce one-time consumption/attempt counters, and remove enumeration responses.
4. Add durable, unique webhook idempotency records, server-side transaction verification, amount/currency matching, reconciliation, and payment audit trails.
5. Implement data export audit events, redacted structured logs, volume alerts, and retention schedules for PII/payment data.
6. Remove credentials from tracked client env files/history; add secret scanning to pull requests and CI. Confirm telemetry payloads contain no PII, tokens, or payment data.
7. Add security tests for CORS, cookies/CSRF, upload limits/types, SSRF protections, and Appwrite query allowlists.

### Quarter — Reduce systemic and regulatory risk

1. Complete a line-by-line authorization review of all route modules, including rider, vendor, admin, social, loyalty, finance, and account deletion.
2. Establish documented data classification, retention/deletion controls, data-subject request handling, breach playbooks, processor agreements, and Kenya Data Protection Act accountability records.
3. Move privileged access to least-privilege Appwrite service identities and rotate keys on a schedule; add privileged MFA and reviewed admin provisioning.
4. Run independent penetration testing against staging, provider callback paths, multi-tenant boundaries, and deployed Render/Appwrite settings.
5. Create measurable monitoring for bulk-read/export anomalies, repeated auth/reset attempts, unusual admin creation, callback failures/replays, and key use.

## 7. Manual Verification Required

These items cannot be established from this repository and were not checked against live services. The only Appwrite MCP request in scope listed database metadata; it did not inspect collection ACLs, document permissions, records, or API-key scopes.

1. **Appwrite collection/document permissions**
   - In Appwrite Console, open the deployed project, each database, then the user, customer/profile, orders, refresh-token, address, notification, and audit collections.
   - Inspect both collection-level permissions and document-level security/default permissions.
   - Verify `read` is not granted to `Role.any()` or broad `Role.users()` for sensitive records. Check whether document-level permissions override or expand collection defaults.
   - Inspect every storage bucket used for profiles, applications/CVs, banners, and vendor assets for public read/list/write.
   - Repeat with an unauthenticated client and a normal customer identity in a non-production project.
2. **Appwrite API key scopes and use**
   - In the Appwrite project API-key console, identify the key injected as `APPWRITE_API_KEY` without copying its value into tickets or this report.
   - Record the exact scopes, creator, creation date, last-use/rotation history, and whether it is shared by other applications.
   - Revoke/rotate the incident-period key after logs/evidence are preserved. Confirm client applications have no server key.
3. **Render environment and deployment**
   - Review production and staging environment variable names/values inside the restricted Render console; verify JWT secrets are independently generated, sufficiently random, and not reused.
   - Confirm no server credential is configured under `VITE_*`, `EXPO_PUBLIC_*`, or otherwise injected into client builds.
   - Check deployed commit/release and environment flags; verify `NODE_ENV=production` and debug-only routes are unavailable.
4. **Incident logs**
   - Preserve and review Render access logs and Appwrite audit/API logs for the endpoints in the attack reconstruction and direct Appwrite API paths.
   - Estimate source IPs, user agents, account IDs, response sizes/page counts, and time window; do not export more PII than needed for the investigation.
   - Check whether admin signups, role preference changes, password changes, reset requests, and callback events were logged/alerted.
5. **M-Pesa ingress behavior**
   - Confirm the Render proxy replaces client-supplied `X-Forwarded-For`, and that Express `trust proxy` is restricted to the known proxy hop (`Backend/src/index.js:84`).
   - In staging, verify route ordering and whether `/api/payments/mpesa/callback` reaches the IP-only handler or the later webhook-limited handler.
   - Confirm callback verification uses the provider transaction API and validates amount, currency, order, and checkout identifiers.
6. **Tracked Sentry token-named value**
   - Verify whether `Mobileapp/.env:3` is/was a valid Sentry auth token, whether it appears in build artifacts or CI logs, and revoke it if valid.
   - Confirm the value is absent from repository history and all distributed app bundles.
7. **Breach notification**
   - With Kenyan privacy counsel/DPO, document the breach start/discovery time, categories and approximate number of affected data subjects, risk of harm, mitigation, and applicable ODPC/data-subject notification obligations under the Data Protection Act, 2019 and related rules.

## 8. Positive Observations

- JWT and Appwrite API key configuration are loaded from environment variables rather than hardcoded in the reviewed backend initializer (`Backend/src/env.js:7-18`; `Backend/services/appwriteService.js:18-25`). The actual runtime secret strength and deployment configuration still need review.
- Access and refresh tokens use separate configured secrets; access tokens have a configured short expiry, refresh tokens are hashed in storage, rotated, and checked for reuse (`Backend/utils/tokenManager.js:15-53`; `Backend/controllers/AdminControllers/authController.js:134-161,517-717`).
- Customer profile retrieval has a separate route intended to bind profile access to the authenticated customer (`Backend/routes/ClientauthRouter.js:34-38`); validate ownership behavior in its controller as part of the full follow-up.
- The dedicated admin router has a global `authenticateToken` + `adminOnly` chain (`Backend/routes/adminRouter.js:57`); its effectiveness is undermined by the public admin signup and role mass-assignment findings.
- Helmet is configured with CSP, HSTS, and `frameAncestors: 'none'` (`Backend/src/index.js:281-300`).
- CORS uses an explicit origin allowlist with credentials rather than a wildcard (`Backend/src/index.js:319-340`). CORS is not an authorization control and does not prevent command-line clients.
- Stripe subscription webhooks use Stripe signature verification (`Backend/controllers/paymentCallbackController.js:657-683`); PayPal verification rejects missing webhook configuration (`:19-27`). M-Pesa does not have equivalent cryptographic verification in the reviewed first-mounted callback.
- The backend package lock was checked with `npm audit --package-lock-only --offline --omit=dev`; the offline audit returned 0 advisories. This is not a current online advisory check and does not establish that all installed/transitive or frontend packages are vulnerability-free.
- `Backend/.env` is present locally but is not tracked; it is ignored by `Backend/.gitignore:9`. Its values were not printed. Multiple tracked frontend `.env` files exist and require cleanup/credential review.

## 9. Appendix

### A. Incident-critical endpoint inventory

This is the endpoint inventory observed during the initial audit, not a current authorization map. Consult the current worktree and the findings table above for source-level remediation status.

| Method | Path | Auth required? | Role/ownership check? | Data returned or action | Rate limited? |
|---|---|---|---|---|---|
| POST | `/api/admin/auth/signup/admin` | No | No; creates admin role | Creates user/profile; returns user/profile and admin cookies/tokens | `authLimiter` at mount; successful requests are skipped by limiter |
| POST | `/api/admin/auth/signin/admin` | No | No route-level role check before sign-in | Issues token role from user preferences | `authLimiter` at mount; successful requests skipped |
| GET | `/api/admin/users` | Yes | Admin role through global admin router | Raw user collection documents | No explicit route limiter |
| GET | `/api/users` | Yes | No role/ownership check | Raw user collection documents | No explicit route limiter |
| GET | `/api/users/users` | Yes | No role/ownership check; mount alias | Same raw user documents | No explicit route limiter |
| GET | `/api/audit-logs/users` | Yes | No role/ownership check; mount alias | Same raw user documents | No explicit route limiter |
| GET | `/api/users/:userId/preferences` | Yes | No owner/admin check | Arbitrary user's preferences | No explicit route limiter |
| PUT | `/api/users/:userId/preferences` | Yes | No owner/admin check; no field allowlist | Writes arbitrary preference keys | No explicit route limiter |
| PATCH | `/api/users/:userId/preferences` | Yes | No owner/admin check; merges arbitrary keys | Writes arbitrary preference keys | No explicit route limiter |
| GET | `/api/admin/customers` | Yes | No admin/tenant check | Customer aggregates from up to 1,000 orders | No explicit route limiter |
| GET | `/api/admin/customers/insights` | Yes | No admin/tenant check | Customer analytics | No explicit route limiter |
| GET | `/api/admin/customers/:customerId` | Yes | No owner/tenant check | Customer email and order history | No explicit route limiter |
| POST | `/api/nileflow/passwordchange/user/password/change` | No | No; trusts `x-appwrite-user-id` | Changes target account password | No explicit route limiter |
| POST | `/api/vendor/auth/reset-vendor-password` | Yes | No admin/ownership check | Changes target vendor password and revokes sessions | `authLimiter` at vendor auth mount; successful requests skipped |
| POST | `/api/ai/chat` | No | No; caller supplies `userId` | AI response may contain target profile/order context | `apiLimiter` (100/minute, process-local default) |
| GET | `/api/ai/health` | No | Not applicable | Health status | No explicit route limiter |
| POST | `/api/nileflowafrica/passwordchange/forgot-password` | No | Not applicable | Sends reset link; generic response for unknown users | No route-specific limiter |
| POST | `/api/nileflowafrica/passwordchange/reset-password` | No | Reset token only | Resets password | No route-specific limiter |
| POST | `/api/nileflowafrica/passwordchange/forgot-password/send-code` | No | Not applicable | Sends 6-digit code; distinguishes missing account | No route-specific limiter |
| POST | `/api/nileflowafrica/passwordchange/forgot-password/reset` | No | Reset code only | Resets password | No route-specific limiter |
| POST | `/api/payments/mpesa/callback` (first-mounted) | No JWT | IP allowlist from forwarded header | Updates order payment state on `ResultCode === 0` | No route limiter on first handler |
| POST | `/api/payments/mpesa/callback` (later router) | No JWT | Provider callback handler | Callback processing | `webhookLimiter`, but route ordering may prevent reaching it |
| POST | `/api/payments/stripe/webhook` | No JWT | Stripe signature verification | Subscription/payment event processing | `webhookLimiter` |
| POST | `/api/payments/paypal/webhook` | No JWT | PayPal webhook verification | Payment event processing | No explicit limiter in route declaration |
| GET | `/api/customerprofile/profile` | Yes | Customer-role/profile logic in controller | Current customer's profile | No explicit route limiter |
| GET | `/api/health/health/appwrite` | No | Not applicable | Appwrite health and user-count metadata; raw error message on failure | No explicit route limiter |

Route evidence: `Backend/src/index.js:688-893`; sensitive router declarations in `Backend/routes/authRoutes.js`, `userRoutes.js`, `Vendorroutes/customerRoutes.js`, `passwordRoute.js`, `Vendorroutes/vendorauth.js`, `aiChatRoutes.js`, `forgotPasswordRoutes.js`, `paymentrouter.js`, and `paymentCallbackRoutes.js`.

### B. Top-level route mounts and Appwrite usage map

The main Express entry point mounts these route families (`Backend/src/index.js:688-893`): admin auth; admin/vendor management; admin router; orders; finance; admin staff/careers/newsletter/commission; users; notifications/logs/webhooks; customer notifications; AI; audit-log and user aliases; settings; customer auth (versioned and unversioned); customer profile/currency; payments and callbacks; Nile Miles; addresses; questions/promotions; password change/reset; cart; group orders; gamification; contact messages; social; products; applications; African facts; currency/recommendations; vendor auth/products/dashboard/analytics/orders; admin customer directory; subscriptions/premium; rider auth/management/tracking; account deletion; public share pages; API v1; image proxy; SEO; metrics; health/version/CORS diagnostics.

**Appwrite initialization**

- `Backend/services/appwriteService.js:18-25` builds an Appwrite `Client` from `APPWRITE_ENDPOINT`, `APPWRITE_PROJECT_ID`, and `APPWRITE_API_KEY`; creates `Databases`, instrumented database, `Users`, `Account`, `Avatars`, `Functions`, and `Storage` clients.
- `Backend/src/appwrite.js:13-24` creates a second server client using the same environment key and exports `Account`, `Databases`, `Users`, `Functions`, `Storage`, and IDs.
- The key is a server-side API key; exact scopes are not visible in source. Treat it as privileged until Appwrite Console proves otherwise.
- The incident-critical database/collection references include `APPWRITE_DATABASE_ID`, `APPWRITE_USER_COLLECTION_ID`, `APPWRITE_ORDERS_COLLECTION` / `APPWRITE_ORDERS_COLLECTION_ID`, `APPWRITE_ADMIN_COLLECTION_ID`, and `APPWRITE_REFRESH_TOKEN_COLLECTION_ID`. Customer list data is derived from the orders collection rather than an explicitly named `customers` collection in the cited handler.
- Other ID variables referenced/configured include: `APPWRITE_ADDRESS_COLLECTION_ID`, `APPWRITE_APPLICATIONS_COLLECTION_ID`, `APPWRITE_AUDIT_LOGS_COLLECTION_ID`, `APPWRITE_CAMPAIGN_TYPES_COLLECTION_ID`, `APPWRITE_CANCELLATION_REQUESTS_COLLECTION_ID`, `APPWRITE_CANCELLED_ORDERS_COLLECTION_ID`, `APPWRITE_CAREERS_COLLECTION_ID`, `APPWRITE_CART_COLLECTION_ID`, `APPWRITE_CATEGORIES_COLLECTION_ID`, `APPWRITE_CURRENCIES_COLLECTION`, `APPWRITE_DEALS_COLLECTION_ID`, `APPWRITE_DELETION_REQUESTS_COLLECTION_ID`, `APPWRITE_FEATURED_COLLECTION_ID`, `APPWRITE_FINANCIAL_REPORTS_COLLECTION_ID`, `APPWRITE_FLASH_SALE_COLLECTION_ID`, `APPWRITE_GROUP_BUY_SETTINGS_COLLECTION_ID`, `APPWRITE_GROUP_ORDER_COLLECTION_ID`, `APPWRITE_IDEMPOTENCY_COLLECTION`, `APPWRITE_NEWSLETTER_COLLECTION_ID`, `APPWRITE_NILE_MILES_COLLECTION`, `APPWRITE_NOTIFICATIONS_COLLECTION_ID`, `APPWRITE_NOTIFICATION_LOGS_COLLECTION_ID`, `APPWRITE_NOTIFICATION_WEBHOOKS_COLLECTION_ID`, `APPWRITE_ORDER_COLLECTION_ID`, `APPWRITE_ORDER_COUNTER_COLLECTION_ID`, `APPWRITE_PLATFORM_SETTINGS_COLLECTION_ID`, `APPWRITE_PRICING_TIERS_COLLECTION_ID`, `APPWRITE_PRODUCT_COLLECTION_ID`, `APPWRITE_PROMOTIONS_COLLECTION_ID`, `APPWRITE_PUSH_BROADCASTS_COLLECTION_ID`, `APPWRITE_PUSH_BROADCAST_DELIVERIES_COLLECTION_ID`, `APPWRITE_PUSH_EVENT_RECEIPTS_COLLECTION_ID`, `APPWRITE_QUESTION_COLLECTION_ID`, `APPWRITE_REFERRALS_COLLECTION_ID`, `APPWRITE_REFERRAL_TRACKING_COLLECTION_ID`, `APPWRITE_REVIEW_COLLECTION_ID`, `APPWRITE_REWARD_COLLECTION_ID`, `APPWRITE_SCHEDULED_CAMPAIGNS_COLLECTION_ID`, `APPWRITE_SEARCH_COLLECTION`, `APPWRITE_SESSIONS_COLLECTION_ID`, `APPWRITE_SETTINGS_COLLECTION_ID`, `APPWRITE_SETTINGS_DOCUMENT_ID`, `APPWRITE_STAFF_COLLECTION`, `APPWRITE_SUBCATEGORY_COLLECTION_ID`, `APPWRITE_SUBSCRIPTIONS_COLLECTION_ID`, `APPWRITE_USER_MESSAGES_COLLECTION_ID`, `APPWRITE_VERIFICATION_COLLECTION_ID`, plus rider/vendor/recommendation/social/weight-system collection IDs.
- Other names found in the local backend environment file or code include `AFRICAN_FACTS_COLLECTION_ID`, `AFRICAN_PROVERBS_COLLECTION_ID`, `BANNER_COLLECTION_ID`, `BUSINESS_METRICS_COLLECTION_ID`, `CONTEXT_PROFILES_COLLECTION_ID`, `DELIVERIES_COLLECTION_ID`, `EXPLORATION_PATTERNS_COLLECTION_ID`, `ITEM_EMBEDDINGS_COLLECTION_ID`, `ITEM_SOCIAL_SIGNALS_COLLECTION_ID`, `MAIN_VENDORS_COLLECTION_ID`, `PRODUCTS_COLLECTION_ID`, `RATINGS_COLLECTION_ID`, `RECOMMENDATION_FEEDBACK_COLLECTION_ID`, `RECOMMENDATION_WEIGHTS_COLLECTION_ID`, `RIDER_COLLECTION_ID`, `RIDER_SESSIONS_COLLECTION_ID`, `SOCIAL_COMMENTS_COLLECTION_ID`, `SOCIAL_FOLLOWS_COLLECTION_ID`, `SOCIAL_LIKES_COLLECTION_ID`, `SOCIAL_POSTS_COLLECTION_ID`, `SOCIAL_SHARES_COLLECTION_ID`, `SUPPLY_CHAIN_METRICS_COLLECTION_ID`, `TEAM_MEMBERS_COLLECTION_ID`, `USER_BEHAVIOR_COLLECTION_ID`, `USER_BEHAVIOR_LOGS_COLLECTION_ID`, `USER_EXPERIMENT_ASSIGNMENTS_COLLECTION_ID`, `USER_PREFERENCES_COLLECTION_ID`, `USER_SESSIONS_COLLECTION_ID`, `VENDOR_APPLICATIONS_COLLECTION_ID`, `VENDOR_COLLECTION_ID`, `VENDOR_ORDERS_COLLECTION_ID`, `VENDOR_PRODUCTS_COLLECTION_ID`, `VENDOR_SESSIONS_COLLECTION_ID`, and the weight assignment/configuration/experiment/performance/result/usage collection IDs.
- Storage and function references include `APPWRITE_STORAGE_ID`, `APPWRITE_PROMOTION_BUCKET`, `APPLICANT_CVS_BUCKET_ID`, `BANNER_STORAGE_BUCKET_ID`, `TEAM_MEMBERS_STORAGE_BUCKET_ID`, `VENDOR_PROFILE_STORAGE_BUCKET_ID`, `APPWRITE_UPDATE_ORDER_STATUS_FUNCTION_ID`, `ORDER_FUNCTION_ID`, `ORDER_FUNCTION_IDs`, `ORDER_FUNCTION_MOBILE_ID`, and `ORDER_FUNCTION_WEB_ID`. IDs are environment variable names only; no values are reproduced. Confirm all deployed identifiers and scopes in the restricted Appwrite/Render consoles.
- Repository searches found no direct `node-appwrite` client API key use in the main React Native/Website application source. This does not rule out Appwrite REST calls, generated bundles, build-time configuration, or permissions that allow public access. No public-facing server API key is shown in this report.

### C. User/customer data read paths

- Raw user document collection: `Backend/controllers/AdminControllers/userController.js:34-40` (`getUsers`); also user/profile operations in `Backend/controllers/UserControllers/ClientController.js`, `ClientauthController.js`, `authController.js`, `admin.js`, `subscriptionController.js`, notification services, password reset, push services, deletion, and payment callbacks. Many of these are single-user internal service paths; this audit did not trace every controller call site.
- Reset credential reads/writes: `Backend/controllers/UserControllers/forgotPasswordController.js:30-62,162-218,271-294,383-407`.
- Customer directory/list: `Backend/controllers/VendorControllers/customerController.js:5-100` reads order records and synthesizes customer data; detail handler `:132-236` queries by supplied customer ID and returns customer/order history.
- AI profile/order context: `Backend/controllers/aiChatController.js:168-227,323-368`.
- Public Appwrite health endpoint returns the total user count (`Backend/routes/health.routes.js:21-37`). The deep health check also queries the user collection with a limit of one (`Backend/src/observability/healthDeep.js:24-33`); verify its exposure and response in the deployed route configuration.

### D. Secrets/configuration findings (values intentionally withheld)

| Location | Secret/config type | Status |
|---|---|---|
| `Backend/.env:7` | Appwrite API key | Value present locally; file is untracked and ignored |
| `Backend/.env:1,87-91,121` | Access/JWT/refresh signing secrets | Values present locally; untracked and ignored |
| `Backend/.env:74,80` | Facebook/Google OAuth client secrets | Values present locally; untracked and ignored |
| `Backend/.env:81,100` | Google Generative AI/OpenAI API keys | Values present locally; untracked and ignored |
| `Backend/.env:95,97` | M-Pesa secret/passkey | Values present locally; untracked and ignored |
| `Backend/.env:106,108` | PayPal/Pesapal client secrets | Values present locally; untracked and ignored |
| `Backend/.env:122` | Resend API key | Value present locally; untracked and ignored |
| `Backend/.env:126` | Sentry DSN | Value present locally; untracked and ignored; DSN is generally a public ingestion identifier, not an admin token |
| `Backend/.env:132-133` | Stripe secret/webhook keys | Values present locally; untracked and ignored |
| `Mobileapp/.env:3` | `SENTERY_AUTH_TOKEN`-named value | Non-empty, high-entropy-looking value in a tracked file; validity/use unverified; rotate if real |
| `Mobileapp/.env:4`; `Website2/.env:32,50` | PostHog public project keys/tokens | Present in tracked client env; likely public ingest identifiers, confirm no private API key is used |
| `Website2/.env:41` and `.env.example:41` | Stripe publishable key setting | Publishable/client-side by design; verify it is not a secret key |

An offline scan of tracked environment-file history for common high-confidence credential formats found no match. This is not proof that history is clean: custom token formats, non-env files, deleted branches, Git LFS, CI logs, and unscanned artifacts can contain secrets. Run the organization's approved secret scanner across all refs and artifacts without printing matches.

### E. Dependency audit summary

- Backend manifest/lockfile: `Backend/package.json`, `Backend/package-lock.json`.
- Command executed from `Backend`: `npm audit --package-lock-only --offline --omit=dev --json`.
- Result: 0 advisories in the available offline audit metadata.
- Limitation: offline advisory data may be stale or unavailable; this does not establish current vulnerability status. No packages were installed or changed.

### F. Areas not fully audited in this pass

The report deeply covers the confirmed incident paths, core user/customer reads, password reset, selected token/role handling, and payment callback integrity. It does not claim exhaustive per-handler review of all product/order mutations, every payment provider (Stripe, PayPal, Paystack, Pesapal, Airtel, MTN), all vendor/rider/tenant authorization, loyalty/promo/referral race conditions, every OAuth edge case, every upload/image proxy path, all AI prompt/tool behavior, all Sentry/PostHog telemetry payloads, Docker/Render settings, or all Git/CI artifacts. Those areas should be addressed in the Week 1/Month 1 follow-up and through the exact manual checks above.

## 10. Follow-up Remediation and Validation

### Source changes completed in the current worktree

- Removed public admin signup and added a regression test.
- Required verified admin membership in addition to the JWT role for admin authorization and admin signin/refresh.
- Restricted user listing to admins, bounded its query, and returned an allowlisted user DTO.
- Bound preference access to the authenticated user, allowlisted display preferences, and rejected protected fields.
- Required admin authorization for customer-directory, vendor-administration, and vendor-password-reset routes.
- Required authentication for password changes and AI chat; password changes now use the token subject and verify the current password, while AI identity comes from the authenticated token.
- Required authentication and token-bound identity for recent-search operations.
- Removed full M-Pesa callback-body logging.
- Removed the tracked `Mobileapp/.env` file from Git's index; the local ignored file remains.
- Changed recommendation, context-profile, business-metrics, and related setup helpers to create collections without client permissions.

These are source/worktree changes only. They do not update a production deployment, revoke credentials, rewrite Git history, alter existing Appwrite ACLs, or establish that a production incident is contained.

### Validation performed

- 14 focused security regression tests passed in the follow-up run.
- JavaScript syntax checks passed for the eight recommendation/schema setup files changed in the follow-up.
- `git diff --check` passed.
- The broader backend suite previously reached 91/92 passing; the remaining route-load test requires Redis configuration (`REDIS_URL`). A broader retry produced repeated localhost Redis retries and was stopped.
- ESLint could not run because the installed ESLint 9 configuration is incompatible with the repository's existing configuration mode.

### Direct incident-status answers

| Question | Answer | Basis |
|---|---|---|
| Does repository evidence show serious security vulnerabilities at initial audit time? | YES | Multiple unauthenticated or insufficiently authorized source paths were present. |
| Are the listed source authorization paths fixed in the current worktree? | PARTLY | NF-01 through NF-07 have source remediations; other findings remain open or partial as shown in the findings table. |
| Has the remediation been deployed to production? | UNKNOWN / NO EVIDENCE | No deployment or production revision was checked; only database-name metadata was listed through Appwrite MCP. |
| Is there evidence in this audit that confirms a data breach occurred? | NO | No customer records, application endpoints, or production audit logs were examined. |
| Can this audit prove that no breach occurred? | NO | Production logs, deployment history, and Appwrite ACLs were not inspected. |
| Is production incident containment confirmed? | UNKNOWN | Required deployment, credential, ACL, and log checks remain owner actions. |
