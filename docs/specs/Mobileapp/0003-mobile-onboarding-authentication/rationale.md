# Rationale: Mobile customer onboarding authentication

## Context

> ⚠️ Premise note: Requiring both a verified email and a delivery address before browsing adds steps and can lower signup completion. You chose both as trust gates, so the first path needs clear recovery, while returning customers with a valid session should reach the marketplace directly.

The Mobileapp welcome screen currently offers marketplace browsing without sign in. Signup issues session credentials before email verification, the mobile verification screen reports success without calling the Backend, and the root layout does not guard protected routes. Password sign in does not check the Appwrite `isVerified` preference. The shared Backend middleware validates a token but does not check the customer verification status.

The existing stack already uses Appwrite for customer identity and records, Express routes, JWT sessions, cookies, Redis, Expo Router, and Website2 authentication. The active Website2 auth service treats a signup response containing a user as a session, so it must follow the shared verification response. The task stays focused on Mobileapp address onboarding; Website2 receives the shared verification and session behavior, not a new address screen.

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

## Rationale

The current code shows that a screen only gate would be bypassable: signup creates cookies and tokens before verification, password sign in skips the verification preference, and shared middleware accepts any valid token. Enforcing the preference in the Backend closes that gap without replacing Appwrite or the existing customer identity model.

Keeping verified sessions avoids logging out every existing customer. Versioned routes plus legacy aliases allow clients to move without creating a second set of authentication rules. Expo SecureStore protects OAuth credentials at rest, while a one time code avoids exposing full tokens in an app link.

## References

No external references were used for this decision.
