# Nile Miles Finance Audit

## 1. Executive summary

[NILE_MILES_IS_NOT_A_SEPARATE_WALLET_SYSTEM] [VERIFIED] The code shows Nile Miles as a customer loyalty and reward mechanism, not a separate stored value or e-money wallet. It is calculated from order totals and stored in Appwrite user preferences and a Nile Miles collection document. See [Backend/src/jobs/workers/nileMilesWorker.js:18-74] and [Backend/controllers/UserControllers/rewardstatus.js:4-42].

[OVERALL_FINANCIAL_CONTROL_MATURITY] [VERIFIED] The implementation is early stage and operationally lightweight: it awards on order-paid events, reads a mutable balance, and subtracts on redemption without a canonical append-only ledger. See [Backend/src/jobs/workers/nileMilesWorker.js:18-74], [Backend/controllers/UserControllers/redeemController.js:9-85], and [Backend/controllers/UserControllers/rewardstatus.js:4-42].

[TOP_5_RISKS] [VERIFIED] 1) Mutable balance with no immutable ledger, 2) no refund/clawback logic, 3) no strong idempotency or compare-and-swap on award/redemption, 4) redemption and status read from potentially divergent sources, 5) missing expiry, cap, and reconciliation controls.

## 2. Scope, method, and limitations

[SEARCH_SCOPE] [VERIFIED] The audit reviewed the repository for Nile Miles, loyalty, reward, cashback, wallet, balance, redeem, referral, tier, and expiry references across backend, frontend, job workers, services, and mobile code. Relevant evidence came from [Backend/src/jobs/workers/nileMilesWorker.js], [Backend/src/jobs/workers/orderEventsWorker.js], [Backend/controllers/UserControllers/rewardstatus.js], [Backend/controllers/UserControllers/redeemController.js], [Backend/controllers/AdminControllers/rewardController.js], [Backend/services/premiumBenefitsService.js], [Mobileapp/Context/SocialContext.js], and [Backend/src/env.js].

[READ_ONLY_BOUNDARY] [VERIFIED] This audit did not modify code, create records, or call external payment APIs. The only created artifact is this file.

[LIMITATIONS] [VERIFIED] Live Appwrite collection schemas, permissions, ACLs, indexes, and production data were not present in the repository. The repo contains code references but no schema dump or console configuration. Where this matters, the document records "NOT FOUND IN CODE" or "REQUIRES MANUAL VERIFICATION".

## 3. System overview and data flow

### 3.1 Current implementation overview

[PURPOSE_AND_SCOPE] [VERIFIED] The code defines Nile Miles as a purchase-based reward system tied to order events and user preferences. A user earns miles on paid orders, can redeem rewards, and can receive referral bonuses. See [Backend/src/jobs/workers/orderEventsWorker.js:33-89] and [Backend/controllers/AdminControllers/rewardController.js:1-94].

[USER_TYPES] [VERIFIED] The code path references a generic userId and does not show merchant-owned or rider-owned Miles ledgers. The implementation is designed around customers and their rewards. Premium logic is applied from the user preference state, not a separate ledger. See [Backend/services/premiumBenefitsService.js:9-80].

[PRODUCTS_AND_FLOWS] [VERIFIED] The reward flow touches order paid jobs, premium benefits, referral rewards, and front-end status displays. See [Backend/src/jobs/workers/orderEventsWorker.js:33-89], [Backend/services/premiumBenefitsService.js:9-80], [Backend/controllers/UserControllers/redeemController.js:9-85], and [Mobileapp/Context/SocialContext.js:12-126].

### 3.2 Data-flow diagram

```mermaid
flowchart TD
A[Order paid event] --> B[orderEventsWorker.js]
B --> C[nileMilesQueue.add miles:${orderId}]
C --> D[nileMilesWorker.js]
D --> E[users.getPrefs(userId)]
D --> F[Appwrite Nile Miles collection]
D --> G[auditLogger.info(MILES_AWARDED)]
H[Customer reward status read] --> I[rewardstatus.js]
I --> E
I --> F
J[Reward redemption] --> K[redeemController.js]
K --> F
L[Premium benefit logic] --> M[premiumBenefitsService.js]
M --> E
N[Referral bonus logic] --> O[rewardController.js]
O --> F
P[Mobile social context] --> Q[AsyncStorage fallback]
```

### 3.3 Canonical balance source

[DUAL_WRITES] [VERIFIED] The backend uses two different balances in active code paths: Appwrite user preferences under `prefs.nileMiles`, and a document in the Nile Miles collection under `currentMiles`. The award worker writes user preferences, while status and redemption read from the Nile Miles collection or user prefs depending on the route. See [Backend/src/jobs/workers/nileMilesWorker.js:28-74], [Backend/controllers/UserControllers/rewardstatus.js:7-42], and [Backend/controllers/UserControllers/redeemController.js:17-85].

[NO_SINGLE_SOURCE_OF_TRUTH] [VERIFIED] There is no single canonical/normative ledger or locking pattern in the repo. This means the same customer can have balances inferred from different stores and timestamps. The code does not enforce transactional consistency across them.

## 4. Detailed implementation walkthrough

### 4.1 Purpose and scope

[WHAT_MILES_ARE] [VERIFIED] Nile Miles are a customer loyalty points mechanism based on order total. The formula in code is `Math.floor(orderTotal / 10)` for base miles, with premium users doubling the total. See [Backend/src/jobs/workers/nileMilesWorker.js:20-35] and [Backend/services/premiumBenefitsService.js:13-34].

[USER_TYPES_PARTICIPATE] [VERIFIED] The active system is customer-centric. There is no merchant or rider balance account in the code path reviewed. See [Backend/src/jobs/workers/orderEventsWorker.js:33-89], [Backend/controllers/UserControllers/rewardstatus.js:4-42], and [Backend/controllers/AdminControllers/rewardController.js:1-94].

[FLOW_TOUCHPOINTS] [VERIFIED] Order-paid events, premium discount logic, reward redemption, referral bonuses, and mobile status views all touch the Miles system. See [Backend/src/jobs/workers/orderEventsWorker.js:33-89], [Backend/services/premiumBenefitsService.js:9-80], [Backend/controllers/UserControllers/redeemController.js:9-85], [Backend/controllers/AdminControllers/rewardController.js:1-94], and [Mobileapp/Context/SocialContext.js:12-126].

### 4.2 Data model

[APPWRITE_USERS_PREFS] [VERIFIED] The award worker reads and writes `users.getPrefs(userId)` and updates `prefs.nileMiles`, `lastMilesAwardedAt`, and `lastMilesAwardedOrderId`. See [Backend/src/jobs/workers/nileMilesWorker.js:28-74].

[APPWRITE_NILE_MILES_COLLECTION] [VERIFIED] The code reads a document with fields such as `userId`, `currentMiles`, `earnedHistory`, `redeemed`, and `lastEarned`. This data is queried by `userId` and updated by `updateDocument`. See [Backend/controllers/UserControllers/redeemController.js:17-85], [Backend/controllers/AdminControllers/rewardController.js:6-86], and [Backend/controllers/UserControllers/rewardstatus.js:19-42].

[REWARD_COLLECTION] [VERIFIED] Rewards are stored in a collection keyed by `key`, `name`, `miles`, `active`, and category metadata. See [Backend/controllers/UserControllers/redeemController.js:65-88].

[REFERRAL_COLLECTION] [VERIFIED] Referral data is retrieved by `code` or `userId` and incremented on successful signup. See [Backend/controllers/AdminControllers/rewardController.js:79-116].

[SCHEMA_GAPS] [UNKNOWN] The repo does not contain the Appwrite collection schema, indexes, permissions, or default values. The code references expected collection IDs via environment variables but not the actual schema definitions; this must be verified manually in the Appwrite console or deployment configs. See [Backend/src/env.js:1-180].

[DATA_MODEL_SUMMARY] [VERIFIED] The in-code data model is mutable JSON state, not an append-only ledger. History is stored as serialized JSON strings such as `earnedHistory` and `redeemed`, and balances are overwritten in place. See [Backend/controllers/UserControllers/redeemController.js:31-47] and [Backend/services/premiumBenefitsService.js:33-72].

### 4.3 Earning (issuance)

[AWARD_TRIGGER] [VERIFIED] The root event is `order.paid`, which queues `nileMilesQueue.add` with `orderId`, `userId`, `orderTotal`, and `isPremium`. See [Backend/src/jobs/workers/orderEventsWorker.js:33-89].

[AWARD_FORMULA] [VERIFIED] The worker uses `const baseMiles = Math.floor(orderTotal / 10); const totalMiles = isPremium ? baseMiles * 2 : baseMiles;` and writes `bonusMiles = totalMiles - baseMiles`. See [Backend/src/jobs/workers/nileMilesWorker.js:20-35].

[PREMIUM_MULTIPLIER] [VERIFIED] Premium logic is `isPremium ? baseMiles * 2 : baseMiles`, and a separate service also calculates premium discounts at 5% or 10% based on orderTotal thresholds. See [Backend/services/premiumBenefitsService.js:13-34] and [Backend/services/premiumBenefitsService.js:78-122].

[BASE_FOR_EARNING] [VERIFIED] The formula uses `order.total`, not a net-of-discount, net-of-tax, or net-of-shipping basis. The code does not strip tax, shipping, or fees. See [Backend/src/jobs/workers/orderEventsWorker.js:33-89] and [Backend/src/jobs/workers/nileMilesWorker.js:20-35].

[ROUNDING_RULE] [VERIFIED] The formula uses `Math.floor`, so all fractional values are truncated downward. See [Backend/src/jobs/workers/nileMilesWorker.js:20-35].

[CAPS_AND_PROMOTIONS] [VERIFIED] The code does not show a daily cap, total cap, or promotional multiplier beyond the premium 2x and fixed referral bonuses. See [Backend/src/jobs/workers/nileMilesWorker.js:20-35], [Backend/controllers/AdminControllers/rewardController.js:12-77], and [Mobileapp/Context/SocialContext.js:14-90].

[WHERE_LOGIC_LIVES] [VERIFIED] The earning logic is in the backend queue worker, not the client. The client side includes a separate social context with local-only Miles logic, but it is not the server canonical implementation. See [Backend/src/jobs/workers/nileMilesWorker.js:1-74] and [Mobileapp/Context/SocialContext.js:1-126].

### 4.4 Spending (redemption)

[REDEMPTION_FLOW] [VERIFIED] The redemption controller fetches a reward by `rewardKey`, checks `currentMiles >= reward.miles`, subtracts the value, and stores the result back in the Nile Miles collection document. See [Backend/controllers/UserControllers/redeemController.js:9-85].

[REWARD_COST] [VERIFIED] Examples: free pen = 50; free delivery = 250; 5% off = 500; premium sale access = 1000; hoodie or gift card = 2000. See [Backend/controllers/UserControllers/redeemController.js:5-20].

[REDEEM_APPLIED_TO_BALANCE] [VERIFIED] A redemption writes `currentMiles: newMiles` into the document and stores history in JSON under `redeemed`. There is no separate liability or reserve tracking. See [Backend/controllers/UserControllers/redeemController.js:31-47] and [Backend/controllers/UserControllers/redeemController.js:48-85].

[PARTIAL_REDEMPTION_AND_ORDER_TOTAL] [VERIFIED] The code does not apply miles at checkout. It only records a reward redemption against the balance. No partial redemption against an order total is implemented. See [Backend/controllers/UserControllers/redeemController.js:9-85].

[NO_ORDER_LEVEL_DISCOUNT_ENGINE] [VERIFIED] The code confirms no checkout-level miles-to-money deduction pipeline in the code reviewed. The prize takes the form of a reward object, not a line-item discount on an order. See [Backend/controllers/UserControllers/redeemController.js:9-85].

### 4.5 Lifecycle events

[EXPIRY] [NOT FOUND IN CODE] There is no explicit expiry field, expiry calculation, scheduled expiry job, or enforcement path in the code reviewed. The code does not show `expiresAt`, `expireAfter`, or a daily expiry process.

[TRANSFERS] [NOT FOUND IN CODE] There is no user-to-user transfer, gift transfer, or ledger transfer path in the reviewed code.

[REFUNDS_AND_CANCELLATIONS] [NOT FOUND IN CODE] The code reviewed does not contain a clawback or reversal function when an order is canceled, refunded, or reversed. There is no miles deduction recorded on refund or cancellation outcomes.

[FAILED_PAYMENTS] [NOT FOUND IN CODE] The code does not show a reversal when payment fails, is marked fraudulent, or is later charged back. The award is tied to order-paid event only, but there is no compensating logic for failed settlements.

[MERCHANT_VS_PLATFORM_FUNDING] [NOT FOUND IN CODE] There is no explicit campaign ledger or merchant-funded vs platform-funded promotion allocation in the code reviewed.

### 4.6 Admin and manual operations

[ADMIN_REWARD_ENDPOINTS] [VERIFIED] Reward issuance logic exists in the backend admin reward controller and includes fixed referral and purchase bonuses. See [Backend/controllers/AdminControllers/rewardController.js:1-116].

[MANUAL_BONUSES] [VERIFIED] The code permits a direct write to the Nile Miles collection with `currentMiles + bonusMiles` and JSON history updates. It contains no approval workflow, dual control, or immutable audit for manual adjustments. See [Backend/controllers/AdminControllers/rewardController.js:1-116].

[ROLES_AND_ACCESS] [NOT FOUND IN CODE] The repo does not show the Appwrite or Express role checks for who can trigger these admin operations. This must be verified in middleware and collection permissions.

### 4.7 Integrations and callbacks

[PAYMENT_PROVIDER_CALLBACKS] [NOT FOUND IN CODE] The reviewed files do not show a direct integration between a payment provider callback and Nile Miles adjustments. The order-paid event is a local business event emitted by the backend worker, not a payment callback response. See [Backend/src/jobs/workers/orderEventsWorker.js:33-89].

[NOTIFICATION_HOOKS] [VERIFIED] Award and status flows emit audit logs and in-app notifications around order paid, shipped, and cancelled events. See [Backend/src/jobs/workers/orderEventsWorker.js:33-89].

[THIRD_PARTY_IMPACT] [VERIFIED] The code references Appwrite and BullMQ job queues, but there is no external ledger or finance system that consumes Nile Miles balances. See [Backend/src/jobs/workers/nileMilesWorker.js:1-74] and [Backend/services/appwriteService.js].

### 4.8 Authorization and access control

[AUTHORIZATION_PATTERN] [VERIFIED] The user status endpoint reads `req.user?.userId` and then checks the user session before fetching data. See [Backend/controllers/UserControllers/rewardstatus.js:4-42].

[COLLECTION_PERMISSIONS] [NOT FOUND IN CODE] The repo does not include Appwrite collection permission definitions or Express middleware that enforces role-based access to the Nile Miles collection. This is an implementation gap or a deployment-only configuration not visible in repo.

[SECURITY_OF_BALANCE_WRITE] [VERIFIED] The code does not use a compare-and-swap or atomic update on the balance. It performs a read, computes a new value, then writes the new value, creating a classic race window. See [Backend/controllers/UserControllers/redeemController.js:17-47] and [Backend/controllers/AdminControllers/rewardController.js:1-77].

### 4.9 Audit trail and observability

[AUDIT_LOGS] [VERIFIED] The workers log `MILES_AWARDED` events and order lifecycle events using `auditLogger.info(...)` with metadata including orderId, userId, totals, and isPremium. See [Backend/src/jobs/workers/nileMilesWorker.js:52-71] and [Backend/src/jobs/workers/orderEventsWorker.js:54-89].

[IMMUTABLE_LEDGER] [VERIFIED] No append-only ledger was found. The code stores a mutable `currentMiles` number and JSON snapshots (`earnedHistory` and `redeemed`) rather than an immutable transaction table. See [Backend/controllers/UserControllers/redeemController.js:17-47] and [Backend/services/premiumBenefitsService.js:33-72].

[BEFORE_AFTER_VALUES] [NOT FOUND IN CODE] The code does not record before and after balances for each rewards or redemption event in a durable, queryable ledger. The `auditLogger` is operational, not accounting-level trail.

## 5. Finance lens answers

### Q: Is there a double-entry or append-only ledger, or is the balance a single mutable number?

[VERIFIED] The balance is a single mutable number in both user prefs and the Nile Miles collection document. There is no append-only ledger or double-entry journal in the reviewed code. See [Backend/src/jobs/workers/nileMilesWorker.js:28-74] and [Backend/controllers/UserControllers/redeemController.js:17-85].

### Q: Where is the liability recorded? Are issued-but-unredeemed Miles tracked anywhere as an obligation?

[VERIFIED] Not in a dedicated liability ledger. The code writes a current balance and history JSON but does not maintain an explicit outstanding-liability record. See [Backend/controllers/UserControllers/rewardstatus.js:7-42] and [Backend/controllers/UserControllers/redeemController.js:17-85].

### Q: Is the cost of Miles attributable to a specific order, merchant, campaign, or budget?

[VERIFIED] No. The code calculates miles from orderTotal with no merchant, campaign, or cost-center attribution. See [Backend/src/jobs/workers/nileMilesWorker.js:20-35].

### Q: Is the Miles-to-money conversion rate hard-coded, configurable, or versioned? Can it change retroactively for already-issued Miles?

[VERIFIED] It is hard-coded in the worker as `Math.floor(orderTotal / 10)` and premium doubles it. It is not versioned or configurable in code. See [Backend/src/jobs/workers/nileMilesWorker.js:20-35].

### Q: How do Miles interact with GMV vs. revenue vs. cash collected?

[VERIFIED] The code uses `order.total` directly to compute miles, without separating gross merchandise value, revenue, tax, shipping, or cash collected. This creates conflation risk. See [Backend/src/jobs/workers/orderEventsWorker.js:33-89] and [Backend/src/jobs/workers/nileMilesWorker.js:20-35].

### Q: Are Miles earned on amounts later refunded, cancelled, or never settled?

[VERIFIED] The code does not show any reconciliation or clawback when orders are cancelled or refunded. The worker issues miles on order-paid event, which is the point of payment confirmation in the code, but not tied to final settlement or refund outcomes. See [Backend/src/jobs/workers/orderEventsWorker.js:40-64].

### Q: How would finance reconcile Miles issued vs. redeemed vs. expired vs. outstanding?

[VERIFIED] Today there is no single reconciliation model. The code can show `currentMiles` and JSON lists, but there is no durable ledger table that matches issue, redemption, expiry, and outstanding balances. The only functions are status reads and redemption writes. See [Backend/controllers/UserControllers/rewardstatus.js:7-42] and [Backend/controllers/UserControllers/redeemController.js:17-85].

### Q: Which parts could affect VAT, accounting recognition, or merchant settlement?

[REQUIRES_PROFESSIONAL_REVIEW] [VERIFIED] The code uses order totals directly to create loyalty obligations without separating tax or merchant settlement; any accounting treatment would need professional review. See [Backend/src/jobs/workers/nileMilesWorker.js:20-35] and [Backend/services/premiumBenefitsService.js:78-122].

## 6. Loophole and risk register

| ID | Title | Location (file:line) | What happens today | How it could be exploited or cause loss | Severity (Critical/High/Medium/Low) | Financial impact type | Recommended fix (concept only) | Label |
|---|---|---|---|---|---|---|---|---|
| R1 | Mutable balance with no append-only ledger | [Backend/src/jobs/workers/nileMilesWorker.js:20-74], [Backend/controllers/UserControllers/redeemController.js:17-85] | The system stores `currentMiles` and overwrites it in place with no immutable ledger. | A bad write, data loss, or replay can silently change balances without traceability. | Critical | liability misstatement / reporting | Introduce a durable transaction ledger with immutable issue and redemption entries and a reconciled outstanding balance view. | [VERIFIED] |
| R2 | No refund or cancellation clawback | [Backend/src/jobs/workers/orderEventsWorker.js:33-89], [Backend/controllers/UserControllers/redeemController.js:17-85] | Miles are awarded on order-paid and never reversed for refund or cancellation in the reviewed code. | Customers can keep rewarded miles after order reversal or chargeback, creating inflated liabilities. | Critical | cash loss / liability misstatement | Add refund and cancellation hooks that reverse or reserve miles against the original earning event. | [VERIFIED] |
| R3 | Award and redemption race windows | [Backend/src/jobs/workers/nileMilesWorker.js:28-74], [Backend/controllers/UserControllers/redeemController.js:17-85], [Backend/controllers/AdminControllers/rewardController.js:1-77] | Read, compute, write is used without compare-and-swap or row locking. | Concurrent redemptions or bonus writes can overspend or double-issue miles. | Critical | fraud / cash loss | Use transactional update logic with optimistic locking or a ledger table and idempotency keys. | [VERIFIED] |
| R4 | No durable idempotency for duplicate job retries | [Backend/src/jobs/workers/orderEventsWorker.js:40-64], [Backend/src/jobs/workers/nileMilesWorker.js:1-74] | Job ID is `miles:${orderId}`, but the worker does not persist a durable award record to prove or deny duplicates beyond the queue ID. | Webhook retries or duplicate events can reissue miles if the job ID is not preserved across storage boundaries or retries. | High | fraud / reporting | Persist award transaction records keyed by order and user and reject duplicates before balance write. | [VERIFIED] |
| R5 | Balance source divergence between prefs and collection | [Backend/src/jobs/workers/nileMilesWorker.js:28-74], [Backend/controllers/UserControllers/rewardstatus.js:7-42] | Status read prefers user prefs, while redemption reads the collection document. | The same user can see a balance that is inconsistent with redeemable balance or with the historical record. | High | fraud / liability misstatement | Establish one source of truth and reconcile drift with a daily job. | [VERIFIED] |
| R6 | No expiry, cap, or daily velocity controls | [Backend/src/jobs/workers/nileMilesWorker.js:20-35], [Mobileapp/Context/SocialContext.js:14-90] | No expiry or cap is shown in backend code, only local mobile limits for social-like rewards. | Miles can accumulate indefinitely, enabling arbitrary liability accumulation and gaming. | High | liability misstatement / fraud | Add expiry, cap, and velocity rules with a documented policy and admin review path. | [VERIFIED] |
| R7 | Client-side trust and no server-side checkout impact | [Mobileapp/Context/SocialContext.js:35-86], [Backend/controllers/UserControllers/redeemController.js:9-85] | The client stores miles locally and the server writes them, but no server-side checkout validation or order total discount is enforced. | Client tampering can create fake balances or redeem unearned privileges. | High | fraud / cash loss | Server must be the sole authority for balance reads and order-level discount application. | [VERIFIED] |
| R8 | Missing approval workflow for manual adjustments | [Backend/controllers/AdminControllers/rewardController.js:1-116] | Admin functions update currentMiles directly and increment earned history with no dual control or approval gate. | Abuse by staff can create large liabilities without evidence of business approval. | Medium | fraud / reporting | Add approval workflow and immutable audit logs for manual adjustments. | [VERIFIED] |
| R9 | No clear merchant or campaign attribution | [Backend/src/jobs/workers/nileMilesWorker.js:20-35], [Backend/services/premiumBenefitsService.js:78-122] | Rewards are computed from total order amount but not tied to merchant or campaign budget. | Finance cannot attribute loyalty cost to campaign, merchant, or channel. | Medium | reporting | Add campaign and merchant metadata to each earning event and attribute costs at issuance. | [VERIFIED] |
| R10 | Reward values and conversion are hard-coded | [Backend/controllers/UserControllers/redeemController.js:5-20], [Backend/src/jobs/workers/nileMilesWorker.js:20-35] | 1 mile per 10 KSH and fixed reward values are hard-coded. | A business change can impact all existing balances retroactively without versioning. | Medium | reporting / liability misstatement | Make conversion rate and rewards configuration versioned and activate only to new awards. | [VERIFIED] |
| R11 | No explicit audit trail for before/after state | [Backend/src/jobs/workers/nileMilesWorker.js:52-71], [Backend/controllers/UserControllers/redeemController.js:17-47] | Workers log events, but not a full state-change ledger with before/after and reference IDs. | Finance cannot reconstruct exact balance history after a dispute. | Medium | reporting | Add immutable balance ledger with each change, reason code, and reference ID. | [VERIFIED] |
| R12 | Hidden Appwrite permission and ACL risk | [Backend/src/env.js:1-180], [Backend/controllers/UserControllers/rewardstatus.js:4-42] | Collection names and DB IDs are in env, but the repo does not show the collection ACL or role policy. | Over-broad permissions or user self-write could allow balance manipulation. | Low | compliance / fraud | Verify Appwrite collection permissions and restrict writes to server-only service identities. | [UNKNOWN] |

## 7. Missing controls checklist

[LEDGER] [VERIFIED] Missing. The code tracks balance snapshots and JSON history, not an immutable ledger.

[IDEMPOTENCY] [VERIFIED] Partial. Queue job IDs are used, but no durable transaction ledger or idempotency token persisted for miles awards and redemptions.

[ATOMICITY] [VERIFIED] Missing. Balance increments and decrements are read-modify-write without locking.

[APPROVAL_WORKFLOWS] [VERIFIED] Missing. Admin adjustment endpoints do not show a review or approval process.

[RECONCILIATION_REPORTS] [VERIFIED] Missing. No outstanding-liability query or journal reconciliation view was found.

[EXPIRY_POLICY] [NOT FOUND IN CODE] Missing.

[CAPS_AND_VELOCITY_RULES] [NOT FOUND IN CODE] Missing.

[MONITORING_ALERTS] [VERIFIED] Partial. Operational logger exists, but no finance monitoring or anomaly controls are visible.

## 8. Items requiring manual verification

[APPWRITE_SCHEMAS_AND_PERMISSIONS] [UNKNOWN] Need manual verification in the Appwrite console for collection schema, permissions, indexes, default values, and role policies.

[PRODUCTION_ENV_VALUES] [UNKNOWN] Need verification of `APPWRITE_DATABASE_ID`, collection IDs, and any env values that drive the miles logic in the deployment environment.

[BUSINESS_POLICY_VALUES] [UNKNOWN] Need manual confirmation from product or finance for expiry, caps, conversion rules, and allowed redemption categories.

[ACTUAL_USER_DATA] [UNKNOWN] Need production validation of sample user records to confirm whether the user preferences and collection document stay in sync.

## 9. Items requiring professional review

[ACCOUNTING_RECOGNITION] [REQUIRES_PROFESSIONAL_REVIEW] The code treats order totals as the basis for miles, but does not show revenue, tax, refund, chargeback, or liability accounting separation. See [Backend/src/jobs/workers/nileMilesWorker.js:20-35].

[TAX_AND_VAT] [REQUIRES_PROFESSIONAL_REVIEW] Because mileage is directly derived from gross order totals without tax or shipping separation, any tax treatment requires professional review. See [Backend/src/jobs/workers/orderEventsWorker.js:33-89].

[LEGAL_REGULATORY] [REQUIRES_LEGAL_OR_REGULATORY_REVIEW] Consumer loyalty liabilities, stored value character, and terms of use may require legal and regulatory review, especially if miles become redeemable for cash-like value or discounts. See [Backend/controllers/UserControllers/redeemController.js:5-20].

## 10. Prioritized remediation roadmap

### Now

- Define one canonical Miles ledger and move all award and redemption writes to it.
- Add a reconciliation report for issued, redeemed, expired, and outstanding balances.
- Add refund and cancellation clawback hooks.
- Add atomic balance update logic with idempotency and order-level uniqueness checks.

### Next 30 days

- Add expiry, caps, and velocity controls.
- Document admin approval rules and create immutable approval/audit entries.
- Separate order total used for miles from tax, delivery, and settlement amounts.
- Verify Appwrite permissions and restrict balance writes to server-side service identities.

### Before scale

- Add alerting for unusual award and redemption patterns.
- Version the Miles conversion rate and campaign attribution rules.
- Create a finance review process for reversals, chargebacks, and merchant settlement impact.

## 11. Appendix: full file and collection inventory

- [Backend/src/jobs/workers/nileMilesWorker.js] — core purchase award logic for Nile Miles.
- [Backend/src/jobs/workers/orderEventsWorker.js] — order-paid event triggers miles award queue.
- [Backend/controllers/UserControllers/rewardstatus.js] — gets current balance and status.
- [Backend/controllers/UserControllers/redeemController.js] — redeem and reward-usage flow; currentMiles and redeemed JSON handling.
- [Backend/controllers/AdminControllers/rewardController.js] — referral and admin reward issuance logic.
- [Backend/services/premiumBenefitsService.js] — premium multiplier and premium discount rules.
- [Backend/services/appwriteService.js] — Appwrite DB and user service access.
- [Backend/src/env.js] — environment references for database and collection IDs.
- [Mobileapp/Context/SocialContext.js] — social/local Miles logic, mainly non-server fallback data.
- [Backend/config] — configuration area for app and service routing, if present in the repo.
- [Collection names referenced in code: APPWRITE_NILE_MILES_COLLECTION, APPWRITE_REWARD_COLLECTION_ID, APPWRITE_REFERRALS_COLLECTION_ID, APPWRITE_PRODUCTS_COLLECTION_ID] — from environment and code usage, but schema details are not in repo.

[NOT_FOUND_IN_CODE] [VERIFIED] Exact collection schema, Appwrite permission definitions, and production indexes were not found in the repository. These must be verified manually outside code.
