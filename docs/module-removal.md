# Metals-focused application

Removed on 2026-09-10 at the user's request:
Stocks, Crypto, Mutual Funds, Bonds, Insurance and Currencies.

## Scope

- All six route trees, including details, research, comparison and tool pages.
- Dedicated APIs, providers, catalogs, components and CSS selectors.
- Related news-category routes and the currency-converter calculator.
- Sidebar/drawer entries, search results, sitemap entries, dashboard tiles and digest providers.
- Unused prototype screens and sample financial values in the shared shell.

Removed URLs return normal Next.js 404 responses, not misleading home-page redirects.
Metals guides (including physical gold versus gold ETFs) and generic SIP/CAGR/EMI/tax
arithmetic tools remain; they do not depend on the removed modules.

## Existing accounts

No Redis records, secrets, subscriptions or transaction history are deleted.
The watchlist picker only offers four supported metals. Server validation prevents
new retired assets. Existing retired watchlist records are labelled archived,
remain note-editable/deletable and have no research link.
Portfolio creation only permits metals; existing transaction history remains
readable/editable/deletable. This is a cost-basis ledger, not live valuation.

## Data and notifications

Current metal references, international TradingView charts, INR conversion,
news, calculators, authentication and notifications remain.
Frankfurter is still required by metal-prices.ts for INR conversion; it is not a
standalone currency module. No fake financial values were introduced.

Daily editions now contain gold, silver, platinum and copper only. Existing
09:15/15:30 IST schedules and reviewed business-day calendar are unchanged.
The snapshot cache uses a new metals-only namespace, so queued old snapshots
cannot send retired market content after deployment. Old notification history
is preserved. The calendar currently fails closed beyond its reviewed 2026 year.
No scheduler configuration, real messages or external database migrations were run.

## Release checks

Run typecheck, lint, build, test:metals, test:market-updates and
tests/module-removal.mjs against the production preview. The browser test uses
normal sandboxed Edge/Playwright with isolated account responses and no messages.
Historical documents describe earlier releases; this document supersedes their
six-module coverage claims. Deleted tracked source files can be recovered from Git.

### Verified results (2026-09-10)

- Production build, TypeScript, ESLint, release verification and diff checks passed.
- 23 metals tests and 30 isolated account/notification tests passed.
- 33 removed URLs returned 404; no removed module routes in the build or sitemap.
- 13 retained routes at 320×568, 390×844, 768×1024, 1024×768,
  1366×768 and 1920×1080: 78 checks, no document overflow or clipped navbar controls.
- Drawer Escape behavior, desktop sidebar reachability, four-metal picker,
  archived watchlist controls and metals search passed without real account writes.
- 20 shared light/dark theme and overflow checks passed.
- Dashboard mobile and laptop screenshots visually reviewed. Reports and images:
  test-results/module-removal and test-results/metals-shared-theme.
- This removal audit did not re-test actual browser zoom or external chart feeds.
