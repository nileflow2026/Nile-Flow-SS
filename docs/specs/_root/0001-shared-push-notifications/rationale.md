# Rationale: Shared mobile push notifications

## Context

FCM and APNs credentials authorize push delivery, but notifications still require a registered device token and a Backend event or admin action. Nile Flow has those pieces in several paths. `usePushNotifications` registers one Expo token per signed in user. `pushNotificationService` sends through Expo. `NotificationDispatcher` currently calls Appwrite Messaging and then Expo, and other notification creation paths can invoke the Expo sender directly. This makes failures inconsistent and can produce duplicate mobile alerts.

The existing stack already includes Appwrite user records, a BullMQ queue backed by Redis, Expo notifications, a Mobileapp notification list, and an AdminDashboard Notifications page. Appwrite Messaging is also used for non push delivery. The product expects mobile notices to work under weak network conditions and to reach broad audiences without exposing recipient data to administrators.

## Options considered

### Option 1: Strengthen the existing Expo and BullMQ path

Use one Expo sender for automatic events and admin broadcasts, preserve Appwrite for notification records and existing non push channels, and persist campaign work so the queue can recover.

**Pros**:

* Reuses the token flow and provider the mobile app already uses.
* Adds delivery reliability without introducing another provider or queue.
* Supports explicit consent and aggregate reporting in the existing dashboard.

**Cons**:

* Requires a careful event by event cutover to remove duplicate send paths.
* Requires Redis, Appwrite schema work, and a recovery worker in production.

### Option 2: Keep Appwrite Messaging as the push provider

Continue Appwrite push for current event paths and use it for broadcasts, adding consent and admin campaign state around it.

**Pros**:

* Preserves more of the current Appwrite message dispatch code.
* Keeps delivery provider management in one platform.

**Cons**:

* The current dispatcher also sends through Expo, so provider consolidation and duplicate prevention still require a migration.
* The mobile app already registers Expo tokens, so this does not simplify its existing token lifecycle.

### Option 3: Replace the push path with direct FCM and APNs

Have the Backend send directly to each platform provider and maintain platform credentials and token formats itself.

**Pros**:

* Gives the Backend direct provider responses and platform specific controls.
* Removes the Expo relay from delivery.

**Cons**:

* Adds credential management and separate provider code for both platforms.
* Replaces a working Expo token flow and adds operational burden without a demonstrated need.

## Rationale

The current failure is fragmented dispatch, not a missing provider. Option 1 repairs the root cause while keeping the Appwrite and Expo choices already in use. BullMQ provides a place for bounded retries, and campaign records provide recovery when Redis work is interrupted. The migration must route each event through exactly one sender because the current dispatcher can call both providers.

The consent value is a queryable Boolean on the existing user document rather than an unindexed nested preference. This keeps campaign audience selection bounded and supports a paged worker. A single token field is retained because it is the current model and the requested audience is registered mobile users, with the explicit limitation that only the latest device is covered.

The admin result reports provider acceptance and failure categories, not device display. Expo tickets cannot establish that a person saw a notification, and an ambiguous timeout cannot be made exactly once by the Backend. The design therefore retries boundedly, reports uncertainty honestly, and avoids manually retrying ambiguous outcomes.

The event migration preserves the existing customer alert when a cancellation request is received, then sends a separate notice for the later decision. This keeps the current confirmation behavior while moving both events onto the shared sender.

Campaign recovery needs a fixed audience boundary as well as a cursor. A saved snapshot time and the user's first token registration time keep later registrations out of an active campaign, while a fresh consent check can still stop a promotion after opt out. The worker saves its cursor only after it has durable delivery rows for the full page, then drains pending rows before it advances.

Automatic event receipts use a stable event hash and point to the existing in app notification instead of copying its message or a device token. The extra private records make event replay and queue recovery durable. Retaining them for one year limits storage, with the tradeoff that a very old event replayed after expiry can produce another push.

Campaign expiry is 24 hours for promotions, 30 days for app updates, and 7 days for service announcements. This keeps time limited offers short lived, gives customers more time to act on an app update, and prevents a delayed service notice from arriving after it is useful. Saving the immutable expiry deadline at campaign creation lets recovery and retry workers enforce the same cutoff even if the category policy later changes. An in app notice created before expiry stays in the user's notification list if a later push retry is skipped after expiry, preserving the notice that was already presented in the app while preventing a stale device alert.

### Automatic receipt recovery data

The receipt needs enough durable data to rebuild an automatic notice after its in app record is cleared, even when the original business record can no longer be read. Storing the rendered title and body would make recovery straightforward, but it would copy message content into records that are intended to remain compact and would conflict with the privacy rule against storing message bodies. Reading the order or account record again avoids copying content, but recovery would fail when that record is unavailable and could render different content if the record changes.

The receipt therefore stores the normalized event type, which selects the server owned template, and a server selected template version, along with the recipient and deterministic notification ID already required for delivery. All automatic templates defined by this feature use fixed copy and routes, so the template key and version contain enough information to reproduce the title, body, type, route, and metadata without event payload fields. Each referenced renderer remains available for at least 365 days after the last receipt is created with that version. This keeps recovery independent from source records while keeping rendered copy, tokens, and raw event payloads out of the receipt. A missing renderer is an unresolved operational failure, not a reason to fall back to current copy or send an incomplete notice.

Reconstruction is limited to a pending receipt that is being recovered or replayed. An accepted receipt does not recreate a notice that a customer cleared after delivery. Recovery retries a pending receipt if Expo may have accepted the push but the Backend did not save the acceptance. This favors delivery reliability and preserves the existing at least once behavior, with a small duplicate risk because the provider and Appwrite cannot share a transaction.

The campaign title and body limits, history page bounds, five second active detail refresh, and one manual retry are product and operational defaults, not Expo requirements. The text limits keep broadcasts short, the page bounds constrain Appwrite reads, the refresh interval balances timely status with request load, and the single manual retry limits extra provider work while retaining a safe recovery option.
