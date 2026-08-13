import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Coins, MapPin } from "lucide-react";
import SiteHeader from "../../_components/SiteHeader";
import { getLiveCityPrices } from "../../../lib/live-prices";
import { cityRates, formatINR } from "../../../lib/market-data";

type CityPageProps = {
  params: Promise<{ city: string }>;
};

export const revalidate = 30;

export function generateStaticParams() {
  return cityRates.map((city) => ({ city: city.slug }));
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { city } = await params;
  const selected = cityRates.find((item) => item.slug === city.toLowerCase());

  if (!selected) {
    return {};
  }

  return {
    title: `Gold Price in ${selected.name} Today`,
    description: `Today 24K, 22K, 18K gold price and silver rate in ${selected.name}. Check city-wise Goodreturns-sourced rates, comparison and local jewellery price notes.`,
    alternates: { canonical: `/gold-price/${selected.slug}` },
  };
}

function ChangeBadge({ amount, percent }: { amount: number; percent: number }) {
  const down = amount < 0;

  return (
    <span className={down ? "change down" : "change up"}>
      {down ? "down" : "up"} {formatINR(Math.abs(amount), amount % 1 === 0 ? 0 : 2)} ({Math.abs(percent).toFixed(2)}%)
    </span>
  );
}

export default async function Page({ params }: CityPageProps) {
  const { city } = await params;
  const selected = cityRates.find((item) => item.slug === city.toLowerCase());

  if (!selected) {
    notFound();
  }

  let live;

  try {
    live = await getLiveCityPrices(selected.slug);
  } catch {
    live = null;
  }

  const otherCities = cityRates.filter((item) => item.slug !== selected.slug).slice(0, 5);
  const gold24 = live?.gold.find((item) => item.purity === "24K");
  const gold22 = live?.gold.find((item) => item.purity === "22K");
  const gold18 = live?.gold.find((item) => item.purity === "18K");
  const schema = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: `Gold Price in ${selected.name} Today`,
    description: `Goodreturns-sourced gold and silver rates for ${selected.name}, ${selected.state}.`,
    url: `https://goldsilverprices.in/gold-price/${selected.slug}`,
  };

  return (
    <main className="app city-page">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <Suspense fallback={null}>
        <SiteHeader citySlug={selected.slug} />
      </Suspense>

      <section className="wrap hero">
        <div className="hero-copy">
          <span className="eyebrow">City-wise rate</span>
          <h1>Gold price in {selected.name} today.</h1>
          <p>
            Goodreturns-sourced 24K, 22K, 18K gold rates and silver price for {selected.name}, {selected.state}.
          </p>
          <div className="hero-meta">
            <span>
              <MapPin size={15} />
              {selected.name}
            </span>
            <span>Updated {live?.updatedAt ?? "Live feed unavailable"}</span>
            {live?.sourceUrl ? (
              <a href={live.sourceUrl} target="_blank" rel="noopener noreferrer">
                Source: {live.source}
              </a>
            ) : (
              <span>Please try again shortly. No estimated prices are shown while live data is unavailable.</span>
            )}
          </div>
        </div>
        <aside className="signal-panel">
          <span>{live ? "Live feed active" : "Feed unavailable"}</span>
          <strong>{selected.trend === "up" ? "Market activity is firm" : "Market activity is steady"}</strong>
          <p>{selected.localNote}</p>
        </aside>
      </section>

      {live && gold24 && gold22 && gold18 ? (
        <section className="wrap section">
          <div className="prices">
            <article className="price">
              <div className="price-title">
                <span className="gold">
                  <Coins size={17} />
                </span>
                <b>24K Gold</b>
              </div>
              <strong>{formatINR(gold24.pricePerGram, 2)}</strong>
              <div className="price-foot">
                <small>{formatINR(gold24.pricePerGram * 10, 2)} / 10g</small>
                <ChangeBadge amount={gold24.changeAmount} percent={gold24.changePercentage} />
              </div>
            </article>
            <article className="price">
              <div className="price-title">
                <span className="gold">
                  <Coins size={17} />
                </span>
                <b>22K Gold</b>
              </div>
              <strong>{formatINR(gold22.pricePerGram, 2)}</strong>
              <div className="price-foot">
                <small>{formatINR(gold22.pricePerGram * 8, 2)} / 8g</small>
                <ChangeBadge amount={gold22.changeAmount} percent={gold22.changePercentage} />
              </div>
            </article>
            <article className="price">
              <div className="price-title">
                <span className="gold">
                  <Coins size={17} />
                </span>
                <b>18K Gold</b>
              </div>
              <strong>{formatINR(gold18.pricePerGram, 2)}</strong>
              <div className="price-foot">
                <small>{formatINR(gold18.pricePerGram * 10, 2)} / 10g</small>
                <ChangeBadge amount={gold18.changeAmount} percent={gold18.changePercentage} />
              </div>
            </article>
            <article className="price">
              <div className="price-title">
                <span className="silver">
                  <Coins size={17} />
                </span>
                <b>Silver</b>
              </div>
              <strong>{formatINR(live.silver.pricePerGram, 2)}</strong>
              <div className="price-foot">
                <small>{formatINR(live.silver.pricePerGram * 1000, 2)} / kg</small>
                <ChangeBadge amount={live.silver.changeAmount} percent={live.silver.changePercentage} />
              </div>
            </article>
          </div>
        </section>
      ) : (
        <section className="wrap section">
          <div className="inline-error">Live rates are temporarily unavailable. Please refresh again shortly.</div>
        </section>
      )}

      <section className="wrap section">
        <div className="heading">
          <span className="eyebrow">Switch city</span>
          <h2>Compare with other cities</h2>
          <p>Choose another city to open its dedicated live-rate route.</p>
        </div>
        <div className="city-strip">
          {cityRates.map((item) => (
            <Link className={item.slug === selected.slug ? "selected" : ""} href={`/gold-price/${item.slug}`} key={item.slug}>
              {item.name}
            </Link>
          ))}
        </div>
        <div className="table">
          <div className="row head">
            <span>City</span>
            <span>State</span>
            <span>Rates</span>
            <span>Status</span>
          </div>
          {otherCities.map((item) => (
            <Link className="row link-row" href={`/gold-price/${item.slug}`} key={item.slug}>
              <b>{item.name}</b>
              <span>{item.state}</span>
              <span>View live rate</span>
              <span>{item.trend === "up" ? "Active" : "Steady"}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap section faq">
        <div className="heading">
          <span className="eyebrow">Disclaimer</span>
          <h2>Why jeweller prices may differ</h2>
        </div>
        <div className="faq-list">
          <details open>
            <summary>Are these rates final jewellery prices?</summary>
            <p className="city-note">
              No. Actual prices in {selected.name} may change with jeweller premium, making charge, wastage, GST, hallmark
              purity, buyback policy and intraday market movement.
            </p>
          </details>
          <details>
            <summary>Which purity should I compare?</summary>
            <p className="city-note">Use 24K for pure gold reference, 22K for most jewellery, and 18K for diamond or lightweight jewellery.</p>
          </details>
        </div>
      </section>

      <footer className="footer">
        <div className="wrap footer-inner">
          <Link className="logo" href="/">
            <span>Gold</span>SilverPrices
          </Link>
          <div className="footer-links">
            <Link href="/about">About</Link>
            <Link href="/disclaimer">Disclaimer</Link>
            <Link href="/privacy">Privacy</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
