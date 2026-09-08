import { metalsAdPlacements } from "../../lib/metals-ads";
import Link from "next/link";
import { getAllMetalPrices } from "../../lib/metal-prices";
import { metalTools } from "../../lib/metals-calculators";
import MetalQuoteCards from "./MetalQuoteCards";
import MetalCalculator from "./MetalCalculator";
import AdSlot from "./AdSlot";
export default async function MetalsLandingPage() {
  const payload = await getAllMetalPrices();
  return <div className="metals-module">
    <MetalQuoteCards initial={payload.metals} />
    <AdSlot id={metalsAdPlacements.overview.after} module="metals" placement="after-hero" />
    <MetalCalculator metal="gold" price={null} />
    <section><div className="metals-section-heading"><h2>Tools for your next purchase</h2><Link href="/metals/calculators">All metal calculators</Link></div><div className="metals-card-grid">{["gold-jewellery","silver","making-charge-comparison","budget-to-gold","invoice-checker","old-gold-exchange"].map(key => <Link className="metals-guide-card" key={key} href={"/calculators/" + key}><h3>{metalTools[key].title}</h3><p>{metalTools[key].description}</p><span>Open calculator →</span></Link>)}</div></section>
    <section className="metals-card-grid"><Link className="metals-guide-card" href="/metal-comparison"><h2>Compare references</h2><p>Compare matching units and view a gold–silver ratio only when the observations are compatible.</p></Link><Link className="metals-guide-card" href="/gold-price-last-10-days"><h2>Historical coverage</h2><p>See available coverage and source limitations. Missing history is never invented.</p></Link></section>
    <section><h2>Buy with more understanding</h2><div className="metals-card-grid">{[["hallmarking","Hallmarking and HUID"],["invoice","Understand your jewellery bill"],["price-basis","Why prices differ"],["wedding","Wedding and festival budgeting"]].map(([slug,title]) => <Link className="metals-guide-card" href={"/metals/learn/" + slug} key={slug}>{title} →</Link>)}</div></section>
    <AdSlot id={metalsAdPlacements.overview.middle} module="metals" placement="mid-content" />
    <section className="metals-disclosure"><h2>Market context, not predictions</h2><p>News can explain events around price changes, but it cannot guarantee the reason for a move or the next price. Read the original source and publication time.</p><Link href="/news/metals">Open metals news</Link></section>
    <section className="metals-disclosure"><h2>Two daily market editions</h2><p>The existing India market digest can include verified metal references. Delivery depends on your consent, configured services and source availability; metals do not follow equity trading hours.</p><Link href="/notifications">View market updates and delivery choices</Link></section>
    <AdSlot id={metalsAdPlacements.overview.footer} module="metals" placement="before-footer" />
    <footer className="metals-disclosure"><h2>Know the basis behind the number</h2><p>No enabled retail source means no local quotation. Reference conversions exclude taxes, making charges and retailer margins.</p><Link href="/metals/learn/methodology">Sources, methodology and corrections</Link></footer>
  </div>;
}
