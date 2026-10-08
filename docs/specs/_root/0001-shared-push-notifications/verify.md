# Verify: Shared mobile push notifications

## Configuration

* Confirm the production EAS project has Android FCM V1 and iOS APNs credentials.
* Confirm `google-services.json` matches Android package `com.nileflowafrica` and is referenced by Expo Android configuration.
* Confirm production `REDIS_URL` points to durable Redis and the notification worker is running.
* Confirm Appwrite user attributes, collection IDs, indexes, and service only permissions are available.
* Keep the rollout flag disabled until both platforms pass physical device tests.

## Backend

* Register and remove a token using an authenticated customer session. Confirm no user ID can be supplied to change another account.
* Send each selected automatic order event, including one normalized confirmation when payment and order confirmation happen together, cancellation request received and its decision, and each account event. Confirm one Expo submission per event, one in app notice, stable event deduplication, and unchanged email or SMS behavior.
* Delete an automatic event notice and make its source order or account operation unavailable while its receipt is pending. Confirm recovery recreates the same notice ID and content from the saved event type and template version, then resumes delivery. Confirm an accepted receipt does not recreate a notice cleared after delivery, an unsupported renderer version becomes unresolved without sending, and a lost provider confirmation retries with the documented duplicate risk.
* Stub Expo responses for accepted ticket, permanent rejection, temporary rejection, invalid token, malformed response, HTTP error, and timeout. Confirm correct retry, unresolved, and token removal behavior.
* Fail Redis before enqueue and after campaign persistence. Confirm the API does not claim success, and the recovery worker resumes pending database records without resending accepted deliveries.
* Verify campaign validation, category consent filters, zero recipient rejection, per admin idempotency, estimate versus final audience, derived pending counts, expiry, consent withdrawal, and cancellation race behavior.
* Verify only exact role `admin` can use admin campaign routes. Verify users cannot read campaign or delivery records directly.
* Verify the customer preference API normalizes category defaults, merges only allowed notification fields, preserves unrelated channel preferences, syncs `soundMuted` across devices, and rejects locked settings or invalid sound IDs.
* Compare preference GET and PATCH payloads with the canonical schema in the spec. Confirm the consent timestamp is server generated, partial nested updates preserve omitted and unrelated preferences, and a legacy `promotion.push` value is neither returned as a switch nor treated as consent.
* Confirm `pendingPush` and `pendingInApp` match their specified formulas after each delivery transition. Confirm recipient preparation suppresses pending counts until the snapshot is complete, and a campaign completes only after both outcome streams are terminal.
* Confirm repeated campaign page enqueue and automatic event enqueue use the same deterministic BullMQ job ID. Confirm a page job with a stale expected cursor exits without changing campaign or delivery records, and the lock can only be released by its holder.
* Verify safe audit events, no raw token or user level delivery data in logs, pagination bounds, and one year delivery cleanup.

## AdminDashboard

* Compose each category with valid and invalid title, body, and destination values.
* Confirm preview returns a Backend estimate and does not send.
* Confirm a second confirmation with the same idempotency key returns the existing campaign.
* Confirm history is newest first, paginated, and exposes aggregate counts only.
* Confirm active details refresh every five seconds and stop after a terminal state.
* Confirm manual retry excludes accepted and ambiguous deliveries. Confirm cancel succeeds only before processing starts.

## Mobileapp

* On physical Android and iOS builds, grant notification permission and confirm token registration.
* Deny operating system permission, opt into promotions, and confirm the app explains that no registered token means no push delivery.
* Confirm promotions default off for existing and new accounts, and the preference timestamp comes from the Backend.
* Confirm a promotional opt out is checked again before delivery, and that legacy nested promotion preferences do not grant consent.
* Confirm order, reward, and app or service update pushes default on, promotion push defaults off, and security and welcome pushes cannot be disabled in the app. Turning a category off suppresses only its push, not its in app notice.
* Change a category sound and confirm the choice syncs across devices. Preview each bundled sound, select silent, and confirm preview works while push master mute is on without requesting microphone permission or background audio.
* On Android, confirm each category and sound choice uses a precreated stable channel, master mute uses silent channels, and the app never changes an existing channel sound. On iOS, confirm the same sound registry is used and silent or muted pushes set `sound` to `null`. Confirm operating system notification controls remain authoritative.
* Confirm title and body display separately in the notification list, sound mute remains effective, and a push tap opens the allowed route or notification list fallback.
* Confirm welcome pushes apply only to accounts created after rollout and are not resent after token re registration.
