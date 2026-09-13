import { metalsAdPlacements } from "../../lib/metals-ads";
import Link from "next/link";
import MetalPageShell from "./MetalPageShell";
import AdSlot from "./AdSlot";
import MetalHistoryPanel from "./MetalHistoryPanel";
import MetalNews from "./MetalNews";
import { metalsGuides } from "../../lib/metals-guides";
import { metalComparisons } from "../../lib/metals-editorial";
import { existingCityTools } from "../../lib/metals-routes";
import MetalQuoteCards from "./MetalQuoteCards";
import { getMetalPrice } from "../../lib/metal-prices";
import { getMetalConfig, metals, type MetalKey } from "../../lib/metals";
export default async function MetalDetailPage({ metalKey }: { metalKey: MetalKey }) {
  const config = getMetalConfig(metalKey); const price = await getMetalPrice(metalKey);
  return <MetalPageShell title={config.name + " price in India"} description="India · INR · IST. International references, purchase tools and sourced news. No local retail quotation is implied.">
    <nav className="metals-section-nav" aria-label="On this metal page">{["prices", "weights", "history", "locations", "buying", "news"].map(id => <a href={`#${id}`} key={id}>{id}</a>)}</nav>
    <div id="prices"><MetalQuoteCards initial={[price]} showTools /></div>
    <AdSlot id={metalsAdPlacements.detail(metalKey).after} module="metals" placement="after-hero" />
    <section className="metals-disclosure"><h2>Price basis matters</h2><p>{price.message}</p><p>{config.investorUse}</p><p>{config.riskNote}</p><p>No buy/wait recommendation is generated from a short price series.</p></section>
    <MetalHistoryPanel metal={metalKey} color={config.color} />
    <section id="locations" className="metals-disclosure"><h2>City and country comparisons</h2><p>Verified local retail feeds are not connected. An INR-converted international reference is not an India-wide dealer quotation. Compare written offers using the same purity, weight, observation date and itemised charges.</p>{metalKey === "gold" ? <details><summary>Existing city quotation tools — manual inputs only</summary><div className="metals-actions">{existingCityTools.map(city => <Link href={`/gold-price/${city.slug}`} key={city.slug}>{city.name}</Link>)}</div></details> : null}<Link href={`/calculators/${metalKey}`}>Estimate a purchase using your quotation →</Link></section>
    <section id="buying"><h2>Buying guides and comparisons</h2><div className="metals-card-grid">{Object.entries(metalsGuides).filter(([slug]) => slug.includes(metalKey) || ["price-basis", "invoice", "hallmarking"].includes(slug)).map(([slug, guide]) => <Link className="metals-guide-card" key={slug} href={`/metals/learn/${slug}`}><h3>{guide.title}</h3><p>{guide.summary}</p></Link>)}{Object.entries(metalComparisons).filter(([slug]) => slug.includes(metalKey)).map(([slug, guide]) => <Link className="metals-guide-card" key={slug} href={`/metals/compare/${slug}`}><h3>{guide.title}</h3><p>{guide.summary}</p></Link>)}</div><div className="metals-actions"><Link href="/metals/calculators">All purchase, purity and return calculators →</Link></div></section>
    <AdSlot id={`${metalKey}-between-guides-and-news`} module="metals" placement="mid-content" />
    <MetalNews metal={metalKey} />
    <section className="metals-disclosure"><h2>Before you buy {config.name.toLowerCase()}</h2><ul><li>Confirm the actual product, declared purity or grade and payable net weight.</li><li>Get a dated written quotation with the unit, charges, delivery costs and tax assumptions itemised.</li><li>Check the seller and supporting documentation independently; a reference price does not certify a product.</li><li>Ask about assessment, buyback deductions and settlement terms before paying. Never assume the reference value is an achievable resale offer.</li></ul></section>
    <section className="metals-card-grid"><Link className="metals-guide-card" href="/metals/learn/price-basis">Retail, spot and futures explained</Link><Link className="metals-guide-card" href="/metals/learn/invoice">Understand charges on your bill</Link><Link className="metals-guide-card" href={config.last10Route}>History and coverage</Link></section>
    <AdSlot id={metalsAdPlacements.detail(metalKey).footer} module="metals" placement="before-footer" />
    <section><h2>Explore other metals</h2><div className="metals-actions">{metals.filter(m => m.key !== metalKey).map(m => <Link key={m.key} href={m.route}>{m.name}</Link>)}<Link href="/metal-comparison">Compare metals</Link><Link href={"/news/" + metalKey}>Read sourced news</Link></div></section>
  </MetalPageShell>;
}
