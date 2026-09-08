# Metals implementation record

Scope: attached requirements A–P, 2026-09-08. This record distinguishes local implementation from external release approval.

## UI and current-price follow-up — 2026-09-08

Compact metal-coloured quote cards now keep value, availability, provider and observation time visible; detailed provenance is expandable. Scoped system-sans typography, smaller hero, light/dark palettes, hover and refresh motion, reduced-motion support, comparison loading skeletons and descriptive calculator placeholders added. A manual refresh reads the shared server cache; it does not fabricate a new observation or bypass provider request limits.

Gold API's terms explicitly document use on your own website. Current attributed XAU/XAG/XPT and HG benchmark references are on by default, combined with Frankfurter daily FX. All four endpoints and USD/INR passed read-only live requests on 8 September 2026. Either existing configuration flag explicitly set to `false` still opts the deployment out. Environment secrets were not edited. This review does **not** enable historical redistribution or competitor scraping. See the copper unit-convention limitation in the provider register below.

## Initial audit
- Working tree clean before implementation; existing Next 16.2.11/React 19/Recharts/Upstash reused.
- Existing gold/silver prices parse competitor HTML. Reuse rights not established.
- Missing observations were replaced with fetch times; history range labels exceeded feed coverage.
- Quick calculators depended on a feed; duplicate purity/charge logic required consolidation.
- Generic price detail used a short-history buy/wait signal; remove this recommendation.
- AdSlot was a placeholder; shared drawer lacked focus trapping/restoration.

## Requirement status matrix

| Requirement | Status | Implementation / limit |
| --- | --- | --- |
| A — scope and safety | Implemented | Existing Next application extended. No purchases, deployment, DNS changes, live ads or subscriber messages. |
| B — audit and record | Implemented | Initial audit, provider register, route inventory, test evidence and release procedure in this document. |
| C–D — architecture and overview | Repaired/new | Existing metal URLs retained; overview, detail, comparison, calculator directory and guides. Conditional data states are explicit. |
| E–F — prices, cache and failures | Implemented; feeds conditional | Shared normalized server service; bounded fixed-origin requests; 5-minute current and 1-hour FX cache; source/observation/FX provenance; client age validation. No city fabrication. |
| E–F — history | Safely disabled | API returns empty actual coverage. Chart/table presentation exists; licensed historical adapter, historical FX and distributed history budget remain enabling work, not a working historical feed. |
| G — calculators | Implemented | 13 tools covering all 11 requested feature categories; manual rates, validation, net weight, charge methods, assumptions, output rounding and explicit reference prefill. |
| H — save/privacy | Repaired/new | Versioned local saves, load/delete, no guest merge, authenticated account presets with server validation and ownership checks, CSV escaping, privacy-safe sharing. |
| I — education/news | Implemented/conditional | Eight original English guides; reviewable Hindi UI draft kept out of public routes. Existing news linked, no duplicate ingestion or copied full articles. News redistribution rights remain an owner review. |
| J — responsive/accessibility | Repaired/tested locally | Container-aware cards, 1100px drawer threshold, focus trap/restoration, independent sidebar scrolling, responsive forms and internal tables. Actual browser zoom/real devices remain manual checks. |
| K — watchlist/digests | Repaired; delivery external | Existing account watchlist and signed/idempotent two-edition service reused. Browser permission does not enable email. Seven-day invitation dismissal cooldown. No live delivery or schedule activation performed. |
| L — advertising | Conditional implementation | Central placement registry, config/consent gating, stable reservations, script deduplication, filled/no-fill/error handling and conditional ads.txt. Approved publisher and reviewed CMP bridge still required. |
| M — SEO/trust | Repaired/tested locally | Route metadata/canonicals, server content, breadcrumbs, methodology, privacy and sitemap exclusions. No ranking or AdSense approval claim. |
| N — operations/security | Partially verified | No new paid dependency; credentials unchanged. Production dependency audit passed. Account infrastructure, live quota budgets, backup restore and commercial hosting eligibility require owner verification. |
| O — verification | Local evidence below | Unit/API, ownership, release check, lint, typecheck, production build and responsive testing; explicit exclusions below. |
| P — handoff | This record | Conditional functionality and owner actions are not presented as deployed production verification. |

## Provider register
Reviewed 2026-09-08:
- Gold API: https://gold-api.com/docs, https://gold-api.com/pricing, https://gold-api.com/terms. Free current endpoint; terms explicitly document website use. Read-only XAU and XAG responses verified (USD, symbol, updatedAt, numeric price). Current attributed references enabled by default with explicit opt-out. No reliability guarantee; historical storage/redistribution rights remain separate and unverified.
- Frankfurter: https://frankfurter.dev/. Read-only USD/INR v1 response verified; daily reference, not intraday. Review underlying provider terms. Preserve FX date independently.
- Goodreturns HTML: public accessibility does not establish reuse rights. Legacy retail adapter gated off by default.
- Platinum/copper follow-up (2026-09-08): XPT/HG symbols and current endpoints verified. XPT uses the precious-metal troy-ounce convention. HG is converted with the standard USD/lb convention to INR/kg, explicitly disclosed as a provider benchmark because the response does not contain units or contract month. Not an Indian spot/retail/scrap quotation. Current feeds enabled; historical feeds remain off. Unit convention reference: https://www.cmegroup.com/trading/metals/files/copper-futures-and-options.pdf .
- MCX: no approved licensed feed. Not implemented as a public real-time trading service.
- BIS: https://www.bis.gov.in/hallmarking-overview/consumer-protection/?lang=en . Official consumer guidance; editorial summaries are not certifications.

No production credentials, subscriptions, DNS, deployment, live advertisements or subscriber messages are changed by this work.

## Provider and free-tier decisions

- Current reference verification includes read-only XAU, XAG and USD/INR requests plus review of the provider's explicit website-use guidance. This is not a blanket legal clearance for downstream resale or historical storage. Current reference feeds default on; explicit `false` configuration is respected. Local jeweller prices are not inferred from spot conversions.
- Gold API documentation advertises free current requests with no numerical current-call limit. Our implementation still caches and handles failures/429. History quota and downstream storage rights are separate; see [documentation](https://gold-api.com/docs), [pricing](https://gold-api.com/pricing) and [terms](https://gold-api.com/terms). Reviewed 2026-09-08.
- Frankfurter is a daily reference service, not real-time USD/INR. Review underlying data-source terms before public redistribution. [Documentation](https://frankfurter.dev/), reviewed 2026-09-08.
- Existing Resend code budgets 90/day and 2,900/month, below the advertised transactional free tier of 100/day and 3,000/month. Two editions to 45 recipients would consume the entire application daily budget before verification emails. This arithmetic is **not** a capacity promise: confirm whether the subscribed market newsletter qualifies for the account's email category, suppression/unsubscribe requirements and actual remaining allowance. [Resend pricing](https://resend.com/pricing), reviewed 2026-09-08. Delivery approval is outstanding; no test emails were sent.
- Existing Redis/QStash integrations were retained. Account-specific allowances, storage availability and schedule/message capacity were not read from live accounts. No new infrastructure was provisioned.
- **Vercel Hobby is restricted to personal, non-commercial use.** Do not assume it permits an ad-supported launch. The owner must choose an eligible hosting arrangement; no upgrade or hosting change was made. [Vercel Hobby documentation](https://vercel.com/docs/plans/hobby), reviewed 2026-09-08.

## Route inventory and URL migration

| URLs | Action | Index/ad policy |
| --- | --- | --- |
| /metals | Rebuilt overview | Canonical, indexable; 3 optional slots on substantial content. |
| /gold-price-today, /silver-price-today, /platinum-price-today, /copper-price-today | Retained; references and manual tools, no buy/wait signal | Useful detail content remains indexable; 2 optional slots. |
| /gold-price-last-10-days, /silver-price-last-10-days, /platinum-price-last-10-days, /copper-price-last-10-days | Retained; disabled history explained | Noindex and omitted from sitemap while there is no established feed; no ads. |
| /historical-prices | Retained; uses the same reference-history contract | Noindex while unconfigured; no fabricated city/purity history. |
| /metal-comparison | Retained; compatible-reference ratio only | Canonical; no lowest-price investment recommendation. |
| /metals/calculators | New directory | Canonical/indexable. |
| /calculators/gold, /silver, /platinum, /copper, /gold-jewellery, /weight-converter, /purity-converter, /investment-return (each under /calculators) | Existing URLs, consolidated engine | Canonical/indexable; optional after-content ad, never between form and result. |
| /calculators/making-charge-comparison, /budget-to-gold, /invoice-checker, /old-gold-exchange, /wedding-budget (each under /calculators) | New tools | Canonical/indexable; one optional after-content ad. |
| /metals/learn | New guide directory | Canonical/indexable. |
| /metals/learn/{hallmarking,price-basis,invoice,coins-bars-jewellery,exchange,drivers,wedding,methodology} | New original guides | Canonical/indexable; one optional footer slot. |
| /gold-price/[city] | Valid city URLs retained as manual quotation tools | Noindex, no sitemap entries and no ads until a new verified local adapter is integrated. The legacy rights flag alone does not activate these pages. |
| /calculator → /calculators/gold | Existing redirect retained | No duplicate indexed legacy calculator. |
| /investment-return-calculator → /calculators/investment-return | Existing redirect retained | Equivalent tool, not a homepage redirect. |
| /api/metals/current, /api/metals/history | Existing APIs repaired | Shared normalized service; invalid country/metal/range rejected. |
| /api/storage/calculator-presets and /[id] | Authentication enforced | Private no-store responses; no anonymous/shared fallback. |
| /ads.txt | New conditional route | 404 when unconfigured; only supplied publisher identity when enabled. |

Unknown city/guide/calculator slugs return 404. Query strings do not generate calculator input URLs. If a history/city feed becomes established and temporarily fails later, retain useful existing content and review the indexing policy instead of automatically applying permanent noindex to every outage.

## Main changed-file groups

- Data/logic: lib/metals-calculators.ts, lib/metals-data.ts, lib/metal-prices.ts, lib/live-prices.ts, lib/storage.ts.
- Metals UI: MetalQuoteCards, MetalsLandingPage, MetalDetailPage, MetalPageShell, MetalComparisonClient, MetalPriceChart, Last10DaysPage, MetalCalculator and MetalsCalculatorWorkspace under app/_components.
- Shared integration: FinancePlatform, WatchlistAlertsClient, CalculatorPage, ConsentPrompt, NotificationCenter, lib/notification-opt-in.ts and lib/market-digest.ts.
- Content/SEO: lib/metals-guides.ts, app/metals/learn, app/metals/calculators, app/calculators/[tool], retained metal/calculator/history/city pages, app/privacy/page.tsx, sitemap.ts, robots.ts and layout.tsx.
- Theme/ads: app/_components/metals-module.css, globals.css, AdSlot.tsx, lib/metals-ads.ts, app/ads.txt/route.ts, next.config.ts.
- Configuration/tests: .env.example, package.json, tests/metals.test.mjs, tests/market-updates.test.mjs, tests/metals-responsive.mjs and tests/metals-interactions.mjs.

## Data freshness and operations

- A current observation is fresh up to 20 minutes; after that it is explicitly stale. At more than 72 hours, or FX older than 7 days, numeric reference values are withheld. FX older than 4 days is stale. Missing observation times never become fetch times.
- Client refresh runs on visible-tab return/focus and every five minutes, with a 30-second UI cooldown. Aborted requests do not overwrite state. Rendered quote cards re-evaluate age every minute; detail weight breakdown and explicit reference-prefill use the same refreshed snapshot.
- Upstream requests use fixed origins, six-second timeouts, no immediate retry for 429, and at most one short-backoff retry for 5xx. The cache limits browser-triggered upstream work, but this is not a distributed-provider-load benchmark. Disabled history prevents an unbounded free-history fan-out.
- Diagnostics are the source, observedAt, fetchedAt, freshness, status, message and conversion provenance in /api/metals/current. Provider HTTP failures are sanitized; do not log tokens, account inputs or invoice details.
- Stable watchlist entries distinguish fine-metal references from the former retail market label. Existing saved retail entries are not silently relabelled or merged; review/delete obsolete items deliberately.

## Advertisement activation contract

Placement IDs are centralized in lib/metals-ads.ts:

- Overview: metals-after-overview, metals-mid-content, metals-before-footer-content.
- Detail: {metal}-after-overview and {metal}-before-footer.
- Calculator: {tool}-after-content.
- Guide: metals-guide-{slug}-footer.

Only map placements actually approved for the page. No slots appear when disabled/unconfigured. Configured slots reserve at least 280px (300px on large desktops); no-fill/error does not abruptly collapse visible space. Provider creative dimensions and configured-ad CLS still require a controlled staging test.

The reviewed CMP bridge must answer the gsp-ad-consent-request event with a gsp-ad-consent CustomEvent whose detail.granted is true only when the provider/region's requirements are met. It must also signal withdrawal. This is an integration contract, **not an implemented certified CMP**. Do not manufacture a publisher ID or automatically dispatch consent.

## Notification operation retained

- Asia/Kolkata editions at 09:15 and 15:30 on reviewed regular Indian trading days.
- UTC schedules: 45 3 * * 1-5 and 0 10 * * 1-5.
- Delivery/catch-up window: two hours after the edition time; expired editions are skipped.
- Weekends, reviewed holidays and unknown calendar years fail closed. The current calendar covers 2026; verify the next year's official calendar before enabling that year.
- Metals trade on a different schedule; the two app digests are not claims about a metal exchange opening or closing.
- Signed QStash endpoints, idempotent channel state, quotas and unsubscribe logic remain in place. Browser notifications do not constitute email consent. Do not run the schedule setup script or send subscriber tests without separate approval.

## Local test evidence

- npm run typecheck: passed after implementation fixes.
- npm run lint: passed, zero warnings.
- npm run build: passed, 251 generated routes. An initial sandbox spawn denial was resolved by an approved normal-permission build.
- npm run verify:release: passed (static configuration checks, not proof of deployed runtime readiness).
- npm run test:metals: 16 passed; pure calculators, data/provenance/freshness, API validation, disabled history, partial outage/429 and cached concurrent requests in an isolated cache harness.
- npm run test:market-updates: 28 passed; includes server-side preset A/B ownership/validation, watchlist isolation, consent, scheduler signatures, quota/idempotency/retries and unsubscribe with mocked infrastructure.
- npm audit --omit=dev --json: zero reported production dependency vulnerabilities on 2026-09-08. This is not a full security audit.
- Final production responsive pass: **360 checks, zero failures**; 36 routes at all 10 requested viewports, including /historical-prices, server-rendered headings, canonicals, noindex, sitemap, genuine 404s, redirects, desktop sidebar-scroll assertions and 44px phone navbar targets. No browser page errors were recorded. The generated report is the authoritative case-by-case result.
- Functional browser checks: manual mode, guest save/reload/load/delete, blocked local storage, unavailable provider, theme reload persistence, drawer focus trap/Escape/restoration and background inert.
- Artifacts: test-results/metals/report.json and 16 full-page/viewport PNGs (four device/page combinations, two themes). test-results/metals/interactions.json records three passing browser workflows: immediate watch/remove, account A/B cache invalidation with save/delete, and keyboard scrolling inside the metal table. Actual server ownership is independently covered by the unit/API suite above.
- Representative mobile, tablet, laptop and wide-desktop screenshots were visually inspected in both layout/theme variants. The laptop quote grid was adjusted from an unbalanced 3+1 arrangement to container-based 2/4 columns.
- Browser launch initially encountered missing cached Chromium and a permission-review rejection of customized startup arguments. The additional interaction test passed using the reviewer's accepted standard sandbox-enabled Edge launch. No browser extensions were installed and no user browser profile/security settings were changed.
- Viewports: 320x568, 375x667, 390x844, 430x932, 768x1024, 1024x768, 1280x720, 1366x768, 1440x900, 1920x1080.
- Actual browser zoom 80/90/100/110/125% was **not** verified. Headless viewport emulation is not browser zoom. Real mobile Safari/Android devices, deployed Web Vitals, configured filled/no-fill ads and live notification transport remain release checks.

To repeat UI tests, provide an installed Playwright module through PLAYWRIGHT_MODULE (or a normal local installation), TEST_BROWSER_CHANNEL=msedge where available, and TEST_ORIGIN pointing to a local production server. Scripts refuse non-local origins, isolate account fixtures, block external browser requests and never send subscriber messages. Test artifacts are ignored by Git.

Local preview at handoff: http://localhost:3005/metals (npm run start -- --port 3005). Earlier test servers started in this task were stopped. Existing unrelated servers were not stopped. This is a local production build, not a deployed production verification.

## Owner gates before public launch

1. Confirm production URL and eligible commercial hosting. Do not deploy .env.local or credentials in Git.
2. Complete provider display/storage/attribution review. Keep all feed flags false until approved; add historical budget/adapter work before claiming charts are available.
3. Review English financial content and the privacy/ad disclosures for the real operating setup; obtain competent review before publishing Hindi.
4. Verify real account Redis ownership, quotas, backup/restore and cross-session behaviour on a private preview.
5. Verify sender domain, email category eligibility, quotas, push HTTPS/VAPID scope and current exchange calendar. Only then authorize schedules and a small owner-address transport test.
6. Review AdSense/account/site approval and a suitable CMP; supply genuine public IDs, configure only justified slots and test consent withdrawal/creative dimensions/CSP/CLS before enabling ads.
7. Run actual zoom, keyboard/screen-reader, mobile device and deployed performance tests. Inspect canonicals/sitemap/noindex against the production origin. Review inherited modules separately; this work does not certify the entire financial platform.

## Rollout and rollback

Rollout: review this diff; make a normal backup/commit checkpoint; export existing account data through an approved provider mechanism and test restore in a separate environment; build a private preview with metals feeds/ads/schedules off; run the local checks and preview ownership checks; obtain the owner gates above; enable only approved features in small steps and observe errors/freshness/quota usage.

Environment documentation is in .env.example. NEXT_PUBLIC ad/origin values are public build-time configuration: rebuild after changes. Server-only secrets must remain outside public-prefixed variables. There is no automatic database migration or guest-to-account import.

Rollback: disable new feeds, advertising and delivery activation, rebuild/redeploy the previously verified version through the hosting provider's rollback process, and preserve account records and subscription ownership. Do not reset the working tree, delete Redis collections, or re-enable unlicensed legacy scraping as a shortcut. Local browser estimates remain versioned; old app versions may ignore the new schema. Restore account data only from the separately verified backup if an actual data incident requires it.
