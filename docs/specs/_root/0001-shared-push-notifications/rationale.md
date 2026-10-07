# Rationale: Shared mobile push notifications

## Context

FCM and APNs credentials authorize push delivery, but notifications still require a registered device token and a Backend event or admin action. Nile Flow has those pieces in several paths. `usePushNotifications` registers one Expo token per signed in user. `pushNotificationService` sends through Expo. `NotificationDispatcher` currently calls Appwrite Messaging and then Expo, and other notification creation paths can invoke the Expo sender directly. This makes failures inconsistent and can produce duplicate mobile alerts.

The existing stack already includes Appwrite user records, a BullMQ queue backed by Redis, Expo notifications, a Mobileapp notification list, and an AdminDashboard Notifications page. Appwrite Messaging is also used for non push delivery. The product expects mobile notices to work under weak network conditions and to reach broad audiences without exposing recipient data to administrators.

Mobile Notification Settings currently stores the global mute on the device and promotional consent on the account. It has no customer facing category or sound choices, and the Expo notifications build configuration registers no custom sounds.

Customers also need control over order, promotion, reward, and app or service update pushes, with sound choices that follow their account across devices. Android notification channels cannot have their sound changed after creation, so category sound selection must be represented by stable channels rather than by trying to edit an existing channel.

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

### Preference and sound choices

#### Option 1: Extend the existing user preference object and use bundled sounds

Store category push settings, sound IDs, and master mute in the existing `notificationPreferences` object. Keep promotional consent in the existing indexed user field. Preview local bundled audio with `expo-audio`, and map stable sound IDs to Expo notification payloads and Android channels.

**Pros**:

* Keeps account preferences with the existing user document and syncs them across devices.
* Uses the current Expo notification path and avoids another preference service.
* Android channel IDs can reflect the selected sound without trying to mutate immutable channels.

**Cons**:

* Every supported category and sound choice needs a stable bundled asset and Android channel.
* A native app build is needed to add or replace notification sounds.

#### Option 2: Store settings in a new preference collection

Create a separate Appwrite collection for notification settings and sound choices.

**Pros**:

* Gives notification settings an independent schema and query boundary.

**Cons**:

* Adds another collection and authorization path for data already attached to the user.
* Requires more synchronization and recovery logic without a query need.

#### Option 3: Keep sound choices local or use the operating system default

Store sound selection on each device, or leave push sound selection to the operating system.

**Pros**:

* Requires less Backend preference handling and fewer sound channels.

**Cons**:

* Device local choices do not follow the customer account to another device.
* A default sound cannot meet the request for category specific sounds and previews.

## Rationale

The current failure is fragmented dispatch, not a missing provider. Option 1 repairs the root cause while keeping the Appwrite and Expo choices already in use. BullMQ provides a place for bounded retries, and campaign records provide recovery when Redis work is interrupted. The migration must route each event through exactly one sender because the current dispatcher can call both providers.

The consent value is a queryable Boolean on the existing user document rather than an unindexed nested preference. This keeps campaign audience selection bounded and supports a paged worker. A single token field is retained because it is the current model and the requested audience is registered mobile users, with the explicit limitation that only the latest device is covered.

Category choices extend the existing `notificationPreferences` object; no new collection is needed. The promotion push switch continues to use the indexed `marketingPushEnabled` field as its one source of consent. Order, reward, and app or service update switches default on, while promotions default off. Security and welcome pushes remain locked on. Push switches suppress only device delivery. They do not remove owner scoped in app notices, including a promotional campaign notice for a customer who opted out of its push. The campaign snapshot stays limited to users with a recorded first push token registration, so this does not turn mobile broadcasts into a message to every account.

Sound IDs refer to bundled WAV files in the existing category folders. `expo-audio` is used only for an explicit in app preview, so the feature does not need recording permission or background audio. Android channels are created for each stable category and sound ID, plus a silent choice. A master mute selects the silent channel, while operating system channel controls remain authoritative. iOS uses the same sound registry in its native build and receives no sound when a category is silent or master mute is on.

The admin result reports provider acceptance and failure categories, not device display. Expo tickets cannot establish that a person saw a notification, and an ambiguous timeout cannot be made exactly once by the Backend. The design therefore retries boundedly, reports uncertainty honestly, and avoids manually retrying ambiguous outcomes.

The event migration preserves the existing customer alert when a cancellation request is received, then sends a separate notice for the later decision. This keeps the current confirmation behavior while moving both events onto the shared sender.

Campaign recovery needs a fixed audience boundary as well as a cursor. A saved snapshot time and the user's first token registration time keep later registrations out of an active campaign, while a fresh consent check can still stop a promotion after opt out. The worker saves its cursor only after it has durable delivery rows for the full page, then drains pending rows before it advances.

Automatic event receipts use a stable event hash and point to the existing in app notification instead of copying its message or a device token. The extra private records make event replay and queue recovery durable. Retaining them for one year limits storage, with the tradeoff that a very old event replayed after expiry can produce another push.

Campaign expiry is 24 hours for promotions, 30 days for app updates, and 7 days for service announcements. This keeps time limited offers short lived, gives customers more time to act on an app update, and prevents a delayed service notice from arriving after it is useful. Saving the immutable expiry deadline at campaign creation lets recovery and retry workers enforce the same cutoff even if the category policy later changes. An in app notice created before expiry stays in the user's notification list if a later push retry is skipped after expiry, preserving the notice that was already presented in the app while preventing a stale device alert.

### Automatic receipt recovery data

The receipt needs enough durable data to rebuild an automatic notice after its in app record is cleared, even when the original business record can no longer be read. Storing the rendered title and body would make recovery straightforward, but it would copy message content into records that are intended to remain compact and would conflict with the privacy rule against storing message bodies. Reading the order or account record again avoids copying content, but recovery would fail when that record is unavailable and could render different content if the record changes.

The receipt therefore stores the normalized event type, which selects the server owned template, and a server selected template version, along with the recipient and deterministic notification ID already required for delivery. All automatic templates defined by this feature use fixed copy and routes, so the template key and version contain enough information to reproduce the title, body, type, route, and metadata without event payload fields. Each referenced renderer remains available for at least 365 days after the last receipt is created with that version. This keeps recovery independent from source records while keeping rendered copy, tokens, and raw event payloads out of the receipt. A missing renderer is an unresolved operational failure, not a reason to fall back to current copy or send an incomplete notice.

Reconstruction is limited to a pending receipt that is being recovered or replayed. An accepted receipt does not recreate a notice that a customer cleared after delivery. Recovery retries a pending receipt if Expo may have accepted the push but the Backend did not save the acceptance. This favors delivery reliability and preserves the existing at least once behavior, with a small duplicate risk because the provider and Appwrite cannot share a transaction.

The campaign title and body limits, history page bounds, five second active detail refresh, and one manual retry are product and operational defaults, not Expo requirements. The text limits keep broadcasts short, the page bounds constrain Appwrite reads, the refresh interval balances timely status with request load, and the single manual retry limits extra provider work while retaining a safe recovery option. Separating in app notice creation from push eligibility also keeps consent meaningful: opting out prevents the promotional push without silently hiding the related notice inside the app.
