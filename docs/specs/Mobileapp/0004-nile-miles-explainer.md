# 0004. Add a Nile Miles explainer screen

**Date**: 2026-10-08
**Status**: In Progress

## Summary

Customers need a clear place to understand Nile Miles, see their current balance, and continue to the redemption screen. This decision adds a dedicated screen linked from Settings and reuses the authenticated balance endpoint. It keeps the screen informative without repeating reward prices or making claims that current backend paths do not consistently support.

## Context

The Mobileapp already has a Nile Miles balance in Profile, a redemption screen, and a general Gamification Hub. Settings currently has a Saved items row. There is no dedicated screen that explains how Miles are earned and used. The redemption screen currently uses a locally defined reward list. Although the backend exposes an active reward list, the mobile screen does not load it.

The current balance endpoint returns the signed in customer's `currentMiles`. Purchase awards are calculated at one Mile per KSh 10, with a 2x Premium multiplier in the canonical worker. The code also contains older purchase and referral paths with different behavior. The customer facing explanation must not claim a fixed referral amount or an exact award time.

The project requires a permanent light design for Mobileapp screens. The screen should reuse existing account navigation and authenticated API patterns. No matching Nile Miles feature exists in the shared scope.

## Requirements

**User stories**:

* As a customer, I want to understand Nile Miles so that I know how I can earn and use them.
* As a customer, I want to see my current Miles balance and open the redemption screen so that I can decide what to do next.

**Acceptance criteria**:

* **AC-1**: Settings replaces the Saved items row with a Nile Miles row that opens the Nile Miles explainer screen. The Favorites screen remains available through its other existing entry points.
* **AC-2**: The screen shows the signed in customer's live Miles balance from the existing authenticated Nile Miles status endpoint.
* **AC-3**: The screen explains the documented purchase rate as one Mile per KSh 10 for regular purchases and 2x Miles for Premium purchases.
* **AC-4**: The screen says that eligible purchases and eligible referrals may earn Miles, without claiming a specific purchase award time or a fixed referral amount.
* **AC-5**: The screen explains that Miles may be used for rewards and links to the existing Redeem screen for its redemption options. It does not duplicate those options or claim that they are current or backend verified.
* **AC-6**: The screen explains, in line with the Mobileapp Terms of Service, that Miles have no cash value, cannot be transferred, and that rewards are subject to availability.
* **AC-7**: The screen refreshes the balance whenever it gains focus. It shows loading state, a real numeric zero balance on a successful empty account response, and a visible error with retry on request failure. A failed or invalid response is never shown as a zero balance. Only the latest request may update the displayed balance.
* **AC-8**: The page follows the existing Nile Flow light design system, uses native icons and text without new image assets, and supports the app's language fallback.

## Options considered

### Option 1: Add a dedicated explainer screen

Create a new screen between Settings and the existing redemption flow. It presents the balance and learning content, then sends customers to the existing Redeem screen.

**Pros**:

* Gives Nile Miles a clear entry point without mixing explanations into redemption.
* Reuses the authenticated balance endpoint and current Redeem screen.
* Avoids duplicating reward details that can become stale.

**Cons**:

* Adds one route and one screen to maintain.
* The earning explanation must stay limited while older backend award paths remain inconsistent, and the existing Redeem list may not match active backend rewards.

### Option 2: Add the explanation to Redeem

Extend the existing redemption screen with the balance explanation and learning sections.

**Pros**:

* Keeps learning and redemption in one place.
* Requires no additional route.

**Cons**:

* Makes a transaction focused screen longer and less direct.
* Does not provide a distinct Nile Miles destination from Settings.

### Option 3: Expand Gamification Hub

Add Nile Miles education to the existing Gamification Hub.

**Pros**:

* Uses an existing engagement screen and route.
* Keeps gamification features in a single area.

**Cons**:

* The Hub's check in, spin, and referral actions do not provide a clear home for the full rewards explanation.
* Customers looking for their loyalty balance may not expect to find it in the general Hub.

## Decision

**Chosen option**: Option 1: Add a dedicated explainer screen

Add a Nile Miles screen reachable from Settings. Show the live balance first, followed by how to earn, when Miles may apply, the Premium multiplier, and how to redeem. Link to Redeem for its redemption options without presenting them as current or backend verified.

**Implementation skills**: `expo-overview` (`nileflow2026/NileFlow`, `.agents/skills/expo-overview/`) · `expo-router` (`nileflow2026/NileFlow`, `.agents/skills/expo-router/`) · `expo-native-ui` (`nileflow2026/NileFlow`, `.agents/skills/expo-native-ui/`)

## Rationale

The customer asked for an explanation and a route from Settings, while the app already has separate screens for account engagement and redemption. A dedicated page makes the learning task clear and preserves those existing screens. Reusing the authenticated balance endpoint avoids creating another source of truth.

The mobile Redeem screen currently uses a local reward list that can diverge from active backend rewards. Keeping redemption details on that screen avoids duplicating them here, but the explainer must not present them as current or authoritative. Avoiding exact referral amounts or award timing also reduces the risk of misleading customers.

## Feature design

**Data model sketch**:

No new entity, field, or persistence is required. Read `currentMiles` for the signed in customer from the existing Nile Miles status endpoint. Do not load earning or redemption history.

**API surface**:

| Endpoint or action | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/nilemiles/nilemiles/status` | GET | No customer supplied identifier. The backend resolves the customer from the authenticated request. | `currentMiles` as a nonnegative safe integer; numeric `0` when the customer has no Miles record | Required bearer session through the shared API client | 401 for missing or invalid session, 500 for a backend failure, missing or invalid `currentMiles` rejected by the screen |
| `/Redeem` | Navigation | None | Existing mobile redemption options and costs, which are not guaranteed to match active backend rewards | Existing signed in app flow | Preserve existing Redeem behavior |

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Load balance | Signed in customer's `currentMiles` | `GET /api/nilemiles/nilemiles/status`; the backend derives identity from the authenticated user and reads Appwrite user preferences or the existing Nile Miles document |
| Explain regular purchase earnings | One Mile per KSh 10, rounded down | Canonical Nile Miles worker calculation, `Math.floor(orderTotal / 10)` |
| Explain Premium earnings | 2x the base purchase Miles | Canonical worker Premium multiplier and the existing Nile Miles product rule |
| Explain eligible purchases | Only qualifying purchases may earn Miles; do not state exact award timing | Existing loyalty terms and the user's confirmed copy constraint |
| Explain referral earnings | Eligible referrals may earn Miles; do not show an amount | User confirmed this wording because backend referral paths record conflicting amounts |
| Explain redemption | Miles may be used for rewards; no specific rewards or costs are claimed | Existing Redeem screen; its reward list is local and may not match active backend rewards |
| Explain restrictions | Miles have no cash value, cannot be transferred, and rewards depend on availability | `Mobileapp/app/(Screens)/TermsOfService.jsx`, Nile Miles Loyalty Program section |

**Key invariants**:

* The shared authenticated API client is the only network client used by the screen.
* The screen must not send a user identifier to choose which customer's balance is returned.
* A network failure or malformed balance response must not be presented as zero.
* Accept only a nonnegative safe integer for `currentMiles`; treat missing, null, negative, fractional, or unsafe values as an error.
* Do not show fixed referral amounts, exact award timing, or hardcoded reward costs.
* Do not describe the existing Redeem list as current or backend verified.
* Refresh the balance on screen focus and after an error retry.
* Ignore responses from older requests when a newer focus or retry request has started.

**Security model**:

Only the authenticated customer may read their own balance. The backend resolves the customer from the bearer session. The screen must not log the balance or any authentication data.

**Configuration required**:

None.

**Critical test scenarios**:

* Happy path: open Settings, select Nile Miles, load the authenticated balance and show the agreed explainer content, verifies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-8**.
* Empty balance: a successful response with `currentMiles` equal to zero shows a real zero balance, verifies **AC-2**, **AC-7**.
* Failure and recovery: a failed request or a missing, null, negative, fractional, or unsafe balance shows an error and retry; a successful empty account response shows numeric zero, verifies **AC-7**.
* Focus refresh: spend Miles on Redeem, return to the explainer, and confirm the balance is reloaded. If requests finish out of order, the older response does not replace the newest balance, verifies **AC-5**, **AC-7**.
* Copy safety: confirm no fixed referral amount, award timing, reward cost, or claim that Redeem options are current appears, verifies **AC-4**, **AC-5**.
* Session protection: confirm the request uses the signed in session and does not accept another user's identifier, verifies **AC-2**.

## Build plan

No build approach is recorded for this mobile only feature. Assume a Tracer Bullet approach, which completes the path from Settings through live balance to Redeem before expanding. This screen needs no database migration or new endpoint.

1. Replace the Saved items Settings row with Nile Miles and create the explainer route, with the live authenticated balance request and Redeem navigation, satisfies **AC-1**, **AC-2**, **AC-5**, **AC-7**.
2. Add the approved explainer sections using the light design system, native icons, accessible text, and the canonical English locale keys, satisfies **AC-3**, **AC-4**, **AC-6**, **AC-8**.
3. Validate the settings route, API success and error states, retry, focus refresh, and copy constraints, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**, **AC-7**, **AC-8**.

## Consequences

**Positive**:

* Customers can find an explanation of Nile Miles from Settings.
* The balance stays tied to the authenticated backend account.
* The explainer avoids duplicating redemption details.

**Negative / tradeoffs**:

* Customers will not see referral amounts or exact purchase award timing on this screen.
* The screen adds another route and a balance request each time it regains focus.

**Neutral**:

* There is no database migration, new API endpoint, or new package.
* English is the canonical source for new locale keys, and other languages use the existing fallback behavior.

## Follow-up

* [ ] Reconcile older purchase and referral award paths so their timing, amounts, and Premium handling match the canonical rules.
* [ ] Connect the Mobileapp Redeem screen to the backend active reward list so displayed options match server eligibility.
* [ ] Mobile specific Expo skill guidance is not listed in `AGENTS.md`. Consider recording its pointers in `Mobileapp/AGENTS.md` and linking that file from the root guidance.
* [ ] The `expo-ui` skill was unavailable during design. Consider making it available before future work that introduces native controls beyond existing app patterns.
