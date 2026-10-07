# 0001. Shared mobile push notifications

**Date**: 2026-10-06
**Updated**: 2026-10-07
**Status**: In Progress

## Summary

This decision gives Nile Flow one reliable route for mobile push alerts and adds an admin broadcast tool. The Backend will use Expo and the existing Redis queue, while Appwrite stores campaign records, delivery progress, and user consent. Customers can choose promotional pushes, and admins can review honest delivery results without seeing recipient identities.

## Context

The system already registers Expo push tokens on user records and has an Expo sender, a BullMQ notification queue, an Appwrite notification list, and a Notifications page in AdminDashboard. Those parts do not yet form one reliable path. Some sends happen directly and swallow failures, while the notification dispatcher can send through both Appwrite Messaging and Expo for the same event. User notification preferences have no customer facing control, and their current promotion default is enabled.

The request spans Backend, AdminDashboard, and Mobileapp. Admins need to send time sensitive notices to registered mobile devices, and customers need a clear choice for marketing pushes. Order and account events must continue to reach customers without duplicate paths. The product is intended to serve large audiences, so campaign work must be paged and resumable rather than held in one web request.

## Requirements

**User stories**:

* As a customer, I want important order and account changes to reach my phone so that I can act without repeatedly opening the app.
* As a customer, I want to control promotional pushes separately from service alerts so that I can choose whether marketing notices reach my device.
* As an admin, I want to compose, preview, send, and review mobile broadcasts so that customers receive timely promotions and service information.

**Acceptance criteria**:

* **AC-1**: On supported Android and iOS builds, a signed in user who grants operating system notification permission has an Expo push token registered to their authenticated user record. A missing permission or token is not reported as successful registration. Transient registration failures are logged and retried when the app becomes active.
* **AC-2**: Automatic mobile pushes use one centralized Expo delivery path backed by the existing `nf:notifications` BullMQ queue. The same event must not also send an Appwrite Messaging push. Existing email, SMS, WhatsApp, and in app behavior outside the push path remains intact.
* **AC-3**: Customers receive one normalized confirmation intent for a successful online payment, or an accepted cash on delivery order, followed by pushes for later changes to preparing, ready for dispatch, out for delivery, delivered, cancellation request received, and cancellation approval or rejection. If payment acceptance and order confirmation happen in the same Backend operation, they produce one normalized confirmation intent, not two. The later completed state does not create another delivery notice. New accounts created after rollout receive one welcome push after their first authenticated device registers. Successful password and email changes send security pushes when a token is registered and `notificationPreferences.security.push` allows them. That preference defaults to true when missing. Replayed events with the same event key do not create another push during the one year event receipt retention period. Expo and Appwrite cannot commit atomically, so a recovered pending receipt whose prior provider acceptance was not saved can produce a duplicate push; delivery is at least once, not exactly once.
* **AC-4**: The existing Mobileapp Notification Settings panel exposes promotional push consent. The first choice is off for existing and new users. Turning it on requests operating system permission when needed and explains that a registered token is also required. Turning it off prevents future promotional campaign delivery. Order and service alerts remain independent. When the app resumes and notification permission has been revoked, it unregisters the device token without prompting again. Logging out also unregisters the token.
* **AC-5**: AdminDashboard adds a Broadcasts tab to its existing Notifications page. Admins can compose a promotion, app update, or service announcement with a required title of at most 80 characters, a required body of at most 240 characters, and an optional allowlisted in app destination. A preview shows these values and a Backend calculated recipient estimate. A final confirmation is required before sending. Scheduling is not included.
* **AC-6**: A broadcast reaches users with a registered push token. Promotion campaigns additionally require `marketingPushEnabled` to be true. App update and service announcement campaigns do not require marketing consent. A campaign with no eligible recipients is not created or sent.
* **AC-7**: Each send is an idempotent operation. Repeating a request with the same admin and `Idempotency-Key` returns the same campaign, and must not create duplicate pushes or in app records. A different payload with the same key is rejected.
* **AC-8**: Campaign processing is asynchronous and durable. The API returns HTTP 202 only after a new campaign is saved and its work is accepted by the queue. If the record is saved but queue acceptance fails, the API returns HTTP 503 with the saved campaign ID and an explicit not queued result. An idempotent replay returns the saved campaign with its current status, without creating another send. The campaign records are the source of truth, and a recovery worker requeues pending work after a process or enqueue failure. It resumes from the saved cursor, drains pending delivery rows before moving to another page, and recovers a `sending` campaign when its deterministic queue job is missing or failed. When durable Redis is unavailable, the API does not claim that work was queued.
* **AC-9**: Campaign results distinguish the preview estimate from the final targeted count. The estimate uses currently registered tokens and current consent. The final snapshot includes users whose first push token was registered by the saved snapshot time, including candidates that later prove ineligible and are counted as skipped. Promotion delivery requires current consent and a consent timestamp no later than the snapshot time. Final counts include accepted by Expo, rejected, unresolved, and skipped recipients, and add up to the final targeted count. Once audience preparation finishes, the interface shows pending recipients while a campaign is active, derived as the final target minus those four outcome counts. Before then, it shows that the recipient snapshot is being prepared rather than showing a pending count. The interface explains that Expo acceptance does not prove a device displayed the notification.
* **AC-10**: Campaign history is paginated, newest first by creation time and then document ID, with a default page size of 20 and maximum of 100. Summaries show campaign ID, title, category, status, creation time, estimate, final target when available, outcome counts, and pending count when available. Detail shows content, category, lifecycle status, timestamps, estimate, actual target, and aggregate results only. It never exposes recipient names, IDs, or push tokens. While queued or sending, an open detail refreshes every 5 seconds and stops when processing ends.
* **AC-11**: A campaign can be cancelled only while queued and before recipient processing starts. Cancellation and worker start use the same Redis campaign lock, so exactly one transition wins. A queued cancellation creates no recipient rows or in app notices. A campaign retry action processes only confirmed transient failures, never accepted or ambiguous deliveries. The Backend classifies HTTP 429 and 5xx responses and Expo `MessageRateExceeded`, `MessageServerUnavailable`, and `InternalServerError` as transient. `DeviceNotRegistered` and other explicit ticket errors are permanent; network timeouts without a ticket are ambiguous. Automatic retries are limited to five attempts. An admin may retry a confirmed transient failure once, with up to five additional attempts. Repeating a retry while its delivery rows are already pending does not enqueue another copy. Counts show each recipient's latest state, not cumulative attempts. Ambiguous failures are reported unresolved and cannot be manually retried. Event recovery retries a pending receipt when Expo may have accepted a push but the Backend did not save the result. A small duplicate risk is accepted for that timeout or worker crash case.
* **AC-12**: Promotion pushes expire 24 hours after campaign creation, app update pushes expire after 30 days, and service announcement pushes expire after 7 days. The Backend saves each campaign's immutable `expiresAt` deadline at creation. Before creating an in app notice or attempting a push, the worker skips and counts a recipient if the deadline has passed. Otherwise, it creates the in app notice, then passes the remaining lifetime to Expo. If a push retry or recovery attempt occurs at or after expiry, it marks the delivery skipped and does not resend, but retains any in app notice created before expiry. Expired, opted out, or otherwise ineligible recipients are skipped and counted. A queued campaign cancelled before processing creates no recipient rows or notices. All automatic event pushes expire after 7 days.
* **AC-13**: A push tap opens the validated in app destination when present, otherwise the existing notification list. Foreground pushes continue to show a banner and notification list, and the existing sound mute preference remains effective.
* **AC-14**: Every campaign action and user preference update is authorized on the Backend. Only an authenticated user whose Backend role is exactly `admin` can preview, send, list, view, cancel, or retry campaigns. A customer can only read or change their own promotional consent. Campaign and delivery collections are private to the Backend service.
* **AC-15**: Campaign delivery records and automatic event receipts never copy raw push tokens or message bodies. Logs exclude tokens and user level delivery data. Invalid device tokens are removed from the user record. Detailed campaign delivery records and compact automatic event receipts are deleted after one year; campaign content and aggregate counts remain.
* **AC-16**: Production Android and iOS builds are verified on supported devices after Firebase client configuration and EAS FCM and APNs credentials are checked. The verification confirms token registration, a test push, foreground display, background display, and tap routing.
* **AC-17**: Before queueing an automatic event push, the Backend saves a durable receipt with the normalized event type, a server selected template version, recipient user ID, and deterministic in app notification ID. Supported automatic templates are fixed server owned copy, so this receipt data is sufficient to rebuild the notification and push without reading the original order or account record. If the in app notice is missing while its receipt is pending and being recovered or replayed, recovery recreates it with the same ID and owner permissions before continuing delivery. An accepted receipt is not used to recreate a notice later, so a notice cleared after delivery stays cleared. Receipts do not store rendered message text, raw event payloads, or push tokens. The Backend keeps each referenced template version available for at least 365 days after the last receipt is created with that version. An unsupported version or invalid receipt is marked unresolved and is not sent.

## Decision

**Chosen option**: Option 1, strengthen the existing Expo and BullMQ path and extend it for admin campaigns.

Keep Appwrite as the record store, Expo as the mobile push provider, and the existing BullMQ queue as the background worker. Use one centralized Expo sender for automatic events and admin broadcasts. Add explicit consent, durable campaign records, restricted delivery records, and aggregate reporting. Roll out the automatic event path and campaign feature in controlled steps.

## Feature design

**Data model sketch**:

| Entity | Fields and rules | Relationships |
|---|---|---|
| Existing user document | `pushToken` remains the single current token. Add optional indexed `pushTokenFirstRegisteredAt`, set when a token is first registered and preserve it across token refresh and removal; backfill existing registered users during rollout. Add optional indexed `marketingPushEnabled` Boolean, missing means false; optional `marketingPushConsentUpdatedAt` timestamp; optional `welcomePushSentAt` timestamp set when Expo accepts the welcome push. Existing accounts are marked already welcomed at rollout. | A user can have many campaign delivery records. This design supports one current push token per user. |
| `pushBroadcasts` | Appwrite document ID; title, body, category, optional allowlisted `destinationRoute`, `createdBy`, per admin `idempotencyKey`, normalized `payloadHash`, status, immutable `expiresAt` deadline computed from creation time and category, nullable `recipientSnapshotAt` (set once when processing first starts), nullable `lastProcessedUserId` (internal cursor for the last fully materialized recipient page), `estimatedRecipientCount`, nullable `targetedCount` (set when recipient preparation completes), `acceptedCount`, `rejectedCount`, `unresolvedCount`, `skippedCount`, creation, start, completion, and cancellation timestamps. Content limits are 80 and 240 characters. Unique index on `createdBy` and `idempotencyKey`; index on status for recovery. | One campaign has many delivery records. |
| `pushBroadcastDeliveries` | Appwrite document ID; `campaignId`, `userId`, push state, total attempt count, `manualRetryCount` (zero or one), Expo ticket ID when present, safe error category, in app notification ID, creation and update timestamps. Unique index on `campaignId` and `userId`; index on `campaignId` and status for aggregate counts and pending retries. Never store a raw token or message body. Delete after one year. | Each record links one campaign, one user, and one existing in app notification. |
| `pushEventReceipts` | Deterministic Appwrite document ID derived from a hash of the stable event key and recipient user ID; event key hash, normalized event type, server selected `templateVersion`, recipient user ID, deterministic in app notification ID, push state, attempt count, Expo ticket ID when present, safe error category, and creation and update timestamps. Unique index on event key hash; index on status for recovery. Never store a raw push token, rendered title or body, or raw event payload. Keep the referenced server owned template version available for at least 365 days. Delete receipts after one year. | One private Backend receipt refers to one owner scoped in app notification and identifies the immutable template version needed to reconstruct it. |
| Existing notification document | Add an optional `title` field. Store the broadcast body in the existing message field, category as notification type, and campaign ID plus validated route as metadata. Use a deterministic document ID derived from the campaign delivery ID or automatic event receipt ID. Grant access only to the owning user. | Each delivery or automatic event has one associated in app notification. Existing notification clearing behavior remains. |

The campaign recipient snapshot is built by a paged worker from user records whose first token registration predates the snapshot. The preview estimate uses users with a currently registered token and, for promotions, current consent. The worker records the final candidate count when it materializes recipients. It checks the indexed `marketingPushEnabled` field and consent timestamp immediately before each promotional notice is created and pushed.

`recipientSnapshotAt` is set once when a worker first claims the campaign. Candidate users are read in ascending Appwrite document ID order when `pushTokenFirstRegisteredAt` is no later than that timestamp. The worker checks the current token and, for promotions, both current consent and a consent timestamp no later than the snapshot before creating the in app notice. A missing token, missing consent, later consent, or expired campaign creates a skipped delivery row. This makes users who become eligible after the snapshot ineligible for that campaign while allowing a later consent withdrawal to stop a send.

The Backend sets the campaign's immutable `expiresAt` at creation: promotion is 24 hours, app update is 30 days, and service announcement is 7 days. Before first processing each recipient, the worker compares the current UTC time with `expiresAt`. At or after the deadline it marks the recipient skipped without creating an in app notice. Before the deadline it creates the notice and sends the remaining lifetime as the Expo message TTL, so queued pushes do not remain deliverable beyond the campaign deadline. If a later retry or recovery reaches the deadline, it skips the push and retains any notice already created before expiry.

**Automatic event templates**:

| Event | Title | Body | Destination | Preference |
|---|---|---|---|---|
| Successful payment or accepted cash on delivery order | Order confirmed | Your order has been confirmed. View your orders for details. | `/(Screens)/OrdersScreen` | `notificationPreferences.order.push` |
| Preparing | Order update | Your order is being prepared. View your orders for details. | `/(Screens)/OrdersScreen` | `notificationPreferences.order.push` |
| Ready for dispatch | Order update | Your order is ready for dispatch. View your orders for details. | `/(Screens)/OrdersScreen` | `notificationPreferences.order.push` |
| Out for delivery | Order update | Your order is out for delivery. View your orders for details. | `/(Screens)/OrdersScreen` | `notificationPreferences.order.push` |
| Delivered | Order delivered | Your order has been delivered. View your orders for details. | `/(Screens)/OrdersScreen` | `notificationPreferences.order.push` |
| Cancellation request received | Cancellation request received | We received your cancellation request. View your orders for updates. | `/(Screens)/OrdersScreen` | `notificationPreferences.order.push` |
| Cancellation approved | Cancellation approved | Your cancellation request was approved. View your orders for details. | `/(Screens)/OrdersScreen` | `notificationPreferences.order.push` |
| Cancellation rejected | Cancellation update | Your cancellation request was not approved. View your orders for details. | `/(Screens)/OrdersScreen` | `notificationPreferences.order.push` |
| New account welcome | Welcome to Nile Flow | Your account is ready. Explore Nile Flow to get started. | `/(tabs)/BottomTabs` | `notificationPreferences.system.push` |
| Password changed | Account security alert | Your password was changed. If this was not you, secure your account. | `/(Screens)/Settings` | `notificationPreferences.security.push` |
| Email changed | Account security alert | The email on your account was changed. If this was not you, secure your account. | `/(Screens)/Settings` | `notificationPreferences.security.push` |

All automatic templates are server owned and contain no event supplied free text. Order and account state comes from the successful Backend operation. Security preference defaults to true when missing, matching `DEFAULT_PREFERENCES.security.push`. Each automatic event uses the stable event key in the value sourcing table, and all automatic pushes expire after seven days.

Campaign destinations are an exact allowlist of registered Mobileapp routes: `/(tabs)/BottomTabs`, `/(Screens)/MyNotificationsScreen`, `/(Screens)/OrdersScreen`, `/(Screens)/Deals`, `/(Screens)/Settings`, and `/(Screens)/Profile`. Query strings, fragments, external URLs, path parameters, and unlisted routes are rejected.

**Admin UI direction**: Add the Broadcasts tab within the existing Notifications page and match its visual style and page structure.

**State transitions**:

* Campaign: `queued` → `sending` → `complete` or `complete_with_issues`.
* Campaign cancellation: `queued` → `cancelled`. Cancellation is rejected once processing starts.
* Delivery: `pending` → `accepted`, `rejected`, `unresolved`, or `skipped`. `accepted` means Expo returned an accepted ticket, not that the device displayed the message.
* Automatic event receipt: `pending` → `accepted`, `rejected`, `unresolved`, or `skipped`. A replayed event with an existing receipt reuses it and never creates a second in app notice.
* A queued campaign includes recipient preparation. In app notification records are created only as recipient processing starts, so cancelling before processing does not leave unread campaign notices behind.

**API surface**:

| Endpoint | Method | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| `/api/v1/admin/push-broadcasts/preview` | POST | Title, body, category, optional internal destination | Validated preview and estimated eligible recipient count | Authenticated admin | 400 invalid input, 401 unauthenticated, 403 forbidden, 503 unavailable |
| `/api/v1/admin/push-broadcasts` | POST | Same content and an `Idempotency-Key` UUID v4 header generated once per send intent | HTTP 202 for a new queued campaign, or the saved campaign and current status for an idempotent replay; a queue failure returns 503 with the saved campaign ID and `queued: false` | Authenticated admin | 400 invalid input, 401 unauthenticated, 403 forbidden, 409 key reused with a different normalized payload hash, 422 no eligible recipients, 503 queue unavailable |
| `/api/v1/admin/push-broadcasts` | GET | `page` default 1, `limit` default 20, maximum 100 | Campaign summaries ordered by `createdAt` descending then document ID descending, plus total count | Authenticated admin | 400 invalid pagination, 401 unauthenticated, 403 forbidden |
| `/api/v1/admin/push-broadcasts/:id` | GET | Campaign ID | Content, lifecycle status, estimate, final target, aggregate counts, derived pending count while active, creation and expiry timestamps | Authenticated admin | 401 unauthenticated, 403 forbidden, 404 not found |
| `/api/v1/admin/push-broadcasts/:id/retry` | POST | Campaign ID | HTTP 202 and count of known retryable failures requeued | Authenticated admin | 401 unauthenticated, 403 forbidden, 404 not found, 409 no retryable failures or manual retry already used, 503 queue unavailable |
| `/api/v1/admin/push-broadcasts/:id/cancel` | POST | Campaign ID | Cancelled status; no recipient rows or notices are created | Authenticated admin | 401 unauthenticated, 403 forbidden, 404 not found, 409 processing has started or lock is busy |
| `/api/v1/customer/notification-preferences` | GET | No user ID input | Current `marketingPushEnabled` and `marketingPushConsentUpdatedAt` | Authenticated customer | 401 unauthenticated, 503 unavailable |
| `/api/v1/customer/notification-preferences` | PATCH | `marketingPushEnabled` Boolean only | Saved value and server generated timestamp | Authenticated customer | 400 invalid input, 401 unauthenticated, 503 unavailable |
| `/api/customernotifications/register-token` | POST | Expo token | Token saved with `pushTokenFirstRegisteredAt` set only on the first registration | Existing authenticated customer session | 401 unauthenticated, 400 invalid token |
| `/api/customernotifications/register-token` | DELETE | No user ID input | Current device token removed; first registration timestamp retained for an active campaign snapshot | Existing authenticated customer session | 401 unauthenticated, 503 unavailable |

The AdminDashboard creates one UUID v4 idempotency key for each send intent and reuses it for transport retries. The Backend trims surrounding whitespace, preserves internal body whitespace and paragraph breaks, normalizes the route to null when absent, and hashes the canonical JSON object containing title, body, category, and route. The hash is compared on an idempotent replay.

The campaign create request stores the campaign and its estimated count before queueing. A retry with the same key returns that same campaign. If queueing fails after the record is saved, the API returns 503 with the campaign ID and explicitly says it was saved but not queued. A recovery scan runs every 30 seconds. It enqueues queued campaigns with no live job and resumes sending campaigns from their saved cursor when the deterministic page job is missing or failed. BullMQ handles stalled active jobs. The API never returns a queued success unless Redis accepts the job.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| Register mobile device | Expo token and project ID | Expo token API, app EAS project ID, signed in session user ID |
| Preview campaign | Title, body, category, destination, estimated audience | Admin request; audience count from current user records with a token and the category consent rule |
| Create campaign | Campaign ID and queued status | Appwrite campaign record and BullMQ queue acceptance |
| Build final audience | Snapshot time, targeted count, delivery rows, and resume cursor | Backend UTC time saved once as `recipientSnapshotAt`; user documents ordered by `$id` where `pushTokenFirstRegisteredAt` is no later than that time; `lastProcessedUserId` stores the final document ID of the last fully materialized page; promotion checks `marketingPushEnabled` and `marketingPushConsentUpdatedAt` before delivery |
| Send push | Title, body, category, route, expiration deadline, and remaining lifetime | Saved campaign fields; `expiresAt` is set at creation to `createdAt` plus 24 hours for promotion, 30 days for app update, or 7 days for service announcement; remaining lifetime is derived from Backend UTC time immediately before send |
| Report campaign | Accepted, rejected, unresolved, skipped, and final target counts | Per recipient delivery states and the saved recipient snapshot |
| Update consent | Boolean and change timestamp | Boolean from authenticated app request; timestamp generated by Backend; user ID from verified session |
| Send welcome | Server owned title, body, route, and event key | New user account event after rollout and authenticated token registration; a durable event receipt prevents repeats; `welcomePushSentAt` is set after Expo acceptance |
| Send order update | Server owned title, body, route, and event key | Normalized order confirmation from successful payment or accepted cash on delivery, later order state transitions, cancellation request receipt or decision, and the resulting Backend event type |
| Send account security alert | Server owned title, body, route, and event key | Successful password or email change operation; the Backend creates an operation ID when the change succeeds |
| Recover automatic notification | Title, body, route, notification type, and metadata | Server owned template renderer selected by the receipt's normalized event type and `templateVersion`; recipient ID and deterministic notification ID come from the receipt. Recovery does not read the source order, account, or operation record. |
| Deduplicate automatic event | Event receipt ID and queue job ID | SHA 256 hash of the stable event key plus recipient user ID; order ID and normalized event type/state, cancellation request ID and decision, welcome user ID, or account change operation ID. The server selects `templateVersion` when creating the receipt. |
| Route push tap | Internal app route or notification list fallback | Validated campaign route in notification data, otherwise existing app notification route |
| Unregister device | Current token removal | Authenticated logout or OS permission status checked when the app resumes |

**Key invariants**:

* Expo is the sole mobile push provider. Appwrite Messaging remains available for its existing email and SMS uses, but its push sender is not also invoked for these events.
* All push sends run through the existing `nf:notifications` worker. Use bounded exponential retries, with the queue's existing five attempt policy. A provider timeout with no ticket is ambiguous, so automatic retry can result in a duplicate.
* `DeviceNotRegistered` clears the matching current user token. Appwrite lookup errors are failures to retry, not proof that a user has no token.
* Appwrite campaign, delivery, and event receipt records remain the source of truth. A recovery scan requeues pending campaigns and event receipts if the process stops between database writes and Redis enqueue. Campaign workers save one `recipientSnapshotAt`, read users in ascending document ID order using `pushTokenFirstRegisteredAt`, and use `lastProcessedUserId` as the stable cursor. Advance the cursor only after every candidate in the page has a durable delivery row. Before starting another page, process any existing pending delivery rows. If processing stops first, repeat the page and reuse its unique campaign plus user records.
* One shared Redis lock per campaign protects worker start, cancellation, and manual retry. The lock is released with a token checked delete. A cancellation wins only if it obtains the lock while status is still queued; otherwise it returns conflict.
* Campaign locks have a 30 second lease renewed every 10 seconds while held. If a lock is busy, cancel and retry return 409 and leave campaign and delivery state unchanged.
* Automatic event receipts use a unique hash of the stable event key and recipient user ID. Create the receipt and in app notification idempotently before queueing. The receipt stores the normalized event type and server selected template version, recipient user ID, and deterministic notification ID. These values resolve to the immutable server owned copy and route, so recovery can recreate the notice without the source order, account, or operation record. The supported automatic templates contain fixed copy and require no dynamic event values. If a notice is missing while its receipt is pending and being recovered or replayed, recreate it with the same deterministic ID and owner permissions before continuing delivery. Do not recreate a notice for an accepted receipt, because a customer may have cleared it after delivery. Never store rendered title or body, raw event payloads, or a token in the receipt. Keep each referenced template version available for at least 365 days after the last receipt is created with that version. If a receipt is invalid or references an unavailable template version, mark it unresolved, do not send, and emit an operational error without logging message content or recipient details. If Expo may have accepted a push but the worker did not save the acceptance, recovery retries the pending receipt and accepts the small duplicate risk rather than silently losing delivery. Campaign in app notices also use deterministic IDs derived from their delivery rows. Retain compact event receipts for one year.
* Retain the normalized payload hash with the campaign. Idempotency keys are UUID v4 values generated once per admin send intent; the same key with the same canonical payload returns the same campaign, while a changed payload returns conflict.
* Campaign delivery counts are based on each recipient's current delivery state. A manual retry changes a transient rejected row to pending, then to its latest result. It never increments an accepted or unresolved row. A row can receive only one manual retry, with up to five additional automatic attempts. Expired campaign recipients are skipped, and an expired push is not eligible for manual retry. An in app notice created before expiry remains visible even when a later push retry is skipped as expired.
* A daily BullMQ retention job deletes campaign delivery rows and automatic event receipts older than 365 days. It does not delete campaign content or aggregate counts.
* Production must use durable Redis. The in memory fallback is not acceptable for push delivery. Do not accept new admin sends when the durable queue is unavailable.
* The estimated audience may differ from the final audience. Final outcome counts sum to the final target. Pending is derived from the target and outcome counts only after the recipient snapshot is complete. Expired or withdrawn recipients are skipped.
* Existing users have no promotional consent until they explicitly opt in. Legacy `notificationPreferences.promotion.push` values are not considered consent. `NotificationPreferences` must use `marketingPushEnabled` for promotion pushes and must not fall back to a legacy enabled default.
* A single `pushToken` field supports only the latest registered device for a user. Multi device token registration is out of scope. `pushTokenFirstRegisteredAt` is set on first registration, retained when a token is removed, and backfilled for existing registered users.
* Validate category, text lengths, the exact route allowlist, pagination, UUID v4 idempotency keys, and normalized payload hash on the Backend. Reject query strings, fragments, external URLs, dynamic path values, and unlisted routes. Apply the existing API rate limiting and audit logging.
* Campaign, delivery, and automatic event receipt records are service only. In app notice documents remain readable and manageable only by their owning users.

**Security model**:

* Every admin endpoint verifies the signed in session and requires `req.user.role === "admin"`. A second admin approval is not required.
* Customer consent endpoints derive user identity from the verified session and accept no user ID or client timestamp.
* The Backend validates all campaign inputs and accepts only internal app destinations. The AdminDashboard never receives delivery user IDs or tokens.
* Record the acting admin, campaign ID, category, action, timestamp, and aggregate results in the existing audit path. Do not log push tokens, raw provider payloads, or recipient level delivery data.
* Use server only Appwrite access for campaign, delivery, and event receipt collections. User notification documents retain owner scoped permissions.

**Configuration required**:

* `REDIS_URL`: existing production Redis connection, required for durable campaign and event work.
* `APPWRITE_PUSH_BROADCASTS_COLLECTION_ID` and `APPWRITE_PUSH_BROADCAST_DELIVERIES_COLLECTION_ID`: IDs for the new service only collections.
* `APPWRITE_PUSH_EVENT_RECEIPTS_COLLECTION_ID`: ID for the private automatic event receipt collection.
* `PUSH_NOTIFICATIONS_V2_ENABLED`: rollout flag. Keep new sends disabled until schema, worker, and physical device checks pass.
* EAS Android FCM V1 and iOS APNs credentials: user reports these are configured. Verify them during release validation.
* Android Firebase client configuration: provide `google-services.json` for package `com.nileflowafrica` and reference it from Expo Android config if it is not already configured. This is separate from the private FCM service account key.

**Critical test scenarios**:

* A signed in Android and iOS test device registers its Expo token, receives a test push in foreground and background, and opens the correct in app destination. Permission revocation and logout remove the token, verifies **AC-1**, **AC-4**, **AC-13**, **AC-16**.
* Each supported order, cancellation, welcome, password change, and email change event creates one Expo push and one in app record with the specified server template, route, preference, and seven day expiry. Replaying the same event key within one year does not create another push or in app record. Appwrite Messaging push is not called, while email and SMS behavior is unchanged, verifies **AC-2**, **AC-3**.
* Delete an automatic event's in app notice and make its source order or account operation unavailable while its receipt is pending. Recovery recreates the same notice ID and content from the receipt's event type and template version, then resumes delivery. Confirm an accepted receipt does not recreate a customer cleared notice, receipts contain no rendered copy or raw event payload, and an unsupported template version becomes unresolved without a send. Simulate an Expo acceptance followed by a worker crash before the acceptance is saved, and verify recovery retries the pending receipt with the documented duplicate risk, verifies **AC-3**, **AC-15**, **AC-17**.
* A customer sees promotion consent off by default, opts in and out, and only opted in users receive promotions. A denied OS permission or missing token excludes the user, verifies **AC-4**, **AC-6**.
* An admin previews and confirms a service notice. A repeated request with the same key returns the same campaign. Invalid role, invalid destination, oversized text, and zero recipients are rejected, verifies **AC-5**, **AC-6**, **AC-7**, **AC-14**.
* Redis fails before or after the campaign record is saved. The API returns a clear retryable error with the saved campaign ID when applicable, and recovery resumes without duplicating accepted deliveries, verifies **AC-8**.
* The worker stops partway through recipient page creation or with pending rows behind the cursor. Recovery repeats the incomplete page, drains pending rows, reuses existing unique delivery rows, then continues without skipping recipients, verifies **AC-8**, **AC-9**.
* Expo returns accepted, permanent rejection, transient failure, ambiguous timeout, and invalid token outcomes. Counts reflect the latest recipient state, one manual retry handles only known transient failures, accepted and ambiguous recipients are not retried manually, and invalid tokens are cleared, verifies **AC-9**, **AC-11**, **AC-15**.
* Cancel and worker start race for the shared lock. Exactly one wins. For each campaign category, verify the saved expiry deadline equals creation time plus its specified duration. A recipient first processed at the deadline is skipped without an in app notice; a recipient first processed before the deadline receives only the remaining Expo TTL. If a push retry crosses the deadline, the push is skipped and its earlier in app notice remains visible. An expired push cannot be manually retried. A withdrawn promotional consent, consent granted after the snapshot, and a missing token are also skipped, verifies **AC-9**, **AC-11**, **AC-12**.
* Campaign history pagination uses stable ordering, detail refresh and aggregate only reports work, daily one year retention removes only detailed deliveries and receipts, role denial, customer ownership checks, and audit entries are verified, verifies **AC-10**, **AC-14**, **AC-15**.

## Build plan

The shared scope records a Tracer Bullet approach. Start with a thin event to phone path, then extend that proven sender into preferences and admin broadcasts.

1. Add the optional user attributes, campaign, delivery, and automatic event receipt collections, required indexes, daily retention job, and safe migration. Backfill first token registration timestamps and mark existing accounts as already welcomed. Include nullable campaign snapshot time and cursor, and treat missing promotional consent as off, satisfies **AC-4**, **AC-7**, **AC-8**, **AC-10**, **AC-15**.
2. Implement one centralized Expo sender on `nf:notifications`, with classified retryable errors, invalid token cleanup, durable event receipts with retained template versions, stable event keys, and no parallel Appwrite push send. Retry pending receipts after lost provider confirmation, accepting at least once delivery and its small duplicate risk. Prove one order confirmation on a staging device before expanding, satisfies **AC-1**, **AC-2**, **AC-3**, **AC-13**, **AC-15**, **AC-16**, **AC-17**.
3. Route the selected order status, cancellation request and decision, payment, welcome, password, and email change events through the sender with the specified server owned templates, preferences, destinations, and expiry. Preserve non push channels and in app ownership. Mark existing users welcomed at rollout so deployment does not broadcast welcome notices, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-17**.
4. Add authenticated customer preference read and update endpoints, then wire the existing Mobileapp settings panel to them. Request OS permission on opt in, retain the existing sound preference, and handle loading, retry, and failure states, satisfies **AC-4**, **AC-6**, **AC-14**.
5. Implement admin preview, canonical payload idempotency, bounded recipient preparation with a fixed snapshot and durable cursor, worker recovery, shared campaign lock, and queue health behavior. Verify preview and final audience use the specified registration and consent timestamps, satisfies **AC-5**, **AC-6**, **AC-7**, **AC-8**, **AC-9**, **AC-11**.
6. Add the Broadcasts tab with category form, exact route selection, preview and confirmation, paginated stable history, aggregate details, active status refresh, bounded transient retry, and lock protected queued cancellation, satisfies **AC-5**, **AC-9**, **AC-10**, **AC-11**, **AC-12**, **AC-14**.
7. Verify category campaign expiry of 24 hours for promotion, 30 days for app update, and 7 days for service announcement, along with automatic event expiry, per recipient consent and token rechecks, recovery after the source record or in app notice is unavailable, versioned template retention, in app title and body display, deep link fallback, safe logs, rate limits, lock races, and one year receipt retention. Enable the rollout flag only after Android and iOS physical device checks pass, satisfies **AC-4**, **AC-9**, **AC-10**, **AC-11**, **AC-12**, **AC-13**, **AC-15**, **AC-16**, **AC-17**.

## Consequences

**Positive**:

* Automatic alerts and admin broadcasts share one observable, retryable mobile delivery path.
* Admins can communicate to mobile users without using newsletter email delivery, and customers control promotional consent.
* Persistent campaign state supports recovery, honest reporting, and safe manual retry.
* Stable event receipts prevent repeated business events from generating duplicate alerts during the one year retention period.

**Negative / tradeoffs**:

* Appwrite schema, indexes, a recovery worker, and production Redis operations add work.
* One user document stores one current push token, so only the latest registered device receives pushes.
* Expo acceptance is not proof of display. Ambiguous timeouts can create rare duplicates despite idempotent Backend handling.
* Promotions reach fewer people until they explicitly opt in.
* Campaign locks, snapshot fields, event receipts, and retention work add operational code and private records. Event deduplication ends when its one year receipt is removed.

**Neutral**:

* EAS credentials alone do not trigger notifications. Users still need an installed native build, permission, a registered token, and a Backend event or admin send.
* Admin broadcasts are immediate only. Scheduling, audience segments, recipient level reports, and multi device token storage remain out of scope.

## Follow-up

* [ ] Confirm production Redis persistence and worker availability before enabling `PUSH_NOTIFICATIONS_V2_ENABLED`.
* [ ] Confirm the Firebase Android client file is present and referenced by Expo config, separately from the private FCM service account key.

## Rationale

Reasoning and options are recorded in [rationale.md](./rationale.md).

## Migration plan

**Strategy**: Feature flagged strangler rollout, replace one push path at a time while retaining existing non push channels.

**Phases**:

1. Add nullable user attributes, campaign snapshot and cursor fields, and new collections and indexes. Backfill first token registration timestamps for existing tokens. Deploy migrations before code that writes them. Missing marketing consent means false. Mark all pre existing users as already welcomed.
2. Deploy the Expo sender, campaign worker, and APIs with `PUSH_NOTIFICATIONS_V2_ENABLED` disabled. Confirm Redis, EAS credentials, Android client configuration, and physical device delivery in staging.
3. Move one automatic event at a time to the Expo queue and disable its legacy Appwrite push call. Preserve email, SMS, WhatsApp, and in app delivery. Watch ticket errors and duplicate reports before expanding.
4. Enable admin broadcasts after customer consent, preview, queue recovery, and campaign reporting pass staging checks.

**Rollback**: Disable new campaign creation first. Keep workers running to finish or safely pause already accepted campaigns. Do not replay processed event keys through the legacy provider. If the automatic path must roll back, route each event to exactly one provider and verify no queued Expo event is also sent through Appwrite.

**Risks**: Appwrite and Redis cannot commit atomically, so the campaign recovery scan is required. A feature flag change must not strand accepted work. Existing Appwrite schemas may need an additive migration before the app and Backend can use the new fields.
