import Link from "next/link";
import { ArrowRight, BarChart3, Bell, Calculator, ChartNoAxesCombined, Coins } from "lucide-react";
import AdSlot from "./AdSlot";
import Breadcrumbs from "./Breadcrumbs";
import { formatCurrency } from "../../lib/country-data";
import { getAllMetalPrices } from "../../lib/metal-prices";
import { metals } from "../../lib/metals";
import { AssetActionButtons } from "./WatchlistAlertsClient";

export default async function MetalsLandingPage() {
  const payload = await getAllMetalPrices("mumbai", "IN");

  return (
    <div className="metals-public-content">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Metals" }]} />
      <section className="metals-landing-intro">
        <div>
          <span>Live market overview</span>
          <h2>Precious and industrial metals at a glance</h2>
          <p>Prices are shown in Indian Rupees with the provider timestamp and source. Retail rates can differ by city, taxes and retailer.</p>
        </div>
        <Link className="gold-action" href="/metal-comparison">Compare metals <ArrowRight size={16} /></Link>
      </section>

      <div className="metals-overview-grid">
        {metals.map((config) => {
          const metal = payload.metals.find((item) => item.key === config.key);
          const digits = config.key === "copper" ? 0 : 2;
          return (
            <Link className="metals-overview-card" href={config.route} key={config.key} style={{ "--metal-color": config.color } as React.CSSProperties}>
              <span className="metals-overview-symbol">{config.symbol}</span>
              <div>
                <small>{config.name} price today</small>
                <h2>{typeof metal?.price === "number" ? formatCurrency(metal.price, "IN", digits) : "Unavailable"}</h2>
                <p>{config.unitLabel}</p>
              </div>
              <span className="metals-overview-link">Open details <ArrowRight size={15} /></span>
            </Link>
          );
        })}
      </div>
      <div className="metals-overview-actions" aria-label="Metal watchlist and alert actions">
        {metals.map((config) => <AssetActionButtons key={config.key} compact asset={{ assetKey: config.key, symbol: config.symbol, name: config.name, assetType: "metal", route: config.route, market: "India metals" }} />)}
      </div>

      <AdSlot id="metals-after-overview" />

      <section className="metals-feature-grid">
        <Link href="/historical-prices"><ChartNoAxesCombined size={22} /><b>Historical charts</b><span>Review verified daily movement and range performance.</span></Link>
        <Link href="/calculators/gold"><Calculator size={22} /><b>Metal calculators</b><span>Estimate value by weight, purity, premium and charges.</span></Link>
        <Link href="/alerts"><Bell size={22} /><b>Price alerts</b><span>Get notified when a metal reaches your target.</span></Link>
        <Link href="/metal-comparison"><BarChart3 size={22} /><b>Compare metals</b><span>Compare units, current rates and investor context.</span></Link>
      </section>

      <section className="metals-content-section">
        <div className="metal-section-heading">
          <div><span>Start with a market</span><h2>Choose a metal</h2></div>
          <Coins size={24} aria-hidden="true" />
        </div>
        <div className="metals-link-list">
          {metals.map((metal) => <Link href={metal.route} key={metal.key}><span>{metal.symbol}</span><b>{metal.name} price today</b><small>{metal.investorUse}</small><ArrowRight size={16} /></Link>)}
        </div>
      </section>

      <AdSlot id="metals-before-footer-content" />
    </div>
  );
}
