# GoldSilverPrices

GoldSilverPrices is an India-focused financial intelligence application built with Next.js 16, React and TypeScript. It brings together metals, Indian stocks, crypto, mutual funds, bonds, insurance, currencies, news, calculators, watchlists, alerts and portfolio tools.

## Local development

Requirements:

- Node.js 20 or newer
- npm
- Redis-compatible storage for accounts, watchlists, alerts and notifications

    npm install
    npm run dev

Open http://localhost:3000.

## Required environment variables

Copy .env.example to .env.local and configure values locally. Never commit .env.local.

- NEXT_PUBLIC_SITE_URL: public HTTPS site URL
- UPSTASH_REDIS_REST_URL: Upstash Redis REST URL
- UPSTASH_REDIS_REST_TOKEN: Upstash Redis REST token
- NEXT_PUBLIC_VAPID_PUBLIC_KEY: Web Push public key
- VAPID_PRIVATE_KEY: Web Push private key
- VAPID_EMAIL: VAPID contact email
- CRON_SECRET: secret used to protect scheduled jobs

Rotate any credentials that have been exposed and add replacement values in the deployment provider’s secret manager.

## Data-source policy

Market data is provider-backed and must display source, status and update time. The application must never replace an unavailable feed with invented current values. Static educational content is allowed; static prices, returns, rankings, yields, NAVs, premiums and portfolio totals are not.

Current free integrations include:

- Indian stock quotes: Yahoo Finance chart endpoint, delayed/unofficial and subject to provider terms
- Crypto market data: CoinGecko public API
- Reference FX: Frankfurter/ECB-style reference feed
- News: Google News RSS with source attribution
- Metal city rates: current upstream feed with explicit provider disclosure
- Mutual-fund NAV: AMFI NAVAll feed

Before commercial production, verify licensing, rate limits, attribution and redistribution rights. Bond fundamentals, insurance quotes and complete stock fundamentals require an approved provider or official source integration.

## Verification

    npm run typecheck
    npm run lint
    npm run build
    npm run verify:release

Health endpoint:

    /api/health

## Deployment

1. Configure all environment variables in the deployment secret manager.
2. Rotate old Redis, VAPID and cron credentials.
3. Run typecheck, lint, release verification and build.
4. Deploy with npm run build followed by npm run start, or use a compatible Next.js hosting provider.
5. Configure scheduled cron routes from vercel.json.
6. Monitor /api/health, provider errors, cron failures and notification delivery.
7. Submit the sitemap to Google Search Console and validate structured data.

## Release rules

- Do not claim data is live when it is delayed or reference-only.
- Do not publish unsupported insurance premiums, claim ratios or bond yields.
- Keep private pages out of search indexing.
- Keep user portfolio and alert data scoped to the current account/session.
- Show a clear financial-information disclaimer on every financial module.
