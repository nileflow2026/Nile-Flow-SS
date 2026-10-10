# PostHog Self-driving setup report

## Summary

PostHog Self-driving is configured for the Nile Flow marketplace. Session Replay, Error Tracking, and Support were already enabled; health, error-tracking, support, GitHub Issues, and Sentry responders are enabled, and two Replay Vision monitors now feed verified findings into the inbox.

Fresh scout configurations and Replay Vision scans begin being picked up within about 30 minutes. Findings will appear in the [Self-driving inbox](https://us.posthog.com/project/437252/inbox).

## AI data processing

Approved by the wizard prerequisite.

## GitHub

The PostHog GitHub App was already connected. This setup connected the `nileflow2026/NileFlow` repository as a GitHub Issues warehouse source; its issues table is syncing for Self-driving.

## Products enabled

| Product | Status | Notes |
|---|---|---|
| Session Replay | Already enabled | The web `posthog.init` configuration was checked and does not disable recording. Recent recordings exist. |
| Error Tracking | Already enabled | The web `posthog.init` configuration does not disable exception capture. |
| Support (Conversations) | Already enabled | The responder is enabled; tickets will arrive after an inbound email, inbox, or Slack channel is connected in PostHog. |

## Signal sources

| Source product | Source type | Action |
|---|---|---|
| `health_checks` | `health_issue` | Enabled |
| `error_tracking` | `issue_created` | Enabled |
| `error_tracking` | `issue_reopened` | Enabled |
| `error_tracking` | `issue_spiking` | Enabled |
| `conversations` | `ticket` | Enabled |
| `github` | `issue` | Enabled |
| `sentry` | `issue` | Enabled; dormant until its warehouse source connects |
| `signals_scout` | `cross_source_issue` | On by default; no opt-out row created |
| `session_replay` / `session_analysis_cluster` | — | Deliberately skipped; Replay Vision scanners own this route |
| `replay_vision` | — | Deliberately skipped; each scanner is self-authorizing through `emits_signals: true` |

## Connected tools

| Tool | Status | Details |
|---|---|---|
| GitHub Issues | Connected by this setup | Warehouse source `01a10463-764b-0000-ab85-b162ad11b1c3` was created for `nileflow2026/NileFlow`; only the responder-consumed `issues` table syncs. Additional tables can be enabled in PostHog later. |
| Sentry | Selected but no source detected (dormant) | The Sentry responder is enabled, but no stored credential was available after the browser connection step, so it remains idle until a Sentry warehouse source is connected. |
| Other connected tools | Not used | They were not selected in this setup. |

## Scout troop

**Enabled (7 total):**

| Scout | Why it is enabled |
|---|---|
| General | Cross-product correlations and surfaces not owned by a specialist. |
| Product analytics | Marketplace behavioral funnel, retention, lifecycle, and path health. |
| Web analytics | Traffic, attribution, landing-page health, and bounce/404 changes. |
| Revenue analytics | Revenue-data health and revenue configuration risk. |
| Surveys | Active survey response volume, targeting, score, and feedback-theme health. |
| Checkout reliability (custom) | Checkout completion and order-placement reliability. |
| Product search quality (custom) | Search no-result and failure-rate health. |

**Run budget:** 100 runs/day confirmed; 0 runs used and 100 remaining at setup time. Announcement: “Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more.”

**Disabled (23 total):**

| Scout | Why it is disabled |
|---|---|
| AI observability | No AI/LLM telemetry evidence. |
| Anomaly detection | Left off to keep the troop selective and reserve room for marketplace-specific coverage. |
| APM | No distributed tracing evidence. |
| Conversations | Support has no connected inbound channel yet. |
| CSP violations | No CSP reporting configuration found. |
| Customer analytics | No account/group analytics evidence. |
| Data pipelines | No CDP, batch export, or workflow pipeline evidence. |
| Data warehouse | Revenue analytics is the higher-priority match for the current payment data surface. |
| Error tracking | Covered by the native Error Tracking responder. |
| Experiments | No active experiment evidence. |
| Feature flags | No active feature-flag evidence. |
| Inbox validation | Fresh setup has no resolved reports to validate yet. |
| Insight alerts | No configured insight-alert evidence. |
| Logs | No PostHog Logs usage evidence. |
| MCP tool calls | No product MCP telemetry surface. |
| Observability gaps | Deferred to keep the troop selective; it can be enabled later. |
| PR follow-up | No merged-PR telemetry workflow identified. |
| Replay Vision | New scanners have no accumulated observations yet. |
| Session replay | Covered by Replay Vision scanners. |
| Skills store | No team skills-store maintenance surface identified. |
| Tasks | No PostHog Tasks surface identified. |
| Web vitals | No Web Vitals usage evidence. |
| Workflows | No active workflow evidence. |

## Custom scouts

| Scout | Surface and discriminator | Why it adds coverage |
|---|---|---|
| `signals-scout-checkout-reliability` | Watches checkout starts, placed orders, and placement failures. It reports a material completion-rate or failure-rate regression only when checkout-attempt volume holds steady. | The built-in product-analytics scout watches broad saved-flow behavior; this scout holds the marketplace’s payment and order-placement reliability seam. |
| `signals-scout-search-quality` | Watches search result counts and search failures. It reports a material, demand-weighted rise in empty or failed searches only at meaningful volume. | Built-in scouts do not specifically own zero-result marketplace search quality or distinguish catalog supply gaps from matching regressions. |

The group-buy surface was considered but not selected because its current implementation uses local mock group-buy data and lacks a reliable success/failure loop. Search and checkout were the strongest watchable, uncovered surfaces. No proposed custom scouts were declined.

If either custom scout becomes noisy, set its config `emit` value to `false` in PostHog to switch it to dry-run without losing its learned state.

## Replay Vision scanners

A Replay Vision scanner is an LLM that watches individual session recordings on a schedule and pushes verified observations into the Self-driving inbox. These are the only items in this setup that spend Replay Vision quota. Individual findings enter at half weight and require corroboration before promotion to an inbox report.

| Status | Scanner | Watches | Query scope | Sampling | Estimate |
|---|---|---|---|---:|---:|
| Created | Checkout breakage | Visibly broken delivery/payment/order placement experiences, stuck checkout spinners, and failed payment handoffs. | Sessions that visited `/checkout`; checkout is the product’s explicit order-completion flow. | 0.5 | ~2 observations/month, ~10 credits/month |
| Created | Marketplace frustration | Visible struggle in search, cart, checkout, delivery, payment, or order placement. | Sessions containing `$rageclick` only; no URL filter was added so it remains distinct from the checkout monitor. | 1.0 | ~9 observations/month, ~45 credits/month |

The pre-create estimates total roughly 55 credits/month against 7,495 credits remaining for the current period, so no extra confirmation was required. Session Replay already has recordings, and both monitors are enabled with `emits_signals: true`.

## Follow-ups

- [ ] Connect an inbound Support channel (email, inbox, or Slack) in PostHog so Conversations tickets can reach the enabled support responder.
- [ ] Connect Sentry through the PostHog data warehouse so the enabled Sentry responder can begin receiving issues: https://us.posthog.com/project/437252/pipeline/new/source
- [ ] Review the existing Stripe warehouse source’s permission error if revenue data is needed; its current sync reports an authorization problem.
- [ ] Rate early Replay Vision observations from each scanner’s page. Thumbs up/down feedback produces scanner-configuration recommendations for review.

## Files modified or created

- Created `posthog-self-driving-report.md`.
- No application source files were modified. PostHog configuration, custom scouts, responders, warehouse sources, and Replay Vision scanners were created or updated server-side.

## What happens next

The scout coordinator picks up fresh configurations within roughly 30 minutes and runs them against the daily budget. Self-driving clusters corroborated findings into reports in the inbox; immediately actionable reports can begin coding tasks.
