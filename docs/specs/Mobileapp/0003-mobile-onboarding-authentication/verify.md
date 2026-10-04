# Verify: Mobile customer onboarding authentication · spec 0003 · updated 2026-10-05

_Steps derived from spec 0003 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual

- [ ] Start with no session. Confirm the welcome screen offers Sign in and Create account, with no guest or browse action. Open a protected route directly and confirm it returns to authentication, while legal and auth routes remain available. AC-1, AC-3.
- [ ] Restore a verified session with a saved address and confirm the app opens the marketplace. Repeat with a network failure and confirm access stays locked, the session is preserved, and Retry is offered. Revoke the session and confirm the next check returns to welcome. AC-2.
- [ ] Submit email signup. Confirm a pending account and six digit code are created, the code expires after 15 minutes, and signup sets no session cookie or returns no access or refresh token. AC-4.
- [ ] In a test environment, make email delivery fail after account creation. Confirm the pending account remains and the app offers the verification screen with resend recovery. Resend before 60 seconds and after the server wait. AC-5, AC-18.
- [ ] Repeat signup for a pending account, then for a verified account. Confirm the pending account returns to verification and the verified account is directed to sign in. AC-6.
- [ ] Verify with a valid code. Confirm Appwrite `prefs.isVerified` becomes true, the profile mirror is updated, the code is consumed, and a session is issued only afterward. Repeat with an invalid, expired, and reused code and confirm no session is issued. AC-7.
- [ ] Sign in with a verified account, a pending account with correct credentials, and incorrect credentials. Confirm only the verified account receives a session, the pending account gets `EMAIL_NOT_VERIFIED`, and incorrect credentials keep the normal error. AC-8.
- [ ] Call protected customer routes and refresh with verified and unverified sessions through both versioned and legacy paths. Confirm both path families apply the same verification rule and existing verified sessions continue to work. Exercise the failed request and resend limits. AC-9, AC-17, AC-18.
- [ ] Test a customer with an existing pickup address and a customer without one. Confirm the existing address allows entry, while a missing address opens a blocking form that cannot be dismissed. Check required fields, optional postal code, invalid input, and failed lookup or save retry. Save an address and confirm its owner comes from the authenticated session, then confirm entry to the marketplace. AC-10, AC-11.
- [ ] Test Google and Facebook with a provider confirmed email, an unverified email, and no email. Confirm only a provider confirmed email skips Nile Flow email verification, and that missing or unverified email requires verification before account linking or session creation. Confirm each provider subject is unique. AC-12, AC-15.
- [ ] Confirm the OAuth callback state is bound to its provider and registered app redirect, expires after 10 minutes, and is single use. Confirm pending handoffs expire after 15 minutes and exchange codes expire after 60 seconds and work once. Replay expired or consumed values and confirm they cannot create a session. Make shared Redis unavailable and confirm the handoff fails closed with a retry path. Confirm app links contain neither full provider email addresses nor access or refresh tokens. AC-12, AC-13, AC-14.
- [ ] Exchange an OAuth code over HTTPS and confirm both tokens are stored in SecureStore without a biometric prompt. Refresh and confirm token rotation. Sign out and confirm backend revocation succeeds before local tokens are cleared. Make revocation fail or take the device offline and confirm the session stays active with Retry. Confirm cookie sessions keep their existing refresh and logout behavior. AC-13, AC-19.
- [ ] In Website2, sign up and sign in with pending and verified accounts. Confirm pending accounts do not get a session, verified accounts keep the existing cookie session, verification rules match the Backend, and Website2 does not show the Mobileapp address gate. AC-16.

### Value source checks

- [ ] Check startup destination from the Backend profile and refresh responses. Confirm network errors remain distinct from invalid sessions. AC-2.
- [ ] Confirm verification email, expiry, and resend timing use the signup email and the server verification record `createdAt`, with 15 minute expiry and 60 second resend wait. AC-4, AC-18.
- [ ] Confirm the Appwrite user preference `prefs.isVerified` is authoritative and the profile `isVerified` value is only its mirror. AC-7, AC-9.
- [ ] Confirm email session credentials come from the Backend only after verification state and profile mirror are updated. AC-7, AC-8.
- [ ] Confirm native OAuth rotation and revocation use the SecureStore refresh token, authenticated user, device, and existing refresh token record. AC-19.
- [ ] Confirm the address form reads existing values from the authenticated pickup address endpoint, and a 404 selects the missing address form. AC-10.
- [ ] Submit an address with a modified client owner identifier and confirm the Backend assigns ownership from the authenticated session. AC-11.
- [ ] Confirm OAuth provider, subject, email, and verification claim come from the Google or Facebook provider response. AC-12, AC-15.
- [ ] Confirm `emailRequired` and any masked email come from the pending handoff created from the provider email claim. AC-12.
- [ ] For an unconfirmed provider email, confirm the verification address and code result come from the customer or provider email and the existing verification record. AC-12.
- [ ] Confirm the OAuth session and sanitized profile come from the one time Redis exchange code and the `deviceId` sent to the exchange endpoint. AC-13.
- [ ] Confirm callback state, provider, and redirect destination come from the one time Redis state record and the registered `nileflowapp://oauth/callback` URI. AC-14.
- [ ] Confirm Website2 resumes from its existing cookie session and the shared Backend profile endpoint. AC-16.

## Commands

- [ ] From `Backend`, run `node --test tests/customerAuthPolicy.test.js tests/oauthHandoffStore.test.js tests/maskEmailAddress.test.js tests/customerSessionCookies.test.js`. Expect the verification policy, Redis handoff, email masking, and session cookie tests to pass. AC-9, AC-13, AC-14.
- [ ] From `Mobileapp`, run `npx eslint Context/GlobalProvider.js api.js 'app/(auth)/sign-in.jsx' 'app/(auth)/sign-up.jsx' 'app/(auth)/oauth-verification.jsx' 'app/(auth)/pickup-address.jsx' app/_layout.jsx app/index.jsx constants/images.js constants/theme/colors.js constants/theme/index.js constants/theme/metrics.js`, then run `npx expo export --platform android`. Expect no lint errors and a successful Android bundle. The existing axios import warning may remain. AC-1 to AC-15, AC-19.
- [ ] From `Website2`, run `npx eslint src/auth/authService.js src/auth/oauthBridge.js src/features/auth/pages/LoginPage.jsx src/features/auth/pages/OAuthCallbackPage.jsx src/features/auth/pages/SignupPage.jsx src/features/auth/pages/VerifyEmailPage.jsx`, then run `npm run build`. Expect no lint errors and a successful production build. AC-16.
- [ ] In an approved test environment, confirm the Appwrite provider identity attributes and unique indexes exist, and confirm production OAuth uses a ready shared Redis service before enabling app handoffs. Do not run the schema setup against production without environment approval. AC-14, AC-15.

## Acceptance criteria coverage

AC-1 and AC-3 are covered by the welcome and route guard checks. AC-2 is covered by session restore and startup value checks. AC-4 to AC-8 are covered by signup, delivery, verification, and password sign in checks. AC-9 and AC-17 are covered by protected route and alias checks. AC-10 and AC-11 are covered by pickup address checks. AC-12 to AC-15 are covered by provider verification, identity, Redis, and exchange checks. AC-16 is covered by Website2 checks. AC-18 is covered by rate limit and resend checks. AC-19 is covered by native refresh and logout checks.
