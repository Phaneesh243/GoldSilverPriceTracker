import type { CSSProperties } from "react";
import Link from "next/link";
import InfoPage from "./InfoPage";
import MetalNewsClient from "./MetalNewsClient";
import { PriceAlertClient } from "./MultiMetalCards";
import { formatCurrency } from "../../lib/country-data";
import { getMetalHistory, getMetalPrice } from "../../lib/metal-prices";
import { getMetalConfig, type MetalKey } from "../../lib/metals";

function formatMaybe(value: number | null | undefined, countryCode: string, digits = 2) {
  return typeof value === "number" ? formatCurrency(value, countryCode, digits) : "Unavailable";
}

function formatChange(value: number | null | undefined) {
  if (typeof value !== "number") return "Live quote";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}

function buyWaitSignal(values: number[]) {
  if (values.length < 3) {
    return {
      label: "Data building",
      text: "A reliable buy/wait signal needs enough recent history. Current price is shown without a recommendation.",
    };
  }

  const current = values.at(-1)!;
  const average = values.reduce((sum, value) => sum + value, 0) / values.length;
  const difference = ((current - average) / average) * 100;

  if (difference <= -0.7) {
    return { label: "Buying watch", text: `Current price is ${Math.abs(difference).toFixed(2)}% below recent average.` };
  }

  if (difference >= 0.7) {
    return { label: "Expensive zone", text: `Current price is ${difference.toFixed(2)}% above recent average.` };
  }

  return { label: "Neutral", text: "Current price is close to the recent average." };
}

export default async function MetalDetailPage({ metalKey }: { metalKey: MetalKey }) {
  const config = getMetalConfig(metalKey);
  const [price, history] = await Promise.all([getMetalPrice(metalKey), getMetalHistory(metalKey, "IN", "10d")]);
  const signal = buyWaitSignal(history.data.map((item) => item.close));

  return (
    <InfoPage
      pageClassName="metal-detail-page"
      title={`${config.name} Price Today`}
      description={`Live ${config.name.toLowerCase()} price, recent trend, calculator links, alerts and investor information for India.`}
    >
      <div className="metal-detail-hero">
        <div className="metal-price-panel" style={{ "--metal-color": config.color } as CSSProperties}>
          <div className="metal-panel-top">
            <span>{config.symbol}</span>
            <div>
              <small>{config.name} live price</small>
              <h2>{formatMaybe(price.price, price.currency || "IN", metalKey === "copper" ? 0 : 2)}</h2>
            </div>
          </div>
          <div className="metal-kpis">
            <b>
              <small>Unit</small>
              {config.unitLabel}
            </b>
            <b>
              <small>Change</small>
              {formatChange(price.changePercentage)}
            </b>
            <b>
              <small>Status</small>
              {price.status === "available" ? "Live" : "Unavailable"}
            </b>
          </div>
          <p>Source: {price.source}. Updated {price.updatedAt}.</p>
        </div>

        <div className="signal-card">
          <small>Buy / wait signal</small>
          <b>{signal.label}</b>
          <p>{signal.text}</p>
          <em>Informational only, not investment advice.</em>
        </div>
      </div>

      {price.variants?.length ? (
        <section className="metal-section-card">
          <div className="metal-section-heading">
            <span>Purity rates</span>
            <h2>Gold rates by purity</h2>
          </div>
          <div className="responsive-table premium-table">
            <table>
              <thead>
                <tr>
                  <th>Purity</th>
                  <th>Per gram</th>
                  <th>10 grams</th>
                  <th>Change</th>
                </tr>
              </thead>
              <tbody>
                {price.variants.map((variant) => (
                  <tr id={variant.label.toLowerCase()} key={variant.label}>
                    <td data-label="Purity">{variant.label}</td>
                    <td data-label="Per gram">{formatCurrency(variant.price, price.currency, 2)}</td>
                    <td data-label="10 grams">{formatCurrency(variant.price * 10, price.currency, 2)}</td>
                    <td data-label="Change">{variant.changePercentage.toFixed(2)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : (
        <section className="metal-section-card">
          <div className="metal-section-heading">
            <span>Unit values</span>
            <h2>{config.name} price breakdown</h2>
          </div>
          <div className="metal-unit-grid">
            <b>
              <small>1 unit</small>
              <strong>{formatMaybe(price.price, price.currency, metalKey === "copper" ? 0 : 2)}</strong>
            </b>
            <b>
              <small>10 units</small>
              <strong>{price.price ? formatCurrency(price.price * 10, price.currency, 2) : "Unavailable"}</strong>
            </b>
            <b>
              <small>100 units</small>
              <strong>{price.price ? formatCurrency(price.price * 100, price.currency, 2) : "Unavailable"}</strong>
            </b>
          </div>
        </section>
      )}

      <section className="metal-section-card">
        <div className="metal-section-heading">
          <span>Recent movement</span>
          <h2>Last 10 days</h2>
        </div>
        {history.status === "available" && history.data.length ? (
          <div className="responsive-table premium-table">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Close</th>
                  <th>Change</th>
                  <th>Change %</th>
                </tr>
              </thead>
              <tbody>
                {history.data.map((row) => (
                  <tr key={String(row.date)}>
                    <td data-label="Date">{String(row.date)}</td>
                    <td data-label="Close">{formatCurrency(row.close, price.currency, 2)}</td>
                    <td data-label="Change">{typeof row.change === "number" ? formatCurrency(row.change, price.currency, 2) : "-"}</td>
                    <td data-label="Change %">{typeof row.changePercentage === "number" ? `${row.changePercentage.toFixed(2)}%` : "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p>{history.message || "Historical prices are unavailable right now."}</p>
        )}
      </section>

      <section className="metal-notes-grid">
        <div>
          <span>Investor notes</span>
          <h2>What to know before tracking {config.name.toLowerCase()}</h2>
          <p>{config.investorUse}</p>
          <p>{config.riskNote}</p>
        </div>
        <div>
          <span>Useful actions</span>
          <h2>Plan your next step</h2>
          <div className="info-actions">
            <Link href="/investment-return-calculator">Calculate return</Link>
            <Link href="/metal-comparison">Compare metals</Link>
            <Link href={config.last10Route}>Open last 10 days</Link>
          </div>
        </div>
      </section>

      <PriceAlertClient />

      <section className="metal-section-card metal-news-card">
        <div className="metal-section-heading">
          <span>Market news</span>
          <h2>{config.name} news</h2>
        </div>
        <MetalNewsClient metal={metalKey} />
      </section>
    </InfoPage>
  );
}
