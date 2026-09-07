# Watchlist and fixed market updates — release guide

## Implemented

- Account-only watchlist and notification APIs; session identity is resolved server-side.
- Login/register no longer merge anonymous data. A registered user ID in the guest cookie cannot impersonate that account. Existing data is not deleted or guessed to belong to someone else.
- Watchlist searchable asset picker, saved-item search/type filter, account-owned notes, removal, exchange-aware identity, atomic capacity limit, shared card state, focus/30-second refresh and cross-tab invalidation.
- Saving an asset does not subscribe it or the account to notifications.
- Alerts navigation, per-asset buttons, metals target-price form, custom evaluator/storage functions, browser-local alternate watchlists and old Vercel cron entries removed.
- Legacy price-alert APIs return HTTP 410. Existing stored rule records are inert; historical notifications are collapsed under Archived price notifications.
- /alerts redirects to /notifications. One bell opens preferences/history. Private pages are noindex.
- One Allow action covers both editions and enables in-app, supported/permitted browser push, and verified-email delivery. No checkboxes or mandatory preferences-page detour. No user-created rules, assets, thresholds or schedules.
- Email verification is account-bound, expires after one hour, and is throttled. Opening its link does not subscribe; the explicit "Confirm email and allow updates" action verifies ownership and saves email consent. Unsubscribe GET is inert; POST supports confirmation and List-Unsubscribe one-click.
- Browser subscriptions have one account owner and an active-session binding. Browser payloads check the current signed-in account before display. Expired sessions need browser push re-enabled after sign-in.
- In-app insertion and delivery marker are atomic. Email failures cannot prevent inbox creation. Successful channels/devices are not retried. External deliveries are at-least-once: a process crash after provider acceptance but before recording acknowledgement can still repeat a push; stable tags/renotify=false reduce visible duplication. Email uses Resend idempotency within its provider window.

## Schedule

| Edition | IST | QStash UTC cron |
| --- | --- | --- |
| Opening | 09:15 | 45 3 * * 1-5 |
| Closing | 15:30 | 0 10 * * 1-5 |

These are edition start times, not guarantees that every email/browser will arrive at that exact second. QStash, provider fetches and recipient batching add delivery latency.

Only regular Indian equity trading days are supported. The checked-in 2026 calendar includes NSE CMTR71775 and the January 15 amendment CMTR72260. Weekends, listed holidays, unknown years and special sessions are skipped. Muhurat/special sessions are not guessed or automatically enabled. Review new circulars throughout the year and add a reviewed calendar before 2027.

Sources:
- https://nsearchives.nseindia.com/content/circulars/CMTR71775.pdf
- https://nsearchives.nseindia.com/content/circulars/CMTR72260.pdf
- https://www.nseindia.com/static/market-data/market-timings
- https://upstash.com/docs/qstash/features/schedules
- https://upstash.com/docs/qstash/howto/receiving

## Delivery design

1. A signed QStash request starts an eligible edition; invalid signatures cannot dispatch.
2. Providers are fetched once, a durable edition snapshot/recipient list is saved, and a continuation is queued.
3. Continuations advance a durable cursor in batches of five accounts. Delivery jobs are queued only for currently subscribed active accounts.
4. One job per recipient writes the inbox first, then attempts optional email/browser delivery. Preferences are rechecked at delivery.
5. Channel and device status is stored under gsp:v2:edition:<date>:<open|close>:<userId>:delivery for 30 days. Failures return 503 for QStash retry. Completed channels are preserved.
6. Delivery ends two hours after the scheduled time. Expired messages are not replayed on the next day.

Redis outage fails closed. Snapshots and delivery records have 30-day TTLs; inbox history is capped at 200. Last-dispatch/last-delivery diagnostics are stored at gsp:v2:market-jobs:last-dispatch and gsp:v2:market-jobs:last-delivery. These are operational diagnostics, not a replacement for monitoring QStash's dead-letter queue.

## Provider scope and limitations

- Gold 22K/24K, where returned, and silver for Mumbai, in the feed's stated unit. Silver purity is explicitly marked not supplied. Other cities are not individualized.
- Supported stock sample: Reliance, TCS, HDFC Bank, ICICI Bank, Infosys; not the whole NSE/BSE universe or each user's watchlist.
- BTC/ETH from CoinGecko, USD/INR and EUR/INR reference FX from Frankfurter.
- Values carry source and source timestamp. Older observations are labelled older-reference; missing timestamps/numbers are unavailable. An opening edition may show the previous equity session, and FX is a reference feed rather than intraday trading data.
- Mutual-fund NAVs, bond yields and insurance quotes are explicitly excluded until a verified digest integration exists.
- Never fall back to catalog prices or manufactured values.
- Retail metals and crypto are not described as opening/closing with NSE.
- Free feeds have no delivery, freshness or availability SLA; confirm redistribution/usage terms before launch.

## Vercel / QStash activation — not executed by implementation

1. Pause/remove external legacy price-rule, big-move, midday and evening schedules. Deploy the code with MARKET_UPDATES_ENABLED=false. The checked-in vercel.json now contains no cron jobs.
2. Set these environment variables in Vercel Production and redeploy:
   - Existing UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN.
   - NEXT_PUBLIC_SITE_URL: canonical deployed HTTPS origin.
   - QSTASH_TOKEN, QSTASH_CURRENT_SIGNING_KEY, QSTASH_NEXT_SIGNING_KEY from the same QStash account/region.
   - NOTIFICATION_SIGNING_SECRET: separate cryptographically random secret, at least 32 characters. Keep it stable to preserve unsubscribe links.
   - For email: RESEND_API_KEY, RESEND_FROM_EMAIL (verified sender), RESEND_REPLY_TO.
   - For browser push: NEXT_PUBLIC_VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY, VAPID_EMAIL.
   - RESEND_DAILY_LIMIT=90; RESEND_MONTHLY_LIMIT=2900 (conservative free-tier ceilings).
3. Verify sender-domain DNS and HTTPS. Use a separate staging Redis database, dedicated test accounts and test recipients for real external-delivery acceptance tests.
4. Set MARKET_UPDATES_ENABLED=true only after staging passes and redeploy. This switch enables processing, but does not create schedules.
5. In a trusted shell with production site URL/QStash credentials supplied, run npm run notifications:schedules. It prints a dry run and does not load .env.local.
6. Review the two destinations/crons, then run npm run notifications:schedules -- --apply. This creates/updates only gsp-market-open-v2 and gsp-market-close-v2. It does not delete unrelated schedules. Do not share tokens in chat or commit them.
7. Verify exactly these two project schedules in QStash and monitor the first opening/closing runs, subscriber opt-in, provider timestamps, expired-message handling and QStash dead-letter queue.

## Free-tier capacity

Resend quota is account-wide. This app conservatively budgets at most 90 emails/day and 2,900/month, including verification. Other apps using the same Resend account also consume its quota; app-local accounting cannot observe them. Quota-exhausted digest emails are skipped, while in-app/browser delivery remains independent.

Approximately 45 subscribers receiving both email editions can consume the daily budget before verification or other mail. Do not advertise unlimited free email.

QStash consumes at least two messages per subscribed account per trading day, plus snapshot/continuation requests and retries. Check current account limits and budget headroom before adding subscribers. Flow control serializes recipient delivery at at most one job per second. Email verification requests outside that flow can still encounter Resend rate limits; those failures are surfaced rather than silently treated as sent.

References: https://resend.com/pricing and https://upstash.com/pricing/qstash. Plan limits can change.

## Verification and remaining release gates

- npm run test:market-updates uses in-memory Redis/cookies and mocked transports/providers. It cannot contact real services. Tests include account isolation, forged guest cookies, notes/duplicates/exchanges, stale data, signature rejection, concurrent jobs, retry behavior, quotas, verification ownership, unsubscribe, expired editions and 410 endpoints.
- npm run typecheck, npm run lint and npm run build must all pass on the final checkout.
- Browser verification is read-only for existing accounts. No production watchlist entries, permissions, subscriptions, messages or history were changed to test this work.
- Still required on staging: real QStash signature acceptance (the local suite rejects unsigned input but does not emulate the provider's signing service), Redis Lua integration, provider rate limits, received email links, browser delivery on Chrome/Edge/Firefox/Safari, and shared-device sign-out.
- Existing cross-contaminated watchlist data cannot be safely attributed retrospectively. No automatic cleanup or account data deletion was attempted. Investigate affected accounts from backups/audit records with explicit owner approval.
- Browser/OS push requires support and permission; delivery may be suppressed offline or by OS settings. Push jobs do not prove that the person read the message.
- Rolling back to the legacy evaluators would re-enable old rules. Emergency stop: set MARKET_UPDATES_ENABLED=false and pause the two QStash schedules. Do not roll back to custom-price alert code while leaving old cron jobs active.

## Local validation record

### Simplified consent follow-up

- The invitation has Allow and Not now, with no checkboxes or preference-page detour. Sign-in is still required for account delivery. Native browser permission remains a browser-controlled confirmation.
- Allow requests native permission directly from the click, registers push, and saves in-app plus verified-email consent. The popup closes after that save, without waiting for the verification email request. Delivery failures remain visible in the bell with retry actions.
- Unverified accounts receive a verification link; its explicit "Confirm email and allow updates" button verifies ownership and enables email in the same action. Nothing bypasses verification.
- Not now, Escape, close, and dismissal of native permission defer the invitation by 60 seconds. It only reappears in a visible tab. Successful consent is remembered per account on this browser; blocked permission does not trigger repeated native requests. The browser bell retains Allow/Unsubscribe and update history.
- Added seven isolated opt-in/repeat tests (25 total): direct permission invocation, granted/default/denied/unsupported outcomes, verification safety, early popup closure, failure recovery and the one-minute visibility gate. These tests simulate delivery; they send no real emails or browser pushes.

- 18 isolated notification/watchlist tests passed.
- 17 local production HTTP checks passed, including private APIs returning 401 without cookies, old jobs returning 410, and /alerts redirecting to /notifications.
- Typecheck, lint and Next production build passed (235 generated pages).
- Read-only in-app browser checks: notification bell open/Escape close, archive disclosure, asset-picker search for TCS, and mobile drawer. One bell, no Alerts sidebar entry, no page-width overflow on the inspected notification/watchlist layouts.
- The browser adapter used effective CSS viewports 1366x768 and 480x844 (the latter was clamped by the adapter). This is not a claim to have tested every device width or browser zoom. A collapsed mobile bell panel was found, fixed and rechecked.

## Dependency audit results

The production dependency audit on 2026-09-07 reports four high-severity affected packages: nanoid, Next.js (through dependencies), PostCSS bundled with Next.js, and sharp/libvips. npm recommends Next.js 16.3.4 for the affected framework dependency chain. The application remains on its existing 16.2.11 baseline; a framework upgrade and full regression run were not folded into this notification refactor. Resolve these advisories before calling the entire application production-ready. Do not run npm audit fix --force blindly.
