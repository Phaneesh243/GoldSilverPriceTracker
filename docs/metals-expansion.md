# India-first Metals expansion — 2026-09-09

## Audit and requirements before implementation

Working tree was clean at start. Existing current-price service supports XAU/XAG/XPT and HG with daily FX, provenance and freshness. HG units remain an explicitly disclosed convention, not provider-confirmed metadata. Existing 13 manual calculators, private presets, watchlists, consent-gated ads and mobile drawer are retained.

| Requirement | Initial finding | Work/decision |
| --- | --- | --- |
| India-first presentation | INR exists; gold primarily per gram | Add explicit India/INR/IST context, 10g gold default and remembered weight selection |
| Navigation/hover | Only title links; hover underline everywhere | Semantic stretched main link with separate controls; colour hover, focus retained |
| Module discovery | No unified metal search | Bounded grouped local combobox with keyboard and clear empty state |
| Detail pages | Sparse tools, no embedded news | Add anchors, weight/purity disclosure, calculator links, news, geography status and buying checklist |
| Education URLs | Eight useful guides | Add distinct purity/making/metal-specific guides; merge overlapping coin/buyback topics into existing routes |
| Comparison URLs | One generic reference comparison | Add three substantive editorial comparison routes with relevant live references/tools |
| History | No approved adapter/key/coverage | Preserve existing noindex history routes; lazy-load coverage interface, disable unavailable ranges; defer monthly/yearly analysis and calendar URLs until verified observations exist |
| City/country feeds | No verified local feed | Existing city tools remain noindex; selection explains unavailability, no copied prices or speculative country URLs |
| News | Existing Google RSS links; loose date checks | Reuse links, validate dates/relevance/URLs, no images/excerpts copied into metal pages; isolate provider failures |
| SEO | Existing canonicals; guide sitemap | Central route manifest drives discovery/indexable expansion; meaningful modification dates only |
| Hindi | Draft unreviewed | Deferred until human language/editorial review; no public translation routes |
| Testing | Existing unit/visual suites | Extend tests for weights, navigation, search, comparison pages, news validation and unavailable historical coverage |

## Route inventory and approved scope

The executable manifest lives in `lib/metals-routes.ts`, including URL, intent, type, existing equivalent, distinct value, required content, dependencies, canonical, parents, indexability and implementation status. All existing metal overview/detail, calculator, guide, news and legacy city/history routes are retained. New routes are limited to:

- `/metals/learn/22k-vs-24k-gold`: compare declared fine content versus buying costs.
- `/metals/learn/18k-vs-22k-gold`: distinguish fine content, net weight and actual quotations.
- `/metals/learn/gold-making-charges`: compare percentage, per-gram and fixed quotations.
- `/metals/learn/silver-purity`: distinguish fineness, gross weight and quoted product.
- `/metals/learn/platinum-purity`: distinguish declared fineness from a reference conversion.
- `/metals/learn/copper-spot-vs-scrap`: benchmark, industrial and scrap specifications.
- `/metals/compare/gold-vs-silver`: ownership/use and like-for-like reference comparison.
- `/metals/compare/gold-vs-platinum`: use, liquidity and basis differences.
- `/metals/compare/gold-etf-vs-physical-gold`: ownership, trading, storage and costs.

`gold-coins-vs-bars` and `gold-buyback-deductions` intentions are served by existing `coins-bars-jewellery` and `exchange` guides; no duplicate route needed. Geographic comparison and historical-period sections stay on detail pages until genuine data justifies additional canonical URLs. No search-results route or filter cross-product is generated.

## Provider review

- Gold API documentation/terms reviewed 2026-09-09: https://gold-api.com/llms.txt and https://gold-api.com/terms. Current references free; historical aggregation requires an API key, with free history limited to 10 requests/hour. Existing project has no approved historical adapter/shared quota budget. Historical storage rights and paired historical FX remain enabling requirements.
- HG response does not supply an explicit unit or contract month; standard pounds convention is disclosed. No claim of a confirmed executable exchange contract.
- HG convention evidence: https://www.cmegroup.com/education/lessons/copper-product-overview . Existing adapter endpoints are `https://api.gold-api.com/price/{XAU|XAG|XPT|HG}` and `https://api.frankfurter.dev/v1/latest?base=USD&symbols=INR`. FX is a dated daily reference, not live FX; the current endpoint is never reused as historical FX.
- India retail/city/country sources: none approved in repository. Legacy competitor HTML scraping remains off.
- BIS consumer protection reviewed: https://www.bis.gov.in/hallmarking-overview/consumer-protection/?lang=en . No new claims of certification, legal exemptions or tax rates.
- News: reuse existing Google News RSS headline links with attribution; no new copies of images, excerpts or full articles. Syndication/image rights need separate owner review before expansion.

## External boundaries

No paid tools, account provisioning, deployment, DNS, scheduler activation, subscriber messages or live ad activation. Existing secret values remain unchanged. A blocked data section is not a completed live-data feature.

## Implemented release scope

- Four shared India-first detail pages, gold 10g default, optional remembered weight, weight breakdown, source/basis disclosure and manual calculators.
- Semantic card-surface links preserve independent source, Details and Watch controls. Hover changes colour; keyboard focus remains visible.
- Local module search across bounded manifest entries, arrow/Enter/Escape navigation and useful unavailable/empty labels. No navbar search or public filter URLs introduced.
- Six new guides and three comparison pages with canonical metadata, crawlable links and dated sitemap entries. Existing overlapping guides retained.
- Deferred metal-specific headline loading, deduplication, relevance/date/HTTPS checks, ten-minute visibility-aware revalidation and cancellation. Failed refresh retains previously loaded headlines with a warning.
- Existing current-price refresh/freshness, 13 calculators, private presets, watchlists, two scheduled daily updates and consent-gated ads remain in place.

### Files

- `lib/metals-routes.ts`: executable route inventory and discovery entries. `status` describes independent page usefulness; a useful reference page can temporarily have no quote.
- `lib/metals-editorial.ts`, `lib/metals-guides.ts`: original guide/comparison content.
- `lib/metals-presentation.ts`, `lib/metals-search.ts`, `lib/metals-headlines.ts`: tested pure input/presentation/discovery validation.
- `app/_components/MetalDetailPage.tsx`, `MetalQuoteCards.tsx`, `MetalHistoryPanel.tsx`, `MetalNews.tsx`, `MetalsExplore.tsx`, `MetalPageShell.tsx`, `MetalsLandingPage.tsx`, `metals-module.css`: shared UI.
- `app/metals/compare/[slug]/page.tsx`, `app/metal-comparison/page.tsx`, `app/sitemap.ts`, `app/layout.tsx`: public pages, discovery links and accurate metadata.
- `app/api/metals/news/route.ts`, `lib/news.ts`: filtered news and cache-outage handling.
- `tests/metals.test.mjs`, `metals-discovery.mjs`, `metals-responsive.mjs`, `metals-visual-refresh.mjs`: regression coverage.

### Advertisement inventory

Existing overview: `metals-after-overview`, `metals-mid-content`, `metals-before-footer-content`.
Each detail: `{metal}-after-overview`, `{metal}-between-guides-and-news`, `{metal}-before-footer`.
Guides: `metals-guide-{slug}-footer`. New comparisons: `metals-compare-{slug}-footer`.
Existing calculator slots remain outside the input/calculation workflow. Unconfigured slots render nothing. Configured slots reserve responsive space; no-fill does not collapse already reserved space. No live publisher inventory was activated or tested.

### Environment and external dependencies

- Retain the existing `.env.local` only locally; configure corresponding server-side variables in the deployment environment. Never commit values.
- `NEXT_PUBLIC_SITE_URL`: real canonical production origin. Public variables are not secrets.
- Existing current-reference opt-out switches stay supported. Current references use the existing unauthenticated adapter and daily FX; no new paid key is required.
- Ads remain off until the owner supplies actual `NEXT_PUBLIC_ADSENSE_CLIENT`, `NEXT_PUBLIC_ADSENSE_SLOTS`, `NEXT_PUBLIC_ADS_ENABLED` and an approved consent integration. Set `NEXT_PUBLIC_DISABLE_EXTERNAL_ADS=true` for isolated previews where appropriate.
- Existing authenticated storage configuration remains required for production account persistence; browser account tests use isolated fixtures, while server ownership is tested separately.
- Historical features require an approved provider/key/quota budget, storage rights, dated observations and matching historical FX. No historical series, monthly/annual analysis, indexed-performance chart or historical export is claimed complete.
- Local city/country retail and scrap prices require permitted, independently sourced quotations with unit, purity, location and observation time. Existing city utility URLs remain noindex and excluded from sitemap.
- Hindi requires reviewed translations before publishing. Actual browser UI zoom and real ad fill/CLS still require owner acceptance checks; viewport resizing is not zoom verification.

## Deployment, measurement and rollback checklist

1. Review this diff, provider attribution/terms, canonical origin, and content before committing. Keep secrets and test artifacts excluded from Git.
2. Run unit tests, typecheck, lint, build and browser suites on the exact release revision. Review provider and empty-state screenshots, not only successful feeds.
3. Deploy only after owner approval. Smoke-test four reference APIs/pages, calculators, sign-in/account switching, canonical tags, robots and sitemap on the actual domain. Do not trigger subscriber dispatch as a smoke test.
4. In Google Search Console, the owner verifies the real domain using the supplied DNS record or supported verification method, then submits `/sitemap.xml`. Inspect new guide/comparison URLs; confirm noindex city/history utility pages stay out of the sitemap.
5. Track index coverage, Search impressions/clicks, unexpected indexed parameter URLs, Core Web Vitals and provider failures. No rankings or ad approval are guaranteed.
6. Roll back through the host's previous known-good deployment if navigation, account isolation or data validation regresses. These changes introduce no database migration; preserve existing account data, secrets and schedules. Recheck canonical/sitemap output after rollback.

## Verification evidence (2026-09-09)

- Typecheck, lint and production build passed (260 generated pages across the whole existing application).
- 22 Metals unit/API tests and 28 market-update/account tests passed. Synthetic observations remain test-only.
- `test-results/metals-discovery/report.json`: keyboard/empty search, Escape, hover, independent Details, card surface navigation, 10g default, persisted 8g choice and comparison sitemap checks passed.
- `test-results/metals-refresh/report.json`: actual upstream quotes for all four metals, twelve theme/viewport combinations, compact cards, 44px card controls, placeholder/loading states, refresh outage/recovery and reduced-motion checks passed.
- `test-results/metals/interactions.json` contains isolated watchlist/preset account-switch evidence. No real emails or push messages sent.
- `test-results/metals/report.json`: 450 route/viewport checks passed with zero failures. The 45 routes include four details, four legacy history utilities, thirteen calculators, fourteen guides, three new comparisons and existing hubs/utilities. Sizes: 320×568, 375×667, 390×844, 430×932, 768×1024, 1024×768, 1280×720, 1366×768, 1440×900 and 1920×1080.
- Drawer focus trap/Escape/restore/background inert, desktop sidebar scrolling, server H1, canonical/noindex, invalid route 404s, guest calculation save/load/delete and blocked-storage behavior passed.
- Reviewed screenshots: `test-results/metals-refresh/1366-dark-viewport.png`, `390-light-viewport.png`, `test-results/metals-discovery/comparison-laptop.png`, `gold-mobile-news.png`. Additional light/dark overview, calculator and guide screenshots are under `test-results/metals/`.
- Four live news APIs returned HTTP 200 and six filtered headlines each. Unsupported metal/country parameters returned 400; an unknown comparison route returned 404.
- After the full matrix, the only application changes were unique detail descriptions and the purchase checklist. The final production build and all 40 targeted detail checks (four metals × ten sizes) passed, including unique descriptions and visible checklists. Discovery/weight/navigation checks passed again against this final build. See `test-results/metals-discovery/report.json`.
- Final local production preview: `http://localhost:3007/metals`. Nothing was deployed externally. Browser tests used standard sandbox-enabled Edge, no extensions or security-disabling flags. Test fixtures prevented account writes or message delivery.
